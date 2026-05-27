#!/bin/bash
set -e

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start the server
gunicorn library_project.wsgi:application --bind 0.0.0.0:8000

