import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
import { brandTagClass, formatDate, formatPrice, ORDER_STATUS_LABELS, statusBadgeClass, type OrderStatus } from "../lib/format";

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
  items: OrderItem[];
}

interface CustomerDetail {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  createdAt: string;
  orders: Order[];
}

export default function ClientDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch<CustomerDetail>(`/admin/customers/${id}`)
      .then(setCustomer)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <AdminLayout title="Client" crumb="">
        <p className="cell-muted">Chargement...</p>
      </AdminLayout>
    );
  }

  if (notFound || !customer) {
    return (
      <AdminLayout title="Client introuvable" crumb="">
        <p className="cell-muted">Aucun client ne correspond à cet identifiant.</p>
      </AdminLayout>
    );
  }

  const totalDepense = customer.orders
    .filter((o) => o.statut !== "annulee")
    .reduce((sum, o) => sum + o.montantTotal, 0);

  return (
    <AdminLayout title={customer.nom} crumb={`Client depuis le ${formatDate(customer.createdAt)}`}>
      <a className="back-link" href="/clients">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        Retour aux clients
      </a>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-head">
            <div><h3>Commandes</h3><div className="sub">{customer.orders.length} commande{customer.orders.length > 1 ? "s" : ""}</div></div>
          </div>
          {customer.orders.length === 0 ? (
            <div className="panel-body"><p className="cell-muted">Aucune commande pour ce client.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Commande</th><th>Date</th><th>Marque</th><th>Montant</th><th>Statut</th></tr>
                </thead>
                <tbody>
                  {customer.orders.map((order) => {
                    const brand = order.items[0]?.product.brand;
                    return (
                      <tr key={order.id}>
                        <td className="cell-primary">#{order.id.slice(-6).toUpperCase()}</td>
                        <td className="cell-muted">{formatDate(order.createdAt)}</td>
                        <td>{brand ? <span className={`brand-tag ${brandTagClass(brand.slug)}`}>{brand.nom}</span> : "—"}</td>
                        <td className="cell-primary">{formatPrice(order.montantTotal)}</td>
                        <td><span className={`badge ${statusBadgeClass(order.statut)}`}>{ORDER_STATUS_LABELS[order.statut]}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-head"><div><h3>Informations</h3></div></div>
          <div className="panel-body">
            <div className="detail-row"><span className="label">Nom</span><span className="value">{customer.nom}</span></div>
            {customer.email ? <div className="detail-row"><span className="label">Email</span><span className="value">{customer.email}</span></div> : null}
            {customer.telephone ? <div className="detail-row"><span className="label">Téléphone</span><span className="value">{customer.telephone}</span></div> : null}
            {customer.adresse ? <div className="detail-row"><span className="label">Adresse</span><span className="value">{customer.adresse}</span></div> : null}
            <div className="detail-row"><span className="label">Total dépensé</span><span className="value">{formatPrice(totalDepense)}</span></div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
