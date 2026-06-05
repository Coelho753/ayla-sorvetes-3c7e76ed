// Overrides de carrossel armazenados em localStorage.
// Permite ao admin adicionar/editar/remover itens por carrossel
// sem precisar do backend. A home aplica esses overrides em cima do
// catálogo local (src/lib/catalog.ts).

export type CarouselKey =
  | "tubs"
  | "cups"
  | "popsiclesAgua"
  | "popsiclesLeite"
  | "popsiclesPremium"
  | "popsiclesSki"
  | "acai";

export const CAROUSEL_LABEL: Record<CarouselKey, string> = {
  tubs: "Potes 1,5L",
  cups: "Copos 300ml",
  popsiclesAgua: "Picolé base água",
  popsiclesLeite: "Picolé base leite",
  popsiclesPremium: "Picolé Premium",
  popsiclesSki: "Picolé Ski",
  acai: "Açaí",
};

export type CarouselItem = {
  id: string;            // estável (slug)
  name: string;
  price: number;
  img?: string;          // URL (data: ou http)
  desc?: string;
  size?: string;         // usado em açaí
};

type Override = {
  // adicionados manualmente pelo admin
  added: CarouselItem[];
  // edições por nome (lowercased) — sobrescreve preço/desc/img do item base
  edits: Record<string, Partial<CarouselItem>>;
  // nomes removidos (lowercased)
  removed: string[];
};

type Store = Partial<Record<CarouselKey, Override>>;

const KEY = "ayla.admin.carousel-overrides.v1";

function emptyOverride(): Override {
  return { added: [], edits: {}, removed: [] };
}

export function loadOverrides(): Store {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Store; } catch { return {}; }
}

export function saveOverrides(store: Store) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(store));
}

export function getOverride(store: Store, key: CarouselKey): Override {
  return store[key] ?? emptyOverride();
}

export function setOverride(store: Store, key: CarouselKey, o: Override): Store {
  return { ...store, [key]: o };
}

export function normName(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// Aplica overrides a uma lista base do catálogo.
export function applyOverrides<T extends { name: string; price: number; img?: string; desc?: string; size?: string }>(
  base: T[],
  key: CarouselKey,
  store: Store = loadOverrides(),
): (T & { id: string })[] {
  const o = getOverride(store, key);
  const removed = new Set(o.removed.map(normName));
  const merged = base
    .filter((b) => !removed.has(normName(b.name)))
    .map((b) => {
      const edit = o.edits[normName(b.name)];
      return { ...b, ...(edit ?? {}), id: `base-${normName(b.name)}` } as T & { id: string };
    });
  const added = o.added.map((a) => ({ ...(a as unknown as T), id: a.id }));
  return [...merged, ...added];
}