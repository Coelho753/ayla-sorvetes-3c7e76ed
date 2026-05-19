/**
 * Aceita apenas URLs https:// (ou data:image/) e bloqueia javascript:, file:,
 * blob: e quaisquer outros esquemas potencialmente perigosos.
 * Use sempre antes de renderizar URLs vindas do backend em <img> / <a>.
 */
export function safeImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (trimmed.startsWith("/")) return trimmed; // assets locais
  try {
    const u = new URL(trimmed);
    if (u.protocol === "https:") return u.toString();
  } catch {
    /* fall-through */
  }
  return "";
}

export function safeHttpsUrl(url: string | undefined | null): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.protocol === "https:") return u.toString();
  } catch { /* ignore */ }
  return "";
}