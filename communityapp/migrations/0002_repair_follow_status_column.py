from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("communityapp", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                (
                    "ALTER TABLE communityapp_follow "
                    "ADD COLUMN IF NOT EXISTS status varchar(10) DEFAULT 'pending'"
                ),
                "UPDATE communityapp_follow SET status = 'pending' WHERE status IS NULL",
                (
                    "ALTER TABLE communityapp_follow "
                    "ALTER COLUMN status SET DEFAULT 'pending'"
                ),
                "ALTER TABLE communityapp_follow ALTER COLUMN status SET NOT NULL",
            ],
            reverse_sql=[
                "ALTER TABLE communityapp_follow DROP COLUMN IF EXISTS status",
            ],
        ),
    ]