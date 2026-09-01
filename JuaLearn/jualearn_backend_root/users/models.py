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
    # Existing accounts are treated as verified by the data migration. New
    # student and teacher registrations must confirm ownership of their email.
    email_verified = models.BooleanField(default=True)


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_verification_tokens')
    token = models.CharField(max_length=64, unique=True, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Email verification for {self.user_id}'


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
    resources = models.ManyToManyField('LearningResource', blank=True, related_name='courses')

    def __str__(self):
        return self.name


class LearningResource(models.Model):
    RESOURCE_TYPES = (
        ('reading', 'Reading'),
        ('activity', 'Activity'),
        ('video', 'Video'),
        ('worksheet', 'Worksheet'),
        ('assessment', 'Assessment prompt'),
    )

    title = models.CharField(max_length=255)
    subject_area = models.CharField(max_length=100, blank=True)
    topic = models.CharField(max_length=255, blank=True)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES, default='reading')
    description = models.TextField(blank=True)
    content = models.TextField(blank=True)
    source = models.CharField(max_length=255, blank=True)
    source_reference = models.CharField(max_length=100, blank=True)
    source_url = models.URLField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='learning_resources'
    )
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['subject_area', 'title']

    def __str__(self):
        return self.title

class Assignment(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
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
    created_at = models.DateTimeField(auto_now_add=True)
    grade = models.IntegerField(null=True, blank=True)
    published = models.BooleanField(default=False)
    submission_text = models.TextField(blank=True)
    submitted_at = models.DateTimeField(null=True, blank=True)

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
    resources = models.ManyToManyField(LearningResource, blank=True, related_name='quizzes')
    created_at = models.DateTimeField(auto_now_add=True)
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
    is_teacher_adjusted = models.BooleanField(default=False)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'quiz')

    def __str__(self):
        return f"{self.student.username} - {self.quiz.title} - Grade: {self.grade}"

class QuizQuestion(models.Model):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    type = models.CharField(max_length=50, default='multiple-choice')
    answer_key = models.TextField(blank=True)

class QuizChoice(models.Model):
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE, related_name='choices')
    text = models.CharField(max_length=255)
    is_correct = models.BooleanField(default=False)

class StudentAnswer(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'student'})
    question = models.ForeignKey(QuizQuestion, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(QuizChoice, on_delete=models.CASCADE, null=True, blank=True)
    answer_text = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)


class Lesson(models.Model):
    subject = models.ForeignKey('Subject', on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    date_created = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.subject.name} - {self.title}"


class ForumPost(models.Model):
    POST_TYPES = (
        ('question', 'Question'),
        ('discussion', 'Discussion'),
    )

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='forum_posts')
    title = models.CharField(max_length=180)
    body = models.TextField()
    post_type = models.CharField(max_length=20, choices=POST_TYPES, default='discussion')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class ForumComment(models.Model):
    post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='forum_comments')
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author.username}"


class FeedbackPost(models.Model):
    FEEDBACK_TYPES = (
        ('suggestion', 'Suggestion'),
        ('feedback', 'Feedback'),
    )

    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='feedback_posts')
    title = models.CharField(max_length=180)
    body = models.TextField()
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_TYPES, default='feedback')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class FeedbackComment(models.Model):
    post = models.ForeignKey(FeedbackPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='feedback_comments')
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Feedback reply by {self.author.username}"


class AIConversation(models.Model):
    """A private Jua Companion conversation owned by one authenticated user."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_conversations')
    title = models.CharField(max_length=120, default='New conversation')
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_conversations')
    lesson = models.ForeignKey(Lesson, on_delete=models.SET_NULL, null=True, blank=True, related_name='ai_conversations')
    context_type = models.CharField(max_length=20, blank=True)
    context_id = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']


class AIMessage(models.Model):
    ROLE_CHOICES = (('user', 'User'), ('assistant', 'Assistant'))
    conversation = models.ForeignKey(AIConversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    client_message_id = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['conversation', 'client_message_id'],
                condition=models.Q(client_message_id__gt=''),
                name='unique_ai_client_message_per_conversation',
            )
        ]
