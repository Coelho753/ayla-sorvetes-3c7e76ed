import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, MessageCircle, Instagram } from "lucide-react";

import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { ProductCard } from "@/components/ProductCard";
import { WholesaleProgress } from "@/components/WholesaleProgress";
import { WHATSAPP_LINK } from "@/lib/whatsapp";
import { useReveal } from "@/hooks/use-reveal";
import { useImagePreload } from "@/hooks/use-image-preload";
import { fetchProducts, groupByCategory, imgOf, type ApiProduct } from "@/lib/products";
import { useState } from "react";
import {
  tubs,
  cups,
  popsicles,
  acaiProducts,
  TUB_PRICE,
  CUP_PRICE,
  popsiclesAgua,
  popsiclesLeite,
  popsiclesPremium,
  popsiclesSki,
  POPSICLE_SUB_LABEL,
} from "@/lib/catalog";
import { applyOverrides, loadOverrides } from "@/lib/carousel-overrides";

export const Route = createFileRoute("/")({
  component: Index,
});

const asset = (file: string) => `/assets/${file}`;
const mascot = asset("mascot.webp");
const floatPopsicle = asset("float-popsicle.png");
const floatScoop = asset("float-scoop.png");
const floatCone = asset("float-cone.png");
const floatTub = asset("float-tub.png");
const floatBerry = asset("float-berry.png");
const floatSparkle = asset("float-sparkle.png");

