import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Loader2, TrendingUp, ShoppingBag, Receipt, MessageCircle, Pencil, Save, X, Plus, Trash2, RotateCcw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { RequireAuth } from "@/components/RequireAuth";
import { api, extractApiError } from "@/lib/api";
import { formatBRL } from "@/contexts/CartContext";
import { toast } from "sonner";
import { debitStock } from "@/lib/stock";

export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Admin Ayla" }] }),
  component: () => (<RequireAuth adminOnly><Financeiro /></RequireAuth>),
});

type Order = {
  id: string | number;
  total: number;
  status: string;
  createdAt?: string;
  source?: string;
  items?: Array<{ name: string; quantity: number; price?: number; category?: string }>;
};

type Period = "today" | "7d" | "30d" | "month" | "all";

type ExternalSaleItem = { name: string; quantity: number; price: number; category?: ProductGroupKey };
type ExternalSale = {
  id: string;
  date: string;
  description: string;
  value: number;
  customerName?: string;
  items?: ExternalSaleItem[];
};
const EXT_KEY = "ayla.admin.external-sales";
const TOP_OVERRIDE_KEY = "ayla.admin.top-products"; // map name -> { qty, revenue }

function loadExternal(): ExternalSale[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(window.localStorage.getItem(EXT_KEY) ?? "[]") as ExternalSale[]; } catch { return []; }
}
function saveExternal(list: ExternalSale[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(EXT_KEY, JSON.stringify(list));
}
function loadTopOverrides(): Record<string, { qty: number; revenue: number }> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(TOP_OVERRIDE_KEY) ?? "{}"); } catch { return {}; }
}
function saveTopOverrides(o: Record<string, { qty: number; revenue: number }>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOP_OVERRIDE_KEY, JSON.stringify(o));
}

