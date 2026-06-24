const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { saveOrderRecord } = require("../lib/server/order-storage.cjs");
const { finalizePaidOrderInventory } = require("../lib/server/inventory-storage.cjs");
const { notifyAdminNewOrder } = require("../lib/server/order-notifications.cjs");

const MAX_BODY_BYTES = 1024 * 1024;
const HMAC_FIELDS = [
  "amount_cents",
  "created_at",
  "currency",
  "error_occured",
  "has_parent_transaction",
  "id",
  "integration_id",
  "is_3d_secure",
  "is_auth",
  "is_capture",
  "is_refunded",
  "is_standalone_payment",
  "is_voided",
  "order.id",
  "owner",
  "pending",
  "source_data.pan",
  "source_data.sub_type",
  "source_data.type",
  "success"
];

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

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
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

function getNestedValue(payload, fieldPath) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  if (Object.prototype.hasOwnProperty.call(payload, fieldPath)) {
    return payload[fieldPath];
  }

  const underscoredFieldPath = fieldPath.replace(/\./g, "_");
  if (Object.prototype.hasOwnProperty.call(payload, underscoredFieldPath)) {
    return payload[underscoredFieldPath];
  }

  if (fieldPath === "order.id" && payload.order && typeof payload.order !== "object") {
    return payload.order;
  }

  return fieldPath.split(".").reduce((current, part) => {
    if (current && typeof current === "object" && Object.prototype.hasOwnProperty.call(current, part)) {
      return current[part];
    }
    return "";
  }, payload);
}

function normalizeHmacValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return String(value);
}

function getTransactionPayload(callbackPayload) {
  if (!callbackPayload || typeof callbackPayload !== "object") {
    return {};
  }

  return callbackPayload.obj && typeof callbackPayload.obj === "object"
    ? callbackPayload.obj
    : callbackPayload;
}

function getReceivedHmac(callbackPayload, url) {
  return url.searchParams.get("hmac")
    || callbackPayload.hmac
    || callbackPayload.HMAC
    || (callbackPayload.obj && callbackPayload.obj.hmac)
    || "";
}

