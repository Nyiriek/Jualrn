from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('users', '0029_forum_posts_and_comments')]

    operations = [
        migrations.AddField(
            model_name='forumpost',
            name='space',
            field=models.CharField(choices=[('forum', 'Community forum'), ('feedback', 'Feedback board')], default='forum', max_length=20),
        ),
    ]
