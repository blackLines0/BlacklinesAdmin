import { useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { adminUsers, statusBadgeClass, type AdminUser } from "../lib/mockData";

const ROLE_OPTIONS: AdminUser["role"][] = ["Administratrice", "Gestionnaire", "Support"];

const TABS = [
  { key: "all", label: "Tous", count: 6 },
  { key: "Administratrice", label: "Administrateurs", count: 2 },
  { key: "Gestionnaire", label: "Gestionnaires", count: 3 },
  { key: "Support", label: "Support", count: 1 },
] as const;

const PERMISSIONS = [
  { label: "Gérer le catalogue (ajout / édition / suppression)", admin: true, gestionnaire: true, support: false },
  { label: "Gérer les commandes et leur statut", admin: true, gestionnaire: true, support: true },
  { label: "Voir le tableau de bord des ventes", admin: true, gestionnaire: true, support: false },
  { label: "Gérer les utilisateurs & rôles", admin: true, gestionnaire: false, support: false },
];

export default function Utilisateurs() {
  const [users, setUsers] = useState(adminUsers);
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("all");

  function updateRole(email: string, role: AdminUser["role"]) {
    setUsers((prev) => prev.map((u) => (u.email === email ? { ...u, role } : u)));
  }

  const filtered = tab === "all" ? users : users.filter((u) => u.role === tab);

  return (
    <AdminLayout title="Utilisateurs" crumb="6 comptes avec accès à l'espace admin">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Inviter un utilisateur
        </button>
      </div>

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
                {t.label} <span style={{ color: "var(--muted)", fontWeight: 500 }}>{t.count}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Rôle</th>
                <th>Accès marques</th>
                <th>Dernière connexion</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.email}>
                  <td>
                    <div className="cell-flex">
                      <div className="avatar" style={{ background: user.couleur }}>{user.initiales}</div>
                      <div><div className="cell-primary">{user.nom}</div><div className="cell-muted" style={{ fontSize: 12 }}>{user.email}</div></div>
                    </div>
                  </td>
                  <td>
                    <select
                      className="select-sm"
                      value={user.role}
                      onChange={(e) => updateRole(user.email, e.target.value as AdminUser["role"])}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="cell-muted">{user.acces}</td>
                  <td className="cell-muted">{user.derniereConnexion}</td>
                  <td><span className={`badge ${statusBadgeClass(user.statut)}`}>{user.statut}</span></td>
                  <td>
                    <button className="icon-action" aria-label="Options">
                      <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
              <tr>
                <td>Accès à toutes les marques</td>
                <td style={{ textAlign: "center" }}>✓</td>
                <td style={{ textAlign: "center" }}>Selon attribution</td>
                <td style={{ textAlign: "center" }}>Selon attribution</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
