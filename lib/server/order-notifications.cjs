const crypto = require("crypto");
const {
  beginFirestoreTransaction,
  buildUpdateWrite,
  cleanDocumentId,
  commitFirestoreTransaction,
  getAccessToken,
  getOwnerOrderPaths,
  getServiceAccount,
  readFirestoreDocumentsInTransaction,
  readOrderRecord,
  saveOrderRecord
} = require("./order-storage.cjs");

const ADMIN_DASHBOARD_URL = "https://www.sushiboxshop.com/admin-orders.html";
const RESEND_EMAIL_URL = "https://api.resend.com/emails";
const NOTIFICATION_LOCK_TTL_MS = 10 * 60 * 1000;

function isEnabled() {
  return String(process.env.SUSHI_ENABLE_ORDER_EMAILS || "").trim().toLowerCase() === "true";
}

function normalizeEmail(value) {
  const raw = String(value || "").trim();
  const mailtoMatch = raw.match(/mailto:([^\s),>\]]+)/i);
  const emailMatch = raw.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);

  return String((mailtoMatch && mailtoMatch[1]) || (emailMatch && emailMatch[0]) || raw)
    .trim()
    .replace(/^mailto:/i, "")
    .replace(/[<>]/g, "")
    .toLowerCase();
}

function getAdminEmails() {
  return String(process.env.SUSHI_ORDER_NOTIFY_EMAILS || "")
    .split(",")
    .map(normalizeEmail)
    .filter((email, index, emails) => email && emails.indexOf(email) === index);
}

function getEmailConfig() {
  return {
    enabled: isEnabled(),
    apiKey: process.env.RESEND_API_KEY || "",
    from: normalizeEmail(process.env.SUSHI_ORDER_EMAIL_FROM || ""),
    to: getAdminEmails()
  };
}

function getOrderId(order = {}, context = {}) {
  return order.orderId
    || order.orderReference
    || order.orderNumber
    || context.orderId
    || context.orderReference
    || "";
}

function isPaidOrder(order = {}) {
  const paymentStatus = String(order.paymentStatus || order.status || "").trim().toLowerCase();
  return order.paid === true || paymentStatus === "paid" || paymentStatus === "success" || paymentStatus === "successful";
}

function isLockFresh(order = {}, now = Date.now()) {
  if (order.adminNotificationSending !== true) {
    return false;
  }

  const startedAt = Date.parse(order.adminNotificationSendingAt || "");
  return Number.isFinite(startedAt) && now - startedAt < NOTIFICATION_LOCK_TTL_MS;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function valueOrFallback(value, fallback = "Not available") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
}

function formatMoneyFromCents(cents, fallback) {
  const numericCents = Number(cents);
  if (Number.isFinite(numericCents)) {
    return `EGP ${(numericCents / 100).toFixed(2)}`;
  }

  const fallbackNumber = Number(fallback);
  if (Number.isFinite(fallbackNumber)) {
    return `EGP ${fallbackNumber.toFixed(2)}`;
  }

  return valueOrFallback(fallback, "EGP 0.00");
}

function getOrderItems(order = {}) {
  return Array.isArray(order.items)
    ? order.items
    : (Array.isArray(order.cartItems) ? order.cartItems : []);
}

function getCustomer(order = {}) {
  return order.customer && typeof order.customer === "object" ? order.customer : {};
}

function getAddress(order = {}) {
  const customer = getCustomer(order);
  return order.address || customer.address || [
    customer.fullAddress,
    customer.area,
    customer.building ? `Building ${customer.building}` : "",
    customer.floorApartment ? `Floor / Apt ${customer.floorApartment}` : "",
    customer.cityName || customer.city
  ].filter(Boolean).join(", ");
}

function getLineUnitPrice(item = {}) {
  return formatMoneyFromCents(
    firstPresent(item.unitAmountCents, item.priceCents),
    firstPresent(item.unitPrice, item.price)
  );
}

function getLineTotal(item = {}) {
  return formatMoneyFromCents(
    firstPresent(item.lineTotalCents, item.totalCents),
    firstPresent(item.lineTotal, item.total)
  );
}

