import { useEffect } from "react";

/**
 * Pre-carrega imagens e mantém referências fortes para evitar
 * que o navegador descarte do cache em sessões longas.
 */
const imageCache: HTMLImageElement[] = [];

export function preloadImages(urls: string[]) {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (imageCache.some((i) => i.src.endsWith(url))) continue;
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = url;
    imageCache.push(img);
  }
}

export function useImagePreload(urls: string[]) {
  useEffect(() => {
    // Espera o primeiro paint para não competir com o LCP
    const id = window.requestIdleCallback
      ? window.requestIdleCallback(() => preloadImages(urls), { timeout: 1500 })
      : window.setTimeout(() => preloadImages(urls), 600);
    return () => {
      if (window.cancelIdleCallback && typeof id === "number") window.cancelIdleCallback(id);
      else window.clearTimeout(id as number);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
