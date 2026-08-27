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
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 min-h-screen flex flex-col">
      <nav className="flex items-center justify-between py-6 mb-12 border-b border-border">
        <div className="text-xl font-semibold flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          DocIntel
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/dashboard")} className="btn btn-ghost">Cancel</button>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center pb-20">
        <div className="w-full max-w-xl glass-card animate-fade-in-up p-8 md:p-10">
          <h1 className="text-2xl font-bold mb-2 text-center tracking-tight">Upload Document</h1>
          <p className="text-muted text-center mb-8">
            Extract insights and chat with your PDF documents (max 10MB)
          </p>

          {error && <p className="error-text">{error}</p>}

          <form onSubmit={handleUpload}>
            <div 
              className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 cursor-pointer relative ${file ? 'border-accent bg-blue-50/50' : 'border-border bg-zinc-50 hover:border-accent hover:bg-blue-50/30'}`}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
                ref={fileInputRef}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="mb-4 flex justify-center text-accent">
                {file ? (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><polyline points="9 15 12 18 15 15"></polyline><line x1="12" y1="12" x2="12" y2="18"></line></svg>
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                )}
              </div>
              
              {file ? (
                <div>
                  <p className="font-medium text-foreground m-0">{file.name}</p>
                  <p className="text-xs text-muted mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  <button 
                    type="button" 
                    className="btn btn-ghost mt-4 px-3 py-1 text-xs" 
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    disabled={uploading}
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <p className="font-medium text-foreground m-0">Click or drag file to upload</p>
                  <p className="text-xs text-muted mt-1">PDF files only</p>
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8 justify-end">
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