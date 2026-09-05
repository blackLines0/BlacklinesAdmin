import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

interface Category {
  id: string;
  nom: string;
  slug: string;
}

interface SizeOption {
  id: string;
  label: string;
  description: string | null;
  ordre: number;
}

interface BrandDetail {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  categories: Category[];
  sizeOptions: SizeOption[];
}

interface BrandListItem {
  id: string;
  slug: string;
}

export default function MarqueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: brandsList } = useQuery({
    queryKey: queryKeys.brands,
    queryFn: () => apiFetch<BrandListItem[]>("/brands"),
  });
  const slug = brandsList?.find((b) => b.id === id)?.slug;
  const notFoundInList = Boolean(brandsList && id && !slug);

  const { data: brand, isLoading: loading, isError } = useQuery({
    queryKey: queryKeys.brandDetail(slug ?? ""),
    queryFn: () => apiFetch<BrandDetail>(`/brands/${slug}`),
    enabled: Boolean(slug),
  });

  const [editNom, setEditNom] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [newSizeDescription, setNewSizeDescription] = useState("");

  useEffect(() => {
    if (brand) {
      setEditNom(brand.nom);
      setEditDescription(brand.description ?? "");
    }
  }, [brand]);

  function invalidateBrand() {
    if (slug) queryClient.invalidateQueries({ queryKey: queryKeys.brandDetail(slug) });
  }

  const saveInfo = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/brands/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ nom: editNom, description: editDescription || null }),
      }),
    onSuccess: () => {
      invalidateBrand();
      queryClient.invalidateQueries({ queryKey: queryKeys.brands });
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la mise à jour"),
  });

  const deleteBrand = useMutation({
    mutationFn: () => apiFetch(`/admin/brands/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.brands });
      navigate("/marques");
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la suppression"),
  });

  const addCategory = useMutation({
    mutationFn: () => apiFetch(`/admin/brands/${id}/categories`, { method: "POST", body: JSON.stringify({ nom: newCategory }) }),
    onSuccess: () => {
      setNewCategory("");
      invalidateBrand();
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de l'ajout"),
  });

  const removeCategory = useMutation({
    mutationFn: (categoryId: string) => apiFetch(`/admin/categories/${categoryId}`, { method: "DELETE" }),
    onSuccess: invalidateBrand,
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la suppression"),
  });

  const addSizeOption = useMutation({
    mutationFn: () =>
      apiFetch(`/admin/brands/${id}/size-options`, {
        method: "POST",
        body: JSON.stringify({
          label: newSizeLabel,
          description: newSizeDescription || undefined,
          ordre: brand?.sizeOptions.length ?? 0,
        }),
      }),
    onSuccess: () => {
      setNewSizeLabel("");
      setNewSizeDescription("");
      invalidateBrand();
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de l'ajout"),
  });

  const removeSizeOption = useMutation({
    mutationFn: (sizeId: string) => apiFetch(`/admin/size-options/${sizeId}`, { method: "DELETE" }),
    onSuccess: invalidateBrand,
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la suppression"),
  });

  function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    saveInfo.mutate();
  }

  function handleDeleteBrand() {
    if (!confirm(`Supprimer définitivement la marque "${brand?.nom}" ? Cette action est impossible si des produits, catégories ou tailles y sont encore rattachés.`)) return;
    deleteBrand.mutate();
  }

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    addCategory.mutate();
  }

  function handleRemoveCategory(categoryId: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;
    removeCategory.mutate(categoryId);
  }

  function handleAddSizeOption(e: React.FormEvent) {
    e.preventDefault();
    if (!newSizeLabel.trim()) return;
    addSizeOption.mutate();
  }

  function handleRemoveSizeOption(sizeId: string) {
    if (!confirm("Supprimer cette taille ?")) return;
    removeSizeOption.mutate(sizeId);
  }

  if (loading && !notFoundInList) {
    return (
      <AdminLayout title="Marque" crumb="">
        <p className="cell-muted">Chargement...</p>
      </AdminLayout>
    );
  }

  if (notFoundInList || isError || !brand) {
    return (
      <AdminLayout title="Marque introuvable" crumb="">
        <p className="cell-muted">Aucune marque ne correspond à cet identifiant.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={brand.nom} crumb="Catégories et tailles de la marque">
      <a className="back-link" href="/marques">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        Retour aux marques
      </a>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div><h3>Informations</h3><div className="sub">Nom et description affichés sur le site</div></div>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSaveInfo}>
            <div className="form-grid">
              <div className="field full">
                <label>Nom</label>
                <input type="text" value={editNom} onChange={(e) => setEditNom(e.target.value)} required />
              </div>
              <div className="field full">
                <label>Description</label>
                <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={saveInfo.isPending}>
                {saveInfo.isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
              <button className="btn btn-outline" type="button" onClick={handleDeleteBrand} disabled={deleteBrand.isPending} style={{ color: "var(--danger)" }}>
                {deleteBrand.isPending ? "Suppression..." : "Supprimer la marque"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-head">
            <div><h3>Catégories</h3><div className="sub">Servent à filtrer le catalogue par type de produit</div></div>
          </div>
          <div className="panel-body">
            {brand.categories.length === 0 ? (
              <p className="cell-muted" style={{ marginBottom: 16 }}>Aucune catégorie pour l&apos;instant.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {brand.categories.map((c) => (
                  <div key={c.id} className="detail-row">
                    <span className="value">{c.nom}</span>
                    <button className="icon-action" aria-label="Supprimer" onClick={() => handleRemoveCategory(c.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleAddCategory} style={{ display: "flex", gap: 10 }}>
              <input className="text-input" type="text" placeholder="Nouvelle catégorie (ex. Chemises)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ flex: 1 }} />
              <button className="btn btn-outline" type="submit">Ajouter</button>
            </form>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h3>Tailles</h3><div className="sub">Avec un guide pour chaque taille (facultatif)</div></div>
          </div>
          <div className="panel-body">
            {brand.sizeOptions.length === 0 ? (
              <p className="cell-muted" style={{ marginBottom: 16 }}>Aucune taille — les produits de cette marque n&apos;auront pas de sélecteur de taille.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {brand.sizeOptions.map((s) => (
                  <div key={s.id} className="detail-row">
                    <span className="value">{s.label}{s.description ? <span className="cell-muted" style={{ fontWeight: 400, marginLeft: 8 }}>{s.description}</span> : null}</span>
                    <button className="icon-action" aria-label="Supprimer" onClick={() => handleRemoveSizeOption(s.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleAddSizeOption} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input className="text-input" type="text" placeholder="Label (ex. X1, M, 50ml...)" value={newSizeLabel} onChange={(e) => setNewSizeLabel(e.target.value)} />
              <input className="text-input" type="text" placeholder="Guide (ex. 2m² — 1m de largeur x 3m de longueur)" value={newSizeDescription} onChange={(e) => setNewSizeDescription(e.target.value)} />
              <button className="btn btn-outline" type="submit">Ajouter la taille</button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
