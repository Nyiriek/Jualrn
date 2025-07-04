from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

class Subject(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True) 
    content = models.TextField(blank=True, null=True) 

class Assignment(models.Model):
    title = models.CharField(max_length=100)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_assignments')
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assignments')
    due_date = models.DateField()
    grade = models.IntegerField(null=True, blank=True)
