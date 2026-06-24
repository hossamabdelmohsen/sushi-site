import { getAbsoluteUrl } from "../lib/site-url.js";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin-orders.html"
      ]
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
    host: getAbsoluteUrl("/")
  };
}
