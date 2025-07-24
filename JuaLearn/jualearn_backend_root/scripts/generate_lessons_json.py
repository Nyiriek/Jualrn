import os
import json

# Map filenames to subject names (adjust as needed)
FILENAME_TO_SUBJECT = {
    'math-secondary-4-complex-numbers.md': 'Mathematics Secondary 4',
    'chemistry-secondary-4-identification-of-ions-and-gases.md': 'Chemistry Secondary 4',
    'english-secondary-4-gender-issues.md': 'English Secondary 4',
}

LESSONS_DIR = '../content/lessons'
OUTPUT_FILE = '../content/lessons.json'

def generate_lessons_json():
    lessons = []

    for filename, subject_name in FILENAME_TO_SUBJECT.items():
        filepath = os.path.join(LESSONS_DIR, filename)
        if not os.path.isfile(filepath):
            print(f"Warning: {filepath} not found, skipping.")
            continue

        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract title from first markdown heading if possible, else use filename
        title = ''
        for line in content.splitlines():
            if line.startswith('# '):
                title = line.lstrip('# ').strip()
                break
        if not title:
            title = filename.replace('.md', '').replace('-', ' ').title()

        lesson_obj = {
            'subjectName': subject_name,
            'title': title,
            'content': content
        }
        lessons.append(lesson_obj)

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(lessons, f, indent=2)

    print(f"Generated {len(lessons)} lessons in {OUTPUT_FILE}")

if __name__ == '__main__':
    generate_lessons_json()
