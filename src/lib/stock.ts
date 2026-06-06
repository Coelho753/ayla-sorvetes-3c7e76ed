// Estoque local (fallback offline). Armazena quantidades por productId no
// localStorage. O admin pode definir o estoque na tela de Estoque e ele
// é debitado quando um pedido é fechado (carrinho) ou cadastrado por fora
// no painel financeiro. Quando o backend expuser /products com `stock`,
// o front passa a usar aquele valor (override local apenas se existir).

const KEY = "ayla.stock.v1";

type StockMap = Record<string, number>;

function read(): StockMap {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as StockMap; } catch { return {}; }
}
function write(s: StockMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("stock:changed"));
}

export function getStock(id: string | number): number | null {
  const s = read();
  const v = s[String(id)];
  return typeof v === "number" ? v : null;
}

export function setStock(id: string | number, qty: number) {
  const s = read();
  s[String(id)] = Math.max(0, Math.floor(qty));
  write(s);
}

export function clearStock(id: string | number) {
  const s = read();
  delete s[String(id)];
  write(s);
}

/** Debita uma lista de itens vendidos. Ignora ids sem estoque definido. */
export function debitStock(items: Array<{ id?: string | number; name?: string; quantity: number }>) {
  const s = read();
  let changed = false;
  for (const it of items) {
    const k = it.id != null ? String(it.id) : null;
    if (k && typeof s[k] === "number") {
      s[k] = Math.max(0, s[k] - (Number(it.quantity) || 0));
      changed = true;
    }
  }
  if (changed) write(s);
}

export function getAllStock(): StockMap {
  return read();
}