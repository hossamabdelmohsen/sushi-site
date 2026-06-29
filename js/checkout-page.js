import {
  getCart,
  isCartReady,
  logCartDebug,
  removeCartItem,
  subscribeToCart,
  whenCartReady
} from "./cart-store.js?v=20260615a";
import {
  getInventoryStatus,
  subscribeToInventory,
  updateCartItemQuantityWithInventory,
  validateCartInventory
} from "./inventory-store.js?v=20260619a";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase-config.js?v=20260502b";
import { getCurrentUser } from "./firebase-auth.js?v=20260504i";
import {
  buildProductUrl,
  buildResponsiveImageMarkup,
  formatPrice,
  getProductById
} from "./product-catalog.js?v=20260602c";
import {
  trackAddPaymentInfo,
  trackAddShippingInfo,
  trackBeginCheckout
} from "./analytics-events.js?v=20260602c";
import { getGuestSessionId } from "./scoped-storage.js";
import { emitToast, escapeHtml } from "./ui-utils.js?v=20260502b";
import { getCartOfferSubtotal, getProductOfferPricing, subscribeToProductOffers } from "./offers-data.js?v=20260620a";
import { t } from "./i18n/i18n.js";
import { getProductDisplayData } from "./i18n/product-display.js?v=20260629titlebidi";

const CHECKOUT_CUSTOMER_STORAGE_KEY = "sushi-box-checkout-customer";
const FALLBACK_IMAGE = "images/optimized/Logo.webp";
const CHECKOUT_DELIVERY_SCHEDULE = "Wednesday, Thursday, Friday";
const FALLBACK_SHIPPING_RATES = {
  "el-mahalla": { cityId: "el-mahalla", cityName: "El Mahalla El Kubra", amount: 50, amountCents: 5000 },
  "tanta": { cityId: "tanta", cityName: "Tanta", amount: 150, amountCents: 15000 },
  "kafr-el-sheikh": { cityId: "kafr-el-sheikh", cityName: "Kafr El Sheikh", amount: 150, amountCents: 15000 },
  "mansoura": { cityId: "mansoura", cityName: "Mansoura", amount: 150, amountCents: 15000 }
};
let paymentSubmitting = false;
let reviewRenderFrame = 0;
let checkoutDom = null;
let checkoutSettings = { shippingRates: FALLBACK_SHIPPING_RATES };
let checkoutSettingsReady = false;
let appliedCoupon = null;
let couponDiscountCents = 0;
let couponValidationRequestId = 0;

function getCheckoutUiText(key, fallback = "", values = {}) {
  return t(`checkoutUi.${key}`, fallback, values);
}

function getCheckoutUiCountText(key, count, fallbackSingular, fallbackPlural) {
  const isSingle = count === 1;
  return getCheckoutUiText(isSingle ? key : `${key}_plural`, isSingle ? fallbackSingular : fallbackPlural, { count });
}

function getInitialCheckoutStep() {
  let storedStep = "";
  try {
    storedStep = window.sessionStorage.getItem("checkoutStartStep") || "";
    window.sessionStorage.removeItem("checkoutStartStep");
  } catch (error) {}

  const requestedStep = new URLSearchParams(window.location.search).get("step");
  const shouldStartAtDelivery = requestedStep === "delivery" || storedStep === "delivery";
  return shouldStartAtDelivery ? 2 : 1;
}

function getExactProduct(productId) {
  const product = getProductById(productId);
  return product && product.id === productId ? product : null;
}

function getQuantityLimitNotice(inventoryStatus, quantity) {
  if (!inventoryStatus.tracked || quantity < inventoryStatus.available) {
    return "";
  }

  if (inventoryStatus.available <= 0) {
    return getCheckoutUiText("outOfStock", "Out of stock.");
  }

  return getCheckoutUiCountText(
    "onlyItemsAvailable",
    inventoryStatus.available,
    `Only ${inventoryStatus.available} item available.`,
    `Only ${inventoryStatus.available} items available.`
  );
}

function getCheckoutStockStatusText(inventoryStatus) {
  if (!inventoryStatus || !inventoryStatus.message) {
    return "";
  }

  if (inventoryStatus.isOutOfStock) {
    return getCheckoutUiText("outOfStockShort", "Out of stock");
  }

  if (inventoryStatus.isLowStock && Number.isFinite(inventoryStatus.available)) {
    return getCheckoutUiText("sorryOnlyLeft", "Sorry, only {count} left in stock.", {
      count: inventoryStatus.available
    });
  }

  return inventoryStatus.message;
}

