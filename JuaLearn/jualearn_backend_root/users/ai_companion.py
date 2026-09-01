"""Private, context-aware API views for Jua Companion."""

import logging
import os
import re

import requests
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import AIConversation, AIMessage, Assignment, Enrollment, Lesson, Quiz, Subject
from .serializers import AIChatRequestSerializer, AIConversationSerializer, AIMessageSerializer

logger = logging.getLogger(__name__)

# Requests matching these terms are never forwarded to a model provider.
UNSAFE_REQUEST = re.compile(
    r"\b(suicide|kill myself|self[- ]harm|bomb|weapon|explosive|sexual(?:ly)?|nude|rape|abuse)\b",
    re.IGNORECASE,
)


def _subject_for_user(user, subject_id):
    queryset = Subject.objects.all()
    if user.role == 'student':
        queryset = queryset.filter(published=True, enrollment__student=user)
    elif user.role == 'teacher':
        queryset = queryset.filter(created_by=user)
    return get_object_or_404(queryset.distinct(), id=subject_id)


def _lesson_for_user(user, lesson_id):
    lesson = get_object_or_404(Lesson.objects.select_related('subject'), id=lesson_id)
    _subject_for_user(user, lesson.subject_id)
    return lesson


def _context_from_request(user, data):
    """Return only course content that the current user is allowed to use."""
    subject = lesson = None
    context_type = data.get('context_type', '')
    context_id = data.get('context_id')

    if data.get('subject_id'):
        subject = _subject_for_user(user, data['subject_id'])
    if data.get('lesson_id'):
        lesson = _lesson_for_user(user, data['lesson_id'])
        subject = lesson.subject

    source = ''
    if context_type == 'lesson' and context_id:
        lesson = _lesson_for_user(user, context_id)
        subject = lesson.subject
    elif context_type == 'subject' and context_id:
        subject = _subject_for_user(user, context_id)
    elif context_type == 'assignment' and context_id:
        assignments = Assignment.objects.select_related('subject')
        if user.role == 'student':
            assignments = assignments.filter(assigned_to=user, published=True)
        elif user.role == 'teacher':
            assignments = assignments.filter(created_by=user)
        assignment = get_object_or_404(assignments, id=context_id)
        subject = assignment.subject
        # Never include a completed answer or any grading key in the AI context.
        source = f"Assignment: {assignment.title}\nInstructions: {assignment.description[:2500]}"
    elif context_type == 'quiz' and context_id:
        quizzes = Quiz.objects.select_related('subject')
        if user.role == 'student':
            quizzes = quizzes.filter(published=True, subject__enrollment__student=user)
        elif user.role == 'teacher':
            quizzes = quizzes.filter(created_by=user)
        quiz = get_object_or_404(quizzes.distinct(), id=context_id)
        subject = quiz.subject
        # A quiz title/description is safe; questions and correct choices are deliberately excluded.
        source = f"Quiz: {quiz.title}\nDescription: {(quiz.description or '')[:1800]}"

    if lesson:
        source = f"Lesson: {lesson.title}\nLesson material:\n{lesson.content[:6000]}"
    elif subject and not source:
        source = f"Subject: {subject.name}\nCourse overview:\n{(subject.description or subject.content or '')[:3500]}"

    return subject, lesson, context_type, context_id, source


def _system_instruction(role, source):
    role_guidance = {
        'student': (
            "Act as Jua Companion, a patient secondary-school learning tutor. Use simple, concise language. "
            "Teach with short steps, hints, examples and guiding questions rather than providing final answers. "
            "For a quiz or assignment, help the learner think but do not complete graded work or reveal answers."
        ),
        'teacher': (
            "Act as Jua Companion, a practical teaching assistant. Help teachers clarify lesson plans, write age-appropriate "
            "practice prompts and interpret their own course materials. Do not make grading decisions or expose student data."
        ),
        'admin': (
            "Act as Jua Companion, a concise platform-support guide. Help administrators organise curriculum and platform "
            "workflows without disclosing private user information or making high-stakes decisions."
        ),
    }
    return (
        f"{role_guidance.get(role, role_guidance['student'])} "
        "Never say you are a human teacher. If the question concerns personal, medical, legal, safety, or urgent wellbeing "
        "support, encourage the user to contact a trusted teacher, guardian, local professional or emergency service. "
        "Use only the supplied course material as factual support. If it does not answer the question, say so clearly and "
        "suggest what the learner can ask their teacher. Do not invent curriculum facts.\n\n"
        f"Permitted context:\n{source or 'No permitted course material was selected.'}"
    )


