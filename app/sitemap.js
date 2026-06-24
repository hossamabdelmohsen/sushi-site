import {
  getCanonicalProductUrl,
  getCatalogProducts,
  getProductUpdatedAt
} from "../lib/catalog-index.js";
import { getAbsoluteUrl } from "../lib/site-url.js";

const STATIC_ROUTES = [
  "/",
  "/menu.html",
  "/offers.html",
  "/about.html",
  "/book.html",
  "/delivery-shipping-policy.html",
  "/refund-cancellation-policy.html",
  "/privacy-policy.html"
];

export default function sitemap() {
  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: getAbsoluteUrl(route),
    lastModified: new Date()
  }));

  const productEntries = getCatalogProducts()
    .filter((product) => product && product.id && product.isActive !== false)
    .map((product) => ({
      url: getCanonicalProductUrl(product),
      lastModified: getProductUpdatedAt(product) ? new Date(getProductUpdatedAt(product)) : new Date()
    }));

  return [...staticEntries, ...productEntries];
}
