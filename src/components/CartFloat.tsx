import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, Trash2, Plus, Minus, X } from "lucide-react";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { WHATSAPP_PHONE } from "@/config/api";

export function CartFloat() {
  const { count, items, total, setQuantity, remove, clear } = useCart();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  function buildMessage() {
    const lines = [
      "*Pedido — Ayla Sorvetes* 🍦",
      "",
      "*Itens:*",
      ...items.map((i) => `• ${i.name} (${i.quantity}x) — ${formatBRL(i.price * i.quantity)}`),
      "",
      `*Total:* ${formatBRL(total)}`,
    ];
    if (user?.name) lines.push("", `Cliente: ${user.name}`);
    return lines.join("\n");
  }

  function checkout() {
    if (items.length === 0) return;
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(buildMessage())}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

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
              <h2 className="font-display text-xl font-bold">Seu carrinho</h2>
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
                  {items.map((it) => (
                    <li key={it.id} className="flex gap-3 rounded-lg border border-border p-3">
                      {it.image && <img src={it.image} alt="" className="h-16 w-16 rounded-md object-cover" />}
                      <div className="flex-1">
                        <p className="font-semibold leading-tight">{it.name}</p>
                        <p className="text-sm text-muted-foreground">{formatBRL(it.price)}</p>
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
                      <p className="self-start font-semibold">{formatBRL(it.price * it.quantity)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-border px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-lg">Total</span>
                  <span className="font-display text-2xl font-bold">{formatBRL(total)}</span>
                </div>
                <button
                  onClick={checkout}
                  className="w-full rounded-full bg-whatsapp py-3 font-display font-bold text-whatsapp-foreground shadow-button transition-transform hover:scale-[1.02]"
                >
                  Finalizar pelo WhatsApp
                </button>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <button onClick={clear} className="text-muted-foreground hover:text-destructive">Esvaziar</button>
                  {!user && (
                    <button onClick={() => { setOpen(false); navigate({ to: "/login" }); }} className="text-primary hover:underline">
                      Entrar para identificar pedido
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
