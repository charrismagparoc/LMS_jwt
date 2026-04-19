import React, { useState } from 'react';
import { Member } from '../types';
import { ModalWrapper, FormField } from '../components/ModalWrapper';

interface MemberModalProps {
  member: Member | null;
  onClose: () => void;
  onSave: (data: Partial<Member>) => Promise<void>;
}

const MemberModal: React.FC<MemberModalProps> = ({ member, onClose, onSave }) => {
  const [form, setForm] = useState({
    username:   member?.username   || '',
    first_name: member?.first_name || '',
    last_name:  member?.last_name  || '',
    email:      member?.email      || '',
    phone:      member?.phone      || '',
    password:   '',
  });
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.email) { setError('First name and email are required.'); return; }
    if (!member && !form.username)        { setError('Username is required.');              return; }
    setSaving(true); setError('');
    try {
      const payload: Partial<Member> & { password?: string } = {
        first_name: form.first_name,
        last_name:  form.last_name,
        email:      form.email,
        phone:      form.phone,
      };
      if (!member) {
        payload.username = form.username;
        payload.password = form.password || 'member123';
      }
      await onSave(payload);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper title={member ? 'Edit Member' : 'Add Member'} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-grid">
          <FormField label="First Name *">
            <input name="first_name" value={form.first_name} onChange={handle} placeholder="First name" />
          </FormField>
          <FormField label="Last Name">
            <input name="last_name" value={form.last_name} onChange={handle} placeholder="Last name" />
          </FormField>
          {!member && (
            <FormField label="Username *">
              <input name="username" value={form.username} onChange={handle} placeholder="login username" />
            </FormField>
          )}
          <FormField label="Email *">
            <input type="email" name="email" value={form.email} onChange={handle} placeholder="email@example.com" />
          </FormField>
          <FormField label="Phone">
            <input name="phone" value={form.phone} onChange={handle} placeholder="+1-555-0000" />
          </FormField>
          {!member && (
            <FormField label="Password">
              <input type="password" name="password" value={form.password} onChange={handle} placeholder="Default: member123" />
            </FormField>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : member ? 'Update Member' : 'Add Member'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default MemberModal;
