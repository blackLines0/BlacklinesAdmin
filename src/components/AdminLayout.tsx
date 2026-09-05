import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { queryKeys } from "../lib/queryKeys";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  gestionnaire: "Gestionnaire",
  support: "Support",
};

type NavRole = "admin" | "gestionnaire" | "support";

function initialsOf(nom: string): string {
  const parts = nom.trim().split(/\s+/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

interface NavItem {
  href: string;
  label: string;
  countKey?: string;
  roles: NavRole[];
  icon: ReactNode;
}

// Daily-use pages, always visible. Avis is primary only for support — it's
// their entire job — and lives in the secondary group for admin instead.
const PRIMARY_NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Tableau de bord",
    roles: ["admin", "gestionnaire"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    href: "/ventes",
    label: "Ventes",
    countKey: "ventes",
    roles: ["admin", "gestionnaire"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="13" rx="2" /><path d="M2 10h20" />
        <path d="M7 15h4" /><circle cx="17" cy="15.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    href: "/commandes",
    label: "Commandes",
    countKey: "commandes",
    roles: ["admin", "gestionnaire", "support"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 4h2l2.4 12.4a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6" />
        <circle cx="9" cy="21" r="1.4" /><circle cx="18" cy="21" r="1.4" />
      </svg>
    ),
  },
  {
    href: "/produits",
    label: "Produits",
    countKey: "produits",
    roles: ["admin", "gestionnaire"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" />
      </svg>
    ),
  },
  {
    href: "/clients",
    label: "Clients",
    countKey: "clients",
    roles: ["admin", "gestionnaire"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
      </svg>
    ),
  },
  {
    href: "/avis",
    label: "Avis",
    countKey: "avis",
    roles: ["support"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 17.3 6.2 20.5l1.1-6.5-4.7-4.6 6.5-.9L12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5z" />
      </svg>
    ),
  },
];

// Set up once, revisited occasionally — tucked behind a disclosure so the
// primary list stays short and the sidebar never outgrows the viewport.
const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    href: "/marques",
    label: "Marques",
    countKey: "marques",
    roles: ["admin", "gestionnaire"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.6 12.3 12.7 4.4a2 2 0 0 0-1.4-.6H5a2 2 0 0 0-2 2v6.3a2 2 0 0 0 .6 1.4l7.9 7.9a2 2 0 0 0 2.8 0l6.3-6.3a2 2 0 0 0 0-2.8Z" />
        <circle cx="8.5" cy="8.5" r="1.5" />
      </svg>
    ),
  },
  {
    href: "/avis",
    label: "Avis",
    countKey: "avis",
    roles: ["admin"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 17.3 6.2 20.5l1.1-6.5-4.7-4.6 6.5-.9L12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5z" />
      </svg>
    ),
  },
  {
    href: "/codes-promo",
    label: "Codes promo",
    roles: ["admin"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2 2 7v10l10 5 10-5V7z" /><path d="M12 22V12" /><path d="M22 7 12 12 2 7" />
      </svg>
    ),
  },
  {
    href: "/vitrine",
    label: "Vitrine",
    roles: ["admin"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 15l5-5 4 4 5-6 4 5" />
      </svg>
    ),
  },
  {
    href: "/utilisateurs",
    label: "Utilisateurs",
    roles: ["admin"],
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" />
        <circle cx="18" cy="8" r="2.7" /><path d="M15.5 14.2c2.7.4 4.5 2.3 4.5 5.8" />
      </svg>
    ),
  },
];

