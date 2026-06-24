import {
  collection,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, db } from "./firebase-config.js?v=20260502b";
import { isAdminUser } from "./admin-access.js?v=20260520a";
import { formatPrice, getAllProducts } from "./product-catalog.js?v=20260602c";
import { emitToast, escapeHtml, timestampToDate } from "./ui-utils.js?v=20260523a";

const ORDER_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" }
];

const FILTER_LABELS = {
  all: "All",
  pending: "Pending",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};

const STATUS_VALUES = new Set(ORDER_STATUSES.map((status) => status.value));
const NEEDS_ACTION_STATUSES = new Set(["pending"]);
const ADMIN_SECTIONS = new Set(["overview", "new-orders", "actioned-orders", "inventory", "shipping", "promo-codes", "product-offers"]);

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
  return ORDER_STATUSES.find((status) => status.value === normalized)?.label || "Pending";
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
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatShortOrderId(orderId) {
  const safeOrderId = String(orderId || "").trim();
  if (!safeOrderId) {
    return "No ID";
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
      <span class="admin_order_section_label">TOTALS</span>
      <div class="admin_order_total_row"><span>Products Subtotal</span><strong>${escapeHtml(formatPrice(subtotal))}</strong></div>
      <div class="admin_order_total_row"><span>Shipping Cost</span><strong>${escapeHtml(formatPrice(shipping))}</strong></div>
      <div class="admin_order_total_row"><span>Total Before Discount</span><strong>${escapeHtml(formatPrice(totalBeforeDiscount))}</strong></div>
      <div class="admin_order_total_row"><span>Discount</span><strong>${escapeHtml(`-${formatPrice(discount)}`)}</strong></div>
      <div class="admin_order_total_row"><span>Coupon code used</span><strong>${escapeHtml(couponCode || "None")}</strong></div>
      <div class="admin_order_total_row admin_order_total_row_final"><span>Final Total</span><strong>${escapeHtml(formatPrice(finalTotal))}</strong></div>
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

function getOrderField(order, primaryKey, customerKey, fallback = "Not available") {
  const customer = getCustomer(order);
  return order?.[primaryKey] || customer?.[customerKey] || fallback;
}

function getOrderAddress(order) {
  const customer = getCustomer(order);
  return order?.address || customer.address || buildAddressFromCustomer(customer) || "Not available";
}

function getOrderCity(order) {
  const customer = getCustomer(order);
  return order?.city || customer.cityName || customer.city || "Not available";
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
    label: isSuccess ? "Payment Success" : isFailed ? "Payment Failed" : `Payment ${formatStatusText(rawStatus)}`,
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
    <option value="${status.value}" ${status.value === normalizedStatus ? "selected" : ""}>${status.label}</option>
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
    return '<p class="orders_item_empty">No item details available.</p>';
  }

  return `
    <div class="admin_order_items_panel">
      <span class="admin_order_section_label">ITEMS</span>
      <ul class="admin_order_items">
      ${items.map((item) => {
        const quantity = Math.max(1, Number(item?.quantity) || 1);
        const itemTotal = formatItemPrice(item) || formatPrice(0);

        return `
          <li class="admin_order_item_row">
            <span class="admin_order_item_name">${escapeHtml(item?.name || item?.productId || item?.id || "Product")}</span>
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
  setIntroText("Redirecting to sign in before opening the admin dashboard.");
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
      button.innerHTML = `${escapeHtml(FILTER_LABELS[filterValue] || "All")} <span class="admin_filter_badge">${statusCounts[filterValue] || 0}</span>`;
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
          <button class="admin_order_copy_btn" type="button" data-copy-order-id="${escapeHtml(orderId)}" aria-label="Copy Order ID" title="Copy Order ID">
            <i class="fa fa-clipboard" aria-hidden="true"></i>
          </button>
          ${whatsappUrl ? `<a class="admin_order_whatsapp_btn" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Contact customer on WhatsApp" title="Contact on WhatsApp"><i class="fa fa-whatsapp" aria-hidden="true"></i></a>` : ""}
        </div>

        <div class="admin_order_address_row">
          <i class="fa fa-map-marker" aria-hidden="true"></i>
          <span>${escapeHtml(address)}</span>
        </div>

        <div class="admin_order_full_id_block">
          <button class="admin_order_id_toggle" type="button" data-toggle-order-id="${escapeHtml(order.id)}" aria-expanded="false" aria-controls="adminOrderFullId-${escapeHtml(order.id)}">
            Order ID <span aria-hidden="true">▼</span>
          </button>
          <div class="admin_order_full_id_value" id="adminOrderFullId-${escapeHtml(order.id)}" hidden>
            ${escapeHtml(orderId)}
          </div>
        </div>

        ${renderOrderItems(order)}
        ${renderOrderTotals(order)}

        <div class="admin_order_status_form">
          <select data-admin-order-status="${escapeHtml(order.id)}" ${isUpdating ? "disabled" : ""} aria-label="Update order status">
            ${renderStatusOptions(status)}
          </select>
          <button type="button" data-admin-order-update="${escapeHtml(order.id)}" disabled>
            ${isUpdating ? "Updating..." : "Save"}
          </button>
        </div>
      </article>
    `;
}

function getCouponTypeLabel(type) {
  const labels = {
    free_shipping: "Free Shipping",
    fixed_discount: "Fixed Discount",
    percentage_discount: "Percentage Discount"
  };
  return labels[type] || "Free Shipping";
}

function formatCouponValue(coupon) {
  if (coupon.type === "free_shipping") {
    return "Shipping only";
  }
  if (coupon.type === "percentage_discount") {
    return `${Number(coupon.value) || 0}%`;
  }
  return formatPrice(Number(coupon.value) || 0);
}

function formatCouponDate(value) {
  if (!value) {
    return "No expiration";
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date)
    : "No expiration";
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
    return "Not tracked";
  }
  if (record.stockQuantity <= 0) {
    return "Out of stock";
  }
  if (record.stockQuantity <= record.lowStockThreshold) {
    return `Only ${record.stockQuantity} left`;
  }
  return "In stock";
}

function ensureInventoryToolbarActions() {
  const toolbar = document.querySelector(".admin_inventory_toolbar");
  if (!toolbar) return;

  if (!getElement("adminInventoryTrackAll")) {
    const trackAll = document.createElement("label");
    trackAll.className = "admin_inventory_track_all";
    trackAll.innerHTML = '<span>Track Stock All</span><input id="adminInventoryTrackAll" type="checkbox">';
    toolbar.appendChild(trackAll);
  }

  if (!getElement("adminInventorySaveAllBtn")) {
    const saveAll = document.createElement("button");
    saveAll.id = "adminInventorySaveAllBtn";
    saveAll.className = "admin_inventory_save_all";
    saveAll.type = "button";
    saveAll.textContent = "Save All Inventory";
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
    countEl.textContent = `${products.length} product${products.length === 1 ? "" : "s"}`;
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
          <span>Stock</span>
          <input type="number" min="0" step="1" value="${escapeHtml(String(record.stockQuantity))}" data-inventory-stock="${escapeHtml(product.id)}">
        </label>
        <label class="admin_inventory_field">
          <span>Low stock threshold</span>
          <input type="number" min="0" step="1" value="${escapeHtml(String(record.lowStockThreshold))}" data-inventory-threshold="${escapeHtml(product.id)}">
        </label>
        <label class="admin_inventory_toggle">
          <input type="checkbox" ${record.trackStock ? "checked" : ""} data-inventory-track="${escapeHtml(product.id)}">
          <span>Track stock</span>
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
      emitToast("Inventory could not be loaded.", "error");
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
    throw new Error("Stock and low stock threshold must be non-negative numbers.");
  }
  return { stockQuantity, lowStockThreshold, trackStock: trackInput?.checked === true };
}

async function saveInventoryFromRow(productId, values = null) {
  if (!currentUser || typeof currentUser.getIdToken !== "function") {
    throw new Error("Please sign in again before updating inventory.");
  }

  const product = getAllProducts().find((item) => item.id === productId);
  if (!product) {
    throw new Error("Product was not found in the catalog.");
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
    throw new Error(body.error || "Inventory could not be saved.");
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
    throw new Error(`${invalid.length} row${invalid.length === 1 ? " has" : "s have"} invalid stock values. Fix them before saving.`);
  }
  if (!pending.length) return;
  if (saveAllButton) { saveAllButton.disabled = true; saveAllButton.textContent = "Saving..."; }
  const results = await Promise.allSettled(pending.map(({ productId, values }) => saveInventoryFromRow(productId, values)));
  const failed = results.filter((result) => result.status === "rejected");
  if (saveAllButton) { saveAllButton.textContent = failed.length ? "Failed to save some items" : "Saved"; }
  if (failed.length) throw new Error(`${failed.length} of ${pending.length} inventory item${pending.length === 1 ? "" : "s"} could not be saved.`);
  emitToast(`${pending.length} inventory item${pending.length === 1 ? "" : "s"} saved.`, "success");
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
    formTitle.textContent = "Create Promo Code";
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
    formTitle.textContent = `Edit ${coupon.code}`;
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
    listEl.innerHTML = '<p class="orders_item_empty">No promo codes yet.</p>';
    return;
  }

  listEl.innerHTML = coupons.map((coupon) => `
    <article class="admin_coupon_card">
      <div>
        <strong>${escapeHtml(coupon.code)}</strong>
        <span>${escapeHtml(getCouponTypeLabel(coupon.type))} - ${escapeHtml(formatCouponValue(coupon))}</span>
      </div>
      <div class="admin_coupon_meta">
        <span>${coupon.enabled === false ? "Disabled" : "Enabled"}</span>
        <span>${escapeHtml(formatCouponDate(coupon.expiresAt))}</span>
        <span>Used ${escapeHtml(String(Number(coupon.usageCount) || 0))}${coupon.usageLimit > 0 ? ` / ${escapeHtml(String(coupon.usageLimit))}` : ""}</span>
      </div>
      <div class="admin_coupon_card_actions">
        <button type="button" data-admin-coupon-edit="${escapeHtml(coupon.code)}">Edit</button>
        <button type="button" data-admin-coupon-toggle="${escapeHtml(coupon.code)}">${coupon.enabled === false ? "Enable" : "Disable"}</button>
        <button type="button" data-admin-coupon-delete="${escapeHtml(coupon.code)}">Delete</button>
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
    throw new Error(body.error || "Checkout settings could not be loaded.");
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
    throw new Error(body.error || "Checkout settings could not be saved.");
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
  emitToast("Shipping rates saved.", "success");
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
  emitToast("Promo code saved.", "success");
}

async function toggleCoupon(code) {
  const coupon = (checkoutSettings.coupons || []).find((item) => item.code === code);
  if (!coupon) {
    emitToast("Promo code was not found.", "error");
    return;
  }
  await syncAdminCheckoutSettings("saveCoupon", {
    coupon: {
      ...coupon,
      enabled: coupon.enabled === false
    }
  });
  await fetchAdminCheckoutSettings();
  emitToast("Promo code updated.", "success");
}

async function deleteCouponFromSettings(code) {
  await syncAdminCheckoutSettings("deleteCoupon", { code });
  await fetchAdminCheckoutSettings();
  resetCouponForm();
  emitToast("Promo code deleted.", "success");
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
  select.innerHTML = '<option value="">Select a catalog product</option>' + getAllProducts().map((product) => `<option value="${escapeHtml(product.id)}">${escapeHtml(product.name)} — ${escapeHtml(formatPrice(product.price))}</option>`).join("");
}

function updateProductOfferPreview() {
  const preview = getElement("adminProductOfferPreview");
  const product = getProductOfferProduct();
  const type = getElement("adminProductOfferType")?.value;
  const value = Number(getElement("adminProductOfferValue")?.value);
  if (!preview || !product || !Number.isFinite(value) || value <= 0 || (type === "percentage" && value > 100) || (type === "fixed" && value >= Number(product.price))) {
    if (preview) preview.innerHTML = '<span>Final price preview</span><strong>Select a product and enter a valid discount to preview the final price.</strong>';
    return;
  }
  const finalPrice = Math.max(0, Number(product.price) - (type === "percentage" ? Number(product.price) * value / 100 : value));
  preview.innerHTML = `<span>Final price preview</span><strong>${escapeHtml(product.name)}: ${escapeHtml(formatPrice(product.price))} → ${escapeHtml(formatPrice(finalPrice))}</strong>`;
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
  if (offer.enabled !== true) return { label: "Disabled", className: "is_disabled" };
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
  if (endDay < currentDay) return { label: "Expired", className: "is_expired" };
  if (startDay > currentDay) return { label: "Scheduled", className: "is_scheduled" };
  return { label: "Active", className: "is_active" };
}

function renderProductOffers() {
  renderProductOfferProductOptions();
  const list = getElement("adminProductOffersList");
  if (!list) return;
  if (!productOffers.length) { list.innerHTML = '<div class="admin_product_offers_empty"><strong>No product offers yet.</strong><span>Create your first transactional offer above.</span></div>'; return; }
  list.innerHTML = productOffers.map((offer) => {
    const product = getAllProducts().find((item) => item.id === offer.slug);
    const status = getProductOfferStatus(offer);
    const discount = offer.discountType === "percentage" ? `${offer.discountValue}% off` : `${formatPrice(offer.discountValue)} off`;
    return `<article class="admin_product_offers_item"><div class="admin_product_offers_item_main"><strong class="admin_product_offers_item_name">${escapeHtml(product?.name || offer.slug)}</strong><div class="admin_product_offers_item_details"><b>${escapeHtml(discount)}</b><span>${escapeHtml(productOfferInputDate(offer.startDate))} – ${escapeHtml(productOfferInputDate(offer.endDate))}</span><span>Catalog price ${escapeHtml(formatPrice(product?.price || 0))}</span></div></div><span class="admin_product_offers_status ${status.className}">${status.label}</span><div class="admin_product_offers_item_actions"><button type="button" data-admin-product-offer-edit="${escapeHtml(offer.slug)}">Edit</button><button type="button" data-admin-product-offer-toggle="${escapeHtml(offer.slug)}">${offer.enabled === true ? "Disable" : "Enable"}</button><button type="button" data-admin-product-offer-delete="${escapeHtml(offer.slug)}">Delete</button></div></article>`;
  }).join("");
}

async function fetchProductOffers() {
  const token = await currentUser.getIdToken();
  const response = await fetch("/api/admin-actions?action=getProductOffers", { cache: "no-store", headers: { Authorization: `Bearer ${token}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Product offers could not be loaded.");
  productOffers = body.offers || [];
  renderProductOffers();
}

async function productOfferRequest(method, payload = {}) {
  const token = await currentUser.getIdToken();
  const actionMap = { POST: "saveProductOffer", PUT: "saveProductOffer", PATCH: "setProductOfferEnabled", DELETE: "deleteProductOffer" };
  const response = await fetch(`/api/admin-actions?action=${actionMap[method]}`, { method, cache: "no-store", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Product offer could not be saved.");
  return body;
}

async function saveProductOfferFromForm() {
  const product = getProductOfferProduct();
  const startDate = getElement("adminProductOfferStartDate").value;
  const endDate = getElement("adminProductOfferEndDate").value;
  const discountType = getElement("adminProductOfferType").value;
  const discountValue = Number(getElement("adminProductOfferValue").value);
  if (!product || !startDate || !endDate || !Number.isFinite(discountValue) || discountValue <= 0) throw new Error("Select a product, dates, and a positive discount.");
  if (new Date(endDate) <= new Date(startDate)) throw new Error("End date must be after start date.");
  if (discountType === "percentage" && discountValue > 100) throw new Error("Percentage discount cannot exceed 100%.");
  if (discountType === "fixed" && discountValue >= Number(product.price)) throw new Error("Fixed discount must be less than the product price.");
  await productOfferRequest("POST", { offer: { slug: product.id, productPrice: Number(product.price), enabled: getElement("adminProductOfferEnabled").checked, discountType, discountValue, startDate, endDate, priority: Number(getElement("adminProductOfferPriority").value) || 0, title: getElement("adminProductOfferTitle").value, badgeText: getElement("adminProductOfferBadgeText").value } });
  await fetchProductOffers(); resetProductOfferForm(); emitToast("Product offer saved.", "success");
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
            <button class="admin_order_copy_btn" type="button" data-copy-order-id="${escapeHtml(orderId)}" aria-label="Copy Order ID" title="Copy Order ID">
              <i class="fa fa-clipboard" aria-hidden="true"></i>
            </button>
          </div>
          <strong class="admin_order_total">${escapeHtml(formatOrderPrice(order))}</strong>
        </div>

        <div class="orders_badges" aria-label="Order statuses">
          <span class="orders_badge orders_badge_payment orders_badge_payment_${escapeHtml(paymentStatus.className)}">${escapeHtml(paymentStatus.label)}</span>
          <span class="orders_badge orders_badge_order orders_badge_order_${escapeHtml(statusClass)}">${escapeHtml(getStatusLabel(order.orderStatus))}</span>
        </div>

        <div class="admin_order_customer_grid">
          <div class="admin_order_field">
            <span class="admin_order_field_label">Name</span>
            <strong class="admin_order_field_value"><i class="fa fa-user-o" aria-hidden="true"></i><span>${escapeHtml(customerName)}</span></strong>
          </div>
          <div class="admin_order_field">
            <span class="admin_order_field_label">Phone</span>
            <strong class="admin_order_field_value admin_order_field_value_phone">
              <i class="fa fa-phone" aria-hidden="true"></i>
              <span>${escapeHtml(phone)}</span>
              ${whatsappUrl ? `<a class="admin_order_whatsapp_btn" href="${escapeHtml(whatsappUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Contact customer on WhatsApp" title="Contact on WhatsApp"><i class="fa fa-whatsapp" aria-hidden="true"></i></a>` : ""}
            </strong>
          </div>
          <div class="admin_order_field">
            <span class="admin_order_field_label">City</span>
            <strong class="admin_order_field_value"><i class="fa fa-building-o" aria-hidden="true"></i><span>${escapeHtml(city)}</span></strong>
          </div>
          <div class="admin_order_field">
            <span class="admin_order_field_label">Payment Status</span>
            <strong class="admin_order_field_value"><i class="fa fa-credit-card" aria-hidden="true"></i><span>${escapeHtml(formatStatusText(order.paymentStatus || order.status))}</span></strong>
          </div>
        </div>

        <div class="admin_order_address_row">
          <i class="fa fa-map-marker" aria-hidden="true"></i>
          <span>${escapeHtml(address)}</span>
        </div>

        <div class="admin_order_full_id_block">
          <button class="admin_order_id_toggle" type="button" data-toggle-order-id="${escapeHtml(order.id)}" aria-expanded="false" aria-controls="adminOrderFullId-${escapeHtml(order.id)}">
            Order ID <span aria-hidden="true">▼</span>
          </button>
          <div class="admin_order_full_id_value" id="adminOrderFullId-${escapeHtml(order.id)}" hidden>
            ${escapeHtml(orderId)}
          </div>
        </div>

        ${renderOrderItems(order)}

        <div class="admin_order_status_form">
          <select data-admin-order-status="${escapeHtml(order.id)}" ${isUpdating ? "disabled" : ""} aria-label="Update order status">
            ${renderStatusOptions(status)}
          </select>
          <button type="button" data-admin-order-update="${escapeHtml(order.id)}" disabled>
            ${isUpdating ? "Updating..." : "Save"}
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
  setIntroText(`Signed in as ${currentUser.email}. Showing all Firestore orders.`);

  unsubscribeOrders = onSnapshot(
    collection(db, "orders"),
    (snapshot) => {
      allOrders = snapshotToOrders(snapshot);
      renderOrders();
    },
    (error) => {
      console.error("Admin orders listener failed.", error);
      setPageState("error", "We could not load admin orders. Check that the admin Firestore rules are deployed.");
      setIntroText("Admin access was confirmed, but Firestore rejected the orders query.");
      emitToast("Admin orders could not be loaded.", "error");
    }
  );

  fetchAdminCheckoutSettings().catch((error) => {
    console.error("Checkout settings load failed.", error);
    emitToast(error.message || "Checkout settings could not be loaded.", "error");
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
    button.textContent = isUpdating ? "Updating..." : (changed ? "Save" : "Saved");
  }
}

async function syncAdminOrderStatus(orderId, orderStatus) {
  if (!currentUser || typeof currentUser.getIdToken !== "function") {
    throw new Error("Please sign in again before updating orders.");
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
    throw new Error(responseBody.error || "Order status could not be synced to customer orders.");
  }

  return responseBody;
}

async function updateOrderStatus(orderId) {
  if (!currentUser || !isAdminUser(currentUser)) {
    emitToast("Only admin users can update orders.", "error");
    return;
  }

  const order = getOrderById(orderId);
  const select = getStatusSelect(orderId);
  if (!order || !select) {
    emitToast("This order is no longer available.", "error");
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
    emitToast("Order status updated.", "success");
  } catch (error) {
    console.error("Order status update failed.", error);
    emitToast(error.message || "Order status could not be updated.", "error");
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
          .then(() => emitToast("Order ID copied.", "success"))
          .catch(() => emitToast("Could not copy Order ID.", "error"));
      } else {
        emitToast("Clipboard is not available on this device.", "info");
      }
      return;
    }

    const orderIdToggle = event.target.closest("[data-toggle-order-id]");
    if (orderIdToggle) {
      const orderId = orderIdToggle.getAttribute("data-toggle-order-id");
      const panel = orderId ? getElement(`adminOrderFullId-${orderId}`) : null;
      const shouldExpand = orderIdToggle.getAttribute("aria-expanded") !== "true";

      orderIdToggle.setAttribute("aria-expanded", String(shouldExpand));
      orderIdToggle.innerHTML = `Order ID <span aria-hidden="true">${shouldExpand ? "▲" : "▼"}</span>`;
      if (panel) {
        panel.hidden = !shouldExpand;
      }
      return;
    }

    if (event.target.closest("#adminOrdersRefreshBtn")) {
      if (currentUser && isAdminUser(currentUser)) {
        subscribeToAdminOrders();
        emitToast("Orders refreshed.", "success");
      }
      return;
    }

    if (event.target.closest("#adminCheckoutSettingsRefreshBtn")) {
      fetchAdminCheckoutSettings()
        .then(() => emitToast("Checkout settings refreshed.", "success"))
        .catch((error) => emitToast(error.message || "Checkout settings could not be refreshed.", "error"));
      return;
    }

    if (event.target.closest("#adminInventoryRefreshBtn")) {
      subscribeToAdminInventory();
      emitToast("Inventory refreshed.", "success");
      return;
    }

    if (event.target.closest("#adminInventorySaveAllBtn")) {
      const saveAllButton = getElement("adminInventorySaveAllBtn");
      saveAllVisibleInventory()
        .catch((error) => { console.error("Save all inventory failed.", error); emitToast(error.message || "Inventory could not be fully saved.", "error"); })
        .finally(() => { if (saveAllButton) { saveAllButton.disabled = false; window.setTimeout(() => { saveAllButton.textContent = "Save All"; }, 1600); } });
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
        .catch((error) => emitToast(error.message || "Promo code could not be updated.", "error"));
      return;
    }

    const deleteCouponButton = event.target.closest("[data-admin-coupon-delete]");
    if (deleteCouponButton) {
      deleteCouponFromSettings(deleteCouponButton.getAttribute("data-admin-coupon-delete"))
        .catch((error) => emitToast(error.message || "Promo code could not be deleted.", "error"));
      return;
    }

    if (event.target.closest("#adminCouponResetBtn")) {
      resetCouponForm();
    }
    const productOfferEdit = event.target.closest("[data-admin-product-offer-edit]");
    if (productOfferEdit) { editProductOffer(productOfferEdit.getAttribute("data-admin-product-offer-edit")); return; }
    const productOfferToggle = event.target.closest("[data-admin-product-offer-toggle]");
    if (productOfferToggle) { const slug = productOfferToggle.getAttribute("data-admin-product-offer-toggle"); const offer = productOffers.find((item) => item.slug === slug); productOfferRequest("PATCH", { slug, enabled: offer?.enabled !== true }).then(fetchProductOffers).then(() => emitToast("Product offer updated.", "success")).catch((error) => emitToast(error.message, "error")); return; }
    const productOfferDelete = event.target.closest("[data-admin-product-offer-delete]");
    if (productOfferDelete) { productOfferRequest("DELETE", { slug: productOfferDelete.getAttribute("data-admin-product-offer-delete") }).then(fetchProductOffers).then(() => emitToast("Product offer deleted.", "success")).catch((error) => emitToast(error.message, "error")); return; }
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
    updateButton.textContent = changed ? "Save" : "Saved";
  });

  const shippingForm = getElement("adminShippingRatesForm");
  if (shippingForm) {
    shippingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveShippingRatesFromForm().catch((error) => {
        console.error("Shipping rates save failed.", error);
        emitToast(error.message || "Shipping rates could not be saved.", "error");
      });
    });
  }

  const couponForm = getElement("adminCouponForm");
  if (couponForm) {
    couponForm.addEventListener("submit", (event) => {
      event.preventDefault();
      saveCouponFromForm().catch((error) => {
        console.error("Coupon save failed.", error);
        emitToast(error.message || "Promo code could not be saved.", "error");
      });
    });
  }
  const productOfferForm = getElement("adminProductOfferForm");
  if (productOfferForm) productOfferForm.addEventListener("submit", (event) => { event.preventDefault(); saveProductOfferFromForm().catch((error) => emitToast(error.message || "Product offer could not be saved.", "error")); });
  ["adminProductOfferSlug", "adminProductOfferType", "adminProductOfferValue"].forEach((id) => getElement(id)?.addEventListener("input", updateProductOfferPreview));

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
      setIntroText(`Signed in as ${currentUser.email || "a non-admin user"}.`);
      return;
    }

    subscribeToAdminOrders();
    subscribeToAdminInventory();
    fetchProductOffers().catch((error) => { console.error("Product offers load failed.", error); emitToast(error.message || "Product offers could not be loaded.", "error"); });
  }, (error) => {
    console.error("Admin auth listener failed.", error);
    setPageState("error", "We could not verify your account. Please refresh and try again.");
    setIntroText("Firebase Auth could not confirm your session.");
  });
});
