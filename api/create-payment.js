const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { saveOrderRecord } = require("../lib/server/order-storage.cjs");
const { verifyFirebaseIdToken } = require("../lib/server/firebase-auth.cjs");
const {
  centsToAmount,
  getCheckoutSettings,
  incrementCouponUsage,
  normalizeCouponCode,
  validateCouponForTotals
} = require("../lib/server/checkout-settings.cjs");
const { validateInventoryForItems } = require("../lib/server/inventory-storage.cjs");
const { calculateActiveOfferPrice, listActiveProductOffers } = require("../lib/server/product-offers-storage.cjs");

const CURRENCY = "EGP";
const MAX_BODY_BYTES = 1024 * 1024;
const PAYMOB_BASE_URL = (process.env.PAYMOB_BASE_URL || "https://accept.paymob.com").replace(/\/+$/, "");
const PAYMOB_CHECKOUT_BASE_URL = (process.env.PAYMOB_CHECKOUT_BASE_URL || PAYMOB_BASE_URL).replace(/\/+$/, "");

let catalogCache = null;

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function stringifyForLog(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch (error) {
    return String(value);
  }
}

function normalizeErrorCode(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "payment_error";
}

function createPaymentError(message, options = {}) {
  const error = new Error(message);
  error.statusCode = options.statusCode || 400;
  error.code = normalizeErrorCode(options.code || message);
  error.rootCause = options.rootCause || error.code;
  error.details = options.details || null;
  error.audit = options.audit || null;
  error.paymobStatus = options.paymobStatus || null;
  error.paymobResponse = options.paymobResponse || null;
  error.paymobRequest = options.paymobRequest || null;
  return error;
}

function getPaymobRejectionReason(responseBody) {
  if (!responseBody || typeof responseBody !== "object") {
    return "";
  }

  const fields = [
    responseBody.detail,
    responseBody.message,
    responseBody.error,
    responseBody.reason,
    responseBody.status
  ].filter(Boolean);

  if (Array.isArray(responseBody.errors)) {
    fields.push(responseBody.errors.map((item) => (
      typeof item === "string" ? item : stringifyForLog(item)
    )).join("; "));
  }

  return fields.join(" | ") || stringifyForLog(responseBody);
}

function classifyPaymobFailure({ reason = "", responseBody = {}, audit = {}, payload = {} }) {
  const searchable = `${reason} ${stringifyForLog(responseBody)}`.toLowerCase();
  const paymobItemsTotalCents = sumPaymobItemsCents(payload.items || []);
  const payloadAmount = Number(payload.amount) || 0;

  if (searchable.includes("unmatched_item_prices")) {
    return "unmatched_item_prices";
  }

  if (
    searchable.includes("shipping") ||
    Number(audit.payableShippingCents) + Number(audit.shippingDiscountCents) !== Number(audit.shippingFeeCents)
  ) {
    return "shipping_mismatch";
  }

  if (
    searchable.includes("coupon") ||
    Number(audit.discountCents) !== Number(payload.extras?.discount_cents || 0)
  ) {
    return "coupon_mismatch";
  }

  if (
    searchable.includes("item") ||
    (payload.items || []).some((item) => (Number(item.amount) || 0) <= 0 || (Number(item.quantity) || 0) <= 0)
  ) {
    return "invalid_item_totals";
  }

  if (
    searchable.includes("amount") ||
    payloadAmount !== paymobItemsTotalCents ||
    Number(audit.totalCents) !== payloadAmount
  ) {
    return "amount_mismatch";
  }

  return "invalid_payload";
}

function buildErrorResponse(error) {
  const rootCause = error.rootCause || error.code || "payment_error";
  const payload = {
    ok: false,
    error: error.message || "Unable to start payment. Please try again.",
    code: error.code || rootCause,
    rootCause
  };

  if (error.details) {
    payload.details = error.details;
  }

  if (error.audit) {
    payload.audit = error.audit;
  }

  if (error.paymobStatus) {
    payload.paymobStatus = error.paymobStatus;
  }

  if (error.paymobResponse) {
    payload.paymobResponse = error.paymobResponse;
  }

  return payload;
}

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    request.on("error", reject);
  });
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  if (typeof request.body === "string" && request.body.trim()) {
    return JSON.parse(request.body);
  }

  const rawBody = await readRawBody(request);
  return rawBody ? JSON.parse(rawBody) : {};
}

