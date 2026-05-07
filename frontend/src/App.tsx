import React, { useState, useEffect, useCallback } from 'react';
import {
  Tab, ModalType, Book, Member, BorrowRecord,
  AuthUser, AdminDashboardStats, MemberDashboardStats,
} from './types';
import {
  getBooks, createBook, updateBook,
  getMembers, createMember, updateMember,
  getBorrows, createBorrow, approveBorrow, rejectBorrow, returnBook,
  getDashboardStats,
} from './api';
import API from './api/books';

// Auth
import Login from './pages/Login';
import Register from './pages/Register';

// Components
import Sidebar from './components/Sidebar';
import Toast   from './components/Toast';

// Profile page
import ProfilePage from './pages/ProfilePage';

// Admin pages
import Dashboard   from './pages/Dashboard';
import Books       from './pages/Books';
import Members     from './pages/Members';
import Borrows     from './pages/Borrows';

// Member pages
import MemberDashboard from './pages/MemberDashboard';
import MemberBorrows   from './pages/MemberBorrows';

// Modals
import BookModal            from './modals/BookModal';
import MemberModal          from './modals/MemberModal';
import BorrowModal          from './modals/BorrowModal';
import ReturnModal          from './modals/ReturnModal';
import ApproveRejectModal   from './modals/ApproveRejectModal';
import BookDetailModal      from './modals/BookDetailModal';
import ProfileModal         from './modals/ProfileModal';
import MemberProfileModal   from './modals/MemberProfileModal';
import RulesModal           from './modals/RulesModal';

import './App.css';

function extractApiError(e: any, fallback: string): string {
  const err = e?.response?.data;
  if (!err) return e?.message || fallback;
  if (typeof err === 'string') return err;
  if (Array.isArray(err.non_field_errors)) return err.non_field_errors[0];
  if (err.detail) return String(err.detail);
  for (const key of ['due_date', 'book', 'member', 'notes', 'username', 'email']) {
    if (err[key]) {
      const val = Array.isArray(err[key]) ? err[key][0] : err[key];
      return `${key}: ${val}`;
    }
  }
  const first = Object.values(err)[0];
  if (first) return Array.isArray(first) ? String(first[0]) : String(first);
  return fallback;
}

