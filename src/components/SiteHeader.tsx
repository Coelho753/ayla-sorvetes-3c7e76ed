import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User as UserIcon, Shield } from "lucide-react";

export function SiteHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  // Não renderiza header na landing para preservar 100% do design
  if (location.pathname === "/") return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="font-display text-lg font-bold tracking-tight">
          🍦 Ayla Sorvetes
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/cardapio" className="rounded-md px-3 py-2 hover:bg-muted" activeProps={{ className: "rounded-md px-3 py-2 bg-muted font-semibold" }}>Cardápio</Link>
          {user ? (
            <>
              <Link to="/perfil" className="hidden sm:inline-flex items-center gap-1 rounded-md px-3 py-2 hover:bg-muted">
                <UserIcon className="h-4 w-4" /> {user.name?.split(" ")[0] ?? "Conta"}
              </Link>
              <Link to="/admin" className="inline-flex items-center gap-1 rounded-md bg-secondary/15 px-3 py-2 font-semibold text-secondary hover:bg-secondary/25">
                <Shield className="h-4 w-4" /> Admin
              </Link>

              <button onClick={logout} className="rounded-md p-2 hover:bg-muted" aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-md px-3 py-2 hover:bg-muted">Entrar</Link>
              <Link to="/cadastro" className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground hover:opacity-90">Cadastrar</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