function normalizeText(value, maxLength) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function normalizeEmail(value) {
  return normalizeText(value, 120).toLowerCase();
}

function normalizeProductId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

function normalizeGuestId(value) {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 120);
}

function normalizePaymentMethod(value) {
  const paymentMethod = normalizeProductId(value || "paymob-checkout");

  if (paymentMethod !== "paymob-checkout") {
    throw createPaymentError("Please choose a supported payment method.", {
      code: "unsupported_payment_method",
      rootCause: "invalid_payload"
    });
  }

  return paymentMethod;
}

function getProductCatalogMap() {
  if (catalogCache) {
    return catalogCache;
  }

  const catalogPath = path.join(process.cwd(), "js", "product-catalog.js");
  const source = fs.readFileSync(catalogPath, "utf8").replace(/\bexport\s+/g, "");
  const sandbox = {
    console,
    module: { exports: {} },
    exports: {}
  };

  vm.runInNewContext(
    `${source}\nmodule.exports = { productCatalog };`,
    sandbox,
    { filename: "product-catalog.js", timeout: 1000 }
  );

  const products = Array.isArray(sandbox.module.exports.productCatalog)
    ? sandbox.module.exports.productCatalog
    : [];

  catalogCache = new Map(products.map((product) => [product.id, {
    id: product.id,
    name: product.name,
    price: Number(product.price) || 0
  }]));

  return catalogCache;
}

function validateCustomer(customer = {}, shippingRates = {}) {
  const cityId = normalizeProductId(customer.cityId);
  const cityName = shippingRates[cityId]?.cityName;
  const values = {
    name: normalizeText(customer.name, 90),
    phone: normalizeText(customer.phone, 30),
    email: normalizeEmail(customer.email),
    cityId,
    cityName,
    area: normalizeText(customer.area, 90),
    fullAddress: normalizeText(customer.fullAddress, 220),
    building: normalizeText(customer.building, 60),
    floorApartment: normalizeText(customer.floorApartment, 60),
    notes: normalizeText(customer.notes, 220)
  };

  const requiredFields = [
    ["name", "Customer name is required."],
    ["phone", "Phone number is required."],
    ["area", "Area is required."],
    ["fullAddress", "Full address is required."],
    ["building", "Building number is required."],
    ["floorApartment", "Floor / apartment is required."]
  ];
  const missing = requiredFields.find(([key]) => !values[key]);

  if (missing) {
    throw createPaymentError(missing[1], {
      code: `missing_${missing[0]}`,
      rootCause: "invalid_payload"
    });
  }

  if (!cityName) {
    throw createPaymentError("Please choose a supported delivery city.", {
      code: "unsupported_delivery_city",
      rootCause: "shipping_mismatch",
      details: { cityId }
    });
  }

  if (!/^[+\d\s().-]{7,30}$/.test(values.phone)) {
    throw createPaymentError("Please enter a valid phone number.", {
      code: "invalid_phone",
      rootCause: "invalid_payload"
    });
  }

  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    throw createPaymentError("Please enter a valid email address.", {
      code: "invalid_email",
      rootCause: "invalid_payload"
    });
  }

  return values;
}

async function getOrderOwner(identity = {}) {
  const idToken = normalizeText(identity.idToken || identity.firebaseIdToken, 4096);

  if (idToken) {
    const verifiedUser = await verifyFirebaseIdToken(idToken);
    return {
      uid: verifiedUser.uid,
      email: normalizeEmail(verifiedUser.email),
      name: normalizeText(verifiedUser.name, 90)
    };
  }

  const guestId = normalizeGuestId(identity.guestId || identity.sessionId);
  if (!guestId || guestId.length < 20) {
    throw createPaymentError("Guest session is missing. Please refresh checkout and try again.", {
      code: "missing_guest_session",
      rootCause: "invalid_payload"
    });
  }

  return {
    guestId,
    sessionId: guestId
  };
}

