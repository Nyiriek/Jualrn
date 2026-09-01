from django.db import migrations, models


TEXTBOOK_SOURCES = {
    'Secondary English 4 Student’s Book (South Sudan, 2018)',
    'Chemistry Student’s Book 4 (South Sudan)',
    'Secondary Biology 4 Student Textbook (South Sudan)',
    'Secondary Physics 4 Student Textbook (South Sudan)',
}


def lesson_draft(resource):
    return (
        f"Lesson goal\nStudents will use the {resource.title} material to explain key ideas accurately and apply them in a short task.\n\n"
        f"Starter\nInvite students to share what they already know about the topic and record two questions they want to answer.\n\n"
        f"Learning material\n{resource.content or resource.description}\n\n"
        f"Guided activity\nWork through the ideas with a partner. Ask students to identify important vocabulary, give an example, and explain their reasoning.\n\n"
        f"Independent check\nComplete a short response using evidence from the material. End by writing one takeaway and one question for the next lesson."
    )


def expand_repository_library(apps, schema_editor):
    LearningResource = apps.get_model('users', 'LearningResource')
    Lesson = apps.get_model('users', 'Lesson')
    Subject = apps.get_model('users', 'Subject')

    unit_resources = list(
        LearningResource.objects.filter(source__in=TEXTBOOK_SOURCES, title__startswith='Unit ')
        .exclude(title__contains=' — ')
    )

    resource_kinds = [
        ('Concept notes', 'reading', 'A focused reading and vocabulary guide that breaks the topic into key ideas and examples.',
         'Read the key ideas below. Highlight unfamiliar vocabulary, then write a definition and an example for each important term.'),
        ('Guided learning activity', 'activity', 'A collaborative investigation that turns the unit ideas into discussion, observation or problem-solving.',
         'In pairs, use the source material to complete the task. Record your evidence, compare approaches and prepare one clear explanation to share.'),
        ('Practice worksheet', 'worksheet', 'Short practice prompts for checking understanding before moving to a formal assessment.',
         'Complete the retrieval, application and reflection prompts. Show your working or reasoning, then correct one answer using the source material.'),
        ('Assessment task', 'assessment', 'A ready-to-adapt formative task with a clear evidence-based response expectation.',
         'Produce a concise response that makes a claim, uses accurate topic vocabulary and supports the claim with evidence or a worked example.'),
        ('Video study guide', 'video', 'A viewing guide for a teacher-selected classroom video, animation or demonstration on this topic.',
         'Before viewing, predict what you expect to learn. During viewing, note three key ideas. Afterwards, explain one idea in your own words and apply it.'),
    ]

    for unit in unit_resources:
        LearningResource.objects.filter(pk=unit.pk).update(topic=unit.title)
        for suffix, resource_type, description, activity in resource_kinds:
            LearningResource.objects.get_or_create(
                title=f'{unit.title} — {suffix}',
                source=unit.source,
                defaults={
                    'subject_area': unit.subject_area,
                    'topic': unit.title,
                    'resource_type': resource_type,
                    'description': description,
                    'content': (
                        f"Topic: {unit.title}\n\n{unit.description}\n\n"
                        f"Source focus\n{unit.content}\n\n"
                        f"How to use this resource\n{activity}"
                    ),
                    'source_reference': f'{unit.source_reference} · {suffix}'[:100],
                    'is_published': True,
                },
            )

    # Earlier versions copied repository material verbatim into a lesson whenever a
    # course was created. Keep that work, but convert exact copies into distinct,
    # student-facing lesson plans so resources and lessons now serve different roles.
    for course in Subject.objects.all().prefetch_related('resources'):
        for resource in course.resources.all():
            Lesson.objects.filter(
                subject=course,
                title=resource.title,
                content=resource.content,
            ).update(title=f'Lesson: {resource.title}', content=lesson_draft(resource))


def reverse_expand_repository_library(apps, schema_editor):
    LearningResource = apps.get_model('users', 'LearningResource')
    suffixes = ['Concept notes', 'Guided learning activity', 'Practice worksheet', 'Assessment task', 'Video study guide']
    for suffix in suffixes:
        LearningResource.objects.filter(
            source__in=TEXTBOOK_SOURCES,
            title__endswith=f' — {suffix}',
        ).delete()


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0025_studentanswer_answer_text_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='learningresource',
            name='topic',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.RunPython(expand_repository_library, reverse_expand_repository_library),
    ]
