import {
  addCartItemWithInventory,
  getInventoryStatus,
  subscribeToInventory
} from "./inventory-store.js?v=20260701a";
import {
  buildResponsiveImageMarkup,
  buildProductUrl,
  formatPrice,
  getExactProductById
} from "./product-catalog.js?v=20260701a";
import {
  clearWishlist,
  removeWishlistItem,
  subscribeToWishlist
} from "./wishlist-store.js?v=20260701a";
import { subscribeToReviewSummaries } from "./firebase-reviews.js?v=20260701a";
import { buildRatingSummaryMarkup, emitToast, escapeHtml, primeRatingsCache } from "./ui-utils.js?v=20260701a";
import { getActiveOfferForProduct, getOfferDisplayData, getProductOfferPricing, subscribeToProductOffers } from "./offers-data.js?v=20260701a";
import { t } from "./i18n/i18n.js?v=20260701a";
import { getProductDisplayData } from "./i18n/product-display.js?v=20260701a";

let latestReviewSummaries = {};
let latestWishlistItems = [];
let latestWishlistDetail = {};

function getProductUiText(key, fallback = "", values = {}) {
  return t(`productUi.${key}`, fallback, values);
}

function getFavoritesUiText(key, fallback = "", values = {}) {
  return t(`favoritesUi.${key}`, fallback, values);
}

function getProductUiCountText(key, count, fallbackSingular, fallbackPlural) {
  const isSingle = count === 1;
  return getProductUiText(isSingle ? key : `${key}_plural`, isSingle ? fallbackSingular : fallbackPlural, { count });
}

function getFavoritesUiCountText(key, count, fallbackSingular, fallbackPlural) {
  const isSingle = count === 1;
  return getFavoritesUiText(isSingle ? key : `${key}_plural`, isSingle ? fallbackSingular : fallbackPlural, { count });
}

function getProductStockStatusText(status) {
  if (!status || !status.message) {
    return "";
  }

  if (status.isOutOfStock) {
    return getFavoritesUiText("outOfStock", "Out of Stock");
  }

  if (status.isLowStock && Number.isFinite(status.available)) {
    return getFavoritesUiText("onlyLeft", "Only {count} left", { count: status.available });
  }

  return status.message;
}

function getWishlistProduct(item) {
  // Favorites only persist a light snapshot. Resolve its slug against the
  // catalog every render so current catalog, offer, and inventory data win.
  const catalogProduct = getExactProductById(item.id);

  if (catalogProduct) {
    return catalogProduct;
  }

  return {
    id: item.id,
    name: item.name,
    description: item.category || "Saved product",
    category: item.category,
    price: item.price,
    images: [item.image]
  };
}

function getWishlistPriceMarkup(product) {
  const pricing = getProductOfferPricing(product);

  if (!pricing.offer) {
    return `<strong class="wishlist_card_price">${escapeHtml(formatPrice(pricing.finalPrice))}</strong>`;
  }

  const display = getOfferDisplayData(pricing.offer);
  return `
    <strong class="wishlist_card_price product_card_price--offer">
      <span class="product_offer_price_stack">
        <del class="product_offer_original_price">${escapeHtml(display.originalPriceText)}</del>
        <span class="product_offer_discounted_price">${escapeHtml(display.discountedPriceText)}</span>
      </span>
    </strong>
  `;
}

