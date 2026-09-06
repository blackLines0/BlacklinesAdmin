import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminLayout } from "../components/AdminLayout";
import { Select } from "../components/Select";
import { useConfirm } from "../components/ConfirmModal";
import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { formatDate } from "../lib/format";

const TYPE_OPTIONS = [
  { value: "pourcentage", label: "Pourcentage (%)" },
  { value: "montantFixe", label: "Montant fixe (FCFA)" },
];

interface PromoCode {
  id: string;
  code: string;
  pourcentage: number | null;
  montantFixe: number | null;
  dateDebut: string | null;
  dateFin: string | null;
  usageMax: number | null;
  usageCount: number;
  premierAchatSeulement: boolean;
  actif: boolean;
  createdAt: string;
}

export default function CodesPromo() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { data: codes = [], isLoading: loading, error } = useQuery({
    queryKey: queryKeys.promoCodes,
    queryFn: () => apiFetch<PromoCode[]>("/admin/promo-codes"),
  });

  const [code, setCode] = useState("");
  const [type, setType] = useState<"pourcentage" | "montantFixe">("pourcentage");
  const [valeur, setValeur] = useState("");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [usageMax, setUsageMax] = useState("");
  const [premierAchatSeulement, setPremierAchatSeulement] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const createCode = useMutation({
    mutationFn: () =>
      apiFetch("/admin/promo-codes", {
        method: "POST",
        body: JSON.stringify({
          code,
          [type]: Number(valeur),
          dateDebut: dateDebut || undefined,
          dateFin: dateFin || undefined,
          usageMax: usageMax ? Number(usageMax) : undefined,
          premierAchatSeulement,
        }),
      }),
    onSuccess: () => {
      setCode("");
      setValeur("");
      setDateDebut("");
      setDateFin("");
      setUsageMax("");
      setPremierAchatSeulement(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.promoCodes });
    },
    onError: (err) => setCreateError(err instanceof Error ? err.message : "Échec de la création"),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    createCode.mutate();
  }

  const toggleActif = useMutation({
    mutationFn: (c: PromoCode) => apiFetch(`/admin/promo-codes/${c.id}`, { method: "PATCH", body: JSON.stringify({ actif: !c.actif }) }),
    onMutate: async (c) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.promoCodes });
      const previous = queryClient.getQueryData<PromoCode[]>(queryKeys.promoCodes);
      queryClient.setQueryData<PromoCode[]>(queryKeys.promoCodes, (prev) =>
        prev?.map((x) => (x.id === c.id ? { ...x, actif: !x.actif } : x)),
      );
      return { previous };
    },
    onError: (err, _c, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.promoCodes, context.previous);
      alert(err instanceof Error ? err.message : "Échec de la mise à jour");
    },
  });

  const removeCode = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/promo-codes/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<PromoCode[]>(queryKeys.promoCodes, (prev) => prev?.filter((c) => c.id !== id));
    },
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la suppression"),
  });

  async function remove(id: string) {
    const confirmed = await confirm("Supprimer ce code promo ?", { confirmLabel: "Supprimer", danger: true });
    if (!confirmed) return;
    removeCode.mutate(id);
  }

  return (
    <AdminLayout title="Codes promo" crumb={`${codes.length} codes créés`}>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div><h3>Nouveau code promo</h3><div className="sub">Limité dans le temps, en nombre d&apos;utilisations, ou au premier achat</div></div>
        </div>
        <div className="panel-body">
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <div className="field">
                <label>Code</label>
                <input type="text" placeholder="BACKTOGLOW" value={code} onChange={(e) => setCode(e.target.value)} required />
              </div>
              <div className="field">
                <label>Type de réduction</label>
                <Select value={type} onChange={(v) => setType(v as "pourcentage" | "montantFixe")} options={TYPE_OPTIONS} />
              </div>
              <div className="field">
                <label>Valeur</label>
                <input type="number" placeholder={type === "pourcentage" ? "10" : "1000"} value={valeur} onChange={(e) => setValeur(e.target.value)} required />
              </div>
              <div className="field">
                <label>Utilisations max (facultatif)</label>
                <input type="number" placeholder="Illimité" value={usageMax} onChange={(e) => setUsageMax(e.target.value)} />
              </div>
              <div className="field">
                <label>Début (facultatif)</label>
                <input type="datetime-local" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
              </div>
              <div className="field">
                <label>Fin (facultatif)</label>
                <input type="datetime-local" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
              </div>
              <div className="field full">
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={premierAchatSeulement} onChange={(e) => setPremierAchatSeulement(e.target.checked)} />
                  Réservé au premier achat
                </label>
              </div>
            </div>

            {createError ? <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{createError}</p> : null}

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={createCode.isPending}>
                {createCode.isPending ? "Création..." : "Créer le code"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="panel">
        {loading ? (
          <div className="panel-body"><p className="cell-muted">Chargement...</p></div>
        ) : error ? (
          <div className="panel-body"><p style={{ color: "var(--danger)" }}>{error instanceof Error ? error.message : "Erreur de chargement"}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Réduction</th>
                  <th>Fenêtre</th>
                  <th>Utilisation</th>
                  <th>Premier achat</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id}>
                    <td className="cell-primary">{c.code}</td>
                    <td>{c.pourcentage ? `${c.pourcentage}%` : `${c.montantFixe} FCFA`}</td>
                    <td className="cell-muted">
                      {c.dateDebut || c.dateFin
                        ? `${c.dateDebut ? formatDate(c.dateDebut) : "…"} → ${c.dateFin ? formatDate(c.dateFin) : "…"}`
                        : "Illimitée"}
                    </td>
                    <td className="cell-muted">{c.usageCount}{c.usageMax ? ` / ${c.usageMax}` : ""}</td>
                    <td className="cell-muted">{c.premierAchatSeulement ? "Oui" : "—"}</td>
                    <td>
                      <button className={`badge ${c.actif ? "success" : "neutral"}`} onClick={() => toggleActif.mutate(c)} style={{ cursor: "pointer", border: "none" }}>
                        {c.actif ? "Actif" : "Inactif"}
                      </button>
                    </td>
                    <td>
                      <button className="icon-action" aria-label="Supprimer" onClick={() => remove(c.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {codes.length === 0 ? (
                  <tr><td colSpan={7} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucun code promo</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
