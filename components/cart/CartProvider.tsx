"use client";

import {
  createContext,
  use,
  useCallback,
  useState,
  useSyncExternalStore,
} from "react";
import {
  addItem as addItemAction,
  applyDiscount as applyDiscountAction,
  getCart,
  removeItem as removeItemAction,
  updateQuantity as updateQuantityAction,
} from "@/app/actions/cart";
import { EMPTY_CART, type CartResult, type CartView } from "@/lib/cart-types";

/**
 * A readable companion to the HttpOnly cart cookie, holding nothing but the
 * item count. It exists so the header badge can paint immediately without a
 * request: the marketing pages are static, and fetching a cart on every one of
 * them would put a round trip in front of a page that otherwise needs none.
 *
 * It is advisory. Nothing is priced or authorised from it — the real cart is
 * loaded from the server the moment anyone opens the bag.
 */
export const BAG_COUNT_COOKIE = "ff_bag";

function readCountCookie(): number {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${BAG_COUNT_COOKIE}=(\\d+)`),
  );
  return match ? Number(match[1]) : 0;
}

/**
 * document.cookie is external mutable state, so it is read through
 * useSyncExternalStore rather than copied into state inside an effect. That
 * keeps the server snapshot (0) and the client's first paint consistent
 * instead of trading a hydration mismatch for a cascading render.
 */
const cookieStore = {
  listeners: new Set<() => void>(),
  subscribe(listener: () => void) {
    cookieStore.listeners.add(listener);
    return () => cookieStore.listeners.delete(listener);
  },
  notify() {
    for (const listener of cookieStore.listeners) listener();
  },
};

type CartContextValue = {
  /** Server truth. EMPTY until something loads it — see `loaded`. */
  cart: CartView;
  loaded: boolean;
  count: number;
  pending: boolean;
  error: string | null;
  open: boolean;
  /** Opens the bag and loads it if nothing has yet. */
  openBag: () => void;
  closeBag: () => void;
  add: (variantId: string, quantity?: number) => Promise<void>;
  setQuantity: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const value = use(CartContext);
  if (!value) throw new Error("useCart must be used inside CartProvider");
  return value;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartView>(EMPTY_CART);
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const cookieCount = useSyncExternalStore(
    cookieStore.subscribe,
    readCountCookie,
    () => 0,
  );

  const run = useCallback(async (action: () => Promise<CartResult>) => {
    setPending(true);
    setError(null);
    try {
      const result = await action();
      setCart(result.cart);
      setLoaded(true);
      // The action wrote the count cookie; tell anything reading it.
      cookieStore.notify();
      if (!result.ok) setError(result.error);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }, []);

  /**
   * Loading happens where the user asks for it — in the handler that opens the
   * bag — rather than in an effect watching `open`. Opening is an event, not a
   * synchronisation with something outside React, and fetching in an effect
   * would render once with an empty bag before replacing it.
   */
  const load = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const fresh = await getCart();
      setCart(fresh);
      setLoaded(true);
    } catch {
      setError("Could not load your bag.");
    } finally {
      setPending(false);
    }
  }, []);

  const value: CartContextValue = {
    cart,
    loaded,
    count: loaded ? cart.summary.itemCount : cookieCount,
    pending,
    error,
    open,
    openBag: () => {
      setOpen(true);
      // The bag may already be known — from a previous action, or from the
      // cart page having handed the provider its own copy.
      if (!loaded) void load();
    },
    closeBag: () => setOpen(false),
    add: async (variantId, quantity = 1) => {
      // No load needed: the action returns the whole cart anyway.
      setOpen(true);
      await run(() => addItemAction(variantId, quantity));
    },
    setQuantity: async (itemId, quantity) =>
      run(() => updateQuantityAction(itemId, quantity)),
    remove: async (itemId) => run(() => removeItemAction(itemId)),
    applyDiscount: async (code) => run(() => applyDiscountAction(code)),
  };

  return <CartContext value={value}>{children}</CartContext>;
}
