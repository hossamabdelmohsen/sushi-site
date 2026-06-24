const {
  getFirestoreProjectId,
  getServiceAccount,
  getAccessToken,
  readFirestoreDocument,
  readFirestoreDocumentsInTransaction,
  beginFirestoreTransaction,
  commitFirestoreTransaction,
  commitFirestoreWrites,
  buildUpdateWrite,
  cleanDocumentId,
  getOwnerOrderPaths
} = require("./order-storage.cjs");

const INVENTORY_COLLECTION = "productsInventory";

function isInventoryEnabled() {
  return String(process.env.SUSHI_ENABLE_INVENTORY || "true").trim().toLowerCase() === "true";
}

function createInventoryError(message, code = "inventory_error", statusCode = 400, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function normalizeInventorySlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/[/.#[\]]/g, "_")
    .slice(0, 150);
}

function normalizeInventoryRecord(input = {}, options = {}) {
  const slug = normalizeInventorySlug(input.slug || options.slug);
  const stockQuantity = Math.max(0, Math.trunc(Number(input.stockQuantity) || 0));
  const lowStockThreshold = Math.max(0, Math.trunc(Number(input.lowStockThreshold) || 0));

  if (!slug) {
    throw createInventoryError("Product slug is required.", "missing_product_slug", 400);
  }

  return {
    slug,
    stockQuantity,
    trackStock: input.trackStock === true,
    lowStockThreshold,
    updatedAt: options.updatedAt || new Date().toISOString(),
    updatedBy: String(options.updatedBy || input.updatedBy || "").trim()
  };
}

async function saveInventoryRecord(input = {}, options = {}) {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    throw createInventoryError("Inventory storage is not configured.", "inventory_storage_not_configured", 500);
  }

  const record = normalizeInventoryRecord(input, options);
  const accessToken = await getAccessToken(serviceAccount);
  await commitFirestoreWrites(serviceAccount, accessToken, [
    buildUpdateWrite(serviceAccount, [INVENTORY_COLLECTION, record.slug], record, {
      fieldPaths: Object.keys(record)
    })
  ]);

  return record;
}

async function readInventoryRecord(slug) {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    return null;
  }

  const cleanSlug = normalizeInventorySlug(slug);
  if (!cleanSlug) {
    return null;
  }

  const accessToken = await getAccessToken(serviceAccount);
  const record = await readFirestoreDocument(serviceAccount, accessToken, [INVENTORY_COLLECTION, cleanSlug]);
  return record ? normalizeInventoryRecord(record, { slug: cleanSlug }) : null;
}

async function validateInventoryForItems(items = []) {
  if (!isInventoryEnabled()) {
    return { valid: true, issues: [] };
  }

  const issues = [];
  for (const item of Array.isArray(items) ? items : []) {
    const productId = normalizeInventorySlug(item.productId || item.id);
    const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1));
    const record = await readInventoryRecord(productId);

    if (!record || record.trackStock !== true || quantity <= record.stockQuantity) {
      continue;
    }

    issues.push({
      productId,
      name: item.name || productId,
      requestedQuantity: quantity,
      available: record.stockQuantity
    });
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function buildRequestedQuantities(items = []) {
  const quantities = new Map();

  for (const item of Array.isArray(items) ? items : []) {
    const slug = normalizeInventorySlug(item.productId || item.id);
    if (!slug) {
      continue;
    }

    const quantity = Math.max(1, Math.trunc(Number(item.quantity) || 1));
    quantities.set(slug, (quantities.get(slug) || 0) + quantity);
  }

  return quantities;
}

function getInventoryIssueReason(issues) {
  return issues
    .map(({ slug, requested, available }) => `${slug}: requested ${requested}, available ${available}`)
    .join("; ")
    .slice(0, 1000);
}

