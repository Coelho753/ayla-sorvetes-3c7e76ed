import { API_URL } from "@/config/api";

/**
 * Inicia o fluxo OAuth no backend.
 * Backend deve expor: GET /auth/google → redirect para Google
 * e callback /auth/google/callback que redireciona de volta com ?token=...&refresh=...
 */
export function GoogleButton({ label = "Continuar com Google" }: { label?: string }) {
  function start() {
    const redirect = `${window.location.origin}/auth/callback`;
    window.location.href = `${API_URL}/auth/google?redirect=${encodeURIComponent(redirect)}`;
  }
  return (
    <button
      type="button"
      onClick={start}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-input bg-background py-3 font-semibold text-foreground hover:bg-muted"
    >
      <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44c11 0 20-9 20-20 0-1.2-.1-2.3-.4-3.5z" />
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.2A12 12 0 0 1 12.7 28l-6.5 5A20 20 0 0 0 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4 5.6l6.3 5.2C41.4 35 44 30 44 24c0-1.2-.1-2.3-.4-3.5z" />
      </svg>
      {label}
    </button>
  );
}
