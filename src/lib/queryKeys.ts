// Centralized so every page hitting the same endpoint shares one cache entry
// (and one in-flight request) instead of each page fetching its own copy —
// that's what let AdminLayout's sidebar counts and a page's own list query
// dedupe into a single network request instead of firing twice.
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  orders: ["orders"] as const,
  ordersBoutique: ["orders", "boutique"] as const,
  order: (id: string) => ["order", id] as const,
  products: ["products"] as const,
  product: (id: string) => ["product", id] as const,
  brands: ["brands"] as const,
  brandDetail: (slug: string) => ["brand-detail", slug] as const,
  customers: ["customers"] as const,
  customer: (id: string) => ["customer", id] as const,
  reviews: ["reviews"] as const,
  users: ["users"] as const,
  promoCodes: ["promo-codes"] as const,
  heroSlides: ["hero-slides"] as const,
  announcement: ["announcement"] as const,
  notifications: ["notifications"] as const,
};
