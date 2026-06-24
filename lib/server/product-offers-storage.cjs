const {
  getAccessToken,
  getServiceAccount,
  readFirestoreDocument,
  commitFirestoreWrites,
  buildUpdateWrite
} = require("./order-storage.cjs");

const PRODUCT_OFFERS_COLLECTION = "productOffers";
const DISCOUNT_TYPES = new Set(["percentage", "fixed"]);

function createOfferError(message, code = "product_offer_error", statusCode = 400) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function normalizeSlug(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 150);
}

function normalizeDate(value, isEndDate) {
  const source = String(value || "").trim();
  if (!source) throw createOfferError("Start and end dates are required.", "missing_offer_dates");
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(source)
    ? `${source}T${isEndDate ? "23:59:59.999" : "00:00:00.000"}Z`
    : source);
  if (!Number.isFinite(date.getTime())) throw createOfferError("Offer dates must be valid.", "invalid_offer_dates");
  return date.toISOString();
}

function normalizeOffer(input = {}, options = {}) {
  const slug = normalizeSlug(input.slug || options.slug);
  const discountType = String(input.discountType || "").trim().toLowerCase();
  const discountValue = Math.round(Number(input.discountValue) * 100) / 100;
  const productPrice = Number(input.productPrice);
  const startDate = normalizeDate(input.startDate, false);
  const endDate = normalizeDate(input.endDate, true);

  if (!slug) throw createOfferError("A catalog product is required.", "missing_offer_slug");
  if (!DISCOUNT_TYPES.has(discountType)) throw createOfferError("Choose a valid discount type.", "invalid_discount_type");
  if (!Number.isFinite(discountValue) || discountValue <= 0) throw createOfferError("Discount value must be greater than zero.", "invalid_discount_value");
  if (discountType === "percentage" && discountValue > 100) throw createOfferError("Percentage discount cannot exceed 100%.", "invalid_percentage_discount");
  if (!Number.isFinite(productPrice) || productPrice <= 0) throw createOfferError("A valid catalog price is required.", "invalid_product_price");
  if (discountType === "fixed" && discountValue >= productPrice) throw createOfferError("Fixed discount must be less than the product price.", "invalid_fixed_discount");
  if (new Date(endDate).getTime() <= new Date(startDate).getTime()) throw createOfferError("End date must be after the start date.", "invalid_offer_dates");

  const now = new Date().toISOString();
  return {
    slug,
    enabled: input.enabled === true,
    discountType,
    discountValue,
    startDate,
    endDate,
    title: String(input.title || "").trim().slice(0, 120),
    badgeText: String(input.badgeText || "").trim().slice(0, 48),
    priority: Math.max(0, Math.trunc(Number(input.priority) || 0)),
    createdAt: input.createdAt || options.createdAt || now,
    updatedAt: now,
    updatedBy: String(options.updatedBy || input.updatedBy || "").trim().slice(0, 320)
  };
}

function firestoreUrl(serviceAccount) {
  return `https://firestore.googleapis.com/v1/projects/${serviceAccount.projectId}/databases/(default)/documents/${PRODUCT_OFFERS_COLLECTION}`;
}

function fromFirestoreValue(value) {
  if (!value || typeof value !== "object") return undefined;
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("stringValue" in value) return String(value.stringValue);
  return undefined;
}

function readFirestoreOffer(document) {
  return {
    slug: String(document.name || "").split("/").pop(),
    ...Object.fromEntries(Object.entries(document.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)]))
  };
}

async function getStorage() {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) throw createOfferError("Product offers storage is not configured.", "offers_storage_not_configured", 500);
  return { serviceAccount, accessToken: await getAccessToken(serviceAccount) };
}

