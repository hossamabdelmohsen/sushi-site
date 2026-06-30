import { formatPrice } from "./product-catalog.js?v=20260701a";
import { subscribeToCustomerOrders } from "./orders-store.js?v=20260701a";
import { emitToast, escapeHtml } from "./ui-utils.js?v=20260701a";
import { getLanguage, t } from "./i18n/i18n.js?v=20260701a";

let latestOrdersState = {
  loading: true,
  error: "",
  orders: [],
  scope: "",
  ownerId: ""
};

function getOrdersUiText(key, fallback = "", values = {}) {
  return t(`ordersPage.${key}`, fallback, values);
}

function getOrdersUiCountText(key, count, fallbackSingular, fallbackPlural) {
  const isSingle = count === 1;
  return getOrdersUiText(isSingle ? key : `${key}_plural`, isSingle ? fallbackSingular : fallbackPlural, { count });
}

function getOrderErrorText(message) {
  const cleanMessage = String(message || "").trim();
  if (!cleanMessage) {
    return "";
  }

  if (cleanMessage.includes("could not load your orders")) {
    return getOrdersUiText("unableToLoadOrdersHint", "We could not load your orders. Please refresh and try again.");
  }

  if (cleanMessage.includes("could not check your account")) {
    return getOrdersUiText("unableToCheckAccount", "We could not check your account. Please refresh and try again.");
  }

  return cleanMessage;
}

function formatOrderDate(value) {
  if (!value) {
    return getOrdersUiText("dateUnavailable", "Date unavailable");
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(getLanguage() === "ar" ? "ar-EG" : "en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatOrderPrice(order) {
  const total = Number.isFinite(Number(order.total))
    ? Number(order.total)
    : Number(order.totalCents || order.amountCents || 0) / 100;
  return formatPrice(total);
}

function getStatusLabel(value) {
  const status = String(value || "pending").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const fallback = String(value || "pending").replace(/[_-]/g, " ");
  return getOrdersUiText(`statuses.${status || "pending"}`, fallback);
}

function getStatusClass(value) {
  return String(value || "pending").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

function getOrderItems(order) {
  return Array.isArray(order.cartItems)
    ? order.cartItems
    : (Array.isArray(order.items) ? order.items : []);
}

function renderOrderItems(order) {
  const items = getOrderItems(order);
  if (!items.length) {
    return `<p class="orders_item_empty">${escapeHtml(getOrdersUiText("noItemDetails", "No item details available."))}</p>`;
  }

  return `
    <ul class="orders_item_list">
      ${items.slice(0, 4).map((item) => `
        <li>
          <span>${escapeHtml(item.name || item.productId || getOrdersUiText("product", "Product"))}</span>
          <strong>${Number(item.quantity) || 1}x</strong>
        </li>
      `).join("")}
    </ul>
    ${items.length > 4 ? `<p class="orders_item_more">${escapeHtml(getOrdersUiCountText("moreItems", items.length - 4, `+${items.length - 4} more item`, `+${items.length - 4} more items`))}</p>` : ""}
  `;
}

function renderOrders(state) {
  latestOrdersState = {
    loading: Boolean(state.loading),
    error: state.error || "",
    orders: Array.isArray(state.orders) ? state.orders : [],
    scope: state.scope || "",
    ownerId: state.ownerId || ""
  };

  const loadingEl = document.getElementById("ordersLoadingState");
  const errorEl = document.getElementById("ordersErrorState");
  const emptyEl = document.getElementById("ordersEmptyState");
  const listEl = document.getElementById("ordersList");
  const scopeEl = document.getElementById("ordersScopeText");

  if (!loadingEl || !errorEl || !emptyEl || !listEl) {
    return;
  }

  const orders = latestOrdersState.orders;
  loadingEl.hidden = !state.loading;
  errorEl.hidden = !state.error;
  emptyEl.hidden = state.loading || Boolean(state.error) || orders.length > 0;
  listEl.hidden = state.loading || Boolean(state.error) || orders.length === 0;

  if (scopeEl) {
    scopeEl.textContent = state.scope === "user"
      ? getOrdersUiText("signedInScope", "Showing orders saved to your signed-in account.")
      : getOrdersUiText("guestScope", "Showing guest orders from this browser session.");
  }

  if (errorEl) {
    errorEl.textContent = getOrderErrorText(state.error);
  }

  if (!orders.length) {
    listEl.innerHTML = "";
    return;
  }

  // Each card is sourced from the current user/session mirror collection only.
  listEl.innerHTML = orders.map((order) => `
    <article class="orders_card">
      <div class="orders_card_head">
        <div>
          <span>${escapeHtml(getOrdersUiText("orderDate", "Order Date"))}: ${escapeHtml(formatOrderDate(order.createdAt))}</span>
          <h2>${escapeHtml(getOrdersUiText("orderNumber", "Order Number"))}: ${escapeHtml(order.orderId || order.id)}</h2>
        </div>
        <strong>${escapeHtml(getOrdersUiText("orderTotal", "Order Total"))}: ${escapeHtml(formatOrderPrice(order))}</strong>
      </div>
      <div class="orders_badges" aria-label="${escapeHtml(getOrdersUiText("orderStatuses", "Order statuses"))}">
        <span class="orders_badge orders_badge_payment orders_badge_${escapeHtml(getStatusClass(order.paymentStatus || order.status))}">${escapeHtml(getOrdersUiText("paymentStatus", "Payment Status"))}: ${escapeHtml(getStatusLabel(order.paymentStatus || order.status))}</span>
        <span class="orders_badge orders_badge_order orders_badge_${escapeHtml(getStatusClass(order.orderStatus))}">${escapeHtml(getOrdersUiText("orderStatus", "Order Status"))}: ${escapeHtml(getStatusLabel(order.orderStatus))}</span>
      </div>
      <div class="orders_meta">
        <div>
          <span>${escapeHtml(getOrdersUiText("city", "City"))}</span>
          <strong>${escapeHtml(order.city || order.customer?.cityName || getOrdersUiText("notAvailable", "Not available"))}</strong>
        </div>
        <div>
          <span>${escapeHtml(getOrdersUiText("paymentStatus", "Payment Status"))}</span>
          <strong>${escapeHtml(getStatusLabel(order.paymentMethod || "paymob-checkout"))}</strong>
        </div>
      </div>
      ${renderOrderItems(order)}
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  subscribeToCustomerOrders((state) => {
    renderOrders(state);

    if (state.error) {
      emitToast(getOrderErrorText(state.error), "error");
    }
  });

  window.addEventListener("sushi-box:language-change", () => {
    renderOrders(latestOrdersState);
  });
});
