import { Link } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, LogOut, UserPlus, User as UserIcon } from "lucide-react";

/**
 * Barra flutuante de autenticação no topo da landing.
 * Não altera o layout — sobreposta com posição fixed.
 */
export function AuthBar() {
  const { user, logout } = useAuth();

  return (
    <div className="pointer-events-none fixed top-3 left-0 right-0 z-50 flex justify-end px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-white/15 px-2 py-1.5 backdrop-blur-md ring-1 ring-white/30 shadow-lg">
        {user ? (
          <>
            <Link
              to="/perfil"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            >
              <UserIcon className="h-3.5 w-3.5" />
              {user.name?.split(" ")[0] ?? "Conta"}
            </Link>
            <button
              onClick={logout}
              aria-label="Sair"
              className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/30"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15"
            >
              <LogIn className="h-3.5 w-3.5" /> Entrar
            </Link>
            <Link
              to="/cadastro"
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-sm hover:bg-white/90"
            >
              <UserPlus className="h-3.5 w-3.5" /> Cadastrar
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
