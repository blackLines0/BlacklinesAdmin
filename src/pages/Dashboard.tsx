import { AdminLayout } from "../components/AdminLayout";
import { brandLabels, recentOrders, statusBadgeClass, topProducts } from "../lib/mockData";

const WEEK_BARS = [
  { label: "Lun", height: 52 },
  { label: "Mar", height: 68 },
  { label: "Mer", height: 44 },
  { label: "Jeu", height: 80 },
  { label: "Ven", height: 100, hi: true },
  { label: "Sam", height: 74 },
  { label: "Dim", height: 38 },
];

const BRAND_SHARE = [
  { name: "Capsule Textile", pct: 46, color: "#44199E" },
  { name: "Spicysoul", pct: 34, color: "#053085" },
  { name: "Rihan Wa Harir", pct: 20, color: "#083D21" },
];

export default function Dashboard() {
  return (
    <AdminLayout title="Tableau de bord" crumb="Aperçu des ventes — toutes marques">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Chiffre d&apos;affaires</span>
            <div className="kpi-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg></div>
          </div>
          <div className="kpi-value">1 284 000 FCFA</div>
          <div className="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15" /></svg>+12,4% <span className="period">vs mois dernier</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Commandes</span>
            <div className="kpi-icon cyan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6" /><circle cx="9" cy="21" r="1.4" /><circle cx="18" cy="21" r="1.4" /></svg></div>
          </div>
          <div className="kpi-value">312</div>
          <div className="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15" /></svg>+8,1% <span className="period">vs mois dernier</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Panier moyen</span>
            <div className="kpi-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg></div>
          </div>
          <div className="kpi-value">21 150 FCFA</div>
          <div className="kpi-delta down"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: "rotate(180deg)" }}><polyline points="18 15 12 9 6 15" /></svg>−2,3% <span className="period">vs mois dernier</span></div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Taux de conversion</span>
            <div className="kpi-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div>
          </div>
          <div className="kpi-value">3,8%</div>
          <div className="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="18 15 12 9 6 15" /></svg>+0,4pt <span className="period">vs mois dernier</span></div>
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Ventes — 7 derniers jours</h3>
              <div className="sub">Toutes marques confondues</div>
            </div>
            <div className="chart-tabs">
              <span className="chart-tab active">7j</span>
              <span className="chart-tab">30j</span>
              <span className="chart-tab">12 mois</span>
            </div>
          </div>
          <div className="panel-body">
            <div className="bar-chart">
              {WEEK_BARS.map((bar) => (
                <div className="bar-col" key={bar.label}>
                  <div className={`bar${bar.hi ? " hi" : ""}`} style={{ height: `${bar.height}%` }} />
                  <span className="bar-label">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h3>Ventes par marque</h3><div className="sub">Ce mois-ci</div></div>
          </div>
          <div className="panel-body">
            <svg viewBox="0 0 42 42" style={{ width: 150, height: 150, display: "block", margin: "0 auto", transform: "rotate(-90deg)" }}>
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EEF2F7" strokeWidth="6" />
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="#44199E" strokeWidth="6" strokeDasharray="46 54" strokeDashoffset="0" />
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="#053085" strokeWidth="6" strokeDasharray="34 66" strokeDashoffset="-46" />
              <circle cx="21" cy="21" r="15.9" fill="none" stroke="#083D21" strokeWidth="6" strokeDasharray="20 80" strokeDashoffset="-80" />
            </svg>
            <div className="legend">
              {BRAND_SHARE.map((b) => (
                <div className="legend-row" key={b.name}>
                  <span className="legend-dot" style={{ background: b.color }} />
                  <span className="name">{b.name}</span>
                  <span className="pct">{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="two-col" style={{ gridTemplateColumns: "1.6fr 1fr" }}>
        <div className="panel">
          <div className="panel-head">
            <div><h3>Commandes récentes</h3><div className="sub">6 dernières commandes</div></div>
            <a className="link-more" href="/commandes">Voir tout →</a>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Commande</th><th>Client</th><th>Marque</th><th>Montant</th><th>Statut</th></tr></thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="cell-primary">{order.id}</td>
                    <td>{order.client}</td>
                    <td><span className={`brand-tag ${order.brand}`}>{brandLabels[order.brand]}</span></td>
                    <td>{order.montant}</td>
                    <td><span className={`badge ${statusBadgeClass(order.statut)}`}>{order.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h3>Meilleures ventes</h3><div className="sub">Ce mois-ci</div></div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {topProducts.map((product) => (
              <div className="cell-flex" key={product.nom}>
                <div className="thumb-sm" style={{ background: product.swatch }} />
                <div style={{ flex: 1 }}>
                  <div className="cell-primary" style={{ fontSize: 13 }}>{product.nom}</div>
                  <div className="cell-muted" style={{ fontSize: 12 }}>{product.ventes} ventes</div>
                </div>
                <div className="cell-primary" style={{ fontSize: 13 }}>{product.montant}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
