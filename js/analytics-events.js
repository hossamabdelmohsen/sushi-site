import { getProductById } from "./product-catalog.js?v=20260701a";
import { logEvent } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { analyticsReady } from "./firebase-config.js?v=20260701a";

const CURRENCY = "EGP";
const PURCHASED_ORDERS_KEY = "sushi-box-ga4-purchases";
const BEGIN_CHECKOUT_KEY = "sushi-box-ga4-begin-checkout";
const SHIPPING_INFO_KEY = "sushi-box-ga4-shipping-info";
const PAYMENT_INFO_KEY = "sushi-box-ga4-payment-info";
const MAX_PARAM_LENGTH = 180;

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function getStorage(storageType) {
  try {
    return storageType === "session" ? window.sessionStorage : window.localStorage;
  } catch (error) {
    return null;
  }
}

function readStoredList(key, storageType = "local") {
  const storage = getStorage(storageType);
  if (!storage) {
    return [];
  }

  try {
    const parsed = JSON.parse(storage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeStoredList(key, values, storageType = "local") {
  const storage = getStorage(storageType);
  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(values.slice(-50)));
  } catch (error) {}
}

function getProductForItem(item) {
  const productId = item?.slug || item?.id || item?.productId || item?.item_id || "";
  const catalogProduct = productId ? getProductById(productId) : null;
  return catalogProduct && catalogProduct.id === productId ? catalogProduct : null;
}

function getItemPrice(item) {
  return toNumber(item?.price ?? item?.salePrice ?? item?.unitPrice ?? (toNumber(item?.unitAmountCents) / 100));
}

function getItemQuantity(item, quantity) {
  return Math.max(1, Number(quantity ?? item?.quantity) || 1);
}

function sanitizeParamValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value).slice(0, MAX_PARAM_LENGTH);
}

function cleanParams(params = {}) {
  return Object.entries(params).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null || value === "") {
      return accumulator;
    }

    accumulator[key] = typeof value === "string" ? sanitizeParamValue(value) : value;
    return accumulator;
  }, {});
}

function getEventSignature(eventName, payload = {}) {
  return JSON.stringify([
    eventName,
    payload.transaction_id || "",
    payload.search_term || "",
    payload.percent_scrolled || "",
    payload.banner_id || "",
    payload.item_id || "",
    Array.isArray(payload.items)
      ? payload.items.map((item) => [item.item_id, item.quantity, item.price])
      : []
  ]);
}

function trackOnce(storageKey, storageType, signature, sendEvent) {
  if (!signature) {
    return sendEvent();
  }

  const trackedSignatures = readStoredList(storageKey, storageType);
  if (trackedSignatures.includes(signature)) {
    return false;
  }

  const tracked = sendEvent();
  if (tracked) {
    trackedSignatures.push(signature);
    writeStoredList(storageKey, trackedSignatures, storageType);
  }

  return tracked;
}

export function buildGA4Item(item, quantity) {
  if (!item) {
    return null;
  }

  const product = getProductForItem(item);
  const itemId = item.slug || item.id || item.productId || item.item_id || product?.id || "";
  const itemName = item.name || item.item_name || product?.name || "";

  if (!itemId && !itemName) {
    return null;
  }

  return {
    item_id: itemId,
    item_name: itemName,
    item_category: item.category || item.item_category || product?.category || "Sushi Box",
    price: getItemPrice(item || product),
    quantity: getItemQuantity(item, quantity)
  };
}

export function buildGA4Items(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => buildGA4Item(item))
    .filter(Boolean);
}

export function getCartValue(items = []) {
  return buildGA4Items(items).reduce((sum, item) => sum + (toNumber(item.price) * getItemQuantity(item)), 0);
}

export function trackGA4Event(eventName, params = {}) {
  try {
    if (typeof window === "undefined") {
      return false;
    }

    const payload = cleanParams(params);
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, payload);
      return true;
    }

    if (analyticsReady && typeof analyticsReady.then === "function") {
      analyticsReady.then((analytics) => {
        if (analytics) {
          logEvent(analytics, eventName, payload);
        }
      }).catch(() => {});
      return true;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...payload
    });
    return true;
  } catch (error) {
    return false;
  }
}

export function trackViewItem(product) {
  const item = buildGA4Item(product, 1);
  if (!item) {
    return;
  }

  trackGA4Event("view_item", {
    currency: CURRENCY,
    value: toNumber(item.price),
    items: [item]
  });
}

export function trackAddToCart(product, quantity = 1) {
  const item = buildGA4Item(product, quantity);
  if (!item) {
    return;
  }

  trackGA4Event("add_to_cart", {
    currency: CURRENCY,
    value: toNumber(item.price) * getItemQuantity(item),
    items: [item]
  });
}

export function trackRemoveFromCart(product, quantity = 1) {
  const item = buildGA4Item(product, quantity);
  if (!item) {
    return;
  }

  // GA4 ecommerce removal event; fired only for explicit cart quantity decreases/removals.
  trackGA4Event("remove_from_cart", {
    currency: CURRENCY,
    value: toNumber(item.price) * getItemQuantity(item),
    items: [item]
  });
}

export function trackViewCart(cartItems = []) {
  const items = buildGA4Items(cartItems);

  trackGA4Event("view_cart", {
    currency: CURRENCY,
    value: getCartValue(items),
    items
  });
}

