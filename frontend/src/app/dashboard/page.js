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
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>My Documents</h1>
        <div className="header-actions">
          <button onClick={() => router.push("/upload")}>Upload Document</button>
          <button onClick={handleLogout} className="secondary">Log out</button>
        </div>
      </header>

      {loading && <p>Loading documents...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && documents.length === 0 && (
        <div className="empty-state">
          <p>You haven&apos;t uploaded any documents yet.</p>
          <button onClick={() => router.push("/upload")}>Upload your first document</button>
        </div>
      )}

      <div className="document-grid">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="document-card"
            onClick={() => doc.status === "ready" && router.push(`/documents/${doc.id}`)}
          >
            <h3>{doc.filename}</h3>
            <span className={`status-badge status-${doc.status}`}>
              {STATUS_LABELS[doc.status]}
            </span>
            {doc.page_count > 0 && <p className="page-count">{doc.page_count} pages</p>}
          </div>
        ))}
      </div>
    </div>
  );
}