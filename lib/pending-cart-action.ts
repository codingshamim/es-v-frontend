/**
 * Pending cart action stored before login redirect.
 * After successful login, the action is executed and user is navigated.
 */
export const PENDING_CART_KEY = "es-fitt-pending-cart";

export interface ProductSelection {
  productId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  colorName: string;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
}

export type PendingActionType = "addToCart" | "buyNow";

export interface PendingCartAction {
  action: PendingActionType;
  selection: ProductSelection;
}

export function savePendingCartAction(data: PendingCartAction): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_CART_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getPendingCartAction(): PendingCartAction | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_CART_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingCartAction;
  } catch {
    return null;
  }
}

export function clearPendingCartAction(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_CART_KEY);
  } catch {
    // ignore
  }
}
