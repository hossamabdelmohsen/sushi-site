# Phase 12A Arabic SEO Audit

Date: 2026-06-28

## Current SEO Surfaces Audited

- `app/products/[slug]/page.js`
- `app/products/[slug]/opengraph-image.js`
- `app/sitemap.js`
- `app/robots.js`
- `lib/catalog-index.js`
- `lib/product-metadata.js`
- `lib/product-json-ld.js`
- `lib/site-url.js`

## Current Public Behavior

- Product SEO routes remain `/products/[slug]`.
- Legacy product URLs remain `/product.html?product=slug`.
- Canonical product URLs are built with `getCanonicalProductUrl(product)` and still point to `/products/[slug]`.
- Product metadata is still built by `buildProductMetadata(product)`.
- Product JSON-LD is still built by `buildProductJsonLd(product)`.
- Product Open Graph image output still reads English catalog name and description from catalog helpers.
- Sitemap still contains static English/site routes and canonical product URLs only.
- Robots still allows the site, disallows `/api/` and `/admin-orders.html`, and points to `/sitemap.xml`.

## Arabic Translation Safety

Phase 9 Arabic product translations currently live in `js/i18n/product-translations-ar.js` and `public/js/i18n/product-translations-ar.js`.
That file exports `SUSHI_PRODUCT_TRANSLATIONS_AR`, but it also assigns the same object to `window` when a browser is present.

For Phase 12A, these translations were not imported into `app/products/[slug]/page.js` or any active Next SEO route.
Future Arabic SEO should use a server-safe shared translation module or pass a server-safe translation map into `getLocalizedProductSeo(product, "ar", { translationMap })`.

## Safe Prep Added

- `lib/product-seo-localization.js`
  - `getLocalizedProductSeo(product, locale, options)`
  - `getProductArabicTranslation(slug, options)`

The helper is not wired into public metadata yet. English SEO output therefore remains unchanged.

## Deferred Until Real Arabic SEO Routes Exist

- Do not add `/ar/products/[slug]` yet.
- Do not add Arabic sitemap entries yet.
- Do not add hreflang links yet.
- Do not change canonical URLs yet.
- Do not change Open Graph, Twitter Cards, or JSON-LD output yet.

## Recommended Next Step

Create a server-safe shared Arabic product translation module, for example `lib/product-translations-ar.js`, generated from or kept in sync with the Phase 9 translation data. Then add real `/ar/products/[slug]` routes, Arabic metadata, Arabic JSON-LD, Arabic sitemap entries, and hreflang links in one coordinated phase.

