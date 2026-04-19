import React, { useState } from 'react';
import { Book, Member, AuthUser } from '../types';
import { ModalWrapper, FormField } from '../components/ModalWrapper';

const P = {
  pageBg:        '#f5f0e8',
  cardBg:        '#faf7f2',
  cardBorder:    '#c8b89a',
  inputBg:       '#fff9f2',
  inputBorder:   '#d4c8b0',
  textPrimary:   '#2c1a0e',
  textSecondary: '#7a6a55',
  textMuted:     '#a89880',
  btnPrimary:    '#5c3d1e',
  btnPrimaryTxt: '#fff9f2',
  btnSecondary:  '#e8e0d0',
  btnSecondaryTxt: '#5c3d1e',
  infoBg:        '#fdf3e3',
  infoBorder:    '#e8c87a',
  infoTxt:       '#7a5010',
  successTxt:    '#3d6b4f',
  errorBg:       '#fdf0ec',
  errorBorder:   '#e8a090',
  errorTxt:      '#8b2a1a',
  sectionBg:     '#f0e8d8',
};

interface BorrowModalProps {
  books: Book[];
  members: Member[];
  user: AuthUser;
  initialBook: Book | null;
  onClose: () => void;
  onSave: (data: { book: number; member?: number; due_date: string; notes: string }) => Promise<void>;
}

const normalizeDate = (raw: string): string => {
  if (!raw) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? raw : d.toISOString().split('T')[0];
};

// Shared field wrapper
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{
      display: 'block',
      fontSize: 11,
      fontWeight: 700,
      color: P.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
      marginBottom: 6,
    }}>
      {label}
    </label>
    {children}
  </div>
);

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: P.inputBg,
  border: `1.5px solid ${P.inputBorder}`,
  borderRadius: 8,
  padding: '9px 12px',
  color: P.textPrimary,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
  boxSizing: 'border-box',
};