function buildPlainTextEmail(order = {}, context = {}) {
  const customer = getCustomer(order);
  const items = getOrderItems(order);
  const lines = [
    "New Sushi Box paid order",
    "",
    `Order ID: ${valueOrFallback(order.orderId || order.orderReference)}`,
    `Order number: ${valueOrFallback(order.orderNumber)}`,
    `Transaction ID: ${valueOrFallback(context.transactionId || order.transactionId)}`,
    `Customer name: ${valueOrFallback(order.customerName || customer.name)}`,
    `Customer phone: ${valueOrFallback(order.phone || customer.phone)}`,
    `Customer email: ${valueOrFallback(order.email || customer.email)}`,
    `City: ${valueOrFallback(order.city || customer.cityName || customer.city)}`,
    `Address: ${valueOrFallback(getAddress(order))}`,
    `Payment method: ${valueOrFallback(order.paymentMethod)}`,
    `Payment status: ${valueOrFallback(order.paymentStatus || order.status)}`,
    `Order status: ${valueOrFallback(order.orderStatus || order.status)}`,
    "",
    "Items:"
  ];

  if (items.length) {
    items.forEach((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      lines.push(`- ${valueOrFallback(item.name || item.productName || item.productId)} | Qty: ${quantity} | Unit: ${getLineUnitPrice(item)} | Line: ${getLineTotal(item)}`);
    });
  } else {
    lines.push("- No item details available.");
  }

  lines.push(
    "",
    `Products subtotal: ${formatMoneyFromCents(order.subtotalCents, order.subtotal)}`,
    `Shipping cost: ${formatMoneyFromCents(firstPresent(order.shippingFeeCents, order.deliveryFeeCents), firstPresent(order.shippingFee, order.deliveryFee))}`,
    `Discount: ${formatMoneyFromCents(order.discountCents, order.discount)}`,
    `Final total: ${formatMoneyFromCents(firstPresent(order.totalCents, order.amountCents), firstPresent(order.total, order.amount))}`,
    "",
    `Admin dashboard: ${ADMIN_DASHBOARD_URL}`
  );

  return lines.join("\n");
}

function buildHtmlEmail(order = {}, context = {}) {
  const customer = getCustomer(order);
  const items = getOrderItems(order);
  const rows = items.length
    ? items.map((item) => {
      const quantity = Math.max(1, Number(item.quantity) || 1);
      return `
        <tr>
          <td>${escapeHtml(valueOrFallback(item.name || item.productName || item.productId))}</td>
          <td style="text-align:center;">${escapeHtml(quantity)}</td>
          <td style="text-align:right;">${escapeHtml(getLineUnitPrice(item))}</td>
          <td style="text-align:right;">${escapeHtml(getLineTotal(item))}</td>
        </tr>`;
    }).join("")
    : `<tr><td colspan="4">No item details available.</td></tr>`;
  const fieldRows = [
    ["Order ID", order.orderId || order.orderReference],
    ["Order number", order.orderNumber],
    ["Transaction ID", context.transactionId || order.transactionId],
    ["Customer name", order.customerName || customer.name],
    ["Customer phone", order.phone || customer.phone],
    ["Customer email", order.email || customer.email],
    ["City", order.city || customer.cityName || customer.city],
    ["Address", getAddress(order)],
    ["Payment method", order.paymentMethod],
    ["Payment status", order.paymentStatus || order.status],
    ["Order status", order.orderStatus || order.status]
  ].map(([label, value]) => `
    <tr>
      <th style="text-align:left;padding:6px 10px;background:#f7f7f7;width:160px;">${escapeHtml(label)}</th>
      <td style="padding:6px 10px;">${escapeHtml(valueOrFallback(value))}</td>
    </tr>`).join("");
  const totalRows = [
    ["Products subtotal", formatMoneyFromCents(order.subtotalCents, order.subtotal)],
    ["Shipping cost", formatMoneyFromCents(firstPresent(order.shippingFeeCents, order.deliveryFeeCents), firstPresent(order.shippingFee, order.deliveryFee))],
    ["Discount", formatMoneyFromCents(order.discountCents, order.discount)],
    ["Final total", formatMoneyFromCents(firstPresent(order.totalCents, order.amountCents), firstPresent(order.total, order.amount))]
  ].map(([label, value]) => `
    <tr>
      <th style="text-align:left;padding:6px 10px;background:#f7f7f7;">${escapeHtml(label)}</th>
      <td style="text-align:right;padding:6px 10px;font-weight:700;">${escapeHtml(value)}</td>
    </tr>`).join("");

  return `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;color:#202020;line-height:1.45;margin:0;padding:24px;background:#ffffff;">
    <h1 style="font-size:22px;margin:0 0 16px;">New Sushi Box paid order</h1>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:760px;border:1px solid #e5e5e5;margin-bottom:18px;">
      ${fieldRows}
    </table>
    <h2 style="font-size:17px;margin:0 0 10px;">Items</h2>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:760px;border:1px solid #e5e5e5;margin-bottom:18px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 10px;background:#111;color:#fff;">Product</th>
          <th style="text-align:center;padding:8px 10px;background:#111;color:#fff;">Qty</th>
          <th style="text-align:right;padding:8px 10px;background:#111;color:#fff;">Unit price</th>
          <th style="text-align:right;padding:8px 10px;background:#111;color:#fff;">Line total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:420px;border:1px solid #e5e5e5;margin-bottom:18px;">
      ${totalRows}
    </table>
    <p style="margin:0;">
      <a href="${ADMIN_DASHBOARD_URL}" style="color:#b00020;font-weight:700;">Open admin dashboard</a>
    </p>
  </body>
</html>`;
}

