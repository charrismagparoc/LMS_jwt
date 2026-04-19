import React, { useState } from 'react';
import { BorrowRecord } from '../types';
import StatusBadge from '../components/StatusBadge';

interface MemberBorrowsProps {
  borrows: BorrowRecord[];
  onRequest: () => void;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const MemberBorrows: React.FC<MemberBorrowsProps> = ({ borrows, onRequest }) => {
  const [statusFilter, setStatusFilter] = useState('');

  const active   = borrows.filter(b => b.status === 'borrowed' || b.status === 'overdue');
  const pending  = borrows.filter(b => b.status === 'pending');
  const returned = borrows.filter(b => b.status === 'returned');
  const rejected = borrows.filter(b => b.status === 'rejected');

  const allFiltered = statusFilter
    ? borrows.filter(b => b.status === statusFilter)
    : null;

  return (
    <div className="page">
      {/* Header — matches our system's page-header style */}
      <div className="page-header">
        <div>
          <h1>My Borrows</h1>
          <p className="page-sub">Track your borrow/return dates and overdue status.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="borrowed">Borrowed</option>
            <option value="overdue">Overdue</option>
            <option value="pending">Pending</option>
            <option value="returned">Returned</option>
            <option value="rejected">Rejected</option>
          </select>
          <button className="btn-primary" onClick={onRequest}>+ Request Book</button>
        </div>
      </div>

      {allFiltered ? (
        /* Filtered view — flat table */
        <div className="table-wrap">
          <BorrowTable records={allFiltered} showMember={false} />
        </div>
      ) : (
        <>
          {/* ── Currently Borrowed ── */}
          <section style={{ marginBottom: 32 }}>
            <SectionHeading dot="amber" label="Currently Borrowed" count={active.length} />
            {active.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {active.map(r => <ActiveBorrowCard key={r.id} record={r} />)}
              </div>
            ) : (
              <div className="dash-section" style={{ textAlign: 'center', padding: 40 }}>
                <p className="empty">
                  You have no books currently borrowed.{' '}
                  <button className="link-btn" onClick={onRequest}>Browse available books →</button>
                </p>
              </div>
            )}
          </section>

          {/* ── Pending Requests ── */}
          {pending.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <SectionHeading dot="amber" label="Pending Approval" count={pending.length} />
              <div className="table-wrap">
                <BorrowTable records={pending} showMember={false} />
              </div>
            </section>
          )}

          {/* ── Return History ── */}
          <section>
            <SectionHeading dot="muted" label="Return History" count={[...returned, ...rejected].length} />
            {[...returned, ...rejected].length > 0 ? (
              <div className="table-wrap">
                <BorrowTable records={[...returned, ...rejected]} showMember={false} />
              </div>
            ) : (
              <div className="dash-section" style={{ textAlign: 'center', padding: 32 }}>
                <p className="empty">No returned books yet.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

// ── Section heading with dot indicator ───────────────────────
const SectionHeading: React.FC<{ dot: 'amber' | 'muted'; label: string; count: number }> = ({ dot, label, count }) => (
  <h2 style={{
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }}>
    <span style={{
      width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
      background: dot === 'amber' ? 'var(--amber)' : 'var(--text-muted)',
    }} />
    {label}{' '}
    <span style={{ fontWeight: 400, color: 'var(--text-muted)', textTransform: 'none', opacity: .6 }}>
      ({count})
    </span>
  </h2>
);

// ── Active borrow card ────────────────────────────────────────
const ActiveBorrowCard: React.FC<{ record: BorrowRecord }> = ({ record }) => {
  const isOverdue = record.overdue_days > 0;

  return (
    <div className={`dash-section ${isOverdue ? 'row-overdue' : ''}`}
      style={{ borderColor: isOverdue ? 'rgba(244,63,94,.4)' : undefined }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: 'var(--text)', fontSize: 17, margin: '0 0 2px' }}>
            {record.book_title}
          </p>
          <p className="muted" style={{ fontSize: 13, margin: 0 }}>{record.book_author}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginTop: 12 }}>
            <div>
              <span className="muted" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Borrowed</span>
              <span style={{ color: 'var(--text)', fontWeight: 500, fontSize: 13 }}>{formatDate(record.borrow_date)}</span>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Due Date</span>
              <span style={{ color: isOverdue ? 'var(--rose)' : 'var(--text)', fontWeight: 500, fontSize: 13 }}>
                {formatDate(record.due_date)}
              </span>
            </div>
            <div>
              <span className="muted" style={{ fontSize: 11, display: 'block', marginBottom: 2 }}>Loan Period</span>
              <span style={{ color: 'var(--text)', fontWeight: 500, fontSize: 13 }}>14 days</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <StatusBadge status={record.status} />
          {isOverdue ? (
            <span className="overdue-days">⚠ {record.overdue_days} day{record.overdue_days !== 1 ? 's' : ''} overdue</span>
          ) : (
            record.days_until_due !== null && record.days_until_due >= 0 && (
              <span className="muted" style={{ fontSize: 12 }}>
                {record.days_until_due} day{record.days_until_due !== 1 ? 's' : ''} remaining
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );
};

// ── Borrow history table ──────────────────────────────────────
export const BorrowTable: React.FC<{ records: BorrowRecord[]; showMember: boolean }> = ({ records, showMember }) => (
  <table className="data-table">
    <thead>
      <tr>
        <th>Book</th>
        {showMember && <th>Member</th>}
        <th>Borrowed</th>
        <th>Due Date</th>
        <th>Returned</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {records.map(r => (
        <tr key={r.id} className={r.status === 'overdue' ? 'row-overdue' : ''}>
          <td>
            <div><strong>{r.book_title}</strong></div>
            <div className="muted small">{r.book_author}</div>
          </td>
          {showMember && <td>{r.member_name}</td>}
          <td className="muted">{formatDate(r.borrow_date)}</td>
          <td className={r.overdue_days > 0 ? 'text-rose' : 'muted'}>{formatDate(r.due_date)}</td>
          <td className="muted">{formatDate(r.return_date)}</td>
          <td>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <StatusBadge status={r.status} />
              {r.overdue_days > 0 && (
                <span className="overdue-days" style={{ fontSize: 11 }}>{r.overdue_days}d overdue</span>
              )}
              {r.status === 'borrowed' && r.days_until_due !== null && r.days_until_due >= 0 && (
                <span className="muted small">{r.days_until_due}d left</span>
              )}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

export default MemberBorrows;
