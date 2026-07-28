# Imports
from django.db import models
from django.contrib.auth.models import User
import uuid

# ─────────────────────────────────────────────
# FOLLOW RELATIONSHIP
# ─────────────────────────────────────────────

class Follow(models.Model):
    follower = models.ForeignKey(User, related_name='sent_requests', on_delete=models.CASCADE)
    following = models.ForeignKey(User, related_name='received_requests', on_delete=models.CASCADE)
    status = models.CharField(
        max_length=10,
        choices=[
            ('pending', 'Pending'),
            ('accepted', 'Accepted'),
        ],
        default='pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('follower', 'following')
        verbose_name = 'Follow'
        verbose_name_plural = 'Follows'

    def __str__(self):
         return f"{self.follower.username} -> {self.following.username} ({self.status})"


# ─────────────────────────────────────────────
# CATEGORY
# ─────────────────────────────────────────────

class CommunityCategory(models.Model):
    CATEGORY_TYPES = [
        ('school', 'School'),
        ('college', 'College'),
        ('subject', 'Subject'),
        ('general', 'General'),
    ]

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=CATEGORY_TYPES)

    school = models.ForeignKey('Adminapp.School', on_delete=models.CASCADE, null=True, blank=True)
    college = models.ForeignKey('Adminapp.College', on_delete=models.CASCADE, null=True, blank=True)
    subject = models.ForeignKey('Adminapp.Subject', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name


# ─────────────────────────────────────────────
# PERMISSION REQUEST
# ─────────────────────────────────────────────

class CommunityPermissionRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    student = models.ForeignKey('Guestapp.Student', on_delete=models.CASCADE)
    teacher = models.ForeignKey('Guestapp.ClassTeacher', on_delete=models.CASCADE)

    community_name = models.CharField(max_length=200)
    description = models.TextField()

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    teacher_note = models.TextField(blank=True)

    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)


# ─────────────────────────────────────────────
# COMMUNITY
# ─────────────────────────────────────────────

class Community(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField()

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    category = models.ForeignKey(CommunityCategory, on_delete=models.SET_NULL, null=True)

    permission_request = models.OneToOneField(
        CommunityPermissionRequest,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    is_private = models.BooleanField(default=False)

    image = models.ImageField(upload_to='community/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    # Community-wide permissions
    can_post = models.BooleanField(default=True)
    can_invite = models.BooleanField(default=False)
    can_pin_posts = models.BooleanField(default=False)
    can_create_announcements = models.BooleanField(default=False)

    def member_count(self):
        return self.memberships.filter(is_active=True).count()


# ─────────────────────────────────────────────
# MEMBERSHIP
# ─────────────────────────────────────────────

class CommunityMembership(models.Model):
    ROLE_CHOICES = [
        ('creator', 'Creator'),
        ('collaborator', 'Collaborator'),
        ('member', 'Member'),
    ]

    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    can_post = models.BooleanField(default=True)
    can_invite = models.BooleanField(default=False)
    can_pin_posts = models.BooleanField(default=False)
    can_create_announcements = models.BooleanField(default=False)


    is_active = models.BooleanField(default=True)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('community', 'user')


def ensure_creator_membership(community):
    membership, _ = CommunityMembership.objects.get_or_create(
        community=community,
        user=community.created_by,
        defaults={
            'role': 'creator',
            'can_post': True,
            'can_invite': True,
            'can_pin_posts': True,
            'can_create_announcements': True,
            'is_active': True,
        },
    )

    update_fields = []
    if membership.role != 'creator':
        membership.role = 'creator'
        update_fields.append('role')
    if not membership.can_post:
        membership.can_post = True
        update_fields.append('can_post')
    if not membership.can_invite:
        membership.can_invite = True
        update_fields.append('can_invite')
    if not membership.can_pin_posts:
        membership.can_pin_posts = True
        update_fields.append('can_pin_posts')
    if not membership.can_create_announcements:
        membership.can_create_announcements = True
        update_fields.append('can_create_announcements')
    if not membership.is_active:
        membership.is_active = True
        update_fields.append('is_active')

    if update_fields:
        membership.save(update_fields=update_fields)

    return membership


# ─────────────────────────────────────────────
# JOIN REQUEST
# ─────────────────────────────────────────────

class CommunityJoinRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='join_requests')
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    message = models.TextField(blank=True)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')

    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)


# ─────────────────────────────────────────────
# INVITE
# ─────────────────────────────────────────────

class CommunityInvite(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE)

    invited_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    invited_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invites')

    code = models.UUIDField(default=uuid.uuid4, unique=True)

    role = models.CharField(
        max_length=20,
        choices=[
            ('member', 'Member'),
            ('collaborator', 'Collaborator'),
        ],
        default='member',
    )

    is_used = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)


# ─────────────────────────────────────────────
# POST  ✅ single source of truth
# ─────────────────────────────────────────────

class Post(models.Model):
    POST_TYPES = [
        ('post', 'Post'),
        ('photo', 'Photo'),
        ('note', 'Note'),
    ]

    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='posts',
    )

    # null=True → supports standalone (teacher wall) posts too
    community = models.ForeignKey(
        Community,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='posts',
    )

    title = models.CharField(max_length=255, blank=True)
    content = models.TextField(blank=True)

    post_type = models.CharField(max_length=10, choices=POST_TYPES)

    image = models.ImageField(upload_to='posts/', null=True, blank=True)

    is_pinned = models.BooleanField(default=False)
    is_removed = models.BooleanField(default=False)   # soft-delete for moderation

    created_at = models.DateTimeField(auto_now_add=True)

    likes = models.ManyToManyField(
        User,
        blank=True,
        related_name='liked_posts',
    )

    def like_count(self):
        return self.likes.count()


# ─────────────────────────────────────────────
# REPLY  ✅ single source of truth
# ─────────────────────────────────────────────

class Reply(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='community_replies')

    author = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='replies',
    )

    content = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)


# ─────────────────────────────────────────────
# REPORT  ✅ new — moderation
# ─────────────────────────────────────────────

class Report(models.Model):
    REASON_CHOICES = [
        ('spam', 'Spam'),
        ('harassment', 'Harassment'),
        ('inappropriate', 'Inappropriate Content'),
        ('misinformation', 'Misinformation'),
        ('other', 'Other'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('reviewed', 'Reviewed'),
        ('dismissed', 'Dismissed'),
        ('actioned', 'Actioned'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='reports')

    reported_by = models.ForeignKey(User, on_delete=models.CASCADE)

    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    message = models.TextField(blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    created_at = models.DateTimeField(auto_now_add=True)


# ─────────────────────────────────────────────
# ANNOUNCEMENT
# ─────────────────────────────────────────────

class Announcement(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='announcements')

    title = models.CharField(max_length=255)
    content = models.TextField()

    created_by = models.ForeignKey(User, on_delete=models.CASCADE)

    created_at = models.DateTimeField(auto_now_add=True)