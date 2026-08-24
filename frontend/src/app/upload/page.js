"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuth";

export default function UploadPage() {
  const authChecked = useAuthGuard();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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
    <div className="upload-container">
      <div className="upload-card">
        <h1>Upload a Document</h1>
        <p className="upload-hint">PDF only, up to 10MB</p>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleUpload}>
          <input type="file" accept="application/pdf" onChange={handleFileChange} />

          {file && <p className="file-selected">Selected: {file.name}</p>}

          <div className="upload-actions">
            <button type="button" className="secondary" onClick={() => router.push("/dashboard")}>
              Cancel
            </button>
            <button type="submit" disabled={!file || uploading}>
              {uploading ? "Processing... this may take a moment" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}