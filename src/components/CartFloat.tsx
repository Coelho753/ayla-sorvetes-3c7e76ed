import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Trash2, Plus, Minus, X, Loader2, MapPin, Pencil, Check, Package } from "lucide-react";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { useAuth, type Address } from "@/contexts/AuthContext";
import { WHATSAPP_PHONE } from "@/config/api";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { saveOrder, newOrderId } from "@/lib/orders";
import { useCartPricing } from "@/hooks/use-cart-pricing";
import { CATEGORY_LABEL, WHOLESALE_THRESHOLD, type WholesaleCategory } from "@/lib/wholesale";

export function CartFloat() {
  const { count, items, setQuantity, remove, clear, syncing } = useCart();
  const { user, updateAddress } = useAuth();
  const [open, setOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [editingAddr, setEditingAddr] = useState(false);
  const [addrDraft, setAddrDraft] = useState<Address>({});
  const [savingAddr, setSavingAddr] = useState(false);
  const navigate = useNavigate();
  const pricing = useCartPricing();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function formatAddress() {
    const a = user?.address;
    if (!a?.rua) return null;
    const linha1 = [a.rua, a.numero].filter(Boolean).join(", ");
    const linha2 = [a.bairro, a.cidade, a.estado].filter(Boolean).join(" • ");
    const compl = a.complemento ? ` (${a.complemento})` : "";
    const cep = a.cep ? ` — CEP ${a.cep}` : "";
    return `${linha1}${compl} • ${linha2}${cep}`;
  }

  function buildMessage() {
    const lines = [
      "*Pedido — Ayla Sorvetes* 🍦",
      "",
      "*Itens:*",
      ...items.map((i) => {
        const eff = pricing.effectivePrice(i);
        const isWholesale = eff < i.price;
        const tag = isWholesale ? " _(atacado)_" : "";
        return `• ${i.name} (${i.quantity}x) — ${formatBRL(eff * i.quantity)}${tag}`;
      }),
    ];
    if (pricing.discount > 0) {
      lines.push(`📦 *Desconto atacado:* -${formatBRL(pricing.discount)}`);
    }
    lines.push("", `*Total:* ${formatBRL(pricing.total)}`);
    if (user?.name) lines.push("", `*Cliente:* ${user.name}`);
    const addr = formatAddress();
    if (addr) lines.push(`*Endereço:* ${addr}`);
    lines.push("", "_📱 Pedido feito pelo aplicativo Ayla Sorvetes_");
    return lines.join("\n");
  }

  async function checkout() {
    if (items.length === 0) return;
    setPlacing(true);
    if (user) {
      try {
        await api.post("/orders", {
          items: items.map((i) => ({
            id: i.id, productId: i.id, name: i.name,
            price: pricing.effectivePrice(i), basePrice: i.price,
            quantity: i.quantity, category: i.category,
          })),
          total: pricing.total,
          source: "site",
          wholesaleDiscount: pricing.discount,
          address: user.address ?? null,
        });
      } catch { /* sem bloquear envio para WhatsApp */ }
    }
    if (user && !user.address?.rua) {
      toast.message("Adicione seu endereço no perfil para entrega.", {
        action: { label: "Ir para perfil", onClick: () => navigate({ to: "/perfil" }) },
      });
    }
    saveOrder(user?.id ?? null, {
      id: newOrderId(),
      createdAt: new Date().toISOString(),
      items: items.map((i) => ({ ...i, price: pricing.effectivePrice(i) })),
      total: pricing.total,
      address: user?.address ?? null,
      customerName: user?.name,
    });
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url, "_blank", "noopener,noreferrer");
    clear();
    setOpen(false);
    toast.success("Pedido enviado! Veja no histórico em Minha conta.");
    setPlacing(false);
  }

  // categorias com itens (para mostrar barra de progresso)
  const categoriesWithItems = (Object.keys(pricing.counts) as WholesaleCategory[])
    .filter((c) => pricing.counts[c] > 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Abrir carrinho (${count})`}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-button transition-transform hover:scale-110"
      >
        <ShoppingCart className="h-6 w-6" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-secondary px-1.5 text-xs font-bold text-secondary-foreground ring-2 ring-background">
            {count}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-background shadow-2xl">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold">Seu carrinho</h2>
                {syncing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </div>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="rounded-full p-2 hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
                  <ShoppingCart className="mb-3 h-12 w-12 opacity-40" />
                  <p>Seu carrinho está vazio.</p>
                  <Link to="/cardapio" onClick={() => setOpen(false)} className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                    Ver cardápio
                  </Link>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((it) => {
                    const eff = pricing.effectivePrice(it);
                    const isWholesale = eff < it.price;
                    return (
                      <li key={it.id} className="flex gap-3 rounded-lg border border-border p-3">
                        {it.image && <img src={it.image} alt="" className="h-16 w-16 rounded-md object-cover" />}
                        <div className="flex-1">
                          <p className="font-semibold leading-tight">{it.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {isWholesale ? (
                              <>
                                <span className="line-through opacity-60">{formatBRL(it.price)}</span>{" "}
                                <span className="font-semibold text-primary">{formatBRL(eff)}</span>{" "}
                                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary">Atacado</span>
                              </>
                            ) : (
                              formatBRL(it.price)
                            )}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <button onClick={() => setQuantity(it.id, it.quantity - 1)} className="rounded-md border border-border p-1 hover:bg-muted" aria-label="Diminuir">
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-semibold">{it.quantity}</span>
                            <button onClick={() => setQuantity(it.id, it.quantity + 1)} className="rounded-md border border-border p-1 hover:bg-muted" aria-label="Aumentar">
                              <Plus className="h-3 w-3" />
                            </button>
                            <button onClick={() => remove(it.id)} className="ml-auto rounded-md p-1 text-destructive hover:bg-destructive/10" aria-label="Remover">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <p className="self-start font-semibold">{formatBRL(eff * it.quantity)}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-border px-5 py-4">
                {user && editingAddr ? (
                  <AddressEditor
                    initial={addrDraft}
                    saving={savingAddr}
                    onCancel={() => setEditingAddr(false)}
                    onSave={async (a) => {
                      setSavingAddr(true);
                      try {
                        await updateAddress(a);
                        toast.success("Endereço atualizado!");
                        setEditingAddr(false);
                      } catch (err) {
                        toast.error((err as Error).message);
                      } finally {
                        setSavingAddr(false);
                      }
                    }}
                  />
                ) : user?.address?.rua ? (
                  <div className="mb-3 flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <div className="flex-1">
                      <span className="font-semibold text-foreground">Entrega: </span>
                      {formatAddress()}
                    </div>
                    <button
                      onClick={() => { setAddrDraft(user.address ?? {}); setEditingAddr(true); }}
                      className="shrink-0 rounded-full p-1 text-primary hover:bg-primary/10"
                      aria-label="Trocar endereço"
                      title="Trocar endereço"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : user ? (
                  <button
                    onClick={() => { setAddrDraft({}); setEditingAddr(true); }}
                    className="mb-3 block w-full rounded-lg border border-dashed border-primary/50 px-3 py-2 text-xs text-primary hover:bg-primary/5"
                  >
                    + Adicionar endereço de entrega
                  </button>
                ) : null}

                {/* Progresso de atacado por categoria com itens */}
                {categoriesWithItems.length > 0 && (
                  <div className="mb-3 space-y-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary">
                      <Package className="h-3.5 w-3.5" /> Preço de atacado
                    </div>
                    {categoriesWithItems.map((c) => {
                      const qty = pricing.counts[c];
                      const active = qty >= WHOLESALE_THRESHOLD;
                      const pct = Math.min(100, (qty / WHOLESALE_THRESHOLD) * 100);
                      const left = Math.max(0, WHOLESALE_THRESHOLD - qty);
                      return (
                        <div key={c}>
                          <div className="flex justify-between text-[11px]">
                            <span className="font-semibold capitalize">{CATEGORY_LABEL[c]}: {qty}/{WHOLESALE_THRESHOLD}</span>
                            <span className={active ? "font-bold text-primary" : "text-muted-foreground"}>
                              {active ? "✓ Atacado ativo" : `Faltam ${left}`}
                            </span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${active ? "bg-gradient-to-r from-primary to-secondary" : "bg-primary/60"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {pricing.discount > 0 && (
                  <div className="mb-2 flex items-center justify-between text-sm text-primary">
                    <span>Desconto atacado</span>
                    <span className="font-semibold">-{formatBRL(pricing.discount)}</span>
                  </div>
                )}
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-lg">Total</span>
                  <span className="font-display text-2xl font-bold">{formatBRL(pricing.total)}</span>
                </div>
                <button
                  onClick={checkout}
                  disabled={placing}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-whatsapp py-3 font-display font-bold text-whatsapp-foreground shadow-button transition-transform hover:scale-[1.02] disabled:opacity-60"
                >
                  {placing && <Loader2 className="h-4 w-4 animate-spin" />}
                  Finalizar pelo WhatsApp
                </button>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <button onClick={clear} className="text-muted-foreground hover:text-destructive">Esvaziar</button>
                  {!user && (
                    <button onClick={() => { setOpen(false); navigate({ to: "/login" }); }} className="text-primary hover:underline">
                      Entrar para salvar carrinho
                    </button>
                  )}
                </div>
              </footer>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function AddressEditor({
  initial,
  saving,
  onSave,
  onCancel,
}: {
  initial: Address;
  saving: boolean;
  onSave: (a: Address) => void;
  onCancel: () => void;
}) {
  const [a, setA] = useState<Address>(initial);
  const [cepBusy, setCepBusy] = useState(false);

  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepBusy(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const d = await r.json();
      if (d.erro) return;
      setA((p) => ({
        ...p,
        cep: clean,
        rua: d.logradouro || p.rua,
        bairro: d.bairro || p.bairro,
        cidade: d.localidade || p.cidade,
        estado: d.uf || p.estado,
      }));
    } catch { /* ignore */ }
    finally { setCepBusy(false); }
  }

  function submit() {
    if (!a.rua || !a.numero || !a.bairro || !a.cidade || !a.estado) {
      toast.error("Preencha rua, número, bairro, cidade e UF.");
      return;
    }
    onSave({ ...a, estado: (a.estado || "").toUpperCase() });
  }

  const inputCls =
    "w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="mb-3 rounded-lg border border-primary/30 bg-card p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        Trocar endereço de entrega
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="relative">
          <input
            placeholder="CEP"
            value={a.cep ?? ""}
            onChange={(e) => { setA({ ...a, cep: e.target.value }); lookupCep(e.target.value); }}
            className={inputCls}
          />
          {cepBusy && <Loader2 className="absolute right-2 top-2 h-3 w-3 animate-spin text-muted-foreground" />}
        </div>
        <input placeholder="Número" value={a.numero ?? ""} onChange={(e) => setA({ ...a, numero: e.target.value })} className={inputCls} />
      </div>
      <input placeholder="Rua" value={a.rua ?? ""} onChange={(e) => setA({ ...a, rua: e.target.value })} className={`${inputCls} mt-2`} />
      <input placeholder="Complemento (opcional)" value={a.complemento ?? ""} onChange={(e) => setA({ ...a, complemento: e.target.value })} className={`${inputCls} mt-2`} />
      <input placeholder="Bairro" value={a.bairro ?? ""} onChange={(e) => setA({ ...a, bairro: e.target.value })} className={`${inputCls} mt-2`} />
      <div className="mt-2 grid grid-cols-[1fr_70px] gap-2">
        <input placeholder="Cidade" value={a.cidade ?? ""} onChange={(e) => setA({ ...a, cidade: e.target.value })} className={inputCls} />
        <input placeholder="UF" maxLength={2} value={a.estado ?? ""} onChange={(e) => setA({ ...a, estado: e.target.value.toUpperCase() })} className={inputCls} />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={onCancel}
          disabled={saving}
          className="flex-1 rounded-full border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={saving}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-bold text-primary-foreground shadow-button hover:scale-[1.02] disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
          Salvar
        </button>
      </div>
    </div>
  );
}
