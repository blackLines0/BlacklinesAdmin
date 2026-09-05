import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { Select, type SelectOption } from "../components/Select";
import { apiFetch } from "../lib/api";
import {
  brandTagClass,
  formatPrice,
  PRODUCT_STATUS_LABELS,
  statusBadgeClass,
  type ProductStatus,
} from "../lib/format";

const STATUS_SELECT_OPTIONS: SelectOption[] = [
  { value: "all", label: "Statut : Tous" },
  ...Object.entries(PRODUCT_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
    tone: statusBadgeClass(value) as SelectOption["tone"],
  })),
];

interface Brand {
  id: string;
  slug: string;
  nom: string;
}

interface Product {
  id: string;
  nom: string;
  prix: number;
  prixPromo: number | null;
  stock: number;
  statut: ProductStatus;
  images: string[];
  brand: Brand;
}

export default function Produits() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");

  useEffect(() => {
    Promise.all([
      apiFetch<Product[]>("/admin/products"),
      apiFetch<Brand[]>("/brands"),
    ])
      .then(([productsData, brandsData]) => {
        setProducts(productsData);
        setBrands(brandsData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const tabs = useMemo(
    () => [
      { key: "all", label: "Tous", count: products.length },
      ...brands.map((b) => ({
        key: b.slug,
        label: b.nom,
        count: products.filter((p) => p.brand.slug === b.slug).length,
      })),
    ],
    [products, brands],
  );

  const filtered = products.filter((p) => {
    if (tab !== "all" && p.brand.slug !== tab) return false;
    if (statusFilter !== "all" && p.statut !== statusFilter) return false;
    return true;
  });

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;

    try {
      await apiFetch(`/admin/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de la suppression");
    }
  }

  return (
    <AdminLayout title="Produits" crumb={`${products.length} produits — ${brands.length} marques`} searchPlaceholder="Rechercher un produit...">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <Link className="btn btn-primary" to="/produits/nouveau">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Ajouter un produit
        </Link>
      </div>

      <div className="panel">
        <div className="filter-bar">
          <div className="filter-tabs">
            {tabs.map((t) => (
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
          <div className="spacer" />
          <Select
            size="sm"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as ProductStatus | "all")}
            options={STATUS_SELECT_OPTIONS}
          />
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
                  <th>Produit</th>
                  <th>Marque</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="cell-flex">
                        <div className="thumb-sm" style={{ background: "#EEF2F7", backgroundImage: product.images[0] ? `url(${product.images[0]})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }} />
                        <div className="cell-primary">{product.nom}</div>
                      </div>
                    </td>
                    <td><span className={`brand-tag ${brandTagClass(product.brand.slug)}`}>{product.brand.nom}</span></td>
                    <td className="cell-primary">
                      {product.prixPromo ? (
                        <>
                          <span style={{ textDecoration: "line-through", color: "var(--muted)", fontWeight: 500, marginRight: 6 }}>{formatPrice(product.prix)}</span>
                          <span style={{ color: "var(--danger)" }}>{formatPrice(product.prixPromo)}</span>
                        </>
                      ) : (
                        formatPrice(product.prix)
                      )}
                    </td>
                    <td>{product.stock}</td>
                    <td><span className={`badge ${statusBadgeClass(product.statut)}`}>{PRODUCT_STATUS_LABELS[product.statut]}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <Link className="icon-action" aria-label="Modifier" to={`/produits/${product.id}/modifier`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                        </Link>
                        <button className="icon-action" aria-label="Supprimer" onClick={() => handleDelete(product.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucun produit</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