function validateItems(cartItems, activeOffers = []) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw createPaymentError("Your cart is empty.", {
      code: "empty_cart",
      rootCause: "invalid_item_totals"
    });
  }

  if (cartItems.length > 100) {
    throw createPaymentError("Too many line items in this order.", {
      code: "too_many_line_items",
      rootCause: "invalid_payload"
    });
  }

  const catalog = getProductCatalogMap();
  const itemsById = new Map();
  const offersBySlug = new Map((activeOffers || []).map((offer) => [offer.slug, offer]));

  cartItems.forEach((item) => {
    const productId = normalizeProductId(item && item.id);
    const quantity = Math.trunc(Number(item && item.quantity));

    if (!productId) {
      throw createPaymentError("A cart item is missing its product ID.", {
        code: "missing_product_id",
        rootCause: "invalid_payload",
        details: { item }
      });
    }

    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 99) {
      throw createPaymentError("Cart quantities must be between 1 and 99.", {
        code: "invalid_item_quantity",
        rootCause: "invalid_item_totals",
        details: { productId, quantity }
      });
    }

    const product = catalog.get(productId);
    if (!product) {
      throw createPaymentError(`Product ${productId} is not available.`, {
        code: "unknown_product",
        rootCause: "invalid_payload",
        details: { productId }
      });
    }

    const offerPricing = calculateActiveOfferPrice(product.price, offersBySlug.get(productId));
    const unitAmountCents = offerPricing.unitAmountCents;
    if (unitAmountCents <= 0) {
      throw createPaymentError(`${product.name} is not currently available for online payment.`, {
        code: "invalid_item_price",
        rootCause: "invalid_item_totals",
        details: { productId, unitAmountCents }
      });
    }

    const existing = itemsById.get(productId);
    if (existing) {
      existing.quantity += quantity;
      return;
    }

    itemsById.set(productId, {
      productId,
      name: normalizeText(product.name, 120),
      quantity,
      unitAmountCents,
      originalUnitAmountCents: offerPricing.originalUnitAmountCents,
      offerDiscountAmountCents: offerPricing.discountAmountCents,
      appliedOfferSlug: offerPricing.offer?.slug || "",
      offerDiscountType: offerPricing.offer?.discountType || "",
      offerDiscountValue: Number(offerPricing.offer?.discountValue) || 0
    });
  });

  const items = Array.from(itemsById.values());
  const amountCents = items.reduce((sum, item) => sum + (item.unitAmountCents * item.quantity), 0);

  if (amountCents <= 0) {
    throw createPaymentError("Order total must be greater than zero.", {
      code: "invalid_cart_subtotal",
      rootCause: "invalid_item_totals",
      audit: { amountCents }
    });
  }

  return { items, amountCents };
}

function getPaymentMethods() {
  const methodEnvNames = [
    "PAYMOB_INTEGRATION_ID_CARD",
    "PAYMOB_INTEGRATION_ID_WALLET",
    "PAYMOB_INTEGRATION_ID_KIOSK"
  ];

  const paymentMethods = methodEnvNames
    .map((name) => Number(process.env[name]))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (!paymentMethods.length) {
    throw createPaymentError("Paymob integration IDs are not configured.", {
      code: "missing_paymob_integration_ids",
      rootCause: "invalid_payload"
    });
  }

  return paymentMethods;
}

function getPaymobSecretKey() {
  // Put the real Paymob API Secret Key in Vercel as PAYMOB_API_KEY.
  return process.env.PAYMOB_API_KEY || process.env.PAYMOB_SECRET_KEY || "";
}

function getSiteOrigin(request) {
  const configuredUrl = process.env.SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (configuredUrl) {
    return configuredUrl.startsWith("http") ? configuredUrl.replace(/\/+$/, "") : `https://${configuredUrl.replace(/\/+$/, "")}`;
  }

  const protocol = request.headers["x-forwarded-proto"] || "https";
  const host = request.headers["x-forwarded-host"] || request.headers.host;
  return `${protocol}://${host}`.replace(/\/+$/, "");
}

function splitCustomerName(fullName) {
  const parts = normalizeText(fullName, 90).split(" ").filter(Boolean);
  const firstName = parts.shift() || "Sushi";
  const lastName = parts.join(" ") || "Box";
  return { firstName, lastName };
}

function sumPaymobItemsCents(items) {
  return (Array.isArray(items) ? items : []).reduce((sum, item) => {
    return sum + ((Number(item.amount) || 0) * (Math.max(1, Number(item.quantity) || 1)));
  }, 0);
}

