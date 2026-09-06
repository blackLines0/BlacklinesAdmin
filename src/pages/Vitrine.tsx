import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { useConfirm } from "../components/ConfirmModal";
import { apiFetch, uploadImage } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

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
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data: slides = [], isLoading: loadingSlides } = useQuery({
    queryKey: queryKeys.heroSlides,
    queryFn: () => apiFetch<HeroSlide[]>("/admin/hero-slides"),
  });
  const { data: announcement } = useQuery({
    queryKey: queryKeys.announcement,
    queryFn: () => apiFetch<Announcement | null>("/admin/announcement"),
  });

  const [uploading, setUploading] = useState(false);

  const [titre, setTitre] = useState("");
  const [sousTitre, setSousTitre] = useState("");
  const [lien, setLien] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [texte, setTexte] = useState("");
  const [codePromo, setCodePromo] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [actif, setActif] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    setTexte(announcement.texte);
    setCodePromo(announcement.codePromo ?? "");
    setDateFin(announcement.dateFin ? announcement.dateFin.slice(0, 16) : "");
    setActif(announcement.actif);
  }, [announcement]);

  const addSlide = useMutation({
    mutationFn: (image: string) =>
      apiFetch("/admin/hero-slides", {
        method: "POST",
        body: JSON.stringify({ image, titre: titre || undefined, sousTitre: sousTitre || undefined, lien: lien || undefined, ordre: slides.length }),
      }),
    onSuccess: () => {
      setTitre("");
      setSousTitre("");
      setLien("");
      queryClient.invalidateQueries({ queryKey: queryKeys.heroSlides });
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de l'ajout"),
  });

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      await addSlide.mutateAsync(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Échec de l'ajout");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  const toggleActif = useMutation({
    mutationFn: (slide: HeroSlide) =>
      apiFetch(`/admin/hero-slides/${slide.id}`, { method: "PATCH", body: JSON.stringify({ actif: !slide.actif }) }),
    onMutate: async (slide) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.heroSlides });
      const previous = queryClient.getQueryData<HeroSlide[]>(queryKeys.heroSlides);
      queryClient.setQueryData<HeroSlide[]>(queryKeys.heroSlides, (prev) =>
        prev?.map((s) => (s.id === slide.id ? { ...s, actif: !s.actif } : s)),
      );
      return { previous };
    },
    onError: (err, _slide, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.heroSlides, context.previous);
      alert(err instanceof Error ? err.message : "Échec de la mise à jour");
    },
  });

  const removeSlide = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/hero-slides/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<HeroSlide[]>(queryKeys.heroSlides, (prev) => prev?.filter((s) => s.id !== id));
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la suppression"),
  });

  async function handleRemoveSlide(id: string) {
    const confirmed = await confirm("Supprimer cette image du hero ?", { confirmLabel: "Supprimer", danger: true });
    if (!confirmed) return;
    removeSlide.mutate(id);
  }

  const saveAnnouncement = useMutation({
    mutationFn: () =>
      apiFetch<Announcement>("/admin/announcement", {
        method: "PUT",
        body: JSON.stringify({
          texte,
          codePromo: codePromo || undefined,
          dateFin: dateFin || undefined,
          actif,
        }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.announcement }),
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de l'enregistrement"),
  });

  function handleSaveAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    saveAnnouncement.mutate();
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
                    <button className={`badge ${s.actif ? "success" : "neutral"}`} onClick={() => toggleActif.mutate(s)} style={{ cursor: "pointer", border: "none" }}>
                      {s.actif ? "Actif" : "Inactif"}
                    </button>
                    <button className="icon-action" aria-label="Supprimer" onClick={() => handleRemoveSlide(s.id)}>
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
          <form onSubmit={handleSaveAnnouncement}>
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
              <button className="btn btn-primary" type="submit" disabled={saveAnnouncement.isPending}>
                {saveAnnouncement.isPending ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}
