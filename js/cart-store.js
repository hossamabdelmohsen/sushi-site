import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase-config.js?v=20260701a";
import {
  findStorageKeys,
  getScopedStorageKey,
  readStorageArray,
  removeStorageKey,
  writeStorageArray
} from "./scoped-storage.js?v=20260701a";
import { trackAddToCart, trackRemoveFromCart } from "./analytics-events.js?v=20260701a";

const LEGACY_CART_STORAGE_KEY = "sushi-box-cart";
const GUEST_CART_STORAGE_PREFIX = "sushi-box-cart-guest-";
const CART_UPDATED_EVENT = "sushi-box:cart-updated";
const CART_USER_STORAGE_PREFIX = "sushi-box-cart-user-";
const REMOVED_PRODUCT_IDS = new Set([["zumra", "oyster", "sauce"].join("-") + "-280ml"]);
const REMOVED_PRODUCT_TERMS = [
  ["Zumra", "Oyster", "Sauce"].join(" ") + " - 280 ml",
  ["cdn", "zumra" + "food", "com"].join("."),
  ["zumra" + "food", "com"].join(".")
];

let activeUserId = "";
let pendingUserId = "";
let cartState = [];
let cartLoading = true;
let cartReady = false;
let authResolved = false;
let cartError = "";
let authWatcherStarted = false;
let cartInitRunId = 0;

function isCartDebugEnabled() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    return params.get("debugCart") === "true" ||
      window.localStorage.getItem("sushi-box-debug-cart") === "true";
  } catch (error) {
    return false;
  }
}

export function logCartDebug(message, detail = {}) {
  if (!isCartDebugEnabled()) {
    return;
  }

  console.info(`[cart-store] ${message}`, detail);
}

function isRemovedProductItem(item) {
  if (!item || REMOVED_PRODUCT_IDS.has(item.id)) {
    return true;
  }

  const haystack = `${item.name || ""} ${item.image || ""}`;
  return REMOVED_PRODUCT_TERMS.some((term) => haystack.includes(term));
}

function normalizeCartItem(item) {
  return {
    id: item.id || item.productId || "",
    name: item.name || "",
    price: Number(item.price) || 0,
    image: item.image || "",
    quantity: Math.max(1, Number(item.quantity) || 1)
  };
}

function sanitizeCartItems(items) {
  const sanitizedItems = [];
  const itemIndexes = new Map();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const normalizedItem = normalizeCartItem(item);
    if (!normalizedItem.id || isRemovedProductItem(normalizedItem)) {
      return;
    }

    const existingIndex = itemIndexes.get(normalizedItem.id);
    if (existingIndex === undefined) {
      itemIndexes.set(normalizedItem.id, sanitizedItems.length);
      sanitizedItems.push(normalizedItem);
      return;
    }

    sanitizedItems[existingIndex].quantity += normalizedItem.quantity;
  });

  return sanitizedItems;
}

function mergeCartItems(primaryItems, secondaryItems) {
  return sanitizeCartItems([...(primaryItems || []), ...(secondaryItems || [])]);
}

function overlayCartItems(primaryItems, fallbackItems) {
  const items = sanitizeCartItems(primaryItems);
  const itemIndexes = new Map(items.map((item, index) => [item.id, index]));

  sanitizeCartItems(fallbackItems).forEach((fallbackItem) => {
    const existingIndex = itemIndexes.get(fallbackItem.id);
    if (existingIndex === undefined) {
      itemIndexes.set(fallbackItem.id, items.length);
      items.push(fallbackItem);
      return;
    }

    items[existingIndex] = fallbackItem;
  });

  return items;
}

function getCartUnitCount(items) {
  return sanitizeCartItems(items).reduce((sum, item) => sum + item.quantity, 0);
}

function getGuestCartStorageKey() {
  return getScopedStorageKey("cart");
}

function getCleanUserId(userId) {
  return String(userId || "").trim();
}

function getAuthUserId() {
  return getCleanUserId(auth.currentUser && auth.currentUser.uid);
}

