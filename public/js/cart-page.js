import {
  clearCartByUserAction,
  getCart,
  isCartReady,
  logCartDebug,
  removeCartItem,
  subscribeToCart
} from "./cart-store.js?v=20260615a";
import {
  getInventoryStatus,
  subscribeToInventory,
  updateCartItemQuantityWithInventory
} from "./inventory-store.js?v=20260619a";
import {
  buildProductUrl,
  buildResponsiveImageMarkup,
  formatPrice,
  getExactProductById
} from "./product-catalog.js?v=20260602c";
import { addWishlistItem, isProductWishlisted } from "./wishlist-store.js?v=20260602c";
import { trackBeginCheckout, trackViewCart } from "./analytics-events.js?v=20260602c";
import { emitToast, escapeHtml } from "./ui-utils.js?v=20260502b";
import { getCartOfferSubtotal, getProductOfferPricing, subscribeToProductOffers } from "./offers-data.js?v=20260620a";
import { t } from "./i18n/i18n.js";
import { getProductDisplayData } from "./i18n/product-display.js?v=20260629titlebidi";

const FALLBACK_IMAGE = "images/optimized/Logo.webp";

function getCartUiText(key, fallback = "", values = {}) {
  return t(`cartUi.${key}`, fallback, values);
}

function getCartUiCountText(key, count, fallback = "") {
  const suffix = Number(count) === 1 ? "" : "_plural";
  return getCartUiText(`${key}${suffix}`, fallback, { count });
}

function getExactProduct(productId) {
  return getExactProductById(productId);
}

function getQuantityLimitNotice(inventoryStatus, quantity) {
  if (!inventoryStatus.tracked || quantity < inventoryStatus.available) {
    return "";
  }

  if (inventoryStatus.available <= 0) {
    return getCartUiText("outOfStock", "Out of stock.");
  }

  return getCartUiCountText(
    "onlyItemsAvailable",
    inventoryStatus.available,
    `Only ${inventoryStatus.available} item${inventoryStatus.available === 1 ? "" : "s"} available.`
  );
}

function getCartStockStatusText(inventoryStatus) {
  if (!inventoryStatus || !inventoryStatus.message) {
    return "";
  }

  if (inventoryStatus.isOutOfStock) {
    return getCartUiText("outOfStockShort", "Out of stock");
  }

  if (inventoryStatus.isLowStock && Number.isFinite(inventoryStatus.available)) {
    return getCartUiText("sorryOnlyLeft", "Sorry, only {count} left in stock.", {
      count: inventoryStatus.available
    });
  }

  return inventoryStatus.message;
}

