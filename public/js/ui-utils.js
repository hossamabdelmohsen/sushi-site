function normalizeRating(rating) {
  return Math.max(0, Math.min(5, Number(rating) || 0));
}

const REVIEW_SUMMARIES_CACHE_KEY = "sushi-box-review-summaries:v1";
const REVIEW_STORAGE_KEY_PATTERNS = [
  (productId) => `reviews_${productId}`,
  (productId) => `product_reviews_${productId}`,
  (productId) => `ratings_${productId}`,
  (productId) => `${productId}_reviews`
];

function getGlobalRatingsCache() {
  if (typeof window === "undefined") {
    return {};
  }

  if (!window.ratingsCache || typeof window.ratingsCache !== "object") {
    window.ratingsCache = {};
  }

  return window.ratingsCache;
}

function getSessionRatingsCache() {
  if (typeof window === "undefined" || !window.sessionStorage) {
    return {};
  }

  try {
    const cachedValue = JSON.parse(window.sessionStorage.getItem(REVIEW_SUMMARIES_CACHE_KEY) || "null");
    if (!cachedValue || !cachedValue.summaries || typeof cachedValue.summaries !== "object") {
      return {};
    }

    return cachedValue.summaries;
  } catch (error) {
    return {};
  }
}

function getLocalStoredReviews(productId) {
  if (!productId || typeof window === "undefined" || !window.localStorage) {
    return null;
  }

  for (const getKey of REVIEW_STORAGE_KEY_PATTERNS) {
    const storageKey = getKey(productId);
    const rawValue = window.localStorage.getItem(storageKey);
    if (!rawValue) {
      continue;
    }

    try {
      const reviews = JSON.parse(rawValue);
      if (Array.isArray(reviews) && reviews.length) {
        const totalRating = reviews.reduce((sum, review) => {
          return sum + (Number(review && (review.rating ?? review.stars)) || 0);
        }, 0);

        return {
          totalReviews: reviews.length,
          averageRating: totalRating / reviews.length
        };
      }
    } catch (error) {}
  }

  return null;
}

function logReviewStorageKeysOnce() {
  if (typeof window === "undefined" || !window.localStorage || window.__sushiBoxReviewKeysLogged) {
    return;
  }

  window.__sushiBoxReviewKeysLogged = true;

  try {
    const relatedKeys = Object.keys(window.localStorage).filter((key) => /review|rating/i.test(key));
    console.log("Sushi Box review-related localStorage keys:", relatedKeys);
  } catch (error) {}
}

export function primeRatingsCache(summaries = {}) {
  const globalCache = getGlobalRatingsCache();
  Object.assign(globalCache, summaries || {});
}

export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildStarMarkup(rating, extraClassName = "") {
  const safeRating = normalizeRating(rating);
  const roundedRating = Math.round(safeRating * 2) / 2;
  const stars = [];

  for (let starIndex = 1; starIndex <= 5; starIndex += 1) {
    let iconClass = "fa-star-o";

    if (roundedRating >= starIndex) {
      iconClass = "fa-star";
    } else if (roundedRating >= starIndex - 0.5) {
      iconClass = "fa-star-half-o";
    }

    stars.push(`<i class="fa ${iconClass}" aria-hidden="true"></i>`);
  }

  return `<span class="rating_stars ${extraClassName}">${stars.join("")}</span>`;
}

export function getRatingSummaryValues(summary) {
  const totalReviews = Math.max(0, Number(summary && summary.totalReviews) || 0);
  const averageRating = totalReviews
    ? Math.max(0, Math.min(5, Number(summary && summary.averageRating) || 0))
    : 0;

  return {
    totalReviews,
    averageRating
  };
}

export function getProductRating(productId, summary = null) {
  const normalizedProductId = String(productId || "").trim();

  if (summary && Number(summary.totalReviews) > 0) {
    return getRatingSummaryValues(summary);
  }

  if (!normalizedProductId) {
    return null;
  }

  const globalCache = getGlobalRatingsCache();
  const cachedSummary = globalCache[normalizedProductId];
  if (cachedSummary && Number(cachedSummary.totalReviews) > 0) {
    return getRatingSummaryValues(cachedSummary);
  }

  const sessionSummary = getSessionRatingsCache()[normalizedProductId];
  if (sessionSummary && Number(sessionSummary.totalReviews) > 0) {
    globalCache[normalizedProductId] = sessionSummary;
    return getRatingSummaryValues(sessionSummary);
  }

  const localSummary = getLocalStoredReviews(normalizedProductId);
  if (localSummary && Number(localSummary.totalReviews) > 0) {
    globalCache[normalizedProductId] = localSummary;
    return getRatingSummaryValues(localSummary);
  }

  logReviewStorageKeysOnce();
  return null;
}

