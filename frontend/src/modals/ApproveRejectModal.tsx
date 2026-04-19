import React, { useState } from 'react';
import { BorrowRecord } from '../types';
import { ModalWrapper, FormField } from '../components/ModalWrapper';

interface ApproveRejectModalProps {
  record: BorrowRecord;
  onClose: () => void;
  onApprove: (dueDate: string, notes: string) => Promise<void>;
  onReject:  (notes: string) => Promise<void>;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const ApproveRejectModal: React.FC<ApproveRejectModalProps> = ({ record, onClose, onApprove, onReject }) => {
  const defaultDue = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
  const today      = new Date().toISOString().split('T')[0];

  const [dueDate, setDueDate] = useState(record.due_date || defaultDue);
  const [notes,   setNotes]   = useState('');
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  const handleApprove = async () => {
    setSaving(true); setError('');
    try   { await onApprove(dueDate, notes); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleReject = async () => {
    setSaving(true); setError('');
    try   { await onReject(notes); }
    catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <ModalWrapper title="Review Borrow Request" onClose={onClose}>
      {error && <div className="form-error">{error}</div>}

      {/* Request summary */}
      <div className="return-info">
        <div className="return-book">📖 {record.book_title}</div>
        <div className="return-member">👤 {record.member_name} · {record.member_email}</div>
        <div className="return-dates">
          <span>Requested: {formatDate(record.borrow_date)}</span>
          <span>Proposed due: {formatDate(record.due_date)}</span>
        </div>
        {record.notes && <div className="muted small">Member note: "{record.notes}"</div>}
      </div>

      <FormField label="Set Due Date">
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} min={today} />
      </FormField>

      <FormField label="Admin Notes (optional)">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notes visible to the member..." />
      </FormField>

      <div className="modal-actions">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-reject" onClick={handleReject} disabled={saving}>
          {saving ? '...' : '✕ Reject'}
        </button>
        <button type="button" className="btn-primary" onClick={handleApprove} disabled={saving}>
          {saving ? '...' : '✓ Approve'}
        </button>
      </div>
    </ModalWrapper>
  );
};

export default ApproveRejectModal;
