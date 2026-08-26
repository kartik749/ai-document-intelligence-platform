"use client";

import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuth";

export default function ChatPage() {
  const authChecked = useAuthGuard();
  const { id } = useParams();
  const router = useRouter();

  const [document, setDocument] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!authChecked) return;

    async function loadDocument() {
      const response = await apiFetch(`/documents/${id}`);
      if (response.ok) {
        setDocument(await response.json());
      }
    }
    loadDocument();
  }, [authChecked, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(e) {
    e.preventDefault();
    if (!question.trim() || sending) return;

    const userQuestion = question;
    setQuestion("");
    setError("");
    setSending(true);

    setMessages((prev) => [...prev, { role: "user", content: userQuestion, sources: null }]);

    try {
      const response = await apiFetch("/chat", {
        method: "POST",
        body: JSON.stringify({
          document_id: id,
          conversation_id: conversationId,
          question: userQuestion,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to get an answer");
      }

      const data = await response.json();
      setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  if (!authChecked) return null;

  return (
    <div className="chat-layout animate-fade-in">
      <header className="chat-header">
        <button className="btn btn-ghost" style={{ padding: '0.5rem' }} onClick={() => router.push("/dashboard")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h2 className="chat-title">{document?.filename || "Loading document..."}</h2>
        
        {document?.status && (
          <span className={`badge badge-${document.status}`} style={{ marginLeft: 'auto' }}>
            {document.status === 'ready' ? 'Ready' : document.status}
          </span>
        )}
      </header>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="empty-state animate-fade-in-up" style={{ padding: '2rem', marginTop: '2rem', border: 'none', background: 'transparent' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-card-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Ask your document anything</h3>
            <p className="text-secondary" style={{ maxWidth: 300 }}>
              The AI has processed this document and is ready to extract intelligence, summarize content, or find specific details.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble-container ${msg.role}`}>
            <div className="chat-bubble">
              {msg.role === "assistant" ? (
                <div className="markdown-content">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p style={{ margin: 0, color: 'inherit' }}>{msg.content}</p>
              )}
            </div>
            
            {msg.sources && msg.sources.length > 0 && (
              <div className="chat-sources">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                Sources: 
                {[...new Set(msg.sources.map((s) => s.page_number))]
                  .sort((a, b) => a - b)
                  .map((p) => (
                    <span key={p} className="source-tag">p.{p}</span>
                  ))}
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="chat-bubble-container assistant">
            <div className="chat-bubble" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', height: '24px' }}>
                <div className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'fadeInOut 1.4s infinite 0s' }}></div>
                <div className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'fadeInOut 1.4s infinite 0.2s' }}></div>
                <div className="dot" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: 'fadeInOut 1.4s infinite 0.4s' }}></div>
              </div>
              <style jsx>{`
                @keyframes fadeInOut {
                  0%, 100% { opacity: 0.3; transform: scale(0.8); }
                  50% { opacity: 1; transform: scale(1.2); }
                }
              `}</style>
            </div>
          </div>
        )}

        {error && (
          <div className="error-text" style={{ alignSelf: 'center', margin: '1rem 0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <div ref={bottomRef} style={{ height: 1 }} />
      </div>

      <div className="chat-input-wrapper">
        <form className="chat-input-form" onSubmit={handleSend}>
          <input
            type="text"
            className="chat-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Message Document AI..."
            disabled={sending}
          />
          <button type="submit" className="chat-send-btn" disabled={sending || !question.trim()}>
            {sending ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 2s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
              <style jsx>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}