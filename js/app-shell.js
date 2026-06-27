import { getCurrentUser, signInWithGoogle, signOutUser, subscribeToAuthState } from "./firebase-auth.js?v=20260504i";
import { isAdminUser } from "./admin-access.js?v=20260520a";
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
  buildResponsiveImageMarkup,
  buildProductUrl,
  formatPrice,
  getAllProducts,
  getExactProductById,
  getProductById,
  searchProductsDetailed
} from "./product-catalog.js?v=20260603a";
import {
  addWishlistItem,
  getWishlist,
  isProductWishlisted,
  subscribeToWishlist,
  toggleWishlistItem
} from "./wishlist-store.js?v=20260602c";
import { getActiveOffers, getCartOfferSubtotal, getProductOfferPricing, subscribeToProductOffers } from "./offers-data.js?v=20260620a";
import {
  buildRatingSummaryMarkup,
  emitSearchQuery,
  emitToast,
  escapeHtml,
  primeRatingsCache
} from "./ui-utils.js?v=20260523a";
import {
  trackAddPaymentInfo,
  trackAddShippingInfo,
  trackBannerClick,
  trackBannerView,
  trackJavascriptError,
  trackScrollDepth,
  trackSearch,
  trackWhatsAppClick
} from "./analytics-events.js?v=20260602c";
import {
  applyTranslations,
  getLanguage,
  initI18n,
  t
} from "./i18n/i18n.js";

const THEME_STORAGE_KEY = "theme";
const LEGACY_THEME_STORAGE_KEY = "sushiBoxTheme";
const LEGACY_PRIVATE_STORAGE_KEYS = [
  "sushi-box-pending-order",
  "sushi-box-checkout-customer",
  "sushi-box-customer",
  "sushiBoxCustomer",
  "sushiBoxCustomerDetails",
  "checkoutCustomer",
  "customerDetails",
  "customerName",
  "fullName",
  "name",
  "customerPhone",
  "phone",
  "mobile",
  "customerAddress",
  "address"
];
let searchPanelScrollPosition = { x: 0, y: 0 };
let cartDrawerScrollPosition = { x: 0, y: 0 };
let lastCartMarkupKey = "";
let authPromptHandled = false;
let authRedirectInProgress = false;
let sideDrawerCloseTimer = null;
let searchPanelCloseTimer = null;
let latestAuthUser = null;
let latestReviewSummaries = {};
let searchAnalyticsTimer = 0;
let lastTrackedSearchSignature = "";

const SIDE_DRAWER_NAV_ITEMS = [
  { label: "Home", i18nKey: "nav.home", href: "index.html", icon: "fa-home" },
  { label: "Admin Dashboard", i18nKey: "nav.adminDashboard", href: "admin-orders.html", icon: "fa-shield", requiresAdmin: true },
  { label: "My Orders", i18nKey: "nav.orders", href: "orders.html", icon: "fa-list-alt" },
  { label: "Products", i18nKey: "nav.products", href: "menu.html", icon: "fa-cutlery" },
  { label: "How to Order", i18nKey: "nav.howToOrder", href: "book.html", icon: "fa-paper-plane" },
  { label: "About", i18nKey: "nav.about", href: "about.html", icon: "fa-info-circle" },
  { label: "Feedback", i18nKey: "nav.feedback", href: "feedback.html", icon: "fa-commenting-o" },
  { label: "My Favorites", i18nKey: "nav.favorites", href: "wishlist.html", icon: "fa-heart-o", hasWishlistBadge: true },
  { label: "Offers", i18nKey: "nav.offers", href: "offers.html", icon: "fa-tags", hasOfferBadge: true }
];

