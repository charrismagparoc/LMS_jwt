import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'library_project.settings')
django.setup()

from django.contrib.auth.models import User
from books.models import Book, Member, BorrowRecord
from datetime import date, timedelta

print("Seeding data...")

# ── Admin ──────────────────────────────────────────────────────
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@library.com', 'admin123')
    print("Created admin user")
else:
    print("Admin already exists")

# ── Books ──────────────────────────────────────────────────────
books_data = [
    {'title': 'The Great Gatsby',        'author': 'F. Scott Fitzgerald', 'isbn': '978-0743273565', 'genre': 'fiction',    'total_copies': 3, 'published_year': 1925, 'description': 'A story of the fabulously wealthy Jay Gatsby.'},
    {'title': 'To Kill a Mockingbird',   'author': 'Harper Lee',          'isbn': '978-0061935466', 'genre': 'fiction',    'total_copies': 2, 'published_year': 1960, 'description': 'A novel of childhood in a sleepy Southern town.'},
    {'title': 'A Brief History of Time', 'author': 'Stephen Hawking',     'isbn': '978-0553380163', 'genre': 'science',    'total_copies': 2, 'published_year': 1988, 'description': 'From the Big Bang to Black Holes.'},
    {'title': 'Clean Code',              'author': 'Robert C. Martin',    'isbn': '978-0132350884', 'genre': 'technology', 'total_copies': 3, 'published_year': 2008, 'description': 'A Handbook of Agile Software Craftsmanship.'},
    {'title': 'Sapiens',                 'author': 'Yuval Noah Harari',   'isbn': '978-0062316097', 'genre': 'history',    'total_copies': 2, 'published_year': 2011, 'description': 'A Brief History of Humankind.'},
    {'title': 'The Republic',            'author': 'Plato',               'isbn': '978-0140455113', 'genre': 'philosophy', 'total_copies': 1, 'published_year': None, 'description': "Plato's best-known work on justice."},
    {'title': 'Steve Jobs',              'author': 'Walter Isaacson',     'isbn': '978-1451648539', 'genre': 'biography',  'total_copies': 2, 'published_year': 2011, 'description': 'The exclusive biography of Steve Jobs.'},
]

books = []
for bd in books_data:
    b, created = Book.objects.get_or_create(isbn=bd['isbn'], defaults={**bd, 'available_copies': bd['total_copies']})
    books.append(b)
    if created:
        print(f"Created book: {b.title}")

# ── Members ────────────────────────────────────────────────────
members_data = [
    {'username': 'alice', 'first_name': 'Alice', 'last_name': 'Johnson', 'email': 'alice@example.com', 'phone': '+1-555-0101'},
    {'username': 'bob',   'first_name': 'Bob',   'last_name': 'Smith',   'email': 'bob@example.com',   'phone': '+1-555-0102'},
    {'username': 'carol', 'first_name': 'Carol', 'last_name': 'White',   'email': 'carol@example.com', 'phone': '+1-555-0103'},
    {'username': 'david', 'first_name': 'David', 'last_name': 'Lee',     'email': 'david@example.com', 'phone': '+1-555-0104'},
]

members = []
for md in members_data:
    phone = md.pop('phone')
    if not User.objects.filter(username=md['username']).exists():
        u = User.objects.create_user(password='member123', **md)
        m = Member.objects.create(user=u, phone=phone)
        print(f"Created member: {u.username}")
    else:
        u = User.objects.get(username=md['username'])
        m, _ = Member.objects.get_or_create(user=u, defaults={'phone': phone})
    members.append(m)

# ── Borrow records ─────────────────────────────────────────────
if BorrowRecord.objects.count() == 0:
    BorrowRecord.objects.create(
        book=books[0], member=members[0],
        borrow_date=date.today() - timedelta(days=5),
        due_date=date.today() + timedelta(days=9),
        status='borrowed'
    )
    books[0].available_copies -= 1; books[0].save()

    BorrowRecord.objects.create(
        book=books[1], member=members[1],
        borrow_date=date.today() - timedelta(days=20),
        due_date=date.today() - timedelta(days=6),
        status='overdue'
    )
    books[1].available_copies -= 1; books[1].save()

    BorrowRecord.objects.create(
        book=books[2], member=members[2],
        borrow_date=date.today() - timedelta(days=15),
        due_date=date.today() - timedelta(days=1),
        return_date=date.today() - timedelta(days=2),
        status='returned'
    )

    BorrowRecord.objects.create(
        book=books[3], member=members[3],
        borrow_date=date.today(),
        due_date=date.today() + timedelta(days=14),
        status='pending'
    )
    print("Created borrow records")

print("\n" + "="*50)
print("LOGIN CREDENTIALS")
print("  Admin  → admin / admin123")
print("  Member → alice / member123")
print("  Member → bob   / member123")
print("="*50)
print(f"\nBooks: {Book.objects.count()}")
print(f"Members: {Member.objects.count()}")
print(f"Borrow Records: {BorrowRecord.objects.count()}")