export default function App() {
  // ── Auth state ────────────────────────────────────────────────
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // ── Theme ─────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved !== 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // ── Profile photo ─────────────────────────────────────────────
  const [profilePhoto, setProfilePhoto] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        return (u as any).photo_b64 || null;
      }
    } catch {}
    return null;
  });

  // ── Re-hydrate user from server on mount ──────────────────────
  useEffect(() => {
    if (!user) return;
    API.get('/auth/me/')
      .then((res: any) => {
        const fresh = res.data;
        const merged: AuthUser = { ...user, ...fresh } as any;
        setUser(merged);
        localStorage.setItem('user', JSON.stringify(merged));
        setProfilePhoto((fresh as any).photo_b64 || null);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Navigation ────────────────────────────────────────────────
  const [tab, setTab]                   = useState<Tab>('dashboard');
  const [showRegister, setShowRegister] = useState(false);
  const [viewBookId, setViewBookId]     = useState<number | null>(null);

  // ── Data ──────────────────────────────────────────────────────
  const [books,   setBooks]   = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [borrows, setBorrows] = useState<BorrowRecord[]>([]);
  const [stats,   setStats]   = useState<AdminDashboardStats | MemberDashboardStats | null>(null);
  const [loading, setLoading] = useState(false);

  // ── Modal ─────────────────────────────────────────────────────
  const [modal,    setModal]    = useState<ModalType>(null);
  const [selected, setSelected] = useState<any>(null);
  const [showProfile,       setShowProfile]       = useState(false);
  const [showRules,         setShowRules]         = useState(false);
  const [memberProfileData, setMemberProfileData] = useState<Member | null>(null);

  // ── Toast ─────────────────────────────────────────────────────
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  }, []);

  const handleLogin = (loggedUser: AuthUser, access: string, refresh: string) => {
    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);
    localStorage.setItem('user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    setProfilePhoto((loggedUser as any).photo_b64 || null);
    setTab('profile');   // ← redirect to Profile page after login
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setProfilePhoto(null);
    setBooks([]); setMembers([]); setBorrows([]); setStats(null);
  };

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const promises: Promise<any>[] = [getBooks(), getBorrows(), getDashboardStats()];
      if (user.role === 'admin') promises.push(getMembers());
      const results = await Promise.all(promises);
      setBooks(results[0].data);
      setBorrows(results[1].data);
      setStats(results[2].data);
      if (user.role === 'admin') setMembers(results[3].data);
    } catch (e: any) {
      if (e?.response?.status !== 401) {
        showToast('Failed to load data. Is the Django server running?', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => { if (user) loadAll(); }, [user, loadAll]);

  const openModal  = (type: ModalType, item: any = null) => { setSelected(item); setModal(type); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSaveBook = async (data: Partial<Book>) => {
    try {
      if (selected) { await updateBook(selected.id, data); showToast('Book updated!'); }
      else          { await createBook(data);               showToast('Book added!'); }
      closeModal(); loadAll();
    } catch (e: any) { throw new Error(extractApiError(e, 'Failed to save book.')); }
  };

  const handleSaveMember = async (data: Partial<Member>) => {
    try {
      if (selected) { await updateMember(selected.id, data); showToast('Member updated!'); }
      else          { await createMember(data);               showToast('Member added!'); }
      closeModal(); loadAll();
    } catch (e: any) { throw new Error(extractApiError(e, 'Failed to save member.')); }
  };

  const handleBorrow = async (data: any) => {
    try {
      await createBorrow(data);
      const msg = user?.role === 'admin' ? 'Book borrowed!' : 'Request submitted! Awaiting admin approval.';
      showToast(msg);
      closeModal(); loadAll();
    } catch (e: any) { throw new Error(extractApiError(e, 'Failed to submit borrow.')); }
  };

  const handleApprove = async (dueDate: string, notes: string) => {
    try {
      await approveBorrow(selected.id, { due_date: dueDate, admin_notes: notes });
      showToast('Borrow request approved!');
      closeModal(); loadAll();
    } catch (e: any) { throw new Error(extractApiError(e, 'Failed to approve.')); }
  };

  const handleReject = async (notes: string) => {
    try {
      await rejectBorrow(selected.id, notes);
      showToast('Request rejected.');
      closeModal(); loadAll();
    } catch (e: any) { throw new Error(extractApiError(e, 'Failed to reject.')); }
  };

  const handleReturn = async (notes: string) => {
    try {
      await returnBook(selected.id, notes);
      showToast('Book returned successfully!');
      closeModal(); loadAll();
    } catch (e: any) { throw new Error(extractApiError(e, 'Failed to return book.')); }
  };

  const handleProfileSaved = (updated: AuthUser, photoUrl?: string) => {
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
    const photo = photoUrl !== undefined ? (photoUrl || null) : ((updated as any).photo_b64 || null);
    setProfilePhoto(photo);
    setShowProfile(false);
    showToast('Profile updated!');
  };

  if (!user) {
    if (showRegister) {
      return (
        <Register
          onRegister={() => {
            showToast('Registration successful! Check your email to activate your account.', 'success');
            setShowRegister(false);
          }}
          onGoLogin={() => setShowRegister(false)}
        />
      );
    }
    return <Login onLogin={handleLogin} onGoRegister={() => setShowRegister(true)} />;
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="app">
      <Sidebar
        tab={tab}
        user={user}
        stats={stats}
        photoUrl={profilePhoto}
        isDark={isDark}
        onTabChange={(t: Tab) => setTab(t)}
        onRefresh={loadAll}
        onLogout={handleLogout}
        onOpenProfile={() => setShowProfile(true)}
        onOpenRules={() => setShowRules(true)}
        onToggleTheme={() => setIsDark((d: boolean) => !d)}
      />

      <main className={`main${tab === 'dashboard' ? ' dashboard-main' : ''}`}>
        {loading && <div className="loading-bar" />}

        {isAdmin && tab === 'dashboard' && stats && (
          <Dashboard stats={stats as AdminDashboardStats} books={books} borrows={borrows} />
        )}
        {isAdmin && tab === 'books' && (
          <Books
            books={books}
            onAdd={() => openModal('addBook')}
            onEdit={(b: Book) => openModal('editBook', b)}
            onBorrow={(b: Book) => openModal('borrowBook', b)}
            onViewDetail={(b: Book) => setViewBookId(b.id)}
            onDeleted={(msg: string) => { showToast(msg); loadAll(); }}
            onError={(msg: string) => showToast(msg, 'error')}
          />
        )}
        {isAdmin && tab === 'members' && (
          <Members
            members={members}
            borrows={borrows}
            onAdd={() => openModal('addMember')}
            onEdit={(m: Member) => openModal('editMember', m)}
            onProfile={(m: Member) => setMemberProfileData(m)}
            onDeleted={(msg: string) => { showToast(msg); loadAll(); }}
            onError={(msg: string) => showToast(msg, 'error')}
          />
        )}
        {tab === 'profile' && user && (
          <ProfilePage
            user={user}
            onSaved={(updated, photo) => {
              setUser(updated);
              setProfilePhoto(photo || (updated as any).photo_b64 || null);
              localStorage.setItem('user', JSON.stringify(updated));
              showToast('Profile updated!');
            }}
          />
        )}

        {isAdmin && tab === 'borrows' && (
          <Borrows
            borrows={borrows}
            onAdd={() => openModal('borrowBook')}
            onReturn={(r: BorrowRecord) => openModal('returnBook', r)}
            onApproveReject={(r: BorrowRecord) => openModal('approveReject', r)}
            onDeleted={(msg: string) => { showToast(msg); loadAll(); }}
            onError={(msg: string) => showToast(msg, 'error')}
          />
        )}

        {!isAdmin && tab === 'dashboard' && stats && (
          <MemberDashboard
            user={user}
            stats={stats as MemberDashboardStats}
            books={books}
            borrows={borrows}
            onBrowse={() => setTab('books')}
            onRequest={(b: Book) => openModal('borrowBook', b)}
          />
        )}
        {!isAdmin && tab === 'books' && (
          <Books
            books={books}
            onAdd={() => {}}
            onEdit={() => {}}
            onBorrow={(b: Book) => openModal('borrowBook', b)}
            onViewDetail={(b: Book) => setViewBookId(b.id)}
            onDeleted={() => {}}
            onError={(msg: string) => showToast(msg, 'error')}
            readOnly
          />
        )}
        {!isAdmin && tab === 'borrows' && (
          <MemberBorrows borrows={borrows} onRequest={() => openModal('borrowBook')} />
        )}
      </main>

      {/* Modals */}
      {(modal === 'addBook' || modal === 'editBook') && (
        <BookModal
          book={modal === 'editBook' ? selected : null}
          onClose={closeModal}
          onSave={handleSaveBook}
        />
      )}
      {(modal === 'addMember' || modal === 'editMember') && (
        <MemberModal
          member={modal === 'editMember' ? selected : null}
          onClose={closeModal}
          onSave={handleSaveMember}
        />
      )}
      {modal === 'borrowBook' && user && (
        <BorrowModal
          books={books}
          members={members}
          user={user}
          initialBook={selected as Book | null}
          onClose={closeModal}
          onSave={handleBorrow}
        />
      )}
      {modal === 'returnBook' && selected && (
        <ReturnModal
          record={selected as BorrowRecord}
          onClose={closeModal}
          onSave={handleReturn}
        />
      )}
      {modal === 'approveReject' && selected && (
        <ApproveRejectModal
          record={selected as BorrowRecord}
          onClose={closeModal}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      {viewBookId !== null && user && (
        <BookDetailModal
          bookId={viewBookId}
          user={user}
          onClose={() => setViewBookId(null)}
          onBorrow={() => {
            setViewBookId(null);
            openModal('borrowBook', books.find((b: Book) => b.id === viewBookId) || null);
          }}
          onReturn={(recordId: number) => {
            setViewBookId(null);
            const rec = borrows.find((b: BorrowRecord) => b.id === recordId);
            if (rec) openModal('returnBook', rec);
          }}
        />
      )}

      {/* Member Profile (admin view) */}
      {memberProfileData && (
        <MemberProfileModal
          member={memberProfileData}
          borrows={borrows}
          onClose={() => setMemberProfileData(null)}
        />
      )}

      {/* Own Profile & Rules */}
      {showProfile && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onSaved={handleProfileSaved}
        />
      )}
      {showRules && (
        <RulesModal onClose={() => setShowRules(false)} />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}