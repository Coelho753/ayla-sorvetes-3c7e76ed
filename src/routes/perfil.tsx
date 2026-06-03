import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Clock, CreditCard, ChefHat, Truck, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { RequireAuth } from "@/components/RequireAuth";

import { useAuth, type Address } from "@/contexts/AuthContext";
import { api, extractApiError } from "@/lib/api";
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

      <OrderTracking />

      <button onClick={logout} className="mt-6 text-sm text-destructive hover:underline">Sair da conta</button>
    </main>
  );
}

type RemoteOrder = {
  id: string | number;
  total: number;
  status: string;
  createdAt?: string;
  items?: Array<{ name: string; quantity: number; price?: number }>;
};

const STATUS_STEPS = ["pendente", "pago", "preparando", "enviado", "entregue"] as const;
const STATUS_META: Record<
  string,
  { label: string; icon: typeof Clock; color: string }
> = {
  pendente: { label: "Pedido recebido", icon: Clock, color: "text-muted-foreground" },
  pago: { label: "Pagamento confirmado", icon: CreditCard, color: "text-primary" },
  preparando: { label: "Em preparo", icon: ChefHat, color: "text-primary" },
  enviado: { label: "A caminho", icon: Truck, color: "text-primary" },
  entregue: { label: "Entregue", icon: CheckCircle2, color: "text-emerald-600" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "text-destructive" },
};

function OrderTracking() {
  const [orders, setOrders] = useState<RemoteOrder[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(silent = false) {
    if (!silent) setRefreshing(true);
    try {
      const { data } = await api.get<RemoteOrder[] | { data: RemoteOrder[] }>("/orders/me");
      const list = Array.isArray(data) ? data : (data as { data: RemoteOrder[] }).data ?? [];
      setOrders(list);
      setErr(null);
    } catch (e) {
      setErr(extractApiError(e));
    } finally {
      if (!silent) setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    const id = window.setInterval(() => load(true), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="mt-6 rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">Meus pedidos</h2>
        <button
          onClick={() => load()}
          aria-label="Atualizar pedidos"
          className="rounded-full p-2 text-muted-foreground hover:bg-muted"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Acompanhe em tempo real o status do seu pedido (atualiza a cada 30s).</p>

      {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
      {!orders && !err && <Loader2 className="mt-3 h-5 w-5 animate-spin text-primary" />}
      {orders && orders.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">Você ainda não fez nenhum pedido.</p>
      )}

      {orders && orders.length > 0 && (
        <ul className="mt-4 space-y-4">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} />
          ))}
        </ul>
      )}
    </section>
  );
}

function OrderCard({ order }: { order: RemoteOrder }) {
  const status = (order.status ?? "pendente").toLowerCase();
  const meta = STATUS_META[status] ?? STATUS_META.pendente;
  const Icon = meta.icon;
  const cancelled = status === "cancelado";
  const currentStep = STATUS_STEPS.indexOf(status as (typeof STATUS_STEPS)[number]);

  return (
    <li className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-muted-foreground">#{String(order.id).slice(-6)}</span>
          {order.createdAt && (
            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString("pt-BR")}</p>
          )}
        </div>
        <span className="font-display font-bold text-primary">{formatBRL(Number(order.total) || 0)}</span>
      </div>

      <div className={`mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm font-semibold ${meta.color}`}>
        <Icon className="h-4 w-4" />
        {meta.label}
      </div>

      {!cancelled && (
        <ol className="mt-4 grid grid-cols-5 gap-1">
          {STATUS_STEPS.map((s, i) => {
            const done = currentStep >= i;
            const stepMeta = STATUS_META[s];
            const StepIcon = stepMeta.icon;
            return (
              <li key={s} className="flex flex-col items-center text-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                    done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  <StepIcon className="h-3.5 w-3.5" />
                </div>
                <span className={`mt-1 text-[10px] leading-tight ${done ? "text-foreground" : "text-muted-foreground"}`}>
                  {stepMeta.label}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {order.items && order.items.length > 0 && (
        <ul className="mt-3 space-y-0.5 border-t border-border pt-3 text-sm">
          {order.items.map((i, idx) => (
            <li key={idx} className="flex justify-between">
              <span>{i.quantity}× {i.name}</span>
              {i.price !== undefined && (
                <span className="text-muted-foreground">{formatBRL(Number(i.price) * i.quantity)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
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
