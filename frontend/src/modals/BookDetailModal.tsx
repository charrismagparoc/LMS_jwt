import React, { useEffect, useState } from 'react';
import { BookDetail, AuthUser } from '../types';
import { getBookDetail } from '../api/books';

interface BookDetailModalProps {
  bookId: number;
  user: AuthUser;
  onClose: () => void;
  onBorrow: () => void;         // triggers borrow/request flow
  onReturn: (recordId: number) => void;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const STATUS_PILL: Record<string, React.CSSProperties> = {
  borrowed: { background: 'rgba(245,158,11,.15)', color: '#f59e0b',  border: '1px solid rgba(245,158,11,.3)' },
  overdue:  { background: 'rgba(239,68,68,.15)',  color: '#ef4444',  border: '1px solid rgba(239,68,68,.3)'  },
  returned: { background: 'rgba(100,116,139,.15)',color: '#94a3b8',  border: '1px solid rgba(100,116,139,.3)'},
  pending:  { background: 'rgba(245,158,11,.15)', color: '#f59e0b',  border: '1px solid rgba(245,158,11,.3)' },
  rejected: { background: 'rgba(100,116,139,.15)',color: '#94a3b8',  border: '1px solid rgba(100,116,139,.3)'},
};

const BookDetailModal: React.FC<BookDetailModalProps> = ({
  bookId, user, onClose, onBorrow, onReturn,
}) => {
  const [detail,  setDetail]  = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    getBookDetail(bookId)
      .then(res => setDetail(res.data))
      .catch(() => setError('Failed to load book details.'))
      .finally(() => setLoading(false));
  }, [bookId]);

  const isAdmin   = user.role === 'admin';
  const book      = detail?.book;
  const records   = detail?.records || [];
  const userBorrow = detail?.user_borrow;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 720 }}>

        {/* Header */}
        <div className="modal-header">
          <h2>{loading ? 'Loading…' : book?.title || 'Book Detail'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              Loading book details…
            </div>
          )}

          {error && <div className="form-error">{error}</div>}

          {!loading && book && (
            <>
              {/* ── Book info + action panel ── */}
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 28 }}>

                {/* Left: book info */}
                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {/* Availability badge */}
                    <span style={{
                      fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 500,
                      ...(book.is_available
                        ? { background: 'rgba(16,185,129,.15)', color: '#10b981', border: '1px solid rgba(16,185,129,.3)' }
                        : { background: 'rgba(239,68,68,.15)',  color: '#ef4444', border: '1px solid rgba(239,68,68,.3)'  }),
                    }}>
                      {book.is_available
                        ? `${book.available_copies} of ${book.total_copies} copies available`
                        : `All ${book.total_copies} copies borrowed`}
                    </span>
                    <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                      {book.genre.replace('_', ' ')}
                    </span>
                    {book.published_year && book.published_year > 0 && (
                      <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        {book.published_year}
                      </span>
                    )}
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'monospace', marginBottom: 12 }}>
                    ISBN: {book.isbn}
                  </p>

                  {book.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
                      {book.description}
                    </p>
                  )}
                </div>

                {/* Right: loan details panel — from your detail.html action panel */}
                <div style={{ width: 220, flexShrink: 0 }}>
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600, marginBottom: 14 }}>
                      Loan Details
                    </p>

                    {/* Stats rows — from your detail.html */}
                    {[
                      { label: 'Loan Period',   value: '14 days',                  color: '' },
                      { label: 'Total Copies',  value: String(book.total_copies),  color: '' },
                      { label: 'Available',     value: String(book.available_copies),
                        color: book.is_available ? '#10b981' : '#ef4444' },
                    ].map(row => (
                      <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}>
                        <span style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                        <span style={{ fontWeight: 500, color: row.color || 'var(--text)' }}>{row.value}</span>
                      </div>
                    ))}

                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, marginTop: 4 }}>

                      {/* If member has this book — from your detail.html user_borrow block */}
                      {!isAdmin && userBorrow && (
                        <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12 }}>
                          <p style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 6 }}>You have this book</p>
                          <p style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
                            Due: <span style={{ color: 'var(--text)', fontWeight: 500 }}>{formatDate(userBorrow.due_date)}</span>
                          </p>
                          {userBorrow.overdue_days > 0 ? (
                            <p style={{ color: '#ef4444' }}>⚠ {userBorrow.overdue_days} day{userBorrow.overdue_days !== 1 ? 's' : ''} overdue!</p>
                          ) : (
                            <p style={{ color: 'var(--text-muted)' }}>
                              <span style={{ color: '#10b981', fontWeight: 500 }}>{userBorrow.days_remaining}</span> day{userBorrow.days_remaining !== 1 ? 's' : ''} remaining
                            </p>
                          )}
                        </div>
                      )}

                      {/* Pending request */}
                      {!isAdmin && userBorrow?.status === 'pending' && (
                        <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 12, color: '#f59e0b' }}>
                          ⏳ Your request is pending admin approval
                        </div>
                      )}

                      {/* Action button — mirrors your detail.html borrow/return/unavailable logic */}
                      {!isAdmin && userBorrow && (userBorrow.status === 'borrowed' || userBorrow.status === 'overdue') ? (
                        <button
                          onClick={() => { onReturn(userBorrow.id); onClose(); }}
                          style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface3)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        >Return This Book</button>
                      ) : !isAdmin && !userBorrow && book.is_available ? (
                        <button
                          onClick={() => { onBorrow(); onClose(); }}
                          style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--indigo)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                        >{user.role === 'member' ? 'Request This Book' : 'Borrow This Book'}</button>
                      ) : !isAdmin && !userBorrow && !book.is_available ? (
                        <button disabled style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--surface3)', color: 'var(--text-muted)', fontSize: 13, cursor: 'not-allowed' }}>
                          Not Available
                        </button>
                      ) : null}

                      {isAdmin && book.is_available && (
                        <button
                          onClick={() => { onBorrow(); onClose(); }}
                          style={{ width: '100%', padding: '10px 0', borderRadius: 8, border: 'none', background: 'var(--indigo)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                        >Borrow for Member</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Borrow history table — from your detail.html records table ── */}
              {records.length > 0 && (
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>
                    Borrowing History
                  </h3>
                  <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                          {isAdmin && <th style={{ textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, padding: '10px 16px' }}>Borrower</th>}
                          <th style={{ textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, padding: '10px 16px' }}>Borrow Date</th>
                          <th style={{ textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, padding: '10px 16px' }}>Due Date</th>
                          <th style={{ textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, padding: '10px 16px' }}>Return Date</th>
                          <th style={{ textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, padding: '10px 16px' }}>Status</th>
                          {isAdmin && <th style={{ textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, padding: '10px 16px' }}>Days Info</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {records.map(r => (
                          <tr key={r.id} style={{ borderBottom: '1px solid rgba(46,50,72,.4)' }}>
                            {isAdmin && (
                              <td style={{ padding: '10px 16px', color: 'var(--text)' }}>{r.member_name}</td>
                            )}
                            <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{formatDate(r.borrow_date)}</td>
                            <td style={{ padding: '10px 16px', color: r.overdue_days > 0 ? '#ef4444' : 'var(--text-muted)' }}>{formatDate(r.due_date)}</td>
                            <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{formatDate(r.return_date)}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 500, ...(STATUS_PILL[r.status] || STATUS_PILL.borrowed) }}>
                                {r.overdue_days > 0 ? `${r.overdue_days}d overdue` : r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                              </span>
                            </td>
                            {isAdmin && (
                              <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                                {r.status === 'borrowed' && r.days_remaining > 0 && `${r.days_remaining}d left`}
                                {r.status === 'overdue' && <span style={{ color: '#ef4444' }}>{r.overdue_days}d late</span>}
                                {r.status === 'returned' && '—'}
                                {r.status === 'pending' && 'Pending'}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {records.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                  No borrow history for this book yet.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDetailModal;
