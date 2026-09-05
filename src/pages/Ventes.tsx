import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch } from "../lib/api";
import { brandTagClass, formatDate, formatPrice } from "../lib/format";

interface SizeOption {
  id: string;
  label: string;
}

interface Variant {
  id: string;
  stock: number;
  sizeOption: SizeOption;
}

interface Product {
  id: string;
  nom: string;
  prix: number;
  prixPromo: number | null;
  stock: number;
  brand: { id: string; nom: string; slug: string };
  variants: Variant[];
}

interface VenteOrder {
  id: string;
  montantTotal: number;
  moyenPaiement: string;
  createdAt: string;
  customer: { nom: string };
  items: { quantite: number; prixUnitaire: number; product: { nom: string; brand: { slug: string; nom: string } } }[];
}

const PAIEMENT_OPTIONS = ["Espèces (boutique)", "Mobile Money (boutique)"];

export default function Ventes() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ventes, setVentes] = useState<VenteOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [productId, setProductId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [quantite, setQuantite] = useState("1");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [moyenPaiement, setMoyenPaiement] = useState(PAIEMENT_OPTIONS[0]);
  const [showClient, setShowClient] = useState(false);
  const [clientNom, setClientNom] = useState("");
  const [clientTelephone, setClientTelephone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === productId) ?? null;

  function loadVentes() {
    apiFetch<VenteOrder[]>("/admin/orders?canal=boutique")
      .then(setVentes)
      .catch(() => setVentes([]));
  }

  useEffect(() => {
    apiFetch<Product[]>("/admin/products")
      .then((data) => {
        setProducts(data);
        setProductId((prev) => prev || data[0]?.id || "");
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
    loadVentes();
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    setPrixUnitaire(String(selectedProduct.prixPromo ?? selectedProduct.prix));
    const firstInStock = selectedProduct.variants.find((v) => v.stock > 0) ?? selectedProduct.variants[0];
    setVariantId(firstInStock?.id ?? "");
  }, [selectedProduct]);

  const total = useMemo(() => {
    const qty = Number(quantite) || 0;
    const prix = Number(prixUnitaire) || 0;
    return qty * prix;
  }, [quantite, prixUnitaire]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!productId || !quantite || !prixUnitaire) {
      setError("Produit, quantité et prix requis.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/admin/ventes", {
        method: "POST",
        body: JSON.stringify({
          items: [
            {
              productId,
              variantId: variantId || undefined,
              quantite: Number(quantite),
              prixUnitaire: Number(prixUnitaire),
            },
          ],
          moyenPaiement,
          client: showClient && (clientNom || clientTelephone)
            ? { nom: clientNom || undefined, telephone: clientTelephone || undefined }
            : undefined,
        }),
      });

      setQuantite("1");
      setClientNom("");
      setClientTelephone("");
      setShowClient(false);
      loadVentes();
      // refresh product stock shown in the select
      apiFetch<Product[]>("/admin/products").then(setProducts).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminLayout title="Ventes" crumb={`${ventes.length} ventes en boutique enregistrées`}>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div><h3>Nouvelle vente en boutique</h3><div className="sub">Prix modifiable, le stock est décrémenté comme pour une commande en ligne</div></div>
        </div>
        <div className="panel-body">
          {loading ? (
            <p className="cell-muted">Chargement...</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="field">
                  <label>Produit</label>
                  <select value={productId} onChange={(e) => setProductId(e.target.value)} required>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.brand.nom} — {p.nom}</option>
                    ))}
                  </select>
                </div>
                {selectedProduct && selectedProduct.variants.length ? (
                  <div className="field">
                    <label>Taille</label>
                    <select value={variantId} onChange={(e) => setVariantId(e.target.value)} required>
                      {selectedProduct.variants.map((v) => (
                        <option key={v.id} value={v.id} disabled={v.stock < 1}>
                          {v.sizeOption.label} ({v.stock} en stock)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="field">
                    <label>Stock disponible</label>
                    <input type="text" value={selectedProduct ? `${selectedProduct.stock} en stock` : ""} disabled />
                  </div>
                )}
                <div className="field">
                  <label>Quantité</label>
                  <input type="number" min={1} value={quantite} onChange={(e) => setQuantite(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Prix unitaire (FCFA)</label>
                  <input type="number" min={0} value={prixUnitaire} onChange={(e) => setPrixUnitaire(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Moyen de paiement</label>
                  <select value={moyenPaiement} onChange={(e) => setMoyenPaiement(e.target.value)}>
                    {PAIEMENT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Total</label>
                  <input type="text" value={formatPrice(total)} disabled />
                </div>
              </div>

              {showClient ? (
                <div className="form-grid" style={{ marginTop: 4 }}>
                  <div className="field">
                    <label>Nom du client (facultatif)</label>
                    <input type="text" value={clientNom} onChange={(e) => setClientNom(e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Téléphone (facultatif)</label>
                    <input type="tel" value={clientTelephone} onChange={(e) => setClientTelephone(e.target.value)} />
                  </div>
                </div>
              ) : (
                <button type="button" className="btn-outline" style={{ marginTop: 4, marginBottom: 16 }} onClick={() => setShowClient(true)}>
                  + Noter les infos du client
                </button>
              )}

              {error ? <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</p> : null}

              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Enregistrement..." : "Enregistrer la vente"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><h3>Historique des ventes en boutique</h3></div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Marque</th>
                <th>Client</th>
                <th>Paiement</th>
                <th>Montant</th>
              </tr>
            </thead>
            <tbody>
              {ventes.map((v) => {
                const brand = v.items[0]?.product.brand;
                return (
                  <tr key={v.id}>
                    <td className="cell-muted">{formatDate(v.createdAt)}</td>
                    <td className="cell-primary">
                      {v.items.map((i) => i.product.nom).join(", ")}
                    </td>
                    <td>{brand ? <span className={`brand-tag ${brandTagClass(brand.slug)}`}>{brand.nom}</span> : "—"}</td>
                    <td>{v.customer.nom}</td>
                    <td className="cell-muted">{v.moyenPaiement}</td>
                    <td className="cell-primary">{formatPrice(v.montantTotal)}</td>
                  </tr>
                );
              })}
              {ventes.length === 0 ? (
                <tr><td colSpan={6} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucune vente en boutique pour l&apos;instant</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
