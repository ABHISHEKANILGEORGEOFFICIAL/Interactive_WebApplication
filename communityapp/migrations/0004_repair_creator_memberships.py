from django.db import migrations


def repair_creator_memberships(apps, schema_editor):
    Community = apps.get_model('communityapp', 'Community')
    CommunityMembership = apps.get_model('communityapp', 'CommunityMembership')

    for community in Community.objects.all().iterator():
        membership, _ = CommunityMembership.objects.get_or_create(
            community_id=community.id,
            user_id=community.created_by_id,
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


class Migration(migrations.Migration):

    dependencies = [
        ('communityapp', '0003_add_membership_permissions'),
    ]

    operations = [
        migrations.RunPython(repair_creator_memberships, migrations.RunPython.noop),
    ]