const BorrowModal: React.FC<BorrowModalProps> = ({
  books, members, user, initialBook, onClose, onSave,
}) => {
  const isAdmin    = user.role === 'admin';
  const today      = new Date().toISOString().split('T')[0];
  const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  const [bookId,    setBookId]    = useState(initialBook?.id?.toString() || '');
  const [memberId,  setMemberId]  = useState('');
  const [dueDate,   setDueDate]   = useState(defaultDue);
  const [notes,     setNotes]     = useState('');
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const selectedBook   = books.find(b => b.id === Number(bookId));
  const selectedMember = members.find(m => m.id === Number(memberId));
  const availableBooks = books.filter(b => b.is_available || b.id === Number(bookId));

  const handleConfirm = async () => {
    if (!bookId) { setError('Please select a book.'); return; }
    if (isAdmin && !memberId) { setError('Please select a member.'); return; }
    setSaving(true); setError('');
    try {
      const payload: any = { book: Number(bookId), due_date: normalizeDate(dueDate), notes };
      if (isAdmin) payload.member = Number(memberId);
      await onSave(payload);
    } catch (e: any) {
      setError(e.message || 'Failed to submit.');
    } finally {
      setSaving(false);
    }
  };

  // Overlay ug modal shell
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(44, 26, 14, 0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(2px)',
  };

  const shell: React.CSSProperties = {
    background: P.cardBg,
    border: `1.5px solid ${P.cardBorder}`,
    borderRadius: 16,
    padding: '28px 32px',
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 8px 40px rgba(92, 61, 30, 0.18)',
    position: 'relative',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: P.textPrimary,
    margin: '0 0 20px',
    fontFamily: "'Playfair Display', serif",
  };

  const closeBtn: React.CSSProperties = {
    position: 'absolute', top: 16, right: 16,
    background: P.sectionBg,
    border: `1px solid ${P.cardBorder}`,
    borderRadius: 8,
    width: 32, height: 32,
    cursor: 'pointer',
    fontSize: 16,
    color: P.textSecondary,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  // Selection form
  if (!confirmed) {
    return (
      <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={shell}>
          <button style={closeBtn} onClick={onClose}>✕</button>
          <h2 style={titleStyle}>{isAdmin ? 'Borrow a Book' : 'Request a Book'}</h2>

          {error && (
            <div style={{
              background: P.errorBg, border: `1px solid ${P.errorBorder}`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 16,
              fontSize: 13, color: P.errorTxt,
            }}>
              {error}
            </div>
          )}

          {!isAdmin && (
            <div style={{
              background: P.infoBg, border: `1px solid ${P.infoBorder}`,
              borderRadius: 8, padding: '10px 14px', marginBottom: 18,
              fontSize: 13, color: P.infoTxt, display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <span>📋</span>
              <span>Your request will be sent to the admin for approval.</span>
            </div>
          )}

          <Field label="Book *">
            <select
              value={bookId}
              onChange={e => setBookId(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select a book...</option>
              {availableBooks.map(b => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.available_copies} available)
                </option>
              ))}
            </select>
          </Field>

          {isAdmin && (
            <Field label="Member *">
              <select
                value={memberId}
                onChange={e => setMemberId(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">Select a member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.email})</option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Requested Due Date">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              min={today}
              style={inputStyle}
            />
          </Field>

          <Field label="Notes">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Any notes for the librarian..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 70, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}
            />
          </Field>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <button
              onClick={onClose}
              style={{
                background: P.btnSecondary, color: P.btnSecondaryTxt,
                border: `1px solid ${P.inputBorder}`, borderRadius: 8,
                padding: '9px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!bookId || (isAdmin && !memberId)) { setError('Please fill in required fields.'); return; }
                setError(''); setConfirmed(true);
              }}
              style={{
                background: P.btnPrimary, color: P.btnPrimaryTxt,
                border: 'none', borderRadius: 8,
                padding: '9px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Review →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation
  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={shell}>
        <button style={closeBtn} onClick={onClose}>✕</button>
        <h2 style={titleStyle}>{isAdmin ? 'Confirm Borrow' : 'Confirm Request'}</h2>

        {error && (
          <div style={{
            background: P.errorBg, border: `1px solid ${P.errorBorder}`,
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: P.errorTxt,
          }}>
            {error}
          </div>
        )}

        {/* Book preview */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56,
            background: P.sectionBg,
            border: `1.5px solid ${P.cardBorder}`,
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
            fontSize: 26,
          }}>
            📖
          </div>
          <p style={{ fontSize: 13, color: P.textMuted, margin: '0 0 6px' }}>
            You are about to {isAdmin ? 'borrow' : 'request'}:
          </p>
          <h3 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 20, fontWeight: 700,
            color: P.textPrimary, margin: '0 0 4px',
          }}>
            {selectedBook?.title}
          </h3>
          <p style={{ fontSize: 13, color: P.textSecondary, margin: 0 }}>
            Author: {selectedBook?.author}
          </p>
        </div>

        {/* Details card */}
        <div style={{
          background: P.sectionBg,
          border: `1.5px solid ${P.cardBorder}`,
          borderRadius: 10,
          padding: '4px 0',
          marginBottom: 24,
        }}>
          {[
            ...(isAdmin && selectedMember ? [{ label: 'Borrower', value: selectedMember.name, color: P.textPrimary }] : []),
            ...(!isAdmin ? [{ label: 'Borrower', value: user.username, color: P.textPrimary }] : []),
            { label: 'Loan Period', value: '14 days', color: P.textPrimary },
            { label: 'Copies Available', value: String(selectedBook?.available_copies ?? '—'), color: P.successTxt },
          ].map(({ label, value, color }, i, arr) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '11px 16px',
              borderBottom: i < arr.length - 1 ? `1px solid ${P.cardBorder}` : 'none',
              fontSize: 14,
            }}>
              <span style={{ color: P.textMuted }}>{label}</span>
              <span style={{ fontWeight: 600, color }}>{value}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={() => setConfirmed(false)}
            style={{
              background: P.btnSecondary, color: P.btnSecondaryTxt,
              border: `1px solid ${P.inputBorder}`, borderRadius: 8,
              padding: '9px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
            }}
          >
            ← Back
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            style={{
              background: saving ? P.textMuted : P.btnPrimary,
              color: P.btnPrimaryTxt,
              border: 'none', borderRadius: 8,
              padding: '9px 20px', fontWeight: 600, fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Processing...' : isAdmin ? 'Confirm Borrow' : 'Confirm Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BorrowModal;