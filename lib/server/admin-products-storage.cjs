const {
  getAccessToken,
  getServiceAccount,
  readFirestoreDocument,
  commitFirestoreWrites,
  buildUpdateWrite
} = require("./order-storage.cjs");

const ADMIN_PRODUCTS_COLLECTION = "adminProducts";
const PRODUCT_STATUSES = new Set(["draft", "archived"]);
const CATEGORY_FILTER_GROUPS = {
  "Noodles / Ramen": "noodles",
  Sauces: "sauces",
  "Frozen / Dumplings": "frozen",
  "Sushi Essentials / Asian Ingredients": "essentials",
  Seafood: "seafood",
  "Canned Food / Pantry": "pantry",
  Beverages: "beverages"
};

function createAdminProductError(message, code = "admin_product_error", statusCode = 400, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}

function cleanText(value, maxLength = 500) {
  return String(value || "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function cleanOptionalText(value, maxLength = 1000) {
  return String(value || "").trim().slice(0, maxLength);
}

function cleanStringArray(value, maxItems = 20, maxLength = 240) {
  const source = Array.isArray(value)
    ? value
    : String(value || "").split(/[\n,]/);

  return source
    .map((item) => cleanOptionalText(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function normalizeAdminProduct(input = {}, options = {}) {
  const slug = normalizeSlug(input.slug || options.slug);
  const name = cleanText(input.name, 160);
  const nameAr = cleanOptionalText(input.nameAr, 160);
  const price = Math.round(Number(input.price) * 100) / 100;
  const category = cleanText(input.category, 120);
  const filterGroup = cleanText(input.filterGroup || CATEGORY_FILTER_GROUPS[category] || "", 80);
  const description = cleanOptionalText(input.description, 1200);
  const descriptionAr = cleanOptionalText(input.descriptionAr, 1200);
  const images = cleanStringArray(input.images, 12, 500);
  const status = PRODUCT_STATUSES.has(String(input.status || "").trim()) ? String(input.status).trim() : "draft";
  const sortOrder = Number(input.sortOrder);
  const searchKeywords = cleanStringArray(input.searchKeywords, 30, 80);
  const now = options.updatedAt || new Date().toISOString();

  if (!slug) {
    throw createAdminProductError("Product slug is required.", "missing_product_slug");
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw createAdminProductError("Product slug must be lowercase and URL-safe.", "invalid_product_slug");
  }

  if (!name) {
    throw createAdminProductError("Product name is required.", "missing_product_name");
  }

  if (!Number.isFinite(price) || price <= 0) {
    throw createAdminProductError("Product price must be a positive number.", "invalid_product_price");
  }

  if (!category) {
    throw createAdminProductError("Product category is required.", "missing_product_category");
  }

  return {
    slug,
    name,
    nameAr,
    price,
    category,
    filterGroup,
    description,
    descriptionAr,
    images,
    status,
    isActive: false,
    sortOrder: Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0,
    searchKeywords,
    createdAt: options.createdAt || input.createdAt || now,
    updatedAt: now,
    createdBy: cleanText(options.createdBy || input.createdBy, 320),
    updatedBy: cleanText(options.updatedBy || input.updatedBy, 320),
    ...(status === "archived" && input.archivedAt ? { archivedAt: input.archivedAt } : {})
  };
}

function fromFirestoreValue(value) {
  if (!value || typeof value !== "object") return undefined;
  if ("stringValue" in value) return String(value.stringValue);
  if ("booleanValue" in value) return Boolean(value.booleanValue);
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("timestampValue" in value) return value.timestampValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(fromFirestoreValue);
  return undefined;
}

function readFirestoreProduct(document) {
  const fields = Object.fromEntries(
    Object.entries(document.fields || {}).map(([key, value]) => [key, fromFirestoreValue(value)])
  );
  return {
    slug: String(document.name || "").split("/").pop(),
    ...fields
  };
}

function firestoreCollectionUrl(serviceAccount) {
  return `https://firestore.googleapis.com/v1/projects/${serviceAccount.projectId}/databases/(default)/documents/${ADMIN_PRODUCTS_COLLECTION}`;
}

async function getStorage() {
  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    throw createAdminProductError("Admin product storage is not configured.", "admin_products_storage_not_configured", 500);
  }
  return { serviceAccount, accessToken: await getAccessToken(serviceAccount) };
}

async function listAdminProducts() {
  const { serviceAccount, accessToken } = await getStorage();
  const response = await fetch(firestoreCollectionUrl(serviceAccount), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  const body = await response.json().catch(() => ({}));

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw createAdminProductError(body.error?.message || "Unable to load draft products.", "admin_products_read_failed", response.status);
  }

  return (body.documents || [])
    .map(readFirestoreProduct)
    .sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime() || 0;
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime() || 0;
      return rightTime - leftTime || String(left.slug || "").localeCompare(String(right.slug || ""));
    });
}

async function getAdminProduct(slug) {
  const safeSlug = normalizeSlug(slug);
  if (!safeSlug) return null;
  const { serviceAccount, accessToken } = await getStorage();
  const product = await readFirestoreDocument(serviceAccount, accessToken, [ADMIN_PRODUCTS_COLLECTION, safeSlug]);
  return product ? { slug: safeSlug, ...product } : null;
}

async function saveAdminProductDraft(input = {}, updatedBy = "") {
  const slug = normalizeSlug(input.slug);
  const existing = await getAdminProduct(slug);
  const product = normalizeAdminProduct(
    {
      ...input,
      status: "draft",
      isActive: false
    },
    {
      slug,
      createdAt: existing?.createdAt,
      createdBy: existing?.createdBy || updatedBy,
      updatedBy
    }
  );
  const { serviceAccount, accessToken } = await getStorage();
  await commitFirestoreWrites(serviceAccount, accessToken, [
    buildUpdateWrite(serviceAccount, [ADMIN_PRODUCTS_COLLECTION, product.slug], product)
  ]);
  return product;
}

async function archiveAdminProduct(slug, updatedBy = "") {
  const safeSlug = normalizeSlug(slug);
  if (!safeSlug) {
    throw createAdminProductError("Product slug is required.", "missing_product_slug");
  }

  const existing = await getAdminProduct(safeSlug);
  if (!existing) {
    throw createAdminProductError("Draft product was not found.", "admin_product_not_found", 404);
  }

  const archivedAt = new Date().toISOString();
  const product = normalizeAdminProduct(
    {
      ...existing,
      slug: safeSlug,
      status: "archived",
      isActive: false,
      archivedAt
    },
    {
      slug: safeSlug,
      createdAt: existing.createdAt,
      createdBy: existing.createdBy,
      updatedAt: archivedAt,
      updatedBy
    }
  );

  const { serviceAccount, accessToken } = await getStorage();
  await commitFirestoreWrites(serviceAccount, accessToken, [
    buildUpdateWrite(serviceAccount, [ADMIN_PRODUCTS_COLLECTION, product.slug], product)
  ]);
  return product;
}

module.exports = {
  ADMIN_PRODUCTS_COLLECTION,
  archiveAdminProduct,
  listAdminProducts,
  normalizeAdminProduct,
  saveAdminProductDraft
};
