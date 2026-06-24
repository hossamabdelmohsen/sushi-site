const crypto = require("crypto");

const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const DEFAULT_SHIPPING_RATES = {
  "el-mahalla": { cityId: "el-mahalla", cityName: "El Mahalla El Kubra", amount: 50, amountCents: 5000 },
  "tanta": { cityId: "tanta", cityName: "Tanta", amount: 150, amountCents: 15000 },
  "kafr-el-sheikh": { cityId: "kafr-el-sheikh", cityName: "Kafr El Sheikh", amount: 150, amountCents: 15000 },
  "mansoura": { cityId: "mansoura", cityName: "Mansoura", amount: 150, amountCents: 15000 }
};

const DEFAULT_COUPONS = {
  FREE100: {
    code: "FREE100",
    type: "free_shipping",
    enabled: true,
    value: 0,
    valueCents: 0,
    expiresAt: "",
    usageLimit: 0,
    usageCount: 0,
    deleted: false,
    createdAt: "2026-06-15T00:00:00.000Z",
    updatedAt: "2026-06-15T00:00:00.000Z"
  }
};

const COUPON_TYPES = new Set(["free_shipping", "fixed_discount", "percentage_discount"]);
let tokenCache = null;

function createSettingsError(message, code = "checkout_settings_error", statusCode = 500) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  return error;
}

function base64Url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    return {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key
    };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  return projectId && clientEmail && privateKey ? { projectId, clientEmail, privateKey } : null;
}

async function getAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt > now + 60) {
    return tokenCache.accessToken;
  }

  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({
    iss: serviceAccount.clientEmail,
    scope: FIRESTORE_SCOPE,
    aud: GOOGLE_TOKEN_URL,
    exp: now + 3600,
    iat: now
  }));
  const unsignedToken = `${header}.${claims}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsignedToken).sign(serviceAccount.privateKey);
  const assertion = `${unsignedToken}.${base64Url(signature)}`;
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    }).toString()
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.access_token) {
    throw createSettingsError(body.error_description || body.error || "Unable to authenticate Firestore settings storage.");
  }

  tokenCache = {
    accessToken: body.access_token,
    expiresAt: now + (Number(body.expires_in) || 3600)
  };
  return tokenCache.accessToken;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") return { mapValue: { fields: toFirestoreFields(value) } };
  return { stringValue: String(value) };
}

function toFirestoreFields(record) {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, toFirestoreValue(value)])
  );
}

function fromFirestoreValue(value) {
  if (!value || typeof value !== "object") return undefined;
  if (Object.prototype.hasOwnProperty.call(value, "nullValue")) return null;
  if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) return Boolean(value.booleanValue);
  if (Object.prototype.hasOwnProperty.call(value, "integerValue")) return Number(value.integerValue);
  if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) return Number(value.doubleValue);
  if (Object.prototype.hasOwnProperty.call(value, "timestampValue")) return value.timestampValue;
  if (Object.prototype.hasOwnProperty.call(value, "stringValue")) return String(value.stringValue);
  if (value.arrayValue) return (value.arrayValue.values || []).map(fromFirestoreValue);
  if (value.mapValue) return fromFirestoreFields(value.mapValue.fields || {});
  return undefined;
}

function fromFirestoreFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)]));
}

function buildUrl(serviceAccount, pathSegments) {
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  return `https://firestore.googleapis.com/v1/projects/${serviceAccount.projectId}/databases/(default)/documents/${encodedPath}`;
}

async function readDocument(serviceAccount, accessToken, pathSegments) {
  const response = await fetch(buildUrl(serviceAccount, pathSegments), {
    headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
  });
  if (response.status === 404) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw createSettingsError(body.error?.message || "Unable to read checkout settings.");
  return fromFirestoreFields(body.fields || {});
}

async function listDocuments(serviceAccount, accessToken, pathSegments) {
  const response = await fetch(buildUrl(serviceAccount, pathSegments), {
    headers: { "Authorization": `Bearer ${accessToken}`, "Accept": "application/json" }
  });
  if (response.status === 404) return [];
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw createSettingsError(body.error?.message || "Unable to list checkout settings.");
  return (body.documents || []).map((document) => ({
    id: String(document.name || "").split("/").pop(),
    ...fromFirestoreFields(document.fields || {})
  }));
}

async function patchDocument(serviceAccount, accessToken, pathSegments, record) {
  const response = await fetch(buildUrl(serviceAccount, pathSegments), {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields: toFirestoreFields(record) })
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw createSettingsError(body.error?.message || "Unable to save checkout settings.");
}

function normalizeCityId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function normalizeCouponCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 40);
}

function normalizeMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) / 100 : 0;
}

function normalizeShippingRates(rates = {}) {
  return Object.fromEntries(
    Object.values({ ...DEFAULT_SHIPPING_RATES, ...rates }).map((rate) => {
      const cityId = normalizeCityId(rate.cityId);
      const amount = normalizeMoney(rate.amount ?? (Number(rate.amountCents) || 0) / 100);
      return [cityId, {
        cityId,
        cityName: String(rate.cityName || DEFAULT_SHIPPING_RATES[cityId]?.cityName || cityId).trim(),
        amount,
        amountCents: Math.round(amount * 100)
      }];
    }).filter(([cityId]) => cityId)
  );
}

