import { useMemo, useState } from "react";
import { Minus, Plus, Plus as PlusIcon, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";
import { useCart, formatBRL } from "@/contexts/CartContext";

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  img: string;
  category?: string;
  badge?: string;
  desc?: string;
  /** Variante visual: padrão (escuro) ou açaí (roxo intenso) */
  variant?: "default" | "acai";
  /** Marca exibida em cima do nome (ex: "AYLA", "AÇAÍ") */
  brand?: string;
};

// Hash determinístico p/ rating consistente entre renders
function pseudoRating(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  const rating = 4.5 + ((h % 50) / 100); // 4.50 - 4.99
  const reviews = 28 + (h % 130); // 28 - 157
  return { rating: Math.round(rating * 10) / 10, reviews };
}

export function ProductCard({
  id,
  name,
  price,
  img,
  category,
  badge,
  desc,
  variant = "default",
  brand,
}: ProductCardProps) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const isAcai = variant === "acai";
  const { rating, reviews } = useMemo(() => pseudoRating(id), [id]);
  const brandLabel = brand ?? (isAcai ? "AÇAÍ" : "AYLA");

  function handleAdd() {
    add({ id, name, price, image: img, category }, qty);
    toast.success(`${qty}x ${name} no carrinho!`);
  }

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow ${
        isAcai ? "border-secondary/40" : "border-border"
      }`}
    >
      {/* IMAGEM */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        {img ? (
          <img
            src={img}
            alt={name}
            loading="lazy"
            decoding="async"
            width={600}
            height={600}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden="true">🍦</div>
        )}
        {/* Rating chip topo-esquerda */}
        <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-foreground shadow-sm ring-1 ring-black/5">
          <Star className="h-3 w-3 fill-primary text-primary" aria-hidden="true" />
          {rating.toFixed(1)}
        </span>

        {/* Botão "+" rápido topo-direita */}
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Adicionar ${name} rapidamente`}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-button transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Badge */}
        {badge && (
          <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-button">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {badge}
          </span>
        )}
      </div>

      {/* CONTEÚDO */}
      <div className="flex flex-1 flex-col p-4">
        <span className={`font-display text-[11px] font-bold uppercase tracking-[0.18em] ${isAcai ? "text-secondary" : "text-primary"}`}>
          {brandLabel}
        </span>
        <h3 className="mt-1 font-display text-base font-bold leading-tight text-foreground sm:text-lg">{name}</h3>
        {desc && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{desc}</p>
        )}

        {/* Stars + reviews */}
        <div className="mt-3 flex items-center gap-1.5">
          <div className="flex" aria-label={`Avaliação ${rating} de 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < Math.round(rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">({reviews})</span>
        </div>

        {/* Preço + qty */}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-xl font-extrabold text-foreground">{formatBRL(price)}</span>
          <div className="flex items-center gap-1 rounded-full bg-muted p-1 ring-1 ring-border">
            <button
              type="button"
              aria-label={`Diminuir quantidade de ${name}`}
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="w-6 text-center text-sm font-bold tabular-nums text-foreground" aria-live="polite">{qty}</span>
            <button
              type="button"
              aria-label={`Aumentar quantidade de ${name}`}
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Botão ADICIONAR principal */}
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Adicionar ${qty} ${name} ao carrinho`}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground shadow-button transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Adicionar
        </button>
      </div>
    </article>
  );
}
