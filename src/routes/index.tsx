import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, MessageCircle, Instagram, Facebook } from "lucide-react";

import mascot from "@/assets/mascot.webp";
import floatPopsicle from "@/assets/float-popsicle.webp";
import floatScoop from "@/assets/float-scoop.webp";
import tubIogurte from "@/assets/tub-iogurte-grego.webp";
import tubFlocos from "@/assets/tub-flocos.webp";
import tubNinho from "@/assets/tub-ninho-trufado.webp";
import cupNinho from "@/assets/cup-3d-ninho.webp";
import cupBrigadeiro from "@/assets/cup-3d-brigadeiro.webp";
import cupDoceLeite from "@/assets/cup-3d-doce-leite.webp";
import cupLimao from "@/assets/cup-3d-limao.webp";
import cupLeiteCondensado from "@/assets/cup-3d-leite-condensado.webp";
import cupAcai from "@/assets/cup-3d-acai.webp";
import popsicleLimao from "@/assets/popsicle-limao.webp";
import popsicleFlocos from "@/assets/popsicle-flocos.webp";
import popsicleKiwi from "@/assets/popsicle-kiwi.webp";
import popsicleCoco from "@/assets/popsicle-coco.webp";
import popsicleAcai from "@/assets/popsicle-acai.webp";
import popsicleTentacao from "@/assets/popsicle-tentacao.webp";
import acai1L from "@/assets/acai-1l.webp";
import acai5L from "@/assets/acai-5l.webp";
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
import { WHATSAPP_LINK } from "@/lib/whatsapp";
import { useReveal } from "@/hooks/use-reveal";

export const Route = createFileRoute("/")({
  component: Index,
});

const tubs = [
  { name: "Iogurte Grego com Frutas Silvestres", desc: "Cremoso com mix de berries selvagens.", img: tubIogurte },
  { name: "Flocos", desc: "Clássico cremoso com flocos crocantes de chocolate.", img: tubFlocos },
  { name: "Ninho Trufado", desc: "Leitinho com pedaços de trufa de chocolate.", img: tubNinho },
];

const cups = [
  { name: "Ninho Trufado", desc: "Cremoso leitinho com pedaços de trufa.", img: cupNinho },
  { name: "Brigadeiro", desc: "Chocolate puro com granulado crocante.", img: cupBrigadeiro },
  { name: "Doce de Leite", desc: "Caramelo cremoso que derrete na boca.", img: cupDoceLeite },
  { name: "Limão Suíço", desc: "Refrescante e cítrico, na medida certa.", img: cupLimao },
  { name: "Leite Condensado", desc: "Doce, cremoso e irresistível.", img: cupLeiteCondensado },
  { name: "Açaí Premium", desc: "Açaí cremoso com toque tropical.", img: cupAcai },
];

const popsicles = [
  { name: "Flocos", desc: "Cremoso com flocos crocantes de chocolate.", img: popsicleFlocos },
  { name: "Coco Branco", desc: "Tropical e refrescante com coco fresco.", img: popsicleCoco },
  { name: "Açaí", desc: "Intenso e cremoso, direto da Amazônia.", img: popsicleAcai },
  { name: "Kiwi", desc: "Refrescante com pedaços de kiwi natural.", img: popsicleKiwi },
  { name: "Torta de Limão", desc: "Picolé gourmet com crocante de biscoito.", img: popsicleLimao },
  { name: "Tentação", desc: "Picolé cremoso de chocolate com cobertura irresistível.", img: popsicleTentacao },
];

const acaiProducts = [
  { name: "Açaí Premium 1L", desc: "Pote com guaraná e frutos vermelhos.", img: acai1L, size: "1L" },
  { name: "Açaí Premium 5L", desc: "Caixa família para festas e eventos.", img: acai5L, size: "5L" },
];

