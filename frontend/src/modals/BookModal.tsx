import React, { useState } from 'react';
import { Book, GENRES } from '../types';
import { ModalWrapper, FormField } from '../components/ModalWrapper';

interface BookModalProps {
  book: Book | null;
  onClose: () => void;
  onSave: (data: Partial<Book>) => Promise<void>;
}

const BookModal: React.FC<BookModalProps> = ({ book, onClose, onSave }) => {
  const [form, setForm] = useState({
    title:          book?.title          || '',
    author:         book?.author         || '',
    isbn:           book?.isbn           || '',
    genre:          book?.genre          || 'fiction',
    total_copies:   book?.total_copies   || 1,
    published_year: book?.published_year || '',
    description:    book?.description    || '',
  });
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  const handle = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.isbn) {
      setError('Title, Author, and ISBN are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        total_copies:   Number(form.total_copies),
        published_year: form.published_year ? Number(form.published_year) : null,
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalWrapper title={book ? 'Edit Book' : 'Add New Book'} onClose={onClose}>
      <form onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}

        <div className="form-grid">
          <FormField label="Title *">
            <input name="title" value={form.title} onChange={handle} placeholder="Book title" />
          </FormField>
          <FormField label="Author *">
            <input name="author" value={form.author} onChange={handle} placeholder="Author name" />
          </FormField>
          <FormField label="ISBN *">
            <input name="isbn" value={form.isbn} onChange={handle} placeholder="978-0000000000" />
          </FormField>
          <FormField label="Genre">
            <select name="genre" value={form.genre} onChange={handle}>
              {GENRES.map(g => (
                <option key={g} value={g}>{g.replace('_', ' ')}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Total Copies">
            <input
              type="number" name="total_copies"
              value={form.total_copies} onChange={handle} min={1}
            />
          </FormField>
          <FormField label="Published Year">
            <input
              type="number" name="published_year"
              value={form.published_year} onChange={handle} placeholder="e.g. 2001"
            />
          </FormField>
        </div>

        <FormField label="Description">
          <textarea
            name="description" value={form.description}
            onChange={handle} rows={3} placeholder="Optional description..."
          />
        </FormField>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : book ? 'Update Book' : 'Add Book'}
          </button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default BookModal;
