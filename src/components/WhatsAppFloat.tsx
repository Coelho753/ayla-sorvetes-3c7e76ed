import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "@/lib/whatsapp";

export function WhatsAppFloat() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Pedir pelo WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-whatsapp px-5 py-4 text-whatsapp-foreground shadow-button transition-transform hover:scale-110 animate-float-slow"
      style={{ ["--r" as string]: "0deg" }}
    >
      <MessageCircle className="h-6 w-6" strokeWidth={2.5} />
      <span className="hidden font-display font-semibold sm:inline">Pedir agora</span>
      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-bubble animate-sparkle" />
    </a>
  );
}
