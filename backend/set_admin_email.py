"""
Quick helper — run once to give the admin account an email so they can log in.
Usage: python set_admin_email.py
"""
import os, django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'library_project.settings')
django.setup()

from django.contrib.auth.models import User

admin = User.objects.filter(is_superuser=True).first()
if not admin:
    print("No superuser found. Run: python manage.py createsuperuser")
else:
    if not admin.email:
        email = input(f"Enter email for admin '{admin.username}': ").strip()
        admin.email = email
        admin.save()
        print(f"✅ Email set to {email}. You can now log in with this email.")
    else:
        print(f"Admin '{admin.username}' already has email: {admin.email}")
        change = input("Change it? (y/n): ").strip().lower()
        if change == 'y':
            email = input("New email: ").strip()
            admin.email = email
            admin.save()
            print(f"✅ Updated to {email}")