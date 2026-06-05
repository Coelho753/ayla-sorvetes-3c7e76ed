import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, X, MessageCircle, UserCog, Wallet, Package, Save, RotateCcw, ShoppingCart, Users as UsersIcon, Truck, ArrowLeft, CheckCircle2, XCircle, GalleryHorizontal } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { api, extractApiError } from "@/lib/api";
import { formatBRL } from "@/contexts/CartContext";
import type { Address } from "@/contexts/AuthContext";
import { tubs, cups, popsicles, acaiProducts, popsiclesAgua, popsiclesLeite, popsiclesPremium, popsiclesSki } from "@/lib/catalog";
import {
  CAROUSEL_LABEL,
  type CarouselKey,
  loadOverrides,
  saveOverrides,
  getOverride,
  setOverride,
  normName,
  type CarouselItem as COItem,
} from "@/lib/carousel-overrides";
import {
  getCategoryPrices,
  getProductPrices,
  saveCategoryWholesale,
  saveProductWholesale,
  loadWholesaleFromBackend,
  DEFAULT_WHOLESALE_DISCOUNT,
  WHOLESALE_THRESHOLD,
  CATEGORY_LABEL,
  type WholesaleCategory,
} from "@/lib/wholesale";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Ayla Sorvetes" }] }),
  component: () => (<RequireAuth adminOnly><AdminPanel /></RequireAuth>),
});

type Product = { id: string | number; name: string; price: number; description?: string; image?: string; category?: string; size?: string; active?: boolean };
type Order = { id: string | number; total: number; status: string; createdAt?: string; source?: string; customerName?: string; customerPhone?: string; items?: Array<{ name: string; quantity: number; price?: number }>; user?: { name?: string; email?: string }; userId?: string | number; address?: { street?: string; number?: string; city?: string } };
type AdminUser = { id: string | number; name?: string; email: string; role?: string; createdAt?: string; phone?: string; address?: Address };

type Tab = "hub" | "products" | "wholesale" | "orders" | "users" | "carousels";

function AdminPanel() {
  const [tab, setTab] = useState<Tab>("hub");

  const hubCards: { key: Tab; title: string; desc: string; icon: typeof Package }[] = [
    { key: "products", title: "Estoque", desc: "Produtos: cadastrar, editar e excluir", icon: Package },
    { key: "carousels", title: "Carrosséis", desc: "Adicionar, editar e remover produtos do carrossel", icon: GalleryHorizontal },
    { key: "wholesale", title: "Atacado", desc: "Preços por categoria/produto", icon: Truck },
    { key: "orders", title: "Pedidos", desc: "Confirmar pagamento e entregas", icon: ShoppingCart },
    { key: "users", title: "Usuários", desc: "Editar perfil, senha e papéis", icon: UsersIcon },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {tab !== "hub" && (
            <button
              onClick={() => setTab("hub")}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-semibold hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" /> Painel
            </button>
          )}
          <h1 className="font-display text-3xl font-bold">Painel Admin</h1>
        </div>
        <Link
          to="/admin/perfil"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted"
        >
          <UserCog className="h-4 w-4" /> Perfil
        </Link>
      </div>

      {tab === "hub" ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {hubCards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => setTab(c.key)}
                className="group relative flex min-h-44 flex-col items-start gap-3 rounded-3xl bg-primary p-6 text-left text-primary-foreground shadow-button transition-all hover:-translate-y-1 hover:shadow-glow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
                  <Icon className="h-7 w-7" />
                </span>
                <h2 className="font-display text-2xl font-bold">{c.title}</h2>
                <p className="text-sm text-primary-foreground/85">{c.desc}</p>
              </button>
            );
          })}
          <Link
            to="/admin/financeiro"
            className="group relative flex min-h-44 flex-col items-start gap-3 rounded-3xl bg-primary p-6 text-left text-primary-foreground shadow-button transition-all hover:-translate-y-1 hover:shadow-glow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
              <Wallet className="h-7 w-7" />
            </span>
            <h2 className="font-display text-2xl font-bold">Financeiro / Dashboard</h2>
            <p className="text-sm text-primary-foreground/85">Métricas, receita confirmada, vendas externas e relatórios</p>
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          {tab === "products" && <ProductsAdmin />}
          {tab === "carousels" && <CarouselsAdmin />}
          {tab === "wholesale" && <WholesaleAdmin />}
          {tab === "orders" && <OrdersAdmin />}
          {tab === "users" && <UsersAdmin />}
        </div>
      )}
    </main>
  );
}

