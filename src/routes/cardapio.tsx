import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { api, extractApiError } from "@/lib/api";
import { useCart, formatBRL } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/cardapio")({
  head: () => ({ meta: [{ title: "Cardápio — Ayla Sorvetes" }, { name: "description", content: "Veja e peça nossos sabores online." }] }),
  component: CardapioPage,
});

type Product = {
  id: string | number;
  name: string;
  price: number;
  description?: string;
  image?: string;
  imageUrl?: string;
  category?: string;
};

function CardapioPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const { add } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    let alive = true;
    (async () => {
      try {
        const { data } = await api.get<Product[] | { data: Product[] }>("/products");
        const list = Array.isArray(data) ? data : (data as { data: Product[] }).data ?? [];
        if (alive) setProducts(list);
      } catch (err) {
        if (!alive) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401) setNeedsAuth(true);
        else setError(extractApiError(err, "Não foi possível carregar os produtos."));
      }
    })();
    return () => { alive = false; };
  }, [authLoading, isAuthenticated]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="font-display text-4xl font-bold">Cardápio</h1>
        <p className="mt-2 text-muted-foreground">Escolha seus favoritos e peça pelo WhatsApp.</p>
      </header>

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-center text-destructive">{error}</div>
      )}

      {!products && !error && (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      )}

      {products && products.length === 0 && (
        <p className="text-center text-muted-foreground">Nenhum produto disponível no momento.</p>
      )}

      {products && products.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const img = p.image ?? p.imageUrl;
            return (
              <article key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg">
                {img && (
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img src={img} alt={p.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-lg font-bold leading-tight">{p.name}</h3>
                  {p.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="font-display text-xl font-bold text-primary">{formatBRL(Number(p.price) || 0)}</span>
                    <button
                      onClick={() => { add({ id: p.id, name: p.name, price: Number(p.price) || 0, image: img }); toast.success(`${p.name} adicionado!`); }}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                    >
                      <Plus className="h-4 w-4" /> Adicionar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
