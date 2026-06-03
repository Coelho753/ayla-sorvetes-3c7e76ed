import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, Loader2, TrendingUp, ShoppingBag, Receipt, MessageCircle, Pencil, Save, X, Plus, Trash2, RotateCcw } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { RequireAuth } from "@/components/RequireAuth";
import { api, extractApiError } from "@/lib/api";
import { formatBRL } from "@/contexts/CartContext";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Admin Ayla" }] }),
  component: () => (<RequireAuth adminOnly><Financeiro /></RequireAuth>),
});

type Order = {
  id: string | number;
  total: number;
  status: string;
  createdAt?: string;
  source?: string;
  items?: Array<{ name: string; quantity: number; price?: number }>;
};

type Period = "today" | "7d" | "30d" | "month" | "all";

type ExternalSale = { id: string; date: string; description: string; value: number };
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

function Financeiro() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("30d");
  const [editId, setEditId] = useState<string | number | null>(null);
  const [editTotal, setEditTotal] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Order[] | { data: Order[] }>("/orders");
        setOrders(Array.isArray(data) ? data : (data as { data: Order[] }).data ?? []);
      } catch (err) { setError(extractApiError(err)); }
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
    const paid = filtered.filter((o) => !["cancelado"].includes(o.status));
    const total = paid.reduce((s, o) => s + Number(o.total ?? 0), 0);
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
    const top = Object.entries(productCount).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 8);

    return { total, delivered, cancelled, fromWhats, ticket, count: paid.length, series, top };
  }, [filtered]);

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

      <div className="mt-4 flex flex-wrap gap-2">
        {periods.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${period === p.key ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:bg-muted"}`}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<TrendingUp className="h-5 w-5" />} title="Receita do período" value={formatBRL(stats.total)} />
        <Stat icon={<ShoppingBag className="h-5 w-5" />} title="Pedidos" value={String(stats.count)} sub={`Ticket: ${formatBRL(stats.ticket)}`} />
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
        <h3 className="font-display text-lg font-bold">Top produtos</h3>
        {stats.top.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Sem dados.</p>
        ) : (
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground">
              <tr><th className="pb-2">Produto</th><th className="pb-2 text-right">Qtd</th><th className="pb-2 text-right">Receita</th></tr>
            </thead>
            <tbody>
              {stats.top.map(([name, v]) => (
                <tr key={name} className="border-t border-border">
                  <td className="py-2">{name}</td>
                  <td className="py-2 text-right">{v.qty}</td>
                  <td className="py-2 text-right font-semibold">{formatBRL(v.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-border p-5">
        <h3 className="font-display text-lg font-bold">Pedidos do período (edite valores e status)</h3>
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
