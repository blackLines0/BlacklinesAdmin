export type BrandTag = "capsule" | "spicy" | "rihan";

export const brandLabels: Record<BrandTag, string> = {
  capsule: "Capsule Textile",
  spicy: "Spicysoul",
  rihan: "Rihan Wa Harir",
};

export interface RecentOrder {
  id: string;
  client: string;
  brand: BrandTag;
  montant: string;
  statut: "Payée" | "En attente" | "Expédiée" | "Livrée" | "Annulée";
}

export const recentOrders: RecentOrder[] = [
  { id: "#BL-1042", client: "Ama Kodjo", brand: "capsule", montant: "22 000 FCFA", statut: "Payée" },
  { id: "#BL-1041", client: "Kossi Mensah", brand: "spicy", montant: "21 000 FCFA", statut: "En attente" },
  { id: "#BL-1040", client: "Fatima Alassane", brand: "rihan", montant: "6 000 FCFA", statut: "Expédiée" },
  { id: "#BL-1039", client: "Yawa Dogbe", brand: "capsule", montant: "28 000 FCFA", statut: "Payée" },
  { id: "#BL-1038", client: "Selom Agbota", brand: "spicy", montant: "7 500 FCFA", statut: "Livrée" },
  { id: "#BL-1037", client: "Nadia Sow", brand: "rihan", montant: "12 000 FCFA", statut: "Annulée" },
];

export interface TopProduct {
  nom: string;
  ventes: number;
  montant: string;
  swatch: string;
}

export const topProducts: TopProduct[] = [
  { nom: "Chemise Kente", ventes: 42, montant: "924 000 FCFA", swatch: "repeating-linear-gradient(90deg,#44199E 0 6px,#BC1301 6px 12px)" },
  { nom: "Ensemble Kalao", ventes: 31, montant: "651 000 FCFA", swatch: "linear-gradient(160deg,#000,#053085)" },
  { nom: "Bakhour Al Haramain", ventes: 58, montant: "348 000 FCFA", swatch: "linear-gradient(165deg,#083D21,#C88A1A)" },
  { nom: "Boubou Adjovi", ventes: 19, montant: "532 000 FCFA", swatch: "repeating-linear-gradient(45deg,#FEA21B 0 6px,#151515 6px 12px)" },
];

export interface AdminProduct {
  nom: string;
  sku: string;
  brand: BrandTag;
  prix: string;
  stock: number;
  ventes: number;
  statut: "En stock" | "Stock faible" | "Épuisé";
  swatch: string;
}

export const adminProducts: AdminProduct[] = [
  { nom: "Chemise Kente", sku: "CT-001", brand: "capsule", prix: "22 000 FCFA", stock: 34, ventes: 42, statut: "En stock", swatch: "repeating-linear-gradient(90deg,#44199E 0 6px,#BC1301 6px 12px)" },
  { nom: "Boubou Adjovi", sku: "CT-002", brand: "capsule", prix: "28 000 FCFA", stock: 6, ventes: 19, statut: "Stock faible", swatch: "repeating-linear-gradient(45deg,#FEA21B 0 6px,#151515 6px 12px)" },
  { nom: "Ensemble Kalao", sku: "SP-004", brand: "spicy", prix: "21 000 FCFA", stock: 28, ventes: 31, statut: "En stock", swatch: "linear-gradient(160deg,#000,#053085)" },
  { nom: "Casquette Soul", sku: "SP-011", brand: "spicy", prix: "7 500 FCFA", stock: 0, ventes: 54, statut: "Épuisé", swatch: "#FFE737" },
  { nom: "Bakhour Al Haramain", sku: "RH-001", brand: "rihan", prix: "6 000 FCFA", stock: 112, ventes: 58, statut: "En stock", swatch: "linear-gradient(165deg,#083D21,#1a5c38)" },
  { nom: "Huile de Nigelle", sku: "RH-005", brand: "rihan", prix: "4 500 FCFA", stock: 47, ventes: 36, statut: "En stock", swatch: "linear-gradient(165deg,#F9E5B2,#e0c583)" },
  { nom: "Écharpe Trame", sku: "CT-006", brand: "capsule", prix: "9 500 FCFA", stock: 21, ventes: 15, statut: "En stock", swatch: "repeating-linear-gradient(0deg,#FEE737 0 6px,#FEA21B 6px 12px)" },
];

