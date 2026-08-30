import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { adminProducts, brandLabels, getOrderById, statusBadgeClass, type AdminOrder } from "../lib/mockData";

const STATUS_OPTIONS: AdminOrder["statut"][] = ["En attente", "Payée", "Expédiée", "Livrée", "Annulée"];

export default function CommandeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const order = id ? getOrderById(id) : undefined;
  const [statut, setStatut] = useState(order?.statut);

  if (!order || !statut) {
    return (
      <AdminLayout title="Commande introuvable" crumb="">
        <p className="cell-muted">Aucune commande ne correspond à cet identifiant.</p>
      </AdminLayout>
    );
  }

  const item = adminProducts.find((p) => p.brand === order.brand) ?? adminProducts[0];

  return (
    <AdminLayout title={order.id} crumb={`Commande passée le ${order.date}`}>
      <a className="back-link" href="/commandes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        Retour aux commandes
      </a>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-head">
            <div><h3>Articles</h3><div className="sub">1 article dans cette commande</div></div>
          </div>
          <div className="panel-body">
            <div className="cell-flex">
              <div className="thumb-sm" style={{ background: item.swatch, width: 52, height: 52 }} />
              <div style={{ flex: 1 }}>
                <div className="cell-primary">{item.nom}</div>
                <div className="cell-muted" style={{ fontSize: 12 }}>{brandLabels[order.brand]} · Qté 1</div>
              </div>
              <div className="cell-primary">{order.montant}</div>
            </div>
          </div>

          <div className="panel-head" style={{ borderTop: "1px solid var(--line)" }}>
            <div><h3>Client</h3></div>
          </div>
          <div className="panel-body">
            <div className="detail-row"><span className="label">Nom</span><span className="value">{order.client}</span></div>
            <div className="detail-row"><span className="label">Marque</span><span className="value">{brandLabels[order.brand]}</span></div>
            <div className="detail-row"><span className="label">Moyen de paiement</span><span className="value">{order.paiement}</span></div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><div><h3>Statut de la commande</h3></div></div>
          <div className="panel-body">
            <div className="field">
              <label>Statut</label>
              <select value={statut} onChange={(e) => setStatut(e.target.value as AdminOrder["statut"])}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 10 }}>
              <span className={`badge ${statusBadgeClass(statut)}`}>{statut}</span>
            </div>

            <div style={{ marginTop: 22 }}>
              <div className="detail-row"><span className="label">Sous-total</span><span className="value">{order.montant}</span></div>
              <div className="detail-row"><span className="label">Total</span><span className="value">{order.montant}</span></div>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" onClick={() => navigate("/commandes")}>Enregistrer</button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
