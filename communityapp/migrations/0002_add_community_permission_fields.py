from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('communityapp', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                (
                    "ALTER TABLE communityapp_community "
                    "ADD COLUMN IF NOT EXISTS can_post boolean DEFAULT TRUE"
                ),
                (
                    "ALTER TABLE communityapp_community "
                    "ADD COLUMN IF NOT EXISTS can_invite boolean DEFAULT FALSE"
                ),
                (
                    "ALTER TABLE communityapp_community "
                    "ADD COLUMN IF NOT EXISTS can_pin_posts boolean DEFAULT FALSE"
                ),
                (
                    "ALTER TABLE communityapp_community "
                    "ADD COLUMN IF NOT EXISTS can_create_announcements boolean DEFAULT FALSE"
                ),
                "UPDATE communityapp_community SET can_post = TRUE WHERE can_post IS NULL",
                "UPDATE communityapp_community SET can_invite = FALSE WHERE can_invite IS NULL",
                "UPDATE communityapp_community SET can_pin_posts = FALSE WHERE can_pin_posts IS NULL",
                "UPDATE communityapp_community SET can_create_announcements = FALSE WHERE can_create_announcements IS NULL",
                "ALTER TABLE communityapp_community ALTER COLUMN can_post SET NOT NULL",
                "ALTER TABLE communityapp_community ALTER COLUMN can_invite SET NOT NULL",
                "ALTER TABLE communityapp_community ALTER COLUMN can_pin_posts SET NOT NULL",
                "ALTER TABLE communityapp_community ALTER COLUMN can_create_announcements SET NOT NULL",
                "ALTER TABLE communityapp_community ALTER COLUMN can_post SET DEFAULT TRUE",
                "ALTER TABLE communityapp_community ALTER COLUMN can_invite SET DEFAULT FALSE",
                "ALTER TABLE communityapp_community ALTER COLUMN can_pin_posts SET DEFAULT FALSE",
                "ALTER TABLE communityapp_community ALTER COLUMN can_create_announcements SET DEFAULT FALSE",
            ],
            reverse_sql=migrations.RunSQL.noop,
        ),
    ]
