from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0027_quizquestion_answer_key'),
    ]

    operations = [
        migrations.AddField(
            model_name='quizresult',
            name='is_teacher_adjusted',
            field=models.BooleanField(default=False),
        ),
    ]
