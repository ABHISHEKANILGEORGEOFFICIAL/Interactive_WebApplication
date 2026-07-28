# Admin-only post delete
from rest_framework.permissions import IsAdminUser
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Post, Report
from .serializers import ReportSerializer

class AdminDeletePostView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, post_id):
        post = get_object_or_404(Post, id=post_id, is_removed=False)
        post.is_removed = True
        post.save()
        return Response({"deleted": True, "post_id": post_id}, status=200)
# ─────────────────────────────────────────────────────────────────────────────
# REPORT POST API
# ─────────────────────────────────────────────────────────────────────────────

class ReportPostView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, post_id):
        reason = request.data.get('reason', '').strip()
        message = request.data.get('message', '').strip()
        if not reason:
            return Response({'detail': 'Reason is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            post = Post.objects.get(pk=post_id)
        except Post.DoesNotExist:
            return Response({'detail': 'Post not found.'}, status=status.HTTP_404_NOT_FOUND)
        report = Report.objects.create(
            post=post,
            reported_by=request.user,
            reason=reason,
            message=message,
            status='pending',
        )

        # Auto-remove post if reported by 10 or more unique users
        unique_reporters = Report.objects.filter(post=post).values_list('reported_by', flat=True).distinct().count()
        if unique_reporters >= 10 and not post.is_removed:
            post.is_removed = True
            post.save()

        return Response({'detail': 'Report submitted for admin review.', 'report_id': report.id}, status=status.HTTP_201_CREATED)

# ─────────────────────────────────────────────────────────────────────────────
# ADMIN REPORT MANAGEMENT API
# ─────────────────────────────────────────────────────────────────────────────

class AdminReportListView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        status_filter = request.GET.get('status')
        qs = Report.objects.all().order_by('-created_at')
        if status_filter:
            qs = qs.filter(status=status_filter)
        serializer = ReportSerializer(qs, many=True)
        return Response(serializer.data)

class AdminReportUpdateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, report_id):
        report = Report.objects.filter(id=report_id).first()
        if not report:
            return Response({'detail': 'Report not found.'}, status=404)

        status_val = request.data.get('status')
        if status_val not in dict(Report.STATUS_CHOICES):
            return Response({'detail': 'Invalid status.'}, status=400)

        report.status = status_val
        report.save()
        return Response({'detail': 'Report status updated.'})

    def delete(self, request, report_id):
        report = Report.objects.filter(id=report_id).first()
        if not report:
            return Response({'detail': 'Report not found.'}, status=404)

        # DRF parses request.data on DELETE when using JSONParser.
        # The frontend sends { delete_post: true } in the request body.
        delete_post = request.data.get('delete_post', False)

        if delete_post and report.post:
            # Mark the post as removed (soft delete)
            post = report.post
            post.is_removed = True
            post.save()

        report.delete()

        if delete_post:
            return Response({'detail': 'Post removed and report deleted.'})
        return Response({'detail': 'Report deleted.'})

# Additional API Views for Follow/Followers
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

# API: List candidate members for a community (users followed by current user who are not already active members)
class APICandidateCommunityMembers(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        # Get all users the current user follows
        following = (
            Follow.objects
            .filter(follower=request.user)
            .values_list("following_id", flat=True)
        )
        # Get all active members of the community
        active_member_ids = set(
            CommunityMembership.objects.filter(community_id=pk, is_active=True).values_list("user_id", flat=True)
        )
        # Candidates are followed users who are not already active members
        candidates = User.objects.filter(id__in=following).exclude(id__in=active_member_ids)
        return Response(SimpleUserSerializer(candidates, many=True).data)
# ──────────────────────────────────────────────────────────────────────────

class APIUserFollowers(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        followers = (
            Follow.objects
            .filter(following=request.user, status='accepted')
            .select_related("follower")
        )
        users = [f.follower for f in followers]
        return Response(SimpleUserSerializer(users, many=True).data)


def _sync_follow_relationship(follower, target):
    existing_follow = Follow.objects.filter(
        follower=follower,
        following=target,
    ).first()
    reverse_follow = Follow.objects.filter(
        follower=target,
        following=follower,
    ).first()

    if existing_follow:
        if existing_follow.status == 'accepted':
            return {"status": "already_following", "user_id": target.id}

        if reverse_follow:
            existing_follow.status = 'accepted'
            existing_follow.save(update_fields=['status'])
            if reverse_follow.status != 'accepted':
                reverse_follow.status = 'accepted'
                reverse_follow.save(update_fields=['status'])
            return {"status": "accepted", "user_id": target.id}

        return {"status": "request_already_sent", "user_id": target.id}

    if reverse_follow:
        Follow.objects.create(
            follower=follower,
            following=target,
            status='accepted',
        )
        if reverse_follow.status != 'accepted':
            reverse_follow.status = 'accepted'
            reverse_follow.save(update_fields=['status'])
        return {"status": "accepted", "user_id": target.id}

    Follow.objects.create(
        follower=follower,
        following=target,
        status='pending',
    )
    return {"status": "request_sent", "user_id": target.id}

class APIFollowUser(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        if pk == request.user.id:
            return Response({"error": "You cannot follow yourself."}, status=400)
        # 🔍 Get target user
        target = User.objects.filter(id=pk).first()
        if not target:
            return Response({"error": "User not found."}, status=404)
        return Response(_sync_follow_relationship(request.user, target))

    def delete(self, request, pk):
        target = User.objects.filter(id=pk).first()
        if not target:
            return Response({"error": "User not found."}, status=404)
        # 🔥 Removes both:
        # - accepted follow (unfollow)
        # - pending request (cancel request)

        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response({"status": "removed", "user_id": pk})

class APIUnfollowUser(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        target = User.objects.filter(id=pk).first()
        if not target:
            return Response({"error": "User not found."}, status=404)
        Follow.objects.filter(follower=request.user, following=target).delete()
        return Response({"followed": False, "user_id": pk})
    

class APIToggleFollow(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get("user_id")

        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        if int(user_id) == request.user.id:
            return Response({"error": "You cannot follow yourself."}, status=400)

        target = User.objects.filter(id=user_id).first()
        if not target:
            return Response({"error": "User not found."}, status=404)

        # 🔥 CHECK EXISTING RELATION
        follow = Follow.objects.filter(
            follower=request.user,
            following=target
        ).first()

        # 🔥 IF EXISTS → REMOVE (unfollow or cancel request)
        if follow:
            follow.delete()
            return Response({"status": "removed", "user_id": user_id})

        # 🔥 ELSE → SEND REQUEST (pending)
        else:
            Follow.objects.create(
                follower=request.user,
                following=target,
                status="pending"
            )
            return Response({"status": "request_sent", "user_id": user_id})
        
class APIFollowRequests(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 🔥 FIX: requests YOU sent
        requests = (
            Follow.objects
            .filter(follower=request.user, status='pending')
            .select_related("following")
        )

        users = [f.following for f in requests]
        return Response(SimpleUserSerializer(users, many=True).data)
    

class APIReceivedRequests(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests = (
            Follow.objects
            .filter(following=request.user, status='pending')
            .select_related("follower")
        )

        users = [f.follower for f in requests]
        return Response(SimpleUserSerializer(users, many=True).data)

class APIAcceptFollow(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get("user_id")

        follow = Follow.objects.filter(
            follower_id=user_id,
            following=request.user,
            status='pending'
        ).first()

        if not follow:
            return Response({"error": "Request not found"}, status=404)

        follow.status = 'accepted'
        follow.save(update_fields=['status'])

        reverse_follow = Follow.objects.filter(
            follower=request.user,
            following_id=user_id,
        ).first()
        if reverse_follow and reverse_follow.status != 'accepted':
            reverse_follow.status = 'accepted'
            reverse_follow.save(update_fields=['status'])

        return Response({"status": "accepted", "user_id": user_id})


class APIRejectFollow(APIView):
    """Reject/decline an incoming follow request"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.data.get("user_id")

        if not user_id:
            return Response({"error": "user_id required"}, status=400)

        follow = Follow.objects.filter(
            follower_id=user_id,
            following=request.user,
            status='pending'
        ).first()

        if not follow:
            return Response({"error": "Request not found"}, status=404)

        follow.delete()
        return Response({"status": "rejected", "user_id": user_id})


class APIFollowStatus(APIView):
    """Check follow status between two users"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_id = request.data.get("user_id")

        if not target_id:
            return Response({"error": "user_id required"}, status=400)

        # Check if current user follows target
        follow = Follow.objects.filter(
            follower=request.user,
            following_id=target_id
        ).first()

        if not follow:
            return Response({
                "is_following": False,
                "status": None,
                "user_id": target_id
            })

        return Response({
            "is_following": follow.status == 'accepted',
            "status": follow.status,
            "user_id": target_id
        })


# ─────────────────────────────────────────────────────────────────────────────
# Delete Post API View
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

class DeletePost(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, post_id):
        post = get_object_or_404(Post, id=post_id, is_removed=False)  # ← add is_removed=False
        
        if post.author != request.user:
            if post.community:
                membership = CommunityMembership.objects.filter(
                    user=request.user, 
                    community=post.community, 
                    is_active=True
                ).first()
                if not membership or membership.role not in ("creator", "collaborator"):
                    return Response({"error": "Permission denied."}, status=403)
            else:
                return Response({"error": "Permission denied."}, status=403)
        
        post.is_removed = True
        post.save()
        return Response({"deleted": True, "post_id": post_id}, status=200)
    
# API: Add Members to Community
# POST /api/communities/<pk>/add-members/
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class APICommunityAddMembers(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            community = Community.objects.get(id=pk)
        except Community.DoesNotExist:
            return Response({"error": "Community not found."}, status=status.HTTP_404_NOT_FOUND)

        membership = _get_membership(request.user, community)
        if not (_can_manage_community(request.user, community) or (membership and membership.can_invite)):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        members = request.data.get("members", [])
        if not isinstance(members, list):
            return Response({"error": "'members' must be a list of user IDs."}, status=status.HTTP_400_BAD_REQUEST)

        added = []
        for uid in members:
            if not isinstance(uid, int):
                try:
                    uid = int(uid)
                except Exception as e:
                    continue
            try:
                obj, created = CommunityMembership.objects.get_or_create(
                    community=community,
                    user_id=uid,
                    defaults={"role": "member", "can_post": True, "is_active": True},
                )
                if created:
                    added.append(uid)
                else:
                    if not obj.is_active:
                        obj.is_active = True
                        obj.save()
                        added.append(uid)
            except Exception as e:
                pass
        return Response({"added": added}, status=status.HTTP_200_OK)
# =============================================================================
# communityapp/views.py
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# Imports
# ─────────────────────────────────────────────────────────────────────────────
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from Guestapp.models import ClassTeacher, Student
from .models import (
    Community,
    CommunityMembership,
    ensure_creator_membership,
    CommunityPermissionRequest,
    CommunityInvite,
    CommunityJoinRequest,
    Announcement,
    Post,
    Reply,
    Report,
    Follow,
)
from .serializers import (
    SimpleUserSerializer,
    FollowSerializer,
    CommunitySerializer,
    CommunityPermissionRequestSerializer,
    CommunityJoinRequestSerializer,
    AnnouncementSerializer,
    MembershipSerializer,
    PostSerializer,
    ReplySerializer,
    ReportSerializer,
)


# ─────────────────────────────────────────────────────────────────────────────
# USER / FOLLOW / PROFILE API VIEWS
# GET  /api/users/      → list all users except self
# GET  /api/following/  → who the current user follows
# POST /api/following/  → follow or unfollow { user_id, action }
# GET  /api/profile/    → current user's own profile
# ─────────────────────────────────────────────────────────────────────────────

class UserListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        users = User.objects.exclude(id=request.user.id).order_by("first_name")
        return Response(SimpleUserSerializer(users, many=True).data)

class FollowingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        following = (
            Follow.objects
            .filter(follower=request.user, status='accepted')
            .select_related("following")
        )
        users = [f.following for f in following]
        return Response(SimpleUserSerializer(users, many=True).data)

    def post(self, request):
        action  = request.data.get("action")
        user_id = request.data.get("user_id")

        if not user_id or action not in ("follow", "unfollow"):
            return Response(
                {"error": "user_id and action ('follow'|'unfollow') are required."},
                status=400,
            )

        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=404)

        if target == request.user:
            return Response({"error": "You cannot follow yourself."}, status=400)

        # 🔥 FOLLOW (send request)
        if action == "follow":
            follow, created = Follow.objects.get_or_create(
                follower=request.user,
                following=target,
                defaults={"status": "pending"}
            )

            if not created:
                if follow.status == "accepted":
                    return Response({"message": "Already following"})
                return Response({"message": "Request already sent"})

            return Response({"status": "request_sent", "user_id": user_id})

        # 🔥 UNFOLLOW / CANCEL
        else:
            Follow.objects.filter(
                follower=request.user,
                following=target
            ).delete()

            return Response({"status": "removed", "user_id": user_id})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(SimpleUserSerializer(request.user).data)


# ─────────────────────────────────────────────────────────────────────────────
# FEED API VIEW
# ─────────────────────────────────────────────────────────────────────────────

class FeedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        following_ids = Follow.objects.filter(follower=user).values_list('following_id', flat=True)
        posts = Post.objects.filter(
            Q(author__id__in=list(following_ids)) | Q(author=user),
            is_removed=False
        ).select_related(
            'author__classteacher',
            'author__student',
        ).order_by('-created_at')
        return Response(PostSerializer(posts, many=True, context={'request': request}).data)


# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

EMOJI_CHOICES = [
    '🏫', '📚', '🎓', '🔬', '🎨', '🏀', '🎸', '💡', '🌍', '🤝',
    '📝', '🧪', '🌱', '🎭', '🏆', '💻', '🎯', '📖', '🔭', '🎵',
    '🧠', '🌟', '🚀', '🦁', '🎲', '🏋️', '🎤', '🌈', '⚡', '🦋',
]


def _get_membership(user, community):
    if user.is_authenticated and community.created_by_id == user.id:
        return ensure_creator_membership(community)

    try:
        return CommunityMembership.objects.get(user=user, community=community, is_active=True)
    except CommunityMembership.DoesNotExist:
        return None


def _can_manage_community(user, community):
    if not user.is_authenticated:
        return False

    membership = _get_membership(user, community)
    return community.created_by_id == user.id or (membership and membership.role == 'creator')


def _can_create(user):
    if not user.is_authenticated:
        return False
    if ClassTeacher.objects.filter(user=user).exists():
        return True
    try:
        from Teacherapp.models import Position
        return Position.objects.filter(
            student=user.student, can_create_community=True, is_active=True
        ).exists()
    except Exception:
        return False


# ─────────────────────────────────────────────────────────────────────────────
# TEMPLATE VIEWS
# ─────────────────────────────────────────────────────────────────────────────

@login_required
def community_list(request):
    query = request.GET.get('q', '').strip()
    communities = Community.objects.all().order_by('-created_at')
    if query:
        communities = communities.filter(
            Q(name__icontains=query) | Q(description__icontains=query)
        )

    my_memberships = CommunityMembership.objects.filter(
        user=request.user, is_active=True
    ).select_related('community')
    my_community_ids = set(m.community_id for m in my_memberships)
    role_map = {m.community_id: m.role for m in my_memberships}

    for c in communities:
        c.current_user_role = role_map.get(c.id)

    can_create = _can_create(request.user)
    pending_request = None
    if not can_create:
        try:
            pending_request = CommunityPermissionRequest.objects.filter(
                student=request.user.student, status='pending'
            ).first()
        except Exception:
            pass

    all_users = User.objects.exclude(id=request.user.id).order_by('?')[:8]

    return render(request, 'communityapp/community.html', {
        'communities':      communities,
        'my_community_ids': my_community_ids,
        'can_create':       can_create,
        'pending_request':  pending_request,
        'query':            query,
        'all_users':        all_users,
    })


@login_required
def community_create(request):
    if not _can_create(request.user):
        return redirect('community')

    step  = request.GET.get('step', '1')
    draft = request.session.get('community_draft', {})

    collaborator_ids = [int(x) for x in draft.get('collaborator_ids', [])]
    member_ids       = [int(x) for x in draft.get('member_ids', [])]
    all_users        = User.objects.exclude(id=request.user.id)

    if request.method == 'POST':
        action = request.POST.get('action')

        if action == 'save_step1':
            draft['name']        = request.POST.get('name', '').strip()
            draft['description'] = request.POST.get('description', '').strip()
            request.session['community_draft'] = draft
            return redirect('/community/create/?step=2')

        elif action == 'save_step2':
            draft['image_emoji'] = request.POST.get('image_emoji', '🏫')
            request.session['community_draft'] = draft
            return redirect('/community/create/?step=3')

        elif action == 'save_step3':
            collab_ids = [int(x) for x in request.POST.getlist('collaborators')]
            draft['collaborator_ids'] = collab_ids
            request.session['community_draft'] = draft
            return redirect('/community/create/?step=4')

        elif action == 'create':
            member_ids = [int(x) for x in request.POST.getlist('members')]
            community = Community.objects.create(
                name=draft.get('name', 'Unnamed'),
                description=draft.get('description', ''),
                created_by=request.user,
            )
            image_file = request.FILES.get('community_image')
            if image_file:
                community.image = image_file
                community.save()

            CommunityMembership.objects.create(
                community=community, user=request.user,
                role='creator', can_post=True, can_invite=True,
                can_pin_posts=True, can_create_announcements=True,
            )
            for uid in draft.get('collaborator_ids', []):
                try:
                    CommunityMembership.objects.get_or_create(
                        community=community, user_id=uid,
                        defaults={'role': 'collaborator', 'can_post': True, 'can_invite': True},
                    )
                except Exception:
                    pass

            collab_set = set(draft.get('collaborator_ids', []))
            for uid in member_ids:
                if uid not in collab_set:
                    try:
                        CommunityMembership.objects.get_or_create(
                            community=community, user_id=uid,
                            defaults={'role': 'member', 'can_post': True},
                        )
                    except Exception:
                        pass

            request.session.pop('community_draft', None)
            return redirect('community_detail', pk=community.id)

    return render(request, 'communityapp/community_create.html', {
        'step':             step,
        'draft':            draft,
        'all_users':        all_users,
        'collaborator_ids': collaborator_ids,
        'member_ids':       member_ids,
        'EMOJI_CHOICES':    EMOJI_CHOICES,
    })


@login_required
def community_detail(request, pk):
    community  = get_object_or_404(Community, id=pk)
    membership = _get_membership(request.user, community)

    is_member = membership is not None
    user_role = membership.role if membership else None

    can_post                 = membership.can_post if membership else False
    can_invite               = membership.can_invite if membership else False
    can_pin_posts            = membership.can_pin_posts if membership else False
    can_create_announcements = membership.can_create_announcements if membership else False

    can_edit               = user_role == 'creator'
    can_add_members        = user_role == 'creator' or (membership and membership.can_invite)
    can_manage_permissions = user_role == 'creator'

    community_posts = []
    if is_member:
        community_posts = (
            Post.objects.filter(community=community, is_removed=False)
            .order_by('-is_pinned', '-created_at')
            .select_related('author', 'author__classteacher', 'author__student')
            .prefetch_related('likes', 'replies')
        )
        for post in community_posts:
            post.like_count  = post.likes.count()
            post.reply_count = post.replies.count()

    memberships = (
        CommunityMembership.objects.filter(community=community, is_active=True)
        .select_related('user')
        .order_by('role')
    )

    community.post_count = Post.objects.filter(community=community, is_removed=False).count()

    return render(request, 'communityapp/community_detail.html', {
        'community':                community,
        'is_member':                is_member,
        'user_role':                user_role,
        'can_post':                 can_post,
        'can_invite':               can_invite,
        'can_pin_posts':            can_pin_posts,
        'can_create_announcements': can_create_announcements,
        'can_edit':                 can_edit,
        'can_add_members':          can_add_members,
        'can_manage_permissions':   can_manage_permissions,
        'community_posts':          community_posts,
        'memberships':              memberships,
    })


@login_required
def community_edit(request, pk):
    community  = get_object_or_404(Community, id=pk)

    if not _can_manage_community(request.user, community):
        return redirect('community_detail', pk=pk)

    collaborator_ids = list(
        CommunityMembership.objects.filter(
            community=community, role='collaborator', is_active=True
        ).values_list('user_id', flat=True)
    )
    all_users = User.objects.exclude(id=request.user.id)

    if request.method == 'POST':
        community.name        = request.POST.get('name', community.name).strip()
        community.description = request.POST.get('description', community.description).strip()
        community.is_private  = request.POST.get('is_private') in ('on', 'true', 'True', '1', 1, True)
        image_file = request.FILES.get('community_image')
        if image_file:
            community.image = image_file
        community.save()

        new_collab_ids = [int(x) for x in request.POST.getlist('collaborators')]
        CommunityMembership.objects.filter(
            community=community, role='collaborator'
        ).exclude(user_id__in=new_collab_ids).update(is_active=False)

        for uid in new_collab_ids:
            obj, _ = CommunityMembership.objects.get_or_create(
                community=community, user_id=uid,
                defaults={'role': 'collaborator', 'can_post': True, 'can_invite': True},
            )
            obj.role = 'collaborator'
            obj.is_active = True
            obj.save()

        return redirect('community_detail', pk=pk)

    return render(request, 'communityapp/community_edit.html', {
        'community':              community,
        'all_users':              all_users,
        'collaborator_ids':       collaborator_ids,
        'can_manage_permissions': True,
        'EMOJI_CHOICES':          EMOJI_CHOICES,
    })


@login_required
def community_delete(request, pk):
    community = get_object_or_404(Community, id=pk)

    if not _can_manage_community(request.user, community):
        return redirect('community_detail', pk=pk)

    if request.method == 'POST':
        community.delete()
        return redirect('community')

    return redirect('community_detail', pk=pk)


@login_required
def community_manage_permissions(request, pk):
    try:
        community  = get_object_or_404(Community, id=pk)
        membership = _get_membership(request.user, community)

        if not membership or membership.role != 'creator':
            return redirect('community_detail', pk=pk)

        all_memberships = CommunityMembership.objects.filter(
            community=community, is_active=True
        ).select_related('user')


        PERM_MAP = {
            'post':      'can_post',
            'invite':    'can_invite',
            'pin_posts': 'can_pin_posts',
            'announce':  'can_create_announcements',
        }
        perm_keys = [
            ('post',      'Can Post'),
            ('invite',    'Can Invite Members'),
            ('pin_posts', 'Can Pin Posts'),
            ('announce',  'Can Create Announcements'),
        ]

        if request.method == 'POST':
            for m in all_memberships:
                for key, field in PERM_MAP.items():
                    setattr(m, field, f'perm_{m.id}_{key}' in request.POST)
                m.save()
            return redirect('community_detail', pk=pk)

        return render(request, 'communityapp/community_permissions.html', {
            'community':                community,
            'all_memberships':          all_memberships,
            'perm_keys':                perm_keys,
        })
    except Exception as e:
        raise
# New page: View all members (creator, collaborators, members)
from django.contrib.auth.decorators import login_required

@login_required
def community_all_members(request, pk):
    community = get_object_or_404(Community, id=pk)
    memberships = CommunityMembership.objects.filter(community=community, is_active=True).select_related('user')
    return render(request, 'communityapp/community_all_members.html', {
        'community': community,
        'memberships': memberships,
    })


@login_required
def community_join(request, pk):
    community = get_object_or_404(Community, id=pk)
    if _get_membership(request.user, community):
        return redirect('community_detail', pk=pk)

    if community.is_private:
        CommunityJoinRequest.objects.get_or_create(
            community=community, user=request.user,
            defaults={'status': 'pending'},
        )
    else:
        CommunityMembership.objects.get_or_create(
            community=community, user=request.user,
            defaults={'role': 'member', 'can_post': True},
        )
    return redirect('community_detail', pk=pk)


@login_required
def community_leave(request, pk):
    community  = get_object_or_404(Community, id=pk)
    membership = _get_membership(request.user, community)
    if membership and membership.role != 'creator':
        membership.is_active = False
        membership.save()
    return redirect('community')


@login_required
def community_remove_member(request, pk, user_id):
    community     = get_object_or_404(Community, id=pk)
    if not _can_manage_community(request.user, community):
        return redirect('community_detail', pk=pk)

    target = get_object_or_404(CommunityMembership, community=community, user_id=user_id)
    if target.role != 'creator':
        target.is_active = False
        target.save()
    return redirect('community_detail', pk=pk)


@login_required
def community_add_members(request, pk):
    community  = get_object_or_404(Community, id=pk)
    membership = _get_membership(request.user, community)
    if not (_can_manage_community(request.user, community) or (membership and membership.can_invite)):
        return redirect('community_detail', pk=pk)

    existing_ids = set(
        CommunityMembership.objects.filter(community=community, is_active=True)
        .values_list('user_id', flat=True)
    )
    candidates = User.objects.exclude(id__in=existing_ids)

    if request.method == 'POST':
        for uid in request.POST.getlist('members'):
            CommunityMembership.objects.get_or_create(
                community=community, user_id=int(uid),
                defaults={'role': 'member', 'can_post': True},
            )
        return redirect('community_detail', pk=pk)

    return render(request, 'communityapp/community_add_members.html', {
        'community':  community,
        'candidates': candidates,
    })


# ─────────────────────────────────────────────────────────────────────────────
# STUDENT PERMISSION REQUEST
# ─────────────────────────────────────────────────────────────────────────────

@login_required
def student_request_permission(request):
    try:
        student = request.user.student
    except Exception:
        return redirect('community')

    teachers = ClassTeacher.objects.all()

    if request.method == 'POST':
        teacher_id     = request.POST.get('teacher')
        community_name = request.POST.get('community_name', '').strip()
        description    = request.POST.get('description', '').strip()
        try:
            teacher = ClassTeacher.objects.get(id=teacher_id)
        except ClassTeacher.DoesNotExist:
            return redirect('community')

        CommunityPermissionRequest.objects.create(
            student=student, teacher=teacher,
            community_name=community_name, description=description,
        )
        return redirect('student_my_requests')

    return render(request, 'communityapp/student_request_permission.html', {
        'teachers': teachers,
    })


@login_required
def student_my_requests(request):
    try:
        student = request.user.student
    except Exception:
        return redirect('community')

    return render(request, 'communityapp/student_my_requests.html', {
        'requests': CommunityPermissionRequest.objects.filter(
            student=student
        ).order_by('-requested_at'),
    })


@login_required
def teacher_permission_requests(request):
    try:
        teacher = ClassTeacher.objects.get(user=request.user)
    except ClassTeacher.DoesNotExist:
        return redirect('community')

    return render(request, 'communityapp/teacher_permission_requests.html', {
        'pending':  CommunityPermissionRequest.objects.filter(teacher=teacher, status='pending').order_by('-requested_at'),
        'reviewed': CommunityPermissionRequest.objects.filter(teacher=teacher).exclude(status='pending').order_by('-requested_at'),
    })


@login_required
def teacher_handle_request(request, req_id):
    try:
        teacher = ClassTeacher.objects.get(user=request.user)
    except ClassTeacher.DoesNotExist:
        return redirect('community')

    req    = get_object_or_404(CommunityPermissionRequest, id=req_id, teacher=teacher)
    action = request.POST.get('action')
    note   = request.POST.get('teacher_note', '')

    if action == 'approve' and req.status == 'pending':
        req.status       = 'approved'
        req.teacher_note = note
        req.reviewed_at  = timezone.now()
        req.save()

        community = Community.objects.create(
            name=req.community_name,
            description=req.description,
            created_by=req.student.user,
            permission_request=req,
        )
        CommunityMembership.objects.create(
            community=community, user=req.student.user, role='creator',
            can_post=True, can_invite=True, can_pin_posts=True, can_create_announcements=True,
        )
        CommunityMembership.objects.create(
            community=community, user=request.user,
            role='collaborator', can_post=True, can_invite=True,
        )

    elif action == 'reject' and req.status == 'pending':
        req.status       = 'rejected'
        req.teacher_note = note
        req.reviewed_at  = timezone.now()
        req.save()

    return redirect('teacher_permission_requests')


# ─────────────────────────────────────────────────────────────────────────────
# DRF API VIEWS
# ─────────────────────────────────────────────────────────────────────────────

class TeacherCreateCommunity(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not ClassTeacher.objects.filter(user=request.user).exists():
            return Response({"error": "Only teachers allowed."}, status=403)
        ctx = {'request': request}
        serializer = CommunitySerializer(data=request.data, context=ctx)
        if serializer.is_valid():
            community = serializer.save(created_by=request.user)
            CommunityMembership.objects.get_or_create(
                community=community, user=request.user,
                defaults={
                    'role': 'creator',
                    'can_post': True, 'can_invite': True,
                    'can_pin_posts': True, 'can_create_announcements': True,
                }
            )
            return Response(CommunitySerializer(community, context=ctx).data, status=201)
        return Response(serializer.errors, status=400)


class TeacherViewRequests(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        teacher = get_object_or_404(ClassTeacher, user=request.user)
        qs = CommunityPermissionRequest.objects.filter(teacher=teacher)
        return Response(CommunityPermissionRequestSerializer(qs, many=True).data)


class TeacherHandleRequest(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        teacher = get_object_or_404(ClassTeacher, user=request.user)
        req     = get_object_or_404(CommunityPermissionRequest, id=pk, teacher=teacher)
        action  = request.data.get('action')
        note    = request.data.get('teacher_note', '')

        if action == 'approve':
            req.status       = 'approved'
            req.teacher_note = note
            req.reviewed_at  = timezone.now()
            req.save()
            community = Community.objects.create(
                name=req.community_name, description=req.description,
                created_by=req.student.user, permission_request=req,
            )
            CommunityMembership.objects.create(
                community=community,
                user=req.student.user,
                role='creator',
                can_post=True,
                can_invite=True,
                can_pin_posts=True,
                can_create_announcements=True,
            )
            CommunityMembership.objects.create(
                community=community, user=request.user,
                role='collaborator', can_post=True, can_invite=True,
            )
            return Response({"message": "Approved."}, status=201)

        elif action == 'reject':
            req.status       = 'rejected'
            req.teacher_note = note
            req.reviewed_at  = timezone.now()
            req.save()
            return Response({"message": "Rejected."})

        return Response({"error": "Invalid action."}, status=400)


class CreateAnnouncement(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, community_id):
        community  = get_object_or_404(Community, id=community_id)
        membership = get_object_or_404(
            CommunityMembership, user=request.user, community=community, is_active=True
        )
        if not membership.can_create_announcements:
            return Response({"error": "Permission denied."}, status=403)
        serializer = AnnouncementSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(community=community, created_by=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class CreateInvite(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, community_id):
        community  = get_object_or_404(Community, id=community_id)
        membership = get_object_or_404(
            CommunityMembership, user=request.user, community=community, is_active=True
        )
        if not membership.can_invite:
            return Response({"error": "Permission denied."}, status=403)
        invite = CommunityInvite.objects.create(community=community, invited_by=request.user)
        return Response({"invite_code": str(invite.code)}, status=201)


class PinPost(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id)
        if post.community is None:
            return Response({"error": "Cannot pin a standalone post."}, status=400)
        membership = get_object_or_404(
            CommunityMembership, user=request.user, community=post.community, is_active=True
        )
        if not membership.can_pin_posts:
            return Response({"error": "Permission denied."}, status=403)
        post.is_pinned = not post.is_pinned
        post.save()
        return Response({"is_pinned": post.is_pinned})


def _post_membership_or_none(user, post):
    if post.community is None:
        return None
    return _get_membership(user, post.community)


def _can_interact_with_post(user, post):
    if post.is_removed:
        return False
    if post.community is None:
        return True
    return _post_membership_or_none(user, post) is not None


class TogglePostLike(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id, is_removed=False)

        if not _can_interact_with_post(request.user, post):
            return Response({"error": "Permission denied."}, status=403)

        # Use the explicit through model so toggling is race-safe and
        # authoritative at DB level (unique post+user like row).
        from django.db import IntegrityError

        through_model = Post.likes.through
        removed, _ = through_model.objects.filter(
            post_id=post.id,
            user_id=request.user.id,
        ).delete()

        if removed:
            liked = False
        else:
            try:
                through_model.objects.create(post_id=post.id, user_id=request.user.id)
            except IntegrityError:
                # Concurrent like request created it first.
                pass
            liked = True

        like_count = through_model.objects.filter(post_id=post.id).count()

        return Response({
            "liked": liked,
            "liked_by_me": liked,
            "likes": like_count,
            "like_count": like_count,
            "post_id": post.id,
        })


class PostRepliesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, post_id):
        post = get_object_or_404(Post, id=post_id, is_removed=False)

        if not _can_interact_with_post(request.user, post):
            return Response({"error": "Permission denied."}, status=403)

        replies = post.replies.select_related('author').order_by('created_at')
        return Response(ReplySerializer(replies, many=True).data)

    def post(self, request, post_id):
        post = get_object_or_404(Post, id=post_id, is_removed=False)

        if not _can_interact_with_post(request.user, post):
            return Response({"error": "Permission denied."}, status=403)

        if post.community is not None:
            membership = _post_membership_or_none(request.user, post)
            if not membership or not membership.can_post:
                return Response({"error": "Permission denied."}, status=403)

        content = (request.data.get('content') or '').strip()
        if not content:
            return Response({"error": "Reply content is required."}, status=400)

        reply = Reply.objects.create(
            post=post,
            author=request.user,
            content=content,
        )
        return Response(ReplySerializer(reply).data, status=201)


class SharePostView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        source_post = get_object_or_404(Post, id=post_id, is_removed=False)

        if not _can_interact_with_post(request.user, source_post):
            return Response({"error": "Permission denied."}, status=403)

        target_community = source_post.community
        target_community_id = request.data.get('community_id')

        if target_community_id is not None:
            target_community = get_object_or_404(Community, id=target_community_id)

        if target_community is not None:
            membership = _get_membership(request.user, target_community)
            if not membership or not membership.can_post:
                return Response({"error": "Permission denied."}, status=403)

        share_content = (request.data.get('content') or '').strip()
        if not share_content:
            share_content = source_post.content

        share_title = (request.data.get('title') or '').strip()
        if not share_title:
            share_title = f"Shared: {source_post.title or 'Post'}"

        shared_post = Post.objects.create(
            author=request.user,
            community=target_community,
            title=share_title,
            content=share_content,
            post_type=source_post.post_type,
        )

        if source_post.image:
            shared_post.image = source_post.image
            shared_post.save(update_fields=['image'])

        return Response(
            {
                "shared": True,
                "original_post_id": source_post.id,
                "shared_post": PostSerializer(shared_post, context={'request': request}).data,
            },
            status=201,
        )


class ReportPost(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, post_id):
        post   = get_object_or_404(Post, id=post_id)
        reason = request.data.get('reason', '')
        if not reason:
            return Response({"error": "Reason required."}, status=400)
        report = Report.objects.create(
            post=post, reported_by=request.user,
            reason=reason, message=request.data.get('message', ''),
        )
        return Response({"report_id": report.id}, status=201)


# ─────────────────────────────────────────────────────────────────────────────
# COMMUNITIES REACT API
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_communities(request):
    ctx = {'request': request}
    if request.method == 'GET':
        communities = Community.objects.all().order_by('-created_at')
        return Response(CommunitySerializer(communities, many=True, context=ctx).data)

    serializer = CommunitySerializer(data=request.data, context=ctx)
    if serializer.is_valid():
        community = serializer.save(created_by=request.user)
        CommunityMembership.objects.get_or_create(
            community=community, user=request.user,
            defaults={
                'role': 'creator', 'can_post': True, 'can_invite': True,
                'can_pin_posts': True, 'can_create_announcements': True, 'is_active': True,
            }
        )
        return Response(CommunitySerializer(community, context=ctx).data, status=201)
    return Response(serializer.errors, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_my_communities(request):
    memberships = CommunityMembership.objects.filter(user=request.user, is_active=True)
    communities = [m.community for m in memberships]
    return Response(CommunitySerializer(communities, many=True, context={'request': request}).data)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def api_community_detail(request, pk):
    community = get_object_or_404(Community, id=pk)

    if request.method in ('PATCH', 'DELETE') and not _can_manage_community(request.user, community):
        return Response({'detail': 'Not allowed.'}, status=403)

    if request.method == 'PATCH':
        # Update fields
        for field in ['name', 'description', 'is_private', 'can_post', 'can_invite', 'can_pin_posts', 'can_create_announcements']:
            if field in request.data:
                value = request.data[field]
                if field == 'is_private':
                    value = value in (True, 'true', 'True', '1', 1)
                setattr(community, field, value)
        if 'image' in request.FILES:
            community.image = request.FILES['image']
        community.save()

    if request.method == 'DELETE':
        community.delete()
        return Response({'deleted': True}, status=200)

    return Response(CommunitySerializer(community, context={'request': request}).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_community_members(request, pk):
    members = CommunityMembership.objects.filter(community_id=pk, is_active=True)
    return Response(MembershipSerializer(members, many=True).data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_community_remove_member(request, pk, user_id):
    community = get_object_or_404(Community, id=pk)
    membership = _get_membership(request.user, community)

    if not (_can_manage_community(request.user, community) or (membership and membership.can_invite)):
        return Response({'detail': 'Not allowed.'}, status=403)

    target = CommunityMembership.objects.filter(
        community=community,
        user_id=user_id,
        is_active=True,
    ).first()
    if target is None:
        # Frontends often send membership.id instead of user_id.
        target = CommunityMembership.objects.filter(
            community=community,
            id=user_id,
            is_active=True,
        ).first()
    if target is None:
        return Response({'detail': 'Member not found.'}, status=404)

    if target.user_id == community.created_by_id or target.role == 'creator':
        return Response({'detail': 'Cannot remove the community creator.'}, status=400)

    target.is_active = False
    target.save(update_fields=['is_active'])
    return Response({'removed': True, 'user_id': user_id}, status=200)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def api_community_posts(request, pk):
    community = get_object_or_404(Community, id=pk)

    if request.method == 'GET':
        posts = Post.objects.filter(
            community_id=pk, is_removed=False
        ).select_related(
            'author__classteacher',
            'author__student',
        ).order_by('-created_at')
        return Response(PostSerializer(posts, many=True, context={'request': request}).data)

    data = request.data
    post = Post(
        author=request.user,
        community=community,
        title=data.get('title', '').strip() or 'Untitled',
        content=data.get('content', ''),
        post_type=data.get('post_type', 'post'),
    )
    if 'image' in request.FILES:
        post.image = request.FILES['image']
    post.save()
    return Response(PostSerializer(post, context={'request': request}).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_community_requests(request, pk):
    community = get_object_or_404(Community, id=pk)
    membership = CommunityMembership.objects.filter(
        community=community, user=request.user, is_active=True
    ).first()
    if not membership or membership.role not in ('creator', 'collaborator'):
        return Response([], status=200)
    qs = community.join_requests.filter(status='pending').order_by('-requested_at')
    return Response(CommunityJoinRequestSerializer(qs, many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_join_community(request, pk):
    CommunityMembership.objects.get_or_create(
        community_id=pk, user=request.user,
        defaults={'role': 'member', 'can_post': True}
    )
    return Response({"message": "Joined"})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_leave_community(request, pk):
    CommunityMembership.objects.filter(
        community_id=pk, user=request.user
    ).update(is_active=False)
    return Response({"message": "Left"})