function renderWishlist(items, detail = latestWishlistDetail) {
  latestWishlistItems = Array.isArray(items) ? items : latestWishlistItems;
  latestWishlistDetail = detail || latestWishlistDetail;
  const grid = document.getElementById("wishlistGrid");
  const emptyState = document.getElementById("wishlistEmptyState");
  const emptyTitle = emptyState?.querySelector("h3");
  const emptyHint = emptyState?.querySelector("p");
  const count = document.getElementById("wishlistPageCount");
  const clearButton = document.getElementById("wishlistClearBtn");

  if (!grid || !emptyState || !count || !clearButton) {
    return;
  }

  const products = latestWishlistItems.map(getWishlistProduct).filter((product) => product && product.id);
  const isLoading = latestWishlistDetail.loading === true;
  const hasError = Boolean(latestWishlistDetail.error);

  count.textContent = getFavoritesUiCountText("savedProductCount", products.length, "{count} saved product", "{count} saved products");
  emptyState.hidden = products.length > 0 && !isLoading && !hasError;
  clearButton.hidden = products.length === 0;

  if (emptyTitle && emptyHint) {
    if (isLoading && !products.length) {
      emptyTitle.textContent = getFavoritesUiText("loadingFavorites", "Loading favorites");
      emptyHint.textContent = "";
    } else if (hasError && !products.length) {
      emptyTitle.textContent = getFavoritesUiText("unableToLoadFavorites", "Unable to load favorites");
      emptyHint.textContent = "";
    } else {
      emptyTitle.textContent = getFavoritesUiText("noSavedProductsYet", "You have no saved products yet");
      emptyHint.textContent = getFavoritesUiText("emptyHint", "Tap the heart on any product card to keep your favorites here.");
    }
  }

  grid.innerHTML = products.map((product) => {
    const displayProduct = getProductDisplayData(product);
    const image = (product.images && product.images[0]) || "";
    const productUrl = buildProductUrl(product.id);
    const inventoryStatus = getInventoryStatus(product.id);
    const stockStatusText = getProductStockStatusText(inventoryStatus);
    const offer = getActiveOfferForProduct(product.id);
    const offerBadge = offer ? getOfferDisplayData(offer).discountLabel : "";

    return `
      <article class="wishlist_card" data-wishlist-card-id="${escapeHtml(product.id)}">
        <a class="wishlist_card_image product-card-media" href="${productUrl}">
          ${buildResponsiveImageMarkup({
            product,
            imagePath: image,
            alt: displayProduct.name,
            width: 600,
            height: 600,
            loading: "lazy",
            sizes: "(max-width: 575px) 88vw, (max-width: 991px) 44vw, 360px"
          })}
          ${offerBadge ? `<span class="product_offer_badge">${escapeHtml(offerBadge)}</span>` : ""}
          <span class="product_stock_status${inventoryStatus.isOutOfStock ? " is_out" : ""}${inventoryStatus.isLowStock ? " is_low" : ""}" ${inventoryStatus.message ? "" : "hidden"}>${escapeHtml(stockStatusText)}</span>
        </a>
        <div class="wishlist_card_body">
          <div>
            <span class="wishlist_card_category">${escapeHtml(displayProduct.category || getProductUiText("product", "Product"))}</span>
            <h3><a href="${productUrl}">${escapeHtml(displayProduct.name)}</a></h3>
            ${buildRatingSummaryMarkup(latestReviewSummaries[product.id], "wishlist_card_rating", { productId: product.id })}
            <p>${escapeHtml(displayProduct.description || "")}</p>
          </div>
          <div class="wishlist_card_footer">
            ${getWishlistPriceMarkup(product)}
            <div class="wishlist_card_actions">
              <a class="wishlist_view_btn" href="${productUrl}">${escapeHtml(getFavoritesUiText("viewDetails", "View Details"))}</a>
              <button class="wishlist_add_btn" type="button" data-add-wishlist-cart="${escapeHtml(product.id)}" ${inventoryStatus.isOutOfStock ? "disabled aria-disabled=\"true\"" : ""}>
                <i class="fa fa-shopping-basket" aria-hidden="true"></i>
                ${escapeHtml(getFavoritesUiText("addToCart", "Add to Cart"))}
              </button>
              <button class="wishlist_remove_btn" type="button" data-remove-wishlist-item="${escapeHtml(product.id)}">
                <i class="fa fa-heart" aria-hidden="true"></i>
                ${escapeHtml(getFavoritesUiText("removeFromFavorites", "Remove from Favorites"))}
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

async function moveWishlistProductToCart(product) {
  const result = await addCartItemWithInventory(product, 1, {
    successMessage: getProductUiText("addedToCart", "Product added to cart successfully")
  });
  const wasAdded = result.ok;

  if (!wasAdded) {
    return false;
  }

  try {
    removeWishlistItem(product.id);
  } catch (error) {
    console.error("Product was added to cart, but favorite removal failed.", error);
  }

  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("wishlistGrid");
  if (!grid) {
    return;
  }

  subscribeToWishlist((items, detail) => renderWishlist(items, detail));

  subscribeToInventory(() => {
    renderWishlist(latestWishlistItems, latestWishlistDetail);
  }, (error) => {
    console.error("Wishlist inventory listener failed.", error);
  });

  subscribeToProductOffers(() => {
    renderWishlist(latestWishlistItems, latestWishlistDetail);
  }, (error) => {
    console.error("Wishlist offers could not be loaded.", error);
  });

  subscribeToReviewSummaries((summaries) => {
    latestReviewSummaries = summaries || {};
    primeRatingsCache(latestReviewSummaries);
    renderWishlist(latestWishlistItems, latestWishlistDetail);
  }, (error) => {
    console.error("Wishlist review summary listener failed.", error);
  });

  window.addEventListener("sushi-box:language-change", () => {
    renderWishlist(latestWishlistItems, latestWishlistDetail);
  });

  document.addEventListener("click", async (event) => {
    const removeButton = event.target.closest("[data-remove-wishlist-item]");
    if (removeButton) {
      removeWishlistItem(removeButton.getAttribute("data-remove-wishlist-item"));
      emitToast(getFavoritesUiText("removedFromFavorites", "Removed from favorites."), "info");
      return;
    }

    const addButton = event.target.closest("[data-add-wishlist-cart]");
    if (addButton) {
      const product = getExactProductById(addButton.getAttribute("data-add-wishlist-cart"));
      if (product && await moveWishlistProductToCart(product)) {
        emitToast(getFavoritesUiText("productMovedToCart", "Product moved to cart."), "success");
      }
      return;
    }

    if (event.target.closest("#wishlistClearBtn")) {
      clearWishlist();
      emitToast(getFavoritesUiText("favoritesCleared", "Favorites cleared."), "info");
    }
  });
});