export function AdminLayout({
  title,
  crumb,
  searchPlaceholder,
  children,
}: {
  title: string;
  crumb: string;
  searchPlaceholder?: string;
  children: ReactNode;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const initials = user ? initialsOf(user.nom) : "";
  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : "";
  const role = (user?.role ?? "support") as NavRole;
  const primaryItems = PRIMARY_NAV_ITEMS.filter((item) => item.roles.includes(role));
  const secondaryItems = SECONDARY_NAV_ITEMS.filter((item) => item.roles.includes(role));
  const secondaryHasActive = secondaryItems.some((item) => location.pathname.startsWith(item.href));
  const [secondaryOpen, setSecondaryOpen] = useState(secondaryHasActive);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (secondaryHasActive) setSecondaryOpen(true);
  }, [secondaryHasActive]);

  // Close the mobile drawer on every navigation, and lock background scroll while it's open.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  // Same query keys as the pages themselves (Commandes, Ventes, Clients,
  // Marques, Produits, Avis) — these share one cached fetch instead of each
  // one firing its own request just to compute a badge count.
  const { data: orders } = useQuery({ queryKey: queryKeys.orders, queryFn: () => apiFetch<unknown[]>("/admin/orders") });
  const { data: reviews } = useQuery({ queryKey: queryKeys.reviews, queryFn: () => apiFetch<{ statut: string }[]>("/admin/reviews") });
  const { data: ventesOrders } = useQuery({
    queryKey: queryKeys.ordersBoutique,
    queryFn: () => apiFetch<unknown[]>("/admin/orders?canal=boutique"),
    enabled: role !== "support",
  });
  const { data: customers } = useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => apiFetch<unknown[]>("/admin/customers"),
    enabled: role !== "support",
  });
  const { data: brands } = useQuery({
    queryKey: queryKeys.brands,
    queryFn: () => apiFetch<unknown[]>("/brands"),
    enabled: role !== "support",
  });
  const { data: products } = useQuery({
    queryKey: queryKeys.products,
    queryFn: () => apiFetch<unknown[]>("/admin/products"),
    enabled: role !== "support",
  });

  const counts: Record<string, number> = {
    commandes: orders?.length ?? 0,
    avis: reviews?.filter((r) => r.statut === "en_attente").length ?? 0,
    ventes: ventesOrders?.length ?? 0,
    clients: customers?.length ?? 0,
    marques: brands?.length ?? 0,
    produits: products?.length ?? 0,
  };

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app">
      <div
        className={`sidebar-backdrop${mobileNavOpen ? " open" : ""}`}
        onClick={() => setMobileNavOpen(false)}
        aria-hidden="true"
      />
      <aside className={`sidebar${mobileNavOpen ? " open" : ""}`}>
        <div className="sidebar-brand">
          <img className="logo-mark" src="/logowhite.png" alt="Blacklines" />
          <div><div className="name">Blacklines</div><div className="tag">Espace admin</div></div>
        </div>

        <div className="nav-scroll">
          <div className="nav-group">
            <div className="nav-label">Général</div>
            {primaryItems.map((item) => (
              <Link
                key={item.href}
                className={`nav-item${location.pathname === item.href ? " active" : ""}`}
                to={item.href}
              >
                {item.icon}
                {item.label}
                {item.countKey ? <span className="count">{counts[item.countKey] ?? 0}</span> : null}
              </Link>
            ))}
          </div>

          {secondaryItems.length ? (
            <div className="nav-group">
              <button
                type="button"
                className={`nav-more${secondaryOpen ? " open" : ""}`}
                onClick={() => setSecondaryOpen((v) => !v)}
                aria-expanded={secondaryOpen}
              >
                Plus
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9" /></svg>
              </button>
              {secondaryOpen
                ? secondaryItems.map((item) => (
                    <Link
                      key={item.href}
                      className={`nav-item${location.pathname === item.href ? " active" : ""}`}
                      to={item.href}
                    >
                      {item.icon}
                      {item.label}
                      {item.countKey ? <span className="count">{counts[item.countKey] ?? 0}</span> : null}
                    </Link>
                  ))
                : null}
            </div>
          ) : null}

          <div className="nav-group">
            <div className="nav-label">Boutique</div>
            <a className="nav-item" href="http://localhost:3000" target="_blank" rel="noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" />
              </svg>
              Voir la boutique
            </a>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="admin-profile">
            <div className="admin-avatar">{initials}</div>
            <div className="info"><div className="who">{user?.nom}</div><div className="role">{roleLabel}</div></div>
            <button className="icon-action" aria-label="Déconnexion" onClick={handleLogout} style={{ marginLeft: "auto", color: "var(--sidebar-soft)" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
            </button>
          </div>
        </div>
      </aside>

      <main>
        <div className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="menu-toggle"
              aria-label="Ouvrir le menu"
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
            <div>
              <div className="page-title">{title}</div>
              <div className="page-crumb">{crumb}</div>
            </div>
          </div>
          <div className="topbar-right">
            <div className="search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
              <input type="text" placeholder={searchPlaceholder ?? "Rechercher..."} />
            </div>
            <button className="icon-btn" aria-label="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
              <span className="notif-dot" />
            </button>
            <div className="admin-avatar" style={{ width: 34, height: 34 }}>{initials}</div>
          </div>
        </div>

        <div className="content">{children}</div>
      </main>
    </div>
  );
}
