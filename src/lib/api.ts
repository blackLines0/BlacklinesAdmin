const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";
const SESSION_KEY = "blacklines_admin_session";

export interface SessionUser {
  id: string;
  email: string;
  nom: string;
  role: "admin" | "gestionnaire" | "support";
  accesMarques: string[];
}

interface Session {
  token: string;
  user: SessionUser;
}

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const session = getSession();
  const headers = new Headers(init?.headers);

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `API error ${res.status}: ${path}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function login(email: string, password: string): Promise<Session> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json();

  if (!res.ok) {
    throw new Error(body?.error ?? "Échec de la connexion");
  }

  return body as Session;
}

const COMPRESS_ABOVE_BYTES = 1.5 * 1024 * 1024; // don't bother re-encoding already-reasonable files
const TARGET_MAX_BYTES = 3 * 1024 * 1024; // aim for 1-3MB, well under Cloudinary's 10MB cap
const MAX_DIMENSION = 2400; // matches the server-side Cloudinary master cap — no point sending more

// Downscales + re-encodes an oversized image client-side (canvas -> JPEG)
// before it ever leaves the browser. A 10-12MB phone photo typically lands
// in the 1-3MB range with no visible quality loss. Falls back to the
// original file if compression isn't possible (animated GIF, decode
// failure, etc.) rather than blocking the upload.
async function compressImage(file: File): Promise<File> {
  if (file.size <= COMPRESS_ABOVE_BYTES || file.type === "image/gif") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let quality = 0.88;
    let blob: Blob | null = null;
    for (let attempt = 0; attempt < 6; attempt++) {
      blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob || blob.size <= TARGET_MAX_BYTES || quality <= 0.4) break;
      quality -= 0.12;
    }

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  const compressed = await compressImage(file);

  const form = new FormData();
  form.append("file", compressed);

  return apiFetch<{ url: string }>("/admin/uploads", {
    method: "POST",
    body: form,
  });
}

export async function downloadInvoice(orderId: string): Promise<void> {
  const session = getSession();
  const res = await fetch(`${API_URL}/admin/orders/${orderId}/invoice`, {
    headers: session?.token ? { Authorization: `Bearer ${session.token}` } : undefined,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Échec du téléchargement de la facture (${res.status})`);
  }

  const blob = await res.blob();
  const filename = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? `facture-${orderId}.pdf`;
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function sendInvoiceEmail(orderId: string): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/admin/orders/${orderId}/invoice/send`, { method: "POST" });
}
