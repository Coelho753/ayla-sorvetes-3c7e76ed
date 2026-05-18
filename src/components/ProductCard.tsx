import { useState } from "react";
import { Minus, Plus, Plus as PlusIcon, Sparkles } from "lucide-react";
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
  variant?: "default" | "acai";
  brand?: string;
};

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
  const [bumping, setBumping] = useState(false);
  const isAcai = variant === "acai";
  const brandLabel = brand ?? (isAcai ? "AÇAÍ" : "AYLA");

  function handleAdd() {
    add({ id, name, price, image: img, category }, qty);
    toast.success(`${qty}x ${name} no carrinho!`);
    setBumping(true);
    window.setTimeout(() => setBumping(false), 350);
  }

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-glow ${
        isAcai ? "border-secondary/40" : "border-border"
      }`}
    >
      {/* halo gradiente atrás do card no hover */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute -inset-0.5 -z-10 rounded-[28px] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60 ${
          isAcai ? "bg-gradient-purple" : "bg-gradient-candy"
        }`}
      />

      {/* IMAGEM */}
      <div
        className={`relative aspect-square overflow-hidden ${
          isAcai
            ? "bg-gradient-to-br from-secondary/15 via-primary/10 to-bubble/15"
            : "bg-gradient-to-br from-primary/10 via-secondary/10 to-sunny/15"
        }`}
      >
        {/* shimmer no hover */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-[1] -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
        />

        {img ? (
          <img
            src={img}
            alt={name}
            loading="lazy"
            decoding="async"
            width={600}
            height={600}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-1"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden="true">🍦</div>
        )}

        {/* "+" rápido */}
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Adicionar ${name} rapidamente`}
          className={`absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-button ring-2 ring-white/60 transition-all duration-300 hover:scale-110 hover:rotate-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            bumping ? "scale-125" : ""
          }`}
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Badge */}
        {badge && (
          <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-candy px-3 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-white shadow-button ring-1 ring-white/30 backdrop-blur">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            {badge}
          </span>
        )}
      </div>

      {/* CONTEÚDO */}
      <div className="flex flex-1 flex-col p-4">
        <span className={`font-display text-[11px] font-bold uppercase tracking-[0.22em] ${isAcai ? "text-secondary" : "text-primary"}`}>
          {brandLabel}
        </span>
        <h3 className="mt-1 font-display text-base font-bold leading-tight text-foreground sm:text-lg">{name}</h3>
        {desc && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-muted-foreground">{desc}</p>
        )}

        {/* Preço + qty */}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-2xl font-extrabold">
            <span className={isAcai ? "bg-gradient-purple bg-clip-text text-transparent" : "bg-gradient-candy bg-clip-text text-transparent"}>
              {formatBRL(price)}
            </span>
          </span>
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

        {/* Botão ADICIONAR */}
        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Adicionar ${qty} ${name} ao carrinho`}
          className={`mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-3 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground shadow-button transition-all duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
            isAcai ? "bg-gradient-purple" : "bg-gradient-candy"
          } ${bumping ? "scale-105" : ""}`}
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Adicionar
        </button>
      </div>
    </article>
  );
}
