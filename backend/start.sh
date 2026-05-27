#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Django server..."
gunicorn library_project.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 4 --timeout 120