function Dashboard() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Order[] | { data: Order[] }>("/orders");
        setOrders(Array.isArray(data) ? data : (data as { data: Order[] }).data ?? []);
      } catch (err) { setError(extractApiError(err)); }
    })();
  }, []);

  const stats = useMemo(() => {
    if (!orders) return null;
    const totalSales = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const count = orders.length;
    const ticket = count ? totalSales / count : 0;
    const fromWhats = orders.filter((o) => (o.source ?? "").toLowerCase() === "whatsapp").length;
    const productCount: Record<string, number> = {};
    orders.forEach((o) => o.items?.forEach((i) => { productCount[i.name] = (productCount[i.name] ?? 0) + i.quantity; }));
    const top = Object.entries(productCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { totalSales, count, ticket, fromWhats, top };
  }, [orders]);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!stats) return <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EditableCard storageKey="totalSales" title="Total de vendas" computed={stats.totalSales} kind="currency" />
        <EditableCard storageKey="count" title="Pedidos" computed={stats.count} kind="int" />
        <EditableCard storageKey="ticket" title="Ticket médio" computed={stats.ticket} kind="currency" />
        <EditableCard storageKey="fromWhats" title="Via WhatsApp" computed={stats.fromWhats} kind="int" />
      </div>
      <div className="rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-bold">Mais vendidos</h3>
        {stats.top.length === 0 ? <p className="mt-2 text-muted-foreground">Sem dados.</p> : (
          <ul className="mt-3 space-y-2">
            {stats.top.map(([name, qty]) => (
              <li key={name} className="flex justify-between border-b border-border pb-2 last:border-0">
                <span>{name}</span><span className="font-semibold">{qty}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const OVERRIDE_PREFIX = "ayla.admin.dashboard.";

function EditableCard({ storageKey, title, computed, kind }: { storageKey: string; title: string; computed: number; kind: "currency" | "int" }) {
  const key = `${OVERRIDE_PREFIX}${storageKey}`;
  const [override, setOverride] = useState<number | null>(() => {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(key);
    return v === null ? null : Number(v);
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const display = override ?? computed;
  const formatted = kind === "currency" ? formatBRL(display) : String(Math.round(display));

  function start() {
    setDraft(String(override ?? (kind === "currency" ? computed.toFixed(2) : Math.round(computed))));
    setEditing(true);
  }
  function save() {
    const n = Number(String(draft).replace(",", "."));
    if (!Number.isFinite(n) || n < 0) { toast.error("Valor inválido"); return; }
    window.localStorage.setItem(key, String(n));
    setOverride(n);
    setEditing(false);
    toast.success("Valor atualizado");
  }
  function reset() {
    window.localStorage.removeItem(key);
    setOverride(null);
    setEditing(false);
    toast.success("Valor restaurado");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {!editing ? (
          <div className="flex gap-1">
            {override !== null && (
              <button onClick={reset} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Restaurar valor automático" title="Restaurar automático">
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}
            <button onClick={start} className="rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label={`Editar ${title}`}>
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex gap-1">
            <button onClick={save} className="rounded-md bg-primary p-1 text-primary-foreground" aria-label="Salvar">
              <Save className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setEditing(false)} className="rounded-md border border-border p-1" aria-label="Cancelar">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      {editing ? (
        <input
          autoFocus
          inputMode="decimal"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          className="mt-2 w-full rounded-md border border-input bg-background px-2 py-1 font-display text-2xl font-bold outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <p className="mt-2 font-display text-2xl font-bold">{formatted}</p>
      )}
      {override !== null && !editing && (
        <p className="mt-1 text-[10px] uppercase tracking-wide text-primary">Manual</p>
      )}
    </div>
  );
}

function ProductsAdmin() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const { data } = await api.get<Product[] | { data: Product[] }>("/products");
      setProducts(Array.isArray(data) ? data : (data as { data: Product[] }).data ?? []);
    } catch (err) { setError(extractApiError(err)); }
  }
  useEffect(() => { load(); }, []);

  async function remove(id: Product["id"]) {
    if (!confirm("Excluir este produto?")) return;
    try { await api.delete(`/products/${id}`); toast.success("Excluído"); load(); }
    catch (err) { toast.error(extractApiError(err)); }
  }

  const [importing, setImporting] = useState(false);
  async function importCatalog() {
    if (!confirm("Importar todos os produtos do catálogo local (potes, copos, picolés e açaí) para o backend? Itens com mesmo nome+categoria serão ignorados.")) return;
    setImporting(true);
    try {
      const existing = new Set((products ?? []).map((p) => `${(p.category ?? "").toLowerCase()}::${p.name.trim().toLowerCase()}`));
      const all: Array<{ name: string; price: number; description?: string; category: string; size?: string; active: boolean }> = [
        ...tubs.map((t) => ({ name: t.name, price: t.price, description: t.desc, category: "tub", size: "1,5L", active: true })),
        ...cups.map((c) => ({ name: c.name, price: c.price, description: c.desc, category: "cup", size: "300ml", active: true })),
        ...popsicles.map((p) => ({ name: p.name, price: p.price, description: p.desc, category: "popsicle", size: "Picolé", active: true })),
        ...acaiProducts.map((a) => ({ name: a.name, price: a.price, description: a.desc, category: "acai", size: a.size, active: true })),
      ];
      let ok = 0, skip = 0, fail = 0;
      for (const p of all) {
        const key = `${p.category}::${p.name.trim().toLowerCase()}`;
        if (existing.has(key)) { skip++; continue; }
        try { await api.post("/products", p); ok++; }
        catch { fail++; }
      }
      toast.success(`Importação concluída: ${ok} criados, ${skip} já existiam, ${fail} falhas.`);
      load();
    } finally { setImporting(false); }
  }

  if (error) return <p className="text-destructive">{error}</p>;
  if (!products) return <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setEditing({ id: "", name: "", price: 0 })} className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
          <Plus className="h-4 w-4" /> Novo produto
        </button>
        <button onClick={importCatalog} disabled={importing} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60">
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Importar catálogo local
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr><th className="p-3">Nome</th><th className="p-3">Categoria</th><th className="p-3">Preço</th><th className="p-3 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 font-semibold">{p.name}</td>
                <td className="p-3 text-muted-foreground">{p.category ?? "—"}</td>
                <td className="p-3">{formatBRL(Number(p.price) || 0)}</td>
                <td className="p-3 text-right">
                  <button onClick={() => setEditing(p)} aria-label={`Editar ${p.name}`} className="mr-2 rounded-md p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(p.id)} aria-label={`Excluir ${p.name}`} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <ProductModal product={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }: { product: Product; onClose: () => void; onSaved: () => void }) {
  const isNew = !product.id;
  const [form, setForm] = useState({
    name: product.name,
    price: String(product.price ?? 0),
    description: product.description ?? "",
    image: product.image ?? "",
    category: product.category ?? "tub",
    size: product.size ?? "",
    active: product.active ?? true,
  });
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim(),
        image: form.image.trim(),
        category: form.category,
        size: form.size.trim() || undefined,
        active: form.active,
      };
      if (isNew) await api.post("/products", payload);
      else await api.put(`/products/${product.id}`, payload);
      toast.success("Salvo!"); onSaved();
    } catch (err) { toast.error(extractApiError(err)); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">{isNew ? "Novo produto" : "Editar produto"}</h3>
          <button type="button" onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3">
          <input required placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2" />
          <div className="grid grid-cols-2 gap-3">
            <input required type="number" step="0.01" placeholder="Preço" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-md border border-input bg-background px-3 py-2" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-md border border-input bg-background px-3 py-2">
              <option value="pote">Pote 1,5L</option>
              <option value="cup">Copo 300ml</option>
              <option value="pic_agua">Picolé base água</option>
              <option value="pic_leite">Picolé base leite</option>
              <option value="pic_premium">Picolé Premium</option>
              <option value="pic_ski">Picolé Ski</option>
              <option value="acai">Açaí</option>
            </select>
          </div>
          <input placeholder="Tamanho (ex: 1L, 5L) — opcional" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2" />
          <textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2" rows={3} />
          <input placeholder="URL da imagem" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full rounded-md border border-input bg-background px-3 py-2" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Ativo (visível na home)
          </label>
        </div>
        <button disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
        </button>
      </form>
    </div>
  );
}

const STATUSES = ["pendente", "pago", "separando", "saiu_para_entrega", "entregue", "cancelado"] as const;
const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  separando: "Separando",
  saiu_para_entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
  // compat com nomes antigos
  preparando: "Separando",
  enviado: "Saiu para entrega",
  novo: "Pendente",
};

function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "whatsapp" | "site">("all");

  async function load() {
    try {
      const { data } = await api.get<Order[] | { data: Order[] }>("/orders");
      const list = Array.isArray(data) ? data : (data as { data: Order[] }).data ?? [];
      setOrders(list);
    } catch (err) { setError(extractApiError(err)); }
  }
  useEffect(() => { load(); }, []);

  const visible = useMemo(() => {
    if (!orders) return [];
    if (filter === "all") return orders;
    return orders.filter((o) => (o.source ?? "site").toLowerCase() === filter);
  }, [orders, filter]);

  async function changeStatus(id: Order["id"], status: string) {
    try { await api.put(`/orders/${id}`, { status }); toast.success("Status atualizado"); load(); }
    catch (err) { toast.error(extractApiError(err)); }
  }

  async function remove(id: Order["id"]) {
    if (!confirm("Excluir este pedido?")) return;
    try { await api.delete(`/orders/${id}`); toast.success("Excluído"); load(); }
    catch (err) { toast.error(extractApiError(err)); }
  }

  if (error) return <p className="text-destructive">{error}</p>;
  if (!orders) return <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />;

  const tabs: { key: typeof filter; label: string }[] = [
    { key: "all", label: `Todos (${orders.length})` },
    { key: "site", label: `Site (${orders.filter((o) => (o.source ?? "site").toLowerCase() === "site").length})` },
    { key: "whatsapp", label: `WhatsApp (${orders.filter((o) => (o.source ?? "").toLowerCase() === "whatsapp").length})` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground">Nenhum pedido nesta visão.</p>
      ) : (
        <div className="space-y-4">
          {visible.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onChangeStatus={(s) => changeStatus(o.id, s)}
              onRemove={() => remove(o.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order: o,
  onChangeStatus,
  onRemove,
}: {
  order: Order;
  onChangeStatus: (status: string) => void;
  onRemove: () => void;
}) {
  const status = (o.status ?? "pendente").toLowerCase();
  const isPending = status === "pendente" || status === "novo";
  const isCancelled = status === "cancelado";
  const isPaid = ["pago", "separando", "saiu_para_entrega", "entregue", "preparando", "enviado"].includes(status);
  const customerName = o.customerName ?? o.user?.name ?? o.user?.email ?? "Cliente sem nome";

  const steps: { key: string; label: string }[] = [
    { key: "separando", label: "Separando" },
    { key: "saiu_para_entrega", label: "Saiu para entrega" },
    { key: "entregue", label: "Entregue" },
  ];
  const stepIdx = steps.findIndex((s) => s.key === status);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-bold">{customerName}</p>
          {o.customerPhone && <p className="text-xs text-muted-foreground">{o.customerPhone}</p>}
          <p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">#{String(o.id).slice(0, 8)}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-extrabold text-primary">{formatBRL(Number(o.total) || 0)}</p>
          <div className="mt-1 flex items-center justify-end gap-2">
            {(o.source ?? "").toLowerCase() === "whatsapp" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-whatsapp/15 px-2 py-0.5 text-[10px] font-semibold text-whatsapp"><MessageCircle className="h-3 w-3" /> WhatsApp</span>
            ) : <span className="text-[10px] text-muted-foreground">{o.source ?? "site"}</span>}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isCancelled ? "bg-destructive/15 text-destructive" : isPaid ? "bg-emerald-500/15 text-emerald-700" : "bg-amber-500/15 text-amber-700"}`}>
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>
        </div>
      </div>

      {o.items && o.items.length > 0 && (
        <ul className="mt-3 space-y-0.5 text-xs text-muted-foreground">
          {o.items.map((i, idx) => (
            <li key={idx}>{i.quantity}× {i.name}</li>
          ))}
        </ul>
      )}

      {/* Etapa 1: confirmar/cancelar pagamento */}
      {isPending && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onChangeStatus("pago")}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-4 w-4" /> Confirmar pagamento
          </button>
          <button
            onClick={() => onChangeStatus("cancelado")}
            className="inline-flex items-center gap-2 rounded-full border border-destructive bg-destructive/10 px-4 py-2 text-sm font-bold text-destructive hover:bg-destructive/20"
          >
            <XCircle className="h-4 w-4" /> Cancelar
          </button>
        </div>
      )}

      {/* Etapa 2: stepper de entrega */}
      {isPaid && !isCancelled && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-1">
            {steps.map((s, i) => {
              const reached = stepIdx >= i || (status === "pago" && i === -1);
              const done = stepIdx >= i;
              return (
                <div key={s.key} className="flex flex-1 items-center">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{i + 1}</div>
                  {i < steps.length - 1 && <div className={`mx-1 h-0.5 flex-1 ${stepIdx > i ? "bg-primary" : "bg-muted"}`} />}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            {steps.map((s) => (
              <button
                key={s.key}
                onClick={() => onChangeStatus(s.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${status === s.key ? "bg-primary text-primary-foreground" : "border border-border bg-background hover:bg-muted"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-end">
        <button onClick={onRemove} className="inline-flex items-center gap-1 rounded-md p-2 text-xs text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" /> Excluir
        </button>
      </div>
    </div>
  );
}

function UsersAdmin() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  async function load() {
    try {
      const { data } = await api.get<AdminUser[] | { data: AdminUser[] }>("/users");
      setUsers(Array.isArray(data) ? data : (data as { data: AdminUser[] }).data ?? []);
    } catch (err) { setError(extractApiError(err)); }
  }
  useEffect(() => { load(); }, []);

  async function remove(id: AdminUser["id"]) {
    if (!confirm("Excluir este usuário? Essa ação não pode ser desfeita.")) return;
    try { await api.delete(`/users/${id}`); toast.success("Usuário excluído"); load(); }
    catch (err) { toast.error(extractApiError(err)); }
  }

  if (error) return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
      <p className="font-semibold">Não foi possível carregar usuários</p>
      <p className="mt-1">{error}</p>
      <p className="mt-2 text-muted-foreground">Verifique se o backend expõe os endpoints <code>GET/PUT/DELETE /users</code> protegidos por admin (ver PRODUTOS_BACKEND.md).</p>
    </div>
  );
  if (!users) return <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />;
  if (users.length === 0) return <p className="text-muted-foreground">Nenhum usuário cadastrado.</p>;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3">Nome</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Telefone</th>
              
              <th className="p-3">Permissão</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-3 font-semibold">{u.name ?? "—"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 text-muted-foreground">{u.phone ?? "—"}</td>
                
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "admin" ? "bg-secondary/20 text-secondary-foreground" : "bg-muted text-muted-foreground"}`}>{u.role ?? "user"}</span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => setEditing(u)} aria-label={`Editar ${u.email}`} className="mr-1 rounded-md p-2 hover:bg-muted"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(u.id)} aria-label={`Excluir ${u.email}`} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <UserDrawer user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </>
  );
}

