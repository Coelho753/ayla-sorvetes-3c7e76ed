import { Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, LogOut, UserPlus, User as UserIcon, Shield } from "lucide-react";

/**
 * Barra flutuante de autenticação no topo da landing.
 * Não altera o layout — sobreposta com posição fixed.
 */
export function AuthBar() {
  const { user, logout } = useAuth();

  return (
    <nav
      aria-label="Acesso à conta"
      className="pointer-events-none fixed top-3 left-0 right-0 z-50 flex justify-end px-4"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/45 px-2.5 py-2 backdrop-blur-md ring-1 ring-white/40 shadow-xl">
        {user ? (
          <>
            <Link
              to="/admin"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-secondary px-4 py-2 text-sm font-bold text-secondary-foreground shadow-sm hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Shield className="h-4 w-4" aria-hidden="true" /> Admin
            </Link>

            <Link
              to="/perfil"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <UserIcon className="h-4 w-4" aria-hidden="true" />
              {user.name?.split(" ")[0] ?? "Conta"}
            </Link>
            <button
              type="button"
              onClick={logout}
              aria-label="Sair da conta"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <LogIn className="h-4 w-4" aria-hidden="true" /> Entrar
            </Link>
            <Link
              to="/cadastro"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold text-primary shadow-sm hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" /> Cadastrar
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
