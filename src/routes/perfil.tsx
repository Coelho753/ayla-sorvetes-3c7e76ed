import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { api, extractApiError } from "@/lib/api";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Minha conta — Ayla Sorvetes" }] }),
  component: () => (<RequireAuth><Profile /></RequireAuth>),
});

const profileSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("Email inválido").max(255),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Mínimo 6 caracteres"),
  newPassword: z.string().min(6, "Mínimo 6 caracteres").max(100),
});

function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [pwdBusy, setPwdBusy] = useState(false);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse({ name, email });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      await api.put("/users/me", parsed.data);
      await refreshUser();
      toast.success("Dados atualizados!");
    } catch (err) { toast.error(extractApiError(err)); }
    finally { setBusy(false); }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(pwd);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setPwdBusy(true);
    try {
      await api.put("/users/me", parsed.data);
      toast.success("Senha alterada com sucesso!");
      setPwd({ currentPassword: "", newPassword: "" });
    } catch (err) { toast.error(extractApiError(err)); }
    finally { setPwdBusy(false); }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Minha conta</h1>
      <p className="mt-1 text-muted-foreground">Atualize seus dados pessoais.</p>

      <form onSubmit={saveProfile} className="mt-8 space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-display text-xl font-semibold">Dados</h2>
        <div>
          <label className="text-sm font-semibold">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-sm font-semibold">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
        </button>
      </form>

      <form onSubmit={savePassword} className="mt-6 space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-display text-xl font-semibold">Alterar senha</h2>
        <div>
          <label className="text-sm font-semibold">Senha atual</label>
          <input type="password" value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-semibold">Nova senha</label>
          <input type="password" value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
        </div>
        <button disabled={pwdBusy} className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 font-semibold text-secondary-foreground disabled:opacity-60">
          {pwdBusy && <Loader2 className="h-4 w-4 animate-spin" />} Atualizar senha
        </button>
      </form>

      <button onClick={logout} className="mt-6 text-sm text-destructive hover:underline">Sair da conta</button>
    </main>
  );
}