async function acquireNotificationLock(order, context = {}) {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    return { locked: false, skipped: true, reason: "storage_not_configured" };
  }

  const rawOrderId = getOrderId(order, context);
  if (!rawOrderId) {
    return { locked: false, skipped: true, reason: "missing_order_id" };
  }

  const orderId = cleanDocumentId(rawOrderId);
  const accessToken = await getAccessToken(serviceAccount);
  const transaction = await beginFirestoreTransaction(serviceAccount, accessToken);
  const orderPath = ["orders", orderId];
  const [storedOrder] = await readFirestoreDocumentsInTransaction(serviceAccount, accessToken, [orderPath], transaction);

  if (!storedOrder) {
    return { locked: false, skipped: true, reason: "order_not_found", orderId };
  }

  if (storedOrder.adminNotificationSent === true) {
    return { locked: false, skipped: true, reason: "already_sent", order: storedOrder, orderId };
  }

  if (isLockFresh(storedOrder)) {
    return { locked: false, skipped: true, reason: "send_in_progress", order: storedOrder, orderId };
  }

  const now = new Date().toISOString();
  const lockPatch = {
    adminNotificationSending: true,
    adminNotificationSendingAt: now,
    adminNotificationLockId: crypto.randomUUID(),
    adminNotificationError: ""
  };
  const ownerPaths = getOwnerOrderPaths(storedOrder, orderId);
  const writes = [
    buildUpdateWrite(serviceAccount, orderPath, lockPatch, {
      fieldPaths: Object.keys(lockPatch),
      mustExist: true
    }),
    ...ownerPaths.map((ownerPath) => buildUpdateWrite(serviceAccount, ownerPath, lockPatch, {
      fieldPaths: Object.keys(lockPatch)
    }))
  ];

  await commitFirestoreTransaction(serviceAccount, accessToken, transaction, writes);

  return {
    locked: true,
    orderId,
    lockId: lockPatch.adminNotificationLockId,
    order: {
      ...storedOrder,
      ...order,
      items: storedOrder.items || order.items,
      cartItems: storedOrder.cartItems || order.cartItems,
      customer: storedOrder.customer || order.customer,
      adminNotificationSending: true,
      adminNotificationSendingAt: now,
      adminNotificationLockId: lockPatch.adminNotificationLockId
    }
  };
}

async function updateNotificationMetadata(order, patch) {
  const rawOrderId = getOrderId(order);
  if (!rawOrderId) {
    return;
  }

  const orderId = cleanDocumentId(rawOrderId);
  await saveOrderRecord({
    orderId,
    orderReference: order.orderReference || orderId,
    uid: order.uid || "",
    guestId: order.guestId || "",
    sessionId: order.sessionId || "",
    ...patch
  }, { merge: true });
}

async function sendAdminOrderEmail(order, context = {}) {
  const config = getEmailConfig();
  if (!config.enabled) {
    console.info("Admin order email notification skipped because SUSHI_ENABLE_ORDER_EMAILS is not true.");
    return { skipped: true, reason: "disabled" };
  }

  if (!config.apiKey) {
    console.info("Admin order email notification skipped because RESEND_API_KEY is not configured.");
    return { skipped: true, reason: "missing_api_key" };
  }

  if (!config.to.length) {
    console.info("Admin order email notification skipped because SUSHI_ORDER_NOTIFY_EMAILS is empty.");
    return { skipped: true, reason: "missing_recipients" };
  }

  if (!config.from) {
    console.info("Admin order email notification skipped because SUSHI_ORDER_EMAIL_FROM is not configured.");
    return { skipped: true, reason: "missing_from" };
  }

  const orderId = getOrderId(order, context);
  const subjectReference = order.orderNumber || order.orderReference || order.orderId || orderId;
  const payload = {
    from: config.from,
    to: config.to,
    subject: `New Sushi Box Paid Order - ${subjectReference}`,
    html: buildHtmlEmail(order, context),
    text: buildPlainTextEmail(order, context)
  };
  const response = await fetch(RESEND_EMAIL_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `sushi-box-admin-order-${cleanDocumentId(orderId)}`
    },
    body: JSON.stringify(payload)
  });
  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = responseBody.message || responseBody.error || `Email provider returned ${response.status}.`;
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  return {
    skipped: false,
    provider: "resend",
    providerMessageId: responseBody.id || ""
  };
}