function startOfPeriod(p: Period): Date {
  const now = new Date();
  if (p === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (p === "7d") return new Date(now.getTime() - 7 * 86_400_000);
  if (p === "30d") return new Date(now.getTime() - 30 * 86_400_000);
  if (p === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(0);
}

const GROUP_LABEL: Record<ProductGroupKey, string> = {
  cup: "Copos",
  popsicle: "Picolés",
  tub: "Potes",
};
type ProductGroupKey = "cup" | "popsicle" | "tub";

function productGroup(category?: string, name?: string): ProductGroupKey | null {
  const c = (category ?? "").toLowerCase();
  if (["cup", "copo"].includes(c)) return "cup";
  if (["tub", "pote"].includes(c)) return "tub";
  if (c === "popsicle" || c === "picole" || c === "picolé" || c.startsWith("pic_")) return "popsicle";
  const n = (name ?? "").toLowerCase();
  if (n.includes("copo")) return "cup";
  if (n.includes("pote")) return "tub";
  if (n.includes("picol") || n.includes("pic ") || n.startsWith("pic")) return "popsicle";
  return null;
}

function orderSignature(input: { createdAt?: string; date?: string; total?: number; value?: number; customerName?: string; items?: ExternalSaleItem[] | Order["items"] }) {
  const date = (input.createdAt ?? input.date ?? "").slice(0, 10);
  const total = Number(input.total ?? input.value ?? 0).toFixed(2);
  const items = (input.items ?? [])
    .map((i) => `${i.name.trim().toLowerCase()}:${Number(i.quantity) || 0}:${Number(i.price ?? 0).toFixed(2)}`)
    .sort()
    .join("|");
  return `${date}|${total}|${(input.customerName ?? "").trim().toLowerCase()}|${items}`;
}

function Financeiro() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backendWarn, setBackendWarn] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [editId, setEditId] = useState<string | number | null>(null);
  const [editTotal, setEditTotal] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [externalSales, setExternalSales] = useState<ExternalSale[]>(() => loadExternal());
  const [topOverrides, setTopOverrides] = useState<Record<string, { qty: number; revenue: number }>>(() => loadTopOverrides());

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Order[] | { data: Order[] }>("/orders");
        setOrders(Array.isArray(data) ? data : (data as { data: Order[] }).data ?? []);
      } catch (err) {
        // Sem backend disponível: mostramos o painel mesmo assim,
        // com vendas externas e top produtos editáveis.
        setBackendWarn(extractApiError(err, "Backend indisponível — exibindo apenas vendas por fora."));
        setOrders([]);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    const start = startOfPeriod(period);
    return orders.filter((o) => {
      if (!o.createdAt) return period === "all";
      return new Date(o.createdAt) >= start;
    });
  }, [orders, period]);

  const stats = useMemo(() => {
    // Só consideramos vendas confirmadas (pagas em diante).
    const CONFIRMED = new Set(["pago", "separando", "saiu_para_entrega", "entregue", "preparando", "enviado"]);
    const paid = filtered.filter((o) => CONFIRMED.has((o.status ?? "").toLowerCase()));
    const ordersTotal = paid.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const startD = startOfPeriod(period);
    const externalInPeriod = externalSales.filter((e) => period === "all" || new Date(e.date) >= startD);
    const externalTotal = externalInPeriod.reduce((s, e) => s + Number(e.value || 0), 0);
    const total = ordersTotal + externalTotal;
    const delivered = paid.filter((o) => o.status === "entregue").reduce((s, o) => s + Number(o.total ?? 0), 0);
    const cancelled = filtered.filter((o) => o.status === "cancelado").reduce((s, o) => s + Number(o.total ?? 0), 0);
    const fromWhats = paid.filter((o) => (o.source ?? "").toLowerCase() === "whatsapp").reduce((s, o) => s + Number(o.total ?? 0), 0);
    const ticket = paid.length ? total / paid.length : 0;

    // série diária
    const byDay = new Map<string, number>();
    paid.forEach((o) => {
      if (!o.createdAt) return;
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      byDay.set(key, (byDay.get(key) ?? 0) + Number(o.total ?? 0));
    });
    const series = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, value]) => ({ day: day.slice(5), value: Math.round(value * 100) / 100 }));

    // top produtos
    const productCount: Record<string, { qty: number; revenue: number }> = {};
    paid.forEach((o) => o.items?.forEach((i) => {
      const k = i.name;
      if (!productCount[k]) productCount[k] = { qty: 0, revenue: 0 };
      productCount[k].qty += i.quantity;
      productCount[k].revenue += (i.price ?? 0) * i.quantity;
    }));
    // merge overrides locais
    const merged: Record<string, { qty: number; revenue: number }> = { ...productCount };
    for (const [name, v] of Object.entries(topOverrides)) merged[name] = v;
    const top = Object.entries(merged).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 12);

    return { total, ordersTotal, externalTotal, delivered, cancelled, fromWhats, ticket, count: paid.length, series, top };
  }, [filtered, externalSales, period, topOverrides]);

  function exportCsv() {
    const rows = [
      ["id", "data", "status", "origem", "total"],
      ...filtered.map((o) => [
        String(o.id),
        o.createdAt ?? "",
        o.status,
        o.source ?? "site",
        String(o.total ?? 0).replace(".", ","),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ayla-financeiro-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (error) return <main className="mx-auto max-w-6xl px-4 py-10"><p className="text-destructive">{error}</p></main>;
  if (!orders) return <main className="mx-auto max-w-6xl px-4 py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></main>;

  function startEdit(o: Order) {
    setEditId(o.id);
    setEditTotal(String(o.total ?? 0));
    setEditStatus(o.status ?? "novo");
  }
  function cancelEdit() { setEditId(null); }
  async function saveEdit(o: Order) {
    const total = Number(String(editTotal).replace(",", "."));
    if (!Number.isFinite(total) || total < 0) { toast.error("Valor inválido"); return; }
    setSaving(true);
    try {
      await api.put(`/orders/${o.id}`, { total, status: editStatus });
      setOrders((cur) => cur?.map((x) => (x.id === o.id ? { ...x, total, status: editStatus } : x)) ?? cur);
      setEditId(null);
      toast.success("Pedido atualizado");
    } catch (err) {
      toast.error(extractApiError(err, "Falha ao salvar"));
    } finally { setSaving(false); }
  }

  const periods: { key: Period; label: string }[] = [
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7 dias" },
    { key: "30d", label: "30 dias" },
    { key: "month", label: "Este mês" },
    { key: "all", label: "Tudo" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Voltar ao painel
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Financeiro</h1>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {backendWarn && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
          {backendWarn}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {periods.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${period === p.key ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<TrendingUp className="h-5 w-5" />} title="Receita do período" value={formatBRL(stats.total)} />
        <Stat icon={<ShoppingBag className="h-5 w-5" />} title="Pedidos confirmados" value={String(stats.count)} sub={`Ticket: ${formatBRL(stats.ticket)}`} />
        <Stat icon={<Receipt className="h-5 w-5" />} title="Entregues" value={formatBRL(stats.delivered)} sub={`Cancelado: ${formatBRL(stats.cancelled)}`} />
        <Stat icon={<MessageCircle className="h-5 w-5" />} title="Via WhatsApp" value={formatBRL(stats.fromWhats)} />
      </div>

      <section className="mt-6 rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-bold">Receita por dia</h3>
        {stats.series.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sem pedidos no período.</p>
        ) : (
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <YAxis tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  formatter={(v: number) => formatBRL(v)}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--card-foreground)" }}
                />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--primary)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-border p-5">
        <TopProductsEditable
          rows={stats.top}
          overrides={topOverrides}
          onChange={(o) => { setTopOverrides(o); saveTopOverrides(o); }}
        />
      </section>

      <section className="mt-6 rounded-xl border border-border p-5">
        <ExternalSalesPanel
          list={externalSales}
          onChange={(l) => { setExternalSales(l); saveExternal(l); }}
          totalInPeriod={stats.externalTotal}
        />
      </section>

      <section className="mt-6 rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-bold">Pedidos confirmados do período</h3>
        <p className="mt-1 text-xs text-muted-foreground">Somente pedidos com pagamento confirmado entram nas estatísticas acima.</p>
        {filtered.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sem pedidos.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="pb-2">#</th>
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const editing = editId === o.id;
                  return (
                    <tr key={o.id} className="border-t border-border">
                      <td className="py-2 font-mono text-xs">{String(o.id).slice(0, 8)}</td>
                      <td className="py-2 text-xs text-muted-foreground">{o.createdAt ? new Date(o.createdAt).toLocaleString("pt-BR") : "—"}</td>
                      <td className="py-2">
                        {editing ? (
                          <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1 text-xs">
                            {["novo", "preparando", "enviado", "entregue", "cancelado"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{o.status}</span>
                        )}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {editing ? (
                          <input
                            inputMode="decimal"
                            value={editTotal}
                            onChange={(e) => setEditTotal(e.target.value)}
                            className="w-28 rounded-md border border-input bg-background px-2 py-1 text-right text-sm"
                          />
                        ) : (
                          formatBRL(Number(o.total ?? 0))
                        )}
                      </td>
                      <td className="py-2 text-right">
                        {editing ? (
                          <div className="inline-flex gap-1">
                            <button disabled={saving} onClick={() => saveEdit(o)} className="rounded-md bg-primary p-1.5 text-primary-foreground disabled:opacity-50" aria-label="Salvar">
                              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            </button>
                            <button onClick={cancelEdit} className="rounded-md border border-border p-1.5" aria-label="Cancelar">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(o)} className="rounded-md border border-border p-1.5 hover:bg-muted" aria-label="Editar">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">{icon}<p className="text-sm">{title}</p></div>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function TopProductsEditable({
  rows, overrides, onChange,
}: {
  rows: [string, { qty: number; revenue: number }][];
  overrides: Record<string, { qty: number; revenue: number }>;
  onChange: (o: Record<string, { qty: number; revenue: number }>) => void;
}) {
  const [editKey, setEditKey] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [rev, setRev] = useState("");
  const [newName, setNewName] = useState("");

  function start(name: string, v: { qty: number; revenue: number }) {
    setEditKey(name);
    setQty(String(v.qty));
    setRev(String(v.revenue.toFixed(2)));
  }
  function save(name: string) {
    const q = Number(qty); const r = Number(String(rev).replace(",", "."));
    if (!Number.isFinite(q) || !Number.isFinite(r) || q < 0 || r < 0) { toast.error("Valor inválido"); return; }
    onChange({ ...overrides, [name]: { qty: q, revenue: r } });
    setEditKey(null);
    toast.success("Atualizado");
  }
  function resetOne(name: string) {
    const next = { ...overrides }; delete next[name]; onChange(next);
  }
  function addNew() {
    const n = newName.trim(); if (!n) return;
    onChange({ ...overrides, [n]: { qty: 0, revenue: 0 } });
    setNewName("");
    start(n, { qty: 0, revenue: 0 });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">Top produtos (editável)</h3>
        <div className="flex gap-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Adicionar produto" className="rounded-md border border-input bg-background px-2 py-1 text-sm" />
          <button onClick={addNew} className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1 text-xs font-bold text-primary-foreground"><Plus className="h-3 w-3" /> Add</button>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Sem dados.</p>
      ) : (
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase text-muted-foreground">
            <tr><th className="pb-2">Produto</th><th className="pb-2 text-right">Qtd</th><th className="pb-2 text-right">Receita</th><th className="pb-2 text-right">Ações</th></tr>
          </thead>
          <tbody>
            {rows.map(([name, v]) => {
              const overridden = name in overrides;
              const editing = editKey === name;
              return (
                <tr key={name} className="border-t border-border">
                  <td className="py-2">{name} {overridden && <span className="ml-1 text-[10px] uppercase text-primary">manual</span>}</td>
                  <td className="py-2 text-right">{editing ? <input value={qty} onChange={(e) => setQty(e.target.value)} className="w-16 rounded-md border border-input bg-background px-2 py-0.5 text-right text-xs" /> : v.qty}</td>
                  <td className="py-2 text-right font-semibold">{editing ? <input value={rev} onChange={(e) => setRev(e.target.value)} className="w-24 rounded-md border border-input bg-background px-2 py-0.5 text-right text-xs" /> : formatBRL(v.revenue)}</td>
                  <td className="py-2 text-right">
                    {editing ? (
                      <div className="inline-flex gap-1">
                        <button onClick={() => save(name)} className="rounded-md bg-primary p-1 text-primary-foreground"><Save className="h-3 w-3" /></button>
                        <button onClick={() => setEditKey(null)} className="rounded-md border border-border p-1"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <div className="inline-flex gap-1">
                        <button onClick={() => start(name, v)} className="rounded-md border border-border p-1"><Pencil className="h-3 w-3" /></button>
                        {overridden && <button onClick={() => resetOne(name)} className="rounded-md border border-border p-1" title="Restaurar automático"><RotateCcw className="h-3 w-3" /></button>}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

function ExternalSalesPanel({
  list, onChange, totalInPeriod,
}: { list: ExternalSale[]; onChange: (l: ExternalSale[]) => void; totalInPeriod: number }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [customer, setCustomer] = useState("");
  const [desc, setDesc] = useState("");
  const [items, setItems] = useState<ExternalSaleItem[]>([{ name: "", quantity: 1, price: 0 }]);

  const itemsTotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 0), 0);

  function addItem() { setItems((cur) => [...cur, { name: "", quantity: 1, price: 0 }]); }
  function updateItem(idx: number, patch: Partial<ExternalSaleItem>) {
    setItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function removeItem(idx: number) {
    setItems((cur) => cur.filter((_, i) => i !== idx));
  }

  function add() {
    const valid = items.filter((it) => it.name.trim() && it.quantity > 0 && it.price >= 0);
    if (valid.length === 0 || !desc.trim()) {
      toast.error("Preencha descrição e ao menos um produto.");
      return;
    }
    const total = valid.reduce((s, it) => s + it.price * it.quantity, 0);
    const item: ExternalSale = {
      id: `ext_${Date.now().toString(36)}`,
      date,
      description: desc.trim(),
      customerName: customer.trim() || undefined,
      value: total,
      items: valid,
    };
    onChange([item, ...list]);
    // Debita estoque local — os itens externos casam por nome quando não há id.
    debitStock(valid.map((it) => ({ name: it.name, quantity: it.quantity })));
    // Tenta também registrar no backend como pedido externo já pago.
    api.post("/orders", {
      source: "external",
      status: "pago",
      customerName: customer.trim() || undefined,
      items: valid,
      total,
      createdAt: new Date(date).toISOString(),
    }).catch(() => { /* silencioso — fica salvo localmente */ });
    setDesc(""); setCustomer(""); setItems([{ name: "", quantity: 1, price: 0 }]);
    toast.success("Pedido externo cadastrado.");
  }
  function remove(id: string) { onChange(list.filter((x) => x.id !== id)); }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg font-bold">Pedidos / vendas por fora do aplicativo</h3>
        <span className="text-xs text-muted-foreground">Total no período: <strong className="text-foreground">{formatBRL(totalInPeriod)}</strong></span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Cadastre balcão, eventos e qualquer pedido fora do app — com os produtos e valores. Soma-se ao total geral do período.</p>

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-2 sm:grid-cols-[140px_1fr_1fr]">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-md border border-input bg-background px-2 py-2 text-sm" />
          <input placeholder="Cliente (opcional)" value={customer} onChange={(e) => setCustomer(e.target.value)} className="rounded-md border border-input bg-background px-2 py-2 text-sm" />
          <input placeholder="Descrição (ex: balcão, evento X)" value={desc} onChange={(e) => setDesc(e.target.value)} className="rounded-md border border-input bg-background px-2 py-2 text-sm" />
        </div>

        <div className="mt-3 space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-[1fr_90px_120px_auto]">
              <input placeholder="Produto" value={it.name} onChange={(e) => updateItem(idx, { name: e.target.value })} className="rounded-md border border-input bg-background px-2 py-2 text-sm" />
              <input placeholder="Qtd" type="number" min={1} value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 0 })} className="rounded-md border border-input bg-background px-2 py-2 text-sm" />
              <input placeholder="Preço un." inputMode="decimal" value={String(it.price)} onChange={(e) => updateItem(idx, { price: Number(String(e.target.value).replace(",", ".")) || 0 })} className="rounded-md border border-input bg-background px-2 py-2 text-sm" />
              <button type="button" onClick={() => removeItem(idx)} disabled={items.length === 1} className="rounded-md border border-border p-2 text-destructive disabled:opacity-30"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button type="button" onClick={addItem} className="inline-flex items-center gap-1 rounded-md border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted">
            <Plus className="h-3 w-3" /> Adicionar item
          </button>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total do pedido: <strong className="font-display text-base text-foreground">{formatBRL(itemsTotal)}</strong></span>
          <button onClick={add} className="inline-flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"><Plus className="h-4 w-4" /> Cadastrar pedido</button>
        </div>
      </div>

      {list.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {list.map((e) => (
            <li key={e.id} className="px-3 py-2 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{e.description}{e.customerName ? ` — ${e.customerName}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString("pt-BR")}</p>
                  {e.items && e.items.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                      {e.items.map((it, i) => (
                        <li key={i}>{it.quantity}× {it.name} — {formatBRL(it.price * it.quantity)}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-display font-bold">{formatBRL(e.value)}</span>
                  <button onClick={() => remove(e.id)} className="rounded-md p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