function buildDiscountedProductPaymobItems(items, productDiscountCents) {
  let remainingDiscountCents = Math.max(0, Math.trunc(Number(productDiscountCents) || 0));
  const expandedItems = [];

  items.forEach((item) => {
    for (let index = 0; index < item.quantity; index += 1) {
      const unitDiscountCents = Math.min(item.unitAmountCents - 1, remainingDiscountCents);
      remainingDiscountCents -= unitDiscountCents;
      expandedItems.push({
        name: item.name,
        amount: item.unitAmountCents - unitDiscountCents,
        description: item.productId,
        quantity: 1
      });
    }
  });

  if (remainingDiscountCents > 0) {
    throw createPaymentError("Discount exceeds payable product value.", {
      code: "discount_exceeds_product_value",
      rootCause: "coupon_mismatch",
      audit: { remainingDiscountCents, productDiscountCents }
    });
  }

  return expandedItems;
}

function buildPaymobItems({ items, shippingFeeCents, discountCents }) {
  const shippingDiscountCents = Math.min(shippingFeeCents, discountCents);
  const payableShippingCents = shippingFeeCents - shippingDiscountCents;
  const productDiscountCents = discountCents - shippingDiscountCents;
  const productItems = productDiscountCents > 0
    ? buildDiscountedProductPaymobItems(items, productDiscountCents)
    : items.map((item) => ({
      name: item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name,
      amount: item.unitAmountCents * item.quantity,
      description: item.productId,
      quantity: 1
    }));

  return {
    paymobItems: [
      ...productItems,
      ...(payableShippingCents > 0 ? [{
        name: "Shipping fee",
        amount: payableShippingCents,
        description: "delivery",
        quantity: 1
      }] : [])
    ],
    payableShippingCents,
    shippingDiscountCents,
    productDiscountCents
  };
}

function assertPaymentMath({ subtotalCents, shippingFeeCents, discountCents, totalCents, paymobItems }) {
  const beforeDiscountCents = subtotalCents + shippingFeeCents;
  const expectedTotalCents = Math.max(0, beforeDiscountCents - discountCents);
  const paymobItemsTotalCents = sumPaymobItemsCents(paymobItems);

  if (expectedTotalCents !== totalCents || paymobItemsTotalCents !== totalCents) {
    throw createPaymentError("Payment total mismatch before Paymob submission.", {
      code: "payment_total_mismatch",
      rootCause: "amount_mismatch",
      audit: {
      subtotalCents,
      shippingFeeCents,
      beforeDiscountCents,
      discountCents,
      expectedTotalCents,
      totalCents,
      paymobItemsTotalCents
      }
    });
  }

  return {
    subtotalCents,
    shippingFeeCents,
    beforeDiscountCents,
    discountCents,
    totalCents,
    paymobItemsTotalCents
  };
}

function buildPaymobPayload({ orderId, customer, items, subtotalCents, shippingFeeCents, discountCents, couponCode, totalCents, request }) {
  const orderReference = orderId;
  const webhookUrl = `${getSiteOrigin(request)}/api/paymob-webhook`;
  const { firstName, lastName } = splitCustomerName(customer.name);
  const fallbackEmail = process.env.PAYMOB_FALLBACK_EMAIL || "orders@sushibox.com";
  const email = customer.email || fallbackEmail;
  const addressLine = [customer.fullAddress, customer.area, customer.cityName].filter(Boolean).join(", ");
  const cartHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(items.map((item) => [item.productId, item.quantity, item.unitAmountCents])))
    .digest("hex");
  const {
    paymobItems,
    payableShippingCents,
    shippingDiscountCents,
    productDiscountCents
  } = buildPaymobItems({ items, shippingFeeCents, discountCents });
  const mathAudit = assertPaymentMath({
    subtotalCents,
    shippingFeeCents,
    discountCents,
    totalCents,
    paymobItems
  });

  return {
    orderReference,
    audit: {
      ...mathAudit,
      payableShippingCents,
      shippingDiscountCents,
      productDiscountCents
    },
    payload: {
      amount: totalCents,
      currency: CURRENCY,
      payment_methods: getPaymentMethods(),
      billing_data: {
        apartment: customer.floorApartment || "NA",
        email,
        floor: customer.floorApartment || "NA",
        first_name: firstName,
        street: addressLine,
        building: customer.building || "NA",
        phone_number: customer.phone,
        shipping_method: "PKG",
        postal_code: "00000",
        city: customer.cityName,
        country: "EG",
        last_name: lastName,
        state: customer.cityName
      },
      customer: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: customer.phone
      },
      delivery_needed: false,
      items: paymobItems,
      special_reference: orderReference,
      notification_url: webhookUrl,
      redirection_url: webhookUrl,
      expiration: 3600,
      extras: {
        order_id: orderReference,
        merchant_order_id: orderReference,
        source: "sushi-box-vercel",
        cart_hash: cartHash,
        discount_cents: discountCents,
        final_total_cents: totalCents,
        coupon_code: couponCode,
        pricing_details: {
          delivery_city: customer.cityName,
          subtotal_cents: subtotalCents,
          shipping_fee_cents: shippingFeeCents,
          payable_shipping_cents: payableShippingCents,
          shipping_discount_cents: shippingDiscountCents,
          product_discount_cents: productDiscountCents,
          total_before_discount_cents: subtotalCents + shippingFeeCents
        }
      }
    }
  };
}

