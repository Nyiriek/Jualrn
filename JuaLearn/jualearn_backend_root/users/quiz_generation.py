"""Deterministic, reviewable question generation from a teacher's own course material."""

import re


def _first_item(value):
    return re.split(r'[,;]', value.strip())[0].strip(' .') if value else ''


def _field(content, label):
    match = re.search(rf'{label}:\s*(.+)', content or '', re.IGNORECASE)
    return match.group(1).strip() if match else ''


def build_question_drafts(subject, resources, lessons, limit=6):
    """Return multiple-choice and written-response drafts grounded in supplied content only."""
    sources = []
    for resource in resources:
        sources.append((resource.title, resource.description or '', resource.content or ''))
    for lesson in lessons:
        sources.append((lesson.title, '', lesson.content or ''))
    if not sources:
        sources.append((subject.name, subject.description or '', subject.content or ''))

    drafts = []
    all_focuses = [_field(content, 'Focus') or description for _, description, content in sources]
    for index, (title, description, content) in enumerate(sources):
        focus = _field(content, 'Focus') or description or title
        topic = _first_item(_field(content, 'Topics'))
        activity = _first_item(_field(content, 'Learning activities'))
        distractors = [item for item in all_focuses if item and item != focus][:3]
        defaults = ['A topic not covered in this course', 'An unrelated classroom routine', 'A different subject area']
        choices = (distractors + defaults)[:3]

        if focus:
            drafts.append({
                'type': 'multiple-choice',
                'text': f'According to “{title}”, what is the main learning focus?',
                'choices': [focus, *choices],
                'correct_index': 0,
            })
        if topic and len(drafts) < limit:
            drafts.append({
                'type': 'multiple-choice',
                'text': f'Which topic is included in “{title}”?',
                'choices': [topic, 'A topic not listed in the course material', 'An unrelated historical event', 'A different subject skill'],
                'correct_index': 0,
            })
        if len(drafts) < limit:
            prompt = f'Using the course material from “{title}”, explain {focus.lower() if focus else "one key idea"} in your own words.'
            if activity:
                prompt += f' Include an example connected to this suggested activity: {activity}.'
            drafts.append({
                'type': 'short-answer',
                'text': prompt,
                'choices': [],
                'correct_index': None,
                'answer_key': focus,
            })
        if len(drafts) >= limit:
            break
    return drafts[:limit]
