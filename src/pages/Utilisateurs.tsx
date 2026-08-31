import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
import {
  avatarColor,
  formatDate,
  initialsOf,
  ROLE_LABELS,
  statusBadgeClass,
  USER_STATUS_LABELS,
  type UserRole,
  type UserStatus,
} from "../lib/format";

interface Brand {
  id: string;
  slug: string;
  nom: string;
}

interface User {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  accesMarques: string[];
  statut: UserStatus;
  createdAt: string;
}

const ROLE_OPTIONS = Object.entries(ROLE_LABELS) as [UserRole, string][];

const TABS: { key: UserRole | "all"; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "admin", label: "Administrateurs" },
  { key: "gestionnaire", label: "Gestionnaires" },
  { key: "support", label: "Support" },
];

const PERMISSIONS = [
  { label: "Gérer le catalogue (ajout / édition / suppression)", admin: true, gestionnaire: true, support: false },
  { label: "Gérer les commandes et leur statut", admin: true, gestionnaire: true, support: true },
  { label: "Voir le tableau de bord des ventes", admin: true, gestionnaire: true, support: false },
  { label: "Gérer les utilisateurs & rôles", admin: true, gestionnaire: false, support: false },
];

export default function Utilisateurs() {
  const [users, setUsers] = useState<User[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<UserRole | "all">("all");
  const [showInvite, setShowInvite] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNom, setInviteNom] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("gestionnaire");
  const [inviteBrands, setInviteBrands] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ email: string; tempPassword: string } | null>(null);

  function loadUsers() {
    setLoading(true);
    apiFetch<User[]>("/admin/users")
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadUsers();
    apiFetch<Brand[]>("/brands").then(setBrands).catch(() => {});
  }, []);

  const filtered = tab === "all" ? users : users.filter((u) => u.role === tab);

  async function updateRole(id: string, role: UserRole) {
    const previous = users;
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));

    try {
      await apiFetch(`/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ role }) });
    } catch (err) {
      setUsers(previous);
      alert(err instanceof Error ? err.message : "Échec de la mise à jour");
    }
  }

  function toggleInviteBrand(slug: string) {
    setInviteBrands((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviting(true);

    try {
      const result = await apiFetch<{ user: User; tempPassword: string }>("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail,
          nom: inviteNom,
          role: inviteRole,
          accesMarques: inviteBrands,
        }),
      });

      setInviteResult({ email: result.user.email, tempPassword: result.tempPassword });
      setInviteEmail("");
      setInviteNom("");
      setInviteRole("gestionnaire");
      setInviteBrands([]);
      loadUsers();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Échec de l'invitation");
    } finally {
      setInviting(false);
    }
  }

  function closeInvite() {
    setShowInvite(false);
    setInviteResult(null);
    setInviteError(null);
  }

  return (
    <AdminLayout title="Utilisateurs" crumb={`${users.length} comptes avec accès à l'espace admin`}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={() => setShowInvite((v) => !v)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Inviter un utilisateur
        </button>
      </div>

      {showInvite ? (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-head">
            <div><h3>Inviter un utilisateur</h3><div className="sub">Un mot de passe temporaire sera généré à transmettre manuellement</div></div>
          </div>
          <div className="panel-body">
            {inviteResult ? (
              <div>
                <p style={{ fontSize: 13.5, marginBottom: 10 }}>
                  Compte créé pour <strong>{inviteResult.email}</strong>. Transmets ce mot de passe temporaire :
                </p>
                <code style={{ display: "inline-block", background: "var(--bg)", padding: "8px 12px", borderRadius: 8, fontSize: 13.5, marginBottom: 16 }}>
                  {inviteResult.tempPassword}
                </code>
                <div className="form-actions">
                  <button className="btn btn-outline" onClick={closeInvite}>Fermer</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInvite}>
                <div className="form-grid">
                  <div className="field">
                    <label>Nom</label>
                    <input type="text" value={inviteNom} onChange={(e) => setInviteNom(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required />
                  </div>
                  <div className="field">
                    <label>Rôle</label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as UserRole)}>
                      {ROLE_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Accès marques</label>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", paddingTop: 8 }}>
                      {brands.map((b) => (
                        <label key={b.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                          <input
                            type="checkbox"
                            checked={inviteBrands.includes(b.slug)}
                            onChange={() => toggleInviteBrand(b.slug)}
                          />
                          {b.nom}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {inviteError ? <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{inviteError}</p> : null}

                <div className="form-actions">
                  <button className="btn btn-primary" type="submit" disabled={inviting}>
                    {inviting ? "Envoi..." : "Créer le compte"}
                  </button>
                  <button className="btn btn-outline" type="button" onClick={closeInvite}>Annuler</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      <div className="panel">
        <div className="filter-bar">
          <div className="filter-tabs">
            {TABS.map((t) => (
              <span
                key={t.key}
                className={`filter-tab${tab === t.key ? " active" : ""}`}
                onClick={() => setTab(t.key)}
                style={{ cursor: "pointer" }}
              >
                {t.label} <span style={{ color: "var(--muted)", fontWeight: 500 }}>{t.key === "all" ? users.length : users.filter((u) => u.role === t.key).length}</span>
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="panel-body"><p className="cell-muted">Chargement...</p></div>
        ) : error ? (
          <div className="panel-body"><p style={{ color: "var(--danger)" }}>{error}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Accès marques</th>
                  <th>Créé le</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="cell-flex">
                        <div className="avatar" style={{ background: avatarColor(user.email) }}>{initialsOf(user.nom)}</div>
                        <div><div className="cell-primary">{user.nom}</div><div className="cell-muted" style={{ fontSize: 12 }}>{user.email}</div></div>
                      </div>
                    </td>
                    <td>
                      <select className="select-sm" value={user.role} onChange={(e) => updateRole(user.id, e.target.value as UserRole)}>
                        {ROLE_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="cell-muted">{user.accesMarques.length ? user.accesMarques.join(", ") : "Aucune"}</td>
                    <td className="cell-muted">{formatDate(user.createdAt)}</td>
                    <td><span className={`badge ${statusBadgeClass(user.statut)}`}>{USER_STATUS_LABELS[user.statut]}</span></td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucun utilisateur</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <div className="panel-head"><div><h3>Rôles &amp; permissions</h3><div className="sub">Ce que chaque rôle peut faire dans l&apos;espace admin</div></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Permission</th><th style={{ textAlign: "center" }}>Administrateur</th><th style={{ textAlign: "center" }}>Gestionnaire</th><th style={{ textAlign: "center" }}>Support</th></tr></thead>
            <tbody>
              {PERMISSIONS.map((perm) => (
                <tr key={perm.label}>
                  <td>{perm.label}</td>
                  <td style={{ textAlign: "center" }}>{perm.admin ? "✓" : "—"}</td>
                  <td style={{ textAlign: "center" }}>{perm.gestionnaire ? "✓" : "—"}</td>
                  <td style={{ textAlign: "center" }}>{perm.support ? "✓" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