function buildAddressLine(customer) {
  return [
    customer.fullAddress,
    customer.area,
    customer.building ? `Building ${customer.building}` : "",
    customer.floorApartment ? `Floor / Apt ${customer.floorApartment}` : "",
    customer.cityName
  ].filter(Boolean).join(", ");
}

function buildOrderItems(items) {
  return items.map((item) => {
    const lineTotalCents = item.unitAmountCents * item.quantity;

    return {
      productId: item.productId,
      name: item.name,
      quantity: item.quantity,
      unitAmountCents: item.unitAmountCents,
      unitPrice: centsToAmount(item.unitAmountCents),
      originalUnitAmountCents: item.originalUnitAmountCents || item.unitAmountCents,
      originalUnitPrice: centsToAmount(item.originalUnitAmountCents || item.unitAmountCents),
      offerDiscountAmountCents: item.offerDiscountAmountCents || 0,
      offerDiscountAmount: centsToAmount(item.offerDiscountAmountCents || 0),
      appliedOfferSlug: item.appliedOfferSlug || "",
      offerDiscountType: item.offerDiscountType || "",
      offerDiscountValue: item.offerDiscountValue || 0,
      lineTotalCents,
      lineTotal: centsToAmount(lineTotalCents)
    };
  });
}

function buildOrderRecord({
  orderId,
  customer,
  owner,
  items,
  subtotalCents,
  shippingFeeCents,
  discountCents,
  couponCode,
  couponType,
  totalCents,
  paymentMethod,
  createdAt
}) {
  const cartItems = buildOrderItems(items);
  const address = buildAddressLine(customer);

  // This Firestore document is created before Paymob, so every payment attempt
  // has a durable pending order that the webhook can update to paid or failed.
  return {
    orderId,
    orderReference: orderId,
    customerName: customer.name,
    phone: customer.phone,
    email: customer.email || "",
    city: customer.cityName,
    cityId: customer.cityId,
    address,
    cartItems,
    items: cartItems,
    subtotalCents,
    subtotal: centsToAmount(subtotalCents),
    shippingFeeCents,
    shippingFee: centsToAmount(shippingFeeCents),
    deliveryFeeCents: shippingFeeCents,
    deliveryFee: centsToAmount(shippingFeeCents),
    totalBeforeDiscountCents: subtotalCents + shippingFeeCents,
    totalBeforeDiscount: centsToAmount(subtotalCents + shippingFeeCents),
    discountCents,
    discount: centsToAmount(discountCents),
    couponCode,
    couponType,
    totalCents,
    total: centsToAmount(totalCents),
    amountCents: totalCents,
    currency: CURRENCY,
    paymentMethod,
    paymentStatus: "pending",
    status: "pending",
    paid: false,
    orderStatus: "pending",
    uid: owner.uid || "",
    guestId: owner.guestId || "",
    sessionId: owner.sessionId || "",
    customer: {
      ...customer,
      address
    },
    ownerType: owner.uid ? "user" : "guest",
    createdAt,
    updatedAt: createdAt
  };
}

function buildCheckoutUrl(intentionResponse) {
  const checkoutUrl = intentionResponse.checkout_url
    || intentionResponse.payment_url
    || intentionResponse.redirect_url
    || intentionResponse.url;

  if (checkoutUrl) {
    return checkoutUrl;
  }

  const clientSecret = intentionResponse.client_secret
    || intentionResponse.clientSecret
    || intentionResponse.cs;
  const publicKey = process.env.PAYMOB_PUBLIC_KEY || "";

  if (!clientSecret || !publicKey) {
    return "";
  }

  const params = new URLSearchParams({
    publicKey,
    clientSecret
  });

  return `${PAYMOB_CHECKOUT_BASE_URL}/unifiedcheckout/?${params.toString()}`;
}