function createElementFromHTML(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

function getSitePageHref(pageName) {
  return window.location.pathname.startsWith("/products/") ? `/${pageName}` : pageName;
}

function getLocalizedText(key, fallback = "", values = {}) {
  return t(key, fallback, values);
}

function getProductUiText(key, fallback = "", values = {}) {
  return getLocalizedText(`productUi.${key}`, fallback, values);
}

function getCartUiText(key, fallback = "", values = {}) {
  return getLocalizedText(`cartUi.${key}`, fallback, values);
}

function getCartUiCountText(key, count, fallbackSingular, fallbackPlural) {
  const isSingle = count === 1;
  return getCartUiText(isSingle ? key : `${key}_plural`, isSingle ? fallbackSingular : fallbackPlural, { count });
}

function getProductUiCountText(key, count, fallbackSingular, fallbackPlural) {
  const isSingle = count === 1;
  return getProductUiText(isSingle ? key : `${key}_plural`, isSingle ? fallbackSingular : fallbackPlural, { count });
}

function getCurrentPageFileName() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function getNavLinkMarkup(i18nKey, fallback, isCurrent = false, options = {}) {
  const label = escapeHtml(getLocalizedText(i18nKey, fallback));
  const badge = options.badgeMarkup || "";
  const current = isCurrent ? ' <span class="sr-only">(current)</span>' : "";
  return `<span data-i18n="${i18nKey}">${label}</span>${badge}${current}`;
}

function setNavLinkMarkup(link, i18nKey, fallback, isCurrent = false, options = {}) {
  if (!link) {
    return;
  }

  link.innerHTML = getNavLinkMarkup(i18nKey, fallback, isCurrent, options);
  applyTranslations(link);
}

function normalizeNavHref(href) {
  return String(href || "").replace(/^\/+/, "");
}

function getNavTranslationByHref(href) {
  const normalizedHref = normalizeNavHref(href);
  const navMap = {
    "index.html": { i18nKey: "nav.home", fallback: "Home" },
    "menu.html": { i18nKey: "nav.products", fallback: "Products" },
    "book.html": { i18nKey: "nav.howToOrder", fallback: "How to Order" },
    "about.html": { i18nKey: "nav.about", fallback: "About" },
    "feedback.html": { i18nKey: "nav.feedback", fallback: "Feedback" },
    "wishlist.html": { i18nKey: "nav.favorites", fallback: "My Favorites", hasWishlistBadge: true },
    "orders.html": { i18nKey: "nav.orders", fallback: "My Orders" },
    "offers.html": { i18nKey: "nav.offers", fallback: "Offers" },
    "admin-orders.html": { i18nKey: "nav.adminDashboard", fallback: "Admin Dashboard" }
  };

  return navMap[normalizedHref] || null;
}

function ensurePrimaryNavI18n() {
  const currentPage = getCurrentPageFileName();
  document.querySelectorAll(".navbar-nav .nav-link").forEach((link) => {
    const navItem = link.closest(".nav-item");
    const navTranslation = getNavTranslationByHref(link.getAttribute("href"));
    if (!navTranslation) {
      return;
    }

    const href = normalizeNavHref(link.getAttribute("href"));
    const isCurrent = currentPage === href || Boolean(navItem && navItem.classList.contains("active"));
    const badgeMarkup = navTranslation.hasWishlistBadge
      ? ' <span class="wishlist_count_badge" hidden>0</span>'
      : "";
    setNavLinkMarkup(link, navTranslation.i18nKey, navTranslation.fallback, isCurrent, { badgeMarkup });
  });
}

function setI18nText(selector, key, root = document) {
  root.querySelectorAll(selector).forEach((element) => {
    element.setAttribute("data-i18n", key);
  });
}

function setI18nAttribute(selector, dataAttribute, key, root = document) {
  root.querySelectorAll(selector).forEach((element) => {
    element.setAttribute(dataAttribute, key);
  });
}

function setI18nTextByIndex(selector, keys, root = document) {
  const elements = Array.from(root.querySelectorAll(selector));
  keys.forEach((key, index) => {
    if (elements[index]) {
      elements[index].setAttribute("data-i18n", key);
    }
  });
}

function setI18nByExactText(selector, textMap, root = document) {
  root.querySelectorAll(selector).forEach((element) => {
    const text = element.textContent.replace(/\s+/g, " ").trim();
    const key = textMap[text];
    if (key) {
      element.setAttribute("data-i18n", key);
    }
  });
}

function wrapInlineTextWithI18n(element, key) {
  if (!element || element.querySelector(`[data-i18n="${key}"]`)) {
    return;
  }

  const textNode = Array.from(element.childNodes).find((node) => {
    return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
  });

  if (!textNode) {
    return;
  }

  const prefix = textNode.textContent.match(/^\s*/)?.[0] || "";
  const suffix = textNode.textContent.match(/\s*$/)?.[0] || "";
  const label = document.createElement("span");
  label.setAttribute("data-i18n", key);
  label.textContent = textNode.textContent.trim();

  if (prefix) {
    element.insertBefore(document.createTextNode(prefix), textNode);
  }
  element.insertBefore(label, textNode);
  if (suffix) {
    element.insertBefore(document.createTextNode(suffix), textNode);
  }
  element.removeChild(textNode);
}

function annotateFooterI18n(root = document) {
  root.querySelectorAll(".footer_section").forEach((footer) => {
    setI18nText(".footer_contact h4", "footer.contactUs", footer);
    setI18nAttribute(".footer_policy_links_contact", "data-i18n-aria-label", "footer.companyLinks", footer);
    setI18nAttribute(".footer_policy_links_delivery", "data-i18n-aria-label", "footer.policyLinks", footer);
    setI18nAttribute(".footer_messenger_link", "data-i18n-aria-label", "footer.messenger", footer);
    setI18nText(".footer_detail p", "footer.description", footer);
    setI18nText(".footer-col > h4", "footer.deliverySchedule", footer);

    setI18nByExactText(".contact_link_box span, .footer_policy_links a, .delivery-text strong, .delivery-text span", {
      "Egypt - El Gharbia - El Mahalla El Kubra": "footer.location",
      "Call +201503460361": "footer.call",
      "WhatsApp": "footer.whatsapp",
      "About Us": "footer.aboutUs",
      "Privacy Policy": "footer.privacyPolicy",
      "Delivery & Shipping Policy": "footer.deliveryPolicy",
      "Refund & Cancellation Policy": "footer.refundPolicy",
      "Kafr El Sheikh": "common.cities.kafrElSheikh",
      "Mansoura": "common.cities.mansoura",
      "Tanta": "common.cities.tanta",
      "El Mahalla": "common.cities.elMahalla",
      "Wednesday, Thursday, Friday": "common.wednesdayFriday"
    }, footer);

    const copyright = footer.querySelector(".footer-info p");
    const year = footer.querySelector("#displayYear")?.textContent || "";
    if (copyright && copyright.dataset.i18nReady !== "true") {
      copyright.dataset.i18nReady = "true";
      copyright.innerHTML = `&copy; <span id="displayYear">${escapeHtml(year)}</span> <span data-i18n="footer.copyrightSuffix">Sushi Box. All rights reserved.</span>`;
    }
  });
}

function annotateAboutPageI18n() {
  if (!document.querySelector(".about_article_section")) {
    return;
  }

  setI18nText(".about_article_label", "aboutPage.label");
  setI18nText(".about_article_hero h1", "aboutPage.title");
  setI18nText(".about_article_hero p", "aboutPage.intro");
  setI18nTextByIndex(".about_article_content .about_article_block h2", [
    "aboutPage.ingredientsTitle",
    "aboutPage.productsTitle",
    "aboutPage.visionTitle",
    "aboutPage.missionTitle"
  ]);
  setI18nTextByIndex(".about_article_content .about_article_block:nth-of-type(1) p", [
    "aboutPage.ingredientsP1",
    "aboutPage.ingredientsP2",
    "aboutPage.ingredientsP3"
  ]);
  setI18nText(".about_article_content .about_article_block:nth-of-type(2) > p:first-of-type", "aboutPage.productsIntro");
  setI18nText(".about_article_content .about_article_block:nth-of-type(2) > p:last-of-type", "aboutPage.productsOutro");
  setI18nTextByIndex(".about_product_item h3", [
    "aboutPage.productSushiTitle",
    "aboutPage.productNoodlesTitle",
    "aboutPage.productDumplingsTitle",
    "aboutPage.productSaucesTitle",
    "aboutPage.productFrozenTitle",
    "aboutPage.productPantryTitle"
  ]);
  setI18nTextByIndex(".about_product_item p", [
    "aboutPage.productSushiText",
    "aboutPage.productNoodlesText",
    "aboutPage.productDumplingsText",
    "aboutPage.productSaucesText",
    "aboutPage.productFrozenText",
    "aboutPage.productPantryText"
  ]);
  setI18nText(".about_article_content .about_article_block:nth-of-type(3) p", "aboutPage.visionText");
  setI18nText(".about_article_content .about_article_block:nth-of-type(4) p", "aboutPage.missionIntro");
  setI18nTextByIndex(".about_check_list li", [
    "aboutPage.missionPoint1",
    "aboutPage.missionPoint2",
    "aboutPage.missionPoint3",
    "aboutPage.missionPoint4"
  ]);
  setI18nAttribute(".about_article_sidebar", "data-i18n-aria-label", "aboutPage.highlightsAria");
  setI18nAttribute(".about_image_panel img", "data-i18n-attr", "alt:aboutPage.imageAlt");
  setI18nTextByIndex(".about_highlight_panel h2", [
    "aboutPage.distributeTitle",
    "aboutPage.whyTitle"
  ]);
  setI18nText(".about_highlight_panel:first-of-type p", "aboutPage.distributeText");
  setI18nTextByIndex(".about_highlight_panel:nth-of-type(2) li", [
    "aboutPage.whyPoint1",
    "aboutPage.whyPoint2",
    "aboutPage.whyPoint3",
    "aboutPage.whyPoint4",
    "aboutPage.whyPoint5",
    "aboutPage.whyPoint6"
  ]);
  setI18nByExactText(".about_highlight_panel:first-of-type li", {
    "Mansoura": "common.cities.mansoura",
    "Kafr El Sheikh": "common.cities.kafrElSheikh",
    "Tanta": "common.cities.tanta",
    "El Mahalla": "common.cities.elMahalla"
  });
  setI18nText(".about_cta_inner h2", "aboutPage.ctaTitle");
  setI18nText(".about_cta_inner a", "aboutPage.ctaButton");
}

function annotateOrderPageI18n() {
  if (!document.querySelector(".how_to_order_section")) {
    return;
  }

  setI18nText(".how_to_order_section .heading_container:first-of-type h2", "orderPage.title");
  setI18nText(".how_to_order_intro", "orderPage.intro");
  setI18nText(".order_section_title", "orderPage.worksTitle");
  setI18nTextByIndex(".order_step_item h5", [
    "orderPage.stepExploreTitle",
    "orderPage.stepCartTitle",
    "orderPage.stepOpenTitle",
    "orderPage.stepDeliveryTitle",
    "orderPage.stepReviewTitle",
    "orderPage.stepPaymentTitle",
    "orderPage.stepSupportTitle"
  ]);
  setI18nTextByIndex(".order_step_item p", [
    "orderPage.stepExploreText",
    "orderPage.stepCartText",
    "orderPage.stepOpenText",
    "orderPage.stepDeliveryText",
    "orderPage.stepReviewText",
    "orderPage.stepPaymentText",
    "orderPage.stepSupportText"
  ]);
  setI18nText(".delivery_schedule_panel .heading_container h2", "orderPage.deliveryTitle");
  setI18nText(".delivery_schedule_panel .heading_container p", "orderPage.deliveryIntro");
  setI18nByExactText(".delivery_schedule_item span, .delivery_schedule_item strong", {
    "Kafr El Sheikh": "common.cities.kafrElSheikh",
    "Mansoura": "common.cities.mansoura",
    "Tanta": "common.cities.tanta",
    "El Mahalla": "common.cities.elMahalla",
    "Wednesday, Thursday, Friday": "common.wednesdayFriday"
  });
  setI18nText(".wholesale_order_kicker", "orderPage.wholesaleKicker");
  setI18nText(".wholesale_order_box h3", "orderPage.wholesaleTitle");
  setI18nText(".wholesale_order_box p", "orderPage.wholesaleText");
  document.querySelectorAll(".wholesale_contact_btn").forEach((button) => {
    wrapInlineTextWithI18n(button, "orderPage.contactSales");
  });
}

function annotateFeedbackPageI18n() {
  if (!document.querySelector(".feedback_hero_section")) {
    return;
  }

  setI18nText(".feedback_kicker", "feedbackPage.kicker");
  const title = document.querySelector(".feedback_hero_header h1");
  if (title && title.dataset.i18nReady !== "true") {
    title.dataset.i18nReady = "true";
    title.innerHTML = '<span data-i18n="feedbackPage.titlePrefix">Your Opinion Helps</span> <span class="feedback_heading_tail" data-i18n="feedbackPage.titleTail">Us Improve</span>';
  }
  setI18nText(".feedback_hero_header p", "feedbackPage.intro");
  setI18nAttribute(".feedback_info_panel", "data-i18n-aria-label", "feedbackPage.supportAria");
  setI18nText(".feedback_info_panel h2", "feedbackPage.readTitle");
  setI18nText(".feedback_info_panel > p", "feedbackPage.readText");
  setI18nTextByIndex(".feedback_support_list span", [
    "feedbackPage.ideaPoint",
    "feedbackPage.deliveryPoint",
    "feedbackPage.servicePoint"
  ]);
  setI18nText(".feedback_direct_support > span", "feedbackPage.directSupport");
  document.querySelectorAll(".feedback_direct_support a").forEach((link) => {
    wrapInlineTextWithI18n(link, "feedbackPage.whatsapp");
  });
  setI18nText(".feedback_form_intro span", "feedbackPage.formKicker");
  setI18nText(".feedback_form_intro h2", "feedbackPage.formTitle");
  setI18nTextByIndex(".feedback_form label", [
    "feedbackPage.fullName",
    "feedbackPage.email",
    "feedbackPage.type",
    "feedbackPage.subject",
    "feedbackPage.message"
  ]);
  setI18nAttribute("#feedbackName", "data-i18n-placeholder", "feedbackPage.fullNamePlaceholder");
  setI18nAttribute("#feedbackEmail", "data-i18n-placeholder", "feedbackPage.emailPlaceholder");
  setI18nAttribute("#feedbackSubject", "data-i18n-placeholder", "feedbackPage.subjectPlaceholder");
  setI18nAttribute("#feedbackMessage", "data-i18n-placeholder", "feedbackPage.messagePlaceholder");
  setI18nTextByIndex("#feedbackType option", [
    "feedbackPage.typeSuggestion",
    "feedbackPage.typeComplaint",
    "feedbackPage.typeProductRequest",
    "feedbackPage.typeBugReport",
    "feedbackPage.typeGeneral"
  ]);
  setI18nText(".feedback_form_footer p", "feedbackPage.privacyNote");
  setI18nText(".feedback_submit_text", "feedbackPage.send");
  setI18nText(".feedback_appreciation_inner h2", "feedbackPage.appreciationTitle");
  setI18nText(".feedback_appreciation_inner p", "feedbackPage.appreciationText");
}

function annotateDeliveryPolicyI18n() {
  if (getCurrentPageFileName() !== "delivery-shipping-policy.html" || !document.querySelector(".policy_page_main")) {
    return;
  }

  document.querySelectorAll(".policy_kicker").forEach((kicker) => {
    wrapInlineTextWithI18n(kicker, "deliveryPolicy.kicker");
  });
  setI18nText(".policy_hero_card h1", "deliveryPolicy.title");
  setI18nText(".policy_hero_card p", "deliveryPolicy.intro");
  setI18nText(".policy_meta", "deliveryPolicy.effectiveDate");
  setI18nTextByIndex(".policy_section h2", [
    "deliveryPolicy.areasTitle",
    "deliveryPolicy.scheduleTitle",
    "deliveryPolicy.coordinationTitle",
    "deliveryPolicy.handlingTitle"
  ]);
  setI18nTextByIndex(".policy_section p", [
    "deliveryPolicy.areasText",
    "deliveryPolicy.scheduleText",
    "deliveryPolicy.coordinationText",
    "deliveryPolicy.handlingText"
  ]);
  setI18nTextByIndex(".policy_section li", [
    "deliveryPolicy.scheduleKafr",
    "deliveryPolicy.scheduleMansoura",
    "deliveryPolicy.scheduleTanta",
    "deliveryPolicy.scheduleMahalla"
  ]);
}

function refreshNiceSelectI18n() {
  if (window.jQuery && window.jQuery.fn && window.jQuery.fn.niceSelect) {
    window.jQuery("select").niceSelect("update");
  }
}

function annotatePhase2StaticContent() {
  annotateAboutPageI18n();
  annotateOrderPageI18n();
  annotateFeedbackPageI18n();
  annotateDeliveryPolicyI18n();
  annotateFooterI18n();
  applyTranslations(document);
  refreshNiceSelectI18n();
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
    `Only ${inventoryStatus.available} item available.`,
    `Only ${inventoryStatus.available} items available.`
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

function renderProductThumb({ product = null, imagePath = "", alt = "", width = 74, height = 74, sizes = "74px", loading = "lazy" } = {}) {
  return buildResponsiveImageMarkup({
    product,
    imagePath,
    alt,
    width,
    height,
    loading,
    sizes
  });
}

function getUrlSearchParams() {
  try {
    return new URLSearchParams(window.location.search || "");
  } catch (error) {
    return new URLSearchParams();
  }
}

function shouldOpenLoginFromQuery() {
  const params = getUrlSearchParams();
  return params.get("auth") === "login" || params.get("login") === "true";
}

function getSafeLoginRedirectTarget() {
  const redirect = getUrlSearchParams().get("redirect") || "";
  if (!redirect) {
    return "";
  }

  try {
    const target = new URL(redirect, window.location.href);
    if (target.origin !== window.location.origin) {
      return "";
    }

    if (target.href === window.location.href) {
      return "";
    }

    return target.href;
  } catch (error) {
    return "";
  }
}

function redirectAfterLoginIfRequested() {
  const target = getSafeLoginRedirectTarget();
  if (!target || authRedirectInProgress) {
    return false;
  }

  authRedirectInProgress = true;
  window.location.href = target;
  return true;
}

function cleanPrivateStorage() {
  try {
    window.sessionStorage.removeItem("sushi-box-product-sync:" + ["zumra", "oyster", "sauce"].join("-") + "-280ml");
    window.sessionStorage.removeItem("sushi-box-catalog-sync");
  } catch (error) {}

  try {
    LEGACY_PRIVATE_STORAGE_KEYS.forEach((storageKey) => {
      window.localStorage.removeItem(storageKey);
    });
  } catch (error) {}
}

function formatBadgeCount(count) {
  return count > 99 ? "99+" : String(count);
}

function getWishlistCountFromItems(wishlist) {
  const wishlistIds = new Set(
    (Array.isArray(wishlist) ? wishlist : [])
      .map((item) => item && item.id)
      .filter(Boolean)
  );

  return wishlistIds.size;
}

function updateFavoritesBadge(wishlist = getWishlist()) {
  const count = getWishlistCountFromItems(wishlist);

  document.querySelectorAll(".wishlist_count_badge").forEach((badge) => {
    badge.textContent = formatBadgeCount(count);
    badge.hidden = count === 0;
  });

  document.querySelectorAll(".site_drawer_wishlist_badge").forEach((badge) => {
    badge.textContent = formatBadgeCount(count);
    badge.hidden = false;
  });

  return count;
}

function updateWishlistButtons(wishlist) {
  const wishlistIds = new Set((Array.isArray(wishlist) ? wishlist : []).map((item) => item.id));

  document.querySelectorAll("[data-wishlist-product-id]").forEach((button) => {
    const productId = button.getAttribute("data-wishlist-product-id");
    const isActive = wishlistIds.has(productId);
    const icon = button.querySelector("i");
    const product = getProductById(productId);
    const productName = product ? product.name : "this product";

    button.classList.toggle("is_active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
    button.setAttribute("aria-label", getProductUiText(
      isActive ? "removeProductFromFavorites" : "addProductToFavorites",
      isActive ? "Remove {name} from favorites" : "Add {name} to favorites",
      { name: productName }
    ));
    button.setAttribute("title", getProductUiText(isActive ? "removeFromFavoritesLower" : "addToFavorites", isActive ? "Remove from favorites" : "Add to favorites"));

    if (icon) {
      icon.className = `fa ${isActive ? "fa-heart" : "fa-heart-o"}`;
    }
  });

  updateFavoritesBadge(wishlist);
}

function animateWishlistToggle(button) {
  if (!button) {
    return;
  }

  button.classList.remove("is_popping");
  void button.offsetWidth;
  button.classList.add("is_popping");
}

function ensureHowToOrderNav() {
  const navList = document.querySelector(".navbar-nav");
  if (!navList) {
    return;
  }

  const currentPage = getCurrentPageFileName();
  let howToOrderItem = Array.from(navList.querySelectorAll(".nav-item")).find((item) => {
    const link = item.querySelector(".nav-link");
    if (!link) {
      return false;
    }

    const linkText = link.textContent.replace(/\s+/g, " ").trim();
    return link.getAttribute("href") === "book.html" || linkText.indexOf("How to Order") !== -1;
  });

  if (!howToOrderItem) {
    howToOrderItem = createElementFromHTML('<li class="nav-item"><a class="nav-link" href="book.html">How to Order</a></li>');
    const aboutItem = Array.from(navList.querySelectorAll(".nav-item")).find((item) => {
      const link = item.querySelector(".nav-link");
      return link && link.getAttribute("href") === "about.html";
    });
    navList.insertBefore(howToOrderItem, aboutItem || null);
  }

  const link = howToOrderItem.querySelector(".nav-link");
  link.setAttribute("href", getSitePageHref("book.html"));
  setNavLinkMarkup(link, "nav.howToOrder", "How to Order", currentPage === "book.html");
  if (currentPage === "book.html") {
    howToOrderItem.classList.add("active");
  }
}

function ensureWishlistNav() {
  const navItems = Array.from(document.querySelectorAll(".navbar-nav .nav-item"));
  const wishlistHref = getSitePageHref("wishlist.html");
  const currentPage = getCurrentPageFileName();

  navItems.forEach((item) => {
    const link = item.querySelector(".nav-link");
    if (!link || link.getAttribute("href") !== wishlistHref) {
      return;
    }

    link.classList.add("wishlist_nav_link");
    setNavLinkMarkup(link, "nav.favorites", "My Favorites", currentPage === wishlistHref, {
      badgeMarkup: ' <span class="wishlist_count_badge" hidden>0</span>'
    });

    if (currentPage === wishlistHref) {
      item.classList.add("active");
    }
  });
}

function ensureWishlistAction(userOption) {
  let wishlistLink = document.querySelector(".wishlist_icon_link");

  if (!wishlistLink) {
    wishlistLink = createElementFromHTML(`
      <a class="wishlist_icon_link" href="${getSitePageHref("wishlist.html")}" aria-label="${escapeHtml(getLocalizedText("header.viewFavorites", "View favorites"))}" title="${escapeHtml(getLocalizedText("header.favoritesTitle", "Favorites"))}" data-i18n-attr="aria-label:header.viewFavorites,title:header.favoritesTitle">
        <i class="fa fa-heart-o" aria-hidden="true"></i>
        <span class="wishlist_count_badge" hidden>0</span>
      </a>
    `);

    if (userOption) {
      const cartLink = userOption.querySelector(".cart_link");
      userOption.insertBefore(wishlistLink, cartLink || userOption.firstChild);
    }
  }

  wishlistLink.setAttribute("href", getSitePageHref("wishlist.html"));
  wishlistLink.setAttribute("aria-label", getLocalizedText("header.viewFavorites", "View favorites"));
  wishlistLink.setAttribute("title", getLocalizedText("header.favoritesTitle", "Favorites"));
  wishlistLink.setAttribute("data-i18n-attr", "aria-label:header.viewFavorites,title:header.favoritesTitle");

  if (!wishlistLink.querySelector(".wishlist_count_badge")) {
    wishlistLink.appendChild(createElementFromHTML('<span class="wishlist_count_badge" hidden>0</span>'));
  }

  updateFavoritesBadge();
  return wishlistLink;
}

function removeNavbarWishlistAction() {
  document.querySelectorAll(".wishlist_icon_link").forEach((wishlistLink) => {
    wishlistLink.remove();
  });
}

function ensureOrdersNav() {
  const navList = document.querySelector(".navbar-nav");
  if (!navList) {
    return;
  }

  const ordersHref = getSitePageHref("orders.html");
  const currentPage = getCurrentPageFileName();
  let ordersItem = Array.from(navList.querySelectorAll(".nav-item")).find((item) => {
    const link = item.querySelector(".nav-link");
    return link && (link.getAttribute("href") === ordersHref || link.textContent.indexOf("My Orders") !== -1);
  });

  if (!ordersItem) {
    if (currentPage !== ordersHref) {
      return;
    }

    ordersItem = createElementFromHTML(`<li class="nav-item"><a class="nav-link orders_nav_link" href="${getSitePageHref("orders.html")}">My Orders</a></li>`);
    const wishlistItem = Array.from(navList.querySelectorAll(".nav-item")).find((item) => {
      const link = item.querySelector(".nav-link");
      return link && link.getAttribute("href") === "wishlist.html";
    });
    navList.insertBefore(ordersItem, wishlistItem ? wishlistItem.nextSibling : null);
  }

  const link = ordersItem.querySelector(".nav-link");
  link.setAttribute("href", ordersHref);
  link.classList.add("orders_nav_link");
  setNavLinkMarkup(link, "nav.orders", "My Orders", currentPage === ordersHref);

  if (currentPage === ordersHref) {
    ordersItem.classList.add("active");
  }
}

function ensureFeedbackNav() {
  const navList = document.querySelector(".navbar-nav");
  if (!navList) {
    return;
  }

  const feedbackHref = getSitePageHref("feedback.html");
  const currentPage = getCurrentPageFileName();
  let feedbackItem = Array.from(navList.querySelectorAll(".nav-item")).find((item) => {
    const link = item.querySelector(".nav-link");
    if (!link) {
      return false;
    }

    const linkText = link.textContent.replace(/\s+/g, " ").trim();
    return link.getAttribute("href") === feedbackHref || linkText === "Feedback" || linkText === "Contact";
  });

  if (!feedbackItem) {
    feedbackItem = createElementFromHTML(`<li class="nav-item"><a class="nav-link feedback_nav_link" href="${getSitePageHref("feedback.html")}">Feedback</a></li>`);
    const wishlistItem = Array.from(navList.querySelectorAll(".nav-item")).find((item) => {
      const link = item.querySelector(".nav-link");
      return link && link.getAttribute("href") === "wishlist.html";
    });
    navList.insertBefore(feedbackItem, wishlistItem || null);
  }

  const link = feedbackItem.querySelector(".nav-link");
  link.setAttribute("href", feedbackHref);
  link.classList.add("feedback_nav_link");
  setNavLinkMarkup(link, "nav.feedback", "Feedback", currentPage === feedbackHref);

  if (currentPage === feedbackHref) {
    navList.querySelectorAll(".nav-item.active").forEach((item) => {
      if (item !== feedbackItem) {
        item.classList.remove("active");
      }
    });
    feedbackItem.classList.add("active");
  } else {
    feedbackItem.classList.remove("active");
  }
}

function ensureSearchButton(userOption) {
  let searchForm = userOption.querySelector(".form-inline");
  if (searchForm) {
    searchForm.classList.add("site_search_toggle_form");
    const searchButton = searchForm.querySelector(".nav_search-btn");
    if (searchButton && !searchButton.getAttribute("aria-label")) {
      searchButton.setAttribute("aria-label", getLocalizedText("header.searchProducts", "Search products"));
    }
    if (searchButton) {
      searchButton.setAttribute("data-i18n-attr", "aria-label:header.searchProducts");
    }
    return searchForm;
  }

  searchForm = createElementFromHTML(`
    <form class="form-inline site_search_toggle_form">
      <button class="btn my-2 my-sm-0 nav_search-btn" type="submit" aria-label="${escapeHtml(getLocalizedText("header.searchProducts", "Search products"))}" data-i18n-attr="aria-label:header.searchProducts">
        <i class="fa fa-search" aria-hidden="true"></i>
      </button>
    </form>
  `);

  userOption.appendChild(searchForm);
  return searchForm;
}

function decorateThemeToggle(themeToggle) {
  if (!themeToggle) {
    return;
  }

  if (!themeToggle.querySelector(".theme_toggle_orbit")) {
    themeToggle.innerHTML = `
      <span class="theme_toggle_orbit" aria-hidden="true">
        <span class="theme_toggle_halo"></span>
        <i class="fa fa-sun theme_toggle_icon" aria-hidden="true"></i>
        <span class="theme_toggle_spark theme_toggle_spark_one"></span>
        <span class="theme_toggle_spark theme_toggle_spark_two"></span>
      </span>
    `;
  }
}

function wrapNavbarThemeToggle(themeToggle) {
  if (!themeToggle || themeToggle.closest(".side_drawer_coming_soon")) {
    return themeToggle;
  }

  let wrapper = themeToggle.closest(".navbar_theme_coming_soon");
  if (!wrapper) {
    wrapper = createElementFromHTML('<span class="navbar_theme_coming_soon" data-tooltip-en="Coming soon" data-tooltip-ar="قريباً"></span>');
    themeToggle.parentNode.insertBefore(wrapper, themeToggle);
    wrapper.appendChild(themeToggle);
  }

  themeToggle.classList.add("navbar_theme_coming_soon_control");
  themeToggle.setAttribute("aria-disabled", "true");
  themeToggle.setAttribute("tabindex", "-1");

  if (!wrapper.querySelector(".navbar_theme_lock")) {
    wrapper.insertAdjacentHTML("beforeend", '<span class="navbar_theme_lock" aria-hidden="true">🔒</span>');
  }

  return themeToggle;
}

function ensureThemeToggle(userOption) {
  let themeToggle = userOption.querySelector(".theme_toggle");
  if (themeToggle) {
    themeToggle.setAttribute("data-theme-toggle", "true");
    decorateThemeToggle(themeToggle);
    return wrapNavbarThemeToggle(themeToggle);
  }

  themeToggle = createElementFromHTML(`
    <button class="theme_toggle" type="button" data-theme-toggle="true" aria-label="${escapeHtml(getLocalizedText("theme.switchToDark", "Switch to dark mode"))}" aria-pressed="false" title="${escapeHtml(getLocalizedText("theme.dark", "Dark mode"))}">
      <span class="theme_toggle_orbit" aria-hidden="true">
        <span class="theme_toggle_halo"></span>
        <i class="fa fa-sun theme_toggle_icon" aria-hidden="true"></i>
        <span class="theme_toggle_spark theme_toggle_spark_one"></span>
        <span class="theme_toggle_spark theme_toggle_spark_two"></span>
      </span>
    </button>
  `);

  const wrapper = createElementFromHTML('<span class="navbar_theme_coming_soon" data-tooltip-en="Coming soon" data-tooltip-ar="قريباً"></span>');
  wrapper.appendChild(themeToggle);
  wrapper.insertAdjacentHTML("beforeend", '<span class="navbar_theme_lock" aria-hidden="true">🔒</span>');
  userOption.appendChild(wrapper);
  return wrapNavbarThemeToggle(themeToggle);
}

function ensureLanguageSwitcher(userOption) {
  let switcher = document.querySelector(".custom-language-switcher");
  if (switcher) {
    return switcher;
  }

  switcher = createElementFromHTML(`
    <div class="custom-language-switcher">
      <button class="language-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="${escapeHtml(getLocalizedText("language.label", "Language"))}" data-language-toggle data-i18n-attr="aria-label:language.label">
        <span class="lang-icon" aria-hidden="true"></span>
        <span id="currentLangText" data-current-language>${escapeHtml(getLocalizedText("language.current", "English"))}</span>
        <span class="lang-divider" aria-hidden="true">/</span>
        <span class="lang-code" aria-hidden="true" data-language-code>${escapeHtml(getLanguage().toUpperCase())}</span>
        <i class="fa fa-angle-down lang-arrow" aria-hidden="true"></i>
      </button>
      <div class="language-menu" role="menu">
        <button type="button" role="menuitemradio" data-language-option="en" data-i18n="language.english">${escapeHtml(getLocalizedText("language.english", "English"))}</button>
        <button type="button" role="menuitemradio" data-language-option="ar" data-i18n="language.arabic">${escapeHtml(getLocalizedText("language.arabic", "Arabic"))}</button>
      </div>
    </div>
  `);

  userOption.appendChild(switcher);
  applyTranslations(switcher);
  return switcher;
}

function setThemeToggleElementState(themeToggle, isDarkMode) {
  if (!themeToggle) {
    return;
  }

  themeToggle.classList.toggle("is_dark", isDarkMode);
  if (themeToggle.getAttribute("role") === "switch") {
    themeToggle.setAttribute("aria-checked", String(isDarkMode));
    themeToggle.removeAttribute("aria-pressed");
  } else {
    themeToggle.setAttribute("aria-pressed", String(isDarkMode));
    themeToggle.removeAttribute("aria-checked");
  }
  const labelKey = isDarkMode ? "theme.switchToLight" : "theme.switchToDark";
  const titleKey = isDarkMode ? "theme.light" : "theme.dark";
  themeToggle.setAttribute("aria-label", getLocalizedText(labelKey, isDarkMode ? "Switch to light mode" : "Switch to dark mode"));
  themeToggle.setAttribute("title", getLocalizedText(titleKey, isDarkMode ? "Light mode" : "Dark mode"));
  themeToggle.setAttribute("data-i18n-attr", `aria-label:${labelKey},title:${titleKey}`);

  const icon = themeToggle.querySelector(".theme_toggle_icon");
  if (icon) {
    icon.classList.remove("fa-sun", "fa-moon");
    icon.classList.add(isDarkMode ? "fa-moon" : "fa-sun");
  }

  const drawerTitle = themeToggle.querySelector(".side_drawer_theme_title");
  if (drawerTitle) {
    drawerTitle.textContent = getLocalizedText("theme.darkMode", "Dark Mode");
  }

  const drawerHint = themeToggle.querySelector(".side_drawer_theme_hint");
  if (drawerHint) {
    drawerHint.textContent = getLocalizedText(isDarkMode ? "theme.on" : "theme.off", isDarkMode ? "On" : "Off");
  }

  const drawerState = themeToggle.querySelector(".side_drawer_theme_state");
  if (drawerState) {
    drawerState.textContent = getLocalizedText(isDarkMode ? "theme.on" : "theme.off", isDarkMode ? "On" : "Off");
  }
}

function setThemeToggleState(themeToggle, isDarkMode) {
  document.body.classList.toggle("theme_dark", isDarkMode);
  document.body.classList.toggle("dark-mode", isDarkMode);
  document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");

  const toggles = Array.from(document.querySelectorAll(".theme_toggle"));
  if (themeToggle && !toggles.includes(themeToggle)) {
    toggles.push(themeToggle);
  }

  toggles.forEach((toggle) => setThemeToggleElementState(toggle, isDarkMode));
}

function getSavedTheme() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) || window.localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
    return savedTheme === "dark" || savedTheme === "light" ? savedTheme : null;
  } catch (error) {
    return null;
  }
}

function saveTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.setItem(LEGACY_THEME_STORAGE_KEY, theme);
  } catch (error) {}
}

function toggleTheme() {
  const currentTheme = getSavedTheme() || "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  saveTheme(nextTheme);
  setThemeToggleState(null, nextTheme === "dark");
}

function initThemeToggle(themeToggle) {
  const currentTheme = getSavedTheme() || "light";
  const isDarkMode = currentTheme === "dark";

  saveTheme(currentTheme);
  setThemeToggleState(themeToggle, isDarkMode);

  if (document.documentElement.dataset.themeToggleBound === "true") {
    return;
  }

  document.documentElement.dataset.themeToggleBound = "true";
  document.addEventListener("click", (event) => {
    const themeToggleAction = event.target.closest("[data-theme-toggle]");
    if (!themeToggleAction) {
      return;
    }

    event.preventDefault();
    toggleTheme();
  });
}

function getCurrentPageName() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function getOfferCount() {
  try {
    return getActiveOffers().length;
  } catch (error) {
    return 0;
  }
}

function getUserInitials(user) {
  const fallback = "SB";
  const source = String((user && (user.displayName || user.email)) || "").trim();

  if (!source) {
    return fallback;
  }

  const cleanSource = source.includes("@") ? source.split("@")[0] : source;
  const parts = cleanSource
    .replace(/[^a-zA-Z0-9\s._-]/g, " ")
    .split(/[\s._-]+/)
    .filter(Boolean);

  if (!parts.length) {
    return fallback;
  }

  const initials = parts.length === 1
    ? parts[0].slice(0, 2)
    : parts.slice(0, 2).map((part) => part.charAt(0)).join("");

  return initials.toUpperCase();
}

function renderAvatarContent(user) {
  if (user && user.photoURL) {
    const altText = user.displayName || user.email || getLocalizedText("auth.sushiBoxCustomer", "Sushi Box Customer");
    return `<img src="${escapeHtml(user.photoURL)}" alt="${escapeHtml(altText)}" width="96" height="96" loading="lazy" decoding="async">`;
  }

  if (user) {
    return `<span class="auth_initials" aria-hidden="true">${escapeHtml(getUserInitials(user))}</span>`;
  }

  return '<i class="fa fa-user" aria-hidden="true"></i>';
}

function renderSideDrawerAccount(user = latestAuthUser || getCurrentUser()) {
  if (!user) {
    return `
      <button class="side_drawer_account_row" type="button" data-auth-action="login">
        <span class="side_drawer_account_avatar">
          <i class="fa fa-user-o" aria-hidden="true"></i>
        </span>
        <span class="side_drawer_account_text">
          <strong data-i18n="auth.loginSignup">${escapeHtml(getLocalizedText("auth.loginSignup", "Login / Sign up"))}</strong>
          <small data-i18n="auth.signInSaveOrdersFavorites">${escapeHtml(getLocalizedText("auth.signInSaveOrdersFavorites", "Sign in to save your orders and favorites"))}</small>
        </span>
      </button>
    `;
  }

  const title = user.displayName || user.email || getLocalizedText("auth.sushiBoxCustomer", "Sushi Box Customer");
  const subtitle = user.email || getLocalizedText("auth.signedIn", "Signed in");

  return `
    <div class="side_drawer_account_shell">
      <button class="side_drawer_account_row is_signed_in" type="button" data-side-drawer-account-toggle aria-expanded="false" aria-controls="sideDrawerAccountActions" title="${escapeHtml(subtitle)}">
        <span class="side_drawer_account_avatar">
          ${renderAvatarContent(user)}
        </span>
        <span class="side_drawer_account_text">
          <strong>${escapeHtml(title)}</strong>
          <small>${escapeHtml(subtitle)}</small>
        </span>
      </button>
      <div class="side_drawer_account_actions" id="sideDrawerAccountActions" hidden>
        <button class="side_drawer_logout_btn" type="button" data-auth-action="logout" aria-label="${escapeHtml(getLocalizedText("auth.logout", "Logout"))}" title="${escapeHtml(getLocalizedText("auth.logout", "Logout"))}" data-i18n-attr="aria-label:auth.logout,title:auth.logout">
          <i class="fa fa-sign-out" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  `;
}

function renderSideDrawerLanguageSection() {
  return `
    <div class="drawer-language-row" aria-label="${escapeHtml(getLocalizedText("language.label", "Language"))}" data-i18n-attr="aria-label:language.label">
      <span class="drawer-language-icon fa fa-globe" aria-hidden="true"></span>
      <span class="drawer-language-label" data-i18n="language.label">${escapeHtml(getLocalizedText("language.label", "Language"))}</span>
      <div class="drawer-language-pills" role="group" aria-label="${escapeHtml(getLocalizedText("language.choose", "Choose language"))}" data-i18n-attr="aria-label:language.choose">
        <button class="drawer-language-pill" type="button" data-language-option="en" data-i18n="language.englishCode">${escapeHtml(getLocalizedText("language.englishCode", "EN"))}</button>
        <button class="drawer-language-pill" type="button" data-language-option="ar" data-i18n="language.arabicCode">${escapeHtml(getLocalizedText("language.arabicCode", "AR"))}</button>
      </div>
    </div>
  `;
}

function renderSideDrawerThemeSection() {
  const isDarkMode = (getSavedTheme() || "light") === "dark";

  return `
    <div class="side_drawer_coming_soon" data-tooltip-en="Coming soon" data-tooltip-ar="قريباً">
      <button class="side_drawer_theme_row theme_toggle side_drawer_coming_soon_control${isDarkMode ? " is_dark" : ""}" type="button" role="switch" data-theme-toggle="true" aria-label="${escapeHtml(getLocalizedText(isDarkMode ? "theme.switchToLight" : "theme.switchToDark", isDarkMode ? "Switch to light mode" : "Switch to dark mode"))}" aria-checked="${isDarkMode ? "true" : "false"}" aria-disabled="true" tabindex="-1" title="${escapeHtml(getLocalizedText(isDarkMode ? "theme.light" : "theme.dark", isDarkMode ? "Light mode" : "Dark mode"))}">
        <span class="side_drawer_theme_icon" aria-hidden="true">
          <i class="fa ${isDarkMode ? "fa-moon" : "fa-sun"} theme_toggle_icon" aria-hidden="true"></i>
        </span>
        <span class="side_drawer_theme_text">
          <strong class="side_drawer_theme_title" data-i18n="theme.darkMode">${escapeHtml(getLocalizedText("theme.darkMode", "Dark Mode"))}</strong>
          <small class="side_drawer_theme_hint" data-i18n="${isDarkMode ? "theme.on" : "theme.off"}">${escapeHtml(getLocalizedText(isDarkMode ? "theme.on" : "theme.off", isDarkMode ? "On" : "Off"))}</small>
        </span>
        <span class="side_drawer_theme_switch" aria-hidden="true">
          <span class="side_drawer_theme_switch_knob"></span>
        </span>
      </button>
      <span class="side_drawer_lock" aria-hidden="true">🔒</span>
    </div>
  `;
}

function renderSideDrawerMenuItems(user = latestAuthUser || getCurrentUser()) {
  const currentPage = getCurrentPageName();
  const offerCount = getOfferCount();
  const wishlistCount = getWishlistCountFromItems(getWishlist());

  return SIDE_DRAWER_NAV_ITEMS.filter((item) => {
    return !item.requiresAdmin || isAdminUser(user);
  }).map((item) => {
    const isActive = currentPage === item.href;
    const activeText = isActive ? ' aria-current="page"' : "";
    const badge = item.hasOfferBadge
      ? `<span class="side_drawer_badge site_drawer_offer_badge">${formatBadgeCount(offerCount)}</span>`
      : item.hasWishlistBadge
        ? `<span class="side_drawer_badge site_drawer_wishlist_badge">${formatBadgeCount(wishlistCount)}</span>`
        : "";

    return `
      <a class="side_drawer_link${isActive ? " is_active" : ""}" href="${getSitePageHref(item.href)}"${activeText}>
        <i class="fa ${item.icon} side_drawer_icon" aria-hidden="true"></i>
        <span data-i18n="${item.i18nKey}">${escapeHtml(getLocalizedText(item.i18nKey, item.label))}</span>
        ${badge}
      </a>
    `;
  }).join("");
}

function renderSideDrawerInner() {
  return `
    <div class="side_drawer_header">
      <button class="side_drawer_edge_close" type="button" data-close-side-drawer="true" aria-label="${escapeHtml(getLocalizedText("menu.close", "Close menu"))}" title="${escapeHtml(getLocalizedText("menu.close", "Close menu"))}" data-i18n-attr="aria-label:menu.close,title:menu.close">
        <i class="fa fa-chevron-right" aria-hidden="true"></i>
      </button>
      <a class="side_drawer_brand" href="${getSitePageHref("index.html")}" aria-label="${escapeHtml(getLocalizedText("header.brandHome", "Sushi Box home"))}" data-i18n-attr="aria-label:header.brandHome">
        <span class="side_drawer_brand_mark" aria-hidden="true">
          <img src="/images/Logo.png" alt="" width="599" height="593" loading="lazy" decoding="async">
        </span>
        <span class="side_drawer_brand_name">Sushi Box</span>
        <i class="fa fa-angle-down side_drawer_brand_arrow" aria-hidden="true"></i>
      </a>
    </div>
    <div class="side_drawer_middle">
      <nav class="side_drawer_nav" aria-label="${escapeHtml(getLocalizedText("menu.siteLinks", "Site links"))}" data-i18n-attr="aria-label:menu.siteLinks">
        ${renderSideDrawerMenuItems()}
      </nav>
    </div>
    <div class="side_drawer_footer">
      ${renderSideDrawerLanguageSection()}
      ${renderSideDrawerThemeSection()}
      ${renderSideDrawerAccount()}
    </div>
  `;
}