function getUserCartStorageKey(userId) {
  return `${CART_USER_STORAGE_PREFIX}${getCleanUserId(userId)}`;
}

function getActiveCartStorageContext(userId = activeUserId || pendingUserId || getAuthUserId()) {
  const cleanUserId = getCleanUserId(userId);
  if (cleanUserId) {
    return {
      key: getUserCartStorageKey(cleanUserId),
      scope: "user",
      userId: cleanUserId
    };
  }

  return {
    key: getGuestCartStorageKey(),
    scope: "guest",
    userId: ""
  };
}

function readCartFromKey(storageKey) {
  const items = readStorageArray(storageKey);
  const sanitizedItems = sanitizeCartItems(items);

  if (sanitizedItems.length !== items.length) {
    writeStorageArray(storageKey, sanitizedItems);
  }

  logCartDebug("read cart", {
    storageKey,
    productCount: sanitizedItems.length,
    unitCount: getCartUnitCount(sanitizedItems)
  });

  return sanitizedItems;
}

function writeCartToKey(storageKey, items, reason = "cart-write") {
  const sanitizedItems = sanitizeCartItems(items);
  const wrote = writeStorageArray(storageKey, sanitizedItems);

  logCartDebug("write cart", {
    reason,
    storageKey,
    wrote,
    productCount: sanitizedItems.length,
    unitCount: getCartUnitCount(sanitizedItems)
  });

  return sanitizedItems;
}

function readGuestCart() {
  const guestKey = getGuestCartStorageKey();
  const scopedItems = readCartFromKey(guestKey);
  const legacyItems = readStorageArray(LEGACY_CART_STORAGE_KEY);
  const sanitizedLegacyItems = sanitizeCartItems(legacyItems);
  const previousGuestKeys = findStorageKeys(GUEST_CART_STORAGE_PREFIX)
    .filter((storageKey) => storageKey !== guestKey);
  const previousGuestItems = previousGuestKeys.flatMap((storageKey) => readCartFromKey(storageKey));
  const mergedItems = mergeCartItems(scopedItems, [
    ...sanitizedLegacyItems,
    ...previousGuestItems
  ]);

  if (sanitizedLegacyItems.length || previousGuestItems.length) {
    writeCartToKey(guestKey, mergedItems, "legacy-guest-migration");
    removeStorageKey(LEGACY_CART_STORAGE_KEY);
    previousGuestKeys.forEach(removeStorageKey);
    logCartDebug("migrated legacy guest cart key", {
      fromKey: [LEGACY_CART_STORAGE_KEY, ...previousGuestKeys].join(", "),
      toKey: guestKey,
      migratedProductCount: sanitizedLegacyItems.length + previousGuestItems.length
    });
  } else if (legacyItems.length) {
    removeStorageKey(LEGACY_CART_STORAGE_KEY);
  }

  return mergedItems;
}

function readActiveCartFromStorage() {
  const context = getActiveCartStorageContext();
  return context.scope === "guest" ? readGuestCart() : readCartFromKey(context.key);
}

function buildCartDetail(context = getActiveCartStorageContext()) {
  return {
    cart: cartState.slice(),
    loading: cartLoading,
    ready: cartReady,
    authResolved,
    error: cartError,
    isGuest: context.scope === "guest",
    userId: context.userId,
    storageKey: context.key,
    storageScope: context.scope
  };
}

function emitCartUpdate(context = getActiveCartStorageContext()) {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, {
    detail: buildCartDetail(context)
  }));
}

function setCartState(items, options = {}) {
  const context = options.context || getActiveCartStorageContext();
  cartState = sanitizeCartItems(items);
  cartLoading = Boolean(options.loading);
  cartReady = Boolean(options.ready);
  cartError = options.error || "";

  if (options.persist) {
    writeCartToKey(context.key, cartState, options.reason || "set-cart-state");
  }

  logCartDebug("cart state changed", {
    reason: options.reason || "state",
    authResolved,
    ready: cartReady,
    loading: cartLoading,
    storageKey: context.key,
    storageScope: context.scope,
    userId: context.userId,
    productCount: cartState.length,
    unitCount: getCartUnitCount(cartState)
  });

  emitCartUpdate(context);
  return cartState;
}

