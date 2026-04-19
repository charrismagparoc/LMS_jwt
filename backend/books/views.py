from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from datetime import date, datetime  # ← added datetime
from .models import Book, Member, BorrowRecord
from .serializers import (
    BookSerializer, MemberSerializer, MemberCreateSerializer,
    BorrowRecordSerializer, ReturnBookSerializer,
    ApproveBorrowSerializer, RejectBorrowSerializer,
    UserSerializer, RegisterSerializer,
)


# ── Permissions ───────────────────────────────────────────────────────────────

class IsAdmin(IsAuthenticated):
    def has_permission(self, request, view):
        return super().has_permission(request, view) and request.user.is_staff


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # AFTER: authenticate by email instead of username
        email    = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        if not email or not password:
            return Response({'error': 'Email and password are required.'}, status=400)

        try:
            user_obj = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid email or password.'}, status=401)

        user = authenticate(username=user_obj.username, password=password)
        if not user:
            return Response({'error': 'Invalid email or password.'}, status=401)
        if not user.is_active:
            return Response({'error': 'This account is disabled.'}, status=403)

        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        })


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('refresh')
        if not token:
            return Response({'error': 'Refresh token required.'}, status=400)
        try:
            refresh = RefreshToken(token)
            return Response({'access': str(refresh.access_token)})
        except Exception:
            return Response({'error': 'Invalid or expired refresh token.'}, status=401)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)
        user    = s.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserSerializer(user).data,
        }, status=201)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        data = request.data

        # Update User fields
        for field in ['first_name', 'last_name', 'email']:
            if field in data:
                setattr(user, field, data[field])
        user.save()

        # Update Member profile fields
        if hasattr(user, 'member_profile'):
            member = user.member_profile
            # AFTER: added 'address' and 'phone', plus birthday handling
            for field in ['member_type', 'bio', 'photo_b64', 'address', 'phone']:
                if field in data:
                    setattr(member, field, data[field])
            if 'birthday' in data and data['birthday']:
                member.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
            from django.utils import timezone
            member.profile_updated_at = timezone.now()
            member.save()

        return Response(UserSerializer(user).data)


# ── Books (public read, admin write) ─────────────────────────────────────────

class BookListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get(self, request):
        qs = Book.objects.all()
        search    = request.query_params.get('search', '')
        genre     = request.query_params.get('genre', '')
        available = request.query_params.get('available', '')
        if search:
            qs = qs.filter(Q(title__icontains=search) | Q(author__icontains=search) | Q(isbn__icontains=search))
        if genre:
            qs = qs.filter(genre=genre)
        if available == 'true':
            qs = qs.filter(available_copies__gt=0)
        return Response(BookSerializer(qs, many=True).data)

    def post(self, request):
        s = BookSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


class BookDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAuthenticated()]
        return [IsAdmin()]

    def get_object(self, pk):
        try:
            return Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return None

    def get(self, request, pk):
        book = self.get_object(pk)
        if not book:
            return Response({'error': 'Book not found.'}, status=404)
        return Response(BookSerializer(book).data)

    def put(self, request, pk):
        book = self.get_object(pk)
        if not book:
            return Response({'error': 'Book not found.'}, status=404)
        s = BookSerializer(book, data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    def patch(self, request, pk):
        book = self.get_object(pk)
        if not book:
            return Response({'error': 'Book not found.'}, status=404)
        s = BookSerializer(book, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    def delete(self, request, pk):
        book = self.get_object(pk)
        if not book:
            return Response({'error': 'Book not found.'}, status=404)
        active = book.borrow_records.filter(status__in=['borrowed', 'overdue', 'pending']).count()
        if active:
            return Response({'error': f'Cannot delete — {active} active borrow(s) exist.'}, status=400)
        book.delete()
        return Response({'message': 'Book deleted.'})


class BookDetailWithHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            book = Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found.'}, status=404)

        active = book.borrow_records.filter(status='borrowed', due_date__lt=date.today())
        active.update(status='overdue')

        records = book.borrow_records.select_related('member__user').all()
        if not request.user.is_staff:
            records = records.filter(member__user=request.user)

        user_borrow = None
        if not request.user.is_staff:
            try:
                user_borrow_qs = book.borrow_records.filter(
                    member__user=request.user,
                    status__in=['borrowed', 'overdue', 'pending']
                ).first()
                if user_borrow_qs:
                    user_borrow = BorrowRecordSerializer(user_borrow_qs).data
            except Exception:
                pass

        return Response({
            'book':        BookSerializer(book).data,
            'records':     BorrowRecordSerializer(records, many=True).data,
            'user_borrow': user_borrow,
        })


# ── Members (admin only) ──────────────────────────────────────────────────────

class MemberListCreateView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = Member.objects.select_related('user').all()
        search = request.query_params.get('search', '')
        if search:
            qs = qs.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search)  |
                Q(user__email__icontains=search)       |
                Q(user__username__icontains=search)
            )
        return Response(MemberSerializer(qs, many=True).data)

    def post(self, request):
        s = MemberCreateSerializer(data=request.data, context={'request': request})
        if s.is_valid():
            s.save()
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


