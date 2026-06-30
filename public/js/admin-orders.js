import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, db } from "./firebase-config.js?v=20260701a";
import { isAdminUser } from "./admin-access.js?v=20260701a";
import { formatPrice, getAllProducts } from "./product-catalog.js?v=20260701a";
import { emitToast, escapeHtml, timestampToDate } from "./ui-utils.js?v=20260701a";
import { t } from "./i18n/i18n.js?v=20260701a";

const ORDER_STATUSES = [
  { value: "pending", labelKey: "pending", fallback: "Pending" },
  { value: "preparing", labelKey: "preparing", fallback: "Preparing" },
  { value: "out_for_delivery", labelKey: "outForDelivery", fallback: "Out for delivery" },
  { value: "delivered", labelKey: "delivered", fallback: "Delivered" },
  { value: "cancelled", labelKey: "cancelled", fallback: "Cancelled" }
];

const FILTER_LABELS = {
  all: "all",
  pending: "pending",
  preparing: "preparing",
  out_for_delivery: "outForDelivery",
  delivered: "delivered",
  cancelled: "cancelled"
};

const STATUS_VALUES = new Set(ORDER_STATUSES.map((status) => status.value));
const NEEDS_ACTION_STATUSES = new Set(["pending"]);
const ADMIN_SECTIONS = new Set(["overview", "new-orders", "actioned-orders", "inventory", "product-management", "shipping", "promo-codes", "product-offers"]);
const ADMIN_PRODUCT_STATUSES = new Set(["draft", "archived"]);

let currentUser = null;
let unsubscribeOrders = null;
let unsubscribeInventory = null;
let allOrders = [];
let inventoryRecords = new Map();
let inventorySearchQuery = "";
let activeFilter = "all";
let activeAdminSection = "overview";
let activeOrdersSection = "needs_action";
let updatingOrderIds = new Set();
let checkoutSettings = {
  shippingRates: {},
  coupons: []
};
let productOffers = [];
let adminProductDrafts = [];
let productDraftSearchQuery = "";
let productDraftStatusFilter = "all";

const STATUS_ACCENT_CLASSES = {
  pending: "pending",
  preparing: "preparing",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  cancelled: "cancelled"
};

function getElement(id) {
  return document.getElementById(id);
}

function getAdminText(key, fallback = "", values = {}) {
  return t(`adminUi.${key}`, fallback, values);
}

function getAdminCountText(key, count, fallbackSingular = "", fallbackPlural = fallbackSingular) {
  const keySuffix = Number(count) === 1 ? key : `${key}_plural`;
  return getAdminText(keySuffix, Number(count) === 1 ? fallbackSingular : fallbackPlural, { count });
}

function getFilterLabel(filterValue) {
  const key = FILTER_LABELS[filterValue] || "all";
  return getAdminText(key, filterValue || "All");
}

