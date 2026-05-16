import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Programa de fidelidade "Clube Ayla" — 10 potes = 1 grátis.
 *
 * Como o backend pode ainda não ter os campos de fidelidade implementados
 * (ou só conta selos quando o pedido vira "entregue"), mantemos um fallback
 * local em localStorage por usuário, que é incrementado a cada checkout.
 *
 * Sempre que `loyaltyStamps`/`loyaltyCredits` chegarem do backend, usamos
 * o maior valor entre backend e local (o backend pode ter um histórico
 * maior; o local cobre o gap entre o pedido e a marcação como entregue).
 */

type LoyaltyState = { stamps: number; credits: number };

const TARGET = 10;
const keyFor = (id: string | number) => `ayla.loyalty.${id}`;

function read(id: string | number): LoyaltyState {
  try {
    const raw = window.localStorage.getItem(keyFor(id));
    if (!raw) return { stamps: 0, credits: 0 };
    const v = JSON.parse(raw);
    return { stamps: Number(v.stamps ?? 0), credits: Number(v.credits ?? 0) };
  } catch {
    return { stamps: 0, credits: 0 };
  }
}

function write(id: string | number, v: LoyaltyState) {
  try {
    window.localStorage.setItem(keyFor(id), JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function useLoyalty() {
  const { user } = useAuth();
  const [local, setLocal] = useState<LoyaltyState>({ stamps: 0, credits: 0 });

  useEffect(() => {
    if (!user) {
      setLocal({ stamps: 0, credits: 0 });
      return;
    }
    setLocal(read(user.id));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Combina backend + local (pega o maior — cobre o caso de o backend
  // ainda não ter recebido a confirmação de entrega).
  const backendStamps = user?.loyaltyStamps ?? 0;
  const backendCredits = user?.loyaltyCredits ?? 0;
  const stamps = Math.max(backendStamps, local.stamps);
  const credits = Math.max(backendCredits, local.credits);

  const addTubs = useCallback(
    (qty: number) => {
      if (!user || qty <= 0) return;
      const cur = read(user.id);
      let newStamps = cur.stamps + qty;
      let newCredits = cur.credits;
      while (newStamps >= TARGET) {
        newStamps -= TARGET;
        newCredits += 1;
      }
      const next = { stamps: newStamps, credits: newCredits };
      write(user.id, next);
      setLocal(next);
    },
    [user?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const consumeCredit = useCallback(() => {
    if (!user) return;
    const cur = read(user.id);
    if (cur.credits <= 0) return;
    const next = { stamps: cur.stamps, credits: cur.credits - 1 };
    write(user.id, next);
    setLocal(next);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { stamps, credits, target: TARGET, addTubs, consumeCredit };
}
