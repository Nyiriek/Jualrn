"""Create clear assignment drafts from a teacher's own course material."""

import re


def _field(content, label):
    match = re.search(rf'{label}:\s*(.+)', content or '', re.IGNORECASE)
    return match.group(1).strip() if match else ''


def _first_item(value):
    return re.split(r'[,;]', value.strip())[0].strip(' .') if value else ''


def build_assignment_draft(subject, resources, lessons):
    source = None
    if resources:
        source = resources[0]
        title = source.title
        content = source.content or ''
        description = source.description or ''
    elif lessons:
        source = lessons[0]
        title = source.title
        content = source.content or ''
        description = ''
    else:
        title = subject.name
        content = subject.content or ''
        description = subject.description or ''

    focus = _field(content, 'Focus') or description or title
    topics = _field(content, 'Topics')
    activity = _field(content, 'Learning activities')
    check = _field(content, 'Check for understanding')
    topic = _first_item(topics)
    activity = _first_item(activity)

    assignment_title = f'Apply your learning: {title}'
    instructions = [
        f'Learning goal: demonstrate your understanding of {focus}.',
        'Task: write a clear response in your own words. Use ideas from the course material and include at least one relevant example.',
    ]
    if topic:
        instructions.append(f'Your response should address this course topic: {topic}.')
    if activity:
        instructions.append(f'You may use this learning activity as a starting point: {activity}.')
    if check:
        instructions.append(f'Check your work before submitting: {check}')
    instructions.append('Success criteria: accurate ideas, a clear explanation, and evidence or an example from the course.')
    return {'title': assignment_title, 'description': '\n\n'.join(instructions)}
