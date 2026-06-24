import {
  getAllProducts,
  getExactProductById,
  getOptimizedImagePath,
  productCatalog
} from "../js/product-catalog.js";
import { getAbsoluteUrl } from "./site-url.js";

const FALLBACK_IMAGE_PATH = "images/optimized/Logo.webp";

function normalizeProductSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

export function getCatalogProducts() {
  return getAllProducts();
}

export function getProductBySlug(slug) {
  return getExactProductById(normalizeProductSlug(slug));
}

export function getCanonicalProductPath(product) {
  return product && product.id ? `/products/${encodeURIComponent(product.id)}` : "/menu.html";
}

export function getCanonicalProductUrl(product) {
  return getAbsoluteUrl(getCanonicalProductPath(product));
}

export function getProductPrimaryImagePath(product) {
  const imagePath = product?.originalImages?.[0] || product?.images?.[0] || FALLBACK_IMAGE_PATH;
  return getOptimizedImagePath(imagePath || FALLBACK_IMAGE_PATH);
}

export function getProductPrimaryImageUrl(product) {
  const imagePath = getProductPrimaryImagePath(product).replace(/^\/+/, "");
  return encodeURI(getAbsoluteUrl(`/${imagePath}`));
}

export function getProductDescription(product) {
  return String(product?.description || product?.longDescriptionIntro || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getProductTitle(product) {
  return product?.name ? `${product.name} | Sushi Box` : "Sushi Box Product";
}

export function getProductUpdatedAt(product) {
  return product?.updatedAt || product?.createdAt || null;
}

export function getStaticProductParams() {
  return productCatalog
    .filter((product) => product && product.id && product.isActive !== false)
    .map((product) => ({ slug: product.id }));
}
