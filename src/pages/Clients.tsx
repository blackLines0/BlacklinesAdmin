import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
import { avatarColor, formatDate, initialsOf } from "../lib/format";

interface Customer {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  createdAt: string;
  commandesCount: number;
}

export default function Clients() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Customer[]>("/admin/customers")
      .then(setCustomers)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout title="Clients" crumb={`${customers.length} clients`} searchPlaceholder="Rechercher un client...">
      <div className="panel">
        {loading ? (
          <div className="panel-body"><p className="cell-muted">Chargement...</p></div>
        ) : error ? (
          <div className="panel-body"><p style={{ color: "var(--danger)" }}>{error}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Téléphone</th>
                  <th>Adresse</th>
                  <th>Client depuis</th>
                  <th>Commandes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="cell-flex">
                        <div className="avatar" style={{ background: avatarColor(c.email ?? c.telephone ?? c.id) }}>{initialsOf(c.nom)}</div>
                        <div><div className="cell-primary">{c.nom}</div><div className="cell-muted" style={{ fontSize: 12 }}>{c.email ?? "—"}</div></div>
                      </div>
                    </td>
                    <td className="cell-muted">{c.telephone ?? "—"}</td>
                    <td className="cell-muted">{c.adresse ?? "—"}</td>
                    <td className="cell-muted">{formatDate(c.createdAt)}</td>
                    <td className="cell-primary">{c.commandesCount}</td>
                    <td>
                      <Link className="icon-action" aria-label="Voir" to={`/clients/${c.id}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))}
                {customers.length === 0 ? (
                  <tr><td colSpan={6} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucun client</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
