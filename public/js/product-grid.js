import {
  addCartItemWithInventory,
  getInventoryStatus,
  subscribeToInventory
} from "./inventory-store.js?v=20260619a";
import {
  applyResponsiveImage,
  buildResponsiveImageMarkup,
  buildProductUrl,
  formatPrice,
  getAllProducts,
  getFeaturedProducts,
  getProductById,
  getProductFilterClass,
  getProductIdFromCard,
  getProductSearchText,
  searchProductsDetailed
} from "./product-catalog.js?v=20260603a";
import { isProductWishlisted, toggleWishlistItem } from "./wishlist-store.js?v=20260602c";
import {
  bindCardNavigation,
  buildRatingSummaryMarkup,
  emitToast,
  escapeHtml,
  primeRatingsCache,
  shareProduct
} from "./ui-utils.js?v=20260523a";
import { getActiveOfferForProduct, getOfferDisplayData, subscribeToProductOffers } from "./offers-data.js?v=20260620a";
import { t } from "./i18n/i18n.js?v=20260629productsui";
import { getProductDisplayData } from "./i18n/product-display.js?v=20260629titlebidi";

let productTitleTooltip = null;
let productTitleTooltipHideTimer = null;
let productTitleTooltipShowTimer = null;
let activeTouchTitle = null;
const FALLBACK_IMAGE = "images/optimized/Logo.webp";
const PRODUCT_TITLE_TOOLTIP_DELAY = 1000;

function getProductUiText(key, fallback = "", values = {}) {
  return t(`productUi.${key}`, fallback, values);
}

function getProductsPageText(key, fallback = "", values = {}) {
  return t(`productsPage.${key}`, fallback, values);
}

function syncProductsPageText() {
  const endState = document.querySelector(".products_end_state");
  if (endState) {
    endState.setAttribute("aria-label", getProductsPageText("loadedAria", "All products loaded"));
  }

  document.querySelectorAll(".filters_menu [data-i18n]").forEach((filter) => {
    const key = filter.getAttribute("data-i18n");
    const fallback = filter.textContent.trim();
    filter.textContent = t(key, fallback);
  });
}

function getProductStockStatusText(status) {
  if (!status || !status.message) {
    return "";
  }

  if (status.isOutOfStock) {
    return getProductUiText("outOfStock", "Out of Stock");
  }

  if (status.isLowStock && Number.isFinite(status.available)) {
    return getProductUiText("onlyLeft", "Only {count} left", { count: status.available });
  }

  return status.message;
}

function bindImageFallback(image) {
  if (!image || image.dataset.fallbackBound === "true") {
    return;
  }

  image.dataset.fallbackBound = "true";
  image.addEventListener("error", () => {
    if (image.getAttribute("src") !== FALLBACK_IMAGE) {
      image.src = FALLBACK_IMAGE;
    }
  });
}

function getGridProducts(grid) {
  const scope = grid.getAttribute("data-product-scope") || "all";
  const limit = Number(grid.getAttribute("data-product-limit")) || 0;
  const products = scope === "featured" ? getFeaturedProducts(limit) : getAllProducts();

  return limit > 0 && scope !== "featured" ? products.slice(0, limit) : products;
}

function getProductCardPriceMarkup(product) {
  const offer = getActiveOfferForProduct(product.id);
  if (!offer) return escapeHtml(formatPrice(product.price));
  const display = getOfferDisplayData(offer);
  return `<span class="product_offer_price_stack"><del class="product_offer_original_price">${escapeHtml(display.originalPriceText)}</del><strong class="product_offer_discounted_price">${escapeHtml(display.discountedPriceText)}</strong></span>`;
}