function Index() {
  useReveal();
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }));
  const autoplayCups = useRef(Autoplay({ delay: 3800, stopOnInteraction: false, stopOnMouseEnter: true }));
  const autoplayPopsAgua = useRef(Autoplay({ delay: 3200, stopOnInteraction: false, stopOnMouseEnter: true }));
  const autoplayPopsLeite = useRef(Autoplay({ delay: 3300, stopOnInteraction: false, stopOnMouseEnter: true }));
  const autoplayPopsPremium = useRef(Autoplay({ delay: 3400, stopOnInteraction: false, stopOnMouseEnter: true }));
  const autoplayPopsSki = useRef(Autoplay({ delay: 3600, stopOnInteraction: false, stopOnMouseEnter: true }));
  const autoplayAcai = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));

  // Pré-carrega TODAS as imagens dos cards/banners e mantém em cache
  useImagePreload([
    ...tubs.map((t) => t.img),
    ...cups.map((c) => c.img),
    ...popsicles.map((p) => p.img),
    ...acaiProducts.map((a) => a.img),
    floatPopsicle, floatScoop, mascot,
  ]);

  // Tenta carregar produtos do backend; se falhar, usa fallback local
  const [remote, setRemote] = useState<{ tub: ApiProduct[]; cup: ApiProduct[]; popsicle: ApiProduct[]; acai: ApiProduct[] } | null>(null);
  useEffect(() => {
    let alive = true;
    fetchProducts().then((list) => {
      if (!alive || !list || list.length === 0) return;
      setRemote(groupByCategory(list));
    });
    return () => { alive = false; };
  }, []);

  const overrides = loadOverrides();
  const tubsView = (remote?.tub.length
    ? remote.tub.map((p) => ({ name: p.name, img: imgOf(p) ?? "", price: Number(p.price) || TUB_PRICE }))
    : tubs);
  const cupsView = (remote?.cup.length
    ? remote.cup.map((p) => ({ name: p.name, img: imgOf(p) ?? "", price: Number(p.price) || CUP_PRICE, desc: p.description }))
    : cups);
  const acaiBase = (remote?.acai.length
    ? remote.acai.map((p) => ({ name: p.name, img: imgOf(p) ?? "", price: Number(p.price) || 0, desc: p.description, size: p.size ?? "" }))
    : acaiProducts);

  const tubsFinal = applyOverrides(tubsView, "tubs", overrides).map((t) => ({ ...t, category: "tub" }));
  const cupsFinal = applyOverrides(cupsView, "cups", overrides).map((c) => ({ ...c, category: "cup" }));
  const acaiFinal = applyOverrides(acaiBase, "acai", overrides).map((a) => ({ ...a, category: "acai" }));
  const popsAguaFinal = applyOverrides(popsiclesAgua, "popsiclesAgua", overrides);
  const popsLeiteFinal = applyOverrides(popsiclesLeite, "popsiclesLeite", overrides);
  const popsPremiumFinal = applyOverrides(popsiclesPremium, "popsiclesPremium", overrides);
  const popsSkiFinal = applyOverrides(popsiclesSki, "popsiclesSki", overrides);

  useEffect(() => {
    document.title = "Ayla Sorvetes — Os sorvetes mais irresistíveis da sua região 🍦";
  }, []);

  return (
    <main className="relative overflow-x-hidden text-foreground bg-gradient-page">
      <WhatsAppFloat />

      {/* HERO */}
      <section className="relative min-h-screen overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 dotted-pattern opacity-40" />
        {/* Floating decorations */}
        <img
          src={floatPopsicle}
          alt=""
          aria-hidden="true"
          width={180}
          height={180}
          loading="lazy"
          className="pointer-events-none absolute top-24 left-6 w-24 sm:w-36 md:w-44 animate-float drop-shadow-2xl"
          style={{ ["--r" as string]: "-12deg" }}
        />
        <img
          src={floatScoop}
          alt=""
          aria-hidden="true"
          width={180}
          height={180}
          loading="lazy"
          className="pointer-events-none absolute top-40 right-8 w-24 sm:w-36 md:w-44 animate-float-slow drop-shadow-2xl"
          style={{ ["--r" as string]: "10deg" }}
        />
        <img
          src={floatPopsicle}
          alt=""
          aria-hidden="true"
          width={140}
          height={140}
          loading="lazy"
          className="pointer-events-none absolute bottom-24 right-16 hidden md:block w-32 animate-float drop-shadow-2xl"
          style={{ ["--r" as string]: "20deg" }}
        />
        <img
          src={floatCone}
          alt=""
          aria-hidden="true"
          width={160}
          height={160}
          loading="lazy"
          className="pointer-events-none absolute bottom-32 left-4 hidden sm:block w-24 md:w-36 animate-float-slow drop-shadow-2xl"
          style={{ ["--r" as string]: "-8deg" }}
        />
        <img
          src={floatBerry}
          alt=""
          aria-hidden="true"
          width={120}
          height={120}
          loading="lazy"
          className="pointer-events-none absolute top-1/2 left-2 w-16 md:w-24 animate-float opacity-90"
        />
        <img
          src={floatTub}
          alt=""
          aria-hidden="true"
          width={140}
          height={140}
          loading="lazy"
          className="pointer-events-none absolute top-12 right-1/3 hidden md:block w-28 animate-float-slow drop-shadow-2xl"
          style={{ ["--r" as string]: "6deg" }}
        />


        {/* Sparkles */}
        {[
          "top-16 left-1/3",
          "top-1/3 right-1/4",
          "bottom-1/3 left-1/4",
          "bottom-20 right-1/3",
        ].map((pos, i) => (
          <Sparkles
            key={i}
            className={`pointer-events-none absolute ${pos} h-6 w-6 text-sunny animate-sparkle`}
            style={{ animationDelay: `${i * 0.5}s` }}
          />
        ))}

        <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
          <div className="animate-fade-up">
            <img
              src={mascot}
              alt="Mascote da Ayla Sorvetes"
              width={1024}
              height={1024}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="mx-auto h-56 w-56 sm:h-72 sm:w-72 md:h-80 md:w-80 animate-mascot drop-shadow-[0_25px_40px_rgba(0,0,0,0.35)]"
            />
          </div>

          <h1
            className="mt-6 font-display text-5xl font-bold leading-none tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)] sm:text-7xl md:text-8xl lg:text-9xl animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="block text-gradient-candy">AYLA</span>
            <span className="block text-white">SORVETES</span>
          </h1>

          <p
            className="mt-6 max-w-2xl font-display text-lg font-medium text-white/95 sm:text-2xl animate-fade-up"
            style={{ animationDelay: "0.25s" }}
          >
            Os sorvetes mais irresistíveis da sua região 🍦
          </p>

          <div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            <a
              href="#potes"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-8 py-5 font-display text-lg font-semibold text-white backdrop-blur-md ring-1 ring-white/30 transition-all hover:bg-white/25"
            >
              Ver cardápio 🍨
            </a>
          </div>
        </div>

        {/* Wave bottom */}
        <svg
          className="absolute bottom-0 left-0 w-full text-background"
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,50 C360,120 1080,-20 1440,50 L1440,100 L0,100 Z"
          />
        </svg>
      </section>

      {/* POTES 1,5L - CARROSSEL */}
      <section id="potes" className="relative overflow-hidden px-6 py-24 md:py-32">
        {/* fundo unificado em <main>; sem overlay local */}
        <div className="mx-auto max-w-6xl">
          <WholesaleProgress className="mb-10" />
          <div className="mx-auto max-w-2xl text-center">
            <span className="reveal inline-block rounded-full bg-secondary/15 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-secondary ring-1 ring-secondary/20">
              🍦 Potes de 1,5L
            </span>
            <h2 className="reveal mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              <span className="bg-gradient-candy bg-clip-text text-transparent">POTES</span>{" "}
              para casa
            </h2>
            <p className="reveal mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Sabores incríveis em potes generosos de 1,5 litro. Perfeito para compartilhar (ou não 😋).
            </p>
            <Link to="/cardapio" search={{ cat: "tub" }} className="reveal mt-5 inline-flex items-center gap-2 rounded-full bg-secondary/15 px-5 py-2 text-sm font-semibold text-secondary ring-1 ring-secondary/30 transition-colors hover:bg-secondary/25">
              Ver todos os potes →
            </Link>
          </div>

          <div className="reveal mt-14">
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[autoplay.current]}
              className="mx-auto w-full max-w-5xl"
            >
              <CarouselContent className="-ml-4">
                {tubsFinal.map((t, i) => (
                  <CarouselItem key={t.name} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                    <div className="animate-pop-in h-full" style={{ animationDelay: `${i * 90}ms` }}>
                      <ProductCard
                        id={t.id}
                        name={t.name}
                        price={t.price}
                        img={t.img ?? ""}
                        category="tub"
                        badge="1,5L"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 bg-card" />
              <CarouselNext className="hidden md:flex -right-4 lg:-right-12 bg-card" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* (banner lifestyle removido) */}

      {/* COPOS 300ML */}
      <section id="copos" className="relative overflow-hidden px-6 py-24 md:py-32">
        {/* fundo unificado em <main>; sem overlay local */}
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <span className="reveal inline-block rounded-full bg-secondary/15 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-secondary ring-1 ring-secondary/20">
              🍨 Copos de 300ml
            </span>
            <h2 className="reveal mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              <span className="bg-gradient-candy bg-clip-text text-transparent">COPOS</span>{" "}
              individuais
            </h2>
            <p className="reveal mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Porção perfeita pra matar a vontade. Cremoso, gelado e do seu jeito.
            </p>
            <Link to="/cardapio" search={{ cat: "cup" }} className="reveal mt-5 inline-flex items-center gap-2 rounded-full bg-secondary/15 px-5 py-2 text-sm font-semibold text-secondary ring-1 ring-secondary/30 transition-colors hover:bg-secondary/25">
              Ver todos os copos →
            </Link>
          </div>
          <div className="reveal mt-14">
            <Carousel opts={{ align: "start", loop: true }} plugins={[autoplayCups.current]} className="mx-auto w-full max-w-5xl">
              <CarouselContent className="-ml-4">
                {cupsFinal.map((c, i) => (
                  <CarouselItem key={c.name} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                    <div className="animate-pop-in h-full" style={{ animationDelay: `${i * 80}ms` }}>
                      <ProductCard
                        id={c.id}
                        name={c.name}
                        desc={c.desc}
                        price={c.price}
                        img={c.img ?? ""}
                        category={c.category}
                        badge="300ml"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 bg-card" />
              <CarouselNext className="hidden md:flex -right-4 lg:-right-12 bg-card" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* (banner lifestyle removido) */}

      {/* PICOLÉS */}
      <section id="picoles" className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="mx-auto max-w-6xl space-y-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="reveal inline-block rounded-full bg-primary/15 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-[0.2em] text-primary ring-1 ring-primary/20">
              🍡 Picolés
            </span>
            <h2 className="reveal mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              <span className="bg-gradient-candy bg-clip-text text-transparent">PICOLÉS</span>{" "}
              por categoria
            </h2>
            <p className="reveal mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Cada linha tem o seu carrossel. Escolha a categoria e adicione ao carrinho.
            </p>
          </div>

          <PopsicleCarousel
            title={POPSICLE_SUB_LABEL.agua}
            items={popsAguaFinal}
            autoplay={autoplayPopsAgua.current}
            badge="Água"
            subKey="agua"
          />
          <PopsicleCarousel
            title={POPSICLE_SUB_LABEL.leite}
            items={popsLeiteFinal}
            autoplay={autoplayPopsLeite.current}
            badge="Leite"
            subKey="leite"
          />
          <PopsicleCarousel
            title={POPSICLE_SUB_LABEL.premium}
            items={popsPremiumFinal}
            autoplay={autoplayPopsPremium.current}
            badge="Premium"
            subKey="premium"
          />
          <PopsicleCarousel
            title={POPSICLE_SUB_LABEL.ski}
            items={popsSkiFinal}
            autoplay={autoplayPopsSki.current}
            badge="Ski"
            subKey="ski"
          />
        </div>
      </section>

      {/* (banner lifestyle removido) */}

      {/* AÇAÍ - ABA ESPECIAL */}
      <section id="acai" className="relative overflow-hidden bg-gradient-purple px-6 py-24 text-white md:py-32">
        <div className="absolute inset-0 -z-0 dotted-pattern opacity-25" />
        <Sparkles className="pointer-events-none absolute top-20 left-10 h-8 w-8 text-sunny animate-sparkle" />
        <Sparkles className="pointer-events-none absolute bottom-20 right-10 h-8 w-8 text-sunny animate-sparkle" style={{ animationDelay: "0.6s" }} />
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="reveal inline-block rounded-full bg-white/15 px-4 py-1.5 font-display text-xs font-bold uppercase tracking-widest text-white ring-1 ring-white/30 backdrop-blur">
              ⭐ Aba Especial
            </span>
            <h2 className="reveal mt-4 font-display text-5xl font-bold text-white drop-shadow-lg sm:text-6xl md:text-7xl">
              <span className="text-gradient-candy">Açaí</span> Premium 💜
            </h2>
            <p className="reveal mx-auto mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
              Cremoso, gelado e irresistível. Do bowl artesanal ao pote família — o açaí mais querido da sua região.
            </p>
            <Link to="/cardapio" search={{ cat: "acai" }} className="reveal mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold text-white ring-1 ring-white/30 backdrop-blur transition-colors hover:bg-white/25">
              Ver todos os açaís →
            </Link>
          </div>
          <div className="reveal mt-14">
            <Carousel opts={{ align: "start", loop: true }} plugins={[autoplayAcai.current]} className="mx-auto w-full max-w-5xl">
              <CarouselContent className="-ml-4">
                {acaiFinal.map((a, i) => (
                  <CarouselItem key={a.name} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                    <div className="animate-pop-in h-full" style={{ animationDelay: `${i * 100}ms` }}>
                      <ProductCard
                        id={a.id}
                        name={a.name}
                        desc={a.desc}
                        price={a.price}
                        img={a.img ?? ""}
                        category={a.category}
                        badge={a.size}
                        variant="acai"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 bg-card" />
              <CarouselNext className="hidden md:flex -right-4 lg:-right-12 bg-card" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* VER TODOS OS PRODUTOS */}
      <section className="px-6 py-12 text-center">
        <Link
          to="/cardapio"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-display text-base font-bold text-primary-foreground shadow-button transition-transform hover:scale-105"
        >
          Ver todos os produtos 🍦
        </Link>
      </section>

      {/* DIFERENCIAIS */}
      {/* CTA PRINCIPAL */}
      <section className="relative overflow-hidden bg-gradient-cta px-6 py-24 text-center">
        <div className="absolute inset-0 dotted-pattern opacity-30" />
        <img
          src={floatScoop}
          alt=""
          aria-hidden="true"
          width={180}
          height={180}
          loading="lazy"
          className="pointer-events-none absolute -left-6 top-10 w-28 md:w-40 animate-float opacity-90"
          style={{ ["--r" as string]: "-15deg" }}
        />
        <img
          src={floatPopsicle}
          alt=""
          aria-hidden="true"
          width={180}
          height={180}
          loading="lazy"
          className="pointer-events-none absolute -right-4 bottom-10 w-28 md:w-40 animate-float-slow opacity-90"
          style={{ ["--r" as string]: "18deg" }}
        />
        <img
          src={floatTub}
          alt=""
          aria-hidden="true"
          width={140}
          height={140}
          loading="lazy"
          className="pointer-events-none absolute right-1/4 -top-4 hidden md:block w-24 animate-float opacity-90"
        />
        <img
          src={floatSparkle}
          alt=""
          aria-hidden="true"
          width={80}
          height={80}
          loading="lazy"
          className="pointer-events-none absolute left-1/4 bottom-6 w-12 md:w-16 animate-float-slow opacity-90"
        />

        <div className="relative z-10 mx-auto max-w-3xl">
          <h2 className="reveal font-display text-5xl font-bold leading-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl">
            Peça agora <br /> e se <span className="text-sunny">apaixone!</span>
          </h2>
          <p className="reveal mt-5 text-lg text-white/95 sm:text-xl">
            É rapidinho. Em poucos cliques seu sorvete tá a caminho 🍦💜
          </p>
          <a
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="reveal mt-10 inline-flex items-center gap-3 rounded-full bg-white px-10 py-6 font-display text-xl font-bold text-primary shadow-button transition-transform hover:scale-105"
          >
            <MessageCircle className="h-7 w-7" strokeWidth={2.5} />
            Pedir pelo WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card px-6 py-14 text-card-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-3">
            <img src={mascot} alt="Ayla Sorvetes" width={64} height={64} className="h-14 w-14" />
            <div>
              <p className="font-display text-2xl font-bold text-foreground">Ayla Sorvetes</p>
              <p className="text-xs text-muted-foreground">Feito com muito amor 💜</p>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/aylasorvetes?igsh=djlsZjQzM2t4bWs4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30 transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Ayla Sorvetes. Todos os direitos reservados.
        </p>
      </footer>
    </main>
  );
}

type PopsicleItem = { id?: string; name: string; desc?: string; img?: string; price: number };

function PopsicleCarousel({
  title,
  items,
  autoplay,
  badge,
  subKey,
}: {
  title: string;
  items: PopsicleItem[];
  autoplay: ReturnType<typeof Autoplay>;
  badge: string;
  subKey: string;
}) {
  return (
    <div className="reveal">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2 px-2">
        <h3 className="font-display text-2xl font-bold sm:text-3xl">
          <span className="bg-gradient-candy bg-clip-text text-transparent">{title}</span>
        </h3>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary ring-1 ring-primary/30">
          {items.length} sabores
        </span>
      </div>
      <Carousel opts={{ align: "start", loop: true }} plugins={[autoplay]} className="mx-auto w-full max-w-5xl">
        <CarouselContent className="-ml-4">
          {items.map((p, i) => (
            <CarouselItem key={p.name} className="pl-4 sm:basis-1/2 lg:basis-1/3">
              <div className="animate-pop-in h-full" style={{ animationDelay: `${i * 80}ms` }}>
                <ProductCard
                  id={p.id ?? `local-pop-${subKey}-${p.name}`}
                  name={p.name}
                  desc={p.desc}
                  price={p.price}
                  img={p.img ?? ""}
                  category={`pic_${subKey}`}
                  badge={badge}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 bg-card" />
        <CarouselNext className="hidden md:flex -right-4 lg:-right-12 bg-card" />
      </Carousel>
    </div>
  );
}
