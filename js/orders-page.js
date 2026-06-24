import { formatPrice } from "./product-catalog.js?v=20260602c";
import { subscribeToCustomerOrders } from "./orders-store.js?v=20260520a";
import { emitToast, escapeHtml } from "./ui-utils.js?v=20260502b";

function formatOrderDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en", {
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
  return String(value || "pending").replace(/_/g, " ");
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
    return '<p class="orders_item_empty">No item details available.</p>';
  }

  return `
    <ul class="orders_item_list">
      ${items.slice(0, 4).map((item) => `
        <li>
          <span>${escapeHtml(item.name || item.productId || "Product")}</span>
          <strong>${Number(item.quantity) || 1}x</strong>
        </li>
      `).join("")}
    </ul>
    ${items.length > 4 ? `<p class="orders_item_more">+${items.length - 4} more item${items.length - 4 === 1 ? "" : "s"}</p>` : ""}
  `;
}

function renderOrders(state) {
  const loadingEl = document.getElementById("ordersLoadingState");
  const errorEl = document.getElementById("ordersErrorState");
  const emptyEl = document.getElementById("ordersEmptyState");
  const listEl = document.getElementById("ordersList");
  const scopeEl = document.getElementById("ordersScopeText");

  if (!loadingEl || !errorEl || !emptyEl || !listEl) {
    return;
  }

  const orders = Array.isArray(state.orders) ? state.orders : [];
  loadingEl.hidden = !state.loading;
  errorEl.hidden = !state.error;
  emptyEl.hidden = state.loading || Boolean(state.error) || orders.length > 0;
  listEl.hidden = state.loading || Boolean(state.error) || orders.length === 0;

  if (scopeEl) {
    scopeEl.textContent = state.scope === "user"
      ? "Showing orders saved to your signed-in account."
      : "Showing guest orders from this browser session.";
  }

  if (errorEl) {
    errorEl.textContent = state.error || "";
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
          <span>${escapeHtml(formatOrderDate(order.createdAt))}</span>
          <h2>${escapeHtml(order.orderId || order.id)}</h2>
        </div>
        <strong>${escapeHtml(formatOrderPrice(order))}</strong>
      </div>
      <div class="orders_badges" aria-label="Order statuses">
        <span class="orders_badge orders_badge_payment orders_badge_${escapeHtml(getStatusClass(order.paymentStatus || order.status))}">${escapeHtml(getStatusLabel(order.paymentStatus || order.status))}</span>
        <span class="orders_badge orders_badge_order orders_badge_${escapeHtml(getStatusClass(order.orderStatus))}">${escapeHtml(getStatusLabel(order.orderStatus))}</span>
      </div>
      <div class="orders_meta">
        <div>
          <span>City</span>
          <strong>${escapeHtml(order.city || order.customer?.cityName || "Not available")}</strong>
        </div>
        <div>
          <span>Payment</span>
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
      emitToast(state.error, "error");
    }
  });
});
