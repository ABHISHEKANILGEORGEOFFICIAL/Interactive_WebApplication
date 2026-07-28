# =============================================================================
# communityapp/serializers.py
# =============================================================================

from rest_framework import serializers
from django.contrib.auth.models import User

from .models import (
    Community,
    CommunityCategory,
    CommunityPermissionRequest,
    CommunityMembership,
    ensure_creator_membership,
    CommunityJoinRequest,
    CommunityInvite,
    Announcement,
    Post,
    Reply,
    Report,
    Follow,
)


# ── USER ──────────────────────────────────────────────────────────────────────

class SimpleUserSerializer(serializers.ModelSerializer):
    """
    Lightweight user representation used in follow/profile API responses.
    Imported by views.py for UserListView, FollowingView, ProfileView.
    """
    role = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ["id", "username", "first_name", "last_name", "full_name", "role"]

    def get_role(self, obj):
        try:
            from Guestapp.models import UserProfile
            profile = UserProfile.objects.get(user=obj)
            return profile.role
        except Exception:
            return None

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        if name:
            return name
        # Fall back to profile name stored in ClassTeacher or Student
        try:
            return obj.classteacher.name or obj.username
        except Exception:
            pass
        return obj.username


class FollowSerializer(serializers.ModelSerializer):
    """
    Complete follow relationship serializer with user details and status.
    """
    follower_detail = SimpleUserSerializer(source='follower', read_only=True)
    following_detail = SimpleUserSerializer(source='following', read_only=True)

    class Meta:
        model = Follow
        fields = ["id", "follower", "following", "status", "created_at", "follower_detail", "following_detail"]
        read_only_fields = ["id", "created_at", "follower_detail", "following_detail"]


# ── COMMUNITY ─────────────────────────────────────────────────────────────────

class CommunityCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = CommunityCategory
        fields = '__all__'


class CommunitySerializer(serializers.ModelSerializer):
    member_count       = serializers.SerializerMethodField()
    is_member          = serializers.SerializerMethodField()
    user_role          = serializers.SerializerMethodField()
    created_by_display = serializers.SerializerMethodField()

    class Meta:
        model  = Community
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

    def get_member_count(self, obj):
        return obj.member_count()

    def get_created_by_display(self, obj):
        if not obj.created_by:
            return None
        try:
            return obj.created_by.classteacher.name
        except Exception:
            return obj.created_by.get_full_name() or obj.created_by.username

    def _membership(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        if obj.created_by_id == request.user.id:
            return ensure_creator_membership(obj)
        return CommunityMembership.objects.filter(
            community=obj, user=request.user, is_active=True
        ).first()

    def get_is_member(self, obj):
        return self._membership(obj) is not None

    def get_user_role(self, obj):
        m = self._membership(obj)
        return m.role if m else None


class CommunityPermissionRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.username', read_only=True)

    class Meta:
        model  = CommunityPermissionRequest
        fields = '__all__'



# Nested user serializer for full user details
class NestedUserSerializer(serializers.ModelSerializer):
    fullName = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email", "fullName", "name"]

    def get_fullName(self, obj):
        fn = f"{obj.first_name} {obj.last_name}".strip()
        return fn if fn else obj.username

    def get_name(self, obj):
        return obj.first_name or obj.username

class MembershipSerializer(serializers.ModelSerializer):
    user = NestedUserSerializer(read_only=True)

    class Meta:
        model  = CommunityMembership
        fields = '__all__'


class CommunityJoinRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CommunityJoinRequest
        fields = '__all__'


class CommunityInviteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = CommunityInvite
        fields = '__all__'


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Announcement
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']


# ── POST ──────────────────────────────────────────────────────────────────────

class ReplySerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model  = Reply
        fields = ['id', 'post', 'author', 'author_name', 'content', 'created_at']
        read_only_fields = ['created_at']

    def get_author_name(self, obj):
        return obj.author.get_full_name() or obj.author.username


class PostSerializer(serializers.ModelSerializer):
    authorId = serializers.SerializerMethodField()
    authorUsername = serializers.SerializerMethodField()
    authorEmail = serializers.SerializerMethodField()
    like_count  = serializers.SerializerMethodField()
    liked_by_me = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()
    author_name = serializers.SerializerMethodField()
    author      = NestedUserSerializer(read_only=True)

    class Meta:
        model  = Post
        fields = [
            'id', 'author', 'author_name',
            'authorId', 'authorUsername', 'authorEmail',
            'community',
            'title', 'content', 'post_type', 'image',
            'is_pinned', 'is_removed',
            'like_count', 'liked_by_me', 'reply_count',
            'created_at',
        ]
        read_only_fields = ['author', 'created_at', 'is_removed']

    def get_authorId(self, obj):
        return obj.author.id if obj.author else None

    def get_authorUsername(self, obj):
        return obj.author.username if obj.author else None

    def get_authorEmail(self, obj):
        return obj.author.email if obj.author else None

    def get_like_count(self, obj):
        return obj.likes.count()

    def get_liked_by_me(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return obj.likes.filter(id=request.user.id).exists()

    def get_reply_count(self, obj):
        return obj.community_replies.count()

    def get_author_name(self, obj):
        # Relies on select_related('author__classteacher', 'author__student')
        # being applied on the queryset in views — see FeedView and
        # api_community_posts — to avoid N+1 queries.
        try:
            return obj.author.classteacher.name
        except Exception:
            pass
        try:
            return obj.author.student.name
        except Exception:
            pass
        return obj.author.get_full_name() or obj.author.username


# ── REPORT ────────────────────────────────────────────────────────────────────

class ReportSerializer(serializers.ModelSerializer):

    post_id = serializers.IntegerField(source='post.id', read_only=True)
    post_content = serializers.CharField(source='post.content', read_only=True)
    post_author_username = serializers.CharField(source='post.author.username', read_only=True)

    class Meta:
        model  = Report
        fields = [
            'id', 'post', 'post_id', 'post_content', 'post_author_username',
            'reason', 'message', 'status', 'created_at',
        ]
        read_only_fields = ['reported_by', 'status', 'created_at']


# ── FOLLOW ────────────────────────────────────────────────────────────────────

class FollowSerializer(serializers.ModelSerializer):
    """
    Full Follow relationship serializer.
    Useful for admin views or detailed follower/following lists.
    For simple user lists use SimpleUserSerializer instead.
    """
    follower_username  = serializers.CharField(source='follower.username',  read_only=True)
    following_username = serializers.CharField(source='following.username', read_only=True)

    class Meta:
        model  = Follow
        fields = ['id', 'follower', 'follower_username', 'following', 'following_username']