export function trackBeginCheckout(cartItems = []) {
  const items = buildGA4Items(cartItems);
  const signature = JSON.stringify(items.map((item) => [
    item.item_id,
    item.quantity,
    item.price
  ]));
  const trackedSignatures = readStoredList(BEGIN_CHECKOUT_KEY, "session");

  if (signature && trackedSignatures.includes(signature)) {
    return;
  }

  const tracked = trackGA4Event("begin_checkout", {
    currency: CURRENCY,
    value: getCartValue(items),
    items
  });

  if (tracked && signature) {
    trackedSignatures.push(signature);
    writeStoredList(BEGIN_CHECKOUT_KEY, trackedSignatures, "session");
  }
}

export function trackAddShippingInfo(cartItems = [], shippingTier = "") {
  const items = buildGA4Items(cartItems);
  const signature = getEventSignature("add_shipping_info", {
    shipping_tier: shippingTier,
    items
  });

  // Dedupe per checkout session so step navigation cannot double fire.
  return trackOnce(SHIPPING_INFO_KEY, "session", signature, () => trackGA4Event("add_shipping_info", {
    currency: CURRENCY,
    value: getCartValue(items),
    shipping_tier: sanitizeParamValue(shippingTier),
    items
  }));
}

export function trackAddPaymentInfo(cartItems = [], paymentType = "") {
  const items = buildGA4Items(cartItems);
  const signature = getEventSignature("add_payment_info", {
    payment_type: paymentType,
    items
  });

  // Dedupe per checkout session so review/payment step retries do not duplicate.
  return trackOnce(PAYMENT_INFO_KEY, "session", signature, () => trackGA4Event("add_payment_info", {
    currency: CURRENCY,
    value: getCartValue(items),
    payment_type: sanitizeParamValue(paymentType),
    items
  }));
}

function getOrderItems(order, fallbackCart) {
  const orderItems = order?.items || order?.cartItems || [];
  return Array.isArray(orderItems) && orderItems.length ? orderItems : fallbackCart;
}

function getOrderValue(order, items) {
  return toNumber(order?.total ?? order?.amount ?? (toNumber(order?.totalCents || order?.amountCents) / 100)) || getCartValue(items);
}

export function trackPurchase(order, fallbackCart = []) {
  const orderId = String(order?.orderId || order?.orderReference || order?.id || order?.transactionId || "").trim();
  const items = buildGA4Items(getOrderItems(order, fallbackCart));

  if (!orderId || !items.length) {
    return false;
  }

  const trackedOrders = readStoredList(PURCHASED_ORDERS_KEY, "local");
  if (trackedOrders.includes(orderId)) {
    return false;
  }

  const tracked = trackGA4Event("purchase", {
    transaction_id: orderId,
    currency: CURRENCY,
    value: getOrderValue(order, items),
    items
  });

  if (!tracked) {
    return false;
  }

  trackedOrders.push(orderId);
  writeStoredList(PURCHASED_ORDERS_KEY, trackedOrders, "local");
  return true;
}

export function trackAddToWishlist(product) {
  const item = buildGA4Item(product, 1);
  if (!item) {
    return;
  }

  // Wishlist event is sent only after the item is actually added to favorites.
  trackGA4Event("add_to_wishlist", {
    currency: CURRENCY,
    value: toNumber(item.price),
    item_id: item.item_id,
    item_name: item.item_name,
    item_category: item.item_category,
    price: item.price,
    items: [item]
  });
}

export function trackSearch(searchTerm, options = {}) {
  const normalizedTerm = String(searchTerm || "").trim();
  if (!normalizedTerm) {
    return;
  }

  // Search includes zero-result metadata while preserving GA4's recommended search_term parameter.
  trackGA4Event("search", {
    search_term: normalizedTerm,
    results_count: Math.max(0, Number(options.resultsCount) || 0),
    zero_results: Boolean(options.zeroResults)
  });
}

export function trackWhatsAppClick(params = {}) {
  trackGA4Event("whatsapp_click", {
    page: sanitizeParamValue(params.page || window.location.pathname),
    product_id: sanitizeParamValue(params.product_id),
    product_name: sanitizeParamValue(params.product_name)
  });
}

export function trackBannerView(params = {}) {
  trackGA4Event("banner_view", {
    banner_id: sanitizeParamValue(params.banner_id),
    banner_title: sanitizeParamValue(params.banner_title),
    banner_position: Number(params.banner_position) || 1
  });
}

export function trackBannerClick(params = {}) {
  trackGA4Event("banner_click", {
    banner_id: sanitizeParamValue(params.banner_id),
    banner_title: sanitizeParamValue(params.banner_title),
    banner_position: Number(params.banner_position) || 1
  });
}

export function trackProductImageView(itemId, imageIndex) {
  if (!itemId) {
    return;
  }

  trackGA4Event("product_image_view", {
    item_id: sanitizeParamValue(itemId),
    image_index: Math.max(0, Number(imageIndex) || 0)
  });
}

export function trackScrollDepth(percentScrolled) {
  trackGA4Event("scroll_depth", {
    percent_scrolled: Math.max(0, Math.min(100, Number(percentScrolled) || 0))
  });
}

export function trackJavascriptError(errorDetail = {}) {
  trackGA4Event("javascript_error", {
    message: sanitizeParamValue(errorDetail.message || "Unknown JavaScript error"),
    file: sanitizeParamValue(errorDetail.file || ""),
    line: Number(errorDetail.line) || 0,
    column: Number(errorDetail.column) || 0,
    page: sanitizeParamValue(errorDetail.page || window.location.pathname)
  });
}