function normalizeCoupon(input = {}) {
  const code = normalizeCouponCode(input.code);
  const type = String(input.type || "free_shipping").trim().toLowerCase();
  const value = type === "percentage_discount"
    ? Math.min(100, normalizeMoney(input.value))
    : normalizeMoney(input.value ?? (Number(input.valueCents) || 0) / 100);
  const usageLimit = Math.max(0, Math.trunc(Number(input.usageLimit) || 0));
  const usageCount = Math.max(0, Math.trunc(Number(input.usageCount) || 0));

  if (!code) throw createSettingsError("Coupon code is required.", "invalid_coupon_code", 400);
  if (!COUPON_TYPES.has(type)) throw createSettingsError("Unsupported coupon type.", "invalid_coupon_type", 400);

  return {
    code,
    type,
    enabled: input.enabled !== false,
    value,
    valueCents: type === "fixed_discount" ? Math.round(value * 100) : 0,
    expiresAt: String(input.expiresAt || "").trim(),
    usageLimit,
    usageCount,
    deleted: input.deleted === true,
    createdAt: input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

async function getStorage() {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) return null;
  return { serviceAccount, accessToken: await getAccessToken(serviceAccount) };
}

async function getCheckoutSettings() {
  const storage = await getStorage();
  if (!storage) {
    return {
      shippingRates: normalizeShippingRates(),
      coupons: Object.values(DEFAULT_COUPONS)
    };
  }

  const [shippingDocument, storedCoupons] = await Promise.all([
    readDocument(storage.serviceAccount, storage.accessToken, ["checkoutSettings", "shipping"]),
    listDocuments(storage.serviceAccount, storage.accessToken, ["promoCodes"])
  ]);
  const couponMap = new Map(Object.entries(DEFAULT_COUPONS).map(([code, coupon]) => [code, coupon]));

  storedCoupons.forEach((coupon) => {
    const normalized = normalizeCoupon(coupon);
    if (normalized.deleted) {
      couponMap.delete(normalized.code);
    } else {
      couponMap.set(normalized.code, normalized);
    }
  });

  return {
    shippingRates: normalizeShippingRates(shippingDocument?.rates || {}),
    coupons: Array.from(couponMap.values()).sort((a, b) => a.code.localeCompare(b.code))
  };
}

async function saveShippingRates(rates) {
  const storage = await getStorage();
  if (!storage) throw createSettingsError("Checkout settings storage is not configured.", "settings_storage_not_configured", 500);
  const shippingRates = normalizeShippingRates(rates);
  await patchDocument(storage.serviceAccount, storage.accessToken, ["checkoutSettings", "shipping"], {
    rates: shippingRates,
    updatedAt: new Date().toISOString()
  });
  return shippingRates;
}

async function saveCoupon(couponInput) {
  const storage = await getStorage();
  if (!storage) throw createSettingsError("Checkout settings storage is not configured.", "settings_storage_not_configured", 500);
  const coupon = normalizeCoupon(couponInput);
  await patchDocument(storage.serviceAccount, storage.accessToken, ["promoCodes", coupon.code], coupon);
  return coupon;
}

async function deleteCoupon(code) {
  const storage = await getStorage();
  if (!storage) throw createSettingsError("Checkout settings storage is not configured.", "settings_storage_not_configured", 500);
  const couponCode = normalizeCouponCode(code);
  if (!couponCode) throw createSettingsError("Coupon code is required.", "invalid_coupon_code", 400);
  await patchDocument(storage.serviceAccount, storage.accessToken, ["promoCodes", couponCode], {
    code: couponCode,
    deleted: true,
    enabled: false,
    updatedAt: new Date().toISOString()
  });
  return { code: couponCode, deleted: true };
}

async function incrementCouponUsage(code) {
  const settings = await getCheckoutSettings();
  const coupon = settings.coupons.find((item) => item.code === normalizeCouponCode(code));
  if (!coupon) return null;
  return saveCoupon({ ...coupon, usageCount: (Number(coupon.usageCount) || 0) + 1 });
}

function isCouponExpired(coupon, now = new Date()) {
  if (!coupon.expiresAt) return false;
  const expiresAt = new Date(coupon.expiresAt);
  return Number.isFinite(expiresAt.getTime()) && expiresAt.getTime() < now.getTime();
}

function calculateDiscountCents(coupon, subtotalCents, shippingCents) {
  if (!coupon) return 0;
  if (coupon.type === "free_shipping") return Math.min(shippingCents, shippingCents);
  if (coupon.type === "fixed_discount") return Math.min(subtotalCents + shippingCents, Math.round((Number(coupon.value) || 0) * 100));
  if (coupon.type === "percentage_discount") {
    return Math.min(subtotalCents + shippingCents, Math.round(subtotalCents * ((Number(coupon.value) || 0) / 100)));
  }
  return 0;
}

function validateCouponForTotals({ coupons, code, subtotalCents, shippingCents }) {
  const couponCode = normalizeCouponCode(code);
  if (!couponCode) {
    return { valid: false, message: "", coupon: null, discountCents: 0 };
  }

  const coupon = coupons.find((item) => item.code === couponCode && !item.deleted);
  if (!coupon) return { valid: false, message: "Invalid promo code.", coupon: null, discountCents: 0 };
  if (!coupon.enabled) return { valid: false, message: "This promo code is disabled.", coupon, discountCents: 0 };
  if (isCouponExpired(coupon)) return { valid: false, message: "This promo code has expired.", coupon, discountCents: 0 };
  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, message: "This promo code has reached its usage limit.", coupon, discountCents: 0 };
  }

  return {
    valid: true,
    message: "Promo code applied.",
    coupon,
    discountCents: calculateDiscountCents(coupon, subtotalCents, shippingCents)
  };
}

module.exports = {
  DEFAULT_SHIPPING_RATES,
  COUPON_TYPES,
  calculateDiscountCents,
  centsToAmount: (cents) => Math.round(Number(cents) || 0) / 100,
  deleteCoupon,
  getCheckoutSettings,
  incrementCouponUsage,
  normalizeCoupon,
  normalizeCouponCode,
  normalizeShippingRates,
  saveCoupon,
  saveShippingRates,
  validateCouponForTotals
};
