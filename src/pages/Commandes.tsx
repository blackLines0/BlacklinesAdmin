import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { adminOrders, brandLabels, type AdminOrder } from "../lib/mockData";

const STATUS_OPTIONS: AdminOrder["statut"][] = ["En attente", "Payée", "Expédiée", "Livrée", "Annulée"];
const STATUS_BG: Record<AdminOrder["statut"], string> = {
  "En attente": "var(--warning-soft)",
  Payée: "var(--success-soft)",
  Expédiée: "var(--info-soft)",
  Livrée: "#F1F5F9",
  Annulée: "var(--danger-soft)",
};
const STATUS_COLOR: Record<AdminOrder["statut"], string> = {
  "En attente": "var(--warning)",
  Payée: "var(--success)",
  Expédiée: "var(--info)",
  Livrée: "var(--ink-soft)",
  Annulée: "var(--danger)",
};

const FILTER_TABS: { label: string; statut?: AdminOrder["statut"] }[] = [
  { label: "Toutes" },
  { label: "En attente", statut: "En attente" },
  { label: "Payées", statut: "Payée" },
  { label: "Expédiées", statut: "Expédiée" },
  { label: "Livrées", statut: "Livrée" },
  { label: "Annulées", statut: "Annulée" },
];

export default function Commandes() {
  const [orders, setOrders] = useState(adminOrders);
  const [tab, setTab] = useState("Toutes");

  function updateStatus(id: string, statut: AdminOrder["statut"]) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statut } : o)));
  }

  const activeStatut = FILTER_TABS.find((t) => t.label === tab)?.statut;
  const filtered = activeStatut ? orders.filter((o) => o.statut === activeStatut) : orders;

  return (
    <AdminLayout title="Commandes" crumb="312 commandes au total" searchPlaceholder="Rechercher une commande...">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">En attente</span><div className="kpi-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg></div></div>
          <div className="kpi-value">8</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Payées</span><div className="kpi-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></div></div>
          <div className="kpi-value">214</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Expédiées</span><div className="kpi-icon cyan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h13v13H3z" /><path d="M16 8h4l3 4v4h-7V8Z" /><circle cx="7.5" cy="18.5" r="1.8" /><circle cx="18" cy="18.5" r="1.8" /></svg></div></div>
          <div className="kpi-value">67</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Annulées</span><div className="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--danger)" }}><circle cx="12" cy="12" r="9" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></div></div>
          <div className="kpi-value">23</div>
        </div>
      </div>

      <div className="panel">
        <div className="filter-bar">
          <div className="filter-tabs">
            {FILTER_TABS.map((t) => (
              <span
                key={t.label}
                className={`filter-tab${tab === t.label ? " active" : ""}`}
                onClick={() => setTab(t.label)}
                style={{ cursor: "pointer" }}
              >
                {t.label}
              </span>
            ))}
          </div>
          <div className="spacer" />
          <select className="select-sm">
            <option>Marque : Toutes</option>
            <option>Capsule Textile</option>
            <option>Spicysoul</option>
            <option>Rihan Wa Harir</option>
          </select>
          <select className="select-sm">
            <option>Paiement : Tous</option>
            <option>Mobile Money</option>
            <option>Carte bancaire</option>
          </select>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th><input type="checkbox" /></th>
                <th>Commande</th>
                <th>Client</th>
                <th>Date</th>
                <th>Marque</th>
                <th>Paiement</th>
                <th>Montant</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td><input type="checkbox" /></td>
                  <td className="cell-primary">{order.id}</td>
                  <td>{order.client}</td>
                  <td className="cell-muted">{order.date}</td>
                  <td><span className={`brand-tag ${order.brand}`}>{brandLabels[order.brand]}</span></td>
                  <td className="cell-muted">{order.paiement}</td>
                  <td className="cell-primary">{order.montant}</td>
                  <td>
                    <select
                      className="select-sm"
                      value={order.statut}
                      onChange={(e) => updateStatus(order.id, e.target.value as AdminOrder["statut"])}
                      style={{
                        border: "none",
                        background: STATUS_BG[order.statut],
                        color: STATUS_COLOR[order.statut],
                        fontWeight: 700,
                        padding: "5px 10px",
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <Link className="icon-action" aria-label="Voir" to={`/commandes/${order.id.replace("#", "")}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span className="info">Affichage de 1 à {filtered.length} sur 312 commandes</span>
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