class MemberDetailView(APIView):
    permission_classes = [IsAdmin]

    def get_object(self, pk):
        try:
            return Member.objects.select_related('user').get(pk=pk)
        except Member.DoesNotExist:
            return None

    def get(self, request, pk):
        m = self.get_object(pk)
        if not m:
            return Response({'error': 'Member not found.'}, status=404)
        return Response(MemberSerializer(m).data)

    def put(self, request, pk):
        m = self.get_object(pk)
        if not m:
            return Response({'error': 'Member not found.'}, status=404)
        s = MemberSerializer(m, data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    def patch(self, request, pk):
        m = self.get_object(pk)
        if not m:
            return Response({'error': 'Member not found.'}, status=404)
        s = MemberSerializer(m, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    def delete(self, request, pk):
        m = self.get_object(pk)
        if not m:
            return Response({'error': 'Member not found.'}, status=404)
        active = m.borrow_records.filter(status__in=['borrowed', 'overdue', 'pending']).count()
        if active:
            return Response({'error': f'Cannot delete — {active} active borrow(s) exist.'}, status=400)
        m.user.delete()
        return Response({'message': 'Member removed.'})


# ── Borrow Records ────────────────────────────────────────────────────────────

class BorrowRecordListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        BorrowRecord.objects.filter(status='borrowed', due_date__lt=date.today()).update(status='overdue')

        if request.user.is_staff:
            qs = BorrowRecord.objects.select_related('book', 'member__user').all()
        else:
            try:
                member = request.user.member_profile
                qs = BorrowRecord.objects.select_related('book', 'member__user').filter(member=member)
            except Member.DoesNotExist:
                return Response([])

        status_filter = request.query_params.get('status', '')
        book_id       = request.query_params.get('book', '')
        member_id     = request.query_params.get('member', '')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if book_id:
            qs = qs.filter(book_id=book_id)
        if member_id and request.user.is_staff:
            qs = qs.filter(member_id=member_id)

        return Response(BorrowRecordSerializer(qs, many=True).data)

    def post(self, request):
        data = request.data.copy()

        if not request.user.is_staff:
            try:
                member = request.user.member_profile
                data['member'] = member.id
            except Member.DoesNotExist:
                return Response({'error': 'No member profile linked to your account.'}, status=400)

        s = BorrowRecordSerializer(data=data)
        if s.is_valid():
            record = s.save()
            if request.user.is_staff:
                record.status = 'borrowed'
                record.book.available_copies -= 1
                record.book.save()
                record.save()
            return Response(BorrowRecordSerializer(record).data, status=201)
        return Response(s.errors, status=400)


class BorrowRecordDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            record = BorrowRecord.objects.select_related('book', 'member__user').get(pk=pk)
            if not user.is_staff and record.member.user != user:
                return None
            return record
        except BorrowRecord.DoesNotExist:
            return None

    def get(self, request, pk):
        record = self.get_object(pk, request.user)
        if not record:
            return Response({'error': 'Not found.'}, status=404)
        return Response(BorrowRecordSerializer(record).data)

    def delete(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Only admins can delete borrow records.'}, status=403)
        record = self.get_object(pk, request.user)
        if not record:
            return Response({'error': 'Not found.'}, status=404)
        if record.status in ['borrowed', 'overdue']:
            return Response({'error': 'Return the book first before deleting.'}, status=400)
        record.delete()
        return Response({'message': 'Record deleted.'})


class ApproveBorrowView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            record = BorrowRecord.objects.select_related('book').get(pk=pk)
        except BorrowRecord.DoesNotExist:
            return Response({'error': 'Record not found.'}, status=404)

        if record.status != 'pending':
            return Response({'error': f'Cannot approve — status is already "{record.status}".'}, status=400)
        if not record.book.is_available:
            return Response({'error': 'Book is no longer available.'}, status=400)

        s = ApproveBorrowSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        record.status = 'borrowed'
        if s.validated_data.get('due_date'):
            record.due_date = s.validated_data['due_date']
        if s.validated_data.get('admin_notes'):
            record.admin_notes = s.validated_data['admin_notes']
        record.book.available_copies -= 1
        record.book.save()
        record.save()
        return Response(BorrowRecordSerializer(record).data)


class RejectBorrowView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            record = BorrowRecord.objects.get(pk=pk)
        except BorrowRecord.DoesNotExist:
            return Response({'error': 'Record not found.'}, status=404)

        if record.status != 'pending':
            return Response({'error': f'Cannot reject — status is already "{record.status}".'}, status=400)

        s = RejectBorrowSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        record.status     = 'rejected'
        record.admin_notes = s.validated_data.get('admin_notes', '')
        record.save()
        return Response(BorrowRecordSerializer(record).data)


class ReturnBookView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            record = BorrowRecord.objects.select_related('book').get(pk=pk)
        except BorrowRecord.DoesNotExist:
            return Response({'error': 'Record not found.'}, status=404)

        if record.status not in ['borrowed', 'overdue']:
            return Response({'error': f'Cannot return — status is "{record.status}".'}, status=400)

        s = ReturnBookSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        record.return_date = date.today()
        record.status      = 'returned'
        if s.validated_data.get('notes'):
            record.notes = s.validated_data['notes']
        record.save()
        record.book.available_copies += 1
        record.book.save()
        return Response(BorrowRecordSerializer(record).data)


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        BorrowRecord.objects.filter(status='borrowed', due_date__lt=date.today()).update(status='overdue')

        if request.user.is_staff:
            return Response({
                'total_books':     Book.objects.count(),
                'available_books': Book.objects.filter(available_copies__gt=0).count(),
                'total_members':   Member.objects.count(),
                'active_borrows':  BorrowRecord.objects.filter(status='borrowed').count(),
                'overdue_count':   BorrowRecord.objects.filter(status='overdue').count(),
                'pending_count':   BorrowRecord.objects.filter(status='pending').count(),
                'returned_today':  BorrowRecord.objects.filter(return_date=date.today()).count(),
            })
        else:
            try:
                member = request.user.member_profile
                qs = BorrowRecord.objects.filter(member=member)
                return Response({
                    'my_active':       qs.filter(status='borrowed').count(),
                    'my_overdue':      qs.filter(status='overdue').count(),
                    'my_pending':      qs.filter(status='pending').count(),
                    'my_returned':     qs.filter(status='returned').count(),
                    'total_books':     Book.objects.count(),
                    'available_books': Book.objects.filter(available_copies__gt=0).count(),
                })
            except Member.DoesNotExist:
                return Response({'error': 'No member profile.'}, status=400)