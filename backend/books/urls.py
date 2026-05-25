from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/login/',         views.LoginView.as_view(),      name='login'),
    path('auth/register/',      views.RegisterView.as_view(),   name='register'),
    path('auth/request-pin/',   views.RequestPINView.as_view(), name='request-pin'),
    path('auth/verify-pin/',    views.VerifyPINView.as_view(),  name='verify-pin'),
    path('auth/refresh/',       TokenRefreshView.as_view(),     name='refresh'),
    path('auth/logout/',        views.LogoutView.as_view(),     name='logout'),
    path('auth/me/',            views.MeView.as_view(),         name='me'),

    # Dashboard
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),

    # Books
    path('books/',          views.BookListCreateView.as_view(), name='book-list'),
    path('books/<int:pk>/', views.BookDetailView.as_view(),     name='book-detail'),

    # Members (admin)
    path('members/',                        views.MemberListCreateView.as_view(), name='member-list'),
    path('members/<int:pk>/',               views.MemberDetailView.as_view(),     name='member-detail'),
    path('members/<int:pk>/toggle-active/', views.ToggleActiveView.as_view(),     name='member-toggle-active'),

    # Borrow records
    path('borrows/',                  views.BorrowListCreateView.as_view(),      name='borrow-list'),
    path('borrows/<int:pk>/',         views.BorrowRecordDetailView.as_view(),    name='borrow-detail'),
    path('borrows/<int:pk>/approve/', views.ApproveView.as_view(),               name='borrow-approve'),
    path('borrows/<int:pk>/reject/',  views.RejectView.as_view(),                name='borrow-reject'),
    path('borrows/<int:pk>/return/',  views.ReturnView.as_view(),                name='borrow-return'),

    # Chatbot
    path('chatbot/',            views.ChatbotView.as_view(),      name='chatbot'),
    path('chatbot/knowledge/', views.KnowledgeBaseView.as_view(), name='knowledge'),
]
