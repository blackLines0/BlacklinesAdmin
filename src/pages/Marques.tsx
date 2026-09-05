import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

interface Brand {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
}

export default function Marques() {
  const queryClient = useQueryClient();
  const { data: brands = [], isLoading: loading, error } = useQuery({
    queryKey: queryKeys.brands,
    queryFn: () => apiFetch<Brand[]>("/brands"),
  });
  const [showCreate, setShowCreate] = useState(false);
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");

  const createBrand = useMutation({
    mutationFn: () => apiFetch("/admin/brands", { method: "POST", body: JSON.stringify({ nom, description: description || undefined }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands });
      setNom("");
      setDescription("");
      setShowCreate(false);
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la création"),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createBrand.mutate();
  }

  return (
    <AdminLayout title="Marques" crumb={`${brands.length} marques`}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={() => setShowCreate((v) => !v)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Nouvelle marque
        </button>
      </div>

      {showCreate ? (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-body">
            <form onSubmit={handleCreate}>
              <div className="form-grid">
                <div className="field full">
                  <label>Nom</label>
                  <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required />
                </div>
                <div className="field full">
                  <label>Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={createBrand.isPending}>
                  {createBrand.isPending ? "Création..." : "Créer la marque"}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => setShowCreate(false)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="panel">
        {loading ? (
          <div className="panel-body"><p className="cell-muted">Chargement...</p></div>
        ) : error ? (
          <div className="panel-body"><p style={{ color: "var(--danger)" }}>{error instanceof Error ? error.message : "Erreur de chargement"}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Marque</th><th>Description</th><th></th></tr></thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id}>
                    <td className="cell-primary">{b.nom}</td>
                    <td className="cell-muted">{b.description ?? "—"}</td>
                    <td>
                      <Link className="icon-action" aria-label="Gérer" to={`/marques/${b.id}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