function escapeSelectorValue(value) {
  return window.CSS && typeof window.CSS.escape === "function"
    ? window.CSS.escape(String(value || ""))
    : String(value || "").replace(/["\\]/g, "\\$&");
}

function normalizeStatus(value) {
  const normalized = String(value || "pending")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  if (normalized === "canceled") {
    return "cancelled";
  }

  return STATUS_VALUES.has(normalized) ? normalized : "pending";
}

function getStatusLabel(value) {
  const normalized = normalizeStatus(value);
  const status = ORDER_STATUSES.find((item) => item.value === normalized);
  return status ? getAdminText(status.labelKey, status.fallback) : getAdminText("pending", "Pending");
}

function getStatusClass(value) {
  return normalizeStatus(value).replace(/[^a-z0-9_-]/g, "_");
}

function getOrderTimestamp(order) {
  const date = timestampToDate(order && order.createdAt);
  return date ? date.getTime() : 0;
}

function formatOrderDate(value) {
  const date = timestampToDate(value);
  if (!date) {
    return getAdminText("dateUnavailable", "Date unavailable");
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatShortOrderId(orderId) {
  const safeOrderId = String(orderId || "").trim();
  if (!safeOrderId) {
    return getAdminText("noId", "No ID");
  }

  return safeOrderId.slice(-8);
}

function getOrderTotal(order) {
  if (Number.isFinite(Number(order && order.total))) {
    return Number(order.total);
  }

  const cents = Number(order && (order.totalCents || order.amountCents));
  return Number.isFinite(cents) ? cents / 100 : 0;
}

function formatOrderPrice(order) {
  return formatPrice(getOrderTotal(order));
}

function getOrderMoneyField(order, keys) {
  const match = keys.find((key) => Number.isFinite(Number(order?.[key])));
  return match ? Number(order[match]) : 0;
}

function renderOrderTotals(order) {
  const subtotal = getOrderMoneyField(order, ["subtotal"]);
  const shipping = getOrderMoneyField(order, ["shippingFee", "deliveryFee"]);
  const totalBeforeDiscount = getOrderMoneyField(order, ["totalBeforeDiscount"]) || (subtotal + shipping);
  const discount = getOrderMoneyField(order, ["discount"]);
  const couponCode = order?.couponCode || "";
  const finalTotal = getOrderTotal(order);

  return `
    <div class="admin_order_totals_panel">
      <span class="admin_order_section_label">${escapeHtml(getAdminText("totals", "Totals"))}</span>
      <div class="admin_order_total_row"><span>${escapeHtml(getAdminText("productsSubtotal", "Products Subtotal"))}</span><strong>${escapeHtml(formatPrice(subtotal))}</strong></div>
      <div class="admin_order_total_row"><span>${escapeHtml(getAdminText("shippingCost", "Shipping Cost"))}</span><strong>${escapeHtml(formatPrice(shipping))}</strong></div>
      <div class="admin_order_total_row"><span>${escapeHtml(getAdminText("totalBeforeDiscount", "Total Before Discount"))}</span><strong>${escapeHtml(formatPrice(totalBeforeDiscount))}</strong></div>
      <div class="admin_order_total_row"><span>${escapeHtml(getAdminText("discount", "Discount"))}</span><strong>${escapeHtml(`-${formatPrice(discount)}`)}</strong></div>
      <div class="admin_order_total_row"><span>${escapeHtml(getAdminText("couponCodeUsed", "Coupon code used"))}</span><strong>${escapeHtml(couponCode || getAdminText("none", "None"))}</strong></div>
      <div class="admin_order_total_row admin_order_total_row_final"><span>${escapeHtml(getAdminText("finalTotal", "Final Total"))}</span><strong>${escapeHtml(formatPrice(finalTotal))}</strong></div>
    </div>
  `;
}

function getOrderItems(order) {
  if (Array.isArray(order && order.cartItems)) {
    return order.cartItems;
  }

  return Array.isArray(order && order.items) ? order.items : [];
}

function getCustomer(order) {
  return order && order.customer && typeof order.customer === "object"
    ? order.customer
    : {};
}

function buildAddressFromCustomer(customer) {
  return [
    customer.fullAddress,
    customer.area,
    customer.building ? `Building ${customer.building}` : "",
    customer.floorApartment ? `Floor / Apt ${customer.floorApartment}` : "",
    customer.cityName || customer.city
  ].filter(Boolean).join(", ");
}

function getOrderField(order, primaryKey, customerKey, fallback = getAdminText("notAvailable", "Not available")) {
  const customer = getCustomer(order);
  return order?.[primaryKey] || customer?.[customerKey] || fallback;
}

function getOrderAddress(order) {
  const customer = getCustomer(order);
  return order?.address || customer.address || buildAddressFromCustomer(customer) || getAdminText("notAvailable", "Not available");
}

function getOrderCity(order) {
  const customer = getCustomer(order);
  return order?.city || customer.cityName || customer.city || getAdminText("notAvailable", "Not available");
}

function formatStatusText(value) {
  return String(value || "pending").replace(/_/g, " ");
}

function getPaymentStatusMeta(order) {
  const rawStatus = String(order?.paymentStatus || order?.status || "pending").trim();
  const normalized = rawStatus.toLowerCase().replace(/[\s-]+/g, "_");
  const isSuccess = ["success", "succeeded", "paid", "completed"].includes(normalized);
  const isFailed = ["failed", "fail", "declined", "cancelled", "canceled"].includes(normalized);

  return {
    label: isSuccess
      ? getAdminText("paymentSuccess", "Payment Success")
      : isFailed
        ? getAdminText("paymentFailed", "Payment Failed")
        : getAdminText("payment", "Payment {status}", { status: formatStatusText(rawStatus) }),
    className: isSuccess ? "success" : isFailed ? "failed" : "neutral"
  };
}

function getSafePhone(order) {
  const rawPhone = String(getOrderField(order, "phone", "phone", "") || "").trim();
  return rawPhone.replace(/[^\d+]/g, "");
}

function getWhatsAppUrl(order) {
  const normalizedPhone = getSafePhone(order).replace(/[^\d]/g, "");
  return normalizedPhone ? `https://wa.me/${normalizedPhone}` : "";
}

function renderStatusOptions(selectedStatus) {
  const normalizedStatus = normalizeStatus(selectedStatus);
  return ORDER_STATUSES.map((status) => `
    <option value="${status.value}" ${status.value === normalizedStatus ? "selected" : ""}>${escapeHtml(getAdminText(status.labelKey, status.fallback))}</option>
  `).join("");
}

function formatItemPrice(item) {
  const lineTotal = Number(item?.lineTotal);
  if (Number.isFinite(lineTotal)) {
    return formatPrice(lineTotal);
  }

  const lineTotalCents = Number(item?.lineTotalCents);
  if (Number.isFinite(lineTotalCents)) {
    return formatPrice(lineTotalCents / 100);
  }

  const unitPrice = Number(item?.unitPrice ?? item?.price);
  const quantity = Math.max(1, Number(item?.quantity) || 1);
  return Number.isFinite(unitPrice) ? formatPrice(unitPrice * quantity) : "";
}

function renderOrderItems(order) {
  const items = getOrderItems(order);
  if (!items.length) {
    return `<p class="orders_item_empty">${escapeHtml(getAdminText("noItemDetails", "No item details available."))}</p>`;
  }

  return `
    <div class="admin_order_items_panel">
      <span class="admin_order_section_label">${escapeHtml(getAdminText("items", "Items"))}</span>
      <ul class="admin_order_items">
      ${items.map((item) => {
        const quantity = Math.max(1, Number(item?.quantity) || 1);
        const itemTotal = formatItemPrice(item) || formatPrice(0);

        return `
          <li class="admin_order_item_row">
            <span class="admin_order_item_name">${escapeHtml(item?.name || item?.productId || item?.id || getAdminText("product", "Product"))}</span>
            <span class="admin_order_item_spacer" aria-hidden="true"></span>
            <strong class="admin_order_item_price">${escapeHtml(`${quantity} x ${itemTotal}`)}</strong>
          </li>
        `;
      }).join("")}
      </ul>
    </div>
  `;
}

function setPageState(state, message = "") {
  const loadingEl = getElement("adminOrdersLoadingState");
  const deniedEl = getElement("adminOrdersDeniedState");
  const errorEl = getElement("adminOrdersErrorState");
  const dashboardEl = getElement("adminOrdersDashboard");

  if (loadingEl) {
    loadingEl.hidden = state !== "loading";
  }

  if (deniedEl) {
    deniedEl.hidden = state !== "denied";
  }

  if (errorEl) {
    errorEl.hidden = state !== "error";
    errorEl.textContent = state === "error" ? message : "";
  }

  if (dashboardEl) {
    dashboardEl.hidden = state !== "dashboard";
  }
}

function setIntroText(message) {
  const introEl = getElement("adminOrdersIntro");
  if (introEl) {
    introEl.textContent = message;
  }
}

function redirectToLogin() {
  setIntroText(getAdminText("redirectingSignIn", "Redirecting to sign in before opening the admin dashboard."));
  window.setTimeout(() => {
    const redirect = encodeURIComponent("admin-orders.html");
    window.location.href = `index.html?auth=login&redirect=${redirect}`;
  }, 500);
}

function normalizeAdminSection(value) {
  const normalized = String(value || "")
    .replace(/^#/, "")
    .trim()
    .toLowerCase();

  return ADMIN_SECTIONS.has(normalized) ? normalized : "overview";
}

function getAdminSectionFromHash() {
  return normalizeAdminSection(window.location.hash || "overview");
}

function getAdminSectionForOrdersSection(ordersSection) {
  return ordersSection === "actioned" ? "actioned-orders" : "new-orders";
}

function getOrdersSectionForAdminSection(adminSection) {
  return adminSection === "actioned-orders" ? "actioned" : "needs_action";
}

function isOrdersAdminSection(adminSection = activeAdminSection) {
  return adminSection === "new-orders" || adminSection === "actioned-orders";
}

function setActiveAdminSection(section, options = {}) {
  activeAdminSection = normalizeAdminSection(section);

  if (isOrdersAdminSection(activeAdminSection)) {
    activeOrdersSection = getOrdersSectionForAdminSection(activeAdminSection);
  }

  document.querySelectorAll("[data-admin-nav-section]").forEach((link) => {
    const linkSection = normalizeAdminSection(link.getAttribute("data-admin-nav-section"));
    const isActive = linkSection === activeAdminSection;
    link.classList.toggle("is_active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  document.querySelectorAll("[data-admin-panel]").forEach((panel) => {
    const panelSection = normalizeAdminSection(panel.getAttribute("data-admin-panel"));
    panel.hidden = panelSection !== activeAdminSection;
  });

  const showOrderControls = isOrdersAdminSection(activeAdminSection);
  document.querySelectorAll(".admin_orders_queue_tabs, .admin_orders_filters, #adminOrdersEmptyState").forEach((element) => {
    element.hidden = !showOrderControls;
  });

  if (options.updateHash !== false) {
    const nextHash = `#${activeAdminSection}`;
    if (window.location.hash !== nextHash) {
      history.replaceState(null, "", nextHash);
    }
  }
}

function getFilteredOrders() {
  if (activeFilter === "all") {
    return allOrders;
  }

  return allOrders.filter((order) => normalizeStatus(order.orderStatus) === activeFilter);
}

function isActionedOrder(order) {
  return !NEEDS_ACTION_STATUSES.has(normalizeStatus(order.orderStatus));
}

function isActionedFilter(filterValue) {
  return filterValue !== "all" && !NEEDS_ACTION_STATUSES.has(normalizeStatus(filterValue));
}

function renderSummary(filteredOrders) {
  const countEl = getElement("adminOrdersCount");
  const filteredCountEl = getElement("adminOrdersFilteredCount");
  const revenueEl = getElement("adminOrdersRevenue");
  const total = allOrders.reduce((sum, order) => sum + getOrderTotal(order), 0);

  if (countEl) {
    countEl.textContent = String(allOrders.length);
  }

  if (filteredCountEl) {
    filteredCountEl.textContent = String(filteredOrders.length);
  }

  if (revenueEl) {
    revenueEl.textContent = formatPrice(total);
  }
}

function renderFilterButtons() {
  const statusCounts = allOrders.reduce((counts, order) => {
    const status = normalizeStatus(order.orderStatus);
    counts[status] = (counts[status] || 0) + 1;
    counts.all += 1;
    return counts;
  }, {
    all: 0,
    pending: 0,
    preparing: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0
  });

  document.querySelectorAll("[data-admin-order-filter]").forEach((button) => {
    const filterValue = button.getAttribute("data-admin-order-filter") || "all";
    const isActive = filterValue === activeFilter;
    const badge = button.querySelector(".admin_filter_badge");

    button.classList.toggle("is_active", isActive);
    button.setAttribute("aria-pressed", String(isActive));

    if (badge) {
      badge.textContent = String(statusCounts[filterValue] || 0);
    } else {
      button.innerHTML = `${escapeHtml(getFilterLabel(filterValue))} <span class="admin_filter_badge">${statusCounts[filterValue] || 0}</span>`;
    }
  });
}

function renderQueueTabs(needsActionCount, actionedCount) {
  const needsActionTabCount = getElement("adminNeedsActionTabCount");
  const actionedTabCount = getElement("adminActionedTabCount");
  const needsActionNavCount = getElement("adminNeedsActionNavCount");
  const actionedNavCount = getElement("adminActionedNavCount");

  if (needsActionTabCount) {
    needsActionTabCount.textContent = String(needsActionCount);
  }

  if (actionedTabCount) {
    actionedTabCount.textContent = String(actionedCount);
  }

  if (needsActionNavCount) {
    needsActionNavCount.textContent = String(needsActionCount);
  }

  if (actionedNavCount) {
    actionedNavCount.textContent = String(actionedCount);
  }

  document.querySelectorAll("[data-admin-orders-section]").forEach((tab) => {
    const section = tab.getAttribute("data-admin-orders-section") || "needs_action";
    const isActive = section === activeOrdersSection;
    tab.classList.toggle("is_active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });
}

function renderOrderCard(order) {
  const orderId = order.orderId || order.orderReference || order.id;
  const status = normalizeStatus(order.orderStatus);
  const isUpdating = updatingOrderIds.has(order.id);
  const statusClass = STATUS_ACCENT_CLASSES[status] || "pending";
  const paymentStatus = getPaymentStatusMeta(order);
  const customerName = getOrderField(order, "customerName", "name");
  const phone = getOrderField(order, "phone", "phone");
  const city = getOrderCity(order);
  const address = getOrderAddress(order);
  const whatsappUrl = getWhatsAppUrl(order);

  return `
      <article class="admin_order_card admin_order_card_${escapeHtml(statusClass)}" data-order-id="${escapeHtml(order.id)}">
        <div class="admin_order_head">
          <div class="admin_order_primary">
            <strong class="admin_order_customer_name">${escapeHtml(customerName)}</strong>
            <span class="admin_order_timestamp">${escapeHtml(formatOrderDate(order.createdAt))}</span>
          </div>
          <strong class="admin_order_total">${escapeHtml(formatOrderPrice(order))}</strong>
        </div>

        <div class="admin_order_quick_facts">
          <span><i class="fa fa-phone" aria-hidden="true"></i>${escapeHtml(phone)}</span>
          <span><i class="fa fa-map-marker" aria-hidden="true"></i>${escapeHtml(city)}</span>
          <span class="orders_badge orders_badge_payment orders_badge_payment_${escapeHtml(paymentStatus.className)}">${escapeHtml(paymentStatus.label)}</span>
          <span class="orders_badge orders_badge_order orders_badge_order_${escapeHtml(statusClass)}">${escapeHtml(getStatusLabel(order.orderStatus))}</span>
        </div>

        <div class="admin_order_identity_row">
          <span class="admin_order_short_id">${escapeHtml(formatShortOrderId(orderId))}</span>
          <button class="admin_order_copy_btn" type="button" data-copy-order-id="${escapeHtml(orderId)}" aria-label="${escapeHtml(getAdminText("copyOrderId", "Copy Order ID"))}" title="${escapeHtml(getAdminText("copyOrderId", "Copy Order ID"))}">
            <i class="fa fa-clipboard" aria-hidden="true"></i>
          </button>
          ${whatsappUrl ? `<a class="admin_order_whatsapp_btn" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(getAdminText("contactCustomerWhatsapp", "Contact customer on WhatsApp"))}" title="${escapeHtml(getAdminText("contactOnWhatsapp", "Contact on WhatsApp"))}"><i class="fa fa-whatsapp" aria-hidden="true"></i></a>` : ""}
        </div>

        <div class="admin_order_address_row">
          <i class="fa fa-map-marker" aria-hidden="true"></i>
          <span>${escapeHtml(address)}</span>
        </div>

        <div class="admin_order_full_id_block">
          <button class="admin_order_id_toggle" type="button" data-toggle-order-id="${escapeHtml(order.id)}" aria-expanded="false" aria-controls="adminOrderFullId-${escapeHtml(order.id)}">
            ${escapeHtml(getAdminText("orderId", "Order ID"))} <span aria-hidden="true">▼</span>
          </button>
          <div class="admin_order_full_id_value" id="adminOrderFullId-${escapeHtml(order.id)}" hidden>
            ${escapeHtml(orderId)}
          </div>
        </div>

        ${renderOrderItems(order)}
        ${renderOrderTotals(order)}

        <div class="admin_order_status_form">
          <select data-admin-order-status="${escapeHtml(order.id)}" ${isUpdating ? "disabled" : ""} aria-label="${escapeHtml(getAdminText("updateStatus", "Update order status"))}">
            ${renderStatusOptions(status)}
          </select>
          <button type="button" data-admin-order-update="${escapeHtml(order.id)}" disabled>
            ${isUpdating ? escapeHtml(getAdminText("updating", "Updating...")) : escapeHtml(getAdminText("save", "Save"))}
          </button>
        </div>
      </article>
    `;
}

function getCouponTypeLabel(type) {
  const labels = {
    free_shipping: getAdminText("freeShipping", "Free Shipping"),
    fixed_discount: getAdminText("fixedDiscount", "Fixed Discount"),
    percentage_discount: getAdminText("percentageDiscount", "Percentage Discount")
  };
  return labels[type] || getAdminText("freeShipping", "Free Shipping");
}

function formatCouponValue(coupon) {
  if (coupon.type === "free_shipping") {
    return getAdminText("shippingOnly", "Shipping only");
  }
  if (coupon.type === "percentage_discount") {
    return `${Number(coupon.value) || 0}%`;
  }
  return formatPrice(Number(coupon.value) || 0);
}

function formatCouponDate(value) {
  if (!value) {
    return getAdminText("noExpiration", "No expiration");
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date)
    : getAdminText("noExpiration", "No expiration");
}

function normalizeCouponCode(value) {
  return String(value || "").trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeInventoryRecord(product, record = {}) {
  return {
    slug: product.id,
    stockQuantity: Math.max(0, Math.trunc(Number(record.stockQuantity) || 0)),
    trackStock: record.trackStock === true,
    lowStockThreshold: Math.max(0, Math.trunc(Number(record.lowStockThreshold) || 0)),
    updatedAt: record.updatedAt || null,
    updatedBy: record.updatedBy || ""
  };
}

function getInventoryStatusLabel(record) {
  if (!record.trackStock) {
    return getAdminText("notTracked", "Not tracked");
  }
  if (record.stockQuantity <= 0) {
    return getAdminText("outOfStock", "Out of stock");
  }
  if (record.stockQuantity <= record.lowStockThreshold) {
    return getAdminText("onlyLeft", "Only {count} left", { count: record.stockQuantity });
  }
  return getAdminText("inStock", "In stock");
}

function ensureInventoryToolbarActions() {
  const toolbar = document.querySelector(".admin_inventory_toolbar");
  if (!toolbar) return;

  if (!getElement("adminInventoryTrackAll")) {
    const trackAll = document.createElement("label");
    trackAll.className = "admin_inventory_track_all";
    trackAll.innerHTML = `<span>${escapeHtml(getAdminText("trackStockAll", "Track Stock All"))}</span><input id="adminInventoryTrackAll" type="checkbox">`;
    toolbar.appendChild(trackAll);
  }

  if (!getElement("adminInventorySaveAllBtn")) {
    const saveAll = document.createElement("button");
    saveAll.id = "adminInventorySaveAllBtn";
    saveAll.className = "admin_inventory_save_all";
    saveAll.type = "button";
    saveAll.textContent = getAdminText("saveAllInventory", "Save All Inventory");
    toolbar.appendChild(saveAll);
  }
}

function productMatchesInventorySearch(product) {
  if (!inventorySearchQuery) {
    return true;
  }

  const haystack = `${product.id} ${product.name} ${product.category || ""}`.toLowerCase();
  return haystack.includes(inventorySearchQuery);
}

function renderInventoryEditor() {
  const listEl = getElement("adminInventoryList");
  const emptyEl = getElement("adminInventoryEmpty");
  const countEl = getElement("adminInventoryCount");
  if (!listEl) {
    return;
  }
  ensureInventoryToolbarActions();

  const products = getAllProducts().filter(productMatchesInventorySearch);
  if (countEl) {
    countEl.textContent = getAdminCountText("productCount", products.length, "{count} product", "{count} products");
  }
  if (emptyEl) {
    emptyEl.hidden = products.length > 0;
  }

  listEl.innerHTML = products.map((product) => {
    const record = normalizeInventoryRecord(product, inventoryRecords.get(product.id));
    const statusLabel = getInventoryStatusLabel(record);
    const statusClass = record.trackStock && record.stockQuantity <= 0
      ? "is_out"
      : record.trackStock && record.stockQuantity <= record.lowStockThreshold ? "is_low" : "";

    return `
      <article class="admin_inventory_item" data-admin-inventory-row="${escapeHtml(product.id)}">
        <div class="admin_inventory_product">
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.id)}</p>
          <span class="admin_inventory_status ${escapeHtml(statusClass)}">${escapeHtml(statusLabel)}</span>
        </div>
        <div class="admin_inventory_controls">
        <label class="admin_inventory_field">
          <span>${escapeHtml(getAdminText("stockQuantity", "Stock Quantity"))}</span>
          <input type="number" min="0" step="1" value="${escapeHtml(String(record.stockQuantity))}" data-inventory-stock="${escapeHtml(product.id)}">
        </label>
        <label class="admin_inventory_field">
          <span>${escapeHtml(getAdminText("lowStockThreshold", "Low stock threshold"))}</span>
          <input type="number" min="0" step="1" value="${escapeHtml(String(record.lowStockThreshold))}" data-inventory-threshold="${escapeHtml(product.id)}">
        </label>
        <label class="admin_inventory_toggle">
          <input type="checkbox" ${record.trackStock ? "checked" : ""} data-inventory-track="${escapeHtml(product.id)}">
          <span>${escapeHtml(getAdminText("trackStock", "Track stock"))}</span>
        </label>
        </div>
      </article>
    `;
  }).join("");
  syncTrackStockAll();
}

function syncTrackStockAll() {
  const toggle = getElement("adminInventoryTrackAll");
  if (!toggle) return;
  const inputs = [...document.querySelectorAll("[data-inventory-track]")];
  toggle.checked = inputs.length > 0 && inputs.every((input) => input.checked);
  toggle.indeterminate = inputs.some((input) => input.checked) && !toggle.checked;
}

function snapshotToInventory(snapshot) {
  const nextRecords = new Map();
  snapshot.forEach((inventoryDoc) => {
    nextRecords.set(inventoryDoc.id, {
      slug: inventoryDoc.id,
      ...inventoryDoc.data()
    });
  });
  return nextRecords;
}

function subscribeToAdminInventory() {
  if (unsubscribeInventory) {
    unsubscribeInventory();
    unsubscribeInventory = null;
  }

  unsubscribeInventory = onSnapshot(
    collection(db, "productsInventory"),
    (snapshot) => {
      inventoryRecords = snapshotToInventory(snapshot);
      renderInventoryEditor();
    },
    (error) => {
      console.error("Admin inventory listener failed.", error);
      emitToast(getAdminText("inventoryCouldNotLoad", "Inventory could not be loaded."), "error");
    }
  );
}

function getInventoryRowValues(productId) {
  const stockInput = document.querySelector(`[data-inventory-stock="${escapeSelectorValue(productId)}"]`);
  const thresholdInput = document.querySelector(`[data-inventory-threshold="${escapeSelectorValue(productId)}"]`);
  const trackInput = document.querySelector(`[data-inventory-track="${escapeSelectorValue(productId)}"]`);
  const stockQuantity = Number(stockInput?.value);
  const lowStockThreshold = Number(thresholdInput?.value);
  if (!Number.isFinite(stockQuantity) || stockQuantity < 0 || !Number.isFinite(lowStockThreshold) || lowStockThreshold < 0) {
    throw new Error(getAdminText("nonNegativeStock", "Stock and low stock threshold must be non-negative numbers."));
  }
  return { stockQuantity, lowStockThreshold, trackStock: trackInput?.checked === true };
}

async function saveInventoryFromRow(productId, values = null) {
  if (!currentUser || typeof currentUser.getIdToken !== "function") {
    throw new Error(getAdminText("signInAgainInventory", "Please sign in again before updating inventory."));
  }

  const product = getAllProducts().find((item) => item.id === productId);
  if (!product) {
    throw new Error(getAdminText("productNotFoundCatalog", "Product was not found in the catalog."));
  }

  const inventoryValues = values || getInventoryRowValues(productId);
  const idToken = await currentUser.getIdToken();
  const response = await fetch("/api/admin-actions?action=saveInventory", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      inventory: {
        slug: product.id,
        stockQuantity: inventoryValues.stockQuantity,
        trackStock: inventoryValues.trackStock,
        lowStockThreshold: inventoryValues.lowStockThreshold
      }
    })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || getAdminText("inventoryCouldNotSave", "Inventory could not be saved."));
  }
  inventoryRecords.set(product.id, body.inventory);
  renderInventoryEditor();
}

async function saveAllVisibleInventory() {
  const saveAllButton = getElement("adminInventorySaveAllBtn");
  const products = getAllProducts().filter(productMatchesInventorySearch);
  const pending = [];
  const invalid = [];
  products.forEach((product) => {
    try { pending.push({ productId: product.id, values: getInventoryRowValues(product.id) }); }
    catch (error) { invalid.push({ productId: product.id, error }); }
  });
  if (invalid.length) {
    throw new Error(getAdminCountText(
      "invalidInventoryRows",
      invalid.length,
      "{count} row has invalid stock values. Fix them before saving.",
      "{count} rows have invalid stock values. Fix them before saving."
    ));
  }
  if (!pending.length) return;
  if (saveAllButton) { saveAllButton.disabled = true; saveAllButton.textContent = getAdminText("saving", "Saving..."); }
  const results = await Promise.allSettled(pending.map(({ productId, values }) => saveInventoryFromRow(productId, values)));
  const failed = results.filter((result) => result.status === "rejected");
  if (saveAllButton) { saveAllButton.textContent = failed.length ? getAdminText("failedSaveSomeItems", "Failed to save some items") : getAdminText("saved", "Saved"); }
  if (failed.length) throw new Error(getAdminText("inventoryItemsSaveFailed", "{failed} of {total} inventory items could not be saved.", { failed: failed.length, total: pending.length }));
  emitToast(getAdminCountText("inventoryItemsSaved", pending.length, "{count} inventory item saved.", "{count} inventory items saved."), "success");
}

function normalizeProductDraftSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function splitDraftList(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getProductDraftStatusLabel(status) {
  return status === "archived"
    ? getAdminText("archived", "Archived")
    : getAdminText("draftOnly", "Draft only");
}

function getProductDraftStatusClass(status) {
  return status === "archived" ? "is_archived" : "is_draft";
}

function getProductDraftFormValues() {
  const slug = normalizeProductDraftSlug(getElement("adminProductDraftSlug")?.value);
  const name = String(getElement("adminProductDraftName")?.value || "").trim();
  const price = Number(getElement("adminProductDraftPrice")?.value);
  const category = String(getElement("adminProductDraftCategory")?.value || "").trim();
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(getAdminText("productDraftInvalidSlug", "Enter a lowercase URL-safe slug."));
  }
  if (!name || !Number.isFinite(price) || price <= 0 || !category) {
    throw new Error(getAdminText("selectDraftProductFields", "Enter slug, name, positive price, and category."));
  }
  return {
    slug,
    name,
    nameAr: String(getElement("adminProductDraftNameAr")?.value || "").trim(),
    price,
    category,
    filterGroup: String(getElement("adminProductDraftFilterGroup")?.value || "").trim(),
    description: String(getElement("adminProductDraftDescription")?.value || "").trim(),
    descriptionAr: String(getElement("adminProductDraftDescriptionAr")?.value || "").trim(),
    images: splitDraftList(getElement("adminProductDraftImages")?.value),
    status: "draft",
    isActive: false,
    sortOrder: Number.isFinite(Number(getElement("adminProductDraftSortOrder")?.value)) ? Number(getElement("adminProductDraftSortOrder").value) : 0,
    searchKeywords: splitDraftList(getElement("adminProductDraftSearchKeywords")?.value)
  };
}

function resetProductDraftForm() {
  const form = getElement("adminProductDraftForm");
  if (form) form.reset();
  const originalSlug = getElement("adminProductDraftOriginalSlug");
  const slugInput = getElement("adminProductDraftSlug");
  const title = getElement("adminProductDraftFormTitle");
  if (originalSlug) originalSlug.value = "";
  if (slugInput) slugInput.disabled = false;
  if (title) title.textContent = getAdminText("createProductDraft", "Create product draft");
  setProductDraftStatus("");
}

function setProductDraftStatus(message = "", type = "info") {
  const status = getElement("adminProductDraftStatus");
  if (!status) return;
  status.textContent = message;
  status.dataset.status = type;
}

function fillProductDraftForm(product) {
  if (!product) return;
  getElement("adminProductDraftOriginalSlug").value = product.slug || "";
  getElement("adminProductDraftSlug").value = product.slug || "";
  getElement("adminProductDraftSlug").disabled = Boolean(product.slug);
  getElement("adminProductDraftName").value = product.name || "";
  getElement("adminProductDraftNameAr").value = product.nameAr || "";
  getElement("adminProductDraftPrice").value = String(Number(product.price) || "");
  getElement("adminProductDraftCategory").value = product.category || "";
  getElement("adminProductDraftFilterGroup").value = product.filterGroup || "";
  getElement("adminProductDraftSortOrder").value = String(Number(product.sortOrder) || 0);
  getElement("adminProductDraftImages").value = Array.isArray(product.images) ? product.images.join("\n") : "";
  getElement("adminProductDraftSearchKeywords").value = Array.isArray(product.searchKeywords) ? product.searchKeywords.join(", ") : "";
  getElement("adminProductDraftDescription").value = product.description || "";
  getElement("adminProductDraftDescriptionAr").value = product.descriptionAr || "";
  const title = getElement("adminProductDraftFormTitle");
  if (title) title.textContent = getAdminText("editProductDraft", "Edit product draft");
  getElement("product-management")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function productDraftMatchesFilters(product) {
  const status = ADMIN_PRODUCT_STATUSES.has(product?.status) ? product.status : "draft";
  if (productDraftStatusFilter !== "all" && status !== productDraftStatusFilter) return false;
  if (!productDraftSearchQuery) return true;
  const haystack = [
    product.slug,
    product.name,
    product.nameAr,
    product.category,
    product.filterGroup,
    status,
    ...(Array.isArray(product.searchKeywords) ? product.searchKeywords : [])
  ].join(" ").toLowerCase();
  return haystack.includes(productDraftSearchQuery);
}

function renderProductDrafts() {
  const list = getElement("adminProductDraftList");
  const count = getElement("adminProductDraftCount");
  if (!list) return;
  const products = adminProductDrafts.filter(productDraftMatchesFilters);
  if (count) {
    count.textContent = getAdminCountText("draftProductCount", products.length, "{count} draft", "{count} drafts");
  }
  if (!products.length) {
    list.innerHTML = `<div class="admin_product_drafts_empty"><strong>${escapeHtml(getAdminText(productDraftSearchQuery || productDraftStatusFilter !== "all" ? "noMatchingDraftProducts" : "noDraftProductsYet", productDraftSearchQuery || productDraftStatusFilter !== "all" ? "No matching draft products." : "No product drafts yet."))}</strong><span>${escapeHtml(getAdminText("productDraftsNote", "Draft only - not visible on storefront"))}</span></div>`;
    return;
  }
  list.innerHTML = products.map((product) => {
    const status = ADMIN_PRODUCT_STATUSES.has(product.status) ? product.status : "draft";
    const imageCount = Array.isArray(product.images) ? product.images.length : 0;
    return `
      <article class="admin_product_drafts_item">
        <div class="admin_product_drafts_item_main">
          <strong>${escapeHtml(product.name || product.slug)}</strong>
          <span>${escapeHtml(product.slug)} - ${escapeHtml(product.category || getAdminText("notAvailable", "Not available"))}</span>
          <div class="admin_product_drafts_meta">
            <b>${escapeHtml(formatPrice(Number(product.price) || 0))}</b>
            <span>${escapeHtml(getAdminText("imageCount", "{count} image(s)", { count: imageCount }))}</span>
            <span>${escapeHtml(getAdminText("notVisibleOnStorefront", "Not visible on storefront"))}</span>
          </div>
        </div>
        <span class="admin_product_drafts_status ${escapeHtml(getProductDraftStatusClass(status))}">${escapeHtml(getProductDraftStatusLabel(status))}</span>
        <div class="admin_product_drafts_item_actions">
          <button type="button" data-admin-product-draft-edit="${escapeHtml(product.slug)}">${escapeHtml(getAdminText("edit", "Edit"))}</button>
          <button type="button" data-admin-product-draft-archive="${escapeHtml(product.slug)}" ${status === "archived" ? "disabled" : ""}>${escapeHtml(getAdminText("archiveDraft", "Archive draft"))}</button>
        </div>
      </article>
    `;
  }).join("");
}

async function adminProductDraftRequest(method, action, payload = {}) {
  if (!currentUser || typeof currentUser.getIdToken !== "function") {
    throw new Error(getAdminText("signInAgainProductDrafts", "Please sign in again before managing product drafts."));
  }
  const token = await currentUser.getIdToken();
  const response = await fetch(`/api/admin-actions?action=${encodeURIComponent(action)}`, {
    method,
    cache: "no-store",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: method === "GET" ? undefined : JSON.stringify(payload)
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || getAdminText("productDraftCouldNotSave", "Product draft could not be saved."));
  }
  return body;
}

async function fetchAdminProductDrafts() {
  setProductDraftStatus(getAdminText("loading", "Loading"), "info");
  const body = await adminProductDraftRequest("GET", "listAdminProducts");
  adminProductDrafts = Array.isArray(body.products) ? body.products : [];
  renderProductDrafts();
  setProductDraftStatus("");
}

async function saveAdminProductDraftFromForm() {
  const saveButton = getElement("adminProductDraftSaveBtn") || document.querySelector("#adminProductDraftForm [type='submit']");
  const product = getProductDraftFormValues();
  if (saveButton) {
    saveButton.disabled = true;
    saveButton.textContent = getAdminText("saving", "Saving...");
  }
  setProductDraftStatus(getAdminText("saving", "Saving..."), "info");
  try {
    await adminProductDraftRequest("POST", "saveAdminProductDraft", { product });
    await fetchAdminProductDrafts();
    resetProductDraftForm();
    const message = getAdminText("draftProductSaved", "Draft saved successfully");
    setProductDraftStatus(message, "success");
    emitToast(message, "success");
  } catch (error) {
    const message = `${getAdminText("productDraftCouldNotSave", "Failed to save draft")}: ${error.message || getAdminText("somethingWentWrong", "Something went wrong")}`;
    setProductDraftStatus(message, "error");
    throw error;
  } finally {
    if (saveButton) {
      saveButton.disabled = false;
      saveButton.textContent = getAdminText("saveDraftProduct", "Save draft");
    }
  }
}

function editAdminProductDraft(slug) {
  const product = adminProductDrafts.find((item) => item.slug === slug);
  if (!product) {
    emitToast(getAdminText("productDraftNotFound", "Product draft was not found."), "error");
    return;
  }
  fillProductDraftForm(product);
}

async function archiveAdminProductDraft(slug) {
  setProductDraftStatus(getAdminText("updating", "Updating..."), "info");
  await adminProductDraftRequest("PATCH", "archiveAdminProduct", { slug });
  await fetchAdminProductDrafts();
  const originalSlug = getElement("adminProductDraftOriginalSlug")?.value;
  if (originalSlug === slug) resetProductDraftForm();
  const message = getAdminText("draftProductArchived", "Product draft archived.");
  setProductDraftStatus(message, "success");
  emitToast(message, "success");
}

function renderShippingRatesEditor() {
  const listEl = getElement("adminShippingRatesList");
  if (!listEl) {
    return;
  }

  const rates = Object.values(checkoutSettings.shippingRates || {});
  listEl.innerHTML = rates.map((rate) => `
    <label class="admin_shipping_rate_item">
      <span>${escapeHtml(rate.cityName || rate.cityId)}</span>
      <input type="number" min="0" step="0.01" value="${escapeHtml(String(Number(rate.amount) || 0))}" data-admin-shipping-rate="${escapeHtml(rate.cityId)}">
    </label>
  `).join("");
}

function resetCouponForm() {
  const formTitle = getElement("adminCouponFormTitle");
  if (formTitle) {
    formTitle.textContent = getAdminText("createPromoCode", "Create Promo Code");
  }
  const originalCode = getElement("adminCouponOriginalCode");
  const code = getElement("adminCouponCode");
  const type = getElement("adminCouponType");
  const value = getElement("adminCouponValue");
  const expiresAt = getElement("adminCouponExpiresAt");
  const usageLimit = getElement("adminCouponUsageLimit");
  const enabled = getElement("adminCouponEnabled");

  if (originalCode) originalCode.value = "";
  if (code) code.value = "";
  if (type) type.value = "free_shipping";
  if (value) value.value = "0";
  if (expiresAt) expiresAt.value = "";
  if (usageLimit) usageLimit.value = "0";
  if (enabled) enabled.checked = true;
}

function fillCouponForm(coupon) {
  const formTitle = getElement("adminCouponFormTitle");
  if (formTitle) {
    formTitle.textContent = getAdminText("editCode", "Edit {code}", { code: coupon.code });
  }
  getElement("adminCouponOriginalCode").value = coupon.code;
  getElement("adminCouponCode").value = coupon.code;
  getElement("adminCouponType").value = coupon.type || "free_shipping";
  getElement("adminCouponValue").value = String(Number(coupon.value) || 0);
  getElement("adminCouponExpiresAt").value = coupon.expiresAt ? String(coupon.expiresAt).slice(0, 10) : "";
  getElement("adminCouponUsageLimit").value = String(Number(coupon.usageLimit) || 0);
  getElement("adminCouponEnabled").checked = coupon.enabled !== false;
}

function renderCouponsEditor() {
  const listEl = getElement("adminCouponsList");
  if (!listEl) {
    return;
  }

  const coupons = checkoutSettings.coupons || [];
  if (!coupons.length) {
    listEl.innerHTML = `<p class="orders_item_empty">${escapeHtml(getAdminText("noPromoCodesYet", "No promo codes yet."))}</p>`;
    return;
  }

  listEl.innerHTML = coupons.map((coupon) => `
    <article class="admin_coupon_card">
      <div>
        <strong>${escapeHtml(coupon.code)}</strong>
        <span>${escapeHtml(getCouponTypeLabel(coupon.type))} - ${escapeHtml(formatCouponValue(coupon))}</span>
      </div>
      <div class="admin_coupon_meta">
        <span>${escapeHtml(coupon.enabled === false ? getAdminText("disabled", "Disabled") : getAdminText("enabled", "Enabled"))}</span>
        <span>${escapeHtml(formatCouponDate(coupon.expiresAt))}</span>
        <span>${escapeHtml(getAdminText("used", "Used {count}", { count: Number(coupon.usageCount) || 0 }))}${coupon.usageLimit > 0 ? ` / ${escapeHtml(String(coupon.usageLimit))}` : ""}</span>
      </div>
      <div class="admin_coupon_card_actions">
        <button type="button" data-admin-coupon-edit="${escapeHtml(coupon.code)}">${escapeHtml(getAdminText("edit", "Edit"))}</button>
        <button type="button" data-admin-coupon-toggle="${escapeHtml(coupon.code)}">${escapeHtml(coupon.enabled === false ? getAdminText("enable", "Enable") : getAdminText("disable", "Disable"))}</button>
        <button type="button" data-admin-coupon-delete="${escapeHtml(coupon.code)}">${escapeHtml(getAdminText("delete", "Delete"))}</button>
      </div>
    </article>
  `).join("");
}

function renderCheckoutSettings() {
  renderShippingRatesEditor();
  renderCouponsEditor();
}

async function fetchAdminCheckoutSettings() {
  if (!currentUser || typeof currentUser.getIdToken !== "function") {
    return;
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch("/api/admin-actions?action=getCheckoutSettings", {
    cache: "no-store",
    headers: { "Authorization": `Bearer ${idToken}` }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || getAdminText("checkoutSettingsCouldNotLoad", "Checkout settings could not be loaded."));
  }
  checkoutSettings = {
    shippingRates: body.shippingRates || {},
    coupons: body.coupons || []
  };
  renderCheckoutSettings();
}

async function syncAdminCheckoutSettings(action, payload = {}) {
  const idToken = await currentUser.getIdToken();
  const response = await fetch(`/api/admin-actions?action=${encodeURIComponent(action)}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ action, ...payload })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || getAdminText("somethingWentWrong", "Something went wrong"));
  }
  return body;
}

async function saveShippingRatesFromForm() {
  const shippingRates = {};
  document.querySelectorAll("[data-admin-shipping-rate]").forEach((input) => {
    const cityId = input.getAttribute("data-admin-shipping-rate");
    const existingRate = checkoutSettings.shippingRates[cityId] || {};
    shippingRates[cityId] = {
      ...existingRate,
      cityId,
      amount: Number(input.value) || 0
    };
  });

  const result = await syncAdminCheckoutSettings("saveShippingRates", { shippingRates });
  checkoutSettings.shippingRates = result.shippingRates || shippingRates;
  renderShippingRatesEditor();
  emitToast(getAdminText("shippingRatesSaved", "Shipping rates saved."), "success");
}

async function saveCouponFromForm() {
  const originalCode = normalizeCouponCode(getElement("adminCouponOriginalCode")?.value);
  const coupon = {
    code: normalizeCouponCode(getElement("adminCouponCode")?.value),
    type: getElement("adminCouponType")?.value || "free_shipping",
    value: Number(getElement("adminCouponValue")?.value) || 0,
    expiresAt: getElement("adminCouponExpiresAt")?.value || "",
    usageLimit: Number(getElement("adminCouponUsageLimit")?.value) || 0,
    enabled: getElement("adminCouponEnabled")?.checked !== false
  };

  if (originalCode && originalCode !== coupon.code) {
    await syncAdminCheckoutSettings("deleteCoupon", { code: originalCode });
  }
  await syncAdminCheckoutSettings("saveCoupon", { coupon });
  await fetchAdminCheckoutSettings();
  resetCouponForm();
  emitToast(getAdminText("promoCodeSaved", "Promo code saved."), "success");
}

async function toggleCoupon(code) {
  const coupon = (checkoutSettings.coupons || []).find((item) => item.code === code);
  if (!coupon) {
    emitToast(getAdminText("promoCodeNotFound", "Promo code was not found."), "error");
    return;
  }
  await syncAdminCheckoutSettings("saveCoupon", {
    coupon: {
      ...coupon,
      enabled: coupon.enabled === false
    }
  });
  await fetchAdminCheckoutSettings();
  emitToast(getAdminText("promoCodeUpdated", "Promo code updated."), "success");
}

async function deleteCouponFromSettings(code) {
  await syncAdminCheckoutSettings("deleteCoupon", { code });
  await fetchAdminCheckoutSettings();
  resetCouponForm();
  emitToast(getAdminText("promoCodeDeleted", "Promo code deleted."), "success");
}

function productOfferInputDate(value) {
  const date = timestampToDate(value) || new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}

function getProductOfferProduct() {
  return getAllProducts().find((product) => product.id === getElement("adminProductOfferSlug")?.value) || null;
}

function renderProductOfferProductOptions() {
  const select = getElement("adminProductOfferSlug");
  if (!select || select.options.length) return;
  select.innerHTML = `<option value="">${escapeHtml(getAdminText("selectCatalogProduct", "Select a catalog product"))}</option>` + getAllProducts().map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} - ${escapeHtml(formatPrice(product.price))}</option>`).join("");
}

function updateProductOfferPreview() {
  const preview = getElement("adminProductOfferPreview");
  const product = getProductOfferProduct();
  const type = getElement("adminProductOfferType")?.value;
  const value = Number(getElement("adminProductOfferValue")?.value);
  if (!preview || !product || !Number.isFinite(value) || value <= 0 || (type === "percentage" && value > 100) || (type === "fixed" && value >= Number(product.price))) {
    if (preview) preview.innerHTML = `<span>${escapeHtml(getAdminText("finalPricePreview", "Final price preview"))}</span><strong>${escapeHtml(getAdminText("finalPricePreviewHint", "Select a product and enter a valid discount to preview the final price."))}</strong>`;
    return;
  }
  const finalPrice = Math.max(0, Number(product.price) - (type === "percentage" ? Number(product.price) * value / 100 : value));
  preview.innerHTML = `<span>${escapeHtml(getAdminText("finalPricePreview", "Final price preview"))}</span><strong>${escapeHtml(product.name)}: ${escapeHtml(formatPrice(product.price))} -> ${escapeHtml(formatPrice(finalPrice))}</strong>`;
}

function resetProductOfferForm() {
  const form = getElement("adminProductOfferForm");
  if (form) form.reset();
  getElement("adminProductOfferOriginalSlug").value = "";
  getElement("adminProductOfferEnabled").checked = true;
  getElement("adminProductOfferPriority").value = "0";
  getElement("adminProductOfferSlug").disabled = false;
  updateProductOfferPreview();
}

function getProductOfferStatus(offer) {
  if (offer.enabled !== true) return { label: getAdminText("disabled", "Disabled"), className: "is_disabled" };
  const dayFor = (value) => {
    const source = String(value || "");
    if (/^\d{4}-\d{2}-\d{2}/.test(source)) return source.slice(0, 10);
    const date = timestampToDate(value) || new Date(value);
    const parts = new Intl.DateTimeFormat("en", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  };
  const currentDay = dayFor(new Date());
  const startDay = dayFor(offer.startDate);
  const endDay = dayFor(offer.endDate);
  if (endDay < currentDay) return { label: getAdminText("expired", "Expired"), className: "is_expired" };
  if (startDay > currentDay) return { label: getAdminText("scheduled", "Scheduled"), className: "is_scheduled" };
  return { label: getAdminText("active", "Active"), className: "is_active" };
}

function renderProductOffers() {
  renderProductOfferProductOptions();
  const list = getElement("adminProductOffersList");
  if (!list) return;
  if (!productOffers.length) { list.innerHTML = `<div class="admin_product_offers_empty"><strong>${escapeHtml(getAdminText("noProductOffersYet", "No product offers yet."))}</strong><span>${escapeHtml(getAdminText("createFirstOffer", "Create your first transactional offer above."))}</span></div>`; return; }
  list.innerHTML = productOffers.map((offer) => {
    const product = getAllProducts().find((item) => item.id === offer.slug);
    const status = getProductOfferStatus(offer);
    const discount = offer.discountType === "percentage"
      ? getAdminText("percentOff", "{value}% off", { value: offer.discountValue })
      : getAdminText("amountOff", "{amount} off", { amount: formatPrice(offer.discountValue) });
    return `<article class="admin_product_offers_item"><div class="admin_product_offers_item_main"><strong class="admin_product_offers_item_name">${escapeHtml(product?.name || offer.slug)}</strong><div class="admin_product_offers_item_details"><b>${escapeHtml(discount)}</b><span>${escapeHtml(productOfferInputDate(offer.startDate))} - ${escapeHtml(productOfferInputDate(offer.endDate))}</span><span>${escapeHtml(getAdminText("catalogPrice", "Catalog price {price}", { price: formatPrice(product?.price || 0) }))}</span></div></div><span class="admin_product_offers_status ${status.className}">${escapeHtml(status.label)}</span><div class="admin_product_offers_item_actions"><button type="button" data-admin-product-offer-edit="${escapeHtml(offer.slug)}">${escapeHtml(getAdminText("edit", "Edit"))}</button><button type="button" data-admin-product-offer-toggle="${escapeHtml(offer.slug)}">${escapeHtml(offer.enabled === true ? getAdminText("disable", "Disable") : getAdminText("enable", "Enable"))}</button><button type="button" data-admin-product-offer-delete="${escapeHtml(offer.slug)}">${escapeHtml(getAdminText("delete", "Delete"))}</button></div></article>`;
  }).join("");
}

async function fetchProductOffers() {
  const token = await currentUser.getIdToken();
  const response = await fetch("/api/admin-actions?action=getProductOffers", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || getAdminText("productOffersCouldNotLoad", "Product offers could not be loaded."));
  productOffers = body.offers || [];
  renderProductOffers();
}

async function productOfferRequest(method, payload = {}) {
  const token = await currentUser.getIdToken();
  const actionMap = { POST: "saveProductOffer", PUT: "saveProductOffer", PATCH: "setProductOfferEnabled", DELETE: "deleteProductOffer" };
  const response = await fetch(`/api/admin-actions?action=${actionMap[method]}`, { method, cache: "no-store", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || getAdminText("productOfferCouldNotSave", "Product offer could not be saved."));
  return body;
}

async function saveProductOfferFromForm() {
  const product = getProductOfferProduct();
  const startDate = getElement("adminProductOfferStartDate").value;
  const endDate = getElement("adminProductOfferEndDate").value;
  const discountType = getElement("adminProductOfferType").value;
  const discountValue = Number(getElement("adminProductOfferValue").value);
  if (!product || !startDate || !endDate || !Number.isFinite(discountValue) || discountValue <= 0) throw new Error(getAdminText("selectOfferFields", "Select a product, dates, and a positive discount."));
  if (new Date(endDate) <= new Date(startDate)) throw new Error(getAdminText("endDateAfterStart", "End date must be after start date."));
  if (discountType === "percentage" && discountValue > 100) throw new Error(getAdminText("percentageMax", "Percentage discount cannot exceed 100%."));
  if (discountType === "fixed" && discountValue >= Number(product.price)) throw new Error(getAdminText("fixedLessThanPrice", "Fixed discount must be less than the product price."));
  await productOfferRequest("POST", { offer: { slug: product.id, productPrice: Number(product.price), enabled: getElement("adminProductOfferEnabled").checked, discountType, discountValue, startDate, endDate, priority: Number(getElement("adminProductOfferPriority").value) || 0, title: getElement("adminProductOfferTitle").value, badgeText: getElement("adminProductOfferBadgeText").value } });
  await fetchProductOffers(); resetProductOfferForm(); emitToast(getAdminText("productOfferSaved", "Product offer saved."), "success");
}

function editProductOffer(slug) {
  const offer = productOffers.find((item) => item.slug === slug); if (!offer) return;
  renderProductOfferProductOptions(); getElement("adminProductOfferOriginalSlug").value = offer.slug; getElement("adminProductOfferSlug").value = offer.slug; getElement("adminProductOfferSlug").disabled = true; getElement("adminProductOfferType").value = offer.discountType; getElement("adminProductOfferValue").value = offer.discountValue; getElement("adminProductOfferStartDate").value = productOfferInputDate(offer.startDate); getElement("adminProductOfferEndDate").value = productOfferInputDate(offer.endDate); getElement("adminProductOfferPriority").value = offer.priority || 0; getElement("adminProductOfferTitle").value = offer.title || ""; getElement("adminProductOfferBadgeText").value = offer.badgeText || ""; getElement("adminProductOfferEnabled").checked = offer.enabled === true; updateProductOfferPreview();
}

function renderOrders() {
  const groupsEl = getElement("adminOrdersGroups");
  const listEl = getElement("adminOrdersList");
  const actionedListEl = getElement("adminActionedOrdersList");
  const emptyEl = getElement("adminOrdersEmptyState");
  const filteredOrders = getFilteredOrders();
  const needsActionOrders = filteredOrders.filter((order) => !isActionedOrder(order));
  const actionedOrders = filteredOrders.filter(isActionedOrder);
  const visibleOrders = activeOrdersSection === "actioned" ? actionedOrders : needsActionOrders;
  const newCountEl = getElement("adminNewOrdersCount");
  const actionedCountEl = getElement("adminActionedOrdersCount");

  renderSummary(filteredOrders);
  renderFilterButtons();
  renderQueueTabs(needsActionOrders.length, actionedOrders.length);
  setActiveAdminSection(activeAdminSection, { updateHash: false });

  if (emptyEl) {
    emptyEl.hidden = !isOrdersAdminSection() || visibleOrders.length > 0;
  }

  if (groupsEl) {
    groupsEl.hidden = !isOrdersAdminSection() || visibleOrders.length === 0;
  }

  if (newCountEl) {
    newCountEl.textContent = String(needsActionOrders.length);
  }

  if (actionedCountEl) {
    actionedCountEl.textContent = String(actionedOrders.length);
  }

  if (!listEl || !actionedListEl) {
    return;
  }

  const needsActionGroup = listEl.closest(".admin_orders_group");
  const actionedGroup = actionedListEl.closest(".admin_orders_group");
  if (needsActionGroup) {
    needsActionGroup.hidden = activeAdminSection !== "new-orders" || activeOrdersSection !== "needs_action";
  }
  if (actionedGroup) {
    actionedGroup.hidden = activeAdminSection !== "actioned-orders" || activeOrdersSection !== "actioned";
  }

  if (!visibleOrders.length) {
    listEl.innerHTML = "";
    actionedListEl.innerHTML = "";
    return;
  }

  if (activeOrdersSection === "needs_action") {
    listEl.innerHTML = needsActionOrders.map(renderOrderCard).join("");
    actionedListEl.innerHTML = "";
  } else {
    listEl.innerHTML = "";
    actionedListEl.innerHTML = actionedOrders.map(renderOrderCard).join("");
  }
}

function renderOrdersLegacyUnused() {
  const listEl = getElement("adminOrdersList");
  const filteredOrders = getFilteredOrders();

  listEl.innerHTML = filteredOrders.map((order) => {
    const orderId = order.orderId || order.orderReference || order.id;
    const status = normalizeStatus(order.orderStatus);
    const isUpdating = updatingOrderIds.has(order.id);
    const statusClass = STATUS_ACCENT_CLASSES[status] || "pending";
    const paymentStatus = getPaymentStatusMeta(order);
    const customerName = getOrderField(order, "customerName", "name");
    const phone = getOrderField(order, "phone", "phone");
    const city = getOrderCity(order);
    const address = getOrderAddress(order);
    const whatsappUrl = getWhatsAppUrl(order);

    return `
      <article class="admin_order_card admin_order_card_${escapeHtml(statusClass)}" data-order-id="${escapeHtml(order.id)}">
        <div class="admin_order_head">
          <span class="admin_order_timestamp">${escapeHtml(formatOrderDate(order.createdAt))}</span>
          <div class="admin_order_identity">
            <span class="admin_order_short_id">${escapeHtml(formatShortOrderId(orderId))}</span>
            <button class="admin_order_copy_btn" type="button" data-copy-order-id="${escapeHtml(orderId)}" aria-label="${escapeHtml(getAdminText("copyOrderId", "Copy Order ID"))}" title="${escapeHtml(getAdminText("copyOrderId", "Copy Order ID"))}">
              <i class="fa fa-clipboard" aria-hidden="true"></i>
            </button>
          </div>
          <strong class="admin_order_total">${escapeHtml(formatOrderPrice(order))}</strong>
        </div>

        <div class="orders_badges" aria-label="${escapeHtml(getAdminText("orderStatus", "Order Status"))}">
          <span class="orders_badge orders_badge_payment orders_badge_payment_${escapeHtml(paymentStatus.className)}">${escapeHtml(paymentStatus.label)}</span>
          <span class="orders_badge orders_badge_order orders_badge_order_${escapeHtml(statusClass)}">${escapeHtml(getStatusLabel(order.orderStatus))}</span>
        </div>

        <div class="admin_order_customer_grid">
          <div class="admin_order_field">
            <span class="admin_order_field_label">${escapeHtml(getAdminText("name", "Name"))}</span>
            <strong class="admin_order_field_value"><i class="fa fa-user-o" aria-hidden="true"></i><span>${escapeHtml(customerName)}</span></strong>
          </div>
          <div class="admin_order_field">
            <span class="admin_order_field_label">${escapeHtml(getAdminText("phone", "Phone"))}</span>
            <strong class="admin_order_field_value admin_order_field_value_phone">
              <i class="fa fa-phone" aria-hidden="true"></i>
              <span>${escapeHtml(phone)}</span>
              ${whatsappUrl ? `<a class="admin_order_whatsapp_btn" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(getAdminText("contactCustomerWhatsapp", "Contact customer on WhatsApp"))}" title="${escapeHtml(getAdminText("contactOnWhatsapp", "Contact on WhatsApp"))}"><i class="fa fa-whatsapp" aria-hidden="true"></i></a>` : ""}
            </strong>
          </div>
          <div class="admin_order_field">
            <span class="admin_order_field_label">${escapeHtml(getAdminText("city", "City"))}</span>
            <strong class="admin_order_field_value"><i class="fa fa-building-o" aria-hidden="true"></i><span>${escapeHtml(city)}</span></strong>
          </div>
          <div class="admin_order_field">
            <span class="admin_order_field_label">${escapeHtml(getAdminText("paymentStatus", "Payment Status"))}</span>
            <strong class="admin_order_field_value"><i class="fa fa-credit-card" aria-hidden="true"></i><span>${escapeHtml(formatStatusText(order.paymentStatus || order.status))}</span></strong>
          </div>
        </div>

        <div class="admin_order_address_row">
          <i class="fa fa-map-marker" aria-hidden="true"></i>
          <span>${escapeHtml(address)}</span>
        </div>

        <div class="admin_order_full_id_block">
          <button class="admin_order_id_toggle" type="button" data-toggle-order-id="${escapeHtml(order.id)}" aria-expanded="false" aria-controls="adminOrderFullId-${escapeHtml(order.id)}">
            ${escapeHtml(getAdminText("orderId", "Order ID"))} <span aria-hidden="true">▼</span>
          </button>
          <div class="admin_order_full_id_value" id="adminOrderFullId-${escapeHtml(order.id)}" hidden>
            ${escapeHtml(orderId)}
          </div>
        </div>

        ${renderOrderItems(order)}

        <div class="admin_order_status_form">
          <select data-admin-order-status="${escapeHtml(order.id)}" ${isUpdating ? "disabled" : ""} aria-label="${escapeHtml(getAdminText("updateStatus", "Update order status"))}">
            ${renderStatusOptions(status)}
          </select>
          <button type="button" data-admin-order-update="${escapeHtml(order.id)}" disabled>
            ${isUpdating ? escapeHtml(getAdminText("updating", "Updating...")) : escapeHtml(getAdminText("save", "Save"))}
          </button>
        </div>
      </article>
    `;
  }).join("");
}

function snapshotToOrders(snapshot) {
  return snapshot.docs
    .map((orderDoc) => ({
      id: orderDoc.id,
      ...orderDoc.data()
    }))
    .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
}

function subscribeToAdminOrders() {
  if (unsubscribeOrders) {
    unsubscribeOrders();
    unsubscribeOrders = null;
  }

  setPageState("dashboard");
  setIntroText(getAdminText("signedInAs", "Signed in as {email}. Showing all Firestore orders.", { email: currentUser.email }));

  unsubscribeOrders = onSnapshot(
    collection(db, "orders"),
    (snapshot) => {
      allOrders = snapshotToOrders(snapshot);
      renderOrders();
    },
    (error) => {
      console.error("Admin orders listener failed.", error);
      setPageState("error", getAdminText("ordersLoadFailed", "We could not load admin orders. Check that the admin Firestore rules are deployed."));
      setIntroText(getAdminText("firestoreRejected", "Admin access was confirmed, but Firestore rejected the orders query."));
      emitToast(getAdminText("ordersCouldNotLoad", "Admin orders could not be loaded."), "error");
    }
  );

  fetchAdminCheckoutSettings().catch((error) => {
    console.error("Checkout settings load failed.", error);
    emitToast(error.message || getAdminText("checkoutSettingsCouldNotLoad", "Checkout settings could not be loaded."), "error");
  });
}

function getOrderById(orderId) {
  return allOrders.find((order) => order.id === orderId) || null;
}

function getStatusSelect(orderId) {
  return document.querySelector(`[data-admin-order-status="${escapeSelectorValue(orderId)}"]`);
}

function getUpdateButton(orderId) {
  return document.querySelector(`[data-admin-order-update="${escapeSelectorValue(orderId)}"]`);
}

function setOrderUpdating(orderId, isUpdating) {
  if (isUpdating) {
    updatingOrderIds.add(orderId);
  } else {
    updatingOrderIds.delete(orderId);
  }

  const select = getStatusSelect(orderId);
  const button = getUpdateButton(orderId);

  if (select) {
    select.disabled = isUpdating;
  }

  if (button) {
    const order = getOrderById(orderId);
    const changed = select && order
      ? normalizeStatus(select.value) !== normalizeStatus(order.orderStatus)
      : false;

    button.disabled = isUpdating || !changed;
    button.textContent = isUpdating
      ? getAdminText("updating", "Updating...")
      : (changed ? getAdminText("save", "Save") : getAdminText("saved", "Saved"));
  }
}

async function syncAdminOrderStatus(orderId, orderStatus) {
  if (!currentUser || typeof currentUser.getIdToken !== "function") {
    throw new Error(getAdminText("signInAgainOrders", "Please sign in again before updating orders."));
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch("/api/admin-actions?action=updateOrderStatus", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${idToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      orderId,
      orderStatus
    })
  });
  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Admin order status API failed.", {
      status: response.status,
      response: responseBody
    });
    throw new Error(responseBody.error || getAdminText("orderStatusSyncFailed", "Order status could not be synced to customer orders."));
  }

  return responseBody;
}

async function updateOrderStatus(orderId) {
  if (!currentUser || !isAdminUser(currentUser)) {
    emitToast(getAdminText("onlyAdminsUpdateOrders", "Only admin users can update orders."), "error");
    return;
  }

  const order = getOrderById(orderId);
  const select = getStatusSelect(orderId);
  if (!order || !select) {
    emitToast(getAdminText("orderUnavailable", "This order is no longer available."), "error");
    return;
  }

  const nextStatus = normalizeStatus(select.value);
  const currentStatus = normalizeStatus(order.orderStatus);
  if (nextStatus === currentStatus) {
    return;
  }

  setOrderUpdating(orderId, true);

  try {
    const result = await syncAdminOrderStatus(orderId, nextStatus);
    order.orderStatus = result.orderStatus || nextStatus;
    order.updatedAt = result.updatedAt || order.updatedAt;
    emitToast(getAdminText("orderStatusUpdated", "Order status updated."), "success");
  } catch (error) {
    console.error("Order status update failed.", error);
    emitToast(error.message || getAdminText("orderStatusCouldNotUpdate", "Order status could not be updated."), "error");
  } finally {
    updatingOrderIds.delete(orderId);
    renderOrders();
  }
}

function bindDashboardEvents() {
  document.addEventListener("click", (event) => {
    const filterButton = event.target.closest("[data-admin-order-filter]");
    if (filterButton) {
      activeFilter = filterButton.getAttribute("data-admin-order-filter") || "all";
      if (activeFilter !== "all") {
        activeOrdersSection = isActionedFilter(activeFilter) ? "actioned" : "needs_action";
        setActiveAdminSection(getAdminSectionForOrdersSection(activeOrdersSection));
      }
      renderOrders();
      return;
    }

    const sectionButton = event.target.closest("[data-admin-orders-section]");
    if (sectionButton) {
      activeOrdersSection = sectionButton.getAttribute("data-admin-orders-section") === "actioned"
        ? "actioned"
        : "needs_action";
      setActiveAdminSection(getAdminSectionForOrdersSection(activeOrdersSection));
      renderOrders();
      return;
    }

    const adminNavLink = event.target.closest("[data-admin-nav-section]");
    if (adminNavLink) {
      event.preventDefault();
      activeFilter = "all";
      setActiveAdminSection(adminNavLink.getAttribute("data-admin-nav-section"));
      renderOrders();
      return;
    }

    const updateButton = event.target.closest("[data-admin-order-update]");
    if (updateButton) {
      updateOrderStatus(updateButton.getAttribute("data-admin-order-update"));
      return;
    }

    const copyButton = event.target.closest("[data-copy-order-id]");
    if (copyButton) {
      const orderId = copyButton.getAttribute("data-copy-order-id") || "";
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(orderId)
          .then(() => emitToast(getAdminText("orderIdCopied", "Order ID copied."), "success"))
          .catch(() => emitToast(getAdminText("orderIdCopyFailed", "Could not copy Order ID."), "error"));
      } else {
        emitToast(getAdminText("clipboardUnavailable", "Clipboard is not available on this device."), "info");
      }
      return;
    }

    const orderIdToggle = event.target.closest("[data-toggle-order-id]");
    if (orderIdToggle) {
      const orderId = orderIdToggle.getAttribute("data-toggle-order-id");
      const panel = orderId ? getElement(`adminOrderFullId-${orderId}`) : null;
      const shouldExpand = orderIdToggle.getAttribute("aria-expanded") !== "true";

      orderIdToggle.setAttribute("aria-expanded", String(shouldExpand));
      orderIdToggle.innerHTML = `${escapeHtml(getAdminText("orderId", "Order ID"))} <span aria-hidden="true">${shouldExpand ? "&#9650;" : "&#9660;"}</span>`;
      if (panel) {
        panel.hidden = !shouldExpand;
      }
      return;
    }

    if (event.target.closest("#adminOrdersRefreshBtn")) {
      if (currentUser && isAdminUser(currentUser)) {
        subscribeToAdminOrders();
        emitToast(getAdminText("ordersRefreshed", "Orders refreshed."), "success");
      }
      return;
    }

    if (event.target.closest("#adminCheckoutSettingsRefreshBtn")) {
      fetchAdminCheckoutSettings()
        .then(() => emitToast(getAdminText("checkoutSettingsRefreshed", "Checkout settings refreshed."), "success"))
        .catch((error) => emitToast(error.message || getAdminText("checkoutSettingsCouldNotRefresh", "Checkout settings could not be refreshed."), "error"));
      return;
    }

    if (event.target.closest("#adminInventoryRefreshBtn")) {
      subscribeToAdminInventory();
      emitToast(getAdminText("inventoryRefreshed", "Inventory refreshed."), "success");
      return;
    }

    if (event.target.closest("#adminInventorySaveAllBtn")) {
      const saveAllButton = getElement("adminInventorySaveAllBtn");
      saveAllVisibleInventory()
        .catch((error) => { console.error("Save all inventory failed.", error); emitToast(error.message || getAdminText("inventoryCouldNotFullySave", "Inventory could not be fully saved."), "error"); })
        .finally(() => { if (saveAllButton) { saveAllButton.disabled = false; window.setTimeout(() => { saveAllButton.textContent = getAdminText("saveAll", "Save All"); }, 1600); } });
      return;
    }

    if (event.target.closest("#adminProductDraftRefreshBtn")) {
      fetchAdminProductDrafts()
        .then(() => emitToast(getAdminText("productDraftsRefreshed", "Product drafts refreshed."), "success"))
        .catch((error) => emitToast(error.message || getAdminText("productDraftsCouldNotLoad", "Product drafts could not be loaded."), "error"));
      return;
    }

    const productDraftEdit = event.target.closest("[data-admin-product-draft-edit]");
    if (productDraftEdit) {
      editAdminProductDraft(productDraftEdit.getAttribute("data-admin-product-draft-edit"));
      return;
    }

    const productDraftArchive = event.target.closest("[data-admin-product-draft-archive]");
    if (productDraftArchive) {
      const slug = productDraftArchive.getAttribute("data-admin-product-draft-archive");
      archiveAdminProductDraft(slug)
        .catch((error) => {
          const message = error.message || getAdminText("productDraftCouldNotArchive", "Product draft could not be archived.");
          setProductDraftStatus(`${getAdminText("productDraftCouldNotArchive", "Product draft could not be archived.")}: ${message}`, "error");
          emitToast(message, "error");
        });
      return;
    }

    if (event.target.closest("#adminProductDraftSaveBtn")) {
      event.preventDefault();
      saveAdminProductDraftFromForm().catch((error) => {
        console.error("Product draft save failed.", error);
        emitToast(error.message || getAdminText("productDraftCouldNotSave", "Product draft could not be saved."), "error");
      });
      return;
    }

    if (event.target.closest("#adminProductDraftResetBtn")) {
      resetProductDraftForm();
      return;
    }

    if (event.target.matches("#adminInventoryTrackAll")) {
      document.querySelectorAll("[data-inventory-track]").forEach((input) => { input.checked = event.target.checked; });
      syncTrackStockAll();
      return;
    }

    if (event.target.matches("[data-inventory-track]")) {
      syncTrackStockAll();
      return;
    }


    const editCouponButton = event.target.closest("[data-admin-coupon-edit]");
    if (editCouponButton) {
      const code = editCouponButton.getAttribute("data-admin-coupon-edit");
      const coupon = (checkoutSettings.coupons || []).find((item) => item.code === code);
      if (coupon) {
        fillCouponForm(coupon);
      }
      return;
    }

    const toggleCouponButton = event.target.closest("[data-admin-coupon-toggle]");
    if (toggleCouponButton) {
      toggleCoupon(toggleCouponButton.getAttribute("data-admin-coupon-toggle"))
        .catch((error) => emitToast(error.message || getAdminText("promoCodeCouldNotUpdate", "Promo code could not be updated."), "error"));
      return;
    }

    const deleteCouponButton = event.target.closest("[data-admin-coupon-delete]");
    if (deleteCouponButton) {
      deleteCouponFromSettings(deleteCouponButton.getAttribute("data-admin-coupon-delete"))
        .catch((error) => emitToast(error.message || getAdminText("promoCodeCouldNotDelete", "Promo code could not be deleted."), "error"));
      return;
    }

    if (event.target.closest("#adminCouponResetBtn")) {
      resetCouponForm();
    }
    const productOfferEdit = event.target.closest("[data-admin-product-offer-edit]");
    if (productOfferEdit) { editProductOffer(productOfferEdit.getAttribute("data-admin-product-offer-edit")); return; }
    const productOfferToggle = event.target.closest("[data-admin-product-offer-toggle]");
    if (productOfferToggle) { const slug = productOfferToggle.getAttribute("data-admin-product-offer-toggle"); const offer = productOffers.find((item) => item.slug === slug); productOfferRequest("PATCH", { slug, enabled: offer?.enabled !== true }).then(fetchProductOffers).then(() => emitToast(getAdminText("productOfferUpdated", "Product offer updated."), "success")).catch((error) => emitToast(error.message || getAdminText("productOfferCouldNotSave", "Product offer could not be saved."), "error")); return; }
    const productOfferDelete = event.target.closest("[data-admin-product-offer-delete]");
    if (productOfferDelete) { productOfferRequest("DELETE", { slug: productOfferDelete.getAttribute("data-admin-product-offer-delete") }).then(fetchProductOffers).then(() => emitToast(getAdminText("productOfferDeleted", "Product offer deleted."), "success")).catch((error) => emitToast(error.message || getAdminText("productOfferCouldNotSave", "Product offer could not be saved."), "error")); return; }
    if (event.target.closest("#adminProductOfferResetBtn")) resetProductOfferForm();
  });

  document.addEventListener("change", (event) => {
    const statusSelect = event.target.closest("[data-admin-order-status]");
    if (!statusSelect) {
      return;
    }

    const orderId = statusSelect.getAttribute("data-admin-order-status");
    const order = getOrderById(orderId);
    const updateButton = getUpdateButton(orderId);
    if (!order || !updateButton) {
      return;
    }

    const changed = normalizeStatus(statusSelect.value) !== normalizeStatus(order.orderStatus);
    updateButton.disabled = !changed || updatingOrderIds.has(orderId);
    updateButton.textContent = changed ? getAdminText("save", "Save") : getAdminText("saved", "Saved");
  });

  const shippingForm = getElement("adminShippingRatesForm");
  if (shippingForm) {
    shippingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveShippingRatesFromForm().catch((error) => {
        console.error("Shipping rates save failed.", error);
        emitToast(error.message || getAdminText("shippingRatesCouldNotSave", "Shipping rates could not be saved."), "error");
      });
    });
  }

  const couponForm = getElement("adminCouponForm");
  if (couponForm) {
    couponForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveCouponFromForm().catch((error) => {
        console.error("Coupon save failed.", error);
        emitToast(error.message || getAdminText("promoCodeCouldNotSave", "Promo code could not be saved."), "error");
      });
    });
  }
  const productOfferForm = getElement("adminProductOfferForm");
  if (productOfferForm) productOfferForm.addEventListener("submit", (event) => { event.preventDefault(); saveProductOfferFromForm().catch((error) => emitToast(error.message || getAdminText("productOfferCouldNotSave", "Product offer could not be saved."), "error")); });
  ["adminProductOfferSlug", "adminProductOfferType", "adminProductOfferValue"].forEach((id) => getElement(id)?.addEventListener("input", updateProductOfferPreview));

  const productDraftForm = getElement("adminProductDraftForm");
  if (productDraftForm) {
    productDraftForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveAdminProductDraftFromForm().catch((error) => {
        console.error("Product draft save failed.", error);
        emitToast(error.message || getAdminText("productDraftCouldNotSave", "Product draft could not be saved."), "error");
      });
    });
  }

  const productDraftSlug = getElement("adminProductDraftSlug");
  if (productDraftSlug) {
    productDraftSlug.addEventListener("blur", () => {
      productDraftSlug.value = normalizeProductDraftSlug(productDraftSlug.value);
    });
  }

  const productDraftSearch = getElement("adminProductDraftSearch");
  if (productDraftSearch) {
    productDraftSearch.addEventListener("input", () => {
      productDraftSearchQuery = String(productDraftSearch.value || "").trim().toLowerCase();
      renderProductDrafts();
    });
  }

  const productDraftStatus = getElement("adminProductDraftStatusFilter");
  if (productDraftStatus) {
    productDraftStatus.addEventListener("change", () => {
      productDraftStatusFilter = productDraftStatus.value || "all";
      renderProductDrafts();
    });
  }

  const inventorySearch = getElement("adminInventorySearch");
  if (inventorySearch) {
    inventorySearch.addEventListener("input", () => {
      inventorySearchQuery = String(inventorySearch.value || "").trim().toLowerCase();
      renderInventoryEditor();
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  bindDashboardEvents();
  setActiveAdminSection(getAdminSectionFromHash(), { updateHash: false });
  window.addEventListener("hashchange", () => {
    setActiveAdminSection(getAdminSectionFromHash(), { updateHash: false });
    renderOrders();
  });
  setPageState("loading");

  onAuthStateChanged(auth, (user) => {
    currentUser = user || null;

    if (unsubscribeOrders) {
      unsubscribeOrders();
      unsubscribeOrders = null;
    }
    if (unsubscribeInventory) {
      unsubscribeInventory();
      unsubscribeInventory = null;
    }

    if (!currentUser || currentUser.isAnonymous) {
      redirectToLogin();
      return;
    }

    if (!isAdminUser(currentUser)) {
      setPageState("denied");
      setIntroText(getAdminText("signedInNonAdmin", "Signed in as {email}.", { email: currentUser.email || getAdminText("nonAdminUser", "a non-admin user") }));
      return;
    }

    subscribeToAdminOrders();
    subscribeToAdminInventory();
    fetchAdminProductDrafts().catch((error) => { console.error("Product drafts load failed.", error); emitToast(error.message || getAdminText("productDraftsCouldNotLoad", "Product drafts could not be loaded."), "error"); });
    fetchProductOffers().catch((error) => { console.error("Product offers load failed.", error); emitToast(error.message || getAdminText("productOffersCouldNotLoad", "Product offers could not be loaded."), "error"); });
  }, (error) => {
    console.error("Admin auth listener failed.", error);
    setPageState("error", getAdminText("firebaseAuthVerifyFailed", "We could not verify your account. Please refresh and try again."));
    setIntroText(getAdminText("firebaseAuthIntroFailed", "Firebase Auth could not confirm your session."));
  });
});