async function listProductOffers() {
  const { serviceAccount, accessToken } = await getStorage();
  const response = await fetch(firestoreUrl(serviceAccount), { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw createOfferError(body.error?.message || "Unable to load product offers.", "offers_read_failed", response.status);
  return (body.documents || []).map(readFirestoreOffer).sort((a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0) || a.slug.localeCompare(b.slug));
}

function getCairoDay(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getOfferDay(value) {
  const source = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(source)) return source.slice(0, 10);
  return getCairoDay(value);
}

function isProductOfferActive(offer, now = new Date()) {
  const startDay = getOfferDay(offer?.startDate);
  const endDay = getOfferDay(offer?.endDate);
  const currentDay = getCairoDay(now);
  const discountValue = Number(offer?.discountValue);
  return Boolean(
    offer?.enabled === true
    && startDay
    && endDay
    && currentDay >= startDay
    && currentDay <= endDay
    && discountValue > 0
    && (offer.discountType === "fixed" || (offer.discountType === "percentage" && discountValue <= 100))
  );
}

function calculateActiveOfferPrice(productPrice, offer) {
  const originalUnitAmountCents = Math.max(0, Math.round(Number(productPrice) * 100));
  if (!isProductOfferActive(offer) || originalUnitAmountCents <= 0) {
    return { originalUnitAmountCents, unitAmountCents: originalUnitAmountCents, discountAmountCents: 0, offer: null };
  }

  const rawDiscountCents = offer.discountType === "percentage"
    ? Math.round(originalUnitAmountCents * (Number(offer.discountValue) / 100))
    : Math.round(Number(offer.discountValue) * 100);
  const discountAmountCents = Math.min(Math.max(0, rawDiscountCents), Math.max(0, originalUnitAmountCents - 1));
  return {
    originalUnitAmountCents,
    unitAmountCents: originalUnitAmountCents - discountAmountCents,
    discountAmountCents,
    offer: discountAmountCents > 0 ? offer : null
  };
}

async function listActiveProductOffers(now = new Date()) {
  return (await listProductOffers()).filter((offer) => isProductOfferActive(offer, now));
}

async function getProductOffer(slug) {
  const safeSlug = normalizeSlug(slug);
  if (!safeSlug) throw createOfferError("Offer slug is required.", "missing_offer_slug");
  const { serviceAccount, accessToken } = await getStorage();
  const offer = await readFirestoreDocument(serviceAccount, accessToken, [PRODUCT_OFFERS_COLLECTION, safeSlug]);
  return offer ? { slug: safeSlug, ...offer } : null;
}

async function saveProductOffer(input, updatedBy) {
  const existing = await getProductOffer(input.slug);
  const offer = normalizeOffer(input, { createdAt: existing?.createdAt, updatedBy });
  const { serviceAccount, accessToken } = await getStorage();
  await commitFirestoreWrites(serviceAccount, accessToken, [buildUpdateWrite(serviceAccount, [PRODUCT_OFFERS_COLLECTION, offer.slug], offer)]);
  return offer;
}

async function setProductOfferEnabled(slug, enabled, updatedBy) {
  const existing = await getProductOffer(slug);
  if (!existing) throw createOfferError("Offer was not found.", "offer_not_found", 404);
  return saveProductOffer({ ...existing, enabled, productPrice: existing.productPrice || Number.MAX_SAFE_INTEGER }, updatedBy);
}

async function deleteProductOffer(slug) {
  const safeSlug = normalizeSlug(slug);
  if (!safeSlug) throw createOfferError("Offer slug is required.", "missing_offer_slug");
  const { serviceAccount, accessToken } = await getStorage();
  await commitFirestoreWrites(serviceAccount, accessToken, [{ delete: `projects/${serviceAccount.projectId}/databases/(default)/documents/${PRODUCT_OFFERS_COLLECTION}/${safeSlug}` }]);
  return { slug: safeSlug, deleted: true };
}

module.exports = { calculateActiveOfferPrice, deleteProductOffer, getProductOffer, isProductOfferActive, listActiveProductOffers, listProductOffers, saveProductOffer, setProductOfferEnabled };
