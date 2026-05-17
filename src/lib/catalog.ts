// Catálogo local (fallback) — usado quando o backend está vazio/offline.
// Importado pela home e pelo /cardapio para manter os produtos consistentes.

import tubLimaoSuico from "@/assets/tub-3d-limao-suico.jpg";
import tubAbacaxiVinho from "@/assets/tub-3d-abacaxi-vinho.jpg";
import tubAbacaxi from "@/assets/tub-3d-abacaxi.jpg";
import tubPistache from "@/assets/tub-3d-pistache.jpg";
import tubDoceLeite from "@/assets/tub-3d-doce-leite.jpg";
import tubNapolitano from "@/assets/tub-3d-napolitano.jpg";
import tubChocolate from "@/assets/tub-3d-chocolate.jpg";
import tubMorango from "@/assets/tub-3d-morango.jpg";
import tubBrigadeiro from "@/assets/tub-3d-brigadeiro.jpg";
import tubCoco from "@/assets/tub-3d-coco.jpg";
import tubMilho from "@/assets/tub-3d-milho.jpg";
import tubIogurte from "@/assets/tub-iogurte-grego.webp";
import tubFlocos from "@/assets/tub-flocos.webp";
import tubNinho from "@/assets/tub-ninho-trufado.webp";
import cupNinho from "@/assets/cup-3d-ninho.webp";
import cupBrigadeiro from "@/assets/cup-3d-brigadeiro.webp";
import cupDoceLeite from "@/assets/cup-3d-doce-leite.webp";
import cupLimao from "@/assets/cup-3d-limao.webp";
import cupLeiteCondensado from "@/assets/cup-3d-leite-condensado.webp";
import cupAcai from "@/assets/cup-3d-acai.webp";
import cupChocolate from "@/assets/cup-3d-chocolate.jpg";
import cupMorango from "@/assets/cup-3d-morango.jpg";
import cupMilho from "@/assets/cup-3d-milho.jpg";
import cupAbacaxiVinho from "@/assets/cup-3d-abacaxi-vinho.jpg";
import cupAbacaxi from "@/assets/cup-3d-abacaxi.jpg";
import cupChocoMaltine from "@/assets/cup-3d-choco-maltine.jpg";
import popsicleLimao from "@/assets/popsicle-limao.webp";
import popsicleFlocos from "@/assets/popsicle-flocos.webp";
import popsicleKiwi from "@/assets/popsicle-kiwi.webp";
import popsicleCoco from "@/assets/popsicle-coco.webp";
import popsicleAcai from "@/assets/popsicle-acai.webp";
import popsicleTentacao from "@/assets/popsicle-tentacao.webp";
import popsicle3dLeitinho from "@/assets/popsicle-3d-leitinho.jpg";
import popsicle3dManga from "@/assets/popsicle-3d-manga.jpg";
import popsicle3dSkimoCoco from "@/assets/popsicle-3d-skimo-coco.jpg";
import popsicle3dMaracuja from "@/assets/popsicle-3d-maracuja.jpg";
import popsicle3dChiclete from "@/assets/popsicle-3d-chiclete.jpg";
import popsicle3dGroselha from "@/assets/popsicle-3d-groselha.jpg";
import popsicle3dChocolate from "@/assets/popsicle-3d-chocolate.jpg";
import acai1L from "@/assets/acai-1l.webp";
import acai5L from "@/assets/acai-5l.webp";

export const TUB_PRICE = 35.0;
export const CUP_PRICE = 12.0;
export const POPSICLE_PRICE = 7.0;

export const tubs = [
  { name: "Limão Suíço", img: tubLimaoSuico },
  { name: "Abacaxi ao Vinho", img: tubAbacaxiVinho },
  { name: "Abacaxi", img: tubAbacaxi },
  { name: "Pistache", img: tubPistache },
  { name: "Doce de Leite", img: tubDoceLeite },
  { name: "Napolitano", img: tubNapolitano },
  { name: "Chocolate", img: tubChocolate },
  { name: "Morango", img: tubMorango },
  { name: "Brigadeiro", img: tubBrigadeiro },
  { name: "Coco", img: tubCoco },
  { name: "Milho", img: tubMilho },
  { name: "Iogurte Grego com Frutas Silvestres", img: tubIogurte },
  { name: "Flocos", img: tubFlocos },
  { name: "Ninho Trufado", img: tubNinho },
].map((t) => ({ ...t, price: TUB_PRICE, desc: undefined as string | undefined }));

