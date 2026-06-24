const DEFAULT_SITE_URL = "https://www.sushiboxshop.com";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL;
  return configuredUrl.replace(/\/+$/, "");
}

export function getAbsoluteUrl(pathname = "/") {
  const path = String(pathname || "/");
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
