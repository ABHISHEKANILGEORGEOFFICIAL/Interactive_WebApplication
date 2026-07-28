from django.db import migrations, models


def seed_membership_permissions(apps, schema_editor):
    CommunityMembership = apps.get_model('communityapp', 'CommunityMembership')

    CommunityMembership.objects.filter(role='creator').update(
        can_post=True,
        can_invite=True,
        can_pin_posts=True,
        can_create_announcements=True,
    )
    CommunityMembership.objects.filter(role='collaborator').update(
        can_post=True,
        can_invite=True,
    )


class Migration(migrations.Migration):

    dependencies = [
        ('communityapp', '0002_repair_follow_status_column'),
    ]

    operations = [
        migrations.AddField(
            model_name='communitymembership',
            name='can_create_announcements',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='communitymembership',
            name='can_invite',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='communitymembership',
            name='can_pin_posts',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='communitymembership',
            name='can_post',
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(seed_membership_permissions, migrations.RunPython.noop),
    ]