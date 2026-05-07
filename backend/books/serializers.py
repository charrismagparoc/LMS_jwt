# LOCATION: backend/books/serializers.py

from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta, date
from .models import Book, Member, BorrowRecord


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class RegisterSerializer(serializers.Serializer):
    """Self-registration — creates a User + Member profile. Email is required and used for login."""
    email      = serializers.EmailField()
    password   = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(max_length=150)
    last_name  = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    phone      = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def create(self, validated_data):
        import re, uuid
        # Auto-generate username from email local part
        base = re.sub(r'[^a-z0-9]', '', validated_data['email'].split('@')[0].lower()) or 'user'
        username = base
        if User.objects.filter(username=username).exists():
            username = base + '_' + uuid.uuid4().hex[:6]
        user = User.objects.create_user(
            username   = username,
            password   = validated_data['password'],
            first_name = validated_data['first_name'],
            last_name  = validated_data.get('last_name', ''),
            email      = validated_data['email'],
            is_active  = False,
        )
        Member.objects.create(user=user, phone=validated_data.get('phone', ''))
        return user


class UserSerializer(serializers.ModelSerializer):
    role        = serializers.SerializerMethodField()
    member_id   = serializers.SerializerMethodField()
    member_type = serializers.SerializerMethodField()
    bio         = serializers.SerializerMethodField()
    photo_b64   = serializers.SerializerMethodField()
    address     = serializers.SerializerMethodField()
    birthday    = serializers.SerializerMethodField()
    phone       = serializers.SerializerMethodField()
    joined_at   = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'role', 'member_id',
            'member_type', 'bio', 'photo_b64',
            'address', 'birthday', 'phone', 'joined_at',
        ]

    def get_role(self, obj):
        return 'admin' if obj.is_staff else 'member'

    def get_member_id(self, obj):
        if hasattr(obj, 'member_profile'):
            return obj.member_profile.id
        return None

    def get_member_type(self, obj):
        if hasattr(obj, 'member_profile'):
            return obj.member_profile.member_type or ''
        return ''

    def get_bio(self, obj):
        if hasattr(obj, 'member_profile'):
            return obj.member_profile.bio or ''
        return ''

    def get_photo_b64(self, obj):
        if hasattr(obj, 'member_profile'):
            return obj.member_profile.photo_b64 or ''
        return ''

    def get_address(self, obj):
        if hasattr(obj, 'member_profile'):
            return obj.member_profile.address or ''
        return ''

    def get_birthday(self, obj):
        if hasattr(obj, 'member_profile'):
            b = obj.member_profile.birthday
            return str(b) if b else ''
        return ''

    def get_phone(self, obj):
        if hasattr(obj, 'member_profile'):
            return obj.member_profile.phone or ''
        return ''

    def get_joined_at(self, obj):
        if hasattr(obj, 'member_profile'):
            jt = obj.member_profile.joined_at
            return str(jt) if jt else ''
        return ''


class UpdateProfileSerializer(serializers.Serializer):
    first_name  = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name   = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email       = serializers.EmailField(required=False, allow_blank=True)
    member_type = serializers.CharField(max_length=50, required=False, allow_blank=True)
    bio         = serializers.CharField(required=False, allow_blank=True)
    photo_b64   = serializers.CharField(required=False, allow_blank=True)
    address     = serializers.CharField(required=False, allow_blank=True)
    birthday    = serializers.DateField(required=False, allow_null=True)
    phone       = serializers.CharField(max_length=20, required=False, allow_blank=True)


# ── Book ──────────────────────────────────────────────────────────────────────