export function formatReviewCount(totalReviews) {
  return `${totalReviews} review${totalReviews === 1 ? "" : "s"}`;
}

export function buildRatingSummaryMarkup(summary, extraClassName = "", options = {}) {
  const productId = options.productId || "";
  const resolvedSummary = getProductRating(productId, summary);
  const { totalReviews, averageRating } = getRatingSummaryValues(resolvedSummary);
  const className = ["product_card_rating", extraClassName].filter(Boolean).join(" ");
  const emptyText = options.emptyText || "";

  if (!totalReviews) {
    return emptyText
      ? `<div class="${className} is_empty"><span class="product_card_rating_empty">${escapeHtml(emptyText)}</span></div>`
      : `<div class="${className}" hidden></div>`;
  }

  const averageText = averageRating.toFixed(1);

  return `
    <div class="${className}" aria-label="${escapeHtml(`${averageText} out of 5 from ${formatReviewCount(totalReviews)}`)}">
      ${buildStarMarkup(averageRating, "compact")}
      <span class="product_card_rating_average">${averageText}</span>
      <span class="product_card_rating_count">(${escapeHtml(totalReviews)})</span>
    </div>
  `;
}

const CARD_NAVIGATION_INTERACTIVE_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "[role='button']",
  "[role='link']",
  "[contenteditable='true']"
].join(", ");

export function isCardNavigationInteractiveTarget(target) {
  return Boolean(
    target
    && typeof target.closest === "function"
    && target.closest(CARD_NAVIGATION_INTERACTIVE_SELECTOR)
  );
}

export function bindCardNavigation(card, productUrl) {
  if (!card || !productUrl) {
    return;
  }

  card.setAttribute("data-product-url", productUrl);

  if (card.getAttribute("data-card-navigation-ready") === "true") {
    return;
  }

  card.setAttribute("data-card-navigation-ready", "true");
  card.addEventListener("click", (event) => {
    if (event.defaultPrevented || isCardNavigationInteractiveTarget(event.target)) {
      return;
    }

    const nextUrl = card.getAttribute("data-product-url") || productUrl;
    if (nextUrl) {
      window.location.href = nextUrl;
    }
  });
}

export function timestampToDate(timestamp) {
  if (!timestamp) {
    return null;
  }

  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }

  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }

  const parsedDate = new Date(timestamp);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function formatReviewDate(timestamp) {
  const date = timestampToDate(timestamp);
  if (!date) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

export function emitToast(message, tone = "info") {
  window.dispatchEvent(new CustomEvent("sushi-box:notify", {
    detail: {
      message,
      tone
    }
  }));
}

function buildAbsoluteUrl(url) {
  try {
    return new URL(url || window.location.href, window.location.href).href;
  } catch (error) {
    return window.location.href;
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement("textarea");
  input.value = text;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.top = "-9999px";
  input.style.left = "-9999px";
  document.body.appendChild(input);
  input.select();

  try {
    document.execCommand("copy");
  } finally {
    input.remove();
  }
}

export async function shareProduct(product, productUrl) {
  const shareUrl = buildAbsoluteUrl(productUrl);
  const shareData = {
    title: product && product.name ? product.name : document.title,
    text: product && product.description ? product.description : "",
    url: shareUrl
  };

  if (navigator.share && typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return;
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
    }
  }

  try {
    await copyTextToClipboard(shareUrl);
    emitToast("Link copied!", "success");
  } catch (error) {
    emitToast("Could not copy the link. Please copy it from the address bar.", "error");
  }
}

export function emitSearchQuery(query) {
  window.dispatchEvent(new CustomEvent("sushi-box:search-query", {
    detail: {
      query: String(query || "")
    }
  }));
}
