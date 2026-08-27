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
    <div className="flex flex-col h-screen max-w-4xl mx-auto relative animate-fade-in">
      <header className="flex items-center p-5 bg-white border-b border-border shadow-sm sticky top-0 z-10">
        <button className="btn btn-ghost p-2" onClick={() => router.push("/dashboard")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
        </button>
        <h2 className="text-lg font-medium ml-4 overflow-hidden text-ellipsis whitespace-nowrap text-foreground">{document?.filename || "Loading document..."}</h2>
        
        {document?.status && (
          <span className={`badge badge-${document.status} ml-auto`}>
            {document.status === 'ready' ? 'Ready' : document.status}
          </span>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 mt-8 border-none bg-transparent animate-fade-in-up text-center">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-foreground">Ask your document anything</h3>
            <p className="text-muted max-w-[300px]">
              The AI has processed this document and is ready to extract intelligence, summarize content, or find specific details.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col max-w-[85%] animate-fade-in-up ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
            <div className={`p-4 px-5 rounded-2xl text-[0.95rem] leading-relaxed shadow-sm ${msg.role === 'user' ? 'rounded-br-sm bg-primary text-white' : 'rounded-bl-sm bg-white border border-border text-foreground'}`}>
              {msg.role === "assistant" ? (
                <div className="prose prose-zinc max-w-none prose-p:leading-relaxed prose-pre:bg-zinc-50 prose-pre:border prose-pre:border-border prose-a:text-accent prose-code:text-accent">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="m-0 text-inherit">{msg.content}</p>
              )}
            </div>
            
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 text-xs text-muted flex gap-2 items-center px-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
                Sources: 
                {[...new Set(msg.sources.map((s) => s.page_number))]
                  .sort((a, b) => a - b)
                  .map((p) => (
                    <span key={p} className="bg-zinc-100 border border-zinc-200 text-zinc-600 px-2 py-0.5 rounded">p.{p}</span>
                  ))}
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex flex-col max-w-[85%] self-start items-start animate-fade-in-up">
            <div className="p-4 px-5 rounded-2xl rounded-bl-sm shadow-sm bg-white border border-border">
              <div className="flex gap-1.5 items-center h-6">
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-zinc-400 animate-pulse" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="error-text" style={{ alignSelf: 'center', margin: '1rem 0' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            {error}
          </div>
        )}

        <div ref={bottomRef} className="h-px" />
      </div>

      <div className="p-6 bg-white border-t border-border sticky bottom-0">
        <form className="flex gap-3 bg-zinc-50 p-2 rounded-full border border-border shadow-sm transition-all duration-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent-transparent focus-within:bg-white" onSubmit={handleSend}>
          <input
            type="text"
            className="flex-1 bg-transparent border-none px-5 py-3 text-foreground text-[0.95rem] outline-none placeholder:text-muted"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Message Document AI..."
            disabled={sending}
          />
          <button type="submit" className="bg-primary text-white border-none rounded-full w-12 h-12 flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-primary-hover active:scale-95 disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:hover:bg-zinc-200 disabled:active:scale-100" disabled={sending || !question.trim()}>
            {sending ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
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