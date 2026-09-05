import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
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

export default function CommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [statut, setStatut] = useState<OrderStatus>("en_attente");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    apiFetch<Order>(`/admin/orders/${id}`)
      .then((data) => {
        setOrder(data);
        setStatut(data.statut);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!order) return;
    setSaving(true);

    try {
      await apiFetch(`/admin/orders/${order.id}`, {
        method: "PATCH",
        body: JSON.stringify({ statut }),
      });
      navigate("/commandes");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de la mise à jour");
    } finally {
      setSaving(false);
    }
  }

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
              <select value={statut} onChange={(e) => setStatut(e.target.value as OrderStatus)}>
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 10 }}>
              <span className={`badge ${statusBadgeClass(statut)}`}>{ORDER_STATUS_LABELS[statut]}</span>
            </div>

            <div style={{ marginTop: 22 }}>
              <div className="detail-row"><span className="label">Sous-total</span><span className="value">{formatPrice(order.montantTotal)}</span></div>
              <div className="detail-row"><span className="label">Total</span><span className="value">{formatPrice(order.montantTotal)}</span></div>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
