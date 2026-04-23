import { useState, useRef, useEffect } from 'react';
import api from '../api';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm your AI assistant. Ask me anything about your profile, achievements, CGPA, or reports!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chat', { message: userMsg });
      setMessages(m => [...m, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: 'Sorry, AI service is unavailable right now.' }]);
    }
    setLoading(false);
  };

  const token = localStorage.getItem('token');
  if (!token) return null;

  return (
    <>
      {/* Floating button */}
      <button onClick={() => setOpen(o => !o)}
        style={{ position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#1e40af,#7c3aed)', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', zIndex: 9999, fontSize: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {open ? '✕' : '🤖'}
      </button>

      {/* Chat window */}
      {open && (
        <div style={{ position: 'fixed', bottom: 90, right: 24, width: 360, height: 480, background: '#fff', borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.18)', zIndex: 9998, display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg,#1e40af,#7c3aed)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🤖</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>AI Assistant</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>Powered by Gemini</div>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'linear-gradient(135deg,#1e40af,#7c3aed)' : '#f1f5f9',
                  color: m.role === 'user' ? '#fff' : '#0f172a', fontSize: 13, lineHeight: 1.5,
                  whiteSpace: 'pre-wrap'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ background: '#f1f5f9', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', fontSize: 13, color: '#64748b' }}>
                  Thinking...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={send} style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask anything..."
              style={{ flex: 1, padding: '9px 14px', border: '1.5px solid #d1d5db', borderRadius: 99, fontSize: 13, outline: 'none', fontFamily: 'inherit' }} />
            <button type="submit" disabled={loading || !input.trim()}
              style={{ background: loading ? '#94a3b8' : '#1e40af', color: '#fff', border: 'none', width: 38, height: 38, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
