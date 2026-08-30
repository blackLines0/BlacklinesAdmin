import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { adminProducts, brandLabels, statusBadgeClass, type BrandTag } from "../lib/mockData";

const TABS: { key: BrandTag | "all"; label: string; count: number }[] = [
  { key: "all", label: "Tous", count: 48 },
  { key: "capsule", label: "Capsule Textile", count: 18 },
  { key: "spicy", label: "Spicysoul", count: 17 },
  { key: "rihan", label: "Rihan Wa Harir", count: 13 },
];

export default function Produits() {
  const [tab, setTab] = useState<BrandTag | "all">("all");
  const products = tab === "all" ? adminProducts : adminProducts.filter((p) => p.brand === tab);

  return (
    <AdminLayout title="Produits" crumb="48 produits — 3 marques" searchPlaceholder="Rechercher un produit...">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
        <Link className="btn btn-primary" to="/produits/nouveau">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Ajouter un produit
        </Link>
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
          <div className="spacer" />
          <select className="select-sm">
            <option>Statut : Tous</option>
            <option>En stock</option>
            <option>Stock faible</option>
            <option>Épuisé</option>
          </select>
          <select className="select-sm">
            <option>Trier : Récents</option>
            <option>Prix croissant</option>
            <option>Prix décroissant</option>
            <option>Meilleures ventes</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Produit</th>
                <th>Marque</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Ventes</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.sku}>
                  <td><input type="checkbox" /></td>
                  <td>
                    <div className="cell-flex">
                      <div className="thumb-sm" style={{ background: product.swatch }} />
                      <div><div className="cell-primary">{product.nom}</div><div className="cell-muted" style={{ fontSize: 12 }}>SKU {product.sku}</div></div>
                    </div>
                  </td>
                  <td><span className={`brand-tag ${product.brand}`}>{brandLabels[product.brand]}</span></td>
                  <td className="cell-primary">{product.prix}</td>
                  <td>{product.stock}</td>
                  <td>{product.ventes}</td>
                  <td><span className={`badge ${statusBadgeClass(product.statut)}`}>{product.statut}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <Link className="icon-action" aria-label="Modifier" to={`/produits/${product.sku}/modifier`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </Link>
                      <button className="icon-action" aria-label="Supprimer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="info">Affichage de 1 à {products.length} sur 48 produits</span>
          <div className="page-btns">
            <button className="page-btn">‹</button>
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">3</button>
            <button className="page-btn">›</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