function ensureSideDrawerMenu() {
  let drawer = document.querySelector(".site_side_drawer");
  let overlay = document.querySelector(".site_drawer_overlay");

  if (!overlay) {
    overlay = createElementFromHTML('<div class="site_drawer_overlay" data-close-side-drawer="true" hidden></div>');
    document.body.appendChild(overlay);
  }

  if (!drawer) {
    drawer = createElementFromHTML(`
      <aside class="site_side_drawer" id="siteSideDrawer" role="dialog" aria-modal="true" aria-label="${escapeHtml(getLocalizedText("menu.siteMenu", "Site menu"))}" data-i18n-attr="aria-label:menu.siteMenu" aria-hidden="true" hidden>
        ${renderSideDrawerInner()}
      </aside>
    `);
    document.body.appendChild(drawer);
  } else {
    drawer.innerHTML = renderSideDrawerInner();
  }

  setThemeToggleState(null, (getSavedTheme() || "light") === "dark");
  applyTranslations(drawer);
  return { drawer, overlay };
}

function updateSideDrawerAccount(user = latestAuthUser || getCurrentUser()) {
  const footer = document.querySelector(".side_drawer_footer");
  if (footer) {
    footer.innerHTML = `${renderSideDrawerLanguageSection()}${renderSideDrawerThemeSection()}${renderSideDrawerAccount(user)}`;
    setThemeToggleState(null, (getSavedTheme() || "light") === "dark");
    applyTranslations(footer);
  }

  const nav = document.querySelector(".side_drawer_nav");
  if (nav) {
    nav.innerHTML = renderSideDrawerMenuItems(user);
    applyTranslations(nav);
    updateSideDrawerOfferBadge();
    updateFavoritesBadge();
  }
}

function updateSideDrawerOfferBadge() {
  const badge = document.querySelector(".site_drawer_offer_badge");
  if (badge) {
    badge.textContent = formatBadgeCount(getOfferCount());
  }
}

function openSideDrawerMenu() {
  const toggler = document.querySelector(".custom_nav-container .navbar-toggler");
  const { drawer, overlay } = ensureSideDrawerMenu();

  window.clearTimeout(sideDrawerCloseTimer);
  updateSideDrawerOfferBadge();
  drawer.hidden = false;
  overlay.hidden = false;
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("side_drawer_open");

  window.requestAnimationFrame(() => {
    drawer.classList.add("is_open");
    overlay.classList.add("is_visible");
  });

  if (toggler) {
    toggler.setAttribute("aria-expanded", "true");
    toggler.setAttribute("aria-label", getLocalizedText("menu.close", "Close menu"));
    toggler.setAttribute("data-i18n-attr", "aria-label:menu.close");
  }

  const firstControl = drawer.querySelector(".side_drawer_brand, .side_drawer_link, .side_drawer_account_row");
  if (firstControl) {
    window.setTimeout(() => firstControl.focus({ preventScroll: true }), 80);
  }
}

function closeSideDrawerMenu() {
  const drawer = document.querySelector(".site_side_drawer");
  const overlay = document.querySelector(".site_drawer_overlay");
  const toggler = document.querySelector(".custom_nav-container .navbar-toggler");

  if (!drawer || drawer.hidden) {
    return;
  }

  window.clearTimeout(sideDrawerCloseTimer);
  drawer.classList.remove("is_open");
  drawer.setAttribute("aria-hidden", "true");
  if (overlay) {
    overlay.classList.remove("is_visible");
  }
  document.body.classList.remove("side_drawer_open");

  if (toggler) {
    toggler.setAttribute("aria-expanded", "false");
    toggler.setAttribute("aria-label", getLocalizedText("menu.open", "Open menu"));
    toggler.setAttribute("data-i18n-attr", "aria-label:menu.open");
  }

  sideDrawerCloseTimer = window.setTimeout(() => {
    if (!document.body.classList.contains("side_drawer_open")) {
      drawer.hidden = true;
      if (overlay) {
        overlay.hidden = true;
      }
    }
  }, 260);
}

function initSideDrawerMenu() {
  const nav = document.querySelector(".custom_nav-container");
  const toggler = nav && nav.querySelector(".navbar-toggler");
  const collapse = nav && nav.querySelector(".navbar-collapse");

  ensureSideDrawerMenu();

  if (collapse) {
    collapse.classList.remove("show");
    collapse.setAttribute("aria-hidden", "true");
  }

  if (!toggler || toggler.dataset.sideDrawerBound === "true") {
    return;
  }

  toggler.dataset.sideDrawerBound = "true";
  toggler.classList.add("site_drawer_toggle");
  toggler.removeAttribute("data-toggle");
  toggler.removeAttribute("data-target");
  toggler.setAttribute("aria-controls", "siteSideDrawer");
  toggler.setAttribute("aria-expanded", "false");
  toggler.setAttribute("aria-label", getLocalizedText("menu.open", "Open menu"));
  toggler.setAttribute("data-i18n-attr", "aria-label:menu.open");

  toggler.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    const drawer = document.querySelector(".site_side_drawer");
    if (drawer && drawer.classList.contains("is_open")) {
      closeSideDrawerMenu();
      return;
    }

    openSideDrawerMenu();
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-side-drawer]")) {
      event.preventDefault();
      closeSideDrawerMenu();
      return;
    }

    if (event.target.closest(".side_drawer_link")) {
      closeSideDrawerMenu();
    }
  });
}

function ensureMinimalNavbarActions(nav) {
  let actions = nav.querySelector(".minimal_nav_actions");

  if (!actions) {
    actions = createElementFromHTML('<div class="minimal_nav_actions" aria-label="Primary navigation actions"></div>');
    nav.appendChild(actions);
  }

  return actions;
}

function ensureNavbarSearchShell(nav) {
  if (!nav) {
    return null;
  }

  let shell = nav.querySelector(".navbar_search_shell");
  if (shell) {
    return shell;
  }

  shell = createElementFromHTML(`
    <form class="navbar_search_shell" role="search" aria-label="${escapeHtml(getLocalizedText("header.searchProducts", "Search products"))}" data-i18n-attr="aria-label:header.searchProducts">
      <span class="navbar_search_icon" aria-hidden="true">
        <i class="fa fa-search"></i>
      </span>
      <input id="siteSearchInput" type="search" autocomplete="off" placeholder="${escapeHtml(getLocalizedText("header.searchPlaceholder", "Search sauces, noodles, dumplings, nori, and more"))}" data-i18n-attr="placeholder:header.searchPlaceholder">
      <button class="navbar_search_close" type="button" data-close-search="true" aria-label="${escapeHtml(getLocalizedText("header.closeSearch", "Close search"))}" data-i18n-attr="aria-label:header.closeSearch">
        <span aria-hidden="true">&times;</span>
      </button>
    </form>
  `);

  nav.appendChild(shell);
  return shell;
}

function placeNavbarControls() {
  const nav = document.querySelector(".custom_nav-container");
  const userOption = document.querySelector(".user_option");
  const toggler = nav && nav.querySelector(".navbar-toggler");
  const cartLink = document.querySelector(".cart_link");
  const searchForm = document.querySelector(".site_search_toggle_form") || document.querySelector(".form-inline");
  const authShell = document.querySelector(".auth_shell");
  const languageSwitcher = document.querySelector(".custom-language-switcher");
  const collapse = nav && nav.querySelector(".navbar-collapse");

  if (!nav || !userOption) {
    return;
  }

  nav.classList.add("minimal_navbar");
  removeNavbarWishlistAction();
  const actions = ensureMinimalNavbarActions(nav);
  ensureNavbarSearchShell(nav);
  const themeToggle = userOption.querySelector(".navbar_theme_coming_soon .theme_toggle")
    || actions.querySelector(".navbar_theme_coming_soon .theme_toggle")
    || userOption.querySelector(".theme_toggle")
    || actions.querySelector(":scope > .theme_toggle");
  const themeToggleWrapper = themeToggle && themeToggle.closest(".navbar_theme_coming_soon");
  const isPhoneNav = window.matchMedia && window.matchMedia("(max-width: 575px)").matches;

  if (isPhoneNav && themeToggleWrapper && themeToggleWrapper.parentElement !== userOption) {
    userOption.appendChild(themeToggleWrapper);
  }

  [authShell, cartLink, searchForm, languageSwitcher, isPhoneNav ? null : (themeToggleWrapper || themeToggle), toggler].forEach((control) => {
    if (control) {
      actions.appendChild(control);
    }
  });

  if (isPhoneNav) {
    actions.style.position = "static";
    actions.style.top = "auto";
    actions.style.right = "auto";
    actions.style.left = "auto";
    actions.style.width = "max-content";
    actions.style.marginLeft = "auto";
    actions.style.transform = "none";
    actions.style.zIndex = "25";
  } else {
    actions.removeAttribute("style");
  }

  const mobileRight = nav.querySelector(".mobile-navbar-right");
  if (mobileRight && !mobileRight.children.length) {
    mobileRight.remove();
  }

  if (collapse) {
    collapse.classList.remove("show");
    collapse.setAttribute("aria-hidden", "true");
  }

  if (cartLink && !cartLink.getAttribute("aria-label")) {
    cartLink.setAttribute("aria-label", getLocalizedText("header.viewCart", "View cart"));
  }
  if (cartLink) {
    cartLink.setAttribute("data-i18n-attr", "aria-label:header.viewCart");
  }
}

function ensureAuthShell(userOption) {
  const existingAuthShell = userOption.querySelector(".auth_shell");
  if (existingAuthShell) {
    return existingAuthShell;
  }

  const legacyUserLink = userOption.querySelector(".user_link");
  const authShell = createElementFromHTML(`
    <div class="auth_shell">
      <button class="auth_button" type="button" aria-expanded="false">
        <span class="auth_avatar">
          <i class="fa fa-user" aria-hidden="true"></i>
        </span>
        <span class="auth_button_text" data-i18n="auth.login">${escapeHtml(getLocalizedText("auth.login", "Login"))}</span>
        <i class="fa fa-angle-down auth_chevron" aria-hidden="true"></i>
      </button>
      <div class="auth_dropdown" hidden></div>
    </div>
  `);

  if (legacyUserLink) {
    legacyUserLink.replaceWith(authShell);
  } else {
    userOption.insertBefore(authShell, userOption.firstChild);
  }

  return authShell;
}

function ensureSearchPanel() {
  let panel = document.querySelector(".site_search_panel");
  if (panel) {
    return panel;
  }

  panel = createElementFromHTML(`
    <div class="site_search_panel" hidden>
      <div class="site_search_backdrop" data-close-search="true"></div>
      <section class="site_search_results_surface" role="region" aria-label="Search product results">
        <div class="site_search_results_head">
          <span class="site_search_hint" id="siteSearchHint">Start typing to search products live.</span>
          <div class="site_search_section_label" id="siteSearchSectionLabel" hidden>Popular products</div>
        </div>
        <div class="site_search_results" id="siteSearchResults" role="listbox" aria-label="Search results"></div>
      </section>
    </div>
  `);

  panel.setAttribute("aria-hidden", "true");
  document.body.appendChild(panel);
  return panel;
}

function restoreSearchScrollPosition() {
  window.scrollTo(searchPanelScrollPosition.x, searchPanelScrollPosition.y);
}

function restoreCartScrollPosition() {
  window.scrollTo(cartDrawerScrollPosition.x, cartDrawerScrollPosition.y);
}

function ensureCartDrawer() {
  let drawer = document.querySelector(".cart_drawer");
  if (drawer) {
    return drawer;
  }

  drawer = createElementFromHTML(`
    <div class="cart_drawer" hidden>
      <div class="cart_drawer_backdrop" data-close-cart="true"></div>
      <aside class="cart_drawer_panel" role="dialog" aria-modal="true" aria-label="${escapeHtml(getCartUiText("shoppingCart", "Shopping Cart"))}" data-i18n-attr="aria-label:cartUi.shoppingCart">
        <div class="cart_drawer_header">
          <div>
            <span class="cart_drawer_kicker" data-i18n="cartUi.yourProducts">${escapeHtml(getCartUiText("yourProducts", "Your products"))}</span>
            <h3 data-i18n="cartUi.cart">${escapeHtml(getCartUiText("cart", "Cart"))}</h3>
          </div>
          <button class="cart_drawer_close" type="button" data-close-cart="true" aria-label="${escapeHtml(getCartUiText("closeCart", "Close cart"))}" data-i18n-attr="aria-label:cartUi.closeCart">
            <i class="fa fa-times" aria-hidden="true"></i>
          </button>
        </div>
        <div class="cart_drawer_body">
          <div class="cart_empty_state" id="cartEmptyState">
            <div class="cart_empty_icon"><i class="fa fa-shopping-basket" aria-hidden="true"></i></div>
            <p data-i18n="cartUi.drawerEmptyHint">${escapeHtml(getCartUiText("drawerEmptyHint", "Your cart is empty. Add a few favorites to get started."))}</p>
          </div>
          <div class="cart_items" id="cartItems"></div>
        </div>
        <div class="cart_drawer_footer">
          <div class="cart_subtotal_row">
            <span data-i18n="cartUi.subtotal">${escapeHtml(getCartUiText("subtotal", "Subtotal"))}</span>
            <strong id="cartSubtotal">\u062c.\u0645 0.00</strong>
          </div>
          <div class="cart_drawer_actions">
            <button class="cart_clear_btn" id="cartClearBtn" type="button" data-i18n="cartUi.emptyCart">${escapeHtml(getCartUiText("emptyCart", "Empty Cart"))}</button>
            <button class="return_menu_btn" type="button" data-close-cart="true">
              <i class="fa fa-home" aria-hidden="true"></i>
              <span data-i18n="cartUi.continueShopping">${escapeHtml(getCartUiText("continueShopping", "Continue Shopping"))}</span>
            </button>
            <button class="cart_checkout_btn" id="cartCheckoutBtn" type="button" data-open-checkout data-i18n="cartUi.proceedToSecureCheckout">${escapeHtml(getCartUiText("proceedToSecureCheckout", "Proceed to Secure Checkout"))}</button>
          </div>
        </div>
      </aside>
    </div>
  `);

  drawer.setAttribute("aria-hidden", "true");
  document.body.appendChild(drawer);
  applyTranslations(drawer);
  return drawer;
}

function ensureToastStack() {
  let stack = document.querySelector(".site_toast_stack");
  if (stack) {
    return stack;
  }

  stack = createElementFromHTML('<div class="site_toast_stack" aria-live="polite" aria-atomic="true"></div>');
  document.body.appendChild(stack);
  return stack;
}

const deliveryCities = [
  {
    id: "kafr-el-sheikh",
    name: "Kafr El Sheikh",
    schedule: "Wednesday, Thursday, Friday"
  },
  {
    id: "mansoura",
    name: "Mansoura",
    schedule: "Wednesday, Thursday, Friday"
  },
  {
    id: "tanta",
    name: "Tanta",
    schedule: "Wednesday, Thursday, Friday"
  },
  {
    id: "el-mahalla",
    name: "El Mahalla",
    schedule: "Wednesday, Thursday, Friday"
  }
];

const checkoutSteps = [
  "Review cart",
  "Choose city",
  "Address",
  "Review & pay"
];

function getDeliveryCityById(cityId) {
  return deliveryCities.find((city) => city.id === cityId) || null;
}

function getCheckoutFormValues(modal) {
  const cityInput = modal.querySelector('input[name="checkoutCity"]:checked');
  const selectedCity = cityInput ? getDeliveryCityById(cityInput.value) : null;

  return {
    name: (modal.querySelector("#checkoutCustomerName")?.value || "").trim(),
    phone: (modal.querySelector("#checkoutCustomerPhone")?.value || "").trim(),
    email: (modal.querySelector("#checkoutCustomerEmail")?.value || "").trim(),
    cityId: cityInput ? cityInput.value : "",
    cityName: selectedCity ? selectedCity.name : "",
    area: (modal.querySelector("#checkoutCustomerArea")?.value || "").trim(),
    fullAddress: (modal.querySelector("#checkoutCustomerAddress")?.value || "").trim(),
    building: (modal.querySelector("#checkoutCustomerBuilding")?.value || "").trim(),
    floorApartment: (modal.querySelector("#checkoutCustomerFloorApartment")?.value || "").trim(),
    notes: (modal.querySelector("#checkoutCustomerNotes")?.value || "").trim(),
    deliverySchedule: selectedCity ? selectedCity.schedule : "",
    paymentMethod: (modal.querySelector('input[name="checkoutPaymentMethod"]:checked')?.value || "").trim()
  };
}