function migrateGuestCartToUser(userId) {
  const guestKey = getGuestCartStorageKey();
  const userKey = getUserCartStorageKey(userId);
  const storedGuestCart = readGuestCart();
  const guestCart = overlayCartItems(storedGuestCart, !activeUserId ? cartState : []);
  const userCart = readCartFromKey(userKey);

  if (!guestCart.length) {
    return userCart;
  }

  const mergedCart = mergeCartItems(userCart, guestCart);
  writeCartToKey(userKey, mergedCart, "guest-to-user-migration");
  removeStorageKey(guestKey);
  logCartDebug("migrated guest cart into user cart", {
    fromKey: guestKey,
    toKey: userKey,
    userId,
    guestProductCount: guestCart.length,
    mergedProductCount: mergedCart.length,
    mergedUnitCount: getCartUnitCount(mergedCart)
  });

  return mergedCart;
}

function handleSignedOutCart(previousUserId) {
  const previousContext = previousUserId
    ? getActiveCartStorageContext(previousUserId)
    : getActiveCartStorageContext();

  setCartState(cartState, {
    loading: true,
    ready: false,
    context: previousContext,
    reason: "auth-signout-before-guest-switch"
  });

  activeUserId = "";
  pendingUserId = "";

  const guestContext = getActiveCartStorageContext("");
  const guestCart = readGuestCart();
  setCartState(guestCart, {
    loading: false,
    ready: true,
    context: guestContext,
    reason: "auth-signed-out"
  });
}

function handleSignedInCart(userId, previousUserId, runId) {
  pendingUserId = userId;
  const userContext = getActiveCartStorageContext(userId);

  setCartState(cartState, {
    loading: true,
    ready: false,
    context: userContext,
    reason: "auth-signed-in-start"
  });

  const userCart = migrateGuestCartToUser(userId);
  if (runId !== cartInitRunId || pendingUserId !== userId) {
    return;
  }

  activeUserId = userId;
  pendingUserId = "";

  setCartState(userCart, {
    loading: false,
    ready: true,
    context: userContext,
    reason: previousUserId === userId ? "auth-user-refresh" : "auth-user-ready"
  });
}

function ensureAuthWatcher() {
  if (authWatcherStarted) {
    return;
  }

  authWatcherStarted = true;

  onAuthStateChanged(auth, (user) => {
    const previousUserId = activeUserId;
    const nextUserId = getCleanUserId(user && user.uid);
    authResolved = true;
    cartInitRunId += 1;
    const runId = cartInitRunId;

    logCartDebug("auth state resolved", {
      currentAuthState: nextUserId ? "signed-in" : "signed-out",
      previousUserId,
      nextUserId,
      activeStorageKey: getActiveCartStorageContext(nextUserId).key
    });

    if (!nextUserId) {
      handleSignedOutCart(previousUserId);
      return;
    }

    handleSignedInCart(nextUserId, previousUserId, runId);
  }, (error) => {
    console.error("Auth listener for cart failed.", error);
    authResolved = true;
    cartInitRunId += 1;
    cartError = "We could not check your account. Your guest cart is still available on this device.";
    handleSignedOutCart(activeUserId);
  });
}

cartState = readGuestCart();
ensureAuthWatcher();

export function getCartStorageInfo() {
  const context = getActiveCartStorageContext();
  return {
    key: context.key,
    scope: context.scope,
    userId: context.userId,
    ready: cartReady,
    loading: cartLoading,
    authResolved
  };
}

