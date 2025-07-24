#!/usr/bin/env bash
# This script is used to build the JuaLearn backend environment
set -o errexit # Exit on error

# Install dependencies
pip install -r requirements.txt
# Apply database migrations
python manage.py collectstatic --noinput
python manage.py migrate
