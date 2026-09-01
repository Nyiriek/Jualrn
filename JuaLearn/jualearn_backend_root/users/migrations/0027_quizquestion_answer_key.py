from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0026_expand_repository_library_and_topics'),
    ]

    operations = [
        migrations.AddField(
            model_name='quizquestion',
            name='answer_key',
            field=models.TextField(blank=True),
        ),
    ]