function renderProductCard(product, index = 0) {
  const productUrl = buildProductUrl(product.id);
  const filterClass = getProductFilterClass(product);
  const isPriorityImage = index === 0;
  const displayProduct = getProductDisplayData(product);

  return `
    <div class="col-sm-6 col-lg-4 all ${escapeHtml(filterClass)}" data-product-id="${escapeHtml(product.id)}" data-search="${escapeHtml(getProductSearchText(product))}">
      <div class="box product-card" data-product-id="${escapeHtml(product.id)}" data-product-url="${escapeHtml(productUrl)}">
        <div>
          <div class="img-box">
            ${buildResponsiveImageMarkup({
              product,
              alt: displayProduct.name,
              width: 600,
              height: 600,
              loading: isPriorityImage ? "eager" : "lazy",
              fetchpriority: isPriorityImage ? "high" : "",
              sizes: "(max-width: 575px) 88vw, (max-width: 991px) 44vw, 360px"
            })}
          </div>
          <div class="detail-box">
            <h5><a href="${escapeHtml(productUrl)}">${escapeHtml(displayProduct.name)}</a></h5>
            ${buildRatingSummaryMarkup(null, "", { productId: product.id })}
            <p>${escapeHtml(displayProduct.description)}</p>
            <div class="options">
              <h6 class="product_card_price${getActiveOfferForProduct(product.id) ? " product_card_price--offer" : ""}">${getProductCardPriceMarkup(product)}</h6>
              <a href="${escapeHtml(productUrl)}" class="product-link-btn">${escapeHtml(getProductUiText("viewDetails", "View Details"))}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}


function renderProductGrids() {
  document.querySelectorAll("[data-product-grid]").forEach((grid) => {
    if (grid.getAttribute("data-product-rendered") === "true" || grid.closest("[hidden]")) {
      return;
    }

    const products = getGridProducts(grid);
    grid.innerHTML = products.length
      ? products.map((product, index) => renderProductCard(product, index)).join("")
      : `<div class="col-12"><p class="product_grid_empty">${escapeHtml(getProductUiText("noProductsAvailable", "No products are available right now."))}</p></div>`;
    grid.setAttribute("data-product-rendered", "true");
  });
}

function ensureProductTitleTooltip() {
  if (productTitleTooltip) {
    return productTitleTooltip;
  }

  productTitleTooltip = document.createElement("div");
  productTitleTooltip.className = "product_title_tooltip";
  productTitleTooltip.id = "productTitleTooltip";
  productTitleTooltip.setAttribute("role", "tooltip");
  productTitleTooltip.setAttribute("aria-hidden", "true");
  document.body.appendChild(productTitleTooltip);
  return productTitleTooltip;
}

function positionProductTitleTooltip(titleElement) {
  const tooltip = ensureProductTitleTooltip();
  const titleRect = titleElement.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportPadding = 12;
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const topSpace = titleRect.top;
  const bottomSpace = viewportHeight - titleRect.bottom;
  const placeBelow = bottomSpace > tooltipRect.height + 18 || bottomSpace >= topSpace;
  const preferredLeft = titleRect.left + (titleRect.width / 2) - (tooltipRect.width / 2);
  const left = Math.min(
    Math.max(preferredLeft, viewportPadding),
    Math.max(viewportPadding, viewportWidth - tooltipRect.width - viewportPadding)
  );
  const top = placeBelow
    ? Math.min(titleRect.bottom + 10, viewportHeight - tooltipRect.height - viewportPadding)
    : Math.max(titleRect.top - tooltipRect.height - 10, viewportPadding);

  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.classList.toggle("is_below", placeBelow);
}

function showProductTitleTooltip(titleElement) {
  const fullTitle = titleElement && titleElement.getAttribute("data-full-title");
  if (!fullTitle) {
    return;
  }

  window.clearTimeout(productTitleTooltipShowTimer);
  window.clearTimeout(productTitleTooltipHideTimer);
  const tooltip = ensureProductTitleTooltip();
  tooltip.textContent = fullTitle;
  tooltip.setAttribute("aria-hidden", "false");
  titleElement.setAttribute("aria-describedby", tooltip.id);
  tooltip.classList.add("is_measuring");
  tooltip.classList.add("is_visible");
  positionProductTitleTooltip(titleElement);
  tooltip.classList.remove("is_measuring");
}

function scheduleProductTitleTooltip(titleElement) {
  window.clearTimeout(productTitleTooltipShowTimer);
  window.clearTimeout(productTitleTooltipHideTimer);
  productTitleTooltipShowTimer = window.setTimeout(() => {
    productTitleTooltipShowTimer = null;
    showProductTitleTooltip(titleElement);
  }, PRODUCT_TITLE_TOOLTIP_DELAY);
}

function hideProductTitleTooltip(titleElement, delay = 80) {
  window.clearTimeout(productTitleTooltipShowTimer);
  window.clearTimeout(productTitleTooltipHideTimer);
  productTitleTooltipHideTimer = window.setTimeout(() => {
    if (titleElement) {
      titleElement.removeAttribute("aria-describedby");
    }

    if (productTitleTooltip) {
      productTitleTooltip.classList.remove("is_visible");
      productTitleTooltip.setAttribute("aria-hidden", "true");
    }
  }, delay);
}

function isCoarsePointer() {
  return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
}

function getInitialSearchQuery() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    return (params.get("search") || params.get("q") || "").trim();
  } catch (error) {
    return "";
  }
}

function getSmartSearchProductIds(query) {
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    return {
      ids: [],
      idSet: null
    };
  }

  const ids = searchProductsDetailed(normalizedQuery).map((result) => result.product.id);
  return {
    ids,
    idSet: new Set(ids)
  };
}

function productMatchesSmartSearch(product, query, matchSet) {
  if (!query) {
    return true;
  }

  return Boolean(product && matchSet && matchSet.has(product.id));
}

function bindProductTitleReveal(title, product) {
  if (!title || !product) {
    return;
  }

  title.classList.add("product_card_title");
  title.setAttribute("data-full-title", product.name);
  title.removeAttribute("title");
  title.setAttribute("aria-label", product.name);

  const titleLink = title.querySelector("a");
  if (titleLink) {
    titleLink.removeAttribute("title");
  }

  if (title.getAttribute("data-title-reveal-ready") === "true") {
    return;
  }

  title.setAttribute("data-title-reveal-ready", "true");
  title.addEventListener("mouseenter", () => scheduleProductTitleTooltip(title));
  title.addEventListener("mouseleave", () => hideProductTitleTooltip(title));
  title.addEventListener("focusin", () => scheduleProductTitleTooltip(title));
  title.addEventListener("focusout", () => hideProductTitleTooltip(title));

  title.addEventListener("touchstart", () => {
    if (!isCoarsePointer()) {
      return;
    }

    activeTouchTitle = title;
    scheduleProductTitleTooltip(title);
  }, { passive: true });

  title.addEventListener("touchend", () => {
    if (activeTouchTitle === title) {
      activeTouchTitle = null;
    }

    hideProductTitleTooltip(title, 120);
  }, { passive: true });

  title.addEventListener("touchcancel", () => {
    if (activeTouchTitle === title) {
      activeTouchTitle = null;
    }

    hideProductTitleTooltip(title, 120);
  }, { passive: true });

  title.addEventListener("click", () => {
    if (!isCoarsePointer()) {
      return;
    }

    if (productTitleTooltip && productTitleTooltip.classList.contains("is_visible")) {
      hideProductTitleTooltip(title, 120);
      activeTouchTitle = null;
    }
  });
}

function syncWishlistButton(button, product) {
  const isActive = isProductWishlisted(product.id);
  const icon = button.querySelector("i");

  button.classList.toggle("is_active", isActive);
  button.setAttribute("aria-pressed", String(isActive));
  button.setAttribute("aria-label", getProductUiText(
    isActive ? "removeProductFromFavorites" : "addProductToFavorites",
    isActive ? "Remove {name} from favorites" : "Add {name} to favorites",
    { name: product.name }
  ));
  button.setAttribute("title", getProductUiText(isActive ? "removeFromFavoritesLower" : "addToFavorites", isActive ? "Remove from favorites" : "Add to favorites"));

  if (icon) {
    icon.className = `fa ${isActive ? "fa-heart" : "fa-heart-o"}`;
  }
}

function animateWishlistToggle(button) {
  if (!button) {
    return;
  }

  button.classList.remove("is_popping");
  void button.offsetWidth;
  button.classList.add("is_popping");
}

function ensureWishlistButton(card, product) {
  const displayProduct = getProductDisplayData(product);
  const imageBox = card.querySelector(".img-box");
  if (!imageBox) {
    return;
  }

  let wishlistButton = imageBox.querySelector(".product-wishlist-btn");
  if (!wishlistButton) {
    wishlistButton = document.createElement("button");
    wishlistButton.type = "button";
    wishlistButton.className = "product-wishlist-btn";
    wishlistButton.innerHTML = '<i class="fa fa-heart-o" aria-hidden="true"></i>';
    imageBox.appendChild(wishlistButton);
  }

  wishlistButton.setAttribute("data-wishlist-product-id", product.id);
  syncWishlistButton(wishlistButton, displayProduct);
  wishlistButton.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const result = toggleWishlistItem(product);
    syncWishlistButton(wishlistButton, getProductDisplayData(product));
    animateWishlistToggle(wishlistButton);
    emitToast(getProductUiText(
      result.added ? "productSavedToFavorites" : "productRemovedFromFavorites",
      result.added ? "{name} added to favorites." : "{name} removed from favorites.",
      { name: getProductDisplayData(product).name }
    ), result.added ? "success" : "info");
  };
}

function ensureShareButton(card, product, productUrl) {
  const displayProduct = getProductDisplayData(product);
  const imageBox = card.querySelector(".img-box");
  if (!imageBox) {
    return;
  }

  let shareButton = imageBox.querySelector(".product-share-btn");
  if (!shareButton) {
    shareButton = document.createElement("button");
    shareButton.type = "button";
    shareButton.className = "product-share-btn";
    shareButton.innerHTML = '<i class="fa fa-share-alt" aria-hidden="true"></i>';
    imageBox.appendChild(shareButton);
  }

  shareButton.setAttribute("aria-label", getProductUiText("shareProduct", "Share {name}", { name: displayProduct.name }));
  shareButton.setAttribute("title", getProductUiText("share", "Share"));
  shareButton.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    shareProduct(product, productUrl);
  };
}

function enhanceProductCard(card) {
  const productId = getProductIdFromCard(card);
  const product = getProductById(productId);
  const displayProduct = getProductDisplayData(product);
  const cardContainer = card.closest(".all") || card.parentElement;
  const detailBox = card.querySelector(".detail-box");
  const image = card.querySelector(".img-box img");
  const title = detailBox && detailBox.querySelector("h5");
  const description = detailBox && detailBox.querySelector("p");
  const price = detailBox && detailBox.querySelector(".options h6");
  const primaryLink = detailBox && detailBox.querySelector(".product-link-btn");
  const productUrl = buildProductUrl(product.id);

  card.setAttribute("data-product-id", product.id);
  card.setAttribute("data-product-url", productUrl);

  if (cardContainer) {
    cardContainer.setAttribute("data-search", getProductSearchText(product));
    cardContainer.classList.remove(
      "burger",
      "pizza",
      "pasta",
      "fries",
      "noodles",
      "sauces",
      "frozen",
      "essentials",
      "seafood",
      "pantry",
      "beverages"
    );
    cardContainer.classList.add("all", getProductFilterClass(product));
  }

  if (image) {
    applyResponsiveImage(image, product.originalImages?.[0] || product.images[0] || "", {
      alt: displayProduct.name,
      width: 600,
      height: 600,
      loading: image.getAttribute("loading") || "lazy",
      fetchpriority: image.getAttribute("fetchpriority") || "",
      sizes: "(max-width: 575px) 88vw, (max-width: 991px) 44vw, 360px"
    });
    bindImageFallback(image);
  }

  ensureWishlistButton(card, product);
  ensureShareButton(card, product, productUrl);

  // Wrap the image container content in a product link so "Open link in new tab" opens the details page.
  // We intentionally wrap only the inner image content so the wishlist button (which is a button element)
  // remains a sibling inside `.img-box` and is not placed inside an anchor.
  try {
    const imageBox = card.querySelector(".img-box");
    if (imageBox) {
      // find or create the anchor that will hold the image content
      let imageLink = imageBox.querySelector("a.product-card-image-link");
      if (!imageLink) {
        imageLink = document.createElement("a");
        imageLink.className = "product-card-image-link";
        imageBox.insertBefore(imageLink, imageBox.firstChild);
      }

      // ensure anchor points to the product page
      try {
        imageLink.href = productUrl;
        imageLink.setAttribute("aria-label", getProductUiText("viewDetailsForProduct", "View details for {name}", { name: displayProduct.name }));
      } catch (err) {
        // ignore non-HTML context
      }

      // create or reuse an inner wrapper to hold the image so we don't move interactive controls
      let inner = imageLink.querySelector(".product-image-inner");
      if (!inner) {
        inner = document.createElement("div");
        inner.className = "product-image-inner";
        imageLink.appendChild(inner);
      }

      // move the responsive image media into the inner wrapper if it's not already there
      const imageMedia = image ? image.closest("picture") || image : null;
      if (imageMedia && inner !== imageMedia.parentElement) {
        inner.appendChild(imageMedia);
      }
    }
  } catch (err) {
    console.error("Failed to wrap product image container with link", err);
  }

  // Wrap the title text with a link so right-click -> open link opens the product page
  if (title) {
    if (!title.querySelector("a")) {
      const titleLink = document.createElement("a");
      titleLink.href = productUrl;
      titleLink.setAttribute("aria-label", getProductUiText("viewDetailsForProduct", "View details for {name}", { name: displayProduct.name }));
      titleLink.textContent = displayProduct.name;
      title.textContent = "";
      title.appendChild(titleLink);
    } else {
      const existingLink = title.querySelector("a");
      existingLink.href = productUrl;
      existingLink.textContent = displayProduct.name;
      existingLink.setAttribute("aria-label", getProductUiText("viewDetailsForProduct", "View details for {name}", { name: displayProduct.name }));
    }

    bindProductTitleReveal(title, displayProduct);
  }

  if (description) {
    description.textContent = displayProduct.description;
  }

  applyProductOfferToCard(card, product);

  const imageBox = card.querySelector(".img-box");
  if (imageBox && !card.querySelector("[data-product-stock-status]")) {
    const stockStatus = document.createElement("span");
    stockStatus.className = "product_stock_status";
    stockStatus.setAttribute("data-product-stock-status", product.id);
    stockStatus.hidden = true;
    imageBox.appendChild(stockStatus);
  }

  if (primaryLink) {
    primaryLink.setAttribute("href", productUrl);
    primaryLink.setAttribute("aria-label", getProductUiText("viewDetailsForProduct", "View details for {name}", { name: displayProduct.name }));
    primaryLink.textContent = getProductUiText("viewDetails", "View Details");
  }

  if (detailBox && !detailBox.querySelector(".product_card_rating")) {
    const titleRow = detailBox.querySelector("h5");
    const ratingSnippet = document.createElement("div");
    ratingSnippet.className = "product_card_rating";
    ratingSnippet.hidden = true;

    if (titleRow) {
      titleRow.insertAdjacentElement("afterend", ratingSnippet);
    } else {
      detailBox.insertBefore(ratingSnippet, detailBox.firstChild);
    }
  }

  bindCardNavigation(card, productUrl);

  const options = detailBox && detailBox.querySelector(".options");
  if (!options) {
    return product;
  }

  let actionGroup = options.querySelector(".product_action_group");
  if (!actionGroup) {
    actionGroup = document.createElement("div");
    actionGroup.className = "product_action_group";

    if (primaryLink) {
      actionGroup.appendChild(primaryLink);
    }

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "product-cart-btn";
    addButton.setAttribute("aria-label", getProductUiText("addProductToCart", "Add {name} to cart", { name: displayProduct.name }));
    addButton.innerHTML = '<i class="fa fa-plus" aria-hidden="true"></i>';
    addButton.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await addCartItemWithInventory(product, 1, {
        successMessage: getProductUiText("addedToCart", "Product added to cart successfully")
      });
    });

    actionGroup.appendChild(addButton);
    options.appendChild(actionGroup);
  }

  return product;
}

function applyProductOfferToCard(card, product) {
  const detailBox = card.querySelector(".detail-box");
  const price = detailBox && detailBox.querySelector(".options h6");
  const imageBox = card.querySelector(".img-box");
  const offer = getActiveOfferForProduct(product.id);
  if (price) {
    price.innerHTML = getProductCardPriceMarkup(product);
    price.classList.toggle("product_card_price--offer", Boolean(offer));
  }
  let badge = imageBox && imageBox.querySelector(".product_offer_badge");
  if (offer && imageBox) {
    if (!badge) { badge = document.createElement("span"); badge.className = "product_offer_badge"; imageBox.appendChild(badge); }
    badge.textContent = getOfferDisplayData(offer).discountLabel;
    badge.hidden = false;
  } else if (badge) {
    badge.hidden = true;
  }
}

function updateProductCardInventory(card) {
  const productId = getProductIdFromCard(card);
  const status = getInventoryStatus(productId);
  const stockStatus = card.querySelector("[data-product-stock-status]");
  const addButton = card.querySelector(".product-cart-btn");

  if (stockStatus) {
    stockStatus.textContent = getProductStockStatusText(status);
    stockStatus.hidden = !status.message;
    stockStatus.classList.toggle("is_out", status.isOutOfStock);
    stockStatus.classList.toggle("is_low", status.isLowStock);
  }

  if (addButton) {
    addButton.disabled = status.isOutOfStock;
    addButton.setAttribute("aria-disabled", String(status.isOutOfStock));
    addButton.setAttribute("title", status.isOutOfStock ? getProductUiText("outOfStock", "Out of Stock") : getProductUiText("addToCartLower", "Add to cart"));
  }
}

function updateCardSummary(card, summary) {
  const ratingRoot = card.querySelector(".product_card_rating");
  if (!ratingRoot) {
    return;
  }

  const productId = getProductIdFromCard(card);
  ratingRoot.outerHTML = buildRatingSummaryMarkup(summary, "", { productId });
}

document.addEventListener("DOMContentLoaded", () => {
  syncProductsPageText();
  renderProductGrids();

  const cards = Array.from(document.querySelectorAll(".product-card"));
  window.addEventListener("sushi-box:language-change", () => {
    syncProductsPageText();
    document.querySelectorAll(".product_grid_empty").forEach((message) => {
      message.textContent = getProductUiText("noProductsAvailable", "No products are available right now.");
    });
  });

  if (!cards.length) {
    return;
  }

  const filterApi = window.SushiBoxGridFilters;

  cards.forEach((card) => {
    enhanceProductCard(card);
  });

  subscribeToInventory(() => {
    cards.forEach(updateProductCardInventory);
  }, (error) => {
    console.error("Product grid inventory listener failed.", error);
  });

  subscribeToProductOffers(() => {
    cards.forEach((card) => applyProductOfferToCard(card, getProductById(getProductIdFromCard(card))));
  }, (error) => console.error("Product card offers could not be loaded.", error));

  window.dispatchEvent(new CustomEvent("sushi-box:wishlist-controls-ready"));

  window.addEventListener("sushi-box:language-change", () => {
    cards.forEach((card) => {
      enhanceProductCard(card);
      updateProductCardInventory(card);
    });
  });

  if (filterApi && typeof filterApi.refresh === "function") {
    filterApi.refresh();
  }

  import("./firebase-reviews.js?v=20260618b")
    .then(({ subscribeToReviewSummaries }) => {
      subscribeToReviewSummaries((summaries) => {
        primeRatingsCache(summaries);
        cards.forEach((card) => {
          const productId = getProductIdFromCard(card);
          updateCardSummary(card, summaries[productId]);
        });

        if (filterApi && typeof filterApi.refresh === "function") {
          filterApi.refresh();
        }
      }, (error) => {
        console.error("Live review summary listener failed.", error);
      });
    })
    .catch((error) => {
      console.error("Review summaries could not be loaded.", error);
    });

  window.addEventListener("sushi-box:search-query", (event) => {
    const query = ((event.detail && event.detail.query) || "").trim().toLowerCase();
    const smartMatches = getSmartSearchProductIds(query);

    cards.forEach((card) => {
      const productId = getProductIdFromCard(card);
      const product = getProductById(productId);
      const matchesQuery = productMatchesSmartSearch(product, query, smartMatches.idSet);
      card.classList.toggle("search_dimmed", !matchesQuery);
    });

    if (filterApi && typeof filterApi.setSearch === "function") {
      filterApi.setSearch(query, smartMatches.ids);
    } else {
      cards.forEach((card) => {
        const column = card.closest(".all") || card.parentElement;
        const product = getProductById(getProductIdFromCard(card));
        const matchesQuery = productMatchesSmartSearch(product, query, smartMatches.idSet);
        if (column) {
          column.hidden = !matchesQuery;
        }
      });
    }
  });

  const initialSearchQuery = getInitialSearchQuery();
  if (initialSearchQuery) {
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sushi-box:search-query", {
        detail: {
          query: initialSearchQuery
        }
      }));
    }, 0);
  }
});
