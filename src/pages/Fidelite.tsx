import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../components/AdminLayout";
import { Combobox } from "../components/Combobox";
import { Select } from "../components/Select";
import { useConfirm } from "../components/ConfirmModal";
import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";
import { formatDate, formatPrice } from "../lib/format";

type LoyaltyType = "nombre_commandes" | "montant_depense";
type RewardType = "bon_achat" | "produit";

interface Program {
  id: string;
  nom: string;
  type: LoyaltyType;
  objectif: number;
  recompense: RewardType;
  montantBon: number | null;
  productId: string | null;
  product: { id: string; nom: string } | null;
  actif: boolean;
  dateDebut: string | null;
  _count: { rewards: number };
}

interface Reward {
  id: string;
  cycle: number;
  remisLe: string | null;
  createdAt: string;
  customer: { id: string; nom: string; email: string | null; telephone: string | null };
  program: { nom: string; recompense: RewardType; montantBon: number | null; product: { nom: string } | null };
  promoCode: { code: string; usageCount: number; usageMax: number | null } | null;
}

interface ProductOption {
  id: string;
  nom: string;
  brand: { nom: string };
}

const TYPE_OPTIONS = [
  { value: "nombre_commandes", label: "Nombre de commandes" },
  { value: "montant_depense", label: "Montant dépensé" },
];

const REWARD_OPTIONS = [
  { value: "bon_achat", label: "Bon d'achat" },
  { value: "produit", label: "Produit offert" },
];

function ruleLabel(p: Pick<Program, "type" | "objectif">): string {
  return p.type === "nombre_commandes" ? `${p.objectif} commandes` : `${formatPrice(p.objectif)} dépensés`;
}

function rewardLabel(p: Pick<Program, "recompense" | "montantBon" | "product">): string {
  return p.recompense === "bon_achat" ? `Bon d'achat de ${formatPrice(p.montantBon ?? 0)}` : p.product?.nom ?? "Produit";
}

const EMPTY_FORM = {
  nom: "",
  type: "nombre_commandes" as LoyaltyType,
  objectif: "",
  recompense: "bon_achat" as RewardType,
  montantBon: "",
  productId: "",
  actif: false,
};

