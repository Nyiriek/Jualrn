from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    profile_picture = models.ImageField(upload_to='profile_pics/', blank=True, null=True)

    # Additional fields for teachers
    institution = models.CharField(max_length=255, blank=True, null=True)
    years_of_experience = models.PositiveIntegerField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)


class Subject(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    content = models.TextField(blank=True, null=True)
    published = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subjects",
        null=True, 
        blank=True
    )

    def __str__(self):
        return self.name

class Assignment(models.Model):
    title = models.CharField(max_length=100)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_assignments')
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='assignments', 
        null=True, 
        blank=True
    )
    due_date = models.DateField()
    grade = models.IntegerField(null=True, blank=True)
    published = models.BooleanField(default=False)

class Quiz(models.Model):
    title = models.CharField(max_length=100)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    description = models.TextField(blank=True, null=True)
    assigned_to = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='quizzes',
        null=True,
        blank=True
    )
    due_date = models.DateField()
    published = models.BooleanField(default=False) 


class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True)
    url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    type = models.CharField(max_length=50, blank=True) 

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.recipient.username}: {self.title}"


class Enrollment(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'subject')
        

class QuizResult(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    grade = models.IntegerField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'quiz')

    def __str__(self):
        return f"{self.student.username} - {self.quiz.title} - Grade: {self.grade}"

class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    type = models.CharField(max_length=50, default='multiple-choice')

class QuizChoice(models.Model):
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

class StudentAnswer(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(QuizChoice, on_delete=models.CASCADE)
    submitted_at = models.DateTimeField(auto_now_add=True)


class Lesson(models.Model):
    subject = models.ForeignKey('Subject', on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject.name} - {self.title}"