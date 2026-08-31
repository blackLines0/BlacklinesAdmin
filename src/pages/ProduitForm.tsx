import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch, uploadImage } from "../lib/api";

interface Brand {
  id: string;
  slug: string;
  nom: string;
}

interface Product {
  id: string;
  nom: string;
  brandId: string;
  description: string | null;
  prix: number;
  images: string[];
  stock: number;
  statut: "en_stock" | "stock_faible" | "epuise";
}

const STATUS_OPTIONS: { value: Product["statut"]; label: string }[] = [
  { value: "en_stock", label: "En stock" },
  { value: "stock_faible", label: "Stock faible" },
  { value: "epuise", label: "Épuisé" },
];

export default function ProduitForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [brandId, setBrandId] = useState("");
  const [prix, setPrix] = useState("");
  const [stock, setStock] = useState("");
  const [statut, setStatut] = useState<Product["statut"]>("en_stock");
  const [description, setDescription] = useState("");
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch<Brand[]>("/brands")
      .then((data) => {
        setBrands(data);
        setBrandId((prev) => prev || data[0]?.id || "");
      })
      .catch(() => setError("Impossible de charger les marques"));
  }, []);

  useEffect(() => {
    if (!id) return;

    apiFetch<Product>(`/admin/products/${id}`)
      .then((product) => {
        setNom(product.nom);
        setBrandId(product.brandId);
        setPrix(String(product.prix));
        setStock(String(product.stock));
        setStatut(product.statut);
        setDescription(product.description ?? "");
        setMainImage(product.images[0] ?? null);
        setGalleryImages(product.images.slice(1));
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleMainImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingMain(true);
    setError(null);
    try {
      const { url } = await uploadImage(file);
      setMainImage(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploadingMain(false);
      e.target.value = "";
    }
  }

  async function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploadingGallery(true);
    setError(null);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadImage(file)));
      setGalleryImages((prev) => [...prev, ...uploaded.map((u) => u.url)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploadingGallery(false);
      e.target.value = "";
    }
  }

  function removeGalleryImage(url: string) {
    setGalleryImages((prev) => prev.filter((img) => img !== url));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const images = [mainImage, ...galleryImages].filter((img): img is string => Boolean(img));

    try {
      const payload = {
        nom,
        brandId,
        prix: Number(prix),
        stock: Number(stock),
        statut,
        description: description || undefined,
        images,
      };

      if (isEdit) {
        await apiFetch(`/admin/products/${id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      navigate("/produits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Modifier le produit" crumb="">
        <p className="cell-muted">Chargement...</p>
      </AdminLayout>
    );
  }

  if (notFound) {
    return (
      <AdminLayout title="Produit introuvable" crumb="">
        <p className="cell-muted">Aucun produit ne correspond à cet identifiant.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={isEdit ? "Modifier le produit" : "Nouveau produit"}
      crumb={isEdit ? "Modifier les informations du produit" : "Ajouter un produit au catalogue"}
    >
      <a className="back-link" href="/produits">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
        Retour aux produits
      </a>

      <div className="panel">
        <div className="panel-body">
          <form onSubmit={handleSubmit}>
            <div className="field full">
              <label>Image principale</label>
              <div className="image-upload-row">
                <button
                  type="button"
                  className="image-slot image-slot-main"
                  onClick={() => mainInputRef.current?.click()}
                >
                  {mainImage ? (
                    <img src={mainImage} alt="Image principale" />
                  ) : (
                    <span className="image-slot-label">{uploadingMain ? "Envoi..." : "+ Ajouter"}</span>
                  )}
                </button>
                <input
                  ref={mainInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleMainImageChange}
                />
              </div>
            </div>

            <div className="field full">
              <label>Images secondaires</label>
              <div className="image-upload-row">
                {galleryImages.map((img) => (
                  <div className="image-slot" key={img}>
                    <img src={img} alt="" />
                    <button
                      type="button"
                      className="image-slot-remove"
                      aria-label="Retirer"
                      onClick={() => removeGalleryImage(img)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="image-slot"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <span className="image-slot-label">{uploadingGallery ? "Envoi..." : "+ Ajouter"}</span>
                </button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleGalleryChange}
                />
              </div>
            </div>

            <div className="form-grid">
              <div className="field full">
                <label>Nom du produit</label>
                <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Chemise Kente" required />
              </div>
              <div className="field">
                <label>Marque</label>
                <select value={brandId} onChange={(e) => setBrandId(e.target.value)} required>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.nom}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Statut</label>
                <select value={statut} onChange={(e) => setStatut(e.target.value as Product["statut"])}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
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

            {error ? <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{error}</p> : null}

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={submitting || uploadingMain || uploadingGallery}>
                {submitting ? "Enregistrement..." : isEdit ? "Enregistrer les modifications" : "Créer le produit"}
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