function renderCartPage(cart, detail = {}) {
  const loadingState = document.getElementById("cartPageLoading");
  const emptyState = document.getElementById("cartPageEmpty");
  const content = document.getElementById("cartPageContent");
  const list = document.getElementById("cartPageItems");
  const subtotalEls = document.querySelectorAll("[data-cart-page-subtotal]");
  const countEls = document.querySelectorAll("[data-cart-page-count]");
  const checkoutButton = document.getElementById("cartPageCheckoutBtn");
  const clearButton = document.getElementById("cartPageClearBtn");
  const isReady = detail.ready !== false && !detail.loading;

  const safeCart = Array.isArray(cart) ? cart : [];
  const itemCount = safeCart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  logCartDebug("cart-page reads cart", {
    storageKey: detail.storageKey,
    storageScope: detail.storageScope,
    ready: detail.ready,
    productCount: safeCart.length,
    unitCount: itemCount
  });

  if (loadingState) {
    loadingState.hidden = isReady;
  }

  if (!isReady) {
    if (emptyState) {
      emptyState.hidden = true;
    }
    if (content) {
      content.hidden = true;
    }
    if (checkoutButton) {
      checkoutButton.disabled = true;
      checkoutButton.setAttribute("aria-disabled", "true");
    }
    if (clearButton) {
      clearButton.disabled = true;
    }
    return;
  }

  subtotalEls.forEach((subtotalEl) => {
    subtotalEl.textContent = formatPrice(getCartOfferSubtotal(safeCart));
  });

  countEls.forEach((countEl) => {
    countEl.textContent = getCartUiCountText(
      "itemCount",
      itemCount,
      `${itemCount} item${itemCount === 1 ? "" : "s"}`
    );
  });

  if (checkoutButton) {
    checkoutButton.disabled = safeCart.length === 0;
    checkoutButton.setAttribute("aria-disabled", String(safeCart.length === 0));
  }

  if (clearButton) {
    clearButton.disabled = safeCart.length === 0;
  }

  if (!emptyState || !content || !list) {
    return;
  }

  emptyState.hidden = safeCart.length > 0;
  content.hidden = safeCart.length === 0;

  if (!safeCart.length) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = safeCart.map((item) => {
    const quantity = Number(item.quantity) || 1;
    const product = getExactProduct(item.id);
    const displayProduct = getProductDisplayData(product || item);
    const productUrl = buildProductUrl(item.id);
    const image = product?.images?.[0] || item.image || FALLBACK_IMAGE;
    const pricing = getProductOfferPricing(product || { id: item.id, price: item.price });
    const price = pricing.finalPrice;
    const lineTotal = price * quantity;
    const inventoryStatus = getInventoryStatus(item.id);
    const quantityLimitNotice = getQuantityLimitNotice(inventoryStatus, quantity);
    const stockStatusText = getCartStockStatusText(inventoryStatus);

    return `
      <article class="cart_page_item" data-cart-product-id="${escapeHtml(item.id)}">
        <a class="cart_page_item_image" href="${escapeHtml(productUrl)}" aria-label="${escapeHtml(getCartUiText("viewProduct", "View {name}", { name: displayProduct.name }))}">
          ${buildResponsiveImageMarkup({
            product,
            imagePath: image,
          alt: displayProduct.name || item.name,
            width: 96,
            height: 96,
            loading: "lazy",
            sizes: "96px"
          })}
        </a>
        <div class="cart_page_item_body">
          <div class="cart_page_item_head">
            <div>
              <a href="${escapeHtml(productUrl)}">${escapeHtml(displayProduct.name || item.name)}</a>
              <span class="cart_page_item_kicker">${escapeHtml(getCartUiText("premiumIngredients", "Premium sushi ingredients"))}</span>
              <span class="product_stock_status${inventoryStatus.isOutOfStock ? " is_out" : ""}${inventoryStatus.isLowStock ? " is_low" : ""}" ${inventoryStatus.message ? "" : "hidden"}>${escapeHtml(stockStatusText)}</span>
            </div>
            <div class="cart_page_item_actions">
              <button class="cart_page_save_btn" type="button" data-cart-page-save-favorite="${escapeHtml(item.id)}">
                <i class="fa fa-heart-o" aria-hidden="true"></i>
                <span>${escapeHtml(getCartUiText("saveToFavorites", "Save to Favorites"))}</span>
              </button>
              <button class="cart_page_remove_btn" type="button" data-cart-page-remove="${escapeHtml(item.id)}">
                <i class="fa fa-trash" aria-hidden="true"></i>
                <span>${escapeHtml(getCartUiText("remove", "Remove"))}</span>
              </button>
            </div>
          </div>
          <div class="cart_page_item_prices">
            <div>
              <span>${escapeHtml(getCartUiText("unitPrice", "Unit price"))}</span>
              ${pricing.offer ? `<del>${escapeHtml(formatPrice(pricing.originalPrice))}</del>` : ""}<strong>${escapeHtml(formatPrice(price))}</strong>
            </div>
            <div>
              <span>${escapeHtml(getCartUiText("itemTotal", "Item total"))}</span>
              <strong>${escapeHtml(formatPrice(lineTotal))}</strong>${pricing.offer ? `<small>${escapeHtml(getCartUiText("saveAmount", "Save {amount}", { amount: formatPrice(pricing.savings * quantity) }))}</small>` : ""}
            </div>
          </div>
          <div class="cart_page_item_bottom">
            <div class="cart_page_qty_stack">
              <div class="cart_page_qty" aria-label="${escapeHtml(getCartUiText("quantityControlsFor", "Quantity controls for {name}", { name: displayProduct.name || item.name }))}">
                <button type="button" data-cart-page-decrease="${escapeHtml(item.id)}" aria-label="${escapeHtml(getCartUiText("decreaseQuantity", "Decrease quantity"))}">-</button>
                <span>${quantity}</span>
                <button type="button" data-cart-page-increase="${escapeHtml(item.id)}" aria-label="${escapeHtml(getCartUiText("increaseQuantity", "Increase quantity"))}" ${inventoryStatus.tracked && quantity >= inventoryStatus.available ? "disabled" : ""}>+</button>
              </div>
              ${quantityLimitNotice ? `<span class="cart_quantity_limit_notice">${escapeHtml(quantityLimitNotice)}</span>` : ""}
            </div>
            <span class="cart_page_line_label">${escapeHtml(getCartUiText("adjustQuantity", "Adjust quantity"))}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  list.querySelectorAll("img").forEach((image) => {
    image.addEventListener("error", () => {
      image.src = FALLBACK_IMAGE;
    }, { once: true });
  });
}

function guardCartReady() {
  if (isCartReady()) {
    return true;
  }

  emitToast(getCartUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."), "info");
  return false;
}

document.addEventListener("DOMContentLoaded", () => {
  let hasTrackedViewCart = false;

  subscribeToCart((cart, detail) => {
    renderCartPage(cart, detail);
    if (!hasTrackedViewCart && detail.ready !== false && !detail.loading) {
      hasTrackedViewCart = true;
      trackViewCart(Array.isArray(cart) ? cart : []);
    }
  });

  document.addEventListener("click", (event) => {
    const saveFavoriteButton = event.target.closest("[data-cart-page-save-favorite]");
    if (saveFavoriteButton) {
      const productId = saveFavoriteButton.getAttribute("data-cart-page-save-favorite");
      const product = getExactProduct(productId);
      if (!product) {
        emitToast(getCartUiText("productUnavailable", "This product is no longer available."), "info");
        return;
      }
      if (isProductWishlisted(product.id)) {
        emitToast(getCartUiText("alreadyInFavorites", "Already in favorites."), "info");
        return;
      }
      addWishlistItem(product);
      emitToast(getCartUiText("savedToFavorites", "Saved to favorites."), "success");
      return;
    }

    const removeButton = event.target.closest("[data-cart-page-remove]");
    if (removeButton) {
      if (!guardCartReady()) {
        return;
      }
      removeCartItem(removeButton.getAttribute("data-cart-page-remove"));
      emitToast(getCartUiText("productRemoved", "Product removed from cart."), "info");
      return;
    }

    const increaseButton = event.target.closest("[data-cart-page-increase]");
    if (increaseButton) {
      if (!guardCartReady()) {
        return;
      }
      const productId = increaseButton.getAttribute("data-cart-page-increase");
      const item = getCart().find((cartItem) => cartItem.id === productId);
      const quantity = Number(item?.quantity) || 1;
      const inventoryStatus = getInventoryStatus(productId);
      const quantityLimitNotice = getQuantityLimitNotice(inventoryStatus, quantity);
      if (quantityLimitNotice) {
        emitToast(getCartUiText("maxQuantityReached", "You have reached the maximum available quantity."), "error");
        return;
      }
      updateCartItemQuantityWithInventory(productId, quantity + 1);
      return;
    }

    const decreaseButton = event.target.closest("[data-cart-page-decrease]");
    if (decreaseButton) {
      if (!guardCartReady()) {
        return;
      }
      const productId = decreaseButton.getAttribute("data-cart-page-decrease");
      const item = getCart().find((cartItem) => cartItem.id === productId);
      updateCartItemQuantityWithInventory(productId, (Number(item?.quantity) || 1) - 1);
      return;
    }

    if (event.target.closest("#cartPageClearBtn")) {
      if (!guardCartReady()) {
        return;
      }
      clearCartByUserAction();
      emitToast(getCartUiText("cartCleared", "Cart cleared."), "info");
      return;
    }

    if (event.target.closest("#cartPageCheckoutBtn")) {
      if (!guardCartReady()) {
        return;
      }
      if (!getCart().length) {
        emitToast(getCartUiText("cartEmptyBeforeCheckout", "Your cart is empty. Add products before checkout."), "info");
        return;
      }

      try {
        window.sessionStorage.setItem("checkoutStartStep", "delivery");
      } catch (error) {}
      window.location.href = "checkout.html?step=delivery";
      trackBeginCheckout(getCart());
    }
  });

  subscribeToInventory(() => {
    renderCartPage(getCart(), { ready: isCartReady(), loading: !isCartReady() });
  }, (error) => {
    console.error("Cart page inventory listener failed.", error);
  });

  subscribeToProductOffers(() => {
    renderCartPage(getCart(), { ready: isCartReady(), loading: !isCartReady() });
  }, (error) => console.error("Cart offers could not be loaded.", error));

  window.addEventListener("sushi-box:language-change", () => {
    renderCartPage(getCart(), { ready: isCartReady(), loading: !isCartReady() });
  });
});