const deliveryCities = [
  { id: "kafr-el-sheikh", name: "Kafr El Sheikh", schedule: CHECKOUT_DELIVERY_SCHEDULE },
  { id: "mansoura", name: "Mansoura", schedule: CHECKOUT_DELIVERY_SCHEDULE },
  { id: "tanta", name: "Tanta", schedule: CHECKOUT_DELIVERY_SCHEDULE },
  { id: "el-mahalla", name: "El Mahalla El Kubra", schedule: CHECKOUT_DELIVERY_SCHEDULE }
];

function getCheckoutDom() {
  if (checkoutDom) {
    return checkoutDom;
  }

  checkoutDom = {
    form: document.getElementById("checkoutPageForm"),
    cartItems: document.getElementById("checkoutCartItems"),
    emptyState: document.getElementById("checkoutEmptyState"),
    checkoutFlow: document.getElementById("checkoutFlow"),
    loadingState: document.getElementById("checkoutLoadingState"),
    selectedCityName: document.getElementById("checkoutSelectedCityName"),
    reviewCity: document.getElementById("checkoutReviewCity"),
    reviewCustomer: document.getElementById("checkoutReviewCustomer"),
    reviewAddress: document.getElementById("checkoutReviewAddress"),
    validationMessage: document.getElementById("checkoutValidationMessage"),
    subtotalEls: Array.from(document.querySelectorAll("[data-checkout-subtotal]")),
    shippingEls: Array.from(document.querySelectorAll("[data-checkout-shipping]")),
    beforeDiscountEls: Array.from(document.querySelectorAll("[data-checkout-before-discount]")),
    discountEls: Array.from(document.querySelectorAll("[data-checkout-discount]")),
    discountRows: Array.from(document.querySelectorAll("[data-checkout-discount-row]")),
    finalTotalEls: Array.from(document.querySelectorAll("[data-checkout-final-total]")),
    couponInput: document.getElementById("checkoutCouponCode"),
    couponApplyButton: document.getElementById("checkoutApplyCouponBtn"),
    couponRemoveButton: document.getElementById("checkoutRemoveCouponBtn"),
    couponMessage: document.getElementById("checkoutCouponMessage"),
    steps: Array.from(document.querySelectorAll("[data-checkout-step]")),
    panels: Array.from(document.querySelectorAll("[data-checkout-panel]")),
    cityInputs: Array.from(document.querySelectorAll('input[name="checkoutCity"]')),
    cityCards: Array.from(document.querySelectorAll(".checkout_city_card")),
    addressFields: Array.from(document.querySelectorAll(".checkout_address_fields input, .checkout_address_fields textarea"))
  };

  return checkoutDom;
}

function moneyToCents(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : 0;
}

function centsToAmount(cents) {
  return Math.round(Number(cents) || 0) / 100;
}

function normalizeCouponCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function getShippingRate(cityId) {
  return checkoutSettings.shippingRates?.[cityId] || FALLBACK_SHIPPING_RATES[cityId] || null;
}

function getSelectedShippingCents() {
  const city = getSelectedCity();
  return city ? Number(getShippingRate(city.id)?.amountCents) || 0 : 0;
}

function getEffectiveCartSubtotal() {
  return getCartOfferSubtotal(getCart());
}

function getCheckoutTotals() {
  try {
    const subtotalCents = moneyToCents(getEffectiveCartSubtotal());
    const shippingCents = getSelectedShippingCents();
    const discountCents = appliedCoupon ? Math.min(subtotalCents + shippingCents, couponDiscountCents) : 0;
    const beforeDiscountCents = subtotalCents + shippingCents;
    const totalCents = Math.max(0, beforeDiscountCents - discountCents);
    return { subtotalCents, shippingCents, beforeDiscountCents, discountCents, totalCents };
  } catch (error) {
    console.error("Checkout total calculation failed.", {
      error,
      cartReady: isCartReady(),
      checkoutSettingsReady,
      selectedCity: getSelectedCity()?.id || ""
    });
    return { subtotalCents: 0, shippingCents: 0, beforeDiscountCents: 0, discountCents: 0, totalCents: 0 };
  }
}

