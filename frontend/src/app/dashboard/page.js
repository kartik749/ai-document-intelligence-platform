"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearTokens } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuth";

const STATUS_LABELS = {
  uploaded: "Uploaded",
  processing: "Processing...",
  ready: "Ready",
  failed: "Failed",
};

export default function DashboardPage() {
  const authChecked = useAuthGuard();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!authChecked) return;

    async function loadDocuments() {
      try {
        const response = await apiFetch("/documents");
        if (!response.ok) throw new Error("Failed to load documents");
        const data = await response.json();
        setDocuments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadDocuments();
  }, [authChecked]);

  function handleLogout() {
    clearTokens();
    router.push("/login");
  }

  if (!authChecked) return null;

  return (
    <div className="dashboard-layout animate-fade-in">
      <nav className="navbar">
        <div className="navbar-brand">
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, var(--accent), #818cf8)' }}></div>
          DocIntel
        </div>
        <div className="navbar-actions">
          <button onClick={() => router.push("/upload")} className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload
          </button>
          <button onClick={handleLogout} className="btn btn-ghost">Log out</button>
        </div>
      </nav>

      <main>
        <h1 style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>My Documents</h1>
        
        {error && <p className="error-text">{error}</p>}

        {loading ? (
          <div className="document-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card document-card">
                <div className="skeleton" style={{ height: '24px', width: '80%', marginBottom: '1rem' }}></div>
                <div className="skeleton" style={{ height: '16px', width: '40%', marginTop: 'auto' }}></div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="empty-state animate-fade-in-up">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <h3>No documents yet</h3>
            <p className="text-secondary">Upload your first document to start extracting intelligence and chatting with your data.</p>
            <button onClick={() => router.push("/upload")} className="btn btn-primary">Upload Document</button>
          </div>
        ) : (
          <div className="document-grid animate-fade-in-up">
            {documents.map((doc, index) => (
              <div
                key={doc.id}
                className="glass-card glass-card-hoverable document-card"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => doc.status === "ready" && router.push(`/documents/${doc.id}`)}
              >
                <div className="document-card-header">
                  <h3 className="document-card-title">{doc.filename}</h3>
                </div>
                <div className="document-card-footer">
                  <span className={`badge badge-${doc.status}`}>
                    {STATUS_LABELS[doc.status]}
                  </span>
                  {doc.page_count > 0 && <span className="document-meta">{doc.page_count} pages</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}