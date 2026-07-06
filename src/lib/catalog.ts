// Catálogo agora vive 100% no backend (/products). Este arquivo mantém
// apenas labels, enums e preços default (usados quando o backend retorna 0).

export const TUB_PRICE = 14.0;
export const CUP_PRICE = 5.0;
export const POPSICLE_AGUA_PRICE = 1.5;
export const POPSICLE_LEITE_PRICE = 2.0;
export const POPSICLE_PRICE = POPSICLE_AGUA_PRICE;
export const POPSICLE_PREMIUM_PRICE = 5.0;
export const POPSICLE_SKI_PRICE = 4.0;

export type PopsicleSub = "agua" | "leite" | "premium" | "ski";
export const POPSICLE_SUB_LABEL: Record<PopsicleSub, string> = {
  agua: "Picolé base água",
  leite: "Picolé base leite",
  premium: "Picolé Premium",
  ski: "Picolé Ski",
};

export type CategoryKey = "tub" | "cup" | "popsicle" | "acai";
export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  tub: "Potes 1,5L",
  cup: "Copos 300ml",
  popsicle: "Picolés",
  acai: "Açaí",
};
