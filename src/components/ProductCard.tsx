import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useCart, formatBRL } from "@/contexts/CartContext";

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  img: string;
  badge?: string;
  desc?: string;
  /** Variante visual: padrão (claro) ou açaí (sobre fundo escuro/roxo) */
  variant?: "default" | "acai";
};

export function ProductCard({
  id,
  name,
  price,
  img,
  badge,
  desc,
  variant = "default",
}: ProductCardProps) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  function handleAdd() {
    add({ id, name, price, image: img }, qty);
    toast.success(`${qty}x ${name} no carrinho!`);
  }

  const isAcai = variant === "acai";

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl shadow-button transition-all hover:-translate-y-1 hover:shadow-glow ${
        isAcai
          ? "bg-white/10 ring-1 ring-white/25 backdrop-blur-md"
          : "bg-card ring-1 ring-border"
      }`}
    >
      <div className="relative aspect-square overflow-hidden bg-muted/40">
        <img
          src={img}
          alt={name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {badge && (
          <span className="absolute top-3 right-3 rounded-full bg-primary px-3 py-1 font-display text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-md">
            {badge}
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col p-4 ${isAcai ? "text-white" : ""}`}>
        <h3 className="font-display text-lg font-bold leading-tight sm:text-xl">{name}</h3>
        {desc && (
          <p
            className={`mt-1 line-clamp-2 text-sm leading-snug ${
              isAcai ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            {desc}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span
            className={`font-display text-2xl font-extrabold ${
              isAcai ? "text-sunny" : "bg-gradient-candy bg-clip-text text-transparent"
            }`}
          >
            {formatBRL(price)}
          </span>

          <div
            className={`flex items-center gap-1 rounded-full p-1 ${
              isAcai ? "bg-white/15 ring-1 ring-white/25" : "bg-muted ring-1 ring-border"
            }`}
          >
            <button
              type="button"
              aria-label="Diminuir"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-background/40"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-bold tabular-nums">{qty}</span>
            <button
              type="button"
              aria-label="Aumentar"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-background/40"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-display text-sm font-bold text-primary-foreground shadow-button transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <ShoppingCart className="h-4 w-4" />
          Adicionar
        </button>
      </div>
    </article>
  );
}
