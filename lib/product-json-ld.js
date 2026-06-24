import {
  getCanonicalProductUrl,
  getProductDescription,
  getProductPrimaryImageUrl
} from "./catalog-index.js";

function getProductDetail(product, label) {
  const normalizedLabel = String(label || "").trim().toLowerCase();
  const detail = Array.isArray(product?.itemDetails)
    ? product.itemDetails.find((item) => String(item.label || "").trim().toLowerCase() === normalizedLabel)
    : null;

  return detail?.value || "";
}

export function buildProductJsonLd(product) {
  if (!product) {
    return null;
  }

  const price = Number(product.salePrice ?? product.price) || 0;
  const brand = getProductDetail(product, "Brand") || "Sushi Box";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: getProductDescription(product),
    image: [getProductPrimaryImageUrl(product)],
    sku: product.id,
    productID: product.id,
    brand: {
      "@type": "Brand",
      name: brand
    },
    offers: {
      "@type": "Offer",
      url: getCanonicalProductUrl(product),
      priceCurrency: "EGP",
      price: price.toFixed(2),
      availability: product.stockStatus === "out_of_stock"
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition"
    }
  };
}
