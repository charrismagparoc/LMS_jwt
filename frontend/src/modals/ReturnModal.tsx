import React, { useState } from 'react';
import { BorrowRecord } from '../types';
import { ModalWrapper, FormField } from '../components/ModalWrapper';

interface ReturnModalProps {
  record: BorrowRecord;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

const ReturnModal: React.FC<ReturnModalProps> = ({ record, onClose, onSave }) => {
  const [notes,  setNotes]  = useState('');
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const isOverdue = record.overdue_days > 0;

  const handleReturn = async () => {
    setSaving(true); setError('');
    try   { await onSave(notes); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <ModalWrapper title="Return Book" onClose={onClose}>
      {error && <div className="form-error">{error}</div>}

      {/* Icon */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          width: 56, height: 56,
          background: isOverdue ? 'rgba(244,63,94,.1)' : 'rgba(16,185,129,.1)',
          border: `1px solid ${isOverdue ? 'rgba(244,63,94,.3)' : 'rgba(16,185,129,.3)'}`,
          borderRadius: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: 26,
        }}>
          {isOverdue ? '⚠️' : '✅'}
        </div>

        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: 20, fontWeight: 700,
          color: 'var(--text)', margin: '0 0 4px',
        }}>
          {record.book_title}
        </h3>
        <p className="muted">by {record.book_author}</p>
      </div>

      {/* Details card */}
      <div style={{
        background: isOverdue ? 'rgba(244,63,94,.07)' : 'var(--surface2)',
        border: `1px solid ${isOverdue ? 'rgba(244,63,94,.25)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: 16,
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
          <span className="muted">Borrowed on</span>
          <span style={{ color: 'var(--text)' }}>{formatDate(record.borrow_date)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14 }}>
          <span className="muted">Due date</span>
          <span style={{ color: isOverdue ? 'var(--rose)' : 'var(--text)' }}>
            {formatDate(record.due_date)}
          </span>
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          paddingTop: 10, borderTop: `1px solid ${isOverdue ? 'rgba(244,63,94,.2)' : 'var(--border)'}`,
          fontSize: 14,
        }}>
          {isOverdue ? (
            <>
              <span style={{ color: 'var(--rose)', fontWeight: 500 }}>Days Overdue</span>
              <span style={{ color: 'var(--rose)', fontWeight: 700 }}>
                {record.overdue_days} day{record.overdue_days !== 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <>
              <span className="muted">Days Remaining</span>
              <span style={{ color: 'var(--emerald)', fontWeight: 500 }}>
                {record.days_until_due} day{record.days_until_due !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </div>

      {isOverdue && (
        <p style={{ color: 'var(--rose)', fontSize: 12, marginBottom: 16, textAlign: 'center' }}>
          This book is overdue. Please return it as soon as possible.
        </p>
      )}

      <FormField label="Return Notes (optional)">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={2}
          placeholder="Condition notes, damage report, etc..."
        />
      </FormField>

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onClose}>Cancel</button>
        <button
          className="btn-primary"
          onClick={handleReturn}
          disabled={saving}
          style={isOverdue ? { background: 'var(--rose)' } : {}}
        >
          {saving ? 'Processing...' : 'Confirm Return'}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default ReturnModal;
