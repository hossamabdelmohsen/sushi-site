const { isAdminUser } = require("../lib/server/admin-access.cjs");
const { verifyFirebaseIdToken } = require("../lib/server/firebase-auth.cjs");
const { deleteCoupon, getCheckoutSettings, saveCoupon, saveShippingRates } = require("../lib/server/checkout-settings.cjs");
const { saveInventoryRecord } = require("../lib/server/inventory-storage.cjs");
const { deleteProductOffer, getProductOffer, listProductOffers, saveProductOffer, setProductOfferEnabled } = require("../lib/server/product-offers-storage.cjs");
const { refreshReviewSummary } = require("../lib/server/review-summary-storage.cjs");
const { updateOrderStatusRecord } = require("../lib/server/order-storage.cjs");

const MAX_BODY_BYTES = 256 * 1024;
const ORDER_STATUSES = new Set(["pending", "preparing", "out_for_delivery", "delivered", "cancelled"]);

function sendJson(response, statusCode, payload) { response.statusCode = statusCode; response.setHeader("Content-Type", "application/json; charset=utf-8"); response.setHeader("Cache-Control", "no-store"); response.end(JSON.stringify(payload)); }
function getStatusCode(error) { const value = Number(error?.statusCode); return Number.isInteger(value) && value >= 400 && value < 600 ? value : 500; }
function getAction(request, body = {}) { return String(request.query?.action || body.action || "").trim(); }
function getBearerToken(request, body = {}) { const match = String(request.headers.authorization || request.headers.Authorization || "").match(/^Bearer\s+(.+)$/i); return match ? match[1].trim() : String(body.idToken || body.firebaseIdToken || "").trim(); }
function normalizeStatus(value) { const status = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, ""); return status === "canceled" ? "cancelled" : status; }

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  if (typeof request.body === "string" && request.body.trim()) return JSON.parse(request.body);
  let size = 0; const chunks = [];
  for await (const chunk of request) { size += chunk.length; if (size > MAX_BODY_BYTES) { const error = new Error("Request body is too large."); error.statusCode = 413; throw error; } chunks.push(chunk); }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
}

async function requireAdmin(request, body) {
  const idToken = getBearerToken(request, body);
  if (!idToken) { const error = new Error("Admin sign-in token is required."); error.statusCode = 401; throw error; }
  const user = await verifyFirebaseIdToken(idToken);
  if (!user.emailVerified || !isAdminUser(user)) { const error = new Error("Only verified admin users can perform this action."); error.statusCode = 403; throw error; }
  return user;
}

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") { response.setHeader("Allow", "GET, POST, PUT, PATCH, DELETE, OPTIONS"); response.statusCode = 204; return response.end(); }
  if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return sendJson(response, 405, { error: "Method not allowed." });
  try {
    const body = request.method === "GET" ? {} : await readJsonBody(request);
    const action = getAction(request, body);

    // This action intentionally remains public: existing customer rating submissions call it.
    if (action === "refreshReviewSummary") {
      if (request.method !== "POST") return sendJson(response, 405, { error: "Method not allowed." });
      return sendJson(response, 200, { ok: true, summary: await refreshReviewSummary(body.productId) });
    }

    const admin = await requireAdmin(request, body);
    if (action === "getCheckoutSettings" && request.method === "GET") return sendJson(response, 200, { ok: true, ...(await getCheckoutSettings()) });
    if (action === "saveShippingRates" && request.method === "POST") return sendJson(response, 200, { ok: true, shippingRates: await saveShippingRates(body.shippingRates || {}) });
    if (action === "saveCoupon" && request.method === "POST") return sendJson(response, 200, { ok: true, coupon: await saveCoupon(body.coupon || {}) });
    if (action === "deleteCoupon" && request.method === "POST") return sendJson(response, 200, { ok: true, ...(await deleteCoupon(body.code)) });
    if (action === "saveInventory" && request.method === "POST") return sendJson(response, 200, { ok: true, inventory: await saveInventoryRecord(body.inventory || body, { updatedBy: admin.email || admin.uid || "admin" }) });
    if (action === "getProductOffers" && request.method === "GET") { const slug = String(request.query?.slug || ""); return sendJson(response, 200, { ok: true, offers: slug ? [await getProductOffer(slug)].filter(Boolean) : await listProductOffers() }); }
    if (action === "saveProductOffer" && ["POST", "PUT"].includes(request.method)) return sendJson(response, 200, { ok: true, offer: await saveProductOffer(body.offer || body, admin.email || admin.uid) });
    if (action === "setProductOfferEnabled" && request.method === "PATCH") return sendJson(response, 200, { ok: true, offer: await setProductOfferEnabled(body.slug, body.enabled === true, admin.email || admin.uid) });
    if (action === "deleteProductOffer" && request.method === "DELETE") return sendJson(response, 200, { ok: true, ...(await deleteProductOffer(body.slug)) });
    if (action === "updateOrderStatus" && request.method === "POST") {
      const orderStatus = normalizeStatus(body.orderStatus);
      if (!ORDER_STATUSES.has(orderStatus)) return sendJson(response, 400, { error: "Unsupported order status.", code: "invalid_order_status" });
      const result = await updateOrderStatusRecord(String(body.orderId || "").trim(), orderStatus);
      return sendJson(response, 200, { ok: true, orderId: result.orderId, orderStatus: result.orderStatus, updatedAt: result.updatedAt, mirrorPaths: result.mirrorPaths });
    }
    return sendJson(response, 400, { error: "Unsupported admin action." });
  } catch (error) {
    const statusCode = getStatusCode(error);
    console.error("Admin action API failed.", { action: request.query?.action, statusCode, message: error.message, code: error.code, stack: error.stack });
    return sendJson(response, statusCode, { error: error.message || "Admin action could not be completed.", code: error.code || "admin_action_failed", ...(error.details && Object.keys(error.details).length ? { details: error.details } : {}) });
  }
};
