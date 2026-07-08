import { useState } from "react";
import { ADMIN_HASH } from "./config";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

const SESSION_KEY = "wzfs_admin_auth";

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

export default function LoginGate({ onAuth }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!pw.trim()) return;
    setLoading(true);
    setError("");
    try {
      const hash = await sha256(pw);
      if (hash === ADMIN_HASH) {
        sessionStorage.setItem(SESSION_KEY, "1");
        onAuth();
      } else {
        setError("Incorrect password. Please try again.");
        setPw("");
      }
    } catch {
      setError("Login failed — please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="login-overlay">
      <div className="login-card">
        <div className="login-logo">🏫</div>
        <h2 className="login-title">WEIHAI ZHONGSHI FOREIGN SCHOOL</h2>
        <p className="login-sub">Report Card Generator · Admin Access</p>
        <div className="login-form">
          <input
            className="login-input"
            type="password"
            placeholder="Enter admin password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            autoFocus
          />
          <button className="login-btn" onClick={handleLogin} disabled={loading || !pw.trim()}>
            {loading ? "Verifying…" : "Login →"}
          </button>
        </div>
        {error && <p className="login-error">{error}</p>}
        <p className="login-footer">For access, contact the ICT Department</p>
      </div>
    </div>
  );
}
