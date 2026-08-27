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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 animate-fade-in">
      <nav className="flex items-center justify-between py-6 mb-8 border-b border-border">
        <div className="text-xl font-semibold flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          DocIntel
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/upload")} className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Upload
          </button>
          <button onClick={handleLogout} className="btn btn-ghost">Log out</button>
        </div>
      </nav>

      <main>
        <h1 className="text-3xl font-bold mb-8 tracking-tight">My Documents</h1>
        
        {error && <p className="error-text">{error}</p>}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card flex flex-col h-40 p-5">
                <div className="animate-pulse bg-zinc-200 rounded h-6 w-3/4 mb-4"></div>
                <div className="animate-pulse bg-zinc-200 rounded h-4 w-1/3 mt-auto"></div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20 px-4 border border-dashed border-border rounded-2xl bg-card animate-fade-in-up">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <h3 className="text-xl font-semibold mb-2 text-foreground">No documents yet</h3>
            <p className="text-muted max-w-md mb-8">Upload your first document to start extracting intelligence and chatting with your data.</p>
            <button onClick={() => router.push("/upload")} className="btn btn-primary">Upload Document</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
            {documents.map((doc, index) => (
              <div
                key={doc.id}
                className="glass-card glass-card-hoverable flex flex-col h-full cursor-pointer p-5"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => doc.status === "ready" && router.push(`/documents/${doc.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-foreground leading-tight line-clamp-2">{doc.filename}</h3>
                </div>
                <div className="mt-auto pt-4 flex justify-between items-center border-t border-border">
                  <span className={`badge badge-${doc.status}`}>
                    {STATUS_LABELS[doc.status]}
                  </span>
                  {doc.page_count > 0 && <span className="text-xs text-muted">{doc.page_count} pages</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}