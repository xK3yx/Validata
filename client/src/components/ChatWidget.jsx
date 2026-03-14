import React, { useState, useRef, useEffect } from 'react';
import api from '../api/client';

export default function ChatWidget({ report, idea_title }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! I have full context on "${idea_title}". Ask me anything — pricing strategy, VC targeting, technical feasibility, go-to-market...` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = [...messages, userMsg]
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role, content: m.content }));

      const { data } = await api.post('/chat', { messages: apiMessages, report, idea_title });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble responding. Please try again.',
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  }

  const SUGGESTED = [
    'How should I price this?',
    'Who are the best VCs for this?',
    'What\'s the biggest risk I should address first?',
    'How can I differentiate from competitors?',
  ];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-500/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Ask AI follow-up questions"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        )}
        {!open && messages.length > 1 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">
            {messages.filter(m => m.role === 'assistant').length - 1}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] max-h-[520px] bg-[#111118] border border-[#1e1e2e] rounded-2xl shadow-2xl shadow-black/50 flex flex-col animate-[fadeUp_0.3s_ease_forwards]">
          {/* Header */}
          <div className="p-4 border-b border-[#1e1e2e] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">AI Follow-up Chat</p>
              <p className="text-slate-500 text-xs truncate">{idea_title}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0" style={{ maxHeight: '300px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-500 text-white rounded-br-sm'
                    : msg.error
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-[#1a1a28] text-slate-200 border border-[#2a2a3e] rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a28] border border-[#2a2a3e] px-3 py-2 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <span key={i} className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions (only shown on first message) */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex gap-2 overflow-x-auto scroll-hide">
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setInput(s)}
                  className="flex-shrink-0 text-xs bg-[#1a1a28] border border-[#2a2a3e] text-slate-400 hover:text-white hover:border-indigo-500/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage} className="p-3 border-t border-[#1e1e2e] flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask anything about this idea..."
              className="flex-1 bg-[#0d0d15] border border-[#1e1e2e] rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
