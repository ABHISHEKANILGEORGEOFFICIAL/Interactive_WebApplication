from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from .models import Community, CommunityMembership


class CommunityManagementTests(TestCase):
	def setUp(self):
		self.creator = User.objects.create_user(username='creator', password='testpass123')
		self.other_user = User.objects.create_user(username='other', password='testpass123')
		self.third_user = User.objects.create_user(username='third', password='testpass123')
		self.community = Community.objects.create(
			name='Science Club',
			description='Initial description',
			created_by=self.creator,
			is_private=False,
		)
		CommunityMembership.objects.create(
			community=self.community,
			user=self.creator,
			role='creator',
			can_post=True,
			can_invite=True,
			can_pin_posts=True,
			can_create_announcements=True,
		)

	def test_edit_view_updates_privacy(self):
		self.client.force_login(self.creator)

		response = self.client.post(
			reverse('community_edit', args=[self.community.id]),
			{
				'name': 'Science Club Updated',
				'description': 'Updated description',
				'is_private': 'on',
			},
		)

		self.assertEqual(response.status_code, 302)
		self.community.refresh_from_db()
		self.assertEqual(self.community.name, 'Science Club Updated')
		self.assertEqual(self.community.description, 'Updated description')
		self.assertTrue(self.community.is_private)

	def test_api_detail_delete_removes_community_for_creator(self):
		api_client = APIClient()
		api_client.force_authenticate(user=self.creator)

		response = api_client.delete(f'/api/communities/{self.community.id}/')

		self.assertEqual(response.status_code, 200)
		self.assertFalse(Community.objects.filter(id=self.community.id).exists())

	def test_api_detail_delete_rejects_non_creator(self):
		api_client = APIClient()
		api_client.force_authenticate(user=self.other_user)

		response = api_client.delete(f'/api/communities/{self.community.id}/')

		self.assertEqual(response.status_code, 403)
		self.assertTrue(Community.objects.filter(id=self.community.id).exists())

	def test_api_detail_repairs_creator_membership(self):
		membership = CommunityMembership.objects.get(community=self.community, user=self.creator)
		membership.role = 'member'
		membership.can_invite = False
		membership.can_pin_posts = False
		membership.can_create_announcements = False
		membership.save(update_fields=['role', 'can_invite', 'can_pin_posts', 'can_create_announcements'])

		api_client = APIClient()
		api_client.force_authenticate(user=self.creator)

		response = api_client.get(f'/api/communities/{self.community.id}/')

		self.assertEqual(response.status_code, 200)
		self.assertEqual(response.data['user_role'], 'creator')
		membership.refresh_from_db()
		self.assertEqual(membership.role, 'creator')
		self.assertTrue(membership.can_invite)

	def test_api_add_members_allows_repaired_creator(self):
		membership = CommunityMembership.objects.get(community=self.community, user=self.creator)
		membership.role = 'member'
		membership.can_invite = False
		membership.save(update_fields=['role', 'can_invite'])

		api_client = APIClient()
		api_client.force_authenticate(user=self.creator)

		response = api_client.post(
			f'/api/communities/{self.community.id}/add-members/',
			{'members': [self.third_user.id]},
			format='json',
		)

		self.assertEqual(response.status_code, 200)
		self.assertIn(self.third_user.id, response.data['added'])
		self.assertTrue(
			CommunityMembership.objects.filter(
				community=self.community,
				user=self.third_user,
				is_active=True,
			).exists()
		)

	def test_api_remove_member_route_deactivates_member(self):
		CommunityMembership.objects.create(
			community=self.community,
			user=self.other_user,
			role='member',
			can_post=True,
		)

		api_client = APIClient()
		api_client.force_authenticate(user=self.creator)

		response = api_client.delete(
			f'/api/communities/{self.community.id}/members/{self.other_user.id}/remove/'
		)

		self.assertEqual(response.status_code, 200)
		membership = CommunityMembership.objects.get(community=self.community, user=self.other_user)
		self.assertFalse(membership.is_active)

	def test_api_remove_member_accepts_membership_id(self):
		target = CommunityMembership.objects.create(
			community=self.community,
			user=self.other_user,
			role='member',
			can_post=True,
		)

		api_client = APIClient()
		api_client.force_authenticate(user=self.creator)

		response = api_client.delete(
			f'/api/communities/{self.community.id}/members/{target.id}/remove/'
		)

		self.assertEqual(response.status_code, 200)
		target.refresh_from_db()
		self.assertFalse(target.is_active)