function verifyPaymobHmac(transactionPayload, receivedHmac) {
  const secret = process.env.PAYMOB_HMAC_SECRET || "";
  if (!secret || !receivedHmac) {
    return false;
  }

  const data = HMAC_FIELDS
    .map((field) => normalizeHmacValue(getNestedValue(transactionPayload, field)))
    .join("");
  const expected = crypto.createHmac("sha512", secret).update(data).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const receivedBuffer = Buffer.from(String(receivedHmac).toLowerCase(), "hex");

  return expectedBuffer.length === receivedBuffer.length
    && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function isTruthy(value) {
  return value === true || value === 1 || String(value).toLowerCase() === "true" || String(value) === "1";
}

function isFalsy(value) {
  return value === false || value === 0 || value === "" || String(value).toLowerCase() === "false" || String(value) === "0";
}

function getOrderReference(transactionPayload) {
  const order = transactionPayload.order && typeof transactionPayload.order === "object"
    ? transactionPayload.order
    : {};

  return transactionPayload.special_reference
    || transactionPayload.merchant_order_id
    || transactionPayload.merchant_reference
    || order.merchant_order_id
    || order.special_reference
    || order.merchant_reference
    || order.id
    || transactionPayload.order
    || "";
}

function getPaymentStatus(transactionPayload) {
  const paid = isTruthy(transactionPayload.success)
    && isFalsy(transactionPayload.pending)
    && isFalsy(transactionPayload.error_occured)
    && isFalsy(transactionPayload.is_voided)
    && isFalsy(transactionPayload.is_refunded);

  return paid ? "paid" : "failed";
}

async function persistOrderStatus(transactionPayload, status) {
  const orderReference = getOrderReference(transactionPayload);
  const record = {
    orderId: orderReference,
    orderReference,
    transactionId: transactionPayload.id || "",
    amountCents: Number(transactionPayload.amount_cents) || "",
    currency: transactionPayload.currency || "",
    integrationId: transactionPayload.integration_id || "",
    paymentStatus: status,
    status,
    paid: status === "paid",
    paymentFailureReason: status === "failed"
      ? String(transactionPayload.data?.message || transactionPayload.error_occured || "Paymob marked the transaction as failed.").slice(0, 220)
      : "",
    paymentUpdatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // The order was created before Paymob checkout. A verified successful callback
  // atomically updates payment fields and tracked stock; failed callbacks only
  // update payment fields.
  const inventoryResult = status === "paid"
    ? await finalizePaidOrderInventory(record)
    : null;
  const storageResult = !inventoryResult || inventoryResult.skipped || inventoryResult.inventoryDisabled
    ? await saveOrderRecord(record, { merge: true })
    : { skipped: false };
  if (storageResult.skipped) {
    console.warn("Verified order status but Firestore order storage is not configured.");
  }

  // Vercel functions are stateless, so this local JSONL file is only a
  // best-effort development/audit trace for warm function instances.
  console.info("Verified Paymob payment callback.", record);

  try {
    fs.appendFileSync(
      path.join(os.tmpdir(), "sushi-box-paymob-orders.jsonl"),
      `${JSON.stringify(record)}\n`,
      "utf8"
    );
  } catch (error) {
    console.warn("Could not write local Paymob audit record.", error);
  }

  return { ...record, inventoryResult };
}

function redirectToResultPage(response, request, status, transactionPayload = {}) {
  const origin = getSiteOrigin(request);
  const page = status === "paid" ? "success.html" : "failed.html";
  const resultUrl = new URL(`/${page}`, origin);
  const orderReference = getOrderReference(transactionPayload);
  const transactionId = transactionPayload.id || "";

  if (orderReference) {
    resultUrl.searchParams.set("order", orderReference);
  }

  if (transactionId) {
    resultUrl.searchParams.set("transaction", transactionId);
  }

  response.statusCode = 302;
  response.setHeader("Location", resultUrl.toString());
  response.end();
}

module.exports = async function handler(request, response) {
  const url = new URL(request.url, getSiteOrigin(request));

  if (request.method !== "GET" && request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    return sendJson(response, 405, { error: "Method not allowed." });
  }

  try {
    const callbackPayload = request.method === "GET"
      ? Object.fromEntries(url.searchParams.entries())
      : await readJsonBody(request);
    const transactionPayload = getTransactionPayload(callbackPayload);
    const receivedHmac = getReceivedHmac(callbackPayload, url);
    const validHmac = verifyPaymobHmac(transactionPayload, receivedHmac);

    if (!validHmac) {
      console.warn("Rejected Paymob callback with invalid HMAC.", {
        method: request.method,
        transactionId: transactionPayload.id || ""
      });

      if (request.method === "GET") {
        return redirectToResultPage(response, request, "failed", transactionPayload);
      }

      return sendJson(response, 401, { error: "Invalid Paymob HMAC." });
    }

    const status = getPaymentStatus(transactionPayload);
    const record = await persistOrderStatus(transactionPayload, status);
    if (status === "paid") {
      await notifyAdminNewOrder(record, {
        source: "paymob-webhook",
        orderReference: record.orderReference,
        transactionId: record.transactionId,
        inventoryResult: record.inventoryResult || null
      }).catch((notificationError) => {
        console.error("Admin order email notification failed without blocking Paymob webhook.", {
          orderReference: record.orderReference,
          message: notificationError.message
        });
      });
    }

    if (request.method === "GET") {
      return redirectToResultPage(response, request, status, transactionPayload);
    }

    return sendJson(response, 200, { ok: true, status, orderReference: record.orderReference });
  } catch (error) {
    console.error("Paymob webhook handling failed.", error);

    if (request.method === "GET") {
      return redirectToResultPage(response, request, "failed");
    }

    return sendJson(response, 400, { error: "Unable to process Paymob callback." });
  }
};
