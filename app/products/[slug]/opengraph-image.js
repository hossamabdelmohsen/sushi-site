import { ImageResponse } from "next/og";
import {
  getProductBySlug,
  getProductDescription,
  getProductPrimaryImageUrl
} from "../../../lib/catalog-index.js";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default async function Image({ params }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#111111",
            color: "#ffffff",
            fontSize: 64,
            fontWeight: 700
          }}
        >
          Sushi Box
        </div>
      ),
      size
    );
  }

  const imageUrl = getProductPrimaryImageUrl(product);
  const description = getProductDescription(product);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f7f1e8",
          color: "#111111",
          fontFamily: "Arial, sans-serif"
        }}
      >
        <div
          style={{
            width: "48%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff"
          }}
        >
          <img
            src={imageUrl}
            alt={product.name}
            style={{
              width: 500,
              height: 500,
              objectFit: "contain"
            }}
          />
        </div>
        <div
          style={{
            width: "52%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "70px"
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 700, color: "#d71920", marginBottom: 28 }}>
            Sushi Box
          </div>
          <div style={{ fontSize: 58, lineHeight: 1.05, fontWeight: 800, marginBottom: 28 }}>
            {product.name}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.35, color: "#3f3a34" }}>
            {description}
          </div>
        </div>
      </div>
    ),
    size
  );
}
