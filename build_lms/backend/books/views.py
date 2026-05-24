from django.contrib.auth.models import User
from django.utils       import timezone
from datetime           import date, timedelta
from datetime           import datetime
import random
import string

from django.core.mail import send_mail
from django.conf import settings as django_settings

from rest_framework.views       import APIView
from rest_framework.response    import Response
from rest_framework             import status
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models       import Book, Member, BorrowRecord, EmailVerification, KnowledgeBase, ChatMessage
from .serializers  import (
    RegisterSerializer, UserSerializer, BookSerializer,
    MemberSerializer, BorrowRecordSerializer,
)


def _generate_pin():
    return ''.join(random.choices(string.digits, k=6))


# ─── Auth ─────────────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = []

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)
        user = s.save()

        # Deactivate until PIN verified
        user.is_active = False
        user.save()

        # Generate & store PIN (expires in 30 minutes)
        pin = _generate_pin()
        EmailVerification.objects.filter(user=user).delete()
        EmailVerification.objects.create(
            user=user,
            pin=pin,
            expires_at=timezone.now() + timedelta(minutes=30),
        )

        # Send email
        try:
            send_mail(
                subject='Librarium – Your Activation PIN',
                message=(
                    f"Hi {user.first_name or user.username},\n\n"
                    f"Your 6-digit activation PIN is:\n\n"
                    f"  {pin}\n\n"
                    f"Enter this PIN in the app to activate your account.\n"
                    f"It expires in 30 minutes.\n\n"
                    f"— Librarium Team"
                ),
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
            email_sent = True
        except Exception as e:
            email_sent = False
            print(f"[EMAIL ERROR] {e}")
            print(f"[DEBUG] PIN for {user.email}: {pin}")

        return Response({
            'message': 'Account created. Check your email for a 6-digit PIN.',
            'email_sent': email_sent,
            'email': user.email,
        }, status=201)


class RequestPINView(APIView):
    """Re-sends activation PIN to the registered email."""
    permission_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with that email.'}, status=404)

        if user.is_active:
            return Response({'error': 'Account is already active. Please log in.'}, status=400)

        pin = _generate_pin()
        EmailVerification.objects.filter(user=user).delete()
        EmailVerification.objects.create(
            user=user,
            pin=pin,
            expires_at=timezone.now() + timedelta(minutes=30),
        )

        try:
            send_mail(
                subject='Librarium – New Activation PIN',
                message=(
                    f"Hi {user.first_name or user.username},\n\n"
                    f"Your new 6-digit activation PIN is:\n\n"
                    f"  {pin}\n\n"
                    f"It expires in 30 minutes.\n\n"
                    f"— Librarium Team"
                ),
                from_email=django_settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
            print(f"[DEBUG] PIN for {user.email}: {pin}")

        return Response({'message': 'A new PIN has been sent to your email.'})


class VerifyPINView(APIView):
    """Checks the 6-digit PIN and activates the user account."""
    permission_classes = []

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        pin   = request.data.get('pin', '').strip()

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'No account found with that email.'}, status=404)

        if user.is_active:
            return Response({'error': 'Account is already active.'}, status=400)

        try:
            ev = EmailVerification.objects.get(user=user)
        except EmailVerification.DoesNotExist:
            return Response({'error': 'No PIN found. Please request a new one.'}, status=404)

        if not ev.is_valid():
            return Response({'error': 'PIN has expired. Please request a new one.'}, status=400)

        if ev.pin != pin:
            return Response({'error': 'Incorrect PIN. Please try again.'}, status=400)

        # Activate
        user.is_active = True
        user.save()
        ev.delete()

        return Response({'message': 'Account activated! You can now log in.'})


class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        from django.contrib.auth import authenticate
        from rest_framework_simplejwt.tokens import RefreshToken

        email    = request.data.get('email', '').strip()
        password = request.data.get('password', '')

        try:
            user_obj = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=401)

        # NEW: block inactive (unverified) accounts
        if not user_obj.is_active:
            return Response({
                'error': 'Account not yet activated. Please verify your email with the PIN sent during registration.',
                'not_activated': True,
                'email': user_obj.email,
            }, status=403)

        user = authenticate(username=user_obj.username, password=password)
        if not user:
            return Response({'error': 'Invalid credentials'}, status=401)

        refresh = RefreshToken.for_user(user)
        from .serializers import UserDetailSerializer
        return Response({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user':    UserDetailSerializer(user).data,
        })