function setCheckoutValidationMessage(modal, message) {
  const validationMessage = modal.querySelector("#checkoutValidationMessage");
  if (!validationMessage) {
    return;
  }

  validationMessage.textContent = message || "";
  validationMessage.hidden = !message;
}

function getCheckoutValidation(modal) {
  const values = getCheckoutFormValues(modal);
  const cart = getCart();

  if (!isCartReady()) {
    return { isValid: false, message: "Your cart is still loading. Please try again in a moment.", fieldId: "" };
  }

  if (!cart.length) {
    return { isValid: false, message: "Your cart is empty. Please add products before checkout.", fieldId: "" };
  }

  const requiredChecks = [
    ["name", "Please enter your name.", "checkoutCustomerName"],
    ["phone", "Please enter your phone number.", "checkoutCustomerPhone"],
    ["cityId", "Please select your city.", ""],
    ["area", "Please enter your area.", "checkoutCustomerArea"],
    ["fullAddress", "Please enter your full address.", "checkoutCustomerAddress"],
    ["building", "Please enter your building number.", "checkoutCustomerBuilding"],
    ["floorApartment", "Please enter your floor / apartment.", "checkoutCustomerFloorApartment"],
    ["paymentMethod", "Please choose the secure Paymob payment method.", ""]
  ];

  const missing = requiredChecks.find(([key]) => !values[key]);
  if (missing) {
    return { isValid: false, message: missing[1], fieldId: missing[2] };
  }

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return { isValid: false, message: "Please enter a valid email address, or leave it empty.", fieldId: "checkoutCustomerEmail" };
  }

  return { isValid: true, message: "", fieldId: "", values };
}

function getCheckoutStepValidation(modal, stepIndex) {
  const values = getCheckoutFormValues(modal);
  const cart = getCart();

  if (!isCartReady()) {
    return { isValid: false, message: "Your cart is still loading. Please try again in a moment.", fieldId: "" };
  }

  if (stepIndex === 0 && !cart.length) {
    return { isValid: false, message: "Your cart is empty. Please add products before checkout.", fieldId: "" };
  }

  if (stepIndex === 1 && !values.cityId) {
    return { isValid: false, message: "Please choose your delivery city.", fieldId: "" };
  }

  if (stepIndex === 2) {
    const addressChecks = [
      ["name", "Please enter your name.", "checkoutCustomerName"],
      ["phone", "Please enter your phone number.", "checkoutCustomerPhone"],
      ["area", "Please enter your area.", "checkoutCustomerArea"],
      ["fullAddress", "Please enter your full address.", "checkoutCustomerAddress"],
      ["building", "Please enter your building number.", "checkoutCustomerBuilding"],
      ["floorApartment", "Please enter your floor / apartment.", "checkoutCustomerFloorApartment"]
    ];
    const missing = addressChecks.find(([key]) => !values[key]);
    if (missing) {
      return { isValid: false, message: missing[1], fieldId: missing[2] };
    }

    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      return { isValid: false, message: "Please enter a valid email address, or leave it empty.", fieldId: "checkoutCustomerEmail" };
    }
  }

  return { isValid: true, message: "", fieldId: "", values };
}

function syncCheckoutCityCards(modal) {
  const selectedCityInput = modal.querySelector('input[name="checkoutCity"]:checked');
  const selectedCityId = selectedCityInput ? selectedCityInput.value : "";
  const selectedCity = selectedCityInput ? getDeliveryCityById(selectedCityInput.value) : null;
  const selectedCityName = modal.querySelector("#checkoutSelectedCityName");
  const selectedCitySchedule = modal.querySelector("#checkoutSelectedCitySchedule");
  const addressPanel = modal.querySelector('[data-checkout-step-panel="2"]');

  modal.querySelectorAll(".checkout_city_card").forEach((card) => {
    card.classList.toggle("is_selected", card.getAttribute("data-checkout-city") === selectedCityId);
  });

  if (selectedCityName) {
    selectedCityName.textContent = selectedCity ? selectedCity.name : "Choose a city first";
  }

  if (selectedCitySchedule) {
    selectedCitySchedule.textContent = selectedCity ? `Delivery: ${selectedCity.schedule}` : "Address fields unlock after city selection.";
  }

  if (addressPanel) {
    addressPanel.classList.toggle("is_locked", !selectedCity);
  }

  renderCheckoutReview(modal);
}

function renderCheckoutSummary(modal) {
  const summary = modal.querySelector("#checkoutOrderSummary");
  const totalEls = modal.querySelectorAll("#checkoutTotalPrice, #checkoutReviewTotalPrice, #checkoutFinalTotalPrice");
  if (!summary || !totalEls.length) {
    return;
  }

  const cart = getCart();
  const total = getCartOfferSubtotal(cart);
  totalEls.forEach((totalEl) => {
    totalEl.textContent = formatPrice(total);
  });

  if (!cart.length) {
    summary.innerHTML = '<div class="checkout_order_empty">Your cart is empty.</div>';
    return;
  }

  summary.innerHTML = cart.map((item) => {
    const quantity = Number(item.quantity) || 1;
    const product = getExactProduct(item.id);
    const pricing = getProductOfferPricing(product || { id: item.id, price: item.price });
    const lineTotal = pricing.finalPrice * quantity;
    const inventoryStatus = getInventoryStatus(item.id);
    const quantityLimitNotice = getQuantityLimitNotice(inventoryStatus, quantity);
    return `
      <article class="checkout_order_item" data-cart-product-id="${escapeHtml(item.id)}">
        ${renderProductThumb({
          product,
          imagePath: item.image,
          alt: item.name,
          width: 72,
          height: 72,
          sizes: "72px"
        })}
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${pricing.offer ? `<del>${escapeHtml(formatPrice(pricing.originalPrice))}</del> ` : ""}${quantity} x ${escapeHtml(formatPrice(pricing.finalPrice))}</span>
          <span class="product_stock_status${inventoryStatus.isOutOfStock ? " is_out" : ""}${inventoryStatus.isLowStock ? " is_low" : ""}" ${inventoryStatus.message ? "" : "hidden"}>${escapeHtml(inventoryStatus.message)}</span>
          <div class="checkout_qty_stack">
            <div class="checkout_qty_controls">
              <button type="button" data-cart-decrease="${escapeHtml(item.id)}" aria-label="Decrease ${escapeHtml(item.name)} quantity">-</button>
              <span>${quantity}</span>
              <button type="button" data-cart-increase="${escapeHtml(item.id)}" aria-label="Increase ${escapeHtml(item.name)} quantity" ${inventoryStatus.tracked && quantity >= inventoryStatus.available ? "disabled" : ""}>+</button>
              <button type="button" class="cart_save_btn" data-save-cart-item="${escapeHtml(item.id)}">Save for later</button>
              <button type="button" class="checkout_remove_btn" data-remove-cart-item="${escapeHtml(item.id)}">Remove</button>
            </div>
            ${quantityLimitNotice ? `<span class="cart_quantity_limit_notice">${escapeHtml(quantityLimitNotice)}</span>` : ""}
          </div>
        </div>
        <b>${escapeHtml(formatPrice(lineTotal))}</b>
      </article>
    `;
  }).join("");
}

function renderCheckoutReview(modal) {
  const values = getCheckoutFormValues(modal);
  const cityEl = modal.querySelector("#checkoutReviewCity");
  const addressEl = modal.querySelector("#checkoutReviewAddress");
  const customerEl = modal.querySelector("#checkoutReviewCustomer");

  if (cityEl) {
    cityEl.textContent = values.cityName ? `${values.cityName} - ${values.deliverySchedule}` : "City not selected";
  }

  if (customerEl) {
    customerEl.textContent = values.name || values.phone
      ? [values.name, values.phone].filter(Boolean).join(" - ")
      : "Customer details not entered";
  }

  if (addressEl) {
    const addressParts = [
      values.area,
      values.fullAddress,
      values.building ? `Building ${values.building}` : "",
      values.floorApartment ? `Floor / Apt ${values.floorApartment}` : "",
      values.notes
    ].filter(Boolean);
    addressEl.textContent = addressParts.length ? addressParts.join(", ") : "Address details not entered";
  }
}

function getCheckoutCurrentStep(modal) {
  return Number(modal.dataset.checkoutStep || 0);
}

function setCheckoutStep(modal, stepIndex) {
  const safeStep = Math.max(0, Math.min(checkoutSteps.length - 1, Number(stepIndex) || 0));
  modal.dataset.checkoutStep = String(safeStep);

  modal.querySelectorAll("[data-checkout-step]").forEach((stepEl) => {
    const index = Number(stepEl.getAttribute("data-checkout-step"));
    stepEl.classList.toggle("is_active", index === safeStep);
    stepEl.classList.toggle("is_complete", index < safeStep);
    stepEl.setAttribute("aria-current", index === safeStep ? "step" : "false");
  });

  modal.querySelectorAll("[data-checkout-step-panel]").forEach((panel) => {
    panel.hidden = Number(panel.getAttribute("data-checkout-step-panel")) !== safeStep;
  });

  renderCheckoutSummary(modal);
  renderCheckoutReview(modal);

  // GA4 checkout funnel milestones for the legacy modal flow.
  if (safeStep === 2) {
    trackAddShippingInfo(getCart(), getCheckoutFormValues(modal).cityName);
  }

  if (safeStep === 3) {
    trackAddPaymentInfo(getCart(), getCheckoutFormValues(modal).paymentMethod || "paymob-checkout");
  }

  const dialog = modal.querySelector(".checkout_dialog");
  if (dialog) {
    dialog.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function advanceCheckoutStep(modal, direction) {
  const currentStep = getCheckoutCurrentStep(modal);

  if (direction > 0) {
    const validation = getCheckoutStepValidation(modal, currentStep);
    if (!validation.isValid) {
      setCheckoutValidationMessage(modal, validation.message);
      const target = validation.fieldId ? modal.querySelector(`#${validation.fieldId}`) : null;
      if (target) {
        target.focus({ preventScroll: false });
      }
      return;
    }
  }

  setCheckoutValidationMessage(modal, "");
  setCheckoutStep(modal, currentStep + direction);
}

function bindCheckoutModalControls(modal) {
  if (modal.dataset.checkoutControlsBound === "true") {
    return;
  }

  modal.dataset.checkoutControlsBound = "true";

  modal.querySelectorAll("input, textarea, select").forEach((field) => {
    field.addEventListener("input", () => {
      setCheckoutValidationMessage(modal, "");
      renderCheckoutReview(modal);
    });
    field.addEventListener("change", () => {
      syncCheckoutCityCards(modal);
      setCheckoutValidationMessage(modal, "");
    });
  });

  modal.querySelectorAll("[data-checkout-next]").forEach((button) => {
    button.addEventListener("click", () => advanceCheckoutStep(modal, 1));
  });

  modal.querySelectorAll("[data-checkout-prev]").forEach((button) => {
    button.addEventListener("click", () => advanceCheckoutStep(modal, -1));
  });

  const form = modal.querySelector("#checkoutForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      confirmCheckoutOrder();
    });
  }
}

function ensureCheckoutModal() {
  let modal = document.querySelector(".checkout_modal");
  if (modal) {
    bindCheckoutModalControls(modal);
    return modal;
  }

  modal = createElementFromHTML(`
    <div class="checkout_modal" hidden>
      <div class="checkout_backdrop" data-close-checkout="true"></div>
      <section class="checkout_dialog" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle">
        <button class="checkout_close" type="button" data-close-checkout="true" aria-label="Close checkout">
          <i class="fa fa-times" aria-hidden="true"></i>
        </button>
        <div class="checkout_header">
          <span class="checkout_kicker">Secure checkout</span>
          <h3 id="checkoutTitle">Checkout</h3>
          <p>Four quick steps, then secure Paymob payment.</p>
        </div>
        <ol class="checkout_steps" aria-label="Checkout progress">
          ${checkoutSteps.map((step, index) => `
            <li class="checkout_step" data-checkout-step="${index}">
              <span class="checkout_step_number">${index + 1}</span>
              <span>${escapeHtml(step)}</span>
            </li>
          `).join("")}
        </ol>
        <p class="checkout_validation" id="checkoutValidationMessage" role="alert" aria-live="polite" hidden></p>
        <form id="checkoutForm" class="checkout_form" novalidate>
          <div class="checkout_step_panel" data-checkout-step-panel="0">
            <div class="checkout_panel checkout_cart_panel">
              <div class="checkout_panel_head">
                <div>
                  <span class="checkout_step_label">Step 1</span>
                  <h4>Review cart</h4>
                </div>
                <strong id="checkoutTotalPrice">\u062c.\u0645 0.00</strong>
              </div>
              <div class="checkout_order_summary" id="checkoutOrderSummary"></div>
            </div>
            <div class="checkout_nav_row">
              <span></span>
              <button class="checkout_next_btn" type="button" data-checkout-next>Choose city</button>
            </div>
          </div>

          <div class="checkout_step_panel" data-checkout-step-panel="1" hidden>
            <div class="checkout_panel checkout_delivery_panel">
              <div class="checkout_panel_head">
                <div>
                  <span class="checkout_step_label">Step 2</span>
                  <h4>Choose delivery city</h4>
                </div>
              </div>
              <fieldset class="checkout_city_selector">
                <legend>Available cities</legend>
                <div class="checkout_city_options">
                  ${deliveryCities.map((city) => `
                    <label class="checkout_city_card" data-checkout-city="${city.id}">
                      <input type="radio" name="checkoutCity" value="${city.id}" required>
                      <span class="checkout_city_check" aria-hidden="true"></span>
                      <span>
                        <strong>${escapeHtml(city.name)}</strong>
                        <small>${escapeHtml(city.schedule)}</small>
                      </span>
                    </label>
                  `).join("")}
                </div>
              </fieldset>
            </div>
            <div class="checkout_nav_row">
              <button class="checkout_back_btn" type="button" data-checkout-prev>Back</button>
              <button class="checkout_next_btn" type="button" data-checkout-next>Address details</button>
            </div>
          </div>

          <div class="checkout_step_panel is_locked" data-checkout-step-panel="2" hidden>
            <div class="checkout_panel">
              <div class="checkout_panel_head">
                <div>
                  <span class="checkout_step_label">Step 3</span>
                  <h4>Address details</h4>
                </div>
              </div>
              <div class="checkout_selected_city">
                <strong id="checkoutSelectedCityName">Choose a city first</strong>
                <span id="checkoutSelectedCitySchedule">Address fields unlock after city selection.</span>
              </div>
              <div class="checkout_fields checkout_address_fields">
                <label>
                  <span>Customer name</span>
                  <input id="checkoutCustomerName" name="customerName" type="text" autocomplete="name" required>
                </label>
                <label>
                  <span>Phone number</span>
                  <input id="checkoutCustomerPhone" name="customerPhone" type="tel" autocomplete="tel" required>
                </label>
                <label>
                  <span>Email <em>optional</em></span>
                  <input id="checkoutCustomerEmail" name="customerEmail" type="email" autocomplete="email">
                </label>
                <label>
                  <span>Area</span>
                  <input id="checkoutCustomerArea" name="customerArea" type="text" autocomplete="address-level3" required>
                </label>
                <label class="checkout_full_width">
                  <span>Full address</span>
                  <textarea id="checkoutCustomerAddress" name="customerAddress" rows="3" autocomplete="street-address" required></textarea>
                </label>
                <label>
                  <span>Building number</span>
                  <input id="checkoutCustomerBuilding" name="customerBuilding" type="text" required>
                </label>
                <label>
                  <span>Floor / apartment</span>
                  <input id="checkoutCustomerFloorApartment" name="customerFloorApartment" type="text" required>
                </label>
                <label class="checkout_full_width">
                  <span>Landmark / notes <em>optional</em></span>
                  <textarea id="checkoutCustomerNotes" name="customerNotes" rows="2"></textarea>
                </label>
              </div>
            </div>
            <div class="checkout_nav_row">
              <button class="checkout_back_btn" type="button" data-checkout-prev>Back</button>
              <button class="checkout_next_btn" type="button" data-checkout-next>Review & pay</button>
            </div>
          </div>

          <div class="checkout_step_panel" data-checkout-step-panel="3" hidden>
            <div class="checkout_panel checkout_payment_panel">
              <div class="checkout_panel_head">
                <div>
                  <span class="checkout_step_label">Step 4</span>
                  <h4>Review & pay</h4>
                </div>
                <strong id="checkoutReviewTotalPrice">\u062c.\u0645 0.00</strong>
              </div>
              <div class="checkout_review_cards">
                <div class="checkout_review_card">
                  <span>Delivery city</span>
                  <strong id="checkoutReviewCity">City not selected</strong>
                </div>
                <div class="checkout_review_card">
                  <span>Customer</span>
                  <strong id="checkoutReviewCustomer">Customer details not entered</strong>
                </div>
                <div class="checkout_review_card checkout_full_width">
                  <span>Address</span>
                  <strong id="checkoutReviewAddress">Address details not entered</strong>
                </div>
              </div>
              <label class="checkout_payment_option">
                <input type="radio" name="checkoutPaymentMethod" value="paymob-checkout" checked>
                <span class="checkout_payment_icon"><i class="fa fa-credit-card" aria-hidden="true"></i></span>
                <span>
                  <strong>Secure online payment</strong>
                  <small>Visa / Mastercard, mobile wallets, and kiosk / Fawry are handled by Paymob.</small>
                </span>
              </label>
              <div class="checkout_total_row">
                <span>Total price</span>
                <strong id="checkoutFinalTotalPrice">\u062c.\u0645 0.00</strong>
              </div>
            </div>
            <div class="checkout_nav_row">
              <button class="checkout_back_btn" type="button" data-checkout-prev>Back</button>
              <button class="checkout_confirm_btn" type="submit">Confirm Order</button>
            </div>
          </div>
        </form>
      </section>
    </div>
  `);

  document.body.appendChild(modal);
  modal.setAttribute("aria-hidden", "true");
  bindCheckoutModalControls(modal);
  return modal;
}