async function notifyAdminNewOrder(order = {}, context = {}) {
  if (!isPaidOrder(order)) {
    console.info("Admin order email notification skipped because order is not paid.", {
      orderReference: getOrderId(order, context)
    });
    return { skipped: true, reason: "not_paid" };
  }

  const config = getEmailConfig();
  if (!config.enabled) {
    console.info("Admin order email notification skipped because SUSHI_ENABLE_ORDER_EMAILS is not true.");
    return { skipped: true, reason: "disabled" };
  }

  if (!config.apiKey) {
    console.info("Admin order email notification skipped because RESEND_API_KEY is not configured.");
    return { skipped: true, reason: "missing_api_key" };
  }

  if (!config.to.length) {
    console.info("Admin order email notification skipped because SUSHI_ORDER_NOTIFY_EMAILS is empty.");
    return { skipped: true, reason: "missing_recipients" };
  }

  if (!config.from) {
    console.info("Admin order email notification skipped because SUSHI_ORDER_EMAIL_FROM is not configured.");
    return { skipped: true, reason: "missing_from" };
  }

  let lock;
  try {
    lock = await acquireNotificationLock(order, context);
  } catch (error) {
    console.error("Admin order email notification skipped because the duplicate-send lock could not be acquired.", {
      orderReference: getOrderId(order, context),
      message: error.message
    });
    return { skipped: true, reason: "lock_failed" };
  }

  if (!lock.locked) {
    console.info("Admin order email notification skipped.", {
      orderReference: lock.orderId || getOrderId(order, context),
      reason: lock.reason
    });
    return { skipped: true, reason: lock.reason };
  }

  const storedOrder = lock.order || await readOrderRecord(lock.orderId) || order;
  try {
    const result = await sendAdminOrderEmail(storedOrder, {
      ...context,
      orderId: lock.orderId
    });

    if (result.skipped) {
      await updateNotificationMetadata(storedOrder, {
        adminNotificationSending: false,
        adminNotificationSendingAt: "",
        adminNotificationLockId: "",
        adminNotificationError: `Skipped: ${result.reason || "not_configured"}`
      }).catch((error) => {
        console.error("Unable to store skipped admin notification metadata.", {
          orderReference: lock.orderId,
          message: error.message
        });
      });
      return result;
    }

    await updateNotificationMetadata(storedOrder, {
      adminNotificationSent: true,
      adminNotificationSentAt: new Date().toISOString(),
      adminNotificationSending: false,
      adminNotificationSendingAt: "",
      adminNotificationLockId: "",
      adminNotificationError: "",
      adminNotificationProvider: result.provider,
      adminNotificationProviderMessageId: result.providerMessageId
    }).catch((error) => {
      console.error("Admin order email was sent, but notification metadata could not be stored.", {
        orderReference: lock.orderId,
        message: error.message
      });
    });

    console.info("Admin order email notification sent successfully.", {
      orderReference: lock.orderId,
      recipients: config.to.length,
      provider: result.provider
    });
    return result;
  } catch (error) {
    const message = String(error.message || "Email notification failed.").slice(0, 500);
    console.error("Admin order email notification failed.", {
      orderReference: lock.orderId,
      message,
      statusCode: error.statusCode || ""
    });

    await updateNotificationMetadata(storedOrder, {
      adminNotificationSending: false,
      adminNotificationSendingAt: "",
      adminNotificationLockId: "",
      adminNotificationError: message
    }).catch((storageError) => {
      console.error("Unable to store failed admin notification metadata.", {
        orderReference: lock.orderId,
        message: storageError.message
      });
    });

    return { skipped: false, failed: true, error: message };
  }
}

module.exports = {
  notifyAdminNewOrder,
  sendAdminOrderEmail
};
