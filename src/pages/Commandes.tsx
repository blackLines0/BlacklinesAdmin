import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { Select, type SelectOption } from "../components/Select";
import { apiFetch } from "../lib/api";
import { exportToCsv } from "../lib/csvExport";
import { queryKeys } from "../lib/queryKeys";
import {
  brandTagClass,
  formatDate,
  formatPrice,
  ORDER_STATUS_LABELS,
  statusBadgeClass,
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
  canal: "en_ligne" | "boutique";
  createdAt: string;
  customer: { nom: string };
  items: OrderItem[];
}

const CANAL_LABELS: Record<Order["canal"], string> = {
  en_ligne: "En ligne",
  boutique: "Boutique",
};

const STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];
const STATUS_SELECT_OPTIONS: SelectOption[] = STATUS_OPTIONS.map(([value, label]) => ({
  value,
  label,
  tone: statusBadgeClass(value) as SelectOption["tone"],
}));
const CANAL_SELECT_OPTIONS: SelectOption[] = [
  { value: "all", label: "Canal : Tous" },
  { value: "en_ligne", label: "En ligne" },
  { value: "boutique", label: "Boutique" },
];

export default function Commandes() {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading: loading, error } = useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => apiFetch<Order[]>("/admin/orders"),
  });
  const [tab, setTab] = useState<OrderStatus | "all">("all");
  const [canalTab, setCanalTab] = useState<Order["canal"] | "all">("all");
  const [search, setSearch] = useState("");

  const updateStatus = useMutation({
    mutationFn: ({ id, statut }: { id: string; statut: OrderStatus }) =>
      apiFetch(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ statut }) }),
    onMutate: async ({ id, statut }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.orders });
      const previous = queryClient.getQueryData<Order[]>(queryKeys.orders);
      queryClient.setQueryData<Order[]>(queryKeys.orders, (prev) =>
        prev?.map((o) => (o.id === id ? { ...o, statut } : o)),
      );
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.orders, context.previous);
      alert(err instanceof Error ? err.message : "Échec de la mise à jour");
    },
  });

  const counts = useMemo(() => {
    const c: Record<string, number> = { en_attente: 0, payee: 0, expediee: 0, livree: 0, annulee: 0 };
    for (const o of orders) c[o.statut] = (c[o.statut] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = orders
    .filter((o) => tab === "all" || o.statut === tab)
    .filter((o) => canalTab === "all" || o.canal === canalTab)
    .filter((o) => {
      const term = search.trim().toLowerCase();
      if (!term) return true;
      return o.id.slice(-6).toLowerCase().includes(term) || o.customer.nom.toLowerCase().includes(term);
    });

  function handleExport() {
    exportToCsv("commandes", filtered, [
      { label: "Commande", value: (o) => `#${o.id.slice(-6).toUpperCase()}` },
      { label: "Client", value: (o) => o.customer.nom },
      { label: "Date", value: (o) => formatDate(o.createdAt) },
      { label: "Marque", value: (o) => o.items[0]?.product.brand.nom ?? "" },
      { label: "Canal", value: (o) => CANAL_LABELS[o.canal] },
      { label: "Paiement", value: (o) => o.moyenPaiement },
      { label: "Montant", value: (o) => o.montantTotal },
      { label: "Statut", value: (o) => ORDER_STATUS_LABELS[o.statut] },
    ]);
  }

  return (
    <AdminLayout
      title="Commandes"
      crumb={`${orders.length} commandes au total`}
      searchPlaceholder="Rechercher une commande..."
      searchValue={search}
      onSearchChange={setSearch}
    >
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
          <div className="spacer" />
          <Select
            size="sm"
            value={canalTab}
            onChange={(v) => setCanalTab(v as Order["canal"] | "all")}
            options={CANAL_SELECT_OPTIONS}
          />
          <button className="btn btn-outline btn-sm" type="button" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Exporter tout
          </button>
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
                  <th>Commande</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th>Marque</th>
                  <th>Canal</th>
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
                      <td>
                        <span className={`badge ${order.canal === "boutique" ? "info" : "neutral"}`}>
                          {CANAL_LABELS[order.canal]}
                        </span>
                      </td>
                      <td className="cell-muted">{order.moyenPaiement}</td>
                      <td className="cell-primary">{formatPrice(order.montantTotal)}</td>
                      <td>
                        <Select
                          size="sm"
                          value={order.statut}
                          onChange={(v) => updateStatus.mutate({ id: order.id, statut: v as OrderStatus })}
                          options={STATUS_SELECT_OPTIONS}
                        />
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
                  <tr><td colSpan={9} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucune commande</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
