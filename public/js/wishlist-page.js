import {
  addCartItemWithInventory,
  getInventoryStatus,
  subscribeToInventory
} from "./inventory-store.js?v=20260619a";
import {
  buildResponsiveImageMarkup,
  buildProductUrl,
  formatPrice,
  getExactProductById
} from "./product-catalog.js?v=20260602c";
import {
  clearWishlist,
  removeWishlistItem,
  subscribeToWishlist
} from "./wishlist-store.js?v=20260602c";
import { subscribeToReviewSummaries } from "./firebase-reviews.js?v=20260602d";
import { buildRatingSummaryMarkup, emitToast, escapeHtml, primeRatingsCache } from "./ui-utils.js?v=20260523a";
import { getActiveOfferForProduct, getOfferDisplayData, getProductOfferPricing, subscribeToProductOffers } from "./offers-data.js?v=20260620a";

let latestReviewSummaries = {};
let latestWishlistItems = [];

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

function renderWishlist(items) {
  latestWishlistItems = Array.isArray(items) ? items : latestWishlistItems;
  const grid = document.getElementById("wishlistGrid");
  const emptyState = document.getElementById("wishlistEmptyState");
  const count = document.getElementById("wishlistPageCount");
  const clearButton = document.getElementById("wishlistClearBtn");

  if (!grid || !emptyState || !count || !clearButton) {
    return;
  }

  const products = latestWishlistItems.map(getWishlistProduct).filter((product) => product && product.id);

  count.textContent = `${products.length} saved product${products.length === 1 ? "" : "s"}`;
  emptyState.hidden = products.length > 0;
  clearButton.hidden = products.length === 0;

  grid.innerHTML = products.map((product) => {
    const image = (product.images && product.images[0]) || "";
    const productUrl = buildProductUrl(product.id);
    const inventoryStatus = getInventoryStatus(product.id);
    const offer = getActiveOfferForProduct(product.id);
    const offerBadge = offer ? getOfferDisplayData(offer).discountLabel : "";

    return `
      <article class="wishlist_card" data-wishlist-card-id="${escapeHtml(product.id)}">
        <a class="wishlist_card_image product-card-media" href="${productUrl}">
          ${buildResponsiveImageMarkup({
            product,
            imagePath: image,
            alt: product.name,
            width: 600,
            height: 600,
            loading: "lazy",
            sizes: "(max-width: 575px) 88vw, (max-width: 991px) 44vw, 360px"
          })}
          ${offerBadge ? `<span class="product_offer_badge">${escapeHtml(offerBadge)}</span>` : ""}
          <span class="product_stock_status${inventoryStatus.isOutOfStock ? " is_out" : ""}${inventoryStatus.isLowStock ? " is_low" : ""}" ${inventoryStatus.message ? "" : "hidden"}>${escapeHtml(inventoryStatus.message)}</span>
        </a>
        <div class="wishlist_card_body">
          <div>
            <span class="wishlist_card_category">${escapeHtml(product.category || "Product")}</span>
            <h3><a href="${productUrl}">${escapeHtml(product.name)}</a></h3>
            ${buildRatingSummaryMarkup(latestReviewSummaries[product.id], "wishlist_card_rating", { productId: product.id })}
            <p>${escapeHtml(product.description || "")}</p>
          </div>
          <div class="wishlist_card_footer">
            ${getWishlistPriceMarkup(product)}
            <div class="wishlist_card_actions">
              <a class="wishlist_view_btn" href="${productUrl}">View Details</a>
              <button class="wishlist_add_btn" type="button" data-add-wishlist-cart="${escapeHtml(product.id)}" ${inventoryStatus.isOutOfStock ? "disabled aria-disabled=\"true\"" : ""}>
                <i class="fa fa-shopping-basket" aria-hidden="true"></i>
                Add to Cart
              </button>
              <button class="wishlist_remove_btn" type="button" data-remove-wishlist-item="${escapeHtml(product.id)}">
                <i class="fa fa-heart" aria-hidden="true"></i>
                Remove
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

async function moveWishlistProductToCart(product) {
  const result = await addCartItemWithInventory(product, 1);
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

  subscribeToWishlist(renderWishlist);

  subscribeToInventory(() => {
    renderWishlist(latestWishlistItems);
  }, (error) => {
    console.error("Wishlist inventory listener failed.", error);
  });

  subscribeToProductOffers(() => {
    renderWishlist(latestWishlistItems);
  }, (error) => {
    console.error("Wishlist offers could not be loaded.", error);
  });

  subscribeToReviewSummaries((summaries) => {
    latestReviewSummaries = summaries || {};
    primeRatingsCache(latestReviewSummaries);
    renderWishlist(latestWishlistItems);
  }, (error) => {
    console.error("Wishlist review summary listener failed.", error);
  });

  document.addEventListener("click", async (event) => {
    const removeButton = event.target.closest("[data-remove-wishlist-item]");
    if (removeButton) {
      removeWishlistItem(removeButton.getAttribute("data-remove-wishlist-item"));
      emitToast("Removed from favorites.", "info");
      return;
    }

    const addButton = event.target.closest("[data-add-wishlist-cart]");
    if (addButton) {
      const product = getExactProductById(addButton.getAttribute("data-add-wishlist-cart"));
      if (product && await moveWishlistProductToCart(product)) {
        emitToast("Product moved to cart.", "success");
      }
      return;
    }

    if (event.target.closest("#wishlistClearBtn")) {
      clearWishlist();
      emitToast("Favorites cleared.", "info");
    }
  });
});

