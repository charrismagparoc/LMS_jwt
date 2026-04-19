import React, { useState } from 'react';
import { BorrowRecord } from '../types';
import StatusBadge from '../components/StatusBadge';
import { deleteBorrow } from '../api';

interface BorrowsProps {
  borrows: BorrowRecord[];
  onAdd: () => void;
  onReturn: (record: BorrowRecord) => void;
  onApproveReject: (record: BorrowRecord) => void;
  onDeleted: (msg: string) => void;
  onError: (msg: string) => void;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const BorrowBookCover: React.FC<{ title: string }> = ({ title }) => {
  const [err, setErr] = useState(false);
  if (err) return <span style={{ fontSize: 24 }}>📖</span>;
  return (
    <img
      src={`https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-S.jpg`}
      alt={title}
      onError={() => setErr(true)}
      style={{
        width: 36,
        height: 48,
        objectFit: 'cover',
        borderRadius: 4,
        marginRight: 10,
        flexShrink: 0,
      }}
    />
  );
};

// ✅ NEW: Book Condition Badge
const ConditionBadge: React.FC<{ condition: 'good' | 'minor_damage' | 'damaged' | null }> = ({ condition }) => {
  if (!condition) return <span className="muted">—</span>;
  
  const styles = {
    good: { bg: 'rgba(16,185,129,0.13)', border: 'rgba(16,185,129,0.3)', color: 'var(--emerald)', label: 'Good' },
    minor_damage: { bg: '#f59e0b22', border: '#f59e0b44', color: '#f59e0b', label: 'Minor Damage' },
    damaged: { bg: 'rgba(244,63,94,0.13)', border: 'rgba(244,63,94,0.3)', color: 'var(--rose)', label: 'Damaged' },
  };

  const style = styles[condition];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 4,
        background: style.bg,
        border: `1px solid ${style.border}`,
        fontSize: 11,
        fontWeight: 600,
        color: style.color,
      }}>
        {condition === 'damaged' && '⚠ '}
        {style.label}
      </div>
      {condition === 'damaged' && (
        <span style={{ fontSize: 10, color: 'var(--rose)', fontWeight: 600 }}>
          Fee: $15.00
        </span>
      )}
    </div>
  );
};

// ✅ NEW: Calculate member borrowing frequency
const MemberBorrowingStats: React.FC<{ 
  memberEmail: string; 
  allBorrows: BorrowRecord[] 
}> = ({ memberEmail, allBorrows }) => {
  // Calculate stats for this member
  const memberBorrows = allBorrows.filter(b => b.member_email === memberEmail);
  const totalBorrows = memberBorrows.length;
  
  // Calculate months since first borrow
  const dates = memberBorrows
    .map(b => b.borrow_date)
    .filter(d => d)
    .map(d => new Date(d!).getTime());
  
  let perMonth = 0;
  if (dates.length > 0) {
    const oldest = Math.min(...dates);
    const newest = Math.max(...dates);
    const monthsDiff = Math.max(1, (newest - oldest) / (1000 * 60 * 60 * 24 * 30));
    perMonth = totalBorrows / monthsDiff;
  }

  return (
    <div className="muted small" style={{ marginTop: 2, fontSize: 11 }}>
      {totalBorrows} total borrow{totalBorrows !== 1 ? 's' : ''} · ~{perMonth.toFixed(1)} per month
    </div>
  );
};

