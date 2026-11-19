export type ProductStatus = "en_stock" | "stock_faible" | "epuise";
export type OrderStatus = "en_attente" | "payee" | "expediee" | "livree" | "annulee";
export type UserStatus = "actif" | "invite" | "suspendu";
export type UserRole = "admin" | "gestionnaire" | "support";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  en_stock: "En stock",
  stock_faible: "Stock faible",
  epuise: "Épuisé",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  en_attente: "En attente",
  payee: "Payée",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  actif: "Actif",
  invite: "Invité",
  suspendu: "Suspendu",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  gestionnaire: "Gestionnaire",
  support: "Support",
};

export function homeRouteForRole(role: UserRole): string {
  return role === "support" ? "/avis" : "/dashboard";
}

export function brandTagClass(slug: string): string {
  if (slug === "capsule-textile") return "capsule";
  if (slug === "spicysoul") return "spicy";
  if (slug === "rihan-wa-harir") return "rihan";
  if (slug === "artmoir") return "artmoir";
  if (slug === "spicy-kids") return "spicy-kids";
  return "";
}

export function statusBadgeClass(statut: string): string {
  switch (statut) {
    case "en_stock":
    case "payee":
    case "actif":
      return "success";
    case "stock_faible":
    case "en_attente":
    case "invite":
      return "warning";
    case "epuise":
    case "annulee":
    case "suspendu":
      return "danger";
    case "expediee":
      return "info";
    default:
      return "neutral";
  }
}

export function formatPrice(prix: number): string {
  return `${prix.toLocaleString("fr-FR")} FCFA`;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function initialsOf(nom: string): string {
  const parts = nom.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

const AVATAR_COLORS = ["#2563EB", "#16A34A", "#053085", "#083D21", "#D97706", "#94A3B8", "#7C3AED", "#DB2777"];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

export type PaymentStatus = "en_attente" | "reussi" | "echoue" | "expire" | "annule";

// One mobile money prompt sent through PayGate (see Backend Payment model).
export interface PaymentAttempt {
  id: string;
  statut: PaymentStatus;
  montant: number;
  frais: number;
  telephone: string;
  reseau: "flooz" | "tmoney";
  nomPayeur: string;
  referencePaygate: string | null;
  referenceOperateur: string | null;
  anomalie: string | null;
  payeLe: string | null;
  createdAt: string;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  en_attente: "En attente",
  reussi: "Payé",
  echoue: "Échoué",
  expire: "Expiré",
  annule: "Annulé",
};

export const NETWORK_LABELS: Record<PaymentAttempt["reseau"], string> = {
  flooz: "Flooz",
  tmoney: "T-Money",
};

export const PAYMENT_ANOMALY_LABELS: Record<string, string> = {
  montant_incorrect: "Montant différent du total, à rembourser",
  double_paiement: "Commande déjà payée, à rembourser",
  commande_annulee: "Commande annulée, à rembourser",
  non_confirme: "Jamais confirmé par PayGate, à vérifier sur son tableau de bord",
};

export function paymentBadgeClass(statut: PaymentStatus): string {
  switch (statut) {
    case "reussi":
      return "success";
    case "en_attente":
      return "warning";
    case "echoue":
    case "annule":
      return "danger";
    default:
      return "neutral";
  }
}

// What the orders list flags: money PayGate took that the order could not
// take (to refund), or an attempt PayGate never answered for (to check).
export function paymentFlag(payments: Pick<PaymentAttempt, "statut" | "anomalie">[] = []): { label: string; tone: string } | null {
  if (payments.some((p) => p.statut === "reussi" && p.anomalie)) return { label: "À rembourser", tone: "danger" };
  if (payments.some((p) => p.anomalie === "non_confirme")) return { label: "À vérifier", tone: "warning" };
  return null;
}

// The question asked before an order's status changes, from the list or the detail page.
export function statusChangeQuestion(orderId: string, from: OrderStatus, to: OrderStatus): string {
  return `Passer la commande #${orderId.slice(-6).toUpperCase()} de « ${ORDER_STATUS_LABELS[from]} » à « ${ORDER_STATUS_LABELS[to]} » ?`;
}
