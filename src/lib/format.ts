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

export function brandTagClass(slug: string): string {
  if (slug === "capsule-textile") return "capsule";
  if (slug === "spicysoul") return "spicy";
  if (slug === "rihan-wa-harir") return "rihan";
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
