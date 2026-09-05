import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { formatDate } from "../lib/format";

type ReviewStatus = "en_attente" | "approuve" | "rejete";

interface Review {
  id: string;
  note: number;
  commentaire: string | null;
  statut: ReviewStatus;
  createdAt: string;
  customer: { id: string; nom: string };
  product: { id: string; nom: string; slug: string };
}

const STATUS_LABELS: Record<ReviewStatus, string> = {
  en_attente: "En attente",
  approuve: "Approuvé",
  rejete: "Rejeté",
};

const STATUS_BADGE_CLASS: Record<ReviewStatus, string> = {
  en_attente: "warning",
  approuve: "success",
  rejete: "danger",
};

const TABS: { key: ReviewStatus | "all"; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "en_attente", label: "En attente" },
  { key: "approuve", label: "Approuvés" },
  { key: "rejete", label: "Rejetés" },
];

function Stars({ note }: { note: number }) {
  return (
    <span style={{ color: "#F5A623", letterSpacing: 1 }}>
      {"★".repeat(note)}
      <span style={{ color: "var(--muted)" }}>{"★".repeat(5 - note)}</span>
    </span>
  );
}

export default function Avis() {
  const queryClient = useQueryClient();
  const { data: reviews = [], isLoading: loading, error } = useQuery({
    queryKey: queryKeys.reviews,
    queryFn: () => apiFetch<Review[]>("/admin/reviews"),
  });
  const [tab, setTab] = useState<ReviewStatus | "all">("en_attente");

  const filtered = useMemo(
    () => (tab === "all" ? reviews : reviews.filter((r) => r.statut === tab)),
    [reviews, tab],
  );

  const setStatut = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: ReviewStatus }) =>
      apiFetch(`/admin/reviews/${id}`, { method: "PATCH", body: JSON.stringify({ statut }) }),
    onMutate: async ({ id, statut }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.reviews });
      const previous = queryClient.getQueryData<Review[]>(queryKeys.reviews);
      queryClient.setQueryData<Review[]>(queryKeys.reviews, (prev) =>
        prev?.map((r) => (r.id === id ? { ...r, statut } : r)),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.reviews, context.previous);
      alert(err instanceof Error ? err.message : "Échec de la mise à jour");
    },
  });

  const removeReview = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/reviews/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Review[]>(queryKeys.reviews, (prev) => prev?.filter((r) => r.id !== id));
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la suppression"),
  });

  function remove(id: string) {
    if (!confirm("Supprimer définitivement cet avis ?")) return;
    removeReview.mutate(id);
  }

  return (
    <AdminLayout title="Avis" crumb={`${reviews.length} avis reçus sur les produits`}>
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
                {t.label}{" "}
                <span style={{ color: "var(--muted)", fontWeight: 500 }}>
                  {t.key === "all" ? reviews.length : reviews.filter((r) => r.statut === t.key).length}
                </span>
              </span>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="panel-body"><p className="cell-muted">Chargement...</p></div>
        ) : error ? (
          <div className="panel-body"><p style={{ color: "var(--danger)" }}>{error instanceof Error ? error.message : "Erreur de chargement"}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Client</th>
                  <th>Note</th>
                  <th>Commentaire</th>
                  <th>Date</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="cell-primary">{r.product.nom}</td>
                    <td>{r.customer.nom}</td>
                    <td><Stars note={r.note} /></td>
                    <td className="cell-muted" style={{ maxWidth: 320 }}>{r.commentaire ?? "—"}</td>
                    <td className="cell-muted">{formatDate(r.createdAt)}</td>
                    <td><span className={`badge ${STATUS_BADGE_CLASS[r.statut]}`}>{STATUS_LABELS[r.statut]}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        {r.statut !== "approuve" ? (
                          <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12.5 }} onClick={() => setStatut.mutate({ id: r.id, statut: "approuve" })}>
                            Approuver
                          </button>
                        ) : null}
                        {r.statut !== "rejete" ? (
                          <button className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12.5 }} onClick={() => setStatut.mutate({ id: r.id, statut: "rejete" })}>
                            Rejeter
                          </button>
                        ) : null}
                        <button className="icon-action" aria-label="Supprimer" onClick={() => remove(r.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucun avis</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
