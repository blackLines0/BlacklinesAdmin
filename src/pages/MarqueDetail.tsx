import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";

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
  const [brand, setBrand] = useState<BrandDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [newCategory, setNewCategory] = useState("");
  const [newSizeLabel, setNewSizeLabel] = useState("");
  const [newSizeDescription, setNewSizeDescription] = useState("");

  function load() {
    if (!id) return;
    setLoading(true);
    apiFetch<BrandListItem[]>("/brands")
      .then((brands) => {
        const match = brands.find((b) => b.id === id);
        if (!match) {
          setNotFound(true);
          return null;
        }
        return apiFetch<BrandDetail>(`/brands/${match.slug}`);
      })
      .then((detail) => {
        if (detail) setBrand(detail);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await apiFetch(`/admin/brands/${id}/categories`, { method: "POST", body: JSON.stringify({ nom: newCategory }) });
      setNewCategory("");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de l'ajout");
    }
  }

  async function removeCategory(categoryId: string) {
    if (!confirm("Supprimer cette catégorie ?")) return;

    try {
      await apiFetch(`/admin/categories/${categoryId}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de la suppression");
    }
  }

  async function addSizeOption(e: React.FormEvent) {
    e.preventDefault();
    if (!newSizeLabel.trim()) return;

    try {
      await apiFetch(`/admin/brands/${id}/size-options`, {
        method: "POST",
        body: JSON.stringify({
          label: newSizeLabel,
          description: newSizeDescription || undefined,
          ordre: brand?.sizeOptions.length ?? 0,
        }),
      });
      setNewSizeLabel("");
      setNewSizeDescription("");
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de l'ajout");
    }
  }

  async function removeSizeOption(sizeId: string) {
    if (!confirm("Supprimer cette taille ?")) return;

    try {
      await apiFetch(`/admin/size-options/${sizeId}`, { method: "DELETE" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de la suppression");
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Marque" crumb="">
        <p className="cell-muted">Chargement...</p>
      </AdminLayout>
    );
  }

  if (notFound || !brand) {
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
                    <button className="icon-action" aria-label="Supprimer" onClick={() => removeCategory(c.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={addCategory} style={{ display: "flex", gap: 10 }}>
              <input type="text" placeholder="Nouvelle catégorie (ex. Chemises)" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ flex: 1 }} />
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
                    <button className="icon-action" aria-label="Supprimer" onClick={() => removeSizeOption(s.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={addSizeOption} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input type="text" placeholder="Label (ex. X1, M, 50ml...)" value={newSizeLabel} onChange={(e) => setNewSizeLabel(e.target.value)} />
              <input type="text" placeholder="Guide (ex. 2m² — 1m de largeur x 3m de longueur)" value={newSizeDescription} onChange={(e) => setNewSizeDescription(e.target.value)} />
              <button className="btn btn-outline" type="submit">Ajouter la taille</button>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