export const cups = [
  { name: "Ninho Trufado", desc: "Cremoso leitinho com pedaços de trufa.", img: cupNinho },
  { name: "Brigadeiro", desc: "Chocolate puro com granulado crocante.", img: cupBrigadeiro },
  { name: "Doce de Leite", desc: "Caramelo cremoso que derrete na boca.", img: cupDoceLeite },
  { name: "Limão Suíço", desc: "Refrescante e cítrico, na medida certa.", img: cupLimao },
  { name: "Leite Condensado", desc: "Doce, cremoso e irresistível.", img: cupLeiteCondensado },
  { name: "Chocolate", desc: "Chocolate intenso e cremoso.", img: cupChocolate },
  { name: "Morango", desc: "Morangos frescos em creme suave.", img: cupMorango },
  { name: "Milho", desc: "Sabor caseiro e cremoso de milho verde.", img: cupMilho },
  { name: "Abacaxi ao Vinho", desc: "Tropical com toque sofisticado.", img: cupAbacaxiVinho },
  { name: "Abacaxi", desc: "Refrescante e tropical.", img: cupAbacaxi },
  { name: "Choco Maltine", desc: "Chocolate com crocância de maltine.", img: cupChocoMaltine },
].map((c) => ({ ...c, price: CUP_PRICE }));

export const popsicles = [
  { name: "Flocos", desc: "Cremoso com flocos crocantes de chocolate.", img: popsicleFlocos },
  { name: "Coco Branco", desc: "Tropical e refrescante com coco fresco.", img: popsicleCoco },
  { name: "Kiwi", desc: "Refrescante com pedaços de kiwi natural.", img: popsicleKiwi },
  { name: "Torta de Limão", desc: "Picolé com crocante de biscoito.", img: popsicleLimao },
  { name: "Tentação", desc: "Picolé cremoso de chocolate com cobertura irresistível.", img: popsicleTentacao },
  { name: "Leitinho", desc: "Picolé cremoso sabor leite condensado.", img: popsicle3dLeitinho },
  { name: "Manga", desc: "Tropical e refrescante com sabor intenso de manga.", img: popsicle3dManga },
  { name: "Skimo Coco", desc: "Coco com cobertura crocante de chocolate.", img: popsicle3dSkimoCoco },
  { name: "Maracujá", desc: "Azedinho na medida certa, super refrescante.", img: popsicle3dMaracuja },
  { name: "Chiclete", desc: "Sabor divertido de chiclete colorido.", img: popsicle3dChiclete },
  { name: "Groselha", desc: "Sabor clássico e marcante de groselha.", img: popsicle3dGroselha },
  { name: "Chocolate", desc: "Chocolate intenso e cremoso em picolé.", img: popsicle3dChocolate },
].map((p) => ({ ...p, price: POPSICLE_PRICE }));

export const acaiProducts = [
  { name: "Açaí Premium 1L", desc: "Pote com guaraná e frutos vermelhos.", img: acai1L, size: "1L", price: 45.0 },
  { name: "Açaí Premium 5L", desc: "Caixa família para festas e eventos.", img: acai5L, size: "5L", price: 180.0 },
  { name: "Copo de Açaí", desc: "Açaí cremoso individual com toque tropical.", img: cupAcai, size: "300ml", price: 15.0 },
  { name: "Picolé de Açaí", desc: "Intenso e cremoso, direto da Amazônia.", img: popsicleAcai, size: "Picolé", price: 8.0 },
];

export type CategoryKey = "tub" | "cup" | "popsicle" | "acai";

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  tub: "Potes 1,5L",
  cup: "Copos 300ml",
  popsicle: "Picolés",
  acai: "Açaí",
};

// Mapa de imagens locais por categoria + nome normalizado.
// Usado como fallback quando o backend não retorna `image`
// (ex.: produtos importados via /admin que só têm nome/preço/descrição).
const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

const imageMap: Record<string, string> = {};
tubs.forEach((p) => { imageMap[`tub::${norm(p.name)}`] = p.img; });
cups.forEach((p) => { imageMap[`cup::${norm(p.name)}`] = p.img; });
popsicles.forEach((p) => { imageMap[`popsicle::${norm(p.name)}`] = p.img; });
acaiProducts.forEach((p) => { imageMap[`acai::${norm(p.name)}`] = p.img; });

export function localImageFor(category: string | undefined, name: string | undefined): string | undefined {
  if (!name) return undefined;
  const cat = (category ?? "").toLowerCase();
  const catKey =
    cat === "pote" ? "tub" :
    cat === "copo" ? "cup" :
    cat === "picole" || cat === "picolé" ? "popsicle" :
    cat === "açaí" ? "acai" :
    cat;
  return imageMap[`${catKey}::${norm(name)}`];
}
