"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await authClient.signIn.email({ email: email.trim(), password });
    if (error) {
      setError(error.status === 429 ? "Too many attempts. Wait a minute and try again." : "Wrong email or password.");
      setBusy(false);
      return;
    }
    // full load so the server renders the panel with the new session cookie
    window.location.assign("/admin");
  };

  return (
    <form className="ga-login-form" onSubmit={submit}>
      <label>
        <span>Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required autoFocus />
      </label>
      <label>
        <span>Password</span>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      {error && <p className="ga-error" role="alert">{error}</p>}
      <button type="submit" className="ga-btn ga-btn-primary" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}<LogIn size={16} />
      </button>
    </form>
  );
}
