import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/admin/perfil")({
  head: () => ({ meta: [{ title: "Perfil do Admin — Ayla Sorvetes" }] }),
  component: () => (<RequireAuth adminOnly><AdminProfile /></RequireAuth>),
});

function AdminProfile() {
  const { user } = useAuth();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold">Perfil do administrador</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-3 py-1 text-xs font-bold text-secondary-foreground">
          <ShieldCheck className="h-3 w-3" /> ADMIN
        </span>
      </div>

      <div className="mt-6 space-y-4 rounded-xl border border-border p-6">
        <Row label="Nome" value={user?.name ?? "—"} />
        <Row label="E-mail" value={user?.email ?? "—"} />
        <Row label="Telefone" value={user?.phone ?? "—"} />
        <Row label="Permissão" value={user?.role ?? "user"} />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Para editar dados pessoais, endereço e senha use a página{" "}
        <Link to="/perfil" className="text-primary underline">Minha conta</Link>.
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