function renderCheckoutTotals() {
  const { subtotalEls, shippingEls, beforeDiscountEls, discountEls, discountRows, finalTotalEls } = getCheckoutDom();
  const selectedCity = getSelectedCity();

  if (!isCartReady() || !checkoutSettingsReady) {
    subtotalEls.forEach((el) => {
      el.textContent = getCheckoutUiText("loading", "Loading...");
    });
    shippingEls.forEach((el) => {
      el.textContent = selectedCity ? getCheckoutUiText("loading", "Loading...") : getCheckoutUiText("selectCity", "Select city");
    });
    beforeDiscountEls.forEach((el) => {
      el.textContent = getCheckoutUiText("loading", "Loading...");
    });
    discountEls.forEach((el) => {
      el.textContent = `-${formatPrice(0)}`;
    });
    discountRows.forEach((row) => {
      row.hidden = true;
    });
    finalTotalEls.forEach((el) => {
      el.textContent = getCheckoutUiText("loading", "Loading...");
    });
    return;
  }

  const { subtotalCents, shippingCents, beforeDiscountCents, discountCents, totalCents } = getCheckoutTotals();

  subtotalEls.forEach((el) => {
    el.textContent = formatPrice(centsToAmount(subtotalCents));
  });

  shippingEls.forEach((el) => {
    el.textContent = selectedCity ? formatPrice(centsToAmount(shippingCents)) : getCheckoutUiText("selectCity", "Select city");
  });

  beforeDiscountEls.forEach((el) => {
    el.textContent = selectedCity ? formatPrice(centsToAmount(beforeDiscountCents)) : getCheckoutUiText("selectCity", "Select city");
  });

  discountEls.forEach((el) => {
    el.textContent = `-${formatPrice(centsToAmount(discountCents))}`;
  });

  discountRows.forEach((row) => {
    row.hidden = discountCents <= 0;
  });

  finalTotalEls.forEach((el) => {
    el.textContent = formatPrice(centsToAmount(totalCents));
  });
}

function setCouponMessage(message, type = "info") {
  const messageEl = getCheckoutDom().couponMessage;
  if (!messageEl) {
    return;
  }

  messageEl.textContent = message || "";
  messageEl.hidden = !message;
  messageEl.dataset.state = type;
}

function setAppliedCoupon(coupon, discountCents) {
  const { couponInput, couponRemoveButton } = getCheckoutDom();
  appliedCoupon = coupon || null;
  couponDiscountCents = coupon ? Math.max(0, Number(discountCents) || 0) : 0;

  if (couponInput && coupon) {
    couponInput.value = coupon.code;
  }

  if (couponRemoveButton) {
    couponRemoveButton.hidden = !coupon;
  }

  renderCheckoutTotals();
}

async function loadCheckoutSettings() {
  try {
    const response = await fetch("/api/public-actions?action=checkoutSettings", { cache: "no-store" });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || "Checkout settings could not be loaded.");
    }
    checkoutSettings = {
      shippingRates: {
        ...FALLBACK_SHIPPING_RATES,
        ...(body.shippingRates || {})
      }
    };
    checkoutSettingsReady = true;
  } catch (error) {
    console.error("Checkout settings load failed.", error);
    checkoutSettings = { shippingRates: FALLBACK_SHIPPING_RATES };
    checkoutSettingsReady = true;
  }

  document.querySelectorAll("[data-city-shipping]").forEach((el) => {
    const rate = getShippingRate(el.getAttribute("data-city-shipping"));
    el.textContent = rate ? formatPrice(rate.amount) : getCheckoutUiText("unavailable", "Unavailable");
  });
  renderCheckoutTotals();
}

async function validateCoupon(code, options = {}) {
  const cleanCode = normalizeCouponCode(code);
  const city = getSelectedCity();

  if (!cleanCode) {
    setAppliedCoupon(null, 0);
    setCouponMessage("");
    return;
  }

  if (!city) {
    setAppliedCoupon(null, 0);
    setCouponMessage(getCheckoutUiText("selectCityBeforeCoupon", "Choose your delivery city before applying a promo code."), "error");
    return;
  }

  if (!isCartReady() || !checkoutSettingsReady) {
    setAppliedCoupon(null, 0);
    setCouponMessage(getCheckoutUiText("checkoutTotalsLoading", "Checkout totals are still loading. Please try again in a moment."), "info");
    renderCheckoutTotals();
    return;
  }

  const requestId = ++couponValidationRequestId;
  const requestCityId = city.id;
  const requestSubtotal = getEffectiveCartSubtotal();
  if (!options.silent) {
    setCouponMessage(getCheckoutUiText("checkingPromoCode", "Checking promo code..."), "info");
  }

  try {
    const response = await fetch("/api/public-actions?action=validateCoupon", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: cleanCode,
        cityId: requestCityId,
        subtotal: requestSubtotal
      })
    });
    const body = await response.json().catch(() => ({}));
    if (
      requestId !== couponValidationRequestId ||
      getSelectedCity()?.id !== requestCityId ||
      moneyToCents(getEffectiveCartSubtotal()) !== moneyToCents(requestSubtotal)
    ) {
      return;
    }
    if (!response.ok || !body.valid) {
      setAppliedCoupon(null, 0);
      setCouponMessage(body.error || getCheckoutUiText("invalidCoupon", "Invalid coupon"), "error");
      return;
    }

    setAppliedCoupon(body.coupon, body.discountCents);
    setCouponMessage(body.message || getCheckoutUiText("couponApplied", "Coupon applied"), "success");
  } catch (error) {
    if (requestId !== couponValidationRequestId) {
      return;
    }
    setAppliedCoupon(null, 0);
    setCouponMessage(error.message || getCheckoutUiText("promoCodeCheckFailed", "Promo code could not be checked."), "error");
  }
}

