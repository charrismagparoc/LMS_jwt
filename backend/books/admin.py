from django.contrib import admin
from .models import Book, Member, BorrowRecord

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'isbn', 'genre', 'total_copies', 'available_copies', 'created_at']
    search_fields = ['title', 'author', 'isbn']
    list_filter = ['genre']

@admin.register(Member)
class MemberAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'joined_at']
    search_fields = ['name', 'email']

@admin.register(BorrowRecord)
class BorrowRecordAdmin(admin.ModelAdmin):
    list_display = ['book', 'member', 'borrow_date', 'due_date', 'return_date', 'status']
    list_filter = ['status']
    search_fields = ['book__title', 'member__name']
