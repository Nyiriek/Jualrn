# Generated by Django 5.2.2 on 2025-06-14 13:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_profile_picture'),
    ]

    operations = [
        migrations.AddField(
            model_name='subject',
            name='description',
            field=models.TextField(blank=True),
        ),
    ]