function refreshCouponAndTotals() {
  if (!isCartReady() || !checkoutSettingsReady) {
    renderCheckoutTotals();
    return;
  }

  if (appliedCoupon?.code) {
    validateCoupon(appliedCoupon.code, { silent: true });
    return;
  }

  renderCheckoutTotals();
}

function getSelectedCity() {
  const selectedInput = getCheckoutDom().cityInputs.find((input) => input.checked);
  return selectedInput ? deliveryCities.find((city) => city.id === selectedInput.value) || null : null;
}

function getAddressValues() {
  return {
    name: (document.getElementById("checkoutCustomerName")?.value || "").trim(),
    phone: (document.getElementById("checkoutCustomerPhone")?.value || "").trim(),
    email: (document.getElementById("checkoutCustomerEmail")?.value || "").trim(),
    area: (document.getElementById("checkoutCustomerArea")?.value || "").trim(),
    fullAddress: (document.getElementById("checkoutCustomerAddress")?.value || "").trim(),
    building: (document.getElementById("checkoutCustomerBuilding")?.value || "").trim(),
    floorApartment: (document.getElementById("checkoutCustomerFloorApartment")?.value || "").trim(),
    notes: (document.getElementById("checkoutCustomerNotes")?.value || "").trim()
  };
}

function getSavedCustomerInfo() {
  try {
    window.localStorage.removeItem(CHECKOUT_CUSTOMER_STORAGE_KEY);
    window.localStorage.removeItem("sushi-box-pending-order");
  } catch (error) {}

  return null;
}

function setFieldValue(fieldId, value) {
  const field = document.getElementById(fieldId);
  if (field && value) {
    field.value = value;
  }
}

function updateSavedAddressControls() {
  const savedInfo = getSavedCustomerInfo();
  const clearButton = document.getElementById("clearSavedAddressBtn");
  const savedNotice = document.getElementById("savedAddressNotice");

  if (clearButton) {
    clearButton.hidden = !savedInfo;
  }

  if (savedNotice) {
    savedNotice.hidden = !savedInfo;
  }
}

function hydrateSavedCustomerInfo() {
  const savedInfo = getSavedCustomerInfo();
  if (!savedInfo) {
    updateSavedAddressControls();
    return;
  }

  const savedCity = deliveryCities.find((city) => city.id === savedInfo.cityId);
  if (savedCity) {
    const cityInput = document.querySelector(`input[name="checkoutCity"][value="${savedCity.id}"]`);
    if (cityInput) {
      cityInput.checked = true;
    }
  }

  setFieldValue("checkoutCustomerName", savedInfo.name);
  setFieldValue("checkoutCustomerPhone", savedInfo.phone);
  setFieldValue("checkoutCustomerEmail", savedInfo.email);
  setFieldValue("checkoutCustomerArea", savedInfo.area);
  setFieldValue("checkoutCustomerAddress", savedInfo.fullAddress);
  setFieldValue("checkoutCustomerBuilding", savedInfo.building);
  setFieldValue("checkoutCustomerFloorApartment", savedInfo.floorApartment);
  setFieldValue("checkoutCustomerNotes", savedInfo.notes);

  updateSavedAddressControls();
}

function saveCustomerInfo(city) {
  const values = getAddressValues();
  const customerInfo = {
    ...values,
    cityId: city.id,
    cityName: city.name,
    updatedAt: new Date().toISOString()
  };

  updateSavedAddressControls();
  return customerInfo;
}

function clearSavedCustomerInfo() {
  try {
    window.localStorage.removeItem(CHECKOUT_CUSTOMER_STORAGE_KEY);
  } catch (error) {}

  updateSavedAddressControls();
  emitToast(getCheckoutUiText("savedAddressCleared", "Saved address cleared."), "info");
}

function setValidationMessage(message) {
  const messageEl = getCheckoutDom().validationMessage;
  if (!messageEl) {
    return;
  }

  messageEl.textContent = message || "";
  messageEl.hidden = !message;
}