export default function Fidelite() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data: programs = [], isLoading, error } = useQuery({
    queryKey: queryKeys.loyaltyPrograms,
    queryFn: () => apiFetch<Program[]>("/admin/loyalty-programs"),
  });
  const { data: rewards = [] } = useQuery({
    queryKey: queryKeys.loyaltyRewards,
    queryFn: () => apiFetch<Reward[]>("/admin/loyalty-rewards"),
  });
  const { data: products = [] } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => apiFetch<ProductOption[]>("/admin/products"),
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const editing = programs.find((p) => p.id === editingId) ?? null;

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyPrograms });
    queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyRewards });
  }

  const saveProgram = useMutation({
    mutationFn: () => {
      const body = {
        nom: form.nom,
        type: form.type,
        objectif: Number(form.objectif),
        recompense: form.recompense,
        montantBon: form.recompense === "bon_achat" ? Number(form.montantBon) : null,
        productId: form.recompense === "produit" ? form.productId || null : null,
        ...(editingId ? {} : { actif: form.actif }),
      };
      return editingId
        ? apiFetch(`/admin/loyalty-programs/${editingId}`, { method: "PATCH", body: JSON.stringify(body) })
        : apiFetch("/admin/loyalty-programs", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      setForm(EMPTY_FORM);
      setEditingId(null);
      invalidate();
    },
    onError: (err) => setFormError(err instanceof Error ? err.message : "Échec de l'enregistrement"),
  });

  const toggleProgram = useMutation({
    mutationFn: (p: Program) =>
      apiFetch(`/admin/loyalty-programs/${p.id}`, { method: "PATCH", body: JSON.stringify({ actif: !p.actif }) }),
    onSuccess: invalidate,
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la mise à jour"),
  });

  const removeProgram = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/loyalty-programs/${id}`, { method: "DELETE" }),
    onSuccess: invalidate,
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la suppression"),
  });

  const markHandedOver = useMutation({
    mutationFn: (r: Reward) =>
      apiFetch(`/admin/loyalty-rewards/${r.id}`, { method: "PATCH", body: JSON.stringify({ remis: !r.remisLe }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.loyaltyRewards }),
    onError: (err) => alert(err instanceof Error ? err.message : "Échec de la mise à jour"),
  });

  function startEdit(p: Program) {
    setEditingId(p.id);
    setFormError(null);
    setForm({
      nom: p.nom,
      type: p.type,
      objectif: String(p.objectif),
      recompense: p.recompense,
      montantBon: p.montantBon ? String(p.montantBon) : "",
      productId: p.productId ?? "",
      actif: p.actif,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    saveProgram.mutate();
  }

  async function toggle(p: Program) {
    const other = programs.find((x) => x.actif && x.id !== p.id);
    const message = p.actif
      ? `Mettre en pause « ${p.nom} » ? Les clients ne verront plus leur carte, mais leur progression est conservée.`
      : `Activer « ${p.nom} » ?${other ? ` « ${other.nom} » sera mis en pause : un seul programme est actif à la fois.` : ""}${
          p.dateDebut ? "" : " Seules les commandes passées à partir de maintenant comptent."
        }`;
    const confirmed = await confirm(message, { confirmLabel: p.actif ? "Mettre en pause" : "Activer" });
    if (confirmed) toggleProgram.mutate(p);
  }

  async function remove(p: Program) {
    const confirmed = await confirm(`Supprimer le programme « ${p.nom} » ?`, { confirmLabel: "Supprimer", danger: true });
    if (confirmed) removeProgram.mutate(p.id);
  }

  async function handOver(r: Reward) {
    const message = r.remisLe
      ? `Annuler la remise du cadeau à ${r.customer.nom} ?`
      : `Confirmer que ${r.customer.nom} a reçu « ${r.program.product?.nom ?? "son cadeau"} » ?`;
    const confirmed = await confirm(message, { confirmLabel: "Confirmer" });
    if (confirmed) markHandedOver.mutate(r);
  }

  const active = programs.find((p) => p.actif);

  return (
    <AdminLayout title="Fidélité" crumb={active ? `Programme actif : ${active.nom}` : "Aucun programme actif"}>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <div>
            <h3>{editing ? `Modifier « ${editing.nom} »` : "Nouveau programme de fidélité"}</h3>
            <div className="sub">
              Un objectif en nombre de commandes ou en montant dépensé, et un cadeau à la clé. Seules les commandes payées,
              expédiées ou livrées comptent ; le client suit sa carte depuis son compte et reçoit un email à chaque commande.
            </div>
          </div>
        </div>
        <div className="panel-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field full">
                <label>Nom du programme</label>
                <input type="text" placeholder="Carte Blacklines" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} maxLength={80} required />
              </div>
              <div className="field">
                <label>Objectif basé sur</label>
                <Select
                  value={form.type}
                  onChange={(v) => setForm({ ...form, type: v as LoyaltyType })}
                  options={TYPE_OPTIONS}
                />
                {editing?.dateDebut ? <span className="cell-muted" style={{ fontSize: 12 }}>Ne change plus une fois le programme lancé.</span> : null}
              </div>
              <div className="field">
                <label>{form.type === "nombre_commandes" ? "Nombre de commandes à atteindre" : "Montant à dépenser (FCFA)"}</label>
                <input
                  type="number"
                  min={1}
                  placeholder={form.type === "nombre_commandes" ? "10" : "100000"}
                  value={form.objectif}
                  onChange={(e) => setForm({ ...form, objectif: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label>Récompense</label>
                <Select value={form.recompense} onChange={(v) => setForm({ ...form, recompense: v as RewardType })} options={REWARD_OPTIONS} />
              </div>
              {form.recompense === "bon_achat" ? (
                <div className="field">
                  <label>Montant du bon d&apos;achat (FCFA)</label>
                  <input type="number" min={1} placeholder="5000" value={form.montantBon} onChange={(e) => setForm({ ...form, montantBon: e.target.value })} required />
                </div>
              ) : (
                <div className="field">
                  <label>Produit offert</label>
                  <Combobox
                    value={form.productId}
                    onChange={(value) => setForm({ ...form, productId: value })}
                    placeholder="Rechercher un produit..."
                    options={products.map((p) => ({ value: p.id, label: p.nom, keywords: p.brand.nom }))}
                  />
                </div>
              )}
              {!editingId ? (
                <div className="field full">
                  <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
                    Activer tout de suite{active ? ` (met « ${active.nom} » en pause)` : ""}
                  </label>
                </div>
              ) : null}
            </div>

            {formError ? <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>{formError}</p> : null}

            <div className="form-actions">
              <button className="btn btn-primary" type="submit" disabled={saveProgram.isPending}>
                {saveProgram.isPending ? "Enregistrement..." : editingId ? "Enregistrer" : "Créer le programme"}
              </button>
              {editingId ? (
                <button className="btn btn-outline" type="button" onClick={cancelEdit}>Annuler</button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head"><div><h3>Programmes</h3><div className="sub">Un seul actif à la fois</div></div></div>
        {isLoading ? (
          <div className="panel-body"><p className="cell-muted">Chargement...</p></div>
        ) : error ? (
          <div className="panel-body"><p style={{ color: "var(--danger)" }}>{error instanceof Error ? error.message : "Erreur de chargement"}</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Programme</th>
                  <th>Objectif</th>
                  <th>Récompense</th>
                  <th>Gagnées</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {programs.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-primary">{p.nom}</div>
                      {p.dateDebut ? <div className="cell-muted" style={{ fontSize: 12 }}>Lancé le {formatDate(p.dateDebut)}</div> : null}
                    </td>
                    <td>{ruleLabel(p)}</td>
                    <td>{rewardLabel(p)}</td>
                    <td className="cell-muted">{p._count.rewards}</td>
                    <td>
                      <button className={`badge ${p.actif ? "success" : "neutral"}`} onClick={() => toggle(p)} style={{ cursor: "pointer", border: "none" }}>
                        {p.actif ? "Actif" : p.dateDebut ? "En pause" : "Brouillon"}
                      </button>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="icon-action" aria-label="Modifier" onClick={() => startEdit(p)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                      </button>
                      {p._count.rewards === 0 ? (
                        <button className="icon-action" aria-label="Supprimer" onClick={() => remove(p)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
                {programs.length === 0 ? (
                  <tr><td colSpan={6} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucun programme pour le moment</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel-head">
          <div><h3>Récompenses gagnées</h3><div className="sub">Les bons d&apos;achat sont envoyés au client par email ; les produits sont à lui remettre</div></div>
        </div>
        <div className="table-wrap">
          <table className="table-nowrap">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Programme</th>
                <th>Récompense</th>
                <th>Suivi</th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r) => (
                <tr key={r.id}>
                  <td className="cell-muted">{formatDate(r.createdAt)}</td>
                  <td>
                    <Link className="cell-primary" to={`/clients/${r.customer.id}`}>{r.customer.nom}</Link>
                    <div className="cell-muted" style={{ fontSize: 12 }}>{r.customer.telephone ?? r.customer.email ?? ""}</div>
                  </td>
                  <td>{r.program.nom}{r.cycle > 1 ? <span className="cell-muted"> · carte {r.cycle}</span> : null}</td>
                  <td>
                    {r.promoCode ? (
                      <>
                        <div className="cell-primary">Bon de {formatPrice(r.program.montantBon ?? 0)}</div>
                        <div className="cell-muted" style={{ fontSize: 12 }}>Code {r.promoCode.code}</div>
                      </>
                    ) : (
                      <div className="cell-primary">{r.program.product?.nom ?? "Produit offert"}</div>
                    )}
                  </td>
                  <td>
                    {r.promoCode ? (
                      <span className={`badge ${r.promoCode.usageCount >= (r.promoCode.usageMax ?? 1) ? "success" : "neutral"}`}>
                        {r.promoCode.usageCount >= (r.promoCode.usageMax ?? 1) ? "Utilisé" : "Pas encore utilisé"}
                      </span>
                    ) : (
                      <button className={`badge ${r.remisLe ? "success" : "warning"}`} onClick={() => handOver(r)} style={{ cursor: "pointer", border: "none" }}>
                        {r.remisLe ? `Remis le ${formatDate(r.remisLe)}` : "À remettre"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rewards.length === 0 ? (
                <tr><td colSpan={5} className="cell-muted" style={{ textAlign: "center", padding: 30 }}>Aucune récompense gagnée pour le moment</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
