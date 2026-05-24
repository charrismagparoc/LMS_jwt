# LOCATION: backend/books/models.py

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta, date


class Book(models.Model):
    GENRE_CHOICES = [
        ('fiction',     'Fiction'),
        ('non_fiction', 'Non-Fiction'),
        ('science',     'Science'),
        ('history',     'History'),
        ('biography',   'Biography'),
        ('technology',  'Technology'),
        ('philosophy',  'Philosophy'),
        ('other',       'Other'),
    ]

    title           = models.CharField(max_length=255)
    author          = models.CharField(max_length=255)
    isbn            = models.CharField(max_length=20, unique=True)
    genre           = models.CharField(max_length=50, choices=GENRE_CHOICES, default='other')
    total_copies    = models.PositiveIntegerField(default=1)
    available_copies = models.PositiveIntegerField(default=1)
    published_year  = models.IntegerField(null=True, blank=True)
    description     = models.TextField(blank=True, default='')
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.author}"

    @property
    def is_available(self):
        return self.available_copies > 0

    def genre_color(self):
        return {
            'fiction':     '#a855f7',
            'non_fiction': '#14b8a6',
            'science':     '#3b82f6',
            'technology':  '#06b6d4',
            'history':     '#f97316',
            'biography':   '#ec4899',
            'mystery':     '#ef4444',
            'fantasy':     '#8b5cf6',
            'romance':     '#f43f5e',
        }.get(self.genre, '#64748b')

    class Meta:
        ordering = ['title']


class Member(models.Model):
    """Library member — linked 1-to-1 with a Django User for login."""
    user        = models.OneToOneField(User, on_delete=models.CASCADE, related_name='member_profile')
    phone       = models.CharField(max_length=20, blank=True, default='')
    joined_at   = models.DateTimeField(auto_now_add=True)

    # ── Profile fields saved by member, visible to admin ──────────────────
    member_type = models.CharField(max_length=50, blank=True, default='')
    bio         = models.TextField(blank=True, default='')
    photo_b64   = models.TextField(blank=True, default='')  # compressed base64 photo
    address     = models.TextField(blank=True, default='')
    birthday    = models.DateField(null=True, blank=True)
    profile_updated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.user.get_full_name() or self.user.username

    @property
    def name(self):
        return self.user.get_full_name() or self.user.username

    @property
    def email(self):
        return self.user.email

    @property
    def active_borrows_count(self):
        return self.borrow_records.filter(status__in=['borrowed', 'overdue']).count()

    class Meta:
        ordering = ['user__first_name']


class EmailVerification(models.Model):
    """Stores a 6-digit PIN for account activation."""
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_verification')
    pin        = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_valid(self):
        from django.utils import timezone
        return timezone.now() < self.expires_at

    def __str__(self):
        return f"PIN for {self.user.email}"


class BorrowRecord(models.Model):
    STATUS_CHOICES = [
        ('pending',  'Pending'),
        ('borrowed', 'Borrowed'),
        ('returned', 'Returned'),
        ('overdue',  'Overdue'),
        ('rejected', 'Rejected'),
    ]

    book        = models.ForeignKey(Book,   on_delete=models.PROTECT, related_name='borrow_records')
    member      = models.ForeignKey(Member, on_delete=models.PROTECT, related_name='borrow_records')
    borrow_date = models.DateField(default=date.today)
    due_date    = models.DateField()
    return_date = models.DateField(null=True, blank=True)
    status      = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes       = models.TextField(blank=True, default='')
    admin_notes = models.TextField(blank=True, default='')
    created_at  = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.due_date:
            self.due_date = date.today() + timedelta(days=14)
        if self.status == 'borrowed' and self.due_date < date.today():
            self.status = 'overdue'
        super().save(*args, **kwargs)

    @property
    def overdue_days(self):
        if self.status in ['borrowed', 'overdue'] and self.due_date < date.today():
            return (date.today() - self.due_date).days
        return 0

    @property
    def days_until_due(self):
        if self.status in ['borrowed', 'overdue']:
            return (self.due_date - date.today()).days
        return None

    @property
    def days_remaining(self):
        if self.status == 'returned':
            return 0
        diff = self.due_date - date.today()
        return max(0, diff.days)

    def __str__(self):
        return f"{self.member.name} — {self.book.title} ({self.status})"

    class Meta:
        ordering = ['-created_at']


# ── Chatbot Models ────────────────────────────────────────────────────────────
class KnowledgeBase(models.Model):
    title        = models.CharField(max_length=255)
    text_content = models.TextField(blank=True, null=True)
    created_at   = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['title']


class ChatMessage(models.Model):
    ROLE_CHOICES = (('user', 'User'), ('assistant', 'Assistant'))
    role       = models.CharField(max_length=20, choices=ROLE_CHOICES)
    message    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.role}] {self.message[:60]}"

    class Meta:
        ordering = ['created_at']
