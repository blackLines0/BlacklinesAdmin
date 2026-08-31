import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <svg className="logo-mark" viewBox="0 0 130 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ height: 22 }}>
            <polyline points="8,6 8,34 14.5,54" stroke="#0F172A" strokeWidth="4" strokeLinecap="square" />
            <polyline points="28,6 28,26 34.5,40 28,54" stroke="#0F172A" strokeWidth="4" strokeLinecap="square" />
            <polyline points="48,6 54.5,20 48,34 54.5,54" stroke="#0F172A" strokeWidth="4" strokeLinecap="square" />
            <polyline points="68,6 74.5,18 68,30 74.5,42 68,54" stroke="#0F172A" strokeWidth="4" strokeLinecap="square" />
            <polyline points="88,6 94.5,15 88,24 94.5,33 88,42 94.5,54" stroke="#0F172A" strokeWidth="4" strokeLinecap="square" />
          </svg>
          <span className="name">Blacklines — Admin</span>
        </div>
        <h1>Connexion</h1>
        <p className="sub">Accédez à l&apos;espace de gestion Blacklines.</p>
        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              placeholder="vous@blacklines.tg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="login-field">
            <label>Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error ? <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</p> : null}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
