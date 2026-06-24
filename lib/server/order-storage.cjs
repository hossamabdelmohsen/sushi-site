const crypto = require("crypto");

const FIRESTORE_SCOPE = "https://www.googleapis.com/auth/datastore";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

let tokenCache = null;

function createStorageError(message, code = "order_storage_error", statusCode = 500, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
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
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key
      };
    } catch (error) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

function getFirestoreProjectId() {
  const serviceAccount = getServiceAccount();
  return serviceAccount ? serviceAccount.projectId : "";
}

function hasOrderStorage() {
  return Boolean(getServiceAccount());
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
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(unsignedToken)
    .sign(serviceAccount.privateKey);
  const assertion = `${unsignedToken}.${base64Url(signature)}`;
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    }).toString()
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || body.error || "Unable to authenticate Firestore order storage.");
  }

  tokenCache = {
    accessToken: body.access_token,
    expiresAt: now + (Number(body.expires_in) || 3600)
  };

  return tokenCache.accessToken;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue)
      }
    };
  }

  if (typeof value === "object") {
    return {
      mapValue: {
        fields: toFirestoreFields(value)
      }
    };
  }

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
  if (!value || typeof value !== "object") {
    return undefined;
  }

  if (Object.prototype.hasOwnProperty.call(value, "nullValue")) {
    return null;
  }

  if (Object.prototype.hasOwnProperty.call(value, "booleanValue")) {
    return Boolean(value.booleanValue);
  }

  if (Object.prototype.hasOwnProperty.call(value, "integerValue")) {
    return Number(value.integerValue);
  }

  if (Object.prototype.hasOwnProperty.call(value, "doubleValue")) {
    return Number(value.doubleValue);
  }

  if (Object.prototype.hasOwnProperty.call(value, "timestampValue")) {
    return value.timestampValue;
  }

  if (Object.prototype.hasOwnProperty.call(value, "stringValue")) {
    return String(value.stringValue);
  }

  if (value.arrayValue) {
    return (value.arrayValue.values || []).map(fromFirestoreValue);
  }

  if (value.mapValue) {
    return fromFirestoreFields(value.mapValue.fields || {});
  }

  return undefined;
}

function fromFirestoreFields(fields = {}) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [key, fromFirestoreValue(value)])
  );
}

function cleanDocumentId(value) {
  return String(value || "")
    .trim()
    .replace(/[/.#[\]]/g, "_")
    .slice(0, 150) || `order_${Date.now()}`;
}

function cleanPathSegment(value) {
  return cleanDocumentId(value).replace(/\s+/g, "_");
}

function getOrderDocumentId(record) {
  return cleanDocumentId(record.orderId || record.orderReference || record.transactionId);
}

function getOwnerOrderPath(record, documentId) {
  return getOwnerOrderPaths(record, documentId)[0] || null;
}

function getOwnerOrderPaths(record, documentId) {
  const paths = [];
  const seenPaths = new Set();

  function addPath(pathSegments) {
    const pathKey = pathSegments.join("/");
    if (!seenPaths.has(pathKey)) {
      seenPaths.add(pathKey);
      paths.push(pathSegments);
    }
  }

  if (!record || !documentId) {
    return paths;
  }

  if (record.uid) {
    addPath(["users", cleanPathSegment(record.uid), "orders", documentId]);
  }

  if (record && (record.guestId || record.sessionId)) {
    addPath(["guestSessions", cleanPathSegment(record.guestId || record.sessionId), "orders", documentId]);
  }

  return paths;
}

function buildDocumentUrl(serviceAccount, pathSegments) {
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  return `https://firestore.googleapis.com/v1/projects/${serviceAccount.projectId}/databases/(default)/documents/${encodedPath}`;
}

function buildDocumentName(serviceAccount, pathSegments) {
  return `projects/${serviceAccount.projectId}/databases/(default)/documents/${pathSegments.join("/")}`;
}

function buildCommitUrl(serviceAccount) {
  return `https://firestore.googleapis.com/v1/projects/${serviceAccount.projectId}/databases/(default)/documents:commit`;
}

function buildBeginTransactionUrl(serviceAccount) {
  return `https://firestore.googleapis.com/v1/projects/${serviceAccount.projectId}/databases/(default)/documents:beginTransaction`;
}

function buildBatchGetUrl(serviceAccount) {
  return `https://firestore.googleapis.com/v1/projects/${serviceAccount.projectId}/databases/(default)/documents:batchGet`;
}

async function readFirestoreDocument(serviceAccount, accessToken, pathSegments) {
  const response = await fetch(buildDocumentUrl(serviceAccount, pathSegments), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json"
    }
  });

  if (response.status === 404) {
    return null;
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error?.message || "Unable to read order from Firestore.");
  }

  return fromFirestoreFields(body.fields || {});
}