def _offline_reply(role, source, message):
    """Provide a safe, useful guide when live AI is not configured.

    This is deliberately structured rather than pretending to be a generative
    answer. It only points the user back to material they are authorised to
    access and works without sending their data to an external provider.
    """
    question = message.strip()[:280]
    if source:
        first_line = source.splitlines()[0].strip()
        material_lines = [line.strip() for line in source.splitlines()[1:] if line.strip()]
        material_preview = ' '.join(material_lines)[:420]
        if role == 'teacher':
            return (
                f"Here is a course-based planning guide for {first_line}.\n\n"
                f"1. Identify the learning goal in this material: {material_preview or 'review the selected lesson.'}\n"
                "2. Teach one key idea, then model one short example.\n"
                "3. Ask learners for a quick written or spoken check before moving on.\n\n"
                f"For your request — “{question}” — start by choosing the one outcome you want learners to demonstrate."
            )
        if role == 'admin':
            return (
                f"Here is a course-review guide for {first_line}.\n\n"
                f"1. Check that the overview is clear: {material_preview or 'review the selected course material.'}\n"
                "2. Confirm that lessons, resources, and assessments support the same learning goal.\n"
                "3. Publish only after checking that learner instructions and due dates are complete.\n\n"
                f"For your request — “{question}” — use this checklist to decide the next platform action."
            )
        return (
            f"Let’s turn {first_line} into small study steps.\n\n"
            f"1. Read this key part slowly: {material_preview or 'review the selected lesson material.'}\n"
            "2. Write down three words or ideas you do not fully understand.\n"
            "3. Explain the main idea in your own two sentences, then compare it with the lesson.\n"
            "4. Make one example or practice question from the material.\n\n"
            f"For your question — “{question}” — share your first attempt and I can help you improve the steps."
        )

    prompts = {
        'student': "Choose a subject or lesson, then tell me the topic you want to study. I can help you make a short study plan, key-term list, or practice checklist.",
        'teacher': "Choose one of your courses or lessons, then tell me the learning outcome you are aiming for. I can help you structure the next teaching step.",
        'admin': "Choose a course or lesson, then tell me what you want to review. I can help you make a content and publishing checklist.",
    }
    return prompts.get(role, 'Choose a course or lesson, then tell me what you would like to work on.')


def _provider_reply(system_instruction, history):
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key or api_key.lower().startswith(('your_', 'replace-', 'placeholder')):
        return None
    payload = {
        'model': os.getenv('OPENAI_MODEL', 'gpt-4o-mini'),
        'temperature': 0.3,
        'max_tokens': 450,
        'messages': [{'role': 'system', 'content': system_instruction}, *history],
    }
    response = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
        json=payload,
        timeout=15,
    )
    response.raise_for_status()
    content = response.json()['choices'][0]['message']['content'].strip()
    if not content:
        raise ValueError('The provider returned an empty response.')
    return content[:4000]


class AIChatView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'ai_companion'

    def post(self, request):
        serializer = AIChatRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        message = data['message']

        if UNSAFE_REQUEST.search(message):
            return Response({
                'detail': 'Jua Companion cannot help with that request. Please speak with a trusted teacher, guardian, local professional, or emergency service if someone may be in immediate danger.'
            }, status=status.HTTP_400_BAD_REQUEST)

        conversation = None
        if data.get('conversation_id'):
            conversation = get_object_or_404(AIConversation, id=data['conversation_id'], user=request.user)

        subject, lesson, context_type, context_id, source = _context_from_request(request.user, data)
        if conversation and not source:
            subject, lesson = conversation.subject, conversation.lesson
            context_type, context_id = conversation.context_type, conversation.context_id
            if lesson:
                source = f"Lesson: {lesson.title}\nLesson material:\n{lesson.content[:6000]}"
            elif subject:
                source = f"Subject: {subject.name}\nCourse overview:\n{(subject.description or subject.content or '')[:3500]}"

        if not conversation:
            conversation = AIConversation.objects.create(
                user=request.user,
                title=message[:80],
                subject=subject,
                lesson=lesson,
                context_type=context_type,
                context_id=context_id,
            )

        client_message_id = data.get('client_message_id', '')
        existing = None
        if client_message_id:
            existing = AIMessage.objects.filter(
                conversation=conversation, client_message_id=client_message_id, role='user'
            ).first()
        if existing:
            answer = AIMessage.objects.filter(conversation=conversation, role='assistant', created_at__gte=existing.created_at).first()
            if answer:
                return Response({'conversation': AIConversationSerializer(conversation).data, 'message': AIMessageSerializer(answer).data})
            user_message = existing
        else:
            user_message = AIMessage.objects.create(
                conversation=conversation, role='user', content=message, client_message_id=client_message_id
            )

        previous_messages = list(conversation.messages.exclude(id=user_message.id).order_by('-created_at')[:6])
        history = [{'role': item.role, 'content': item.content[:1200]} for item in reversed(previous_messages)]
        history.append({'role': 'user', 'content': message})

        try:
            reply = _provider_reply(_system_instruction(request.user.role, source), history)
        except (requests.RequestException, KeyError, ValueError):
            logger.exception('Jua Companion provider request failed for user id=%s', request.user.id)
            # The companion should remain useful when a provider account is out of
            # credits, temporarily unavailable, or returns an unexpected payload.
            # Do not expose provider errors (which can include account details) to
            # the browser, and do not turn a recoverable upstream issue into a 500.
            reply = (
                "Live AI is temporarily unavailable, so I’m using your selected course material instead.\n\n"
                f"{_offline_reply(request.user.role, source, message)}"
            )

        assistant_message = AIMessage.objects.create(
            conversation=conversation,
            role='assistant',
            content=reply or _offline_reply(request.user.role, source, message),
        )
        conversation.save()  # Refresh its updated_at timestamp for the conversations list.
        return Response({'conversation': AIConversationSerializer(conversation).data, 'message': AIMessageSerializer(assistant_message).data})


class AIConversationListView(generics.ListAPIView):
    serializer_class = AIConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AIConversation.objects.filter(user=self.request.user).select_related('subject', 'lesson')


class AIConversationDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = AIConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return AIConversation.objects.filter(user=self.request.user).select_related('subject', 'lesson').prefetch_related('messages')