async function createPaymobIntention(payload, audit = {}) {
  const secretKey = getPaymobSecretKey();
  if (!secretKey) {
    throw createPaymentError("Paymob API secret key is not configured.", {
      code: "missing_paymob_secret_key",
      rootCause: "invalid_payload"
    });
  }

  console.info("Paymob request payload.", stringifyForLog(payload));

  const response = await fetch(`${PAYMOB_BASE_URL}/v1/intention/`, {
    method: "POST",
    headers: {
      "Authorization": `Token ${secretKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let responseBody = {};

  try {
    responseBody = responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    responseBody = { message: responseText };
  }

  console.info("Paymob response body.", stringifyForLog({
    status: response.status,
    ok: response.ok,
    body: responseBody
  }));

  if (!response.ok) {
    const rejectionReason = getPaymobRejectionReason(responseBody);
    const rootCause = classifyPaymobFailure({
      reason: rejectionReason,
      responseBody,
      audit,
      payload
    });
    console.error("Paymob intention creation failed.", {
      status: response.status,
      rootCause,
      rejectionReason,
      requestPayload: payload,
      responseBody,
      audit
    });
    throw createPaymentError(rejectionReason || "Paymob rejected the payment request.", {
      statusCode: 400,
      code: "paymob_rejected_payment",
      rootCause,
      details: {
        paymobRejectionReason: rejectionReason,
        paymobStatus: response.status
      },
      audit,
      paymobStatus: response.status,
      paymobResponse: responseBody,
      paymobRequest: payload
    });
  }

  return responseBody;
}

module.exports = async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.setHeader("Allow", "POST, OPTIONS");
    response.statusCode = 204;
    return response.end();
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  try {
    const body = await readJsonBody(request);
    console.info("Create payment request payload.", stringifyForLog(body));

    const checkoutSettings = await getCheckoutSettings();
    const customer = validateCustomer(body.customer || {}, checkoutSettings.shippingRates);
    const owner = await getOrderOwner({
      ...(body.identity || {}),
      guestId: body.guestId || body.sessionId || body.identity?.guestId,
      sessionId: body.sessionId || body.guestId || body.identity?.sessionId
    });
    if (!customer.email && owner.email) {
      customer.email = owner.email;
    }

    const paymentMethod = normalizePaymentMethod(body.paymentMethod);
    const activeOffers = await listActiveProductOffers();
    const { items, amountCents: subtotalCents } = validateItems(body.items || body.cart || [], activeOffers);
    const inventoryValidation = await validateInventoryForItems(items);
    if (!inventoryValidation.valid) {
      const firstIssue = inventoryValidation.issues[0] || {};
      const available = Math.max(0, Number(firstIssue.available) || 0);
      throw createPaymentError(
        available <= 0
          ? `${firstIssue.name || "One item"} is out of stock.`
          : `${firstIssue.name || "One item"}: Only ${available} item(s) available.`,
        {
          code: "insufficient_stock",
          rootCause: "inventory_mismatch",
          details: {
            items: inventoryValidation.issues
          }
        }
      );
    }
    const shippingFeeCents = Number(checkoutSettings.shippingRates[customer.cityId]?.amountCents) || 0;
    const couponResult = validateCouponForTotals({
      coupons: checkoutSettings.coupons,
      code: body.couponCode,
      subtotalCents,
      shippingCents: shippingFeeCents
    });
    const hasCouponCode = Boolean(normalizeCouponCode(body.couponCode));
    if (hasCouponCode && !couponResult.valid) {
      throw createPaymentError(couponResult.message || "Promo code could not be applied.", {
        code: "invalid_coupon",
        rootCause: "coupon_mismatch",
        details: {
          requestedCouponCode: normalizeCouponCode(body.couponCode),
          coupon: couponResult.coupon ? {
            code: couponResult.coupon.code,
            type: couponResult.coupon.type,
            enabled: couponResult.coupon.enabled,
            expiresAt: couponResult.coupon.expiresAt || "",
            usageLimit: couponResult.coupon.usageLimit,
            usageCount: couponResult.coupon.usageCount
          } : null
        }
      });
    }
    const discountCents = couponResult.valid ? couponResult.discountCents : 0;
    const couponCode = couponResult.valid ? couponResult.coupon.code : "";
    const couponType = couponResult.valid ? couponResult.coupon.type : "";
    const totalCents = Math.max(0, subtotalCents + shippingFeeCents - discountCents);
    console.info("Create payment totals.", stringifyForLog({
      productsSubtotalCents: subtotalCents,
      productsSubtotal: centsToAmount(subtotalCents),
      shippingAmountCents: shippingFeeCents,
      shippingAmount: centsToAmount(shippingFeeCents),
      discountAmountCents: discountCents,
      discountAmount: centsToAmount(discountCents),
      totalBeforeDiscountCents: subtotalCents + shippingFeeCents,
      totalBeforeDiscount: centsToAmount(subtotalCents + shippingFeeCents),
      finalTotalCents: totalCents,
      finalTotal: centsToAmount(totalCents),
      couponCode,
      couponType,
      requestedCouponCode: normalizeCouponCode(body.couponCode)
    }));

    if (totalCents <= 0) {
      throw createPaymentError("Order total must be greater than zero.", {
        code: "invalid_order_total",
        rootCause: "invalid_item_totals",
        audit: {
          subtotalCents,
          shippingFeeCents,
          discountCents,
          totalBeforeDiscountCents: subtotalCents + shippingFeeCents,
          totalCents,
          couponCode
        }
      });
    }
    const orderId = `sushi_${Date.now()}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const createdAt = new Date().toISOString();
    const orderRecord = buildOrderRecord({
      orderId,
      customer,
      owner,
      items,
      subtotalCents,
      shippingFeeCents,
      discountCents,
      couponCode,
      couponType,
      totalCents,
      paymentMethod,
      createdAt
    });
    const { orderReference, payload, audit: paymobAudit } = buildPaymobPayload({
      orderId,
      customer,
      items,
      subtotalCents,
      shippingFeeCents,
      discountCents,
      couponCode,
      totalCents,
      request
    });

    await saveOrderRecord(orderRecord, { required: true });
    if (couponCode) {
      await incrementCouponUsage(couponCode).catch((usageError) => {
        console.error("Unable to increment coupon usage.", usageError);
      });
    }

    let intention;
    let checkoutUrl;

    try {
      console.info("Paymob intention payload audit.", {
        orderReference,
        audit: paymobAudit,
        payload
      });
      intention = await createPaymobIntention(payload, paymobAudit);
      checkoutUrl = buildCheckoutUrl(intention);

      if (!checkoutUrl) {
        throw createPaymentError("Paymob did not return a checkout URL. Add PAYMOB_PUBLIC_KEY in Vercel to build the Unified Checkout redirect URL.", {
          code: "missing_paymob_checkout_url",
          rootCause: "invalid_payload",
          audit: paymobAudit,
          paymobResponse: intention
        });
      }
    } catch (paymentError) {
      await saveOrderRecord({
        orderId,
        orderReference,
        paymentStatus: "failed",
        status: "failed",
        paid: false,
        paymentFailureReason: normalizeText(paymentError.message, 220),
        updatedAt: new Date().toISOString()
      }, { merge: true }).catch((storageError) => {
        console.error("Unable to mark failed Paymob order.", storageError);
      });

      throw paymentError;
    }


    return sendJson(response, 200, {
      checkoutUrl,
      orderId,
      orderReference,
      amountCents: totalCents,
      currency: CURRENCY
    });
  } catch (error) {
    const normalizedError = error instanceof SyntaxError
      ? createPaymentError("Invalid JSON request payload.", {
        code: "invalid_json_payload",
        rootCause: "invalid_payload",
        details: { parseMessage: error.message }
      })
      : error;
    const statusCode = Number(normalizedError.statusCode) || 400;
    const errorResponse = buildErrorResponse(normalizedError);
    console.error("Unable to create Paymob payment.", {
      message: normalizedError.message,
      code: errorResponse.code,
      rootCause: errorResponse.rootCause,
      statusCode,
      details: normalizedError.details || null,
      audit: normalizedError.audit || null,
      paymobStatus: normalizedError.paymobStatus || null,
      paymobResponse: normalizedError.paymobResponse || null,
      stack: normalizedError.stack
    });
    return sendJson(response, statusCode, errorResponse);
  }
};