async function patchFirestoreDocument(serviceAccount, accessToken, pathSegments, record, options = {}) {
  const fields = toFirestoreFields(record);
  const url = new URL(buildDocumentUrl(serviceAccount, pathSegments));

  if (options.merge) {
    Object.keys(fields).forEach((fieldPath) => {
      url.searchParams.append("updateMask.fieldPaths", fieldPath);
    });
  }

  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error?.message || "Unable to save order status to Firestore.");
  }
}

function buildUpdateWrite(serviceAccount, pathSegments, record, options = {}) {
  const fieldPaths = options.fieldPaths || Object.keys(record);
  const write = {
    update: {
      name: buildDocumentName(serviceAccount, pathSegments),
      fields: toFirestoreFields(record)
    },
    updateMask: {
      fieldPaths
    }
  };

  if (options.mustExist) {
    write.currentDocument = { exists: true };
  }

  return write;
}

async function commitFirestoreWrites(serviceAccount, accessToken, writes) {
  const response = await fetch(buildCommitUrl(serviceAccount), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ writes })
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createStorageError(
      body.error?.message || "Unable to commit order status sync to Firestore.",
      body.error?.status || "firestore_commit_failed",
      response.status,
      { firestoreError: body.error || body }
    );
  }

  return body;
}

async function beginFirestoreTransaction(serviceAccount, accessToken) {
  const response = await fetch(buildBeginTransactionUrl(serviceAccount), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body.transaction) {
    throw createStorageError(
      body.error?.message || "Unable to begin Firestore transaction.",
      body.error?.status || "firestore_transaction_begin_failed",
      response.status,
      { firestoreError: body.error || body }
    );
  }

  return body.transaction;
}

async function readFirestoreDocumentsInTransaction(serviceAccount, accessToken, pathSegmentsList, transaction) {
  const documentNames = pathSegmentsList.map((pathSegments) => buildDocumentName(serviceAccount, pathSegments));
  const response = await fetch(buildBatchGetUrl(serviceAccount), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      documents: documentNames,
      transaction
    })
  });
  const rawBody = await response.text();
  let body;
  try {
    body = rawBody.trim().startsWith("[")
      ? JSON.parse(rawBody)
      : rawBody.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  } catch (error) {
    body = { error: { message: "Firestore returned an invalid batchGet response." } };
  }

  if (!response.ok || !Array.isArray(body)) {
    throw createStorageError(
      body.error?.message || "Unable to read Firestore transaction documents.",
      body.error?.status || "firestore_transaction_read_failed",
      response.status,
      { firestoreError: body.error || body }
    );
  }

  const records = new Map(documentNames.map((name) => [name, null]));
  body.forEach((entry) => {
    if (entry.found?.name) {
      records.set(entry.found.name, fromFirestoreFields(entry.found.fields || {}));
    }
  });

  return pathSegmentsList.map((pathSegments, index) => records.get(documentNames[index]) || null);
}

async function commitFirestoreTransaction(serviceAccount, accessToken, transaction, writes) {
  const response = await fetch(buildCommitUrl(serviceAccount), {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ transaction, writes })
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw createStorageError(
      body.error?.message || "Unable to commit Firestore transaction.",
      body.error?.status || "firestore_transaction_commit_failed",
      response.status,
      { firestoreError: body.error || body }
    );
  }

  return body;
}

async function readOrderRecord(orderId) {
  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    return null;
  }

  const accessToken = await getAccessToken(serviceAccount);
  return readFirestoreDocument(serviceAccount, accessToken, ["orders", cleanDocumentId(orderId)]);
}

