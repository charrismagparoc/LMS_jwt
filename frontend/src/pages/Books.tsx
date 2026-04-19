import React, { useState } from 'react';
import { Book } from '../types';
import StatusBadge from '../components/StatusBadge';
import { deleteBook } from '../api';

// ─── Same palette for both admin and member ───────────────────────────────────
const PALETTE = {
  pageBg:          'var(--bg)',
  cardBg:          'var(--surface)',
  cardBorder:      'var(--border)',
  cardUnavail:     'var(--surface2)',
  textPrimary:     'var(--text)',
  textSecondary:   'var(--text-muted)',
  textMuted:       'var(--text-muted)',
  genreText:       'var(--oak)',
  inputBg:         'var(--surface2)',
  inputBorder:     'var(--border)',
  btnPrimary:      'var(--binding)',
  btnPrimaryTxt:   '#f6f2ea',
  btnSecondary:    'var(--surface2)',
  btnSecondaryTxt: 'var(--text)',
  btnBorrow:       'var(--oak)',
  btnBorrowTxt:    '#f6f2ea',
  btnEdit:         'var(--surface2)',
  btnEditTxt:      'var(--oak)',
  btnDelete:       'var(--surface2)',
  btnDeleteTxt:    'var(--rose)',
  copiesOk:        'var(--emerald)',
  copiesNone:      'var(--rose)',
  availBadgeBg:    'rgba(16,185,129,0.15)',
  availBadgeTxt:   'var(--emerald)',
  unavailBadgeBg:  'rgba(194,155,135,0.15)',
  unavailBadgeTxt: 'var(--leather)',
};

// ─── Same genre colors for both ───────────────────────────────────────────────
const GENRE_COLORS: Record<string, string> = {
  fiction:     '#9b6ec8',
  non_fiction: '#3a9e8a',
  science:     '#4a7fc1',
  technology:  '#3398b0',
  history:     '#c47830',
  biography:   '#c45880',
  mystery:     '#c44040',
  fantasy:     '#7a50c0',
  romance:     '#c03860',
};
const genreColor = (genre: string) => GENRE_COLORS[genre] || '#8b7a60';

// ─── Props ────────────────────────────────────────────────────────────────────
interface BooksProps {
  books: Book[];
  onAdd: () => void;
  onEdit: (book: Book) => void;
  onBorrow: (book: Book) => void;
  onViewDetail: (book: Book) => void;
  onDeleted: (msg: string) => void;
  onError: (msg: string) => void;
  readOnly?: boolean;
  // readOnly={true}  → member  (browse + borrow, native <select> filters)
  // readOnly={false} → admin   (add/edit/delete, custom dropdowns, no borrow)
}

