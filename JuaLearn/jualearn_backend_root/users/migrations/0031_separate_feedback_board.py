from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def copy_feedback_posts(apps, schema_editor):
    ForumPost = apps.get_model('users', 'ForumPost')
    FeedbackPost = apps.get_model('users', 'FeedbackPost')
    FeedbackComment = apps.get_model('users', 'FeedbackComment')
    for post in ForumPost.objects.filter(space='feedback'):
        feedback_post = FeedbackPost.objects.create(
            author_id=post.author_id,
            title=post.title,
            body=post.body,
            feedback_type='suggestion' if post.post_type == 'question' else 'feedback',
            created_at=post.created_at,
            updated_at=post.updated_at,
        )
        for comment in post.comments.all():
            FeedbackComment.objects.create(
                post_id=feedback_post.id,
                author_id=comment.author_id,
                body=comment.body,
                created_at=comment.created_at,
                updated_at=comment.updated_at,
            )


class Migration(migrations.Migration):
    dependencies = [('users', '0030_forumpost_space')]

    operations = [
        migrations.CreateModel(
            name='FeedbackPost',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=180)),
                ('body', models.TextField()),
                ('feedback_type', models.CharField(choices=[('suggestion', 'Suggestion'), ('feedback', 'Feedback')], default='feedback', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='feedback_posts', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.CreateModel(
            name='FeedbackComment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('body', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('author', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='feedback_comments', to=settings.AUTH_USER_MODEL)),
                ('post', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='comments', to='users.feedbackpost')),
            ],
            options={'ordering': ['created_at']},
        ),
        migrations.RunPython(copy_feedback_posts, migrations.RunPython.noop),
        migrations.RemoveField(model_name='forumpost', name='space'),
    ]
