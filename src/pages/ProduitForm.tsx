import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { brandLabels, getProductBySku, type AdminProduct } from "../lib/mockData";

const BRAND_OPTIONS: AdminProduct["brand"][] = ["capsule", "spicy", "rihan"];
const STATUS_OPTIONS: AdminProduct["statut"][] = ["En stock", "Stock faible", "Épuisé"];

export default function ProduitForm() {
  const { sku } = useParams();
  const navigate = useNavigate();
  const existing = sku ? getProductBySku(sku) : undefined;
  const isEdit = Boolean(existing);

  const [nom, setNom] = useState(existing?.nom ?? "");
  const [brand, setBrand] = useState<AdminProduct["brand"]>(existing?.brand ?? "capsule");
  const [prix, setPrix] = useState(existing?.prix.replace(/[^\d]/g, "") ?? "");
  const [stock, setStock] = useState(String(existing?.stock ?? ""));
  const [statut, setStatut] = useState<AdminProduct["statut"]>(existing?.statut ?? "En stock");
  const [description, setDescription] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate("/produits");
  }

  return (
    <AdminLayout
      title={isEdit ? "Modifier le produit" : "Nouveau produit"}
      crumb={isEdit ? `SKU ${existing?.sku}` : "Ajouter un produit au catalogue"}
    >
      <a className="back-link" href="/produits">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        Retour aux produits
      </a>

      <div className="panel">
        <div className="panel-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field full">
                <label>Nom du produit</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Chemise Kente" required />
              </div>
              <div className="field">
                <label>Marque</label>
                <select value={brand} onChange={(e) => setBrand(e.target.value as AdminProduct["brand"])}>
                  {BRAND_OPTIONS.map((b) => (
                    <option key={b} value={b}>{brandLabels[b]}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Statut</label>
                <select value={statut} onChange={(e) => setStatut(e.target.value as AdminProduct["statut"])}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Prix (FCFA)</label>
                <input type="number" value={prix} onChange={(e) => setPrix(e.target.value)} placeholder="22000" required />
              </div>
              <div className="field">
                <label>Stock</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="34" required />
              </div>
              <div className="field full">
                <label>Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description du produit..." />
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-primary" type="submit">
                {isEdit ? "Enregistrer les modifications" : "Créer le produit"}
              </button>
              <button className="btn btn-outline" type="button" onClick={() => navigate("/produits")}>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
