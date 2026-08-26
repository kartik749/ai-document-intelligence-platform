"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuth";

export default function UploadPage() {
  const authChecked = useAuthGuard();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    setError("");

    if (selected && selected.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      setFile(null);
      return;
    }

    if (selected && selected.size > 10 * 1024 * 1024) {
      setError("File exceeds 10MB limit.");
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiFetch("/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        const message = Array.isArray(data.detail) ?
        data.detail.map((d) => d.msg).join(", ") : data.detail || "Upload Failed";
        throw new Error(message);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  if (!authChecked) return null;

  return (
    <div className="dashboard-layout">
      <nav className="navbar" style={{ marginBottom: '4rem' }}>
        <div className="navbar-brand" style={{ cursor: 'pointer' }} onClick={() => router.push("/dashboard")}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, var(--accent), #818cf8)' }}></div>
          DocIntel
        </div>
        <div className="navbar-actions">
          <button onClick={() => router.push("/dashboard")} className="btn btn-ghost">Cancel</button>
        </div>
      </nav>

      <div className="upload-container">
        <div className="glass-card animate-fade-in-up" style={{ width: '100%', maxWidth: '540px' }}>
          <h1 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Upload Document</h1>
          <p className="text-secondary" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Extract insights and chat with your PDF documents (max 10MB)
          </p>

          {error && <p className="error-text">{error}</p>}

          <form onSubmit={handleUpload}>
            <div 
              className="upload-dropzone" 
              onClick={() => !file && fileInputRef.current?.click()}
              style={{ borderColor: file ? 'var(--accent)' : 'var(--border-color)', backgroundColor: file ? 'var(--bg-card)' : 'rgba(17, 20, 24, 0.5)' }}
            >
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
                ref={fileInputRef}
                disabled={uploading}
              />
              
              <div className="upload-icon">
                {file ? (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="9 15 12 18 15 15"></polyline><line x1="12" y1="12" x2="12" y2="18"></line></svg>
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                )}
              </div>
              
              {file ? (
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{file.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <button 
                    type="button" 
                    className="btn btn-ghost" 
                    style={{ marginTop: '1rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    disabled={uploading}
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>Click or drag file to upload</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>PDF files only</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => router.push("/dashboard")} disabled={uploading}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!file || uploading}>
                {uploading ? "Processing..." : "Upload Document"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}