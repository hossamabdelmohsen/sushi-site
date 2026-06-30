import {
  collection,
  getDocs,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase-config.js?v=20260701a";
import {
  addCartItem,
  getCart,
  updateCartItemQuantity
} from "./cart-store.js?v=20260701a";
import { emitToast } from "./ui-utils.js?v=20260701a";

export const SUSHI_ENABLE_INVENTORY = true;

const INVENTORY_COLLECTION = "productsInventory";
const INVENTORY_UPDATED_EVENT = "sushi-box:inventory-updated";

let inventoryEnabled = SUSHI_ENABLE_INVENTORY === true;
let inventoryConfigLoaded = false;
let inventoryConfigPromise = null;
let inventoryMap = new Map();
let inventoryLoaded = false;
let inventoryLoadingPromise = null;
let unsubscribeInventory = null;

export function isInventoryEnabled() {
  if (typeof window !== "undefined" && typeof window.SUSHI_ENABLE_INVENTORY === "boolean") {
    return window.SUSHI_ENABLE_INVENTORY;
  }

  return inventoryEnabled;
}

function setInventoryEnabled(isEnabled) {
  inventoryEnabled = isEnabled === true;
  inventoryConfigLoaded = true;

  if (!inventoryEnabled) {
    if (unsubscribeInventory) {
      unsubscribeInventory();
      unsubscribeInventory = null;
    }
    inventoryMap = new Map();
    inventoryLoaded = true;
    publishInventoryUpdate();
  }
}

async function loadInventoryConfig(options = {}) {
  if (typeof window !== "undefined" && typeof window.SUSHI_ENABLE_INVENTORY === "boolean") {
    setInventoryEnabled(window.SUSHI_ENABLE_INVENTORY);
    return inventoryEnabled;
  }

  if (inventoryConfigLoaded && !options.force) {
    return inventoryEnabled;
  }

  if (inventoryConfigPromise && !options.force) {
    return inventoryConfigPromise;
  }

  inventoryConfigPromise = fetch("/api/public-actions?action=inventoryConfig", { cache: "no-store" })
    .then((response) => response.ok ? response.json() : null)
    .then((body) => {
      if (body && typeof body.inventoryEnabled === "boolean") {
        setInventoryEnabled(body.inventoryEnabled);
      } else {
        inventoryConfigLoaded = true;
      }
      return inventoryEnabled;
    })
    .catch((error) => {
      console.warn("Inventory feature flag could not be loaded; using bundled default.", error);
      inventoryConfigLoaded = true;
      return inventoryEnabled;
    })
    .finally(() => {
      inventoryConfigPromise = null;
    });

  return inventoryConfigPromise;
}

function normalizeInventoryRecord(slug, data = {}) {
  return {
    slug: String(data.slug || slug || "").trim(),
    stockQuantity: Math.max(0, Math.trunc(Number(data.stockQuantity) || 0)),
    trackStock: data.trackStock === true,
    lowStockThreshold: Math.max(0, Math.trunc(Number(data.lowStockThreshold) || 0)),
    updatedAt: data.updatedAt || null,
    updatedBy: String(data.updatedBy || "").trim()
  };
}

function publishInventoryUpdate() {
  window.dispatchEvent(new CustomEvent(INVENTORY_UPDATED_EVENT, {
    detail: {
      inventory: new Map(inventoryMap),
      loaded: inventoryLoaded
    }
  }));
}

function setInventoryFromSnapshot(snapshot) {
  const nextMap = new Map();
  snapshot.forEach((docSnapshot) => {
    nextMap.set(docSnapshot.id, normalizeInventoryRecord(docSnapshot.id, docSnapshot.data()));
  });
  inventoryMap = nextMap;
  inventoryLoaded = true;
  publishInventoryUpdate();
  return inventoryMap;
}

export async function loadInventoryOnce(options = {}) {
  await loadInventoryConfig(options);

  if (!isInventoryEnabled()) {
    inventoryLoaded = true;
    inventoryMap = new Map();
    return inventoryMap;
  }

  if (inventoryLoaded && !options.force) {
    return inventoryMap;
  }

  if (inventoryLoadingPromise && !options.force) {
    return inventoryLoadingPromise;
  }

  inventoryLoadingPromise = getDocs(collection(db, INVENTORY_COLLECTION))
    .then((snapshot) => setInventoryFromSnapshot(snapshot))
    .finally(() => {
      inventoryLoadingPromise = null;
    });

  return inventoryLoadingPromise;
}

export function subscribeToInventory(callback, onError) {
  const handleUpdate = (event) => {
    callback(event.detail.inventory, {
      loaded: event.detail.loaded,
      enabled: isInventoryEnabled()
    });
  };

  window.addEventListener(INVENTORY_UPDATED_EVENT, handleUpdate);

  loadInventoryConfig()
    .then(() => {
      if (!isInventoryEnabled()) {
        inventoryLoaded = true;
        inventoryMap = new Map();
        callback(new Map(), { loaded: true, enabled: false });
        return;
      }

      if (!unsubscribeInventory) {
        unsubscribeInventory = onSnapshot(
          collection(db, INVENTORY_COLLECTION),
          (snapshot) => setInventoryFromSnapshot(snapshot),
          (error) => {
            console.error("Inventory listener failed.", error);
            if (typeof onError === "function") {
              onError(error);
            }
          }
        );
      }

      if (inventoryLoaded) {
        callback(new Map(inventoryMap), { loaded: true, enabled: true });
      }
    })
    .catch((error) => {
      console.error("Inventory subscription setup failed.", error);
      if (typeof onError === "function") {
        onError(error);
      }
    });

  return () => window.removeEventListener(INVENTORY_UPDATED_EVENT, handleUpdate);
}

export function getInventoryRecord(productId) {
  return inventoryMap.get(String(productId || "").trim()) || null;
}

export function isStockTracked(record) {
  return isInventoryEnabled() && Boolean(record && record.trackStock);
}

export function getAvailableStock(productId) {
  const record = getInventoryRecord(productId);
  return isStockTracked(record) ? record.stockQuantity : Infinity;
}

export function getInventoryStatus(productId) {
  const record = getInventoryRecord(productId);

  if (!isStockTracked(record)) {
    return {
      tracked: false,
      available: Infinity,
      isOutOfStock: false,
      isLowStock: false,
      message: ""
    };
  }

  const available = record.stockQuantity;
  const threshold = record.lowStockThreshold;
  const isOutOfStock = available <= 0;
  const isLowStock = !isOutOfStock && available <= threshold;

  return {
    tracked: true,
    available,
    isOutOfStock,
    isLowStock,
    message: isOutOfStock ? "Out of stock" : isLowStock ? `Only ${available} left` : ""
  };
}

function getAvailableMessage(available) {
  if (available <= 0) {
    return "Out of stock.";
  }

  return `Only ${available} item${available === 1 ? "" : "s"} available.`;
}

function getCartQuantity(productId) {
  return getCart().reduce((sum, item) => (
    item.id === productId ? sum + (Number(item.quantity) || 0) : sum
  ), 0);
}

export async function addCartItemWithInventory(product, quantity = 1, options = {}) {
  if (!product || !product.id) {
    return { ok: false, cart: getCart() };
  }

  await loadInventoryOnce();

  const requestedQuantity = Math.max(1, Number(quantity) || 1);
  const status = getInventoryStatus(product.id);
  const nextQuantity = getCartQuantity(product.id) + requestedQuantity;

  if (status.tracked && nextQuantity > status.available) {
    const message = status.available <= 0 ? "Out of stock" : getAvailableMessage(status.available);
    emitToast(message, "error");
    return { ok: false, cart: getCart(), message };
  }

  const cart = addCartItem(product, requestedQuantity);
  if (options.successMessage) {
    emitToast(options.successMessage, "success");
  }
  return { ok: true, cart };
}

export async function updateCartItemQuantityWithInventory(productId, quantity) {
  const cleanProductId = String(productId || "").trim();
  const normalizedQuantity = Math.max(0, Number(quantity) || 0);

  if (!cleanProductId) {
    return getCart();
  }

  await loadInventoryOnce();

  const status = getInventoryStatus(cleanProductId);
  if (status.tracked && normalizedQuantity > status.available) {
    const message = getAvailableMessage(status.available);
    emitToast(message, "error");
    return getCart();
  }

  return updateCartItemQuantity(cleanProductId, normalizedQuantity);
}

export async function validateCartInventory(cartItems = getCart()) {
  if (!isInventoryEnabled()) {
    return { valid: true, items: [] };
  }

  await loadInventoryOnce({ force: true });

  const issues = (Array.isArray(cartItems) ? cartItems : [])
    .map((item) => {
      const status = getInventoryStatus(item.id);
      const quantity = Math.max(1, Number(item.quantity) || 1);

      if (!status.tracked || quantity <= status.available) {
        return null;
      }

      return {
        productId: item.id,
        name: item.name || item.id,
        requestedQuantity: quantity,
        available: status.available
      };
    })
    .filter(Boolean);

  if (!issues.length) {
    return { valid: true, items: [] };
  }

  const firstIssue = issues[0];
  const message = firstIssue.available <= 0
    ? `${firstIssue.name} is out of stock.`
    : `${firstIssue.name}: ${getAvailableMessage(firstIssue.available)}`;

  return {
    valid: false,
    message,
    items: issues
  };
}