export interface AdminOrder {
  id: string;
  client: string;
  date: string;
  brand: BrandTag;
  paiement: "Mobile Money" | "Carte bancaire";
  montant: string;
  statut: "Payée" | "En attente" | "Expédiée" | "Livrée" | "Annulée";
}

export const adminOrders: AdminOrder[] = [
  { id: "#BL-1042", client: "Ama Kodjo", date: "27 août, 14:20", brand: "capsule", paiement: "Mobile Money", montant: "22 000 FCFA", statut: "Payée" },
  { id: "#BL-1041", client: "Kossi Mensah", date: "27 août, 11:05", brand: "spicy", paiement: "Mobile Money", montant: "21 000 FCFA", statut: "En attente" },
  { id: "#BL-1040", client: "Fatima Alassane", date: "26 août, 19:40", brand: "rihan", paiement: "Carte bancaire", montant: "6 000 FCFA", statut: "Expédiée" },
  { id: "#BL-1039", client: "Yawa Dogbe", date: "26 août, 16:12", brand: "capsule", paiement: "Mobile Money", montant: "28 000 FCFA", statut: "Payée" },
  { id: "#BL-1038", client: "Selom Agbota", date: "25 août, 09:50", brand: "spicy", paiement: "Carte bancaire", montant: "7 500 FCFA", statut: "Livrée" },
  { id: "#BL-1037", client: "Nadia Sow", date: "24 août, 20:33", brand: "rihan", paiement: "Mobile Money", montant: "12 000 FCFA", statut: "Annulée" },
];

export interface AdminUser {
  nom: string;
  email: string;
  initiales: string;
  couleur: string;
  role: "Administratrice" | "Gestionnaire" | "Support";
  acces: string;
  derniereConnexion: string;
  statut: "Actif" | "Invité" | "Suspendu";
}

export const adminUsers: AdminUser[] = [
  { nom: "Malaika Nabila", email: "malaika@blacklines.tg", initiales: "MN", couleur: "#2563EB", role: "Administratrice", acces: "Toutes les marques", derniereConnexion: "Aujourd'hui, 09:12", statut: "Actif" },
  { nom: "Sandra Dotou", email: "sandra@blacklines.tg", initiales: "SD", couleur: "#16A34A", role: "Gestionnaire", acces: "Capsule Textile", derniereConnexion: "Hier, 18:45", statut: "Actif" },
  { nom: "Kossi Mawuli", email: "kossi@blacklines.tg", initiales: "KM", couleur: "#053085", role: "Gestionnaire", acces: "Spicysoul", derniereConnexion: "27 août, 08:30", statut: "Actif" },
  { nom: "Fatima Alassane", email: "fatima@blacklines.tg", initiales: "FA", couleur: "#083D21", role: "Gestionnaire", acces: "Rihan Wa Harir", derniereConnexion: "25 août, 14:02", statut: "Actif" },
  { nom: "Yawa Dogbe", email: "yawa@blacklines.tg", initiales: "YD", couleur: "#D97706", role: "Support", acces: "Toutes les marques", derniereConnexion: "20 août, 11:15", statut: "Invité" },
  { nom: "Selom Agbota", email: "selom@blacklines.tg", initiales: "SA", couleur: "#94A3B8", role: "Gestionnaire", acces: "Capsule Textile", derniereConnexion: "12 août, 09:50", statut: "Suspendu" },
];

export function statusBadgeClass(statut: string): string {
  switch (statut) {
    case "Payée":
    case "En stock":
    case "Actif":
      return "success";
    case "En attente":
    case "Stock faible":
    case "Invité":
      return "warning";
    case "Annulée":
    case "Épuisé":
    case "Suspendu":
      return "danger";
    case "Expédiée":
      return "info";
    default:
      return "neutral";
  }
}