function ensureBackToTopButton() {
  let button = document.querySelector(".back_to_top_btn:not(.scroll-down)");
  if (button) {
    button.classList.add("scroll-to-top", "scroll-top-btn");
    return button;
  }

  button = createElementFromHTML(`
    <button class="back_to_top_btn scroll-to-top scroll-top-btn" type="button" aria-label="Back to top" title="Back to top" hidden>
      <i class="fa fa-arrow-up" aria-hidden="true"></i>
    </button>
  `);

  document.body.appendChild(button);
  return button;
}

function ensureScrollDownButton() {
  let button = document.querySelector(".scroll-down");
  if (button) {
    button.classList.add("back_to_top_btn", "scroll-down-btn");
    return button;
  }

  button = createElementFromHTML(`
    <button class="back_to_top_btn scroll-down scroll-down-btn" type="button" aria-label="Scroll to products" title="Scroll to products" hidden>
      <i class="fa fa-arrow-down" aria-hidden="true"></i>
    </button>
  `);

  document.body.appendChild(button);
  return button;
}

function getScrollDownTarget() {
  return document.querySelector("#products")
    || document.querySelector(".products-section")
    || document.querySelector(".food_section")
    || document.querySelector(".product_details_section")
    || document.querySelector(".wishlist_section")
    || document.querySelector(".book_section")
    || document.querySelector(".about_section")
    || document.querySelector("main section")
    || document.querySelector("section");
}

function initBackToTopButton() {
  const scrollTopButton = ensureBackToTopButton();
  const scrollDownButton = ensureScrollDownButton();
  const scrollDownBtn = document.querySelector(".scroll-down-btn");
  const scrollTopBtn = document.querySelector(".scroll-top-btn");
  const topThreshold = 4;
  let syncFrame = 0;

  const syncButtons = () => {
    const atTop = window.scrollY <= topThreshold;
    const hasDownTarget = Boolean(getScrollDownTarget());
    const showDown = atTop && hasDownTarget;
    const showTop = !atTop;

    scrollDownButton.hidden = !showDown;
    scrollDownButton.classList.toggle("is_visible", showDown);

    scrollTopButton.hidden = !showTop;
    scrollTopButton.classList.toggle("is_visible", showTop);
  };

  const scheduleSyncButtons = () => {
    if (syncFrame) {
      return;
    }

    syncFrame = window.requestAnimationFrame(() => {
      syncFrame = 0;
      syncButtons();
    });
  };

  if (scrollDownBtn) {
    scrollDownBtn.addEventListener("click", () => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth"
      });
    });
  }

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }

  syncButtons();
  window.addEventListener("scroll", scheduleSyncButtons, { passive: true });
  window.addEventListener("resize", scheduleSyncButtons);
}

const globalEventsGuardKey = "__sushiBoxGlobalEventsBound";
const scrollDepthMilestones = [25, 50, 75, 100];
const trackedScrollDepthMilestones = new Set();
const trackedBannerViews = new Set();

function getPageNameForAnalytics() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function getProductContextForAnalytics(target) {
  const productRoot = target?.closest?.("[data-product-id], [data-cart-product-id], [data-wishlist-card-id]")
    || document.querySelector(".product_main_image[data-product-id]");
  const productId = productRoot?.getAttribute("data-product-id")
    || productRoot?.getAttribute("data-cart-product-id")
    || productRoot?.getAttribute("data-wishlist-card-id")
    || "";
  const product = productId ? getProductById(productId) : null;

  return {
    product_id: product?.id || productId,
    product_name: product?.name || document.getElementById("productName")?.textContent?.trim() || ""
  };
}

function getBannerAnalyticsData(slide, index = 0) {
  const position = index + 1;
  const title = slide?.querySelector("h1, h2, h3")?.textContent?.replace(/\s+/g, " ").trim() || `Hero banner ${position}`;

  return {
    banner_id: slide?.getAttribute("data-banner-id") || `hero-${position}`,
    banner_title: title,
    banner_position: position
  };
}

function trackHeroBannerView(slide) {
  const slides = Array.from(document.querySelectorAll(".hero-slider .carousel-item"));
  const index = Math.max(0, slides.indexOf(slide));
  const data = getBannerAnalyticsData(slide, index);

  if (trackedBannerViews.has(data.banner_id)) {
    return;
  }

  trackedBannerViews.add(data.banner_id);
  trackBannerView(data);
}

function initHeroBannerAnalytics() {
  const slider = document.querySelector(".hero-slider");
  const slides = Array.from(document.querySelectorAll(".hero-slider .carousel-item"));
  if (!slider || !slides.length) {
    return;
  }

  // Track banner views only when the hero area is visible enough to count.
  const trackActiveSlide = () => {
    trackHeroBannerView(slider.querySelector(".carousel-item.active") || slides[0]);
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35)) {
        trackActiveSlide();
      }
    }, { threshold: [0.35] });
    observer.observe(slider);
  } else {
    window.setTimeout(trackActiveSlide, 300);
  }

  if (window.jQuery) {
    window.jQuery(slider).on("slid.bs.carousel", trackActiveSlide);
  }

  slider.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) {
      return;
    }

    const slide = link.closest(".carousel-item") || slider.querySelector(".carousel-item.active") || slides[0];
    trackBannerClick(getBannerAnalyticsData(slide, Math.max(0, slides.indexOf(slide))));
  });
}

function initScrollDepthAnalytics() {
  const getPercentScrolled = () => {
    const documentHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      window.innerHeight
    );
    const scrollableHeight = Math.max(1, documentHeight - window.innerHeight);
    return Math.min(100, Math.round(((window.scrollY || window.pageYOffset || 0) / scrollableHeight) * 100));
  };

  let scrollFrame = 0;
  const checkScrollDepth = () => {
    scrollFrame = 0;
    const percentScrolled = getPercentScrolled();

    scrollDepthMilestones.forEach((milestone) => {
      if (percentScrolled >= milestone && !trackedScrollDepthMilestones.has(milestone)) {
        trackedScrollDepthMilestones.add(milestone);
        trackScrollDepth(milestone);
      }
    });
  };

  const scheduleCheck = () => {
    if (scrollFrame) {
      return;
    }

    scrollFrame = window.requestAnimationFrame(checkScrollDepth);
  };

  checkScrollDepth();
  window.addEventListener("scroll", scheduleCheck, { passive: true });
  window.addEventListener("resize", scheduleCheck);
}

function initJavascriptErrorAnalytics() {
  if (window.__sushiBoxErrorAnalyticsBound) {
    return;
  }

  window.__sushiBoxErrorAnalyticsBound = true;
  const previousOnError = window.onerror;
  const recentErrorSignatures = new Set();

  const trackErrorOnce = (detail) => {
    const signature = [
      detail.message || "",
      detail.file || "",
      detail.line || 0,
      detail.column || 0
    ].join("|");

    if (recentErrorSignatures.has(signature)) {
      return;
    }

    recentErrorSignatures.add(signature);
    window.setTimeout(() => recentErrorSignatures.delete(signature), 1500);
    trackJavascriptError(detail);
  };

  // Global JavaScript error monitoring is isolated so analytics never breaks the site.
  window.onerror = function sushiBoxGlobalErrorHandler(message, file, line, column, errorObject) {
    try {
      trackErrorOnce({
        message: errorObject?.message || message || "Unknown JavaScript error",
        file: file || "",
        line: line || 0,
        column: column || 0,
        page: getPageNameForAnalytics()
      });
    } catch (error) {}

    if (typeof previousOnError === "function") {
      return previousOnError.apply(window, arguments);
    }

    return false;
  };

  window.addEventListener("error", (event) => {
    try {
      trackErrorOnce({
        message: event.message || event.error?.message || "Unknown JavaScript error",
        file: event.filename || "",
        line: event.lineno || 0,
        column: event.colno || 0,
        page: getPageNameForAnalytics()
      });
    } catch (error) {}
  });

  window.addEventListener("unhandledrejection", (event) => {
    try {
      const reason = event.reason || {};
      trackErrorOnce({
        message: reason.message || String(reason || "Unhandled promise rejection"),
        file: reason.fileName || "",
        line: reason.lineNumber || 0,
        column: reason.columnNumber || 0,
        page: getPageNameForAnalytics()
      });
    } catch (error) {}
  });
}

function scheduleSearchAnalytics(query) {
  const normalizedQuery = String(query || "").trim();
  window.clearTimeout(searchAnalyticsTimer);

  if (!normalizedQuery) {
    return;
  }

  searchAnalyticsTimer = window.setTimeout(() => {
    const resultCount = searchProductsDetailed(normalizedQuery).length;
    const signature = `${normalizedQuery.toLowerCase()}|${resultCount}`;
    if (signature === lastTrackedSearchSignature) {
      return;
    }

    lastTrackedSearchSignature = signature;
    trackSearch(normalizedQuery, {
      resultsCount: resultCount,
      zeroResults: resultCount === 0
    });
  }, 700);
}

function trackInitialUrlSearchAnalytics() {
  try {
    const params = new URLSearchParams(window.location.search || "");
    const query = params.get("search") || params.get("q") || "";
    if (query) {
      scheduleSearchAnalytics(query);
    }
  } catch (error) {}
}

function initGlobalAnalyticsMonitoring() {
  initJavascriptErrorAnalytics();
  initScrollDepthAnalytics();
  initHeroBannerAnalytics();
}

