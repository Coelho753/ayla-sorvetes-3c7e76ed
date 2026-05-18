import { WHATSAPP_PHONE } from "@/config/api";

export const WHATSAPP_NUMBER = WHATSAPP_PHONE;
export const WHATSAPP_MESSAGE =
  "Olá! Quero pedir um sorvete 🍦\n_(Pedido feito pelo aplicativo Ayla Sorvetes)_";
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
