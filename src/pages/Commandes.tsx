import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
import {
  brandTagClass,
  formatDate,
  formatPrice,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "../lib/format";

interface OrderItem {
  id: string;
  quantite: number;
  prixUnitaire: number;
  product: { nom: string; brand: { slug: string; nom: string } };
}

interface Order {
  id: string;
  statut: OrderStatus;
  montantTotal: number;
  moyenPaiement: string;
  createdAt: string;
  customer: { nom: string };
  items: OrderItem[];
}

const STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];
const STATUS_BG: Record<OrderStatus, string> = {
  en_attente: "var(--warning-soft)",
  payee: "var(--success-soft)",
  expediee: "var(--info-soft)",
  livree: "#F1F5F9",
  annulee: "var(--danger-soft)",
};
const STATUS_COLOR: Record<OrderStatus, string> = {
  en_attente: "var(--warning)",
  payee: "var(--success)",
  expediee: "var(--info)",
  livree: "var(--ink-soft)",
  annulee: "var(--danger)",
};

export default function Commandes() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    apiFetch<Order[]>("/admin/orders")
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur de chargement"))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { en_attente: 0, payee: 0, expediee: 0, livree: 0, annulee: 0 };
    for (const o of orders) c[o.statut] = (c[o.statut] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = tab === "all" ? orders : orders.filter((o) => o.statut === tab);

  async function updateStatus(id: string, statut: OrderStatus) {
    const previous = orders;
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, statut } : o)));

    try {
      await apiFetch(`/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ statut }),
      });
    } catch (err) {
      setOrders(previous);
      alert(err instanceof Error ? err.message : "Échec de la mise à jour");
    }
  }

  return (
    <AdminLayout title="Commandes" crumb={`${orders.length} commandes au total`} searchPlaceholder="Rechercher une commande...">
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">En attente</span><div className="kpi-icon amber"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg></div></div>
          <div className="kpi-value">{counts.en_attente}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Payées</span><div className="kpi-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5" /></svg></div></div>
          <div className="kpi-value">{counts.payee}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Expédiées</span><div className="kpi-icon cyan"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h13v13H3z" /><path d="M16 8h4l3 4v4h-7V8Z" /><circle cx="7.5" cy="18.5" r="1.8" /><circle cx="18" cy="18.5" r="1.8" /></svg></div></div>
          <div className="kpi-value">{counts.expediee}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top"><span className="kpi-label">Annulées</span><div className="kpi-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--danger)" }}><circle cx="12" cy="12" r="9" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></div></div>
          <div className="kpi-value">{counts.annulee}</div>
        </div>
      </div>

      <div className="panel">
        <div className="filter-bar">
          <div className="filter-tabs">
            <span className={`filter-tab${tab === "all" ? " active" : ""}`} onClick={() => setTab("all")} style={{ cursor: "pointer" }}>Toutes</span>
            {STATUS_OPTIONS.map(([value, label]) => (
              <span key={value} className={`filter-tab${tab === value ? " active" : ""}`} onClick={() => setTab(value)} style={{ cursor: "pointer" }}>
                {label}
              </span>
            ))}
          </div>
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
                {filtered.map((order) => {
                  const brand = order.items[0]?.product.brand;
                  return (
                    <tr key={order.id}>
                      <td className="cell-primary">#{order.id.slice(-6).toUpperCase()}</td>
                      <td>{order.customer.nom}</td>
                      <td className="cell-muted">{formatDate(order.createdAt)}</td>
                      <td>{brand ? <span className={`brand-tag ${brandTagClass(brand.slug)}`}>{brand.nom}</span> : "—"}</td>
                      <td className="cell-muted">{order.moyenPaiement}</td>
                      <td className="cell-primary">{formatPrice(order.montantTotal)}</td>
                      <td>
                        <select
                          className="select-sm"
                          value={order.statut}
                          onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                          style={{
                            border: "none",
                            background: STATUS_BG[order.statut],
                            color: STATUS_COLOR[order.statut],
                            fontWeight: 700,
                            padding: "5px 10px",
                          }}
                        >
                          {STATUS_OPTIONS.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <Link className="icon-action" aria-label="Voir" to={`/commandes/${order.id}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucune commande</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