function UserDrawer({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<AdminUser>({ ...user, address: user.address ?? {} });
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [ordersErr, setOrdersErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Order[] | { data: Order[] }>(`/orders?userId=${user.id}`);
        const list = Array.isArray(data) ? data : (data as { data: Order[] }).data ?? [];
        // fallback front se backend ignorar query
        const filtered = list.filter((o) => String(o.userId ?? o.user?.email ?? "") === String(user.id) || o.user?.email === user.email);
        setOrders(filtered.length ? filtered : list);
      } catch (err) {
        setOrdersErr(extractApiError(err));
      }
    })();
  }, [user.id, user.email]);

  async function save() {
    setBusy(true);
    try {
      await api.put(`/users/${user.id}`, {
        name: form.name,
        nome: form.name,
        email: form.email,
        phone: form.phone,
        telefone: form.phone,
        role: form.role,
        address: form.address,
        endereco: form.address,
      });
      toast.success("Usuário atualizado!");
      onSaved();
    } catch (err) { toast.error(extractApiError(err)); }
    finally { setBusy(false); }
  }

  async function resetPassword() {
    if (newPassword.length < 10) { toast.error("A nova senha precisa ter pelo menos 10 caracteres."); return; }
    if (!confirm(`Definir uma nova senha para ${user.email}?`)) return;
    setPwdBusy(true);
    try {
      await api.put(`/users/${user.id}`, { password: newPassword, senha: newPassword });
      toast.success("Senha redefinida.");
      setNewPassword("");
    } catch (err) { toast.error(extractApiError(err)); }
    finally { setPwdBusy(false); }
  }

  async function changeStatus(id: Order["id"], status: string) {
    try {
      await api.put(`/orders/${id}`, { status });
      toast.success("Status atualizado");
      setOrders((prev) => prev?.map((o) => (o.id === id ? { ...o, status } : o)) ?? null);
    } catch (err) { toast.error(extractApiError(err)); }
  }

  const a = form.address ?? {};
  const setA = (patch: Partial<Address>) => setForm({ ...form, address: { ...a, ...patch } });
  const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 z-[60] flex bg-black/50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-display text-xl font-bold">{user.name ?? user.email}</h3>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-5 px-5 py-4">
          <section className="space-y-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Perfil</h4>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Nome" value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
              <input placeholder="Telefone" value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            </div>
            <input type="email" placeholder="E-mail" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} />
            <select value={form.role ?? "user"} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputCls}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </section>

          <section className="space-y-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Endereço</h4>
            <div className="grid grid-cols-[1fr_100px] gap-3">
              <input placeholder="CEP" value={a.cep ?? ""} onChange={(e) => setA({ cep: e.target.value })} className={inputCls} />
              <input placeholder="Número" value={a.numero ?? ""} onChange={(e) => setA({ numero: e.target.value })} className={inputCls} />
            </div>
            <input placeholder="Rua" value={a.rua ?? ""} onChange={(e) => setA({ rua: e.target.value })} className={inputCls} />
            <input placeholder="Complemento" value={a.complemento ?? ""} onChange={(e) => setA({ complemento: e.target.value })} className={inputCls} />
            <input placeholder="Bairro" value={a.bairro ?? ""} onChange={(e) => setA({ bairro: e.target.value })} className={inputCls} />
            <div className="grid grid-cols-[1fr_80px] gap-3">
              <input placeholder="Cidade" value={a.cidade ?? ""} onChange={(e) => setA({ cidade: e.target.value })} className={inputCls} />
              <input placeholder="UF" maxLength={2} value={a.estado ?? ""} onChange={(e) => setA({ estado: e.target.value.toUpperCase() })} className={inputCls} />
            </div>
          </section>

          <button onClick={save} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-semibold text-primary-foreground disabled:opacity-60">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Salvar alterações
          </button>

          <section className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Redefinir senha</h4>
            <p className="text-xs text-muted-foreground">Mínimo 10 caracteres, com maiúscula, número e símbolo.</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputCls}
              />
              <button
                onClick={resetPassword}
                disabled={pwdBusy || !newPassword}
                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-secondary px-3 text-sm font-semibold text-secondary-foreground disabled:opacity-60"
              >
                {pwdBusy && <Loader2 className="h-4 w-4 animate-spin" />} Aplicar
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">Pedidos do usuário</h4>
            {ordersErr && <p className="text-sm text-destructive">{ordersErr}</p>}
            {!orders && !ordersErr && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            {orders && orders.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>}
            {orders && orders.length > 0 && (
              <ul className="space-y-2">
                {orders.map((o) => (
                  <li key={o.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground">#{String(o.id).slice(0, 8)}</span>
                      <span className="font-display font-bold text-primary">{formatBRL(Number(o.total) || 0)}</span>
                    </div>
                    {o.createdAt && <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString("pt-BR")}</p>}
                    <p className="mt-1 text-xs">
                      {o.items?.slice(0, 3).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      {o.items && o.items.length > 3 && ` +${o.items.length - 3}`}
                    </p>
                    <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} className="mt-2 rounded-md border border-input bg-background px-2 py-1 text-xs">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function WholesaleAdmin() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [catPrices, setCatPrices] = useState<Record<string, number>>(getCategoryPrices());
  const [prodPrices, setProdPrices] = useState<Record<string, number>>(getProductPrices());
  const [catInput, setCatInput] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Product[] | { data: Product[] }>("/products");
        setProducts(Array.isArray(data) ? data : (data as { data: Product[] }).data ?? []);
      } catch { setProducts([]); }
    })();
    loadWholesaleFromBackend().then(() => {
      setCatPrices(getCategoryPrices());
      setProdPrices(getProductPrices());
    });
  }, []);

  async function applyCategory(cat: WholesaleCategory) {
    const raw = catInput[cat];
    if (!raw) { toast.error("Informe um preço."); return; }
    const v = Number(raw.replace(",", "."));
    if (!v || v <= 0) { toast.error("Preço inválido."); return; }
    try {
      await saveCategoryWholesale(cat, v);
      setCatPrices(getCategoryPrices());
      toast.success(`Preço de atacado de ${CATEGORY_LABEL[cat]} aplicado em massa.`);
    } catch (err) {
      setCatPrices(getCategoryPrices());
      toast.error(extractApiError(err, "Falha ao salvar no servidor (mantido localmente)."));
    }
  }
  async function clearCategory(cat: WholesaleCategory) {
    try { await saveCategoryWholesale(cat, null); } catch { /* mantém local */ }
    setCatPrices(getCategoryPrices());
  }
  async function applyProduct(p: Product, raw: string) {
    if (!raw) {
      try { await saveProductWholesale(p.id, null); } catch { /* mantém local */ }
      setProdPrices(getProductPrices());
      return;
    }
    const v = Number(raw.replace(",", "."));
    if (!v || v <= 0) return;
    try {
      await saveProductWholesale(p.id, v);
    } catch (err) {
      toast.error(extractApiError(err, "Falha ao salvar no servidor (mantido localmente)."));
    }
    setProdPrices(getProductPrices());
  }

  const cats: WholesaleCategory[] = ["tub", "cup", "popsicle"];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
        <p className="font-semibold">Como funciona</p>
        <p className="mt-1 text-muted-foreground">
          A partir de <strong>{WHOLESALE_THRESHOLD} unidades</strong> da mesma categoria no carrinho,
          o cliente paga o preço de atacado. Sem configuração, aplica {Math.round(DEFAULT_WHOLESALE_DISCOUNT * 100)}% de desconto.
          Preço por produto (abaixo) tem prioridade sobre o preço da categoria.
        </p>
      </div>

      <section className="rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-bold">Por categoria (envio em massa)</h3>
        <p className="text-xs text-muted-foreground">Define um valor único aplicado a TODOS os itens da categoria.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {cats.map((c) => (
            <div key={c} className="rounded-lg border border-border p-3">
              <p className="font-semibold capitalize">{CATEGORY_LABEL[c]}</p>
              <p className="text-xs text-muted-foreground">
                Atual: {catPrices[c] ? formatBRL(catPrices[c]) : <em>{Math.round(DEFAULT_WHOLESALE_DISCOUNT * 100)}% off</em>}
              </p>
              <div className="mt-2 flex gap-1">
                <input
                  type="number" step="0.01" min={0}
                  placeholder="R$ atacado"
                  value={catInput[c] ?? ""}
                  onChange={(e) => setCatInput({ ...catInput, [c]: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                />
                <button onClick={() => applyCategory(c)} className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">Aplicar</button>
                {catPrices[c] != null && (
                  <button onClick={() => clearCategory(c)} className="rounded-md border border-border px-2 py-1.5 text-xs">Limpar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-bold">Por produto (override)</h3>
        <p className="text-xs text-muted-foreground">Sobrescreve o preço da categoria apenas para o produto selecionado.</p>
        {!products ? (
          <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-primary" />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr><th className="p-2">Produto</th><th className="p-2">Categoria</th><th className="p-2">Preço cheio</th><th className="p-2">Atacado</th></tr>
              </thead>
              <tbody>
                {products.filter((p) => ["tub","cup","popsicle"].includes((p.category ?? "").toLowerCase())).map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="p-2 font-semibold">{p.name}</td>
                    <td className="p-2 text-muted-foreground">{p.category}</td>
                    <td className="p-2">{formatBRL(Number(p.price) || 0)}</td>
                    <td className="p-2">
                      <input
                        type="number" step="0.01" min={0}
                        defaultValue={prodPrices[String(p.id)] ?? ""}
                        placeholder="—"
                        onBlur={(e) => applyProduct(p, e.target.value)}
                        className="w-28 rounded-md border border-input bg-background px-2 py-1 text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Package className="h-3.5 w-3.5" /> Valores sincronizados com o backend (<code>/wholesale</code>). Em caso de falha, ficam salvos localmente.
      </div>
    </div>
  );
}
