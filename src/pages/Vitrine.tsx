import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { apiFetch, uploadImage } from "../lib/api";

interface HeroSlide {
  id: string;
  image: string;
  titre: string | null;
  sousTitre: string | null;
  lien: string | null;
  ordre: number;
  actif: boolean;
}

interface Announcement {
  id: string;
  texte: string;
  codePromo: string | null;
  dateFin: string | null;
  actif: boolean;
}

export default function Vitrine() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [titre, setTitre] = useState("");
  const [sousTitre, setSousTitre] = useState("");
  const [lien, setLien] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [texte, setTexte] = useState("");
  const [codePromo, setCodePromo] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [actif, setActif] = useState(false);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  function loadSlides() {
    setLoadingSlides(true);
    apiFetch<HeroSlide[]>("/admin/hero-slides")
      .then(setSlides)
      .finally(() => setLoadingSlides(false));
  }

  useEffect(() => {
    loadSlides();
    apiFetch<Announcement | null>("/admin/announcement").then((a) => {
      if (a) {
        setTexte(a.texte);
        setCodePromo(a.codePromo ?? "");
        setDateFin(a.dateFin ? a.dateFin.slice(0, 16) : "");
        setActif(a.actif);
      }
    });
  }, []);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      await apiFetch("/admin/hero-slides", {
        method: "POST",
        body: JSON.stringify({ image: url, titre: titre || undefined, sousTitre: sousTitre || undefined, lien: lien || undefined, ordre: slides.length }),
      });
      setTitre("");
      setSousTitre("");
      setLien("");
      loadSlides();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de l'ajout");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function toggleActif(slide: HeroSlide) {
    const previous = slides;
    setSlides((prev) => prev.map((s) => (s.id === slide.id ? { ...s, actif: !s.actif } : s)));
    try {
      await apiFetch(`/admin/hero-slides/${slide.id}`, { method: "PATCH", body: JSON.stringify({ actif: !slide.actif }) });
    } catch (err) {
      setSlides(previous);
      alert(err instanceof Error ? err.message : "Échec de la mise à jour");
    }
  }

  async function removeSlide(id: string) {
    if (!confirm("Supprimer cette image du hero ?")) return;
    try {
      await apiFetch(`/admin/hero-slides/${id}`, { method: "DELETE" });
      setSlides((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de la suppression");
    }
  }

  async function saveAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setSavingAnnouncement(true);
    try {
      await apiFetch<Announcement>("/admin/announcement", {
        method: "PUT",
        body: JSON.stringify({
          texte,
          codePromo: codePromo || undefined,
          dateFin: dateFin || undefined,
          actif,
        }),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de l'enregistrement");
    } finally {
      setSavingAnnouncement(false);
    }
  }

  return (
    <AdminLayout title="Vitrine" crumb="Images d'accueil et bannière d'annonce du site">
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div><h3>Images du hero</h3><div className="sub">Affichées en carrousel sur la page d&apos;accueil</div></div>
        </div>
        <div className="panel-body">
          {loadingSlides ? (
            <p className="cell-muted">Chargement...</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
              {slides.map((s) => (
                <div key={s.id} className="detail-row">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 64, height: 40, borderRadius: 6, backgroundImage: `url(${s.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                    <div>
                      <div className="value">{s.titre ?? "(sans titre)"}</div>
                      {s.sousTitre ? <div className="cell-muted" style={{ fontSize: 12 }}>{s.sousTitre}</div> : null}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button className={`badge ${s.actif ? "success" : "neutral"}`} onClick={() => toggleActif(s)} style={{ cursor: "pointer", border: "none" }}>
                      {s.actif ? "Actif" : "Inactif"}
                    </button>
                    <button className="icon-action" aria-label="Supprimer" onClick={() => removeSlide(s.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>
              ))}
              {slides.length === 0 ? <p className="cell-muted">Aucune image pour l&apos;instant.</p> : null}
            </div>
          )}

          <div className="form-grid">
            <div className="field">
              <label>Titre (facultatif)</label>
              <input type="text" value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Nouvelle collection" />
            </div>
            <div className="field">
              <label>Sous-titre (facultatif)</label>
              <input type="text" value={sousTitre} onChange={(e) => setSousTitre(e.target.value)} />
            </div>
            <div className="field">
              <label>Lien (facultatif)</label>
              <input type="text" value={lien} onChange={(e) => setLien(e.target.value)} placeholder="/capsule-textile" />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileSelected} />
          <button className="btn btn-outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Envoi..." : "+ Ajouter une image"}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><h3>Bannière d&apos;annonce</h3><div className="sub">Le bandeau défilant sous la navigation (promo, code, compte à rebours)</div></div>
        </div>
        <div className="panel-body">
          <form onSubmit={saveAnnouncement}>
            <div className="form-grid">
              <div className="field full">
                <label>Texte</label>
                <input type="text" value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="RENTRÉE EN BEAUTÉ : -10% avec BACKTOGLOW 🎁" required />
              </div>
              <div className="field">
                <label>Code promo affiché (facultatif)</label>
                <input type="text" value={codePromo} onChange={(e) => setCodePromo(e.target.value)} placeholder="BACKTOGLOW" />
              </div>
              <div className="field">
                <label>Fin du compte à rebours (facultatif)</label>
                <input type="datetime-local" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
              </div>
              <div className="field full">
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={actif} onChange={(e) => setActif(e.target.checked)} />
                  Afficher la bannière sur le site
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={savingAnnouncement}>
                {savingAnnouncement ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