async function updateOrderStatusRecord(orderId, orderStatus, options = {}) {
  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    throw createStorageError("Order storage is not configured.", "order_storage_not_configured", 500);
  }

  const requestedDocumentId = String(orderId || "").trim();
  const normalizedStatus = String(orderStatus || "").trim();

  if (!requestedDocumentId) {
    throw createStorageError("Order id is required.", "missing_order_id", 400);
  }

  const documentId = cleanDocumentId(requestedDocumentId);
  if (documentId !== requestedDocumentId) {
    throw createStorageError("Order id contains unsupported path characters.", "invalid_order_id", 400, {
      orderId: requestedDocumentId
    });
  }

  if (!normalizedStatus) {
    throw createStorageError("Order status is required.", "missing_order_status", 400);
  }

  const accessToken = await getAccessToken(serviceAccount);
  const orderPath = ["orders", documentId];
  const existingRecord = await readFirestoreDocument(serviceAccount, accessToken, orderPath);

  if (!existingRecord) {
    throw createStorageError(`Order ${documentId} was not found.`, "order_not_found", 404, {
      orderId: documentId
    });
  }

  const ownerPaths = getOwnerOrderPaths(existingRecord, documentId);

  if (!ownerPaths.length) {
    throw createStorageError(
      `Order ${documentId} is missing uid or guestId/sessionId, so the customer mirror path cannot be synced.`,
      "missing_order_owner",
      400,
      { orderId: documentId }
    );
  }

  const updatedAt = options.updatedAt || new Date().toISOString();
  const statusPatch = {
    orderStatus: normalizedStatus,
    updatedAt
  };
  const mirrorRecord = {
    ...existingRecord,
    orderId: existingRecord.orderId || documentId,
    orderReference: existingRecord.orderReference || documentId,
    ...statusPatch
  };
  const writes = [
    buildUpdateWrite(serviceAccount, orderPath, statusPatch, {
      fieldPaths: Object.keys(statusPatch),
      mustExist: true
    }),
    ...ownerPaths.map((ownerPath) => buildUpdateWrite(serviceAccount, ownerPath, mirrorRecord, {
      fieldPaths: Object.keys(mirrorRecord)
    }))
  ];
  const mirrorPaths = ownerPaths.map((pathSegments) => pathSegments.join("/"));

  try {
    await commitFirestoreWrites(serviceAccount, accessToken, writes);
  } catch (error) {
    error.details = {
      ...(error.details || {}),
      orderId: documentId,
      mirrorPaths
    };
    throw error;
  }

  return {
    skipped: false,
    documentId,
    orderId: documentId,
    orderStatus: normalizedStatus,
    updatedAt,
    mirrorPaths
  };
}

async function saveOrderRecord(record, options = {}) {
  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    if (options.required) {
      throw new Error("Order storage is not configured.");
    }

    return { skipped: true };
  }

  const accessToken = await getAccessToken(serviceAccount);
  const documentId = getOrderDocumentId(record);
  let existingRecord = null;

  if (options.merge && !getOwnerOrderPath(record, documentId)) {
    existingRecord = await readFirestoreDocument(serviceAccount, accessToken, ["orders", documentId]);
  }

  await patchFirestoreDocument(serviceAccount, accessToken, ["orders", documentId], record, options);

  // Customer pages never read the locked top-level order. They read this mirror
  // document under their authenticated user id or high-entropy guest session id.
  const ownerPath = getOwnerOrderPath(record, documentId)
    || getOwnerOrderPath(existingRecord, documentId);

  if (ownerPath) {
    await patchFirestoreDocument(serviceAccount, accessToken, ownerPath, record, options);
  }

  return { skipped: false, documentId };
}

module.exports = {
  beginFirestoreTransaction,
  buildUpdateWrite,
  cleanDocumentId,
  commitFirestoreTransaction,
  commitFirestoreWrites,
  getAccessToken,
  getFirestoreProjectId,
  getOwnerOrderPaths,
  getServiceAccount,
  hasOrderStorage,
  readFirestoreDocumentsInTransaction,
  readFirestoreDocument,
  readOrderRecord,
  saveOrderRecord,
  updateOrderStatusRecord
};