async function finalizePaidOrderInventory(paymentRecord = {}) {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    return { skipped: true, inventoryDeducted: false, inventoryIssue: false };
  }

  if (!isInventoryEnabled()) {
    return { skipped: false, inventoryDeducted: false, inventoryIssue: false, inventoryDisabled: true };
  }

  const orderId = cleanDocumentId(paymentRecord.orderId || paymentRecord.orderReference);
  if (!orderId) {
    throw createInventoryError("Paid order reference is required.", "missing_order_reference", 400);
  }

  const accessToken = await getAccessToken(serviceAccount);
  const transaction = await beginFirestoreTransaction(serviceAccount, accessToken);
  const orderPath = ["orders", orderId];
  const [order] = await readFirestoreDocumentsInTransaction(serviceAccount, accessToken, [orderPath], transaction);

  if (!order) {
    throw createInventoryError(`Order ${orderId} was not found.`, "order_not_found", 404);
  }

  const ownerPaths = getOwnerOrderPaths(order, orderId);
  const updatedAt = paymentRecord.updatedAt || new Date().toISOString();
  const paymentPatch = {
    ...paymentRecord,
    orderId,
    orderReference: order.orderReference || paymentRecord.orderReference || orderId,
    paymentStatus: "paid",
    status: "paid",
    paid: true,
    paymentUpdatedAt: paymentRecord.paymentUpdatedAt || updatedAt,
    updatedAt
  };

  if (order.inventoryDeducted === true) {
    const writes = [
      buildUpdateWrite(serviceAccount, orderPath, paymentPatch, {
        fieldPaths: Object.keys(paymentPatch),
        mustExist: true
      }),
      ...ownerPaths.map((ownerPath) => buildUpdateWrite(serviceAccount, ownerPath, paymentPatch, {
        fieldPaths: Object.keys(paymentPatch)
      }))
    ];
    await commitFirestoreTransaction(serviceAccount, accessToken, transaction, writes);
    return { skipped: false, inventoryDeducted: true, alreadyDeducted: true, inventoryIssue: Boolean(order.inventoryIssue) };
  }

  const requestedQuantities = buildRequestedQuantities(order.items);
  const inventoryPaths = [...requestedQuantities.keys()].map((slug) => [INVENTORY_COLLECTION, slug]);
  const inventoryRecords = inventoryPaths.length
    ? await readFirestoreDocumentsInTransaction(serviceAccount, accessToken, inventoryPaths, transaction)
    : [];
  const issues = [];
  const trackedUpdates = [];

  inventoryRecords.forEach((record, index) => {
    const slug = inventoryPaths[index][1];
    const requested = requestedQuantities.get(slug) || 0;

    if (!record || record.trackStock !== true) {
      return;
    }

    const available = Math.max(0, Math.trunc(Number(record.stockQuantity) || 0));
    if (requested > available) {
      issues.push({ slug, requested, available });
      return;
    }

    trackedUpdates.push({ slug, record, requested, available });
  });

  const inventoryPatch = issues.length
    ? {
      inventoryDeducted: false,
      inventoryIssue: true,
      inventoryIssueReason: getInventoryIssueReason(issues),
      inventoryIssueAt: updatedAt
    }
    : {
      inventoryDeducted: true,
      inventoryDeductedAt: updatedAt,
      inventoryIssue: false,
      inventoryIssueReason: "",
      inventoryIssueAt: ""
    };
  const orderPatch = { ...paymentPatch, ...inventoryPatch };
  const writes = [
    buildUpdateWrite(serviceAccount, orderPath, orderPatch, {
      fieldPaths: Object.keys(orderPatch),
      mustExist: true
    }),
    ...ownerPaths.map((ownerPath) => buildUpdateWrite(serviceAccount, ownerPath, orderPatch, {
      fieldPaths: Object.keys(orderPatch)
    }))
  ];

  if (!issues.length) {
    trackedUpdates.forEach(({ slug, record, requested, available }) => {
      const stockPatch = {
        stockQuantity: Math.max(0, available - requested),
        updatedAt,
        updatedBy: "paymob-payment"
      };
      writes.push(buildUpdateWrite(serviceAccount, [INVENTORY_COLLECTION, slug], stockPatch, {
        fieldPaths: Object.keys(stockPatch),
        mustExist: true
      }));
    });
  }

  await commitFirestoreTransaction(serviceAccount, accessToken, transaction, writes);
  return {
    skipped: false,
    inventoryDeducted: !issues.length,
    inventoryIssue: issues.length > 0,
    issues
  };
}

module.exports = {
  INVENTORY_COLLECTION,
  createInventoryError,
  getFirestoreProjectId,
  isInventoryEnabled,
  normalizeInventoryRecord,
  normalizeInventorySlug,
  readInventoryRecord,
  saveInventoryRecord,
  validateInventoryForItems,
  finalizePaidOrderInventory
};
