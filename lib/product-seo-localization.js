import {
  getCanonicalProductUrl,
  getProductDescription,
  getProductPrimaryImageUrl,
  getProductTitle
} from "./catalog-index.js";

const DEFAULT_LOCALE = "en";
const ARABIC_LOCALE = "ar";
const SUPPORTED_PRODUCT_SEO_LOCALES = new Set([DEFAULT_LOCALE, ARABIC_LOCALE]);

function normalizeLocale(locale) {
  const normalized = String(locale || DEFAULT_LOCALE).trim().toLowerCase();
  return SUPPORTED_PRODUCT_SEO_LOCALES.has(normalized) ? normalized : DEFAULT_LOCALE;
}

function getTranslationFromMap(slug, translationMap) {
  if (!slug || !translationMap || typeof translationMap !== "object") {
    return null;
  }

  return translationMap[String(slug)] || null;
}

function getTranslatedDescription(product, translation) {
  return String(
    translation?.seoDescription
    || translation?.description
    || translation?.longDescriptionIntro
    || getProductDescription(product)
  )
    .replace(/\s+/g, " ")
    .trim();
}

export function getProductArabicTranslation(slug, options = {}) {
  return getTranslationFromMap(slug, options.translationMap);
}

export function getLocalizedProductSeo(product, locale = DEFAULT_LOCALE, options = {}) {
  const normalizedLocale = normalizeLocale(locale);
  const translation = normalizedLocale === ARABIC_LOCALE
    ? getProductArabicTranslation(product?.id, options)
    : null;

  const name = translation?.seoTitle || translation?.name || product?.name || "";
  const description = getTranslatedDescription(product, translation);

  return {
    locale: normalizedLocale,
    name,
    title: translation ? `${translation.seoTitle || name} | Sushi Box` : getProductTitle(product),
    description,
    canonicalUrl: getCanonicalProductUrl(product),
    imageUrl: getProductPrimaryImageUrl(product),
    imageAlt: name || product?.name || "Sushi Box product"
  };
}