const Borrows: React.FC<BorrowsProps> = ({
  borrows, onAdd, onReturn, onApproveReject, onDeleted, onError,
}) => {
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // ✅ NEW: Simulate book condition (in real app, this comes from backend)
  const getBookCondition = (record: BorrowRecord): 'good' | 'minor_damage' | 'damaged' | null => {
    if (record.status !== 'returned') return null;
    // Simulate: use book ID to assign conditions for demo
    const rand = record.id % 10;
    if (rand >= 8) return 'damaged';
    if (rand >= 6) return 'minor_damage';
    return 'good';
  };

  const filtered = borrows.filter(b => {
    const matchSearch = !search ||
      b.book_title.toLowerCase().includes(search.toLowerCase()) ||
      b.member_name.toLowerCase().includes(search.toLowerCase());
    
    // ✅ UPDATED: Handle damaged filter
    let matchStatus = true;
    if (statusFilter === 'damaged') {
      matchStatus = b.status === 'returned' && getBookCondition(b) === 'damaged';
    } else {
      matchStatus = !statusFilter || b.status === statusFilter;
    }
    
    return matchSearch && matchStatus;
  });

  const pending = borrows.filter(b => b.status === 'pending').length;

  const handleDelete = async (record: BorrowRecord) => {
    if (!window.confirm('Delete this record?')) return;
    try   { await deleteBorrow(record.id); onDeleted('Record deleted.'); }
    catch (e: any) { onError(e.response?.data?.error || 'Delete failed.'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Borrow Records</h1>
          <p className="page-sub">
            {borrows.length} total
            {pending > 0 && (
              <span className="pending-badge-inline"> · {pending} pending approval</span>
            )}
          </p>
        </div>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search book or member..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="borrowed">Borrowed</option>
          <option value="overdue">Overdue</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          className={`btn-secondary ${statusFilter === 'returned' ? 'btn-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'returned' ? '' : 'returned')}
          style={{
            background: statusFilter === 'returned' ? 'var(--emerald)' : 'var(--surface2)',
            color: statusFilter === 'returned' ? 'white' : 'var(--text)',
            border: statusFilter === 'returned' ? '1px solid var(--emerald)' : '1px solid var(--border)',
            fontWeight: statusFilter === 'returned' ? 600 : 400,
          }}
        >
          {statusFilter === 'returned' ? '✓ ' : ''}Returned Records
        </button>
        <button
          className={`btn-secondary ${statusFilter === 'damaged' ? 'btn-active' : ''}`}
          onClick={() => setStatusFilter(statusFilter === 'damaged' ? '' : 'damaged')}
          style={{
            background: statusFilter === 'damaged' ? 'var(--rose)' : 'var(--surface2)',
            color: statusFilter === 'damaged' ? 'white' : 'var(--text)',
            border: statusFilter === 'damaged' ? '1px solid var(--rose)' : '1px solid var(--border)',
            fontWeight: statusFilter === 'damaged' ? 600 : 400,
          }}
        >
          {statusFilter === 'damaged' ? '⚠ ' : ''}Damaged Returns
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Member</th>
              <th>Requested</th>
              <th>Due Date</th>
              <th>Returned</th>
              <th>Status</th>
              <th>Condition</th>
              <th>Overdue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <tr
                key={b.id}
                className={
                  b.status === 'overdue' ? 'row-overdue' :
                  b.status === 'pending' ? 'row-pending'  : ''
                }
              >
                <td>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <BorrowBookCover title={b.book_title} />
                    <div>
                      <div><strong>{b.book_title}</strong></div>
                      <div className="muted small">{b.book_author}</div>
                    </div>
                  </div>
                </td>
                {/* ✅ UPDATED: Added borrowing stats under member email */}
                <td>
                  <div>{b.member_name}</div>
                  <div className="muted small">{b.member_email}</div>
                  <MemberBorrowingStats 
                    memberEmail={b.member_email} 
                    allBorrows={borrows} 
                  />
                </td>
                <td className="muted">{formatDate(b.borrow_date)}</td>
                <td className={b.status === 'overdue' ? 'text-rose' : 'muted'}>
                  {formatDate(b.due_date)}
                </td>
                <td className="muted">{formatDate(b.return_date)}</td>
                <td><StatusBadge status={b.status} /></td>
                {/* ✅ NEW: Book Condition Column */}
                <td>
                  <ConditionBadge condition={getBookCondition(b)} />
                </td>
                <td>
                  {b.overdue_days > 0
                    ? <span className="overdue-days">{b.overdue_days} days</span>
                    : b.days_until_due !== null && b.days_until_due >= 0
                      ? <span className="muted">{b.days_until_due}d left</span>
                      : '—'
                  }
                </td>
                <td>
                  <div className="row-actions">
                    {b.status === 'pending' && (
                      <button className="btn-sm btn-approve" onClick={() => onApproveReject(b)}>
                        Review
                      </button>
                    )}
                    {(b.status === 'borrowed' || b.status === 'overdue') && (
                      <button className="btn-sm btn-return" onClick={() => onReturn(b)}>
                        Return
                      </button>
                    )}
                    {(b.status === 'returned' || b.status === 'rejected') && (
                      <>
                        {/* ✅ NEW: Show charge button for damaged books */}
                        {getBookCondition(b) === 'damaged' && (
                          <button 
                            className="btn-sm" 
                            onClick={() => alert('Damage fee: $15.00 charged to ' + b.member_name)}
                            style={{
                              background: 'var(--rose)',
                              color: 'white',
                              border: '1px solid var(--rose)',
                            }}
                          >
                            Charge Fee
                          </button>
                        )}
                        <button className="btn-sm btn-delete" onClick={() => handleDelete(b)}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No records found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Borrows;