import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
import { exportToCsv } from "../lib/csvExport";
import { queryKeys } from "../lib/queryKeys";
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
  const { data: customers = [], isLoading: loading, error } = useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => apiFetch<Customer[]>("/admin/customers"),
  });
  const [search, setSearch] = useState("");

  const filtered = customers.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      c.nom.toLowerCase().includes(term) ||
      (c.email ?? "").toLowerCase().includes(term) ||
      (c.telephone ?? "").toLowerCase().includes(term)
    );
  });

  function handleExport() {
    exportToCsv("clients", filtered, [
      { label: "Nom", value: (c) => c.nom },
      { label: "Email", value: (c) => c.email ?? "" },
      { label: "Téléphone", value: (c) => c.telephone ?? "" },
      { label: "Adresse", value: (c) => c.adresse ?? "" },
      { label: "Client depuis", value: (c) => formatDate(c.createdAt) },
      { label: "Commandes", value: (c) => c.commandesCount },
    ]);
  }

  return (
    <AdminLayout
      title="Clients"
      crumb={`${customers.length} clients`}
      searchPlaceholder="Rechercher un client..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button className="btn btn-outline btn-sm" type="button" onClick={handleExport}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Exporter tout
        </button>
      </div>
      <div className="panel">
        {loading ? (
          <div className="panel-body"><p className="cell-muted">Chargement...</p></div>
        ) : error ? (
          <div className="panel-body"><p style={{ color: "var(--danger)" }}>{error instanceof Error ? error.message : "Erreur de chargement"}</p></div>
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
                {filtered.map((c) => (
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
                {filtered.length === 0 ? (
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
