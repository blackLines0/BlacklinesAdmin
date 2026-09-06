import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import type { UserRole } from "../lib/format";
import { queryKeys } from "../lib/queryKeys";

// Mirrors App.tsx's ProtectedRoute role gating for the routes notification
// links can point at, so a click never silently redirects the user away from
// a page their role can't see. Prefixes are matched against item.link with
// any query string stripped. Routes reachable by every role (e.g.
// /commandes/:id) don't need an entry — they're allowed by default.
const LINK_ROLE_ACCESS: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/clients", roles: ["admin", "gestionnaire"] },
  { prefix: "/produits", roles: ["admin", "gestionnaire"] },
  { prefix: "/ventes", roles: ["admin", "gestionnaire"] },
  { prefix: "/codes-promo", roles: ["admin"] },
  { prefix: "/avis", roles: ["admin", "support"] },
];

function canAccessLink(link: string, role: UserRole): boolean {
  const path = link.split("?")[0];
  const rule = LINK_ROLE_ACCESS.find((r) => path.startsWith(r.prefix));
  return !rule || rule.roles.includes(role);
}

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  link: string | null;
  createdAt: string;
  read: boolean;
}

interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
}

interface Rect {
  top: number;
  right: number;
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => apiFetch<NotificationsResponse>("/admin/notifications"),
    refetchInterval: 30_000,
  });

  const items = data?.items ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markRead = useMutation({
    mutationFn: (id: string) => apiFetch(`/admin/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiFetch("/admin/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    function handleScrollOrResize() {
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [open]);

  function toggleOpen() {
    if (open) {
      setOpen(false);
      return;
    }
    const el = triggerRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setOpen(true);
  }

  function handleItemClick(item: NotificationItem) {
    if (!item.read) markRead.mutate(item.id);
    setOpen(false);
    // The user already saw the message in the dropdown, so it's still marked
    // read even when we skip navigation below — only the redirect is guarded.
    if (item.link && user && canAccessLink(item.link, user.role)) {
      navigate(item.link);
    }
  }

  return (
    <>
      <button className="icon-btn" aria-label="Notifications" ref={triggerRef} onClick={toggleOpen}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {unreadCount > 0 ? <span className="notif-count">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
      </button>

      {open && rect
        ? createPortal(
            <div className="notif-panel" ref={panelRef} style={{ position: "fixed", top: rect.top, right: rect.right }}>
              <div className="notif-panel-head">
                <span>
                  Notifications
                  {unreadCount > 0 ? <span className="notif-panel-head-count"> ({unreadCount})</span> : null}
                </span>
                {unreadCount > 0 ? (
                  <button type="button" onClick={() => markAllRead.mutate()}>
                    Tout marquer comme lu
                  </button>
                ) : null}
              </div>
              <div className="notif-panel-list">
                {items.length === 0 ? (
                  <div className="notif-empty">Aucune notification</div>
                ) : (
                  items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`notif-item${item.read ? "" : " unread"}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <span className="notif-item-dot" />
                      <span className="notif-item-body">
                        <span className="notif-item-message">{item.message}</span>
                        <span className="notif-item-date">{formatRelative(item.createdAt)}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
