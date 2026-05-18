import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";

import { useAuth, type Address } from "@/contexts/AuthContext";
import { api, extractApiError } from "@/lib/api";
import { loadOrders, type Order } from "@/lib/orders";
import { formatBRL } from "@/contexts/CartContext";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Minha conta — Ayla Sorvetes" }] }),
  component: () => (<RequireAuth><Profile /></RequireAuth>),
});

const profileSchema = z.object({
  firstName: z.string().trim().min(2, "Nome muito curto").max(60),
  lastName: z.string().trim().min(2, "Sobrenome muito curto").max(80),
  email: z.string().trim().email("Email inválido").max(255),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Mínimo 6 caracteres"),
  newPassword: z.string().min(6, "Mínimo 6 caracteres").max(100),
});
const addressSchema = z.object({
  cep: z.string().trim().min(8).max(10),
  rua: z.string().trim().min(2).max(120),
  numero: z.string().trim().min(1).max(10),
  complemento: z.string().trim().max(60).optional().or(z.literal("")),
  bairro: z.string().trim().min(2).max(80),
  cidade: z.string().trim().min(2).max(80),
  estado: z.string().trim().length(2),
});

function Profile() {
  const { user, refreshUser, logout, updateAddress } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [pwdBusy, setPwdBusy] = useState(false);
  const [addr, setAddr] = useState<Address>({});
  const [addrBusy, setAddrBusy] = useState(false);

  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setEmail(user?.email ?? "");
    setAddr(user?.address ?? {});
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const parsed = profileSchema.safeParse({ firstName, lastName, email });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setBusy(true);
    try {
      const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
      await api.put("/users/me", {
        nome: fullName, name: fullName,
        firstName: parsed.data.firstName, lastName: parsed.data.lastName,
        email: parsed.data.email,
      });
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

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    const parsed = addressSchema.safeParse(addr);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setAddrBusy(true);
    try {
      await updateAddress({ ...parsed.data, estado: parsed.data.estado.toUpperCase() });
      toast.success("Endereço salvo!");
    } catch (err) { toast.error((err as Error).message); }
    finally { setAddrBusy(false); }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Minha conta</h1>
      <p className="mt-1 text-muted-foreground">Atualize seus dados, endereço e senha.</p>


      <form onSubmit={saveProfile} className="mt-8 space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-display text-xl font-semibold">Dados</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold">Nome</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-semibold">Sobrenome</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
        </button>
      </form>

      <form onSubmit={saveAddress} className="mt-6 space-y-4 rounded-xl border border-border p-5">
        <h2 className="font-display text-xl font-semibold">Endereço de entrega</h2>
        <div className="grid grid-cols-2 gap-3">
          <AField label="CEP" value={addr.cep ?? ""} onChange={(v) => setAddr({ ...addr, cep: v })} />
          <AField label="Número" value={addr.numero ?? ""} onChange={(v) => setAddr({ ...addr, numero: v })} />
        </div>
        <AField label="Rua" value={addr.rua ?? ""} onChange={(v) => setAddr({ ...addr, rua: v })} />
        <AField label="Complemento" value={addr.complemento ?? ""} onChange={(v) => setAddr({ ...addr, complemento: v })} />
        <AField label="Bairro" value={addr.bairro ?? ""} onChange={(v) => setAddr({ ...addr, bairro: v })} />
        <div className="grid grid-cols-[1fr_100px] gap-3">
          <AField label="Cidade" value={addr.cidade ?? ""} onChange={(v) => setAddr({ ...addr, cidade: v })} />
          <AField label="UF" value={addr.estado ?? ""} onChange={(v) => setAddr({ ...addr, estado: v.toUpperCase() })} />
        </div>
        <button disabled={addrBusy} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
          {addrBusy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar endereço
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

      <OrderHistory userId={user?.id ?? null} />

      <button onClick={logout} className="mt-6 text-sm text-destructive hover:underline">Sair da conta</button>
    </main>
  );
}

function OrderHistory({ userId }: { userId: string | number | null }) {
  const orders = useMemo<Order[]>(() => loadOrders(userId), [userId]);
  return (
    <section className="mt-6 rounded-xl border border-border p-5">
      <h2 className="font-display text-xl font-semibold">Histórico de pedidos</h2>
      {orders.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Você ainda não fez nenhum pedido por aqui.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(o.createdAt).toLocaleString("pt-BR")}
                </span>
                <span className="font-display font-bold text-primary">{formatBRL(o.total)}</span>
              </div>
              <ul className="mt-2 space-y-0.5 text-sm">
                {o.items.map((i) => (
                  <li key={String(i.id)} className="flex justify-between">
                    <span>{i.quantity}× {i.name}</span>
                    <span className="text-muted-foreground">{formatBRL(i.price * i.quantity)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-primary" />
    </label>
  );
}
