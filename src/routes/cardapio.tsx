import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { fetchProducts, groupByCategory, imgOf, type ApiProduct } from "@/lib/products";
import { CATEGORY_LABELS, type CategoryKey } from "@/lib/catalog";

type CatTab = CategoryKey | "all";

export const Route = createFileRoute("/cardapio")({
  head: () => ({ meta: [
    { title: "Cardápio — Ayla Sorvetes" },
    { name: "description", content: "Veja todos os sabores: potes, copos, picolés e açaí. Peça pelo WhatsApp." },
  ] }),
  validateSearch: (s: Record<string, unknown>): { cat?: CatTab } => {
    const c = s.cat as string | undefined;
    if (c && ["all", "tub", "cup", "popsicle", "acai"].includes(c)) return { cat: c as CatTab };
    return {};
  },
  component: CardapioPage,
});

type Item = { id: string; name: string; price: number; image?: string; description?: string; category: CategoryKey; badge?: string };

function fromRemote(list: ApiProduct[]): Item[] {
  const grouped = groupByCategory(list);
  const out: Item[] = [];
  (["tub", "cup", "popsicle", "acai"] as CategoryKey[]).forEach((cat) => {
    grouped[cat].forEach((p) => out.push({
      id: String(p.id),
      name: p.name,
      price: Number(p.price) || 0,
      image: imgOf(p),
      description: p.description,
      category: cat,
      badge: p.size,
    }));
  });
  return out;
}

function CardapioPage() {
  const search = useSearch({ from: "/cardapio" });
  const [tab, setTab] = useState<CatTab>(search.cat ?? "all");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { add } = useCart();

  useEffect(() => { if (search.cat) setTab(search.cat); }, [search.cat]);

  useEffect(() => {
    let alive = true;
    fetchProducts().then((list) => {
      if (!alive) return;
      if (list) setItems(fromRemote(list));
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => tab === "all" ? items : items.filter((i) => i.category === tab), [items, tab]);

  const tabs: { key: CatTab; label: string }[] = [
    { key: "all", label: "Todos" },
    { key: "tub", label: CATEGORY_LABELS.tub },
    { key: "cup", label: CATEGORY_LABELS.cup },
    { key: "popsicle", label: CATEGORY_LABELS.popsicle },
    { key: "acai", label: CATEGORY_LABELS.acai },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-6 text-center">
        <h1 className="font-display text-4xl font-bold">Cardápio</h1>
        <p className="mt-2 text-muted-foreground">Escolha seus favoritos e peça pelo WhatsApp.</p>
      </header>

      <nav aria-label="Categorias" className="sticky top-16 z-20 -mx-4 mb-6 overflow-x-auto bg-background/85 px-4 py-2 backdrop-blur">
        <div className="mx-auto flex max-w-3xl justify-start gap-2 sm:justify-center">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`min-h-10 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tab === t.key ? "bg-primary text-primary-foreground shadow" : "bg-muted text-foreground hover:bg-muted/70"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {loading && items.length === 0 && (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      )}

      {filtered.length === 0 && !loading && (
        <p className="py-16 text-center text-muted-foreground">Nenhum produto nesta categoria.</p>
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <article
              key={p.id}
              className="group animate-pop-in flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-glow"
              style={{ animationDelay: `${(i % 12) * 60}ms` }}
            >
              {p.image && (
                <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-sunny/10">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  {p.badge && (
                    <span className="absolute right-3 top-3 rounded-full bg-primary px-3 py-1 font-display text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-button">
                      {p.badge}
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-lg font-bold leading-tight">{p.name}</h3>
                {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                <div className="mt-auto flex items-center justify-between pt-4">
                  <span className="font-display text-xl font-extrabold text-primary">{formatBRL(p.price)}</span>
                  <button
                    onClick={() => { add({ id: p.id, name: p.name, price: p.price, image: p.image, category: p.category }); toast.success(`${p.name} adicionado!`); }}
                    className="inline-flex min-h-10 items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground shadow-button transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Adicionar ${p.name} ao carrinho`}
                  >
                    <Plus className="h-4 w-4" /> Adicionar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-12 text-center">
        <Link to="/" className="text-sm font-semibold text-primary hover:underline">← Voltar para a home</Link>
      </div>
    </main>
  );
}