function closeCheckoutModal() {
  const modal = document.querySelector(".checkout_modal");
  if (!modal) {
    return;
  }

  modal.hidden = true;
  modal.classList.remove("is_open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("checkout_open");
}

function navigateToCheckoutPage() {
  if (!isCartReady()) {
    emitToast(getCartUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."), "info");
    return;
  }

  if (!getCart().length) {
    emitToast(getCartUiText("cartEmptyBeforeCheckout", "Your cart is empty. Add products before checkout."), "info");
    return;
  }

  window.location.href = "checkout.html";
}

function openCheckoutModal() {
  navigateToCheckoutPage();
}

function confirmCheckoutOrder() {
  const modal = ensureCheckoutModal();
  const validation = getCheckoutValidation(modal);

  if (!validation.isValid) {
    setCheckoutValidationMessage(modal, validation.message);
    const target = validation.fieldId ? modal.querySelector(`#${validation.fieldId}`) : modal.querySelector("input, select, textarea");
    if (target) {
      target.focus({ preventScroll: true });
    }
    return;
  }

  navigateToCheckoutPage();
}

function showToast(message, tone = "info") {
  const stack = ensureToastStack();
  const toast = createElementFromHTML(`
    <div class="site_toast site_toast_${tone}">
      <span>${escapeHtml(message)}</span>
    </div>
  `);

  stack.appendChild(toast);
  window.setTimeout(() => {
    toast.classList.add("is_visible");
  }, 10);
  window.setTimeout(() => {
    toast.classList.remove("is_visible");
    window.setTimeout(() => {
      toast.remove();
    }, 250);
  }, 2800);
}

function getSearchResultMarkup(product, index = 0) {
  const productUrl = buildProductUrl(product.id);

  return `
    <article class="site_search_result" role="option" aria-selected="${index === 0 ? "true" : "false"}" data-product-id="${escapeHtml(product.id)}" data-product-url="${escapeHtml(productUrl)}">
      <a href="${escapeHtml(productUrl)}" class="site_search_result_link" aria-label="${escapeHtml(getProductUiText("viewProductAria", "View {name}", { name: product.name }))}">
        ${renderProductThumb({
          product,
          alt: product.name,
          width: 220,
          height: 160,
          sizes: "(max-width: 767px) 42vw, (max-width: 1199px) 28vw, 220px",
          loading: "eager"
        })}
        <div class="site_search_result_body">
          <span class="site_search_result_category">${escapeHtml(product.category)}</span>
          <strong>${escapeHtml(product.name)}</strong>
          ${buildRatingSummaryMarkup(latestReviewSummaries[product.id], "site_search_rating", { productId: product.id })}
          <span class="site_search_result_meta">${formatPrice(product.price)}</span>
        </div>
      </a>
      <button class="product-wishlist-btn site_search_wishlist_btn" type="button" data-wishlist-product-id="${escapeHtml(product.id)}" aria-label="${escapeHtml(getProductUiText("addProductToFavorites", "Add {name} to favorites", { name: product.name }))}" aria-pressed="false" title="${escapeHtml(getProductUiText("addToFavorites", "Add to favorites"))}">
        <i class="fa fa-heart-o" aria-hidden="true"></i>
      </button>
    </article>
  `;
}

function renderSearchResults(query) {
  const resultsContainer = document.getElementById("siteSearchResults");
  const hint = document.getElementById("siteSearchHint");
  const sectionLabel = document.getElementById("siteSearchSectionLabel");
  if (!resultsContainer || !hint || !sectionLabel) {
    return;
  }

  const normalizedQuery = String(query || "").trim();
  const detailedResults = searchProductsDetailed(normalizedQuery);
  const visibleResults = detailedResults.slice(0, normalizedQuery ? 6 : 4);

  if (!normalizedQuery) {
    hint.textContent = getProductUiText("searchHint", "Try ramen, shrimp, soy, sushi, Samyang, or dumplings.");
    sectionLabel.hidden = false;
    sectionLabel.textContent = getProductUiText("popularProducts", "Popular products");
    resultsContainer.innerHTML = getAllProducts().slice(0, 4).map((product, index) => getSearchResultMarkup(product, index)).join("");
    updateWishlistButtons(getWishlist());
    setActiveSearchResult(0);
    return;
  }

  if (!detailedResults.length) {
    hint.textContent = getProductUiText("noProductsMatched", "No products matched \"{query}\".", { query: normalizedQuery });
    sectionLabel.hidden = true;
    resultsContainer.innerHTML = `
      <div class="site_search_empty_state">
        <span class="site_search_empty_icon"><i class="fa fa-search" aria-hidden="true"></i></span>
        <strong>${escapeHtml(getProductUiText("noProductsFound", "No products found"))}</strong>
        <p>${escapeHtml(getProductUiText("noProductsFoundHint", "Try a product type, brand, ingredient, or a shorter word like \"soy\", \"ramen\", \"shrimp\", or \"sushi\"."))}</p>
      </div>
    `;
    return;
  }

  const hasStrongMatch = visibleResults.some((result) => result.strength === "strong");
  const seeAllLink = `
    <a class="site_search_see_all" href="${getSitePageHref("menu.html")}?search=${encodeURIComponent(normalizedQuery)}">
      ${escapeHtml(getProductUiText("seeAllResults", "See all results"))}
    </a>
  `;

  hint.textContent = hasStrongMatch
    ? getProductUiCountText("resultsFound", detailedResults.length, "{count} result found.", "{count} results found.")
    : getProductUiText("weakMatches", "Exact matches are weak, so we found the closest products.");
  sectionLabel.hidden = false;
  sectionLabel.textContent = hasStrongMatch ? getProductUiText("bestMatches", "Best matches") : getProductUiText("relatedResults", "Related results");
  resultsContainer.innerHTML = visibleResults.map(({ product }, index) => getSearchResultMarkup(product, index)).join("") + seeAllLink;
  updateWishlistButtons(getWishlist());
  setActiveSearchResult(0);
}

function getSearchResultLinks() {
  return Array.from(document.querySelectorAll("#siteSearchResults .site_search_result"));
}

function setActiveSearchResult(index) {
  const links = getSearchResultLinks();
  links.forEach((link, linkIndex) => {
    const isActive = linkIndex === index;
    link.classList.toggle("is_active", isActive);
    link.setAttribute("aria-selected", String(isActive));
  });
}

function getActiveSearchResultIndex() {
  return getSearchResultLinks().findIndex((link) => link.classList.contains("is_active"));
}

function getDomFieldValue(selectors) {
  for (const selector of selectors) {
    const field = document.querySelector(selector);
    const value = field && "value" in field ? String(field.value || "").trim() : "";
    if (value) {
      return value;
    }
  }

  return "";
}

function getStoredCustomerField(fieldNames) {
  cleanPrivateStorage();
  return "";
}

function getCustomerOrderDetails() {
  const currentUser = getCurrentUser();

  return {
    name: (currentUser && currentUser.displayName ? currentUser.displayName : "")
      || getDomFieldValue([
        "[name='customerName']",
        "[name='fullName']",
        "[name='name']",
        "#customerName",
        "#fullName"
      ])
      || getStoredCustomerField(["customerName", "fullName", "name"]),
    phone: getDomFieldValue([
      "input[type='tel']",
      "[name='customerPhone']",
      "[name='phone']",
      "[name='mobile']",
      "#customerPhone",
      "#phone"
    ]) || getStoredCustomerField(["customerPhone", "phone", "mobile"]),
    address: getDomFieldValue([
      "[name='customerAddress']",
      "[name='address']",
      "#customerAddress",
      "#address",
      "textarea[name='address']"
    ]) || getStoredCustomerField(["customerAddress", "address"])
  };
}

function renderCart(cart, detail = {}) {
  const cartItems = document.getElementById("cartItems");
  const cartEmptyState = document.getElementById("cartEmptyState");
  const cartSubtotal = document.getElementById("cartSubtotal");
  const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
  const cartClearBtn = document.getElementById("cartClearBtn");
  const cartLinks = document.querySelectorAll(".cart_link");
  const isReady = detail.ready !== false && !detail.loading;
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const languageKey = getLanguage();
  const markupKey = isReady
    ? `${languageKey}:` + cart.map((item) => {
      const status = getInventoryStatus(item.id);
      const product = getExactProduct(item.id);
      const pricing = getProductOfferPricing(product || { id: item.id, price: item.price });
      return `${item.id}:${item.quantity}:${pricing.originalPrice}:${pricing.finalPrice}:${status.message}:${status.available}`;
    }).join("|")
    : `${languageKey}:loading`;

  logCartDebug("navbar/cart drawer reads cart", {
    storageKey: detail.storageKey,
    storageScope: detail.storageScope,
    ready: detail.ready,
    productCount: cart.length,
    unitCount: cartCount
  });

  cartLinks.forEach((cartLink) => {
    cartLink.setAttribute("href", getSitePageHref("cart.html"));
    let badge = cartLink.querySelector(".cart_count_badge");
    if (!badge) {
      badge = createElementFromHTML('<span class="cart_count_badge">0</span>');
      cartLink.appendChild(badge);
    }

    badge.textContent = String(cartCount);
    badge.hidden = !isReady || cartCount === 0;
  });

  if (!cartItems || !cartEmptyState || !cartSubtotal || !cartCheckoutBtn) {
    return;
  }

  if (!isReady) {
    cartSubtotal.textContent = formatPrice(0);
    cartCheckoutBtn.disabled = true;
    cartCheckoutBtn.setAttribute("aria-disabled", "true");
    cartCheckoutBtn.classList.add("is_disabled");
    if (cartClearBtn) {
      cartClearBtn.disabled = true;
    }
    cartEmptyState.hidden = false;
    cartEmptyState.innerHTML = `
      <div class="cart_empty_icon"><i class="fa fa-spinner fa-spin" aria-hidden="true"></i></div>
      <p>${escapeHtml(getCartUiText("loadingCart", "Loading cart"))}...</p>
    `;
    if (lastCartMarkupKey !== markupKey) {
      cartItems.innerHTML = "";
      lastCartMarkupKey = markupKey;
    }
    return;
  }

  cartSubtotal.textContent = formatPrice(getCartOfferSubtotal(cart));
  cartCheckoutBtn.disabled = !cart.length;
  cartCheckoutBtn.setAttribute("aria-disabled", String(!cart.length));
  cartCheckoutBtn.classList.toggle("is_disabled", !cart.length);
  if (cartClearBtn) {
    cartClearBtn.disabled = !cart.length;
  }
  cartEmptyState.hidden = cart.length > 0;
  cartEmptyState.innerHTML = `
    <div class="cart_empty_icon"><i class="fa fa-shopping-basket" aria-hidden="true"></i></div>
    <p>${escapeHtml(getCartUiText("drawerEmptyHint", "Your cart is empty. Add a few favorites to get started."))}</p>
  `;
  if (lastCartMarkupKey === markupKey) {
    return;
  }

  lastCartMarkupKey = markupKey;
  cartItems.innerHTML = cart.map((item) => {
    const product = getExactProduct(item.id);
    const pricing = getProductOfferPricing(product || { id: item.id, price: item.price });
    const inventoryStatus = getInventoryStatus(item.id);
    const quantityLimitNotice = getQuantityLimitNotice(inventoryStatus, item.quantity);
    const stockStatusText = getCartStockStatusText(inventoryStatus);

    return `
      <article class="cart_item" data-cart-product-id="${item.id}">
        <a href="${buildProductUrl(item.id)}" class="cart_item_image">
          ${renderProductThumb({
            product,
            imagePath: item.image,
            alt: item.name,
            width: 72,
            height: 72,
            sizes: "72px"
          })}
        </a>
        <div class="cart_item_content">
          <div class="cart_item_header">
            <a href="${buildProductUrl(item.id)}"><strong>${escapeHtml(item.name)}</strong></a>
            <button class="cart_remove_btn" type="button" data-remove-cart-item="${item.id}">${escapeHtml(getCartUiText("remove", "Remove"))}</button>
          </div>
          <span class="cart_item_price">${pricing.offer ? `<del>${escapeHtml(formatPrice(pricing.originalPrice))}</del> ` : ""}${escapeHtml(formatPrice(pricing.finalPrice))}</span>
          <span class="product_stock_status${inventoryStatus.isOutOfStock ? " is_out" : ""}${inventoryStatus.isLowStock ? " is_low" : ""}" ${inventoryStatus.message ? "" : "hidden"}>${escapeHtml(stockStatusText)}</span>
          <div class="cart_qty_stack">
            <div class="cart_qty_controls">
              <button type="button" data-cart-decrease="${item.id}" aria-label="${escapeHtml(getCartUiText("decreaseQuantity", "Decrease quantity"))}">-</button>
              <span>${item.quantity}</span>
              <button type="button" data-cart-increase="${item.id}" aria-label="${escapeHtml(getCartUiText("increaseQuantity", "Increase quantity"))}" ${inventoryStatus.tracked && item.quantity >= inventoryStatus.available ? "disabled" : ""}>+</button>
            </div>
            ${quantityLimitNotice ? `<span class="cart_quantity_limit_notice">${escapeHtml(quantityLimitNotice)}</span>` : ""}
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function setAuthDropdownState(authShell, user) {
  latestAuthUser = user || null;
  const button = authShell.querySelector(".auth_button");
  const avatar = authShell.querySelector(".auth_avatar");
  const label = authShell.querySelector(".auth_button_text");
  const dropdown = authShell.querySelector(".auth_dropdown");

  if (!button || !avatar || !label || !dropdown) {
    updateSideDrawerAccount(user);
    return;
  }

  button.classList.toggle("is_signed_in", Boolean(user));

  if (!user) {
    avatar.innerHTML = renderAvatarContent(null);
    label.setAttribute("data-i18n", "auth.login");
    label.textContent = getLocalizedText("auth.login", "Login");
    dropdown.innerHTML = `
      <div class="auth_dropdown_card">
        <p data-i18n="auth.googleAccountHint">${escapeHtml(getLocalizedText("auth.googleAccountHint", "Sign in with Google to manage reviews, save your profile, and keep orders under your account."))}</p>
        <button class="auth_dropdown_btn" type="button" data-auth-action="login" data-i18n="auth.continueWithGoogle">${escapeHtml(getLocalizedText("auth.continueWithGoogle", "Continue with Google"))}</button>
      </div>
    `;
    applyTranslations(authShell);
    updateSideDrawerAccount(user);
    return;
  }

  avatar.innerHTML = renderAvatarContent(user);
  label.removeAttribute("data-i18n");
  label.textContent = user.displayName || user.email || getLocalizedText("auth.myAccount", "My Account");
  const signedInWithGoogle = getLocalizedText("auth.signedInWithGoogle", "Signed in with Google");
  dropdown.innerHTML = `
    <div class="auth_dropdown_card auth_dropdown_card_user">
      <div class="auth_dropdown_user">
        <span class="auth_dropdown_user_avatar">
          ${renderAvatarContent(user)}
        </span>
        <div class="auth_dropdown_user_meta">
          <strong>${escapeHtml(user.displayName || getLocalizedText("auth.sushiBoxCustomer", "Sushi Box Customer"))}</strong>
          <span title="${escapeHtml(user.email || signedInWithGoogle)}">${escapeHtml(user.email || signedInWithGoogle)}</span>
        </div>
      </div>
      <div class="auth_dropdown_actions" aria-label="${escapeHtml(getLocalizedText("auth.accountActions", "Account actions"))}" data-i18n-attr="aria-label:auth.accountActions">
        <button class="auth_dropdown_icon_button" type="button" data-auth-action="logout" title="${escapeHtml(getLocalizedText("auth.logout", "Logout"))}" data-i18n-attr="title:auth.logout">
          <i class="fa fa-sign-out" aria-hidden="true"></i>
          <span data-i18n="auth.logout">${escapeHtml(getLocalizedText("auth.logout", "Logout"))}</span>
        </button>
      </div>
    </div>
  `;
  applyTranslations(dropdown);
  updateSideDrawerAccount(user);
}

function isMobileViewport() {
  return window.matchMedia && window.matchMedia("(max-width: 991px)").matches;
}

function closeMobileMenuDrawer() {
  const collapse = document.querySelector(".custom_nav-container .navbar-collapse");
  const toggler = document.querySelector(".custom_nav-container .navbar-toggler");

  if (!collapse || !collapse.classList.contains("show")) {
    return;
  }

  if (window.jQuery && typeof window.jQuery.fn.collapse === "function") {
    window.jQuery(collapse).collapse("hide");
    collapse.setAttribute("aria-hidden", "true");
  } else {
    collapse.classList.remove("show");
    if (toggler) {
      toggler.setAttribute("aria-expanded", "false");
    }
    collapse.setAttribute("aria-hidden", "true");
  }

  document.body.classList.remove("mobile_menu_open");
}

function ensureMobileAuthModal() {
  let modal = document.querySelector(".mobile_auth_modal");
  if (modal) {
    return modal;
  }

  modal = createElementFromHTML(`
    <div class="mobile_auth_modal" hidden>
      <div class="mobile_auth_backdrop" data-close-mobile-auth="true"></div>
      <section class="mobile_auth_dialog" role="dialog" aria-modal="true" aria-labelledby="mobileAuthTitle" aria-describedby="mobileAuthSubtitle" tabindex="-1">
        <button class="mobile_auth_close" type="button" data-close-mobile-auth="true" aria-label="${escapeHtml(getLocalizedText("auth.closeSignIn", "Close sign in"))}" data-i18n-attr="aria-label:auth.closeSignIn">
          <i class="fa fa-times" aria-hidden="true"></i>
        </button>
        <span class="mobile_auth_icon" aria-hidden="true">
          <i class="fa fa-user"></i>
        </span>
        <h3 id="mobileAuthTitle" data-i18n="auth.signInWithGoogleTitle">${escapeHtml(getLocalizedText("auth.signInWithGoogleTitle", "Sign in to Sushi Box"))}</h3>
        <p id="mobileAuthSubtitle" data-i18n="auth.continueWithGoogleAccount">${escapeHtml(getLocalizedText("auth.continueWithGoogleAccount", "Continue with your Google account"))}</p>
        <button class="mobile_auth_google_btn" type="button" data-auth-action="login">
          <i class="fa fa-google" aria-hidden="true"></i>
          <span data-i18n="auth.continueWithGoogle">${escapeHtml(getLocalizedText("auth.continueWithGoogle", "Continue with Google"))}</span>
        </button>
      </section>
    </div>
  `);

  document.body.appendChild(modal);
  applyTranslations(modal);
  return modal;
}

function closeMobileAuthModal() {
  const modal = document.querySelector(".mobile_auth_modal");
  if (!modal) {
    return;
  }

  modal.hidden = true;
  document.body.classList.remove("mobile_auth_open");
}

function openMobileAuthModal() {
  const modal = ensureMobileAuthModal();
  closeMobileMenuDrawer();
  modal.hidden = false;
  document.body.classList.add("mobile_auth_open");

  const googleButton = modal.querySelector(".mobile_auth_google_btn");
  window.setTimeout(() => {
    if (googleButton) {
      googleButton.focus();
    } else {
      modal.querySelector(".mobile_auth_dialog").focus();
    }
  }, 30);
}

function openAuthPrompt(authShell) {
  if (isMobileViewport()) {
    openMobileAuthModal();
    return;
  }

  const button = authShell && authShell.querySelector(".auth_button");
  const dropdown = authShell && authShell.querySelector(".auth_dropdown");
  if (!button || !dropdown) {
    return;
  }

  button.setAttribute("aria-expanded", "true");
  dropdown.hidden = false;
  button.focus();
}

function closeSearchPanel() {
  const panel = document.querySelector(".site_search_panel");
  const nav = document.querySelector(".custom_nav-container");
  if (!panel) {
    return;
  }

  const input = document.getElementById("siteSearchInput");
  if (input) {
    input.value = "";
    renderSearchResults("");
    emitSearchQuery("");
  }

  window.clearTimeout(searchPanelCloseTimer);
  panel.classList.remove("is_open");
  panel.setAttribute("aria-hidden", "true");
  document.body.classList.remove("search_open");
  if (nav) {
    nav.classList.remove("search-active");
  }
  searchPanelCloseTimer = window.setTimeout(() => {
    if (!document.body.classList.contains("search_open")) {
      panel.hidden = true;
    }
  }, 240);
}

function openSearchPanel() {
  searchPanelScrollPosition = {
    x: window.scrollX || window.pageXOffset || 0,
    y: window.scrollY || window.pageYOffset || 0
  };

  closeSideDrawerMenu();
  closeCartDrawer();
  window.clearTimeout(searchPanelCloseTimer);
  const panel = ensureSearchPanel();
  const nav = document.querySelector(".custom_nav-container");
  const searchShell = ensureNavbarSearchShell(nav);
  const input = searchShell && searchShell.querySelector("#siteSearchInput");
  panel.hidden = false;
  panel.classList.add("is_open");
  panel.setAttribute("aria-hidden", "false");
  document.body.classList.add("search_open");
  if (nav) {
    nav.classList.add("search-active");
  }
  renderSearchResults("");

  if (input) {
    input.value = "";
    emitSearchQuery("");
    window.setTimeout(() => {
      input.focus({ preventScroll: true });
      restoreSearchScrollPosition();
      window.requestAnimationFrame(restoreSearchScrollPosition);
      window.setTimeout(restoreSearchScrollPosition, 120);
    }, 30);
  }
}

function closeCartDrawer() {
  const drawer = document.querySelector(".cart_drawer");
  if (!drawer) {
    return;
  }

  drawer.hidden = true;
  drawer.classList.remove("is_open");
  drawer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("cart_open");
  restoreCartScrollPosition();
}

function openCartDrawer() {
  cartDrawerScrollPosition = {
    x: window.scrollX || window.pageXOffset || 0,
    y: window.scrollY || window.pageYOffset || 0
  };

  const drawer = ensureCartDrawer();
  drawer.hidden = false;
  drawer.classList.add("is_open");
  drawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("cart_open");
  restoreCartScrollPosition();
  window.requestAnimationFrame(restoreCartScrollPosition);
  window.setTimeout(restoreCartScrollPosition, 120);
}

function bindGlobalEvents(authShell) {
  if (window[globalEventsGuardKey]) {
    return;
  }

  window[globalEventsGuardKey] = true;

  document.addEventListener("click", async (event) => {
    const languageToggle = event.target.closest("[data-language-toggle]");
    if (languageToggle) {
      event.preventDefault();
      const switcher = languageToggle.closest(".custom-language-switcher");
      const menu = switcher && switcher.querySelector(".language-menu");
      const isOpen = menu && menu.classList.contains("active");
      document.querySelectorAll(".language-menu.active").forEach((openMenu) => {
        openMenu.classList.remove("active");
      });
      document.querySelectorAll("[data-language-toggle][aria-expanded='true']").forEach((openToggle) => {
        openToggle.setAttribute("aria-expanded", "false");
      });

      if (menu && !isOpen) {
        menu.classList.add("active");
        languageToggle.setAttribute("aria-expanded", "true");
      }
      return;
    }

    if (event.target.closest("[data-language-option]")) {
      document.querySelectorAll(".language-menu.active").forEach((openMenu) => {
        openMenu.classList.remove("active");
      });
      document.querySelectorAll("[data-language-toggle][aria-expanded='true']").forEach((openToggle) => {
        openToggle.setAttribute("aria-expanded", "false");
      });
      return;
    }

    if (!event.target.closest(".custom-language-switcher")) {
      document.querySelectorAll(".language-menu.active").forEach((openMenu) => {
        openMenu.classList.remove("active");
      });
      document.querySelectorAll("[data-language-toggle][aria-expanded='true']").forEach((openToggle) => {
        openToggle.setAttribute("aria-expanded", "false");
      });
    }

    const whatsAppLink = event.target.closest("a[href*='wa.me'], a[href*='api.whatsapp.com'], a[href*='whatsapp://']");
    if (whatsAppLink) {
      const productContext = getProductContextForAnalytics(whatsAppLink);
      trackWhatsAppClick({
        page: getPageNameForAnalytics(),
        product_id: productContext.product_id,
        product_name: productContext.product_name
      });
    }

    const checkoutCloseAction = event.target.closest("[data-close-checkout]");
    if (checkoutCloseAction) {
      closeCheckoutModal();
      return;
    }

    const checkoutAction = event.target.closest("[data-open-checkout], #cartCheckoutBtn");
    if (checkoutAction) {
      event.preventDefault();
      if (!isCartReady()) {
        emitToast(getCartUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."), "info");
        return;
      }
      if (checkoutAction.classList.contains("is_disabled") || checkoutAction.disabled) {
        emitToast(getCartUiText("cartEmptyBeforeCheckout", "Your cart is empty. Add products before checkout."), "info");
        return;
      }
      navigateToCheckoutPage();
      return;
    }

    const authButton = event.target.closest(".auth_button");
    if (authButton) {
      if (isMobileViewport() && !getCurrentUser()) {
        event.preventDefault();
        const dropdown = authShell.querySelector(".auth_dropdown");
        authButton.setAttribute("aria-expanded", "false");
        if (dropdown) {
          dropdown.hidden = true;
        }
        openMobileAuthModal();
        return;
      }

      const dropdown = authShell.querySelector(".auth_dropdown");
      const isOpen = authButton.getAttribute("aria-expanded") === "true";
      authButton.setAttribute("aria-expanded", isOpen ? "false" : "true");
      dropdown.hidden = isOpen;
      return;
    }

    const sideDrawerAccountToggle = event.target.closest("[data-side-drawer-account-toggle]");
    if (sideDrawerAccountToggle) {
      event.preventDefault();
      const controlsId = sideDrawerAccountToggle.getAttribute("aria-controls");
      const accountActions = controlsId ? document.getElementById(controlsId) : null;
      const shouldExpand = sideDrawerAccountToggle.getAttribute("aria-expanded") !== "true";

      sideDrawerAccountToggle.setAttribute("aria-expanded", String(shouldExpand));
      if (accountActions) {
        accountActions.hidden = !shouldExpand;
      }
      return;
    }

    const authAction = event.target.closest("[data-auth-action]");
    if (authAction) {
      const action = authAction.getAttribute("data-auth-action");
      try {
        if (action === "login") {
          await signInWithGoogle();
          closeMobileAuthModal();
          closeSideDrawerMenu();
          emitToast(getLocalizedText("auth.signedInSuccessfully", "Signed in successfully."), "success");
          redirectAfterLoginIfRequested();
        }

        if (action === "logout") {
          await signOutUser();
          closeSideDrawerMenu();
          emitToast(getLocalizedText("auth.loggedOut", "You have been logged out."), "info");
        }
      } catch (error) {
        emitToast(error.message || getLocalizedText("auth.authActionFailed", "We could not complete that sign-in action."), "error");
      }

      return;
    }

    if (!event.target.closest(".auth_shell") && authShell) {
      const button = authShell.querySelector(".auth_button");
      const dropdown = authShell.querySelector(".auth_dropdown");
      if (button && dropdown) {
        button.setAttribute("aria-expanded", "false");
        dropdown.hidden = true;
      }
    }

    if (
      document.body.classList.contains("search_open")
      && !event.target.closest(".navbar_search_shell, .site_search_results_surface, .site_search_toggle_form, .nav_search-btn, [data-close-search]")
    ) {
      closeSearchPanel();
    }

    if (event.target.closest("[data-close-search]")) {
      closeSearchPanel();
    }

    if (event.target.closest("[data-close-mobile-auth]")) {
      closeMobileAuthModal();
    }

    if (event.target.closest("[data-close-cart]")) {
      closeCartDrawer();
    }

    const cartLink = event.target.closest(".cart_link");
    if (cartLink) {
      event.preventDefault();
      window.location.href = getSitePageHref("cart.html");
    }

    const wishlistAction = event.target.closest("[data-wishlist-product-id]");
    if (wishlistAction) {
      event.preventDefault();
      const product = getProductById(wishlistAction.getAttribute("data-wishlist-product-id"));

      if (product) {
        const result = toggleWishlistItem(product);
        updateWishlistButtons(result.wishlist);
        animateWishlistToggle(wishlistAction);
        emitToast(getProductUiText(
          result.added ? "productSavedToFavorites" : "productRemovedFromFavorites",
          result.added ? "{name} added to favorites." : "{name} removed from favorites.",
          { name: product.name }
        ), result.added ? "success" : "info");
      }

      return;
    }

    const saveCartItemAction = event.target.closest("[data-save-cart-item]");
    if (saveCartItemAction) {
      const product = getExactProduct(saveCartItemAction.getAttribute("data-save-cart-item"));
      if (!product) {
        emitToast(getCartUiText("productUnavailable", "This product is no longer available."), "info");
      } else if (isProductWishlisted(product.id)) {
        emitToast(getCartUiText("alreadyInFavorites", "Already in favorites."), "info");
      } else {
        addWishlistItem(product);
        emitToast(getCartUiText("savedToFavorites", "Saved to favorites."), "success");
      }
      return;
    }

    const resultLink = event.target.closest(".site_search_result");
    if (resultLink) {
      closeSearchPanel();
      if (resultLink.tagName !== "A" && !event.target.closest("a")) {
        const targetUrl = resultLink.getAttribute("data-product-url") || "";
        if (targetUrl) {
          window.location.href = targetUrl;
        }
      }
    }

    const removeAction = event.target.closest("[data-remove-cart-item]");
    if (removeAction) {
      if (!isCartReady()) {
        emitToast(getCartUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."), "info");
        return;
      }
      removeCartItem(removeAction.getAttribute("data-remove-cart-item"));
      emitToast(getCartUiText("productRemoved", "Product removed from cart."), "info");
    }

    const increaseAction = event.target.closest("[data-cart-increase]");
    if (increaseAction) {
      if (!isCartReady()) {
        emitToast(getCartUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."), "info");
        return;
      }
      const productId = increaseAction.getAttribute("data-cart-increase");
      const currentItem = getCart().find((item) => item.id === productId);
      const currentValue = currentItem ? Number(currentItem.quantity) || 1 : 1;
      const inventoryStatus = getInventoryStatus(productId);
      const quantityLimitNotice = getQuantityLimitNotice(inventoryStatus, currentValue);
      if (quantityLimitNotice) {
        emitToast(getCartUiText("maxQuantityReached", "You have reached the maximum available quantity."), "error");
        return;
      }
      updateCartItemQuantityWithInventory(productId, currentValue + 1);
    }

    const decreaseAction = event.target.closest("[data-cart-decrease]");
    if (decreaseAction) {
      if (!isCartReady()) {
        emitToast(getCartUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."), "info");
        return;
      }
      const productId = decreaseAction.getAttribute("data-cart-decrease");
      const currentItem = getCart().find((item) => item.id === productId);
      const currentValue = currentItem ? Number(currentItem.quantity) || 1 : 1;
      updateCartItemQuantityWithInventory(productId, currentValue - 1);
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.matches(".form-inline, .navbar_search_shell")) {
      event.preventDefault();
      if (event.target.matches(".navbar_search_shell")) {
        const activeResult = getSearchResultLinks()[Math.max(getActiveSearchResultIndex(), 0)];
        if (activeResult) {
          activeResult.click();
        }
        return;
      }

      openSearchPanel();
    }
  });

  document.addEventListener("click", (event) => {
    const searchToggle = event.target.closest(".nav_search-btn, .site_search_toggle_form a, a[href='#search'], a[href='#site-search']");
    if (!searchToggle) {
      return;
    }

    event.preventDefault();
    if (document.body.classList.contains("search_open")) {
      const input = document.getElementById("siteSearchInput");
      if (input) {
        input.focus({ preventScroll: true });
      }
      return;
    }

    openSearchPanel();
  });

  document.addEventListener("click", (event) => {
    if (event.target.id === "cartClearBtn") {
      if (!isCartReady()) {
        emitToast(getCartUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."), "info");
        return;
      }
      clearCartByUserAction();
      emitToast(getCartUiText("cartCleared", "Cart cleared."), "info");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".language-menu.active").forEach((openMenu) => {
        openMenu.classList.remove("active");
      });
      document.querySelectorAll("[data-language-toggle][aria-expanded='true']").forEach((openToggle) => {
        openToggle.setAttribute("aria-expanded", "false");
      });
      closeSearchPanel();
      closeCartDrawer();
      closeSideDrawerMenu();
      closeCheckoutModal();
      closeMobileAuthModal();
    }
  });

  const nav = document.querySelector(".custom_nav-container");
  const searchShell = ensureNavbarSearchShell(nav);
  const searchInput = searchShell && searchShell.querySelector("#siteSearchInput");
  if (!searchInput) {
    return;
  }

  searchInput.addEventListener("input", (event) => {
    const query = event.target.value || "";
    renderSearchResults(query);
    emitSearchQuery(query);
    scheduleSearchAnalytics(query);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      scheduleSearchAnalytics(searchInput.value || "");
    }

    const links = getSearchResultLinks();
    if (!links.length) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const activeIndex = Math.max(getActiveSearchResultIndex(), 0);
      links[activeIndex].click();
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
      return;
    }

    event.preventDefault();
    const currentIndex = getActiveSearchResultIndex();
    const nextIndex = event.key === "ArrowDown"
      ? (currentIndex + 1 + links.length) % links.length
      : (currentIndex - 1 + links.length) % links.length;

    setActiveSearchResult(nextIndex);
  });

  window.addEventListener("sushi-box:notify", (event) => {
    const detail = event.detail || {};
    showToast(detail.message || "Done.", detail.tone || "info");
  });

  window.addEventListener("sushi-box:open-cart", () => {
    window.location.href = getSitePageHref("cart.html");
  });

  window.addEventListener("sushi-box:wishlist-controls-ready", () => {
    updateWishlistButtons(getWishlist());
  });

  window.addEventListener("sushi-box:offers-ready", updateSideDrawerOfferBadge);
  window.addEventListener("sushi-box:language-change", () => {
    refreshNiceSelectI18n();
    updateWishlistButtons(getWishlist());
    renderCart(getCart(), { ready: isCartReady(), loading: !isCartReady() });
    const authShell = document.querySelector(".auth_shell");
    if (authShell) {
      setAuthDropdownState(authShell, latestAuthUser || getCurrentUser());
    } else {
      updateSideDrawerAccount(latestAuthUser || getCurrentUser());
    }
    const searchInput = document.getElementById("siteSearchInput");
    renderSearchResults(searchInput ? searchInput.value : "");
  });
}

function initAppShell() {
  initI18n();
  cleanPrivateStorage();
  initGlobalAnalyticsMonitoring();
  ensurePrimaryNavI18n();
  annotatePhase2StaticContent();
  ensureHowToOrderNav();
  ensureWishlistNav();
  ensureOrdersNav();
  ensureFeedbackNav();
  const userOption = document.querySelector(".user_option");
  if (!userOption) {
    return;
  }

  removeNavbarWishlistAction();
  ensureSearchButton(userOption);
  ensureLanguageSwitcher(userOption);
  const themeToggle = ensureThemeToggle(userOption);
  const authShell = ensureAuthShell(userOption);
  initThemeToggle(themeToggle);
  window.SushiBoxPlaceNavbarControls = placeNavbarControls;
  placeNavbarControls();
  window.addEventListener("resize", placeNavbarControls);
  initSideDrawerMenu();
  ensureSearchPanel();
  ensureMobileAuthModal();
  initBackToTopButton();
  bindGlobalEvents(authShell);
  renderSearchResults("");
  trackInitialUrlSearchAnalytics();

  import("./firebase-reviews.js?v=20260618b")
    .then(({ subscribeToReviewSummaries }) => {
      subscribeToReviewSummaries((summaries) => {
        latestReviewSummaries = summaries || {};
        primeRatingsCache(latestReviewSummaries);
        const searchInput = document.getElementById("siteSearchInput");
        renderSearchResults(searchInput ? searchInput.value : "");
      }, (error) => {
        console.error("Search review summary listener failed.", error);
      });
    })
    .catch((error) => {
      console.error("Search review summaries could not be loaded.", error);
    });

  subscribeToAuthState((user) => {
    setAuthDropdownState(authShell, user);

    if (!authPromptHandled && shouldOpenLoginFromQuery()) {
      authPromptHandled = true;

      if (user && redirectAfterLoginIfRequested()) {
        return;
      }

      if (!user) {
        window.setTimeout(() => openAuthPrompt(authShell), 80);
      }
    }
  });

  subscribeToCart((cart, detail) => {
    renderCart(cart, detail);
  });

  subscribeToInventory(() => {
    renderCart(getCart(), { ready: isCartReady(), loading: !isCartReady() });
  }, (error) => {
    console.error("App shell inventory listener failed.", error);
  });

  subscribeToProductOffers(() => {
    renderCart(getCart(), { ready: isCartReady(), loading: !isCartReady() });
  }, (error) => {
    console.error("App shell offers listener failed.", error);
  });

  subscribeToWishlist((wishlist) => {
    updateWishlistButtons(wishlist);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAppShell, { once: true });
} else {
  initAppShell();
}

