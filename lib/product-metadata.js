import {
  getCanonicalProductUrl,
  getProductDescription,
  getProductPrimaryImageUrl,
  getProductTitle
} from "./catalog-index.js";
import { getAbsoluteUrl } from "./site-url.js";

const SITE_NAME = "Sushi Box";

export function buildProductMetadata(product) {
  if (!product) {
    return {
      title: "Product not found | Sushi Box",
      description: "The requested Sushi Box product could not be found.",
      robots: {
        index: false,
        follow: false
      }
    };
  }

  const title = getProductTitle(product);
  const description = getProductDescription(product);
  const url = getCanonicalProductUrl(product);
  const imageUrl = getProductPrimaryImageUrl(product);

  return {
    metadataBase: new URL(getAbsoluteUrl("/")),
    title,
    description,
    alternates: {
      canonical: url
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: 1200,
          height: 1200,
          alt: product.name
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl]
    }
  };
}
