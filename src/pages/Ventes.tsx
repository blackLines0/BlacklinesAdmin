import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { Combobox } from "../components/Combobox";
import { Select } from "../components/Select";
import { apiFetch } from "../lib/api";
import { exportToCsv } from "../lib/csvExport";
import { queryKeys } from "../lib/queryKeys";
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

interface VenteItemInput {
  productId: string;
  variantId: string;
  quantite: string;
  prixUnitaire: string;
}

const PAIEMENT_OPTIONS = ["Espèces (boutique)", "Mobile Money (boutique)"];

export default function Ventes() {
  const queryClient = useQueryClient();
  const [productsQuery, ventesQuery] = useQueries({
    queries: [
      { queryKey: queryKeys.products, queryFn: () => apiFetch<Product[]>("/admin/products") },
      { queryKey: queryKeys.ordersBoutique, queryFn: () => apiFetch<VenteOrder[]>("/admin/orders?canal=boutique") },
    ],
  });
  const products = productsQuery.data ?? [];
  const ventes = ventesQuery.data ?? [];
  const loading = productsQuery.isLoading;

  const [items, setItems] = useState<VenteItemInput[]>([
    { productId: "", variantId: "", quantite: "1", prixUnitaire: "" },
  ]);
  const [moyenPaiement, setMoyenPaiement] = useState(PAIEMENT_OPTIONS[0]);
  const [showClient, setShowClient] = useState(false);
  const [clientNom, setClientNom] = useState("");
  const [clientTelephone, setClientTelephone] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems((prev) =>
      prev.map((item, index) => index === 0 && !item.productId && products[0] ? { ...item, productId: products[0].id } : item),
    );
  }, [products]);

  function updateItem(index: number, patch: Partial<VenteItemInput>) {
    setItems((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  }

  function selectProduct(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    const firstInStock = product?.variants.find((v) => v.stock > 0) ?? product?.variants[0];
    updateItem(index, {
      productId,
      variantId: firstInStock?.id ?? "",
      prixUnitaire: product ? String(product.prixPromo ?? product.prix) : "",
    });
  }

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.quantite) || 0) * (Number(item.prixUnitaire) || 0), 0),
    [items],
  );

  const submit = useMutation({
    mutationFn: () =>
      apiFetch("/admin/ventes", {
        method: "POST",
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || undefined,
            quantite: Number(item.quantite),
            prixUnitaire: Number(item.prixUnitaire),
          })),
          moyenPaiement,
          client: showClient && (clientNom || clientTelephone)
            ? { nom: clientNom || undefined, telephone: clientTelephone || undefined }
            : undefined,
        }),
      }),
    onSuccess: () => {
      setItems([{ productId: products[0]?.id ?? "", variantId: "", quantite: "1", prixUnitaire: "" }]);
      setClientNom("");
      setClientTelephone("");
      setShowClient(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.ordersBoutique });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders });
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll });
    },
    onError: (err) => setError(err instanceof Error ? err.message : "Échec de l'enregistrement"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.some((item) => !item.productId || !item.quantite || !item.prixUnitaire)) {
      setError("Chaque ligne doit avoir un produit, une quantité et un prix.");
      return;
    }

    submit.mutate();
  }

  function handleExport() {
    exportToCsv("ventes", ventes, [
      { label: "Date", value: (v) => formatDate(v.createdAt) },
      { label: "Produit", value: (v) => v.items.map((i) => i.product.nom).join(", ") },
      { label: "Marque", value: (v) => v.items[0]?.product.brand.nom ?? "" },
      { label: "Client", value: (v) => v.customer.nom },
      { label: "Paiement", value: (v) => v.moyenPaiement },
      { label: "Montant", value: (v) => v.montantTotal },
    ]);
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
              {items.map((item, index) => {
                const selectedProduct = products.find((p) => p.id === item.productId) ?? null;
                return (
                  <div className="form-grid" key={index} style={{ marginBottom: 12 }}>
                    <div className="field">
                      <label>Produit {index + 1}</label>
                      <Combobox
                        value={item.productId}
                        onChange={(value) => selectProduct(index, value)}
                        placeholder="Rechercher un produit..."
                        options={products.map((p) => ({ value: p.id, label: p.nom, keywords: p.brand.nom }))}
                      />
                    </div>
                    {selectedProduct && selectedProduct.variants.length ? (
                      <div className="field">
                        <label>Taille</label>
                        <Select
                          value={item.variantId}
                          onChange={(value) => updateItem(index, { variantId: value })}
                          options={selectedProduct.variants.map((v) => ({
                            value: v.id,
                            label: `${v.sizeOption.label} (${v.stock} en stock)`,
                            disabled: v.stock < 1,
                          }))}
                        />
                      </div>
                    ) : (
                      <div className="field">
                        <label>Stock disponible</label>
                        <input type="text" value={selectedProduct ? `${selectedProduct.stock} en stock` : ""} disabled />
                      </div>
                    )}
                    <div className="field">
                      <label>Quantité</label>
                      <input type="number" min={1} value={item.quantite} onChange={(e) => updateItem(index, { quantite: e.target.value })} required />
                    </div>
                    <div className="field">
                      <label>Prix unitaire (FCFA)</label>
                      <input type="number" min={0} value={item.prixUnitaire} onChange={(e) => updateItem(index, { prixUnitaire: e.target.value })} required />
                    </div>
                    {items.length > 1 ? (
                      <div className="field" style={{ alignSelf: "end" }}>
                        <button type="button" className="btn btn-outline" onClick={() => setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}>
                          Retirer
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
              <button type="button" className="btn btn-outline" onClick={() => setItems((prev) => [...prev, { productId: "", variantId: "", quantite: "1", prixUnitaire: "" }])}>
                + Ajouter un produit
              </button>
              <div className="form-grid" style={{ marginTop: 12 }}>
                <div className="field">
                  <label>Moyen de paiement</label>
                  <Select
                    value={moyenPaiement}
                    onChange={setMoyenPaiement}
                    options={PAIEMENT_OPTIONS.map((opt) => ({ value: opt, label: opt }))}
                  />
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
                <button type="button" className="btn btn-outline" style={{ marginTop: 4, marginBottom: 16 }} onClick={() => setShowClient(true)}>
                  + Noter les infos du client
                </button>
              )}

              {error ? <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</p> : null}

              <div className="form-actions">
                <button className="btn btn-primary" type="submit" disabled={submit.isPending}>
                  {submit.isPending ? "Enregistrement..." : "Enregistrer la vente"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><h3>Historique des ventes en boutique</h3></div>
          <button className="btn btn-outline btn-sm" type="button" onClick={handleExport}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Exporter tout
          </button>
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
                <th></th>
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
                    <td>
                      <Link className="icon-action" aria-label="Voir" to={`/commandes/${v.id}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {ventes.length === 0 ? (
                <tr><td colSpan={7} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucune vente en boutique pour l&apos;instant</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