class BookSerializer(serializers.ModelSerializer):
    is_available  = serializers.ReadOnlyField()
    genre_color   = serializers.SerializerMethodField()
    borrow_count  = serializers.SerializerMethodField()

    class Meta:
        model  = Book
        fields = [
            'id', 'title', 'author', 'isbn', 'genre',
            'total_copies', 'available_copies', 'published_year',
            'description', 'is_available', 'genre_color', 'borrow_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'available_copies']

    def get_genre_color(self, obj):
        return obj.genre_color()

    def get_borrow_count(self, obj):
        return obj.borrow_records.count()

    def validate_total_copies(self, value):
        if value < 1:
            raise serializers.ValidationError("Total copies must be at least 1.")
        return value

    def create(self, validated_data):
        validated_data['available_copies'] = validated_data['total_copies']
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'total_copies' in validated_data:
            diff = validated_data['total_copies'] - instance.total_copies
            new_avail = instance.available_copies + diff
            if new_avail < 0:
                raise serializers.ValidationError(
                    "Cannot reduce total copies below the number of currently borrowed books."
                )
            validated_data['available_copies'] = new_avail
        return super().update(instance, validated_data)


# ── Member ────────────────────────────────────────────────────────────────────

class MemberSerializer(serializers.ModelSerializer):
    username             = serializers.CharField(source='user.username')
    first_name           = serializers.CharField(source='user.first_name')
    last_name            = serializers.CharField(source='user.last_name', required=False, allow_blank=True)
    email                = serializers.EmailField(source='user.email')
    name                 = serializers.ReadOnlyField()
    active_borrows_count = serializers.ReadOnlyField()

    class Meta:
        model  = Member
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email',
            'phone', 'joined_at', 'name', 'active_borrows_count',
            'member_type', 'bio', 'photo_b64', 'profile_updated_at',
        ]
        read_only_fields = ['id', 'joined_at', 'profile_updated_at']

    def create(self, validated_data):
        user_data = validated_data.pop('user')
        password  = self.context['request'].data.get('password', 'library1234')
        user = User.objects.create_user(
            username   = user_data['username'],
            email      = user_data.get('email', ''),
            first_name = user_data.get('first_name', ''),
            last_name  = user_data.get('last_name', ''),
            password   = password,
        )
        return Member.objects.create(user=user, **validated_data)

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        for attr, value in user_data.items():
            setattr(instance.user, attr, value)
        instance.user.save()
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class MemberCreateSerializer(MemberSerializer):
    """Includes password field for creation."""
    password = serializers.CharField(write_only=True, required=False)

    class Meta(MemberSerializer.Meta):
        fields = MemberSerializer.Meta.fields + ['password']


# ── BorrowRecord ──────────────────────────────────────────────────────────────

class BorrowRecordSerializer(serializers.ModelSerializer):
    book_title   = serializers.CharField(source='book.title',   read_only=True)
    book_author  = serializers.CharField(source='book.author',  read_only=True)
    book_genre   = serializers.CharField(source='book.genre',   read_only=True)
    member_name  = serializers.CharField(source='member.name',  read_only=True)
    member_email = serializers.CharField(source='member.email', read_only=True)
    overdue_days    = serializers.ReadOnlyField()
    days_until_due  = serializers.ReadOnlyField()
    days_remaining  = serializers.ReadOnlyField()

    class Meta:
        model  = BorrowRecord
        fields = [
            'id', 'book', 'book_title', 'book_author', 'book_genre',
            'member', 'member_name', 'member_email',
            'borrow_date', 'due_date', 'return_date',
            'status', 'notes', 'admin_notes',
            'overdue_days', 'days_until_due', 'days_remaining', 'created_at',
        ]
        read_only_fields = ['id', 'status', 'return_date', 'borrow_date', 'created_at']

    def validate(self, data):
        book   = data.get('book')
        member = data.get('member')

        if self.instance is None:
            if book and not book.is_available:
                raise serializers.ValidationError(
                    f"'{book.title}' is currently unavailable — all copies are checked out."
                )
            if book and member:
                already = BorrowRecord.objects.filter(
                    book=book, member=member,
                    status__in=['pending', 'borrowed', 'overdue']
                ).exists()
                if already:
                    raise serializers.ValidationError(
                        f"{member.name} already has a pending or active borrow for '{book.title}'."
                    )

        due_date    = data.get('due_date')
        borrow_date = data.get('borrow_date', date.today())
        if due_date and due_date <= borrow_date:
            raise serializers.ValidationError("Due date must be after the borrow date.")

        return data

    def create(self, validated_data):
        if 'due_date' not in validated_data:
            validated_data['due_date'] = date.today() + timedelta(days=14)
        validated_data['status'] = 'pending'
        return super().create(validated_data)


class ReturnBookSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True, default='')


class ApproveBorrowSerializer(serializers.Serializer):
    due_date    = serializers.DateField(required=False)
    admin_notes = serializers.CharField(required=False, allow_blank=True, default='')


class RejectBorrowSerializer(serializers.Serializer):
    admin_notes = serializers.CharField(required=False, allow_blank=True, default='')