// LOCATION: frontend/src/components/ChatbotWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import API from '../api/books';

interface AuthUser { username: string; role: string; first_name?: string; }
interface Message { id: number; role: 'user' | 'assistant'; text: string; ts: Date; }
interface Props { user: AuthUser | null; }

const SUGGESTED_ADMIN = ['How do I approve a borrow?', 'How do I add a new book?', 'What does Overdue mean?'];
const SUGGESTED_MEMBER = ['How do I borrow a book?', 'How long can I keep a book?', 'How do I check my borrows?'];

export default function ChatbotWidget({ user }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Message[]>([{
    id: 0, role: 'assistant', ts: new Date(),
    text: `Hi${user?.first_name ? ` ${user.first_name}` : ''}! I'm LibraBot. Ask me anything about the library!`,
  }]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(1);

  useEffect(() => {
    if (!document.getElementById('librabot-bounce')) {
      const s = document.createElement('style');
      s.id = 'librabot-bounce';
      s.textContent = `@keyframes lb-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`;
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, msgs]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: idRef.current++, role: 'user', text: text.trim(), ts: new Date() };
    setMsgs(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await API.post('/chatbot/', { message: text.trim() });
      const reply = res.data?.assistant?.message || "Sorry, I couldn't get a response.";
      setMsgs(prev => [...prev, { id: idRef.current++, role: 'assistant', text: reply, ts: new Date() }]);
    } catch {
      setMsgs(prev => [...prev, { id: idRef.current++, role: 'assistant', text: 'Could not reach the AI. Make sure Ollama is running.', ts: new Date() }]);
    } finally { setLoading(false); }
  };

  const SUGGESTED = user?.role === 'admin' ? SUGGESTED_ADMIN : SUGGESTED_MEMBER;

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 9999,
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--binding, #532c2e)', border: '2px solid var(--leather, #c29b87)',
          color: 'var(--parchment, #f6f2ea)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.45)', fontSize: 22,
        }}
        title="LibraBot"
      >
        {open ? <X size={20} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 92, right: 28, zIndex: 9998,
          width: 370, height: 520,
          background: 'var(--surface, #1e1e1e)', border: '1px solid var(--border, #333)',
          borderRadius: 16, display: 'flex', flexDirection: 'column',
          boxShadow: '0 16px 48px rgba(0,0,0,0.55)', overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {/* Header */}
          <div style={{ background: 'var(--wood, #3D2314)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--binding, #532c2e)', border: '1px solid var(--leather, #c29b87)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📚</div>
            <div>
              <div style={{ color: 'var(--parchment, #f6f2ea)', fontSize: 14, fontWeight: 700 }}>LibraBot</div>
              <div style={{ color: 'var(--leather, #c29b87)', fontSize: 11 }}>Library AI Assistant</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <span style={{ color: '#10b981', fontSize: 11 }}>Online</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'thin' }}>
            {msgs.map(m => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--binding, #532c2e)', border: '1px solid var(--leather, #c29b87)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, marginRight: 6, marginTop: 2 }}>📚</div>
                )}
                <div style={{
                  maxWidth: '76%', padding: '8px 12px',
                  borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? 'var(--binding, #532c2e)' : 'var(--surface2, #2a2a2a)',
                  color: m.role === 'user' ? 'var(--parchment, #f6f2ea)' : 'var(--text, #e5e5e5)',
                  fontSize: 13, lineHeight: 1.55,
                  border: m.role === 'user' ? 'none' : '1px solid var(--border, #333)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {m.text}
                  <div style={{ fontSize: 10, color: m.role === 'user' ? 'rgba(246,242,234,0.45)' : 'var(--text-muted,#888)', marginTop: 3, textAlign: 'right' }}>
                    {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--binding, #532c2e)', border: '1px solid var(--leather, #c29b87)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>📚</div>
                <div style={{ background: 'var(--surface2, #2a2a2a)', border: '1px solid var(--border, #333)', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--leather, #c29b87)', animation: `lb-bounce 1.2s ${i*0.2}s ease-in-out infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {msgs.length === 1 && (
            <div style={{ padding: '4px 12px 6px', display: 'flex', flexWrap: 'wrap', gap: 5, borderTop: '1px solid var(--border, #333)' }}>
              {SUGGESTED.map(q => (
                <button key={q} onClick={() => sendMessage(q)} style={{ background: 'var(--surface2, #2a2a2a)', border: '1px solid var(--border, #333)', borderRadius: 20, padding: '5px 10px', color: 'var(--oak, #a97954)', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>{q}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border, #333)', display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface, #1e1e1e)' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input); } }}
              placeholder="Ask about the library..."
              disabled={loading}
              style={{ flex: 1, background: 'var(--surface2, #2a2a2a)', border: '1px solid var(--border, #333)', borderRadius: 22, padding: '8px 14px', color: 'var(--text, #e5e5e5)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans', sans-serif" }}
              onFocus={e => { e.target.style.borderColor = 'var(--oak, #a97954)'; }}
              onBlur={e => { e.target.style.borderColor = 'var(--border, #333)'; }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              style={{ width: 36, height: 36, borderRadius: '50%', background: input.trim() && !loading ? 'var(--binding, #532c2e)' : 'var(--surface2, #2a2a2a)', border: 'none', color: 'var(--parchment, #f6f2ea)', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
