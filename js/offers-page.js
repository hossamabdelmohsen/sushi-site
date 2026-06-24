import { getActiveOfferDisplayData, subscribeToProductOffers } from "./offers-data.js?v=20260620a";
import { buildResponsiveImageMarkup } from "./product-catalog.js?v=20260602c";
import { subscribeToReviewSummaries } from "./firebase-reviews.js?v=20260618b";
import { addCartItemWithInventory, getInventoryStatus, subscribeToInventory } from "./inventory-store.js?v=20260619a";
import { bindCardNavigation, buildRatingSummaryMarkup, escapeHtml, primeRatingsCache, shareProduct } from "./ui-utils.js?v=20260523a";

let latestReviewSummaries = {};

function renderOfferCard(offer) {
  const inventoryStatus = getInventoryStatus(offer.productId);

  return `
    <article class="offers_page_card" data-offer-id="${escapeHtml(offer.id)}" data-product-id="${escapeHtml(offer.productId)}" data-product-url="${escapeHtml(offer.productUrl)}">
      <div class="offers_page_media product-card-media">
        <a class="offers_page_image" href="${escapeHtml(offer.productUrl)}">
          ${buildResponsiveImageMarkup({
            product: offer.product,
            imagePath: offer.image,
            alt: offer.title,
            width: 600,
            height: 600,
            loading: "lazy",
            sizes: "(max-width: 575px) 88vw, (max-width: 991px) 44vw, 360px"
          })}
        </a>
        <span class="product_offer_badge offers_page_badge">${escapeHtml(offer.discountLabel)}</span>
        <span class="product_stock_status${inventoryStatus.isOutOfStock ? " is_out" : ""}${inventoryStatus.isLowStock ? " is_low" : ""}" ${inventoryStatus.message ? "" : "hidden"}>${escapeHtml(inventoryStatus.message)}</span>
        <button class="product-share-btn offers_page_share_btn" type="button" data-offer-share-product-id="${escapeHtml(offer.productId)}" aria-label="Share ${escapeHtml(offer.title)}" title="Share">
          <i class="fa fa-share-alt" aria-hidden="true"></i>
        </button>
        <button class="product-wishlist-btn offers_page_wishlist_btn" type="button" data-wishlist-product-id="${escapeHtml(offer.productId)}" aria-label="Add ${escapeHtml(offer.title)} to favorites" aria-pressed="false" title="Add to favorites">
          <i class="fa fa-heart-o" aria-hidden="true"></i>
        </button>
      </div>
      <div class="offers_page_body">
        <span class="offers_page_category">${escapeHtml(offer.category)}</span>
        ${offer.marketingTitle ? `<span class="offers_page_offer_title">${escapeHtml(offer.marketingTitle)}</span>` : ""}
        <h3>${escapeHtml(offer.title)}</h3>
        ${buildRatingSummaryMarkup(latestReviewSummaries[offer.productId], "offers_page_rating", { productId: offer.productId })}
        <div class="offers_page_price_row">
          <del>${escapeHtml(offer.originalPriceText)}</del>
          <strong>${escapeHtml(offer.discountedPriceText)}</strong>
        </div>
        <div class="offers_page_actions">
          <a class="offers_page_view_btn" href="${escapeHtml(offer.productUrl)}">View Product</a>
          <button class="product-cart-btn offers_page_add_btn" type="button" data-offer-add-cart="${escapeHtml(offer.productId)}" aria-label="Add ${escapeHtml(offer.title)} to cart" title="Add to cart" ${inventoryStatus.isOutOfStock ? "disabled aria-disabled=\"true\"" : ""}>
            <i class="fa fa-plus" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderOffersPage() {
  const grid = document.getElementById("offersGrid");
  const count = document.getElementById("offersCount");

  if (!grid) {
    return;
  }

  const offers = getActiveOfferDisplayData();

  if (count) {
    count.textContent = offers.length === 1 ? "1 active offer" : `${offers.length} active offers`;
  }

  grid.innerHTML = offers.length
    ? offers.map(renderOfferCard).join("")
    : `
      <div class="offers_page_empty">
        <span class="offers_page_empty_icon"><i class="fa fa-tag" aria-hidden="true"></i></span>
        <strong>No active offers right now</strong>
        <p>Check back soon for fresh Sushi Box deals.</p>
      </div>
    `;

  grid.querySelectorAll(".offers_page_card").forEach((card) => {
    bindCardNavigation(card, card.getAttribute("data-product-url"));
  });

  grid.querySelectorAll("[data-offer-share-product-id]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const card = button.closest(".offers_page_card");
      const offer = offers.find((item) => item.productId === button.getAttribute("data-offer-share-product-id"));
      if (offer && offer.product) {
        shareProduct(offer.product, card?.getAttribute("data-product-url") || offer.productUrl);
      }
    });
  });

  grid.querySelectorAll("[data-offer-add-cart]").forEach((button) => {
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const offer = offers.find((item) => item.productId === button.getAttribute("data-offer-add-cart"));
      if (offer?.product) {
        await addCartItemWithInventory(offer.product, 1, {
          successMessage: "Product added to cart successfully"
        });
      }
    });
  });

  window.dispatchEvent(new CustomEvent("sushi-box:wishlist-controls-ready"));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderOffersPage, { once: true });
} else {
  renderOffersPage();
}

subscribeToProductOffers(() => renderOffersPage(), (error) => console.error("Offer data listener failed.", error));

subscribeToInventory(() => renderOffersPage(), (error) => console.error("Offer inventory listener failed.", error));

subscribeToReviewSummaries((summaries) => {
  latestReviewSummaries = summaries || {};
  primeRatingsCache(latestReviewSummaries);
  renderOffersPage();
}, (error) => {
  console.error("Offer review summary listener failed.", error);
});
