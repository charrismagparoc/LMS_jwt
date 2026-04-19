from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/login/',    views.LoginView.as_view(),    name='login'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/refresh/', views.RefreshView.as_view(),  name='refresh'),
    path('auth/me/',      views.MeView.as_view(),       name='me'),

    # Dashboard
    path('dashboard/', views.DashboardStatsView.as_view(), name='dashboard'),

    # Books
    path('books/',       views.BookListCreateView.as_view(), name='book-list'),
    path('books/<int:pk>/',          views.BookDetailView.as_view(),            name='book-detail'),
    path('books/<int:pk>/detail/',    views.BookDetailWithHistoryView.as_view(), name='book-detail-history'),

    # Members (admin)
    path('members/',          views.MemberListCreateView.as_view(), name='member-list'),
    path('members/<int:pk>/', views.MemberDetailView.as_view(),     name='member-detail'),

    # Borrow records
    path('borrows/',             views.BorrowRecordListCreateView.as_view(), name='borrow-list'),
    path('borrows/<int:pk>/',    views.BorrowRecordDetailView.as_view(),     name='borrow-detail'),
    path('borrows/<int:pk>/approve/', views.ApproveBorrowView.as_view(),     name='borrow-approve'),
    path('borrows/<int:pk>/reject/',  views.RejectBorrowView.as_view(),      name='borrow-reject'),
    path('borrows/<int:pk>/return/',  views.ReturnBookView.as_view(),        name='borrow-return'),
]