export function getCart() {
  if (!cartReady) {
    return cartState.slice();
  }

  cartState = readActiveCartFromStorage();
  return cartState.slice();
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartSubtotal() {
  return getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

export function addCartItem(product, quantity = 1) {
  if (!product || !product.id) {
    return getCart();
  }

  const context = getActiveCartStorageContext();
  const cart = cartReady ? readCartFromKey(context.key) : cartState.slice();
  const nextQuantity = Math.max(1, Number(quantity) || 1);
  const existingItem = cart.find((item) => item.id === product.id);

  logCartDebug("addCartItem called", {
    productId: product.id,
    quantity: nextQuantity,
    authResolved,
    cartReady,
    currentAuthState: context.scope === "user" ? "signed-in" : "guest-or-pending",
    storageKey: context.key
  });

  if (existingItem) {
    existingItem.quantity += nextQuantity;
  } else {
    cart.push(normalizeCartItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: (product.images && product.images[0]) || product.image || "",
      quantity: nextQuantity
    }));
  }

  const nextCart = setCartState(cart, {
    loading: !cartReady,
    ready: cartReady,
    persist: true,
    context,
    reason: "addCartItem"
  });
  trackAddToCart(product, nextQuantity);
  return nextCart;
}

export function updateCartItemQuantity(productId, quantity) {
  const normalizedQuantity = Math.max(0, Number(quantity) || 0);
  const context = getActiveCartStorageContext();
  const cart = cartReady ? readCartFromKey(context.key) : cartState.slice();
  const itemIndex = cart.findIndex((item) => item.id === productId);

  if (itemIndex === -1) {
    return cart;
  }

  const previousItem = { ...cart[itemIndex] };
  const previousQuantity = Math.max(1, Number(previousItem.quantity) || 1);

  if (normalizedQuantity === 0) {
    cart.splice(itemIndex, 1);
  } else {
    cart[itemIndex].quantity = normalizedQuantity;
  }

  const nextCart = setCartState(cart, {
    loading: false,
    ready: cartReady,
    persist: true,
    context,
    reason: "updateCartItemQuantity"
  });

  // Track GA4 ecommerce deltas after the cart write succeeds.
  const quantityDelta = normalizedQuantity - previousQuantity;
  if (quantityDelta > 0) {
    trackAddToCart(previousItem, quantityDelta);
  } else if (quantityDelta < 0) {
    trackRemoveFromCart(previousItem, Math.abs(quantityDelta));
  }

  return nextCart;
}

export function removeCartItem(productId) {
  return updateCartItemQuantity(productId, 0);
}

function clearActiveCart(reason) {
  const context = getActiveCartStorageContext();
  const previousCart = getCart();
  const nextCart = setCartState([], {
    loading: false,
    ready: cartReady,
    persist: true,
    context,
    reason
  });

  // Manual clear removes every cart line; payment-confirmed clears are not user removals.
  if (reason === "manual-clear") {
    previousCart.forEach((item) => {
      trackRemoveFromCart(item, Math.max(1, Number(item.quantity) || 1));
    });
  }

  return nextCart;
}

export function clearCartByUserAction() {
  return clearActiveCart("manual-clear");
}

export function clearCart() {
  return clearActiveCart("confirmed-payment-clear");
}

export function isCartReady() {
  return cartReady;
}

export function getCartStatus() {
  const context = getActiveCartStorageContext();
  return buildCartDetail(context);
}

export function whenCartReady() {
  if (cartReady) {
    return Promise.resolve(getCart());
  }

  return new Promise((resolve) => {
    const handleUpdate = (event) => {
      const detail = event.detail || {};
      if (!detail.ready) {
        return;
      }

      window.removeEventListener(CART_UPDATED_EVENT, handleUpdate);
      resolve(Array.isArray(detail.cart) ? detail.cart : getCart());
    };

    window.addEventListener(CART_UPDATED_EVENT, handleUpdate);
  });
}

export function subscribeToCart(callback) {
  const handleUpdate = (event) => {
    callback(event.detail.cart, event.detail);
  };

  window.addEventListener(CART_UPDATED_EVENT, handleUpdate);
  const status = getCartStatus();
  callback(status.cart, status);

  return () => {
    window.removeEventListener(CART_UPDATED_EVENT, handleUpdate);
  };
}
