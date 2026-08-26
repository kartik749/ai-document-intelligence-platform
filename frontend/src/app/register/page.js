"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Registration failed");
      }

      router.push("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form glass-card animate-fade-in-up">
        <h1>Create an account</h1>

        {error && <p className="error-text">{error}</p>}

        <div>
          <label className="label-modern">Email Address</label>
          <input
            className="input-modern"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            required
          />
        </div>

        <div>
          <label className="label-modern">Password</label>
          <input
            className="input-modern"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a secure password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="auth-form-footer">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}