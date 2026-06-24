const crypto = require("crypto");
const { getFirestoreProjectId } = require("./order-storage.cjs");

const FIREBASE_CERTS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const FALLBACK_FIREBASE_PROJECT_ID = "sushi-site-d73ee";

let certCache = {
  certs: null,
  expiresAt: 0
};

function base64UrlDecode(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64");
}

function parseJwt(idToken) {
  const parts = String(idToken || "").split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid Firebase sign-in token.");
  }

  return {
    header: JSON.parse(base64UrlDecode(parts[0]).toString("utf8")),
    payload: JSON.parse(base64UrlDecode(parts[1]).toString("utf8")),
    signedData: `${parts[0]}.${parts[1]}`,
    signature: base64UrlDecode(parts[2])
  };
}

function getFirebaseProjectId() {
  return process.env.FIREBASE_PROJECT_ID
    || process.env.GOOGLE_CLOUD_PROJECT
    || getFirestoreProjectId()
    || FALLBACK_FIREBASE_PROJECT_ID;
}

function getCacheMaxAge(cacheControl) {
  const match = String(cacheControl || "").match(/max-age=(\d+)/i);
  return match ? Number(match[1]) : 3600;
}

async function getFirebaseCerts() {
  const now = Math.floor(Date.now() / 1000);
  if (certCache.certs && certCache.expiresAt > now + 60) {
    return certCache.certs;
  }

  const response = await fetch(FIREBASE_CERTS_URL, {
    headers: {
      "Accept": "application/json"
    }
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || !body || typeof body !== "object") {
    throw new Error("Unable to verify Firebase sign-in token.");
  }

  certCache = {
    certs: body,
    expiresAt: now + getCacheMaxAge(response.headers.get("cache-control"))
  };

  return certCache.certs;
}

async function verifyFirebaseIdToken(idToken) {
  const { header, payload, signedData, signature } = parseJwt(idToken);
  const projectId = getFirebaseProjectId();
  const now = Math.floor(Date.now() / 1000);

  if (header.alg !== "RS256" || !header.kid) {
    throw new Error("Invalid Firebase sign-in token.");
  }

  const certs = await getFirebaseCerts();
  const cert = certs[header.kid];
  if (!cert) {
    throw new Error("Firebase sign-in token could not be verified.");
  }

  const validSignature = crypto
    .createVerify("RSA-SHA256")
    .update(signedData)
    .verify(cert, signature);

  if (!validSignature) {
    throw new Error("Firebase sign-in token signature is invalid.");
  }

  if (payload.aud !== projectId || payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error("Firebase sign-in token was issued for a different project.");
  }

  if (!payload.sub || typeof payload.sub !== "string" || payload.sub.length > 128) {
    throw new Error("Firebase sign-in token is missing its user id.");
  }

  if (Number(payload.exp) <= now || Number(payload.iat) > now + 60) {
    throw new Error("Firebase sign-in token has expired.");
  }

  return {
    uid: payload.sub,
    email: payload.email || "",
    emailVerified: payload.email_verified === true,
    name: payload.name || "",
    picture: payload.picture || ""
  };
}

module.exports = {
  getFirebaseProjectId,
  verifyFirebaseIdToken
};
