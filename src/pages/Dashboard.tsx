import { useEffect, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
import { brandTagClass, formatPrice, ORDER_STATUS_LABELS, statusBadgeClass, type OrderStatus } from "../lib/format";

interface DashboardData {
  chiffreAffaires: number;
  commandesCount: number;
  panierMoyen: number;
  parCanal: { enLigne: number; boutique: number };
  ventesParMarque: { slug: string; nom: string; pct: number }[];
  topProducts: { nom: string; ventes: number; montant: number; image: string | null }[];
  salesLast7Days: { label: string; total: number }[];
  recentOrders: { id: string; client: string; montant: number; statut: OrderStatus; canal: "en_ligne" | "boutique"; brand: string | null; brandNom: string | null }[];
}

const BRAND_COLORS: Record<string, string> = {
  "capsule-textile": "#44199E",
  spicysoul: "#053085",
  "rihan-wa-harir": "#083D21",
};

function donutSegments(parts: { pct: number; slug: string }[]) {
  let offset = 0;
  return parts.map((p) => {
    const seg = { ...p, offset: -offset };
    offset += p.pct;
    return seg;
  });
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<DashboardData>("/admin/dashboard")
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AdminLayout title="Tableau de bord" crumb="Aperçu des ventes — toutes marques">
        <p className="cell-muted">Chargement...</p>
      </AdminLayout>
    );
  }

  if (error || !data) {
    return (
      <AdminLayout title="Tableau de bord" crumb="Aperçu des ventes — toutes marques">
        <p style={{ color: "var(--danger)" }}>{error}</p>
      </AdminLayout>
    );
  }

  const maxDay = Math.max(1, ...data.salesLast7Days.map((d) => d.total));
  const segments = donutSegments(data.ventesParMarque);

  return (
    <AdminLayout title="Tableau de bord" crumb="Aperçu des ventes — toutes marques">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Chiffre d&apos;affaires</span>
            <div className="kpi-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>
          </div>
          <div className="kpi-value">{formatPrice(data.chiffreAffaires)}</div>
          <div className="kpi-split">
            <span>En ligne <strong>{formatPrice(data.parCanal.enLigne)}</strong></span>
            <span>Boutique <strong>{formatPrice(data.parCanal.boutique)}</strong></span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Commandes</span>
            <div className="kpi-icon cyan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6" /><circle cx="9" cy="21" r="1.4" /><circle cx="18" cy="21" r="1.4" /></svg></div>
          </div>
          <div className="kpi-value">{data.commandesCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Panier moyen</span>
            <div className="kpi-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg></div>
          </div>
          <div className="kpi-value">{formatPrice(data.panierMoyen)}</div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Ventes — 7 derniers jours</h3>
              <div className="sub">Toutes marques confondues</div>
            </div>
          </div>
          <div className="panel-body">
            <div className="bar-chart">
              {data.salesLast7Days.map((day, i) => (
                <div className="bar-col" key={i}>
                  <div className={`bar${day.total === maxDay && maxDay > 0 ? " hi" : ""}`} style={{ height: `${Math.max(4, (day.total / maxDay) * 100)}%` }} />
                  <span className="bar-label">{day.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h3>Ventes par marque</h3><div className="sub">Commandes confirmées</div></div>
          </div>
          <div className="panel-body">
            {data.ventesParMarque.length === 0 ? (
              <p className="cell-muted" style={{ textAlign: "center" }}>Pas encore de ventes</p>
            ) : (
              <>
                <svg viewBox="0 0 42 42" style={{ width: 150, height: 150, display: "block", margin: "0 auto", transform: "rotate(-90deg)" }}>
                  <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EEF2F7" strokeWidth="6" />
                  {segments.map((s) => (
                    <circle
                      key={s.slug}
                      cx="21" cy="21" r="15.9" fill="none"
                      stroke={BRAND_COLORS[s.slug] ?? "#94A3B8"}
                      strokeWidth="6"
                      strokeDasharray={`${s.pct} ${100 - s.pct}`}
                      strokeDashoffset={s.offset}
                    />
                  ))}
                </svg>
                <div className="legend">
                  {data.ventesParMarque.map((b) => (
                    <div className="legend-row" key={b.slug}>
                      <span className="legend-dot" style={{ background: BRAND_COLORS[b.slug] ?? "#94A3B8" }} />
                      <span className="name">{b.nom}</span>
                      <span className="pct">{b.pct}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="two-col" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        <div className="panel">
          <div className="panel-head">
            <div><h3>Commandes récentes</h3><div className="sub">{data.recentOrders.length} dernières commandes</div></div>
            <a className="link-more" href="/commandes">Voir tout →</a>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Commande</th><th>Client</th><th>Marque</th><th>Canal</th><th>Montant</th><th>Statut</th></tr></thead>
              <tbody>
                {data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="cell-primary">#{order.id.slice(-6).toUpperCase()}</td>
                    <td>{order.client}</td>
                    <td>{order.brand ? <span className={`brand-tag ${brandTagClass(order.brand)}`}>{order.brandNom}</span> : "—"}</td>
                    <td><span className={`badge ${order.canal === "boutique" ? "info" : "neutral"}`}>{order.canal === "boutique" ? "Boutique" : "En ligne"}</span></td>
                    <td>{formatPrice(order.montant)}</td>
                    <td><span className={`badge ${statusBadgeClass(order.statut)}`}>{ORDER_STATUS_LABELS[order.statut]}</span></td>
                  </tr>
                ))}
                {data.recentOrders.length === 0 ? (
                  <tr><td colSpan={6} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucune commande</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h3>Meilleures ventes</h3></div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {data.topProducts.length === 0 ? (
              <p className="cell-muted">Pas encore de ventes</p>
            ) : (
              data.topProducts.map((product) => (
                <div className="cell-flex" key={product.nom}>
                  <div className="thumb-sm" style={{ background: "#EEF2F7", backgroundImage: product.image ? `url(${product.image})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div style={{ flex: 1 }}>
                    <div className="cell-primary" style={{ fontSize: 13 }}>{product.nom}</div>
                    <div className="cell-muted" style={{ fontSize: 12 }}>{product.ventes} ventes</div>
                  </div>
                  <div className="cell-primary" style={{ fontSize: 13 }}>{formatPrice(product.montant)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
