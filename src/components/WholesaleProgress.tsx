import { Package } from "lucide-react";
import { useCartPricing } from "@/hooks/use-cart-pricing";
import { CATEGORY_LABEL, WHOLESALE_THRESHOLD, type WholesaleCategory } from "@/lib/wholesale";

type Props = { className?: string; sticky?: boolean };

export function WholesaleProgress({ className = "", sticky = false }: Props) {
  const pricing = useCartPricing();
  const categories = (Object.keys(pricing.counts) as WholesaleCategory[])
    .filter((c) => pricing.counts[c] > 0);
  if (categories.length === 0) return null;

  return (
    <div
      className={`${sticky ? "sticky top-20 z-30" : ""} mx-auto max-w-3xl rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-card backdrop-blur animate-pop-in ${className}`}
    >
      <div className="flex items-center gap-2 text-sm font-bold text-primary">
        <Package className="h-4 w-4" />
        Progresso para preço de atacado
      </div>
      <div className="mt-3 space-y-2.5">
        {categories.map((c) => {
          const qty = pricing.counts[c];
          const active = qty >= WHOLESALE_THRESHOLD;
          const pct = Math.min(100, (qty / WHOLESALE_THRESHOLD) * 100);
          const left = Math.max(0, WHOLESALE_THRESHOLD - qty);
          return (
            <div key={c}>
              <div className="flex justify-between text-xs">
                <span className="font-semibold capitalize text-foreground">
                  {CATEGORY_LABEL[c]}: {qty}/{WHOLESALE_THRESHOLD}
                </span>
                <span className={active ? "font-bold text-primary" : "text-muted-foreground"}>
                  {active ? "✓ Atacado ativo" : `Faltam ${left} para atacado`}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${active ? "bg-gradient-to-r from-primary to-secondary" : "bg-primary/60"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {pricing.discount > 0 && (
        <p className="mt-3 text-center text-xs font-semibold text-primary">
          Você está economizando agora com o preço de atacado! 🎉
        </p>
      )}
    </div>
  );
}
