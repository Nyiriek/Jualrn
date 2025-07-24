#!/usr/bin/env bash
# This script is used to build the JuaLearn backend environment
set -o errexit # Exit on error


# Load environment variables
if [ -f .env ]; then
   export $(cat .env | xargs)
else
   echo ".env file not found. Please create one with the necessary environment variables."
   exit 1
fi
# Check if required environment variables are set
if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ]; then
   echo "One or more database environment variables are not set. Please check your .env file."
   exit 1
fi
# Install dependencies
pip install -r requirements.txt
# Apply database migrations
python manage.py collectstatic --noinput
python manage.py migrate
# Create a superuser if it doesn't exist
if ! python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(is_superuser=True).exists()"; then
   echo "Creating superuser..."
   python manage.py createsuperuser --noinput --username admin --email






