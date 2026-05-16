import { Gift, IceCreamCone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLoyalty } from "@/hooks/use-loyalty";

/**
 * Programa de fidelidade: a cada 10 potes comprados,
 * o cliente ganha 1 pote grátis.
 */
export function LoyaltyBadge({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const { stamps, credits, target } = useLoyalty();
  if (!user) return null;
  const pct = Math.min(100, (stamps / target) * 100);
  const left = Math.max(0, target - stamps);

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
        <IceCreamCone className="h-3.5 w-3.5" />
        {stamps}/{target} potes
        {credits > 0 && (
          <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
            <Gift className="h-3 w-3" /> {credits}
          </span>
        )}
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-bold">🎁 Clube Ayla</h3>
          <p className="text-sm text-muted-foreground">
            Compre 10 potes e ganhe 1 grátis
          </p>
        </div>
        {credits > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-sm font-bold text-primary-foreground shadow-button">
            <Gift className="h-4 w-4" /> {credits} pote{credits > 1 ? "s" : ""} grátis
          </span>
        )}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs font-semibold">
          <span>{stamps} de {target} potes</span>
          <span className="text-muted-foreground">
            {left === 0 ? "Resgate disponível!" : `Faltam ${left}`}
          </span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 grid grid-cols-10 gap-1">
          {Array.from({ length: target }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full ${i < stamps ? "bg-primary" : "bg-muted"}`}
              aria-hidden
            />
          ))}
        </div>
      </div>
    </section>
  );
}
