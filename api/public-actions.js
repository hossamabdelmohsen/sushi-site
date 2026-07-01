const { centsToAmount, getCheckoutSettings, validateCouponForTotals } = require("../lib/server/checkout-settings.cjs");
const { listPublishedAdminProducts } = require("../lib/server/admin-products-storage.cjs");
const { isInventoryEnabled } = require("../lib/server/inventory-storage.cjs");
const { listActiveProductOffers } = require("../lib/server/product-offers-storage.cjs");

const MAX_BODY_BYTES = 128 * 1024;
function sendJson(response, statusCode, payload) { response.statusCode = statusCode; response.setHeader("Content-Type", "application/json; charset=utf-8"); response.setHeader("Cache-Control", "no-store"); response.end(JSON.stringify(payload)); }
function getAction(request, body = {}) { return String(request.query?.action || body.action || "").trim(); }
function moneyToCents(value) { const amount = Number(value); return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : 0; }
function isDynamicProductsEnabled() { const value = String(process.env.SUSHI_ENABLE_DYNAMIC_PRODUCTS || "").trim().toLowerCase(); return value === "true" || value === "1"; }
async function readJsonBody(request) { if (request.body && typeof request.body === "object") return request.body; if (typeof request.body === "string" && request.body.trim()) return JSON.parse(request.body); let size = 0; const chunks = []; for await (const chunk of request) { size += chunk.length; if (size > MAX_BODY_BYTES) { const error = new Error("Request body is too large."); error.statusCode = 413; throw error; } chunks.push(chunk); } return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {}; }

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") { response.setHeader("Allow", "GET, POST, OPTIONS"); response.statusCode = 204; return response.end(); }
  if (!["GET", "POST"].includes(request.method)) return sendJson(response, 405, { error: "Method not allowed." });
  try {
    const body = request.method === "POST" ? await readJsonBody(request) : {};
    const action = getAction(request, body);
    if (action === "checkoutSettings" && request.method === "GET") {
      const settings = await getCheckoutSettings();
      return sendJson(response, 200, { shippingRates: Object.fromEntries(Object.entries(settings.shippingRates).map(([cityId, rate]) => [cityId, { cityId, cityName: rate.cityName, amount: centsToAmount(rate.amountCents), amountCents: rate.amountCents }])) });
    }
    if (action === "inventoryConfig" && request.method === "GET") return sendJson(response, 200, { ok: true, inventoryEnabled: isInventoryEnabled() });
    if (action === "getActiveProductOffers" && request.method === "GET") return sendJson(response, 200, { ok: true, offers: await listActiveProductOffers() });
    if (action === "getPublishedAdminProducts" && request.method === "GET") {
      if (!isDynamicProductsEnabled()) return sendJson(response, 200, { ok: true, enabled: false, products: [] });
      return sendJson(response, 200, { ok: true, enabled: true, products: await listPublishedAdminProducts() });
    }
    if (action === "validateCoupon" && request.method === "POST") {
      const subtotalCents = moneyToCents(body.subtotal); const settings = await getCheckoutSettings(); const cityId = String(body.cityId || "").trim(); const shippingCents = Number(settings.shippingRates[cityId]?.amountCents) || 0;
      const result = validateCouponForTotals({ coupons: settings.coupons, code: body.code, subtotalCents, shippingCents });
      if (!result.valid) return sendJson(response, 400, { valid: false, error: result.message || "Invalid promo code.", shipping: centsToAmount(shippingCents), shippingCents, discount: 0, discountCents: 0, total: centsToAmount(subtotalCents + shippingCents), totalCents: subtotalCents + shippingCents });
      const totalCents = Math.max(0, subtotalCents + shippingCents - result.discountCents);
      return sendJson(response, 200, { valid: true, message: result.message, coupon: { code: result.coupon.code, type: result.coupon.type }, shipping: centsToAmount(shippingCents), shippingCents, discount: centsToAmount(result.discountCents), discountCents: result.discountCents, total: centsToAmount(totalCents), totalCents });
    }
    return sendJson(response, 400, { error: "Unsupported public action." });
  } catch (error) { console.error("Public action API failed.", error); return sendJson(response, getAction(request) === "validateCoupon" ? 400 : 500, { valid: false, error: error.message || "Public action could not be completed." }); }
};