class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh_token = request.data.get('refresh')
            if refresh_token:
                try:
                    token = RefreshToken(refresh_token)
                    token.blacklist()
                except Exception:
                    pass  # Token may already be invalid/blacklisted
            return Response({'message': 'Logged out successfully'})
        except Exception as e:
            return Response({'message': 'Logged out'})


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import UserDetailSerializer
        return Response(UserDetailSerializer(request.user).data)

    def patch(self, request):
        data = request.data
        user = request.user

        for field in ('first_name', 'last_name'):
            if field in data:
                setattr(user, field, data[field])
        user.save()

        # Update member profile fields if present
        member_fields = ('phone', 'bio', 'address', 'birthday', 'member_type', 'photo_b64')
        if any(f in data for f in member_fields):
            try:
                member = user.member_profile
                for field in member_fields:
                    if field in data:
                        setattr(member, field, data[field])
                if 'birthday' in data and data['birthday']:
                    try:
                        member.birthday = datetime.strptime(data['birthday'], '%Y-%m-%d').date()
                    except ValueError:
                        pass
                elif 'birthday' in data and not data['birthday']:
                    member.birthday = None
                member.save()
            except Member.DoesNotExist:
                pass

        from .serializers import UserDetailSerializer
        return Response(UserDetailSerializer(user).data)


# ─── Books ────────────────────────────────────────────────────────────────────

class BookListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Book.objects.all()
        search = request.query_params.get('search', '')
        genre  = request.query_params.get('genre', '')
        avail  = request.query_params.get('available', '')

        if search:
            from django.db.models import Q
            qs = qs.filter(Q(title__icontains=search) | Q(author__icontains=search) | Q(isbn__icontains=search))
        if genre:
            qs = qs.filter(genre=genre)
        if avail:
            qs = qs.filter(available_copies__gt=0)

        return Response(BookSerializer(qs, many=True).data)

    def post(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        s = BookSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


class BookDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Book.objects.get(pk=pk)
        except Book.DoesNotExist:
            return None

    def get(self, request, pk):
        book = self.get_object(pk)
        if not book:
            return Response({'error': 'Not found'}, status=404)

        # Mark overdue
        active = book.borrow_records.filter(status='borrowed', due_date__lt=date.today())
        active.update(status='overdue')

        # Borrow history — admin sees all, member sees own
        records = book.borrow_records.select_related('member__user').all()
        if not request.user.is_staff:
            records = records.filter(member__user=request.user)

        # user_borrow: the current user's active borrow for this book (like your book_detail view)
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
            'book':       BookSerializer(book).data,
            'records':    BorrowRecordSerializer(records, many=True).data,
            'user_borrow': user_borrow,
        })

    def patch(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        book = self.get_object(pk)
        if not book:
            return Response({'error': 'Not found'}, status=404)
        s = BookSerializer(book, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    def delete(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        book = self.get_object(pk)
        if not book:
            return Response({'error': 'Not found'}, status=404)
        book.delete()
        return Response(status=204)


# ── Members (admin only) ──────────────────────────────────────────────────────

class MemberListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        qs = Member.objects.select_related('user').all()
        return Response(MemberSerializer(qs, many=True).data)

    def post(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        s = MemberSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


class MemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        try:
            return Member.objects.select_related('user').get(pk=pk)
        except Member.DoesNotExist:
            return None

    def get(self, request, pk):
        # Admin can view any; member can only view their own
        member = self.get_object(pk)
        if not member:
            return Response({'error': 'Not found'}, status=404)
        if not request.user.is_staff and member.user != request.user:
            return Response({'error': 'Forbidden'}, status=403)
        return Response(MemberSerializer(member).data)

    def patch(self, request, pk):
        member = self.get_object(pk)
        if not member:
            return Response({'error': 'Not found'}, status=404)
        if not request.user.is_staff and member.user != request.user:
            return Response({'error': 'Forbidden'}, status=403)
        s = MemberSerializer(member, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)

    def delete(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        member = self.get_object(pk)
        if not member:
            return Response({'error': 'Not found'}, status=404)
        member.delete()
        return Response(status=204)


# ── Borrow Records ────────────────────────────────────────────────────────────

class BorrowListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Update overdue status
        BorrowRecord.objects.filter(status='borrowed', due_date__lt=date.today()).update(status='overdue')

        if request.user.is_staff:
            qs = BorrowRecord.objects.select_related('book', 'member__user').all()
        else:
            # Members only see their own records
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
        book_id = request.data.get('book')
        notes   = request.data.get('notes', '')

        if not book_id:
            return Response({'error': 'Book ID is required.'}, status=400)

        # Verify book exists and is available
        try:
            book = Book.objects.get(pk=book_id)
        except Book.DoesNotExist:
            return Response({'error': 'Book not found.'}, status=404)

        if book.available_copies <= 0:
            return Response({'error': f'"{book.title}" is currently unavailable — all copies are checked out.'}, status=400)

        # Get member
        if not request.user.is_staff:
            try:
                member = request.user.member_profile
            except Member.DoesNotExist:
                return Response({'error': 'No member profile linked to your account.'}, status=400)

            # Check for existing active borrow
            already = BorrowRecord.objects.filter(
                book=book, member=member,
                status__in=['pending', 'borrowed', 'overdue']
            ).exists()
            if already:
                return Response({'error': f'You already have a pending or active borrow for "{book.title}".'}, status=400)
        else:
            # Admin creating a borrow — member must be specified
            member_id = request.data.get('member')
            if not member_id:
                return Response({'error': 'Member ID is required for admin borrows.'}, status=400)
            try:
                member = Member.objects.get(pk=member_id)
            except Member.DoesNotExist:
                return Response({'error': 'Member not found.'}, status=404)

        # Create borrow record directly
        today    = date.today()
        due_date = today + timedelta(days=14)

        record = BorrowRecord(
            book=book,
            member=member,
            borrow_date=today,
            due_date=due_date,
            notes=notes,
            status='pending',
        )
        record.save()

        # Admin borrows are auto-approved
        if request.user.is_staff:
            record.status = 'borrowed'
            book.available_copies -= 1
            book.save()
            record.save()

        return Response(BorrowRecordSerializer(record).data, status=201)


class BorrowRecordDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            record = BorrowRecord.objects.select_related('book', 'member__user').get(pk=pk)
            # Members can only access their own records
            if not user.is_staff and record.member.user != user:
                return None
            return record
        except BorrowRecord.DoesNotExist:
            return None

    def get(self, request, pk):
        record = self.get_object(pk, request.user)
        if not record:
            return Response({'error': 'Not found'}, status=404)
        return Response(BorrowRecordSerializer(record).data)

    def patch(self, request, pk):
        record = self.get_object(pk, request.user)
        if not record:
            return Response({'error': 'Not found'}, status=404)
        s = BorrowRecordSerializer(record, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=400)


class ApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        try:
            record = BorrowRecord.objects.select_related('book').get(pk=pk)
        except BorrowRecord.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if record.status != 'pending':
            return Response({'error': f'Cannot approve a record with status "{record.status}".'}, status=400)

        s = BorrowRecordSerializer(record, data=request.data, partial=True)
        if not s.is_valid():
            pass
        record.status = 'borrowed'
        if 'due_date' in request.data:
            record.due_date = s.validated_data['due_date']
        if 'admin_notes' in request.data:
            record.admin_notes = s.validated_data['admin_notes']
        record.book.available_copies -= 1
        record.book.save()
        record.save()
        return Response(BorrowRecordSerializer(record).data)


class RejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        try:
            record = BorrowRecord.objects.select_related('book').get(pk=pk)
        except BorrowRecord.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if record.status not in ('pending',):
            return Response({'error': f'Cannot reject a record with status "{record.status}".'}, status=400)

        s = BorrowRecordSerializer(record, data=request.data, partial=True)
        if not s.is_valid():
            pass
        record.status = 'rejected'
        if 'admin_notes' in request.data:
            record.admin_notes = request.data['admin_notes']
        record.save()
        return Response(BorrowRecordSerializer(record).data)


class ReturnView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        try:
            record = BorrowRecord.objects.select_related('book').get(pk=pk)
        except BorrowRecord.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        if record.status not in ('borrowed', 'overdue'):
            return Response({'error': f'Cannot return a record with status "{record.status}".'}, status=400)

        s = BorrowRecordSerializer(record, data=request.data, partial=True)
        if not s.is_valid():
            pass
        record.status = 'returned'
        record.return_date = date.today()
        if 'notes' in request.data:
            record.notes = request.data['notes']
        record.book.available_copies += 1
        record.book.save()
        record.save()
        return Response(BorrowRecordSerializer(record).data)


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        BorrowRecord.objects.filter(status='borrowed', due_date__lt=date.today()).update(status='overdue')

        if request.user.is_staff:
            total_books     = Book.objects.count()
            available_books = Book.objects.filter(available_copies__gt=0).count()
            total_members   = Member.objects.count()
            active_borrows  = BorrowRecord.objects.filter(status__in=['borrowed', 'overdue']).count()
            overdue_count   = BorrowRecord.objects.filter(status='overdue').count()
            pending_count   = BorrowRecord.objects.filter(status='pending').count()
            returned_count  = BorrowRecord.objects.filter(status='returned').count()

            return Response({
                'total_books':     total_books,
                'available_books': available_books,
                'total_members':   total_members,
                'active_borrows':  active_borrows,
                'overdue_count':   overdue_count,
                'pending_count':   pending_count,
                'returned_count':  returned_count,
            })
        else:
            try:
                member = request.user.member_profile
                my_active   = BorrowRecord.objects.filter(member=member, status__in=['borrowed', 'overdue']).count()
                my_overdue  = BorrowRecord.objects.filter(member=member, status='overdue').count()
                my_pending  = BorrowRecord.objects.filter(member=member, status='pending').count()
                my_returned = BorrowRecord.objects.filter(member=member, status='returned').count()
            except Member.DoesNotExist:
                my_active = my_overdue = my_pending = my_returned = 0

            total_books     = Book.objects.count()
            available       = Book.objects.filter(available_copies__gt=0).count()

            return Response({
                'my_active':       my_active,
                'my_overdue':      my_overdue,
                'my_pending':      my_pending,
                'my_returned':     my_returned,
                'total_books':     total_books,
                'available_books': available,
            })


# ── Toggle Member Active (admin only) ────────────────────────────────────────

class ToggleActiveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_staff:
            return Response({'error': 'Admin only'}, status=403)
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        if user.is_staff:
            return Response({'error': 'Cannot toggle admin accounts'}, status=400)
        user.is_active = not user.is_active
        user.save()
        return Response({'is_active': user.is_active, 'message': f"Account {'activated' if user.is_active else 'deactivated'}."})


# ── Chatbot ───────────────────────────────────────────────────────────────────

class ChatbotView(APIView):
    """POST /api/chatbot/ — sends message to Ollama, saves chat history."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        msgs = ChatMessage.objects.all().order_by('created_at')
        from .serializers import ChatMessageSerializer
        return Response(ChatMessageSerializer(msgs, many=True).data)

    def post(self, request):
        import requests as http_req
        user_message = request.data.get('message', '').strip()
        if not user_message:
            return Response({'error': 'Message is required.'}, status=400)

        # Save user message
        user_chat = ChatMessage.objects.create(role='user', message=user_message)

        # Build context from KnowledgeBase
        context = ""
        for item in KnowledgeBase.objects.all():
            if item.text_content:
                context += item.text_content + "\n"

        prompt = f"""You are LibraBot, a helpful assistant for Librarium — a Library Management System.

Library Knowledge:
{context if context else "No extra knowledge loaded yet."}

Answer the user's question helpfully and concisely. Keep replies short.

User: {user_message}
Assistant:"""

        try:
            response = http_req.post(
                "http://localhost:11434/api/generate",
                json={"model": "qwen2.5:0.5b", "prompt": prompt, "stream": False},
                timeout=30,
            )
            response.raise_for_status()
            ai_response = response.json().get("response", "Sorry, I could not generate a response.")
        except Exception as e:
            # Ollama not running — give a helpful fallback response
            ai_response = (
                "I'm currently offline. To enable AI responses:\n\n"
                "1. Install Ollama from ollama.com\n"
                "2. Run: ollama pull qwen2.5:0.5b\n"
                "3. Run: ollama run qwen2.5:0.5b\n\n"
                "In the meantime, here are quick answers:\n"
                "• To borrow: go to Books tab → tap Borrow\n"
                "• Borrow period: 14 days (set by admin)\n"
                "• To return: bring book back, admin marks it returned\n"
                "• Overdue: past due date, contact admin"
            )

        # Save AI response
        ai_chat = ChatMessage.objects.create(role='assistant', message=ai_response)

        from .serializers import ChatMessageSerializer
        return Response({
            "user":      ChatMessageSerializer(user_chat).data,
            "assistant": ChatMessageSerializer(ai_chat).data,
        }, status=201)


class KnowledgeBaseView(APIView):
    """GET/POST /api/chatbot/knowledge/ — manage chatbot knowledge base."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .serializers import KnowledgeBaseSerializer
        items = KnowledgeBase.objects.all()
        return Response(KnowledgeBaseSerializer(items, many=True).data)

    def post(self, request):
        from .serializers import KnowledgeBaseSerializer
        s = KnowledgeBaseSerializer(data=request.data)
        if s.is_valid():
            s.save()
            return Response(s.data, status=201)
        return Response(s.errors, status=400)


