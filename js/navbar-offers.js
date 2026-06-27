import { getActiveOffers, subscribeToProductOffers } from "./offers-data.js?v=20260620a";
import { applyTranslations, t } from "./i18n/i18n.js";

function createElementFromHTML(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup.trim();
  return template.content.firstElementChild;
}

function getSitePageHref(pageName) {
  return window.location.pathname.startsWith("/products/") ? `/${pageName}` : pageName;
}

function isOffersPage() {
  return (window.location.pathname.split("/").pop() || "index.html") === "offers.html";
}

function updateOffersButtonState(offersButton) {
  if (!offersButton) {
    return;
  }

  const offerCount = getActiveOffers().length;
  let badge = offersButton.querySelector(".offers_nav_badge");

  offersButton.setAttribute("aria-label", offerCount === 0
    ? "View current offers"
    : offerCount === 1
      ? "View 1 current offer"
      : `View ${offerCount} current offers`);

  if (isOffersPage()) {
    offersButton.setAttribute("aria-current", "page");
    offersButton.classList.add("is_active");
  } else {
    offersButton.removeAttribute("aria-current");
    offersButton.classList.remove("is_active");
  }

  if (!badge) {
    badge = createElementFromHTML('<span class="offers_nav_badge">0</span>');
    offersButton.appendChild(badge);
  }

  badge.textContent = String(offerCount);
  badge.hidden = offerCount === 0;
}

function getOffersButton() {
  let offersButton = document.querySelector(".offers_nav_btn");
  if (!offersButton) {
    offersButton = createElementFromHTML(`
      <a class="offers_nav_btn" href="${getSitePageHref("offers.html")}">
        <i class="fa fa-tags" aria-hidden="true"></i>
        <span class="offers_nav_label" data-i18n="nav.offers">${t("nav.offers", "Offers")}</span>
        <span class="offers_nav_badge">0</span>
      </a>
    `);
  }

  offersButton.setAttribute("href", getSitePageHref("offers.html"));
  updateOffersButtonState(offersButton);
  applyTranslations(offersButton);
  return offersButton;
}

function placeOffersButton() {
  const offersButton = getOffersButton();
  const nav = document.querySelector(".custom_nav-container");
  const userOption = document.querySelector(".user_option");
  const toggler = document.querySelector(".custom_nav-container .navbar-toggler");
  const mobileRight = document.querySelector(".custom_nav-container .mobile-navbar-right");
  const mobileSearch = mobileRight && mobileRight.querySelector(".form-inline");
  const isMobile = window.matchMedia && window.matchMedia("(max-width: 991px)").matches;

  if (!offersButton) {
    return;
  }

  if (typeof window.SushiBoxPlaceNavbarControls === "function") {
    window.SushiBoxPlaceNavbarControls();
    return;
  }

  if (isMobile && mobileRight) {
    mobileRight.insertBefore(offersButton, mobileSearch || mobileRight.firstChild);
    return;
  }

  if (isMobile && nav) {
    nav.insertBefore(offersButton, toggler || null);
    return;
  }

  if (userOption) {
    const cartLink = userOption.querySelector(".cart_link");
    userOption.insertBefore(offersButton, cartLink || null);
  }
}

function closeMobileMenu() {
  const collapse = document.querySelector(".custom_nav-container .navbar-collapse");
  const toggler = document.querySelector(".custom_nav-container .navbar-toggler");

  if (!collapse || !collapse.classList.contains("show")) {
    return;
  }

  if (window.jQuery && typeof window.jQuery.fn.collapse === "function") {
    window.jQuery(collapse).collapse("hide");
  } else {
    collapse.classList.remove("show");
    if (toggler) {
      toggler.setAttribute("aria-expanded", "false");
    }
  }

  document.body.classList.remove("mobile_menu_open");
}

function bindOffersEvents() {
  document.addEventListener("click", (event) => {
    const offersButton = event.target.closest(".offers_nav_btn");
    if (offersButton) {
      closeMobileMenu();
    }
  });
}

function initNavbarOffers() {
  placeOffersButton();
  subscribeToProductOffers(() => placeOffersButton());
  bindOffersEvents();
  window.addEventListener("resize", placeOffersButton);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavbarOffers, { once: true });
} else {
  initNavbarOffers();
}
