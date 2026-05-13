import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { api, extractApiError } from "@/lib/api";
import { formatBRL } from "@/contexts/CartContext";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Ayla Sorvetes" }] }),
  component: () => (<RequireAuth adminOnly><AdminPanel /></RequireAuth>),
});

type Product = { id: string | number; name: string; price: number; description?: string; image?: string; category?: string; size?: string; active?: boolean };
type Order = { id: string | number; total: number; status: string; createdAt?: string; source?: string; customerName?: string; customerPhone?: string; items?: Array<{ name: string; quantity: number; price?: number }>; user?: { name?: string; email?: string }; address?: { street?: string; number?: string; city?: string } };
type AdminUser = { id: string | number; name?: string; email: string; role?: string; createdAt?: string; phone?: string };

type Tab = "dashboard" | "products" | "orders" | "whatsapp" | "users";

function AdminPanel() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "products", label: "Produtos" },
    { key: "orders", label: "Pedidos" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "users", label: "Usuários" },
  ];
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Painel Admin</h1>
      <div className="mt-4 flex flex-wrap gap-2 border-b border-border">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-semibold ${tab === t.key ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        {tab === "dashboard" && <Dashboard />}
        {tab === "products" && <ProductsAdmin />}
        {tab === "orders" && <OrdersAdmin filter="all" />}
        {tab === "whatsapp" && <OrdersAdmin filter="whatsapp" />}
        {tab === "users" && <UsersAdmin />}
      </div>
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
        <Card title="Total de vendas" value={formatBRL(stats.totalSales)} />
        <Card title="Pedidos" value={String(stats.count)} />
        <Card title="Ticket médio" value={formatBRL(stats.ticket)} />
        <Card title="Via WhatsApp" value={String(stats.fromWhats)} />
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

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
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

  if (error) return <p className="text-destructive">{error}</p>;
  if (!products) return <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />;

  return (
    <div>
      <button onClick={() => setEditing({ id: "", name: "", price: 0 })} className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
        <Plus className="h-4 w-4" /> Novo produto
      </button>
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
              <option value="tub">Pote 1,5L</option>
              <option value="cup">Copo 300ml</option>
              <option value="popsicle">Picolé</option>
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

const STATUSES = ["pendente", "pago", "preparando", "enviado", "entregue", "cancelado"] as const;

function OrdersAdmin({ filter }: { filter: "all" | "whatsapp" }) {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const url = filter === "whatsapp" ? "/orders?source=whatsapp" : "/orders";
      const { data } = await api.get<Order[] | { data: Order[] }>(url);
      const list = Array.isArray(data) ? data : (data as { data: Order[] }).data ?? [];
      // Fallback no front: se backend ignorar o filtro, filtra aqui
      const filtered = filter === "whatsapp"
        ? list.filter((o) => (o.source ?? "").toLowerCase() === "whatsapp")
        : list;
      setOrders(filtered);
    } catch (err) { setError(extractApiError(err)); }
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [filter]);

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
  if (orders.length === 0) return (
    <p className="text-muted-foreground">
      {filter === "whatsapp"
        ? "Nenhum pedido via WhatsApp ainda. Configure o backend para receber e armazenar pedidos com source=\"whatsapp\" (ver PRODUTOS_BACKEND.md)."
        : "Nenhum pedido ainda."}
    </p>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="p-3">#</th>
            <th className="p-3">Cliente</th>
            <th className="p-3">Itens</th>
            <th className="p-3">Total</th>
            <th className="p-3">Origem</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-border align-top">
              <td className="p-3 font-mono text-xs">{String(o.id).slice(0, 8)}</td>
              <td className="p-3">
                <div className="font-semibold">{o.customerName ?? o.user?.name ?? o.user?.email ?? "—"}</div>
                {o.customerPhone && <div className="text-xs text-muted-foreground">{o.customerPhone}</div>}
              </td>
              <td className="p-3 text-xs text-muted-foreground">
                {o.items?.slice(0, 3).map((i) => `${i.quantity}× ${i.name}`).join(", ") ?? "—"}
                {o.items && o.items.length > 3 && ` +${o.items.length - 3}`}
              </td>
              <td className="p-3 font-semibold">{formatBRL(Number(o.total) || 0)}</td>
              <td className="p-3">
                {(o.source ?? "").toLowerCase() === "whatsapp" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-whatsapp/15 px-2 py-0.5 text-xs font-semibold text-whatsapp"><MessageCircle className="h-3 w-3" /> WhatsApp</span>
                ) : <span className="text-xs text-muted-foreground">{o.source ?? "site"}</span>}
              </td>
              <td className="p-3">
                <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)} className="rounded-md border border-input bg-background px-2 py-1">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td className="p-3 text-right">
                <button onClick={() => remove(o.id)} aria-label="Excluir pedido" className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UsersAdmin() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      const { data } = await api.get<AdminUser[] | { data: AdminUser[] }>("/users");
      setUsers(Array.isArray(data) ? data : (data as { data: AdminUser[] }).data ?? []);
    } catch (err) { setError(extractApiError(err)); }
  }
  useEffect(() => { load(); }, []);

  async function changeRole(id: AdminUser["id"], role: string) {
    try { await api.put(`/users/${id}`, { role }); toast.success("Permissão atualizada"); load(); }
    catch (err) { toast.error(extractApiError(err)); }
  }

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
            <tr key={u.id} className="border-t border-border">
              <td className="p-3 font-semibold">{u.name ?? "—"}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3 text-muted-foreground">{u.phone ?? "—"}</td>
              <td className="p-3">
                <select value={u.role ?? "user"} onChange={(e) => changeRole(u.id, e.target.value)} className="rounded-md border border-input bg-background px-2 py-1">
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="p-3 text-right">
                <button onClick={() => remove(u.id)} aria-label={`Excluir ${u.email}`} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
