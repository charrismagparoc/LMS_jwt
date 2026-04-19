import React from 'react';
import { BookOpen, Clock, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { MemberDashboardStats, Book, BorrowRecord, AuthUser } from '../types';
import StatusBadge from '../components/StatusBadge';

interface MemberDashboardProps {
  user: AuthUser;
  stats: MemberDashboardStats;
  books: Book[];
  borrows: BorrowRecord[];
  onBrowse: () => void;
  onRequest: (book: Book) => void;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const MemberDashboard: React.FC<MemberDashboardProps> = ({ user, stats, books, borrows, onBrowse, onRequest }) => {
  const myActive  = borrows.filter(b => b.status === 'borrowed');
  const myOverdue = borrows.filter(b => b.status === 'overdue');
  const myPending = borrows.filter(b => b.status === 'pending');

  return (
    <div className="page dashboard-page">
      <div className="page-header">
        <div>
          <h1>Welcome, {user.first_name || user.username}</h1>
          <p className="page-sub">Your personal library dashboard</p>
        </div>
        <button className="btn-primary" onClick={onBrowse}>Browse Books</button>
      </div>

      <div className="stats-grid stats-grid-4">
        <div className="stat-card stat-indigo">
          <div className="stat-icon"><BookOpen size={22}/></div>
          <div className="stat-value">{stats.my_active}</div>
          <div className="stat-label">Currently Borrowing</div>
        </div>
        <div className="stat-card stat-amber">
          <div className="stat-icon"><Clock size={22}/></div>
          <div className="stat-value">{stats.my_pending}</div>
          <div className="stat-label">Pending Approval</div>
        </div>
        <div className="stat-card stat-rose">
          <div className="stat-icon"><AlertTriangle size={22}/></div>
          <div className="stat-value">{stats.my_overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
        <div className="stat-card stat-emerald">
          <div className="stat-icon"><CheckCircle size={22}/></div>
          <div className="stat-value">{stats.my_returned}</div>
          <div className="stat-label">Returned</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dash-section">
          <h2>My Active Borrows</h2>
          <div className="mini-table">
            {[...myOverdue, ...myActive, ...myPending].slice(0, 6).map(b => (
              <div key={b.id} className="mini-row">
                <div>
                  <div className="mini-title">{b.book_title}</div>
                  <div className="mini-sub">Due: {formatDate(b.due_date)}</div>
                </div>
                <div className="mini-right">
                  <StatusBadge status={b.status} />
                  {b.overdue_days > 0 && <span className="overdue-days">{b.overdue_days}d overdue</span>}
                  {b.days_until_due !== null && b.days_until_due >= 0 && b.status === 'borrowed' && (
                    <span className="muted" style={{ fontSize: 11 }}>{b.days_until_due}d left</span>
                  )}
                </div>
              </div>
            ))}
            {myActive.length === 0 && myOverdue.length === 0 && myPending.length === 0 && (
              <p className="empty">No active borrows. <button className="link-btn" onClick={onBrowse}>Browse books →</button></p>
            )}
          </div>
        </div>

        <div className="dash-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>Available Books</h2>
            <button onClick={onBrowse} style={{ background: 'none', border: 'none', color: '#a97954', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
              View all <ChevronRight size={14}/>
            </button>
          </div>
          <div className="mini-table">
            {books.filter(b => b.is_available).slice(0, 5).map(book => (
              <div key={book.id} className="mini-row">
                <div>
                  <div className="mini-title">{book.title}</div>
                  <div className="mini-sub">{book.author}</div>
                </div>
                <div className="mini-right">
                  <button className="btn-sm btn-borrow" onClick={() => onRequest(book)}>Request</button>
                </div>
              </div>
            ))}
            {books.filter(b => b.is_available).length === 0 && <p className="empty">No books available right now.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;