function updatePaymentSubmitLabel() {
  const submitButton = getCheckoutDom().form?.querySelector(".checkout_confirm_btn");
  if (submitButton) {
    submitButton.textContent = paymentSubmitting
      ? getCheckoutUiText("processingPayment", "Processing payment")
      : getCheckoutUiText("payNow", "Pay Now");
  }
}

function setPaymentSubmitting(isSubmitting) {
  paymentSubmitting = Boolean(isSubmitting);
  const form = getCheckoutDom().form;
  const submitButton = form?.querySelector(".checkout_confirm_btn");

  if (form) {
    form.setAttribute("aria-busy", String(paymentSubmitting));
    form.querySelectorAll("button, input, textarea").forEach((control) => {
      control.disabled = paymentSubmitting;
    });
  }

  if (submitButton) {
    updatePaymentSubmitLabel();
    submitButton.classList.toggle("is_loading", paymentSubmitting);
  }
}

function setStep(nextStep) {
  const step = Math.max(1, Math.min(4, Number(nextStep) || 1));

  getCheckoutDom().steps.forEach((stepEl) => {
    const stepNumber = Number(stepEl.getAttribute("data-checkout-step"));
    stepEl.classList.toggle("is_active", stepNumber === step);
    stepEl.classList.toggle("is_complete", stepNumber < step);
    stepEl.setAttribute("aria-current", stepNumber === step ? "step" : "false");
  });

  getCheckoutDom().panels.forEach((panel) => {
    panel.hidden = Number(panel.getAttribute("data-checkout-panel")) !== step;
  });

  document.body.dataset.checkoutStep = String(step);
  setValidationMessage("");
  scheduleRenderReview();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateStep(step) {
  if (!isCartReady()) {
    return { valid: false, message: getCheckoutUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment.") };
  }

  if (!getCart().length) {
    return { valid: false, message: getCheckoutUiText("cartEmptyBeforeCheckout", "Your cart is empty. Please add products before checkout.") };
  }

  if (step === 2 && !getSelectedCity()) {
    return { valid: false, message: getCheckoutUiText("pleaseSelectDeliveryCity", "Please select a delivery city.") };
  }

  if (step === 3) {
    const values = getAddressValues();
    const requiredFields = [
      ["name", getCheckoutUiText("pleaseEnterName", "Please enter your name."), "checkoutCustomerName"],
      ["phone", getCheckoutUiText("pleaseEnterPhoneNumber", "Please enter your phone number."), "checkoutCustomerPhone"],
      ["area", getCheckoutUiText("pleaseEnterArea", "Please enter your area."), "checkoutCustomerArea"],
      ["fullAddress", getCheckoutUiText("pleaseEnterAddress", "Please enter your address."), "checkoutCustomerAddress"],
      ["building", getCheckoutUiText("pleaseEnterBuildingNumber", "Please enter your building number."), "checkoutCustomerBuilding"],
      ["floorApartment", getCheckoutUiText("pleaseEnterFloorApartment", "Please enter your floor / apartment."), "checkoutCustomerFloorApartment"]
    ];
    const missing = requiredFields.find(([key]) => !values[key]);

    if (missing) {
      return { valid: false, message: missing[1], fieldId: missing[2] };
    }

    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      return { valid: false, message: getCheckoutUiText("pleaseEnterValidEmail", "Please enter a valid email address, or leave it empty."), fieldId: "checkoutCustomerEmail" };
    }
  }

  return { valid: true };
}

function renderCartItems(cart, detail = {}) {
  const { cartItems: list, emptyState, checkoutFlow, loadingState } = getCheckoutDom();
  const isReady = detail.ready !== false && !detail.loading;

  logCartDebug("checkout-page reads cart", {
    storageKey: detail.storageKey,
    storageScope: detail.storageScope,
    ready: detail.ready,
    productCount: cart.length
  });

  if (loadingState) {
    loadingState.hidden = isReady;
  }

  if (!isReady) {
    if (emptyState) {
      emptyState.hidden = true;
    }
    if (checkoutFlow) {
      checkoutFlow.hidden = true;
    }
    return;
  }

  refreshCouponAndTotals();

  if (!list || !emptyState || !checkoutFlow) {
    return;
  }

  emptyState.hidden = cart.length > 0;
  checkoutFlow.hidden = cart.length === 0;

  if (!cart.length) {
    list.innerHTML = "";
    return;
  }

  list.innerHTML = cart.map((item) => {
    const quantity = Number(item.quantity) || 1;
    const image = item.image || FALLBACK_IMAGE;
    const product = getExactProduct(item.id);
    const displayProduct = getProductDisplayData(product || item);
    const pricing = getProductOfferPricing(product || { id: item.id, price: item.price });
    const price = pricing.finalPrice;
    const lineTotal = price * quantity;
    const inventoryStatus = getInventoryStatus(item.id);
    const quantityLimitNotice = getQuantityLimitNotice(inventoryStatus, quantity);
    const stockStatusText = getCheckoutStockStatusText(inventoryStatus);
    const viewProductLabel = getCheckoutUiText("viewProduct", "View {name}", { name: displayProduct.name || item.name });

    return `
      <article class="checkout_cart_item" data-cart-product-id="${escapeHtml(item.id)}">
        <a class="checkout_cart_item_image" href="${escapeHtml(buildProductUrl(item.id))}" aria-label="${escapeHtml(viewProductLabel)}">
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
        <div class="checkout_cart_item_body">
          <div class="checkout_cart_item_head">
            <div>
              <a href="${escapeHtml(buildProductUrl(item.id))}">${escapeHtml(displayProduct.name || item.name)}</a>
              <span class="product_stock_status${inventoryStatus.isOutOfStock ? " is_out" : ""}${inventoryStatus.isLowStock ? " is_low" : ""}" ${stockStatusText ? "" : "hidden"}>${escapeHtml(stockStatusText)}</span>
            </div>
            <button class="checkout_item_remove" type="button" data-checkout-remove="${escapeHtml(item.id)}">
              <i class="fa fa-trash" aria-hidden="true"></i>
              <span>${escapeHtml(getCheckoutUiText("remove", "Remove"))}</span>
            </button>
          </div>
          <div class="checkout_cart_item_meta">
            <span>${pricing.offer ? `<del>${escapeHtml(formatPrice(pricing.originalPrice))}</del> ` : ""}${escapeHtml(formatPrice(price))}</span>
            <strong>${escapeHtml(getCheckoutUiText("itemTotal", "Item total"))}: ${escapeHtml(formatPrice(lineTotal))}</strong>
          </div>
          <div class="checkout_item_qty_stack">
            <div class="checkout_item_qty" aria-label="${escapeHtml(getCheckoutUiText("quantityControlsFor", "Quantity controls for {name}", { name: displayProduct.name || item.name }))}">
              <button type="button" data-checkout-decrease="${escapeHtml(item.id)}" aria-label="${escapeHtml(getCheckoutUiText("decreaseQuantity", "Decrease quantity"))}">-</button>
              <span>${quantity}</span>
              <button type="button" data-checkout-increase="${escapeHtml(item.id)}" aria-label="${escapeHtml(getCheckoutUiText("increaseQuantity", "Increase quantity"))}" ${inventoryStatus.tracked && quantity >= inventoryStatus.available ? "disabled" : ""}>+</button>
            </div>
            ${quantityLimitNotice ? `<span class="cart_quantity_limit_notice">${escapeHtml(quantityLimitNotice)}</span>` : ""}
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

function syncCityCards() {
  const selectedCity = getSelectedCity();
  const { selectedCityName, cityCards } = getCheckoutDom();

  cityCards.forEach((card) => {
    const input = card.querySelector("input");
    card.classList.toggle("is_selected", Boolean(input && input.checked));
  });

  if (selectedCityName) {
    const rate = selectedCity ? getShippingRate(selectedCity.id) : null;
    selectedCityName.textContent = selectedCity && rate
      ? getCheckoutUiText("selectedCityWithShipping", "{city} - {price} delivery fee", {
        city: selectedCity.name,
        price: formatPrice(rate.amount)
      })
      : selectedCity ? selectedCity.name : getCheckoutUiText("chooseCityFirst", "Choose a city first");
  }

  refreshCouponAndTotals();
  scheduleRenderReview();
}

function renderReview() {
  const city = getSelectedCity();
  const values = getAddressValues();
  const { reviewCity: cityEl, reviewCustomer: customerEl, reviewAddress: addressEl } = getCheckoutDom();

  if (cityEl) {
    cityEl.textContent = city ? city.name : getCheckoutUiText("cityNotSelected", "City not selected");
  }

  if (customerEl) {
    customerEl.textContent = [values.name, values.phone].filter(Boolean).join(" - ") || getCheckoutUiText("customerDetailsNotEntered", "Customer details not entered");
  }

  if (addressEl) {
    const addressParts = [
      values.area,
      values.fullAddress,
      values.building ? getCheckoutUiText("buildingSummary", "Building {value}", { value: values.building }) : "",
      values.floorApartment ? getCheckoutUiText("floorApartmentSummary", "Floor / Apt {value}", { value: values.floorApartment }) : "",
      values.notes
    ].filter(Boolean);
    addressEl.textContent = addressParts.join(", ") || getCheckoutUiText("addressDetailsNotEntered", "Address details not entered");
  }
}

function scheduleRenderReview() {
  if (reviewRenderFrame) {
    window.cancelAnimationFrame(reviewRenderFrame);
  }

  reviewRenderFrame = window.requestAnimationFrame(() => {
    reviewRenderFrame = 0;
    renderReview();
  });
}

function goToNextStep() {
  if (paymentSubmitting) {
    return;
  }

  const currentStep = Number(document.body.dataset.checkoutStep || 1);
  const validation = validateStep(currentStep);

  if (!validation.valid) {
    setValidationMessage(validation.message);
    if (validation.fieldId) {
      document.getElementById(validation.fieldId)?.focus();
    }
    return;
  }

  // GA4 checkout funnel milestones fire only after each step validates.
  if (currentStep === 2) {
    trackAddShippingInfo(getCart(), getSelectedCity()?.name || "");
  }

  if (currentStep === 3) {
    trackAddPaymentInfo(getCart(), getSelectedPaymentMethod());
  }

  setStep(currentStep + 1);
}

function goToPreviousStep() {
  if (paymentSubmitting) {
    return;
  }

  const currentStep = Number(document.body.dataset.checkoutStep || 1);
  if (currentStep <= 2 && document.body.dataset.checkoutStartedFromCart === "true") {
    window.location.href = "cart.html";
    return;
  }

  setStep(currentStep - 1);
}

function waitForCheckoutAuthState() {
  const currentUser = auth.currentUser || getCurrentUser();
  if (currentUser) {
    return Promise.resolve(currentUser);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user || null);
    }, () => {
      unsubscribe();
      resolve(null);
    });
  });
}

async function getCheckoutIdentity() {
  const user = await waitForCheckoutAuthState();
  if (user && !user.isAnonymous) {
    return {
      uid: user.uid,
      idToken: await user.getIdToken()
    };
  }

  const guestId = getGuestSessionId();
  return {
    guestId,
    sessionId: guestId
  };
}

function getSelectedPaymentMethod() {
  return document.querySelector('input[name="checkoutPaymentMethod"]:checked')?.value || "paymob-checkout";
}

async function buildPaymentPayload(city) {
  await whenCartReady();
  const values = getAddressValues();

  return {
    customer: {
      ...values,
      cityId: city.id,
      cityName: city.name
    },
    identity: await getCheckoutIdentity(),
    paymentMethod: getSelectedPaymentMethod(),
    couponCode: appliedCoupon?.code || "",
    items: getCart().map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1)
    }))
  };
}

async function createPaymentSession(payload) {
  const response = await fetch("/api/create-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Create payment failed.", responseBody);
    const paymobReason = responseBody.details?.paymobRejectionReason
      || responseBody.paymobResponse?.detail
      || responseBody.paymobResponse?.message
      || "";
    const rootCause = responseBody.rootCause ? ` (${responseBody.rootCause})` : "";
    throw new Error(`${paymobReason || responseBody.error || getCheckoutUiText("unableToStartPayment", "Unable to start payment. Please try again.")}${rootCause}`);
  }

  if (!responseBody.checkoutUrl) {
    throw new Error(getCheckoutUiText("paymentMissingCheckoutUrl", "Payment could not start because Paymob did not return a checkout URL."));
  }

  return responseBody;
}

async function submitOrder() {
  if (paymentSubmitting) {
    return;
  }

  if (!isCartReady()) {
    setValidationMessage(getCheckoutUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."));
    await whenCartReady();
  }

  const stepValidation = validateStep(3);
  const city = getSelectedCity();

  if (!stepValidation.valid || !city || !getCart().length) {
    setValidationMessage(stepValidation.message || getCheckoutUiText("pleaseCompleteCheckoutDetails", "Please complete your checkout details."));
    return;
  }

  setValidationMessage("");
  setPaymentSubmitting(true);
  trackAddPaymentInfo(getCart(), getSelectedPaymentMethod());

  try {
    const inventoryValidation = await validateCartInventory(getCart());
    if (!inventoryValidation.valid) {
      throw new Error(inventoryValidation.message || getCheckoutUiText("someCartItemsUnavailable", "Some cart items are no longer available."));
    }
    saveCustomerInfo(city);
    const paymentSession = await createPaymentSession(await buildPaymentPayload(city));
    window.location.href = paymentSession.checkoutUrl;
  } catch (error) {
    setPaymentSubmitting(false);
    const message = error.message || getCheckoutUiText("unableToStartPayment", "Unable to start payment. Please try again.");
    setValidationMessage(message);
    emitToast(message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const initialCheckoutStep = getInitialCheckoutStep();
  document.body.dataset.checkoutStep = String(initialCheckoutStep);
  document.body.dataset.checkoutStartedFromCart = String(initialCheckoutStep === 2);
  let hasTrackedBeginCheckout = false;

  subscribeToCart((cart, detail) => {
    renderCartItems(Array.isArray(cart) ? cart : [], detail);
    scheduleRenderReview();
    if (!hasTrackedBeginCheckout && detail.ready !== false && !detail.loading && Array.isArray(cart) && cart.length) {
      hasTrackedBeginCheckout = true;
      trackBeginCheckout(cart);
    }
  });

  subscribeToInventory(() => {
    renderCartItems(getCart(), { ready: isCartReady(), loading: !isCartReady() });
  }, (error) => {
    console.error("Checkout inventory listener failed.", error);
  });

  subscribeToProductOffers(() => {
    renderCartItems(getCart(), { ready: isCartReady(), loading: !isCartReady() });
  }, (error) => console.error("Checkout offers could not be loaded.", error));

  document.addEventListener("click", (event) => {
    const nextButton = event.target.closest("[data-checkout-next]");
    if (nextButton) {
      goToNextStep();
      return;
    }

    const backButton = event.target.closest("[data-checkout-prev]");
    if (backButton) {
      goToPreviousStep();
      return;
    }

    const removeButton = event.target.closest("[data-checkout-remove]");
    if (removeButton) {
      if (!isCartReady()) {
        setValidationMessage(getCheckoutUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."));
        return;
      }
      removeCartItem(removeButton.getAttribute("data-checkout-remove"));
      emitToast(getCheckoutUiText("itemRemoved", "Item removed from cart."), "info");
      return;
    }

    const increaseButton = event.target.closest("[data-checkout-increase]");
    if (increaseButton) {
      if (!isCartReady()) {
        setValidationMessage(getCheckoutUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."));
        return;
      }
      const productId = increaseButton.getAttribute("data-checkout-increase");
      const item = getCart().find((cartItem) => cartItem.id === productId);
      const quantity = Number(item?.quantity) || 1;
      const inventoryStatus = getInventoryStatus(productId);
      const quantityLimitNotice = getQuantityLimitNotice(inventoryStatus, quantity);
      if (quantityLimitNotice) {
        setValidationMessage(quantityLimitNotice);
        emitToast(quantityLimitNotice, "error");
        return;
      }
      updateCartItemQuantityWithInventory(productId, quantity + 1);
      return;
    }

    const decreaseButton = event.target.closest("[data-checkout-decrease]");
    if (decreaseButton) {
      if (!isCartReady()) {
        setValidationMessage(getCheckoutUiText("cartStillLoading", "Your cart is still loading. Please try again in a moment."));
        return;
      }
      const productId = decreaseButton.getAttribute("data-checkout-decrease");
      const item = getCart().find((cartItem) => cartItem.id === productId);
      updateCartItemQuantityWithInventory(productId, (Number(item?.quantity) || 1) - 1);
      return;
    }

    if (event.target.closest("#clearSavedAddressBtn")) {
      clearSavedCustomerInfo();
    }
  });

  getCheckoutDom().cityInputs.forEach((input) => {
    input.addEventListener("change", syncCityCards);
  });

  getCheckoutDom().addressFields.forEach((field) => {
    field.addEventListener("input", () => {
      setValidationMessage("");
      scheduleRenderReview();
    });
  });

  const form = getCheckoutDom().form;
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitOrder();
    });
  }

  const { couponApplyButton, couponRemoveButton, couponInput } = getCheckoutDom();
  if (couponApplyButton) {
    couponApplyButton.addEventListener("click", () => {
      validateCoupon(couponInput?.value);
    });
  }
  if (couponRemoveButton) {
    couponRemoveButton.addEventListener("click", () => {
      if (couponInput) {
        couponInput.value = "";
      }
      setAppliedCoupon(null, 0);
      setCouponMessage(getCheckoutUiText("promoCodeRemoved", "Promo code removed."), "info");
    });
  }
  if (couponInput) {
    couponInput.addEventListener("input", () => {
      if (appliedCoupon && normalizeCouponCode(couponInput.value) !== appliedCoupon.code) {
        setAppliedCoupon(null, 0);
        setCouponMessage("");
      }
    });
  }

  hydrateSavedCustomerInfo();
  loadCheckoutSettings();
  syncCityCards();
  setStep(initialCheckoutStep);

  window.addEventListener("sushi-box:language-change", () => {
    renderCartItems(getCart(), { ready: isCartReady(), loading: !isCartReady() });
    renderCheckoutTotals();
    syncCityCards();
    renderReview();
    updatePaymentSubmitLabel();
  });
});