function Index() {
  useReveal();
  const autoplay = useRef(Autoplay({ delay: 3500, stopOnInteraction: false, stopOnMouseEnter: true }));
  const autoplayCups = useRef(Autoplay({ delay: 3800, stopOnInteraction: false, stopOnMouseEnter: true }));
  const autoplayPops = useRef(Autoplay({ delay: 3200, stopOnInteraction: false, stopOnMouseEnter: true }));
  const autoplayAcai = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));

  useEffect(() => {
    document.title = "Ayla Sorvetes — Os sorvetes mais irresistíveis da sua região 🍦";
  }, []);

  return (
    <main className="overflow-x-hidden bg-background text-foreground">
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
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full bg-whatsapp px-8 py-5 font-display text-lg font-semibold text-whatsapp-foreground shadow-button transition-all hover:scale-105 hover:shadow-glow"
            >
              <MessageCircle className="h-6 w-6 transition-transform group-hover:rotate-12" strokeWidth={2.5} />
              Pedir pelo WhatsApp
            </a>
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
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-muted/30 to-background" />
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="reveal font-display text-sm font-semibold uppercase tracking-widest text-secondary">
              Potes de 1,5L
            </p>
            <h2 className="reveal mt-3 font-display text-4xl font-bold sm:text-5xl md:text-6xl">
              Leve para <span className="bg-gradient-candy bg-clip-text text-transparent">casa</span> 🏠
            </h2>
            <p className="reveal mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Sabores incríveis em potes generosos de 1,5 litro. Perfeito para compartilhar (ou não 😋).
            </p>
          </div>

          <div className="reveal mt-14">
            <Carousel
              opts={{ align: "start", loop: true }}
              plugins={[autoplay.current]}
              className="mx-auto w-full max-w-5xl"
            >
              <CarouselContent className="-ml-4">
                {tubs.map((t, i) => (
                  <CarouselItem key={t.name} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                    <article
                      className="group relative flex h-full flex-col items-center rounded-3xl bg-card p-6 shadow-card ring-1 ring-border transition-all duration-500 hover:-translate-y-2 hover:shadow-glow"
                      style={{ transitionDelay: `${i * 60}ms` }}
                    >
                      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-candy opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-50" />
                      <span className="absolute right-4 top-4 rounded-full bg-gradient-cta px-3 py-1 font-display text-xs font-bold text-white shadow-button">
                        1,5L
                      </span>
                      <div className="relative flex h-56 w-56 items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-candy opacity-30 blur-2xl" />
                        <img
                          src={t.img}
                          alt={`Pote 1,5L de ${t.name}`}
                          width={1024}
                          height={1024}
                          loading="lazy"
                          className="relative h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2"
                        />
                      </div>
                      <h3 className="mt-4 text-center font-display text-xl font-semibold text-foreground">
                        {t.name}
                      </h3>
                      <p className="mt-2 text-center text-sm text-muted-foreground">{t.desc}</p>
                      <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-transform hover:scale-105"
                      >
                        Pedir pote 1,5L
                      </a>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 bg-card" />
              <CarouselNext className="hidden md:flex -right-4 lg:-right-12 bg-card" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* COPOS 300ML */}
      <section id="copos" className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-secondary/10 to-background" />
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="reveal font-display text-sm font-semibold uppercase tracking-widest text-secondary">
              Copos 300ml
            </p>
            <h2 className="reveal mt-3 font-display text-4xl font-bold sm:text-5xl md:text-6xl">
              Sorvetes <span className="bg-gradient-candy bg-clip-text text-transparent">individuais</span> 🍨
            </h2>
            <p className="reveal mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Porção perfeita pra matar a vontade. Cremoso, gelado e do seu jeito.
            </p>
          </div>
          <div className="reveal mt-14">
            <Carousel opts={{ align: "start", loop: true }} plugins={[autoplayCups.current]} className="mx-auto w-full max-w-5xl">
              <CarouselContent className="-ml-4">
                {cups.map((c, i) => (
                  <CarouselItem key={c.name} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                    <article
                      className="group relative flex h-full flex-col items-center rounded-3xl bg-card p-6 shadow-card ring-1 ring-border transition-all duration-500 hover:-translate-y-2 hover:shadow-glow"
                      style={{ transitionDelay: `${i * 60}ms` }}
                    >
                      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-candy opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-50" />
                      <span className="absolute right-4 top-4 rounded-full bg-gradient-cta px-3 py-1 font-display text-xs font-bold text-white shadow-button">
                        300ml
                      </span>
                      <div className="relative flex h-56 w-56 items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-candy opacity-30 blur-2xl" />
                        <img
                          src={c.img}
                          alt={`Copo 300ml de ${c.name}`}
                          width={1024}
                          height={1024}
                          loading="lazy"
                          className="relative h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2"
                        />
                      </div>
                      <h3 className="mt-4 text-center font-display text-xl font-semibold text-foreground">
                        {c.name}
                      </h3>
                      <p className="mt-2 text-center text-sm text-muted-foreground">{c.desc}</p>
                      <a
                        href={WHATSAPP_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-transform hover:scale-105"
                      >
                        Pedir copo 300ml
                      </a>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 bg-card" />
              <CarouselNext className="hidden md:flex -right-4 lg:-right-12 bg-card" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* PICOLÉS */}
      <section id="picoles" className="relative overflow-hidden px-6 py-24 md:py-32">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-primary/10 to-background" />
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="reveal font-display text-sm font-semibold uppercase tracking-widest text-secondary">
              Picolés Gourmet
            </p>
            <h2 className="reveal mt-3 font-display text-4xl font-bold sm:text-5xl md:text-6xl">
              Geladinho na <span className="bg-gradient-purple bg-clip-text text-transparent">palitinho</span> 🍡
            </h2>
            <p className="reveal mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Picolés artesanais com sabores intensos e ingredientes selecionados.
            </p>
          </div>
          <div className="reveal mt-14">
            <Carousel opts={{ align: "start", loop: true }} plugins={[autoplayPops.current]} className="mx-auto w-full max-w-5xl">
              <CarouselContent className="-ml-4">
                {popsicles.map((p, i) => (
                  <CarouselItem key={p.name} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                    <article className="group relative flex h-full flex-col items-center rounded-3xl bg-card p-6 shadow-card ring-1 ring-border transition-all duration-500 hover:-translate-y-2 hover:shadow-glow" style={{ transitionDelay: `${i * 60}ms` }}>
                      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-purple opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-50" />
                      <span className="absolute right-4 top-4 rounded-full bg-gradient-cta px-3 py-1 font-display text-xs font-bold text-white shadow-button">Gourmet</span>
                      <div className="relative flex h-56 w-56 items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-candy opacity-30 blur-2xl" />
                        <img src={p.img} alt={`Picolé sabor ${p.name}`} width={1024} height={1024} loading="lazy" className="relative h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" />
                      </div>
                      <h3 className="mt-4 text-center font-display text-xl font-semibold text-foreground">{p.name}</h3>
                      <p className="mt-2 text-center text-sm text-muted-foreground">{p.desc}</p>
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold text-secondary-foreground transition-transform hover:scale-105">Pedir picolé</a>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 bg-card" />
              <CarouselNext className="hidden md:flex -right-4 lg:-right-12 bg-card" />
            </Carousel>
          </div>
        </div>
      </section>

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
          </div>
          <div className="reveal mt-14">
            <Carousel opts={{ align: "start", loop: true }} plugins={[autoplayAcai.current]} className="mx-auto w-full max-w-5xl">
              <CarouselContent className="-ml-4">
                {acaiProducts.map((a, i) => (
                  <CarouselItem key={a.name} className="pl-4 sm:basis-1/2 lg:basis-1/3">
                    <article className="group relative flex h-full flex-col items-center rounded-3xl bg-card p-6 shadow-card ring-1 ring-border transition-all duration-500 hover:-translate-y-3 hover:shadow-glow" style={{ transitionDelay: `${i * 70}ms` }}>
                      <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-purple opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-60" />
                      <span className="absolute right-4 top-4 rounded-full bg-gradient-purple px-3 py-1 font-display text-xs font-bold text-white shadow-button">{a.size}</span>
                      <div className="relative flex h-56 w-56 items-center justify-center">
                        <div className="absolute inset-0 rounded-full bg-gradient-purple opacity-40 blur-2xl" />
                        <img src={a.img} alt={`Açaí ${a.name}`} width={1024} height={1024} loading="lazy" className="relative h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-2" />
                      </div>
                      <h3 className="mt-4 text-center font-display text-xl font-semibold text-foreground">{a.name}</h3>
                      <p className="mt-2 text-center text-sm text-muted-foreground">{a.desc}</p>
                      <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-purple px-5 py-2.5 text-sm font-semibold text-white shadow-button transition-transform hover:scale-105">Pedir açaí</a>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-4 lg:-left-12 bg-card" />
              <CarouselNext className="hidden md:flex -right-4 lg:-right-12 bg-card" />
            </Carousel>
          </div>
        </div>
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
      <footer className="bg-foreground px-6 py-14 text-background/90">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div className="flex items-center gap-3">
            <img src={mascot} alt="Ayla Sorvetes" width={64} height={64} className="h-14 w-14" />
            <div>
              <p className="font-display text-2xl font-bold text-white">Ayla Sorvetes</p>
              <p className="text-xs text-white/60">Feito com muito amor 💜</p>
            </div>
          </div>

          <div className="flex gap-3">
            <a
              href="https://www.instagram.com/aylasorvetes?igsh=djlsZjQzM2t4bWs4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="Facebook"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Ayla Sorvetes. Todos os direitos reservados.
        </p>
      </footer>
    </main>
  );
}