// ─── CustomSelect — admin toolbar only ───────────────────────────────────────
interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value) || options[0];

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: PALETTE.inputBg,
          border: `1px solid ${open ? PALETTE.btnPrimary : PALETTE.inputBorder}`,
          borderRadius: 8,
          padding: '8px 36px 8px 14px',
          color: PALETTE.textPrimary,
          cursor: 'pointer',
          fontSize: 14,
          whiteSpace: 'nowrap',
          position: 'relative',
          minWidth: 130,
          textAlign: 'left',
        }}
      >
        {selected.label}
        <span style={{
          position: 'absolute', right: 12, top: '50%',
          transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          transition: 'transform 0.15s', fontSize: 10, color: PALETTE.textMuted,
        }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 200,
          background: PALETTE.cardBg,
          border: `1.5px solid ${PALETTE.cardBorder}`,
          borderRadius: 8,
          boxShadow: '0 4px 16px rgba(120,90,50,0.12)',
          minWidth: '100%',
          overflow: 'hidden',
        }}>
          {options.map(o => (
            <div
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              style={{
                padding: '9px 16px',
                fontSize: 14,
                cursor: 'pointer',
                color: o.value === value ? PALETTE.btnPrimary : PALETTE.textPrimary,
                fontWeight: o.value === value ? 600 : 400,
                background: o.value === value ? 'var(--surface2)' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = o.value === value ? 'var(--surface2)' : 'transparent')}
            >
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── BookCover — shown for BOTH admin and member ──────────────────────────────
const BookCover: React.FC<{ isbn: string; title: string; color: string }> = ({ isbn, title, color }) => {
  const [err, setErr] = useState(0);
  const cleanIsbn = isbn.replace(/[-\s]/g, '');
  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    if (img.naturalWidth <= 1) setErr(n => n + 1);
  };
  return (
    <div style={{
      width: '100%',
      height: 160,
      marginBottom: 12,
      borderRadius: 8,
      overflow: 'hidden',
      background: 'var(--surface2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {err < 2 ? (
        <img
          src={
            err === 0
              ? `https://covers.openlibrary.org/b/isbn/${cleanIsbn}-M.jpg`
              : `https://covers.openlibrary.org/b/title/${encodeURIComponent(title)}-M.jpg`
          }
          alt={title}
          onLoad={handleLoad}
          onError={() => setErr(n => n + 1)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          background: `${color}22`,
          border: `2px solid ${color}44`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          <span style={{ fontSize: 40 }}>📖</span>
          <span style={{ fontSize: 11, color, fontWeight: 600, textAlign: 'center', padding: '0 8px' }}>
            {title}
          </span>
        </div>
      )}
    </div>
  );
};

// ─── Main Books Component ─────────────────────────────────────────────────────
const Books: React.FC<BooksProps> = ({
  books, onAdd, onEdit, onBorrow, onViewDetail, onDeleted, onError, readOnly,
}) => {
  const [search, setSearch] = useState('');
  const [genre,  setGenre]  = useState('');
  const [avail,  setAvail]  = useState('');

  const filtered = books.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !search || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q) || b.isbn.toLowerCase().includes(q);
    const matchGenre  = !genre  || b.genre === genre;
    const matchAvail  = !avail  || (avail === 'yes' ? b.is_available : !b.is_available);
    return matchSearch && matchGenre && matchAvail;
  });

  const genres = Array.from(new Set(books.map(b => b.genre)));

  const handleDelete = async (book: Book) => {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    try   { await deleteBook(book.id); onDeleted('Book deleted.'); }
    catch (e: any) { onError(e.response?.data?.error || 'Delete failed.'); }
  };

  const genreOptions = [
    { value: '', label: 'All Genres' },
    ...genres.map(g => ({ value: g, label: g.replace('_', ' ') })),
  ];
  const availOptions = [
    { value: '', label: 'All Status' },
    { value: 'yes', label: 'Available' },
    { value: 'no', label: 'Unavailable' },
  ];

  return (
    <div className="page" style={{ background: PALETTE.pageBg, minHeight: '100%' }}>

      {/* ── Page header ── */}
      <div className="page-header" style={{ borderBottom: `1px solid ${PALETTE.cardBorder}`, paddingBottom: 16, marginBottom: 20 }}>
        <div>
          <h1 style={{ color: PALETTE.textPrimary, fontWeight: 600, margin: 0 }}>
            {readOnly ? 'Browse Books' : 'Books'}
          </h1>
          <p className="page-sub" style={{ color: PALETTE.textSecondary, margin: '4px 0 0' }}>
            {books.length} books in catalog
          </p>
        </div>
        {/* Add Book button: admin only */}
        {!readOnly && (
          <button
            className="btn-primary"
            onClick={onAdd}
            style={{
              background: PALETTE.btnPrimary,
              color: PALETTE.btnPrimaryTxt,
              border: 'none',
              borderRadius: 8,
              padding: '8px 18px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add Book
          </button>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="toolbar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input
          className="search-input"
          placeholder="Search title, author, ISBN..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: PALETTE.inputBg,
            border: `1px solid ${PALETTE.inputBorder}`,
            borderRadius: 8,
            padding: '8px 14px',
            color: PALETTE.textPrimary,
            flex: '1 1 220px',
            minWidth: 180,
            outline: 'none',
          }}
        />

        {/* Admin → custom styled dropdowns | Member → native <select> */}
        {!readOnly ? (
          <>
            <CustomSelect value={genre} onChange={setGenre} options={genreOptions} />
            <CustomSelect value={avail} onChange={setAvail} options={availOptions} />
          </>
        ) : (
          <>
            <select className="filter-select" value={genre} onChange={e => setGenre(e.target.value)}>
              {genreOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="filter-select" value={avail} onChange={e => setAvail(e.target.value)}>
              {availOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </>
        )}

        {(search || genre || avail) && (
          <button
            className="btn-secondary"
            onClick={() => { setSearch(''); setGenre(''); setAvail(''); }}
            style={{
              background: PALETTE.btnSecondary,
              color: PALETTE.btnSecondaryTxt,
              border: `1px solid ${PALETTE.inputBorder}`,
              borderRadius: 8,
              padding: '8px 14px',
              cursor: 'pointer',
            }}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* ── Book cards grid ── */}
      <div className="card-grid">
        {filtered.map(book => (
          <BookCard
            key={book.id}
            book={book}
            readOnly={readOnly}
            onBorrow={() => onBorrow(book)}
            onViewDetail={() => onViewDetail(book)}
            onEdit={() => onEdit(book)}
            onDelete={() => handleDelete(book)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="empty-state" style={{ color: PALETTE.textMuted, textAlign: 'center', padding: 40 }}>
            <div className="empty-icon" style={{ fontSize: 32, marginBottom: 8 }}>📚</div>
            <p style={{ margin: 0, color: PALETTE.textPrimary }}>No books found</p>
            <p style={{ fontSize: 13, color: PALETTE.textMuted, marginTop: 4 }}>
              Try different search terms or clear filters.
            </p>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p style={{ color: PALETTE.textMuted, fontSize: 12, marginTop: 8 }}>
          {filtered.length} book{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}
    </div>
  );
};

// ─── BookCard ─────────────────────────────────────────────────────────────────
interface BookCardProps {
  book: Book;
  readOnly?: boolean;
  onBorrow: () => void;
  onViewDetail: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const BookCard: React.FC<BookCardProps> = ({
  book, readOnly, onBorrow, onViewDetail, onEdit, onDelete,
}) => {
  const color = book.genre_color || genreColor(book.genre);

  return (
    <div
      className={`book-card ${!book.is_available ? 'book-unavailable' : ''}`}
      style={{
        background: book.is_available ? PALETTE.cardBg : PALETTE.cardUnavail,
        border: `1.5px solid ${PALETTE.cardBorder}`,
        borderRadius: 12,
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        opacity: book.is_available ? 1 : 0.75,
        boxShadow: '0 1px 4px rgba(120, 90, 50, 0.08)',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Genre colour top bar */}
      <div style={{ height: 4, background: color, margin: '-20px -20px 16px -20px', borderRadius: '12px 12px 0 0' }} />

      {/* Book cover image — BOTH admin and member */}
      <BookCover isbn={book.isbn} title={book.title} color={color} />

      {/* Genre label */}
      <div className="book-genre">{book.genre.replace('_', ' ')}</div>

      {/* Title — fixed to dark readable color */}
      <h3 className="book-title" style={{ color: PALETTE.textPrimary }}>{book.title}</h3>

      {/* Author */}
      <p className="book-author">by {book.author}</p>

      {/* Description */}
      {book.description && (
        <p className="book-desc">{book.description}</p>
      )}

      {/* ISBN + year */}
      <div className="book-meta">
        <span className="isbn">ISBN: {book.isbn}</span>
        {book.published_year && book.published_year > 0 && (
          <span>{book.published_year}</span>
        )}
      </div>

      {/* ── Footer: copies + StatusBadge + action buttons ── */}
      <div className="book-footer">
        <div className="copies-info">
          {/* copies-count — fixed to readable colors */}
          <span
            className={`copies-count ${book.available_copies === 0 ? 'copies-none' : ''}`}
            style={{
              color: book.available_copies === 0 ? PALETTE.copiesNone : PALETTE.copiesOk,
              fontWeight: 600,
            }}
          >
            {book.available_copies}/{book.total_copies} available
          </span>
          {/* StatusBadge — from member code, kept for both */}
          <StatusBadge status={book.is_available ? 'available' : 'unavailable'} />
        </div>

        <div className="book-actions">
          {/* Details — both admin and member */}
          <button
            className="btn-sm btn-edit"
            onClick={onViewDetail}
          >
            Details
          </button>

          {/* Borrow / Request — member only */}
          {readOnly && (
            <button
              className="btn-sm"
              onClick={onBorrow}
              disabled={!book.is_available}
              style={{
                background: book.is_available ? PALETTE.btnBorrow : PALETTE.btnEdit,
                color:      book.is_available ? PALETTE.btnBorrowTxt : PALETTE.textMuted,
                border: 'none',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: book.is_available ? 'pointer' : 'not-allowed',
                opacity: book.is_available ? 1 : 0.6,
              }}
            >
              Request
            </button>
          )}

          {/* Edit & Delete — admin only */}
          {!readOnly && (
            <>
              <button className="btn-sm btn-edit" onClick={onEdit}>Edit</button>
              <button className="btn-sm btn-delete" onClick={onDelete}>×</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Books;