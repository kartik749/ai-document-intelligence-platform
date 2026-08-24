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
  }, [messages]);

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
    <div className="chat-page">
      <header className="chat-header">
        <button className="back-button" onClick={() => router.push("/dashboard")}>
          ← Back
        </button>
        <h2>{document?.filename || "Loading..."}</h2>
      </header>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">Ask a question about this document to get started.</p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            {msg.role === "assistant" ? (
                <div className="markdown-content">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    ) : (
                    <p>{msg.content}</p>
                    )}
            {msg.sources && msg.sources.length > 0 && (
              <div className="chat-sources">
                Sources: {[...new Set(msg.sources.map((s) => s.page_number))].sort((a, b) => a - b)
                .map((p) => `p.${p}`).join(", ")}
              </div>
            )}
          </div>
        ))}

        {sending && <div className="chat-bubble assistant typing">Thinking...</div>}

        <div ref={bottomRef} />
      </div>

      {error && <p className="error-text chat-error">{error}</p>}

      <form className="chat-input-bar" onSubmit={handleSend}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about this document..."
          disabled={sending}
        />
        <button type="submit" disabled={sending || !question.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}