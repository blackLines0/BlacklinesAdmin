import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { Select, type SelectOption } from "../components/Select";
import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import {
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
  product: { nom: string; images: string[]; brand: { slug: string; nom: string } };
  variant: { sizeOption: { label: string } } | null;
}

interface Order {
  id: string;
  statut: OrderStatus;
  montantTotal: number;
  moyenPaiement: string;
  createdAt: string;
  customer: { nom: string; telephone: string; adresse: string | null };
  items: OrderItem[];
}

const STATUS_OPTIONS = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];
const STATUS_SELECT_OPTIONS: SelectOption[] = STATUS_OPTIONS.map(([value, label]) => ({
  value,
  label,
  tone: statusBadgeClass(value) as SelectOption["tone"],
}));

export default function CommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statut, setStatut] = useState<OrderStatus>("en_attente");

  const { data: order, isLoading: loading, isError: notFound } = useQuery({
    queryKey: queryKeys.order(id!),
    queryFn: () => apiFetch<Order>(`/admin/orders/${id}`),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (order) setStatut(order.statut);
  }, [order]);

  const save = useMutation({
    mutationFn: () => apiFetch(`/admin/orders/${id}`, { method: "PATCH", body: JSON.stringify({ statut }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.ordersBoutique });
      queryClient.invalidateQueries({ queryKey: queryKeys.order(id!) });
      navigate("/commandes");
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la mise à jour"),
  });

  if (loading) {
    return (
      <AdminLayout title="Commande" crumb="">
        <p className="cell-muted">Chargement...</p>
      </AdminLayout>
    );
  }

  if (notFound || !order) {
    return (
      <AdminLayout title="Commande introuvable" crumb="">
        <p className="cell-muted">Aucune commande ne correspond à cet identifiant.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Commande #${order.id.slice(-6).toUpperCase()}`} crumb={`Commande passée le ${formatDate(order.createdAt)}`}>
      <a className="back-link" href="/commandes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        Retour aux commandes
      </a>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-head">
            <div><h3>Articles</h3><div className="sub">{order.items.length} article{order.items.length > 1 ? "s" : ""} dans cette commande</div></div>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {order.items.map((item) => (
              <div className="cell-flex" key={item.id}>
                <div className="thumb-sm" style={{ background: "#EEF2F7", backgroundImage: item.product.images[0] ? `url(${item.product.images[0]})` : undefined, backgroundSize: "cover", backgroundPosition: "center", width: 52, height: 52 }} />
                <div style={{ flex: 1 }}>
                  <div className="cell-primary">{item.product.nom}</div>
                  <div className="cell-muted" style={{ fontSize: 12 }}>
                    {item.product.brand.nom}{item.variant ? ` · Taille ${item.variant.sizeOption.label}` : ""} · Qté {item.quantite}
                  </div>
                </div>
                <div className="cell-primary">{formatPrice(item.prixUnitaire * item.quantite)}</div>
              </div>
            ))}
          </div>

          <div className="panel-head" style={{ borderTop: "1px solid var(--line)" }}>
            <div><h3>Client</h3></div>
          </div>
          <div className="panel-body">
            <div className="detail-row"><span className="label">Nom</span><span className="value">{order.customer.nom}</span></div>
            <div className="detail-row"><span className="label">Téléphone</span><span className="value">{order.customer.telephone}</span></div>
            {order.customer.adresse ? (
              <div className="detail-row"><span className="label">Adresse</span><span className="value">{order.customer.adresse}</span></div>
            ) : null}
            <div className="detail-row"><span className="label">Moyen de paiement</span><span className="value">{order.moyenPaiement}</span></div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div><h3>Statut de la commande</h3></div></div>
          <div className="panel-body">
            <div className="field">
              <label>Statut</label>
              <Select value={statut} onChange={(v) => setStatut(v as OrderStatus)} options={STATUS_SELECT_OPTIONS} />
            </div>

            <div style={{ marginTop: 22 }}>
              <div className="detail-row"><span className="label">Sous-total</span><span className="value">{formatPrice(order.montantTotal)}</span></div>
              <div className="detail-row"><span className="label">Total</span><span className="value">{formatPrice(order.montantTotal)}</span></div>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
                {save.isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
