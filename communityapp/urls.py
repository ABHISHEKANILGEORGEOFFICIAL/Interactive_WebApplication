# List candidate members for a community (users followed by current user who are not already active members)

from django.urls import path
from . import views

urlpatterns = [
    # ── Additional Follow/Followers Endpoints for React ─────────────────────────
    path("follow/following/", views.FollowingView.as_view()),
    path("follow/followers/", views.APIUserFollowers.as_view()),
    path("follow/<int:pk>/", views.APIFollowUser.as_view()),
    path("follow/toggle/", views.APIToggleFollow.as_view()),
    path("follow/requests/sent/", views.APIFollowRequests.as_view()),
    path("follow/requests/received/", views.APIReceivedRequests.as_view()),
    path("follow/requests/accept/", views.APIAcceptFollow.as_view()),
    path("follow/requests/reject/", views.APIRejectFollow.as_view()),
    path("follow/status/", views.APIFollowStatus.as_view()),
    path("users/<int:pk>/unfollow/", views.APIUnfollowUser.as_view()),

    # ── Aliases kept for frontend compatibility ──────────────────────────────
    path("users/following/", views.FollowingView.as_view()),
    path("users/followers/", views.APIUserFollowers.as_view()),
    path("followers/", views.APIUserFollowers.as_view()),
    path("profile/following/", views.FollowingView.as_view()),
    path("profile/followers/", views.APIUserFollowers.as_view()),
    
    # ── Community list & creation (template views) ───────────────────────────
    path("", views.community_list, name="community"),
    path("create/", views.community_create, name="community_create"),

    # ── React API: Communities ────────────────────────────────────────────────
    path("communities/", views.api_communities),
    path("communities/my/", views.api_my_communities),
    path("communities/<int:pk>/", views.api_community_detail),
    path("communities/<int:pk>/members/", views.api_community_members),
    path("communities/<int:pk>/members/<int:user_id>/remove/", views.api_community_remove_member),
    path("communities/<int:pk>/add-members/", views.APICommunityAddMembers.as_view()),
    path("communities/<int:pk>/posts/", views.api_community_posts),
    path("communities/<int:pk>/requests/", views.api_community_requests),
    path("communities/<int:pk>/join/", views.api_join_community),
    path("communities/<int:pk>/leave/", views.api_leave_community),
    path("communities/<int:pk>/candidates/", views.APICandidateCommunityMembers.as_view()),

    # ── React API: Users / Follow / Profile ──────────────────────────────────
    path("users/", views.UserListView.as_view(), name="user-list"),
    path("following/", views.FollowingView.as_view(), name="following"),
    path("profile/", views.ProfileView.as_view(), name="profile"),

    # ── Community detail & management (template views) ───────────────────────
    path("<int:pk>/", views.community_detail, name="community_detail"),
    path("<int:pk>/edit/", views.community_edit, name="community_edit"),
    path("<int:pk>/delete/", views.community_delete, name="community_delete"),
    path("<int:pk>/permissions/", views.community_manage_permissions, name="community_manage_permissions"),
    path("<int:pk>/all-members/", views.community_all_members, name="community_all_members"),
    path("<int:pk>/join/", views.community_join, name="community_join"),
    path("<int:pk>/leave/", views.community_leave, name="community_leave"),
    path("<int:pk>/add-members/", views.community_add_members, name="community_add_members"),
    path("<int:pk>/remove/<int:user_id>/", views.community_remove_member, name="community_remove_member"),

    # ── Student permission flow ───────────────────────────────────────────────
    path("request-permission/", views.student_request_permission, name="student_request_permission"),
    path("my-requests/", views.student_my_requests, name="student_my_requests"),

    # ── Teacher permission flow ───────────────────────────────────────────────
    path("teacher-requests/", views.teacher_permission_requests, name="teacher_permission_requests"),
    path("teacher-requests/<int:req_id>/handle/", views.teacher_handle_request, name="teacher_handle_request"),

    # ── DRF API endpoints ─────────────────────────────────────────────────────
    path("api/create/", views.TeacherCreateCommunity.as_view()),
    path("api/requests/", views.TeacherViewRequests.as_view()),
    path("api/requests/<int:pk>/handle/", views.TeacherHandleRequest.as_view()),
    path("api/<int:community_id>/announce/", views.CreateAnnouncement.as_view()),
    path("api/<int:community_id>/invite/", views.CreateInvite.as_view()),
    path("posts/<int:post_id>/pin/", views.PinPost.as_view()),
    path("posts/<int:post_id>/like/", views.TogglePostLike.as_view()),
    path("posts/<int:post_id>/replies/", views.PostRepliesView.as_view()),
    path("posts/<int:post_id>/reply/", views.PostRepliesView.as_view()),
    path("posts/<int:post_id>/share/", views.SharePostView.as_view()),
    path("posts/<int:post_id>/report/", views.ReportPostView.as_view()),
    # Admin endpoints for report management
    path("admin/reports/", views.AdminReportListView.as_view()),
    path("admin/reports/<int:report_id>/", views.AdminReportUpdateView.as_view()),
    path("api/admin/reports/", views.AdminReportListView.as_view()),
    path("api/admin/reports/<int:report_id>/", views.AdminReportUpdateView.as_view()),
    path("posts/<int:post_id>/delete/", views.DeletePost.as_view()),
    path("api/admin/posts/<int:post_id>/delete/", views.AdminDeletePostView.as_view()),

    # Global feed (personal + followed users' posts)
    path("api/feed/", views.FeedView.as_view(), name="feed"),

    # Personal post creation
    # path("api/posts/create/", views.CreatePostView.as_view(), name="create-post"),

    # Community feed (posts inside a community)
    path("api/community/<int:id>/posts/", views.api_community_posts, name="community-posts"),

    # Community post creation
    # path("api/community/<int:id>/post/", views.CreateCommunityPostView.as_view(), name="create-community-post"),
]