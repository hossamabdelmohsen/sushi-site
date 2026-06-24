import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, db } from "./firebase-config.js?v=20260502b";
import { getAllProducts } from "./product-catalog.js?v=20260602c";
import { timestampToDate } from "./ui-utils.js?v=20260502b";

const REVIEW_SUMMARIES_CACHE_KEY = "sushi-box-review-summaries:v1";
const REVIEW_SUMMARIES_CACHE_TTL = 5 * 60 * 1000;
const REVIEW_SUMMARIES_COLLECTION = "reviewSummaries";
const GUEST_RATING_IDENTITY_KEY = "sushi-box-guest-rating-id:v1";

function getReviewDocumentId(userId) {
  return userId;
}

function getProductReviewRef(productId, userId) {
  return doc(db, "products", productId, "reviews", getReviewDocumentId(userId));
}

function getProductGuestRatingRef(productId, guestId) {
  return doc(db, "products", productId, "guestRatings", guestId);
}

function getReviewSummaryRef(productId) {
  return doc(db, REVIEW_SUMMARIES_COLLECTION, productId);
}

function getStoredGuestRatingId() {
  if (typeof window === "undefined" || !window.localStorage) {
    throw new Error("Guest rating storage is unavailable in this browser.");
  }

  const existingId = window.localStorage.getItem(GUEST_RATING_IDENTITY_KEY);
  if (existingId && /^[a-zA-Z0-9_-]{16,80}$/.test(existingId)) {
    return existingId;
  }

  const generatedId = typeof window.crypto?.randomUUID === "function"
    ? window.crypto.randomUUID()
    : `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const safeId = generatedId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);

  window.localStorage.setItem(GUEST_RATING_IDENTITY_KEY, safeId);
  return safeId;
}

function isPermissionDeniedError(error) {
  return error && (
    error.code === "permission-denied" ||
    /missing or insufficient permissions/i.test(String(error.message || ""))
  );
}

function getAuthenticatedUser() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user || null);
    });
  });
}

function reviewSortValue(review) {
  const date = timestampToDate(review.updatedAt) || timestampToDate(review.createdAt);
  return date ? date.getTime() : 0;
}

export function getReviewSummary(reviews) {
  const totalReviews = reviews.length;
  const totalRating = reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0);
  const averageRating = totalReviews ? totalRating / totalReviews : 0;

  return {
    totalReviews,
    averageRating
  };
}

function clearCachedReviewSummaries() {
  try {
    sessionStorage.removeItem(REVIEW_SUMMARIES_CACHE_KEY);
  } catch (error) {}
}

async function refreshReviewSummary(productId) {
  const response = await fetch("/api/admin-actions?action=refreshReviewSummary", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ productId })
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.ok !== true) {
    throw new Error(body.error || "Review summary could not be refreshed.");
  }

  clearCachedReviewSummaries();
  return body.summary || null;
}

export async function ensureProductRecord(product) {
  return product;
}

export async function ensureCatalogRecords() {
  return getAllProducts();
}

export async function saveReview(product, user, reviewInput) {
  if (!product || !product.id) {
    throw new Error("Product information is missing.");
  }

  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser || !authenticatedUser.uid) {
    throw new Error("You need to sign in before reviewing.");
  }

  if (user && user.uid && user.uid !== authenticatedUser.uid) {
    throw new Error("Please sign in again before reviewing.");
  }

  const rating = Number(reviewInput.rating);
  const comment = String(reviewInput.comment || "").trim();

  if (rating < 1 || rating > 5) {
    throw new Error("Please select a rating first.");
  }

  const reviewRef = getProductReviewRef(product.id, authenticatedUser.uid);
  const name = authenticatedUser.displayName || "Sushi Box Customer";
  const currentAuthUser = auth.currentUser;

  if (!currentAuthUser || currentAuthUser.uid !== authenticatedUser.uid) {
    throw new Error("Please sign in again before reviewing.");
  }

  const reviewSnapshot = await getDoc(reviewRef);
  const reviewPayload = {
    productId: product.id,
    productName: product.name,
    userId: currentAuthUser.uid,
    name,
    userName: name,
    userPhoto: authenticatedUser.photoURL || "",
    rating,
    comment,
    updatedAt: serverTimestamp()
  };

  if (!reviewSnapshot.exists()) {
    reviewPayload.createdAt = serverTimestamp();
  }

  await setDoc(reviewRef, reviewPayload, { merge: true });

  await refreshReviewSummary(product.id);
}

export async function saveGuestRating(product, ratingInput) {
  if (!product || !product.id) {
    throw new Error("Product information is missing.");
  }

  const rating = Number(ratingInput);

  if (rating < 1 || rating > 5) {
    throw new Error("Please select a rating first.");
  }

  const guestId = getStoredGuestRatingId();
  const guestRatingRef = getProductGuestRatingRef(product.id, guestId);

  const guestRatingSnapshot = await getDoc(guestRatingRef);
  const guestRatingPayload = {
    productId: product.id,
    productName: product.name,
    guestId,
    rating,
    updatedAt: serverTimestamp()
  };

  if (!guestRatingSnapshot.exists()) {
    guestRatingPayload.createdAt = serverTimestamp();
  }

  await setDoc(guestRatingRef, guestRatingPayload, { merge: true });

  await refreshReviewSummary(product.id);
}

export async function deleteReview(productId, userId) {
  if (!productId || !userId) {
    throw new Error("Review identity is incomplete.");
  }

  await deleteDoc(getProductReviewRef(productId, userId));
  await refreshReviewSummary(productId);
}

export function subscribeToProductReviews(productId, onData, onError = console.error) {
  return onSnapshot(collection(db, "products", productId, "reviews"), (snapshot) => {
    const reviews = snapshot.docs.map((reviewDoc) => ({
      id: reviewDoc.id,
      ...reviewDoc.data()
    }));

    reviews.sort((left, right) => reviewSortValue(right) - reviewSortValue(left));
    onData(reviews);
  }, (error) => {
    if (isPermissionDeniedError(error)) {
      onData([]);
      return;
    }

    if (typeof onError === "function") {
      onError(error);
    }
  });
}

export function subscribeToReviewSummaries(onData, onError = console.error) {
  const cachedSummaries = readCachedReviewSummaries();
  if (cachedSummaries) {
    onData(cachedSummaries);
  }

  return onSnapshot(collection(db, REVIEW_SUMMARIES_COLLECTION), (snapshot) => {
    const summaries = getReviewSummariesFromSummarySnapshot(snapshot);
    writeCachedReviewSummaries(summaries);
    onData(summaries);
  }, (error) => {
    if (isPermissionDeniedError(error)) {
      if (!cachedSummaries) {
        onData({});
      }
      return;
    }

    if (typeof onError === "function") {
      onError(error);
    }
  });
}

export function subscribeToProductReviewSummary(productId, onData, onError = console.error) {
  return onSnapshot(getReviewSummaryRef(productId), (snapshot) => {
    if (!snapshot.exists()) {
      onData(null);
      return;
    }

    const summaries = getReviewSummariesFromSummarySnapshot({
      docs: [snapshot]
    });
    onData(summaries[productId] || null);
  }, (error) => {
    if (isPermissionDeniedError(error)) {
      onData(null);
      return;
    }

    if (typeof onError === "function") {
      onError(error);
    }
  });
}

function readCachedReviewSummaries() {
  try {
    const cachedValue = JSON.parse(sessionStorage.getItem(REVIEW_SUMMARIES_CACHE_KEY) || "null");
    if (!cachedValue || Date.now() - cachedValue.cachedAt > REVIEW_SUMMARIES_CACHE_TTL) {
      return null;
    }

    return cachedValue.summaries || null;
  } catch (error) {
    return null;
  }
}

function writeCachedReviewSummaries(summaries) {
  try {
    sessionStorage.setItem(REVIEW_SUMMARIES_CACHE_KEY, JSON.stringify({
      cachedAt: Date.now(),
      summaries
    }));
  } catch (error) {}
}

export async function getReviewSummaries() {
  const cachedSummaries = readCachedReviewSummaries();
  if (cachedSummaries) {
    return cachedSummaries;
  }

  try {
    const snapshot = await getDocs(collection(db, REVIEW_SUMMARIES_COLLECTION));
    const summaries = getReviewSummariesFromSummarySnapshot(snapshot);

    writeCachedReviewSummaries(summaries);
    return summaries;
  } catch (error) {
    if (isPermissionDeniedError(error)) {
      return {};
    }

    throw error;
  }
}

function getReviewSummariesFromSummarySnapshot(snapshot) {
  const summaries = {};

  snapshot.docs.forEach((summaryDoc) => {
    const summary = summaryDoc.data() || {};
    const productId = summary.productId || summaryDoc.id;
    const totalReviews = Math.max(0, Number(summary.totalReviews) || 0);
    const averageRating = totalReviews
      ? Math.max(0, Math.min(5, Number(summary.averageRating) || 0))
      : 0;

    if (!productId) {
      return;
    }

    summaries[productId] = {
      totalReviews,
      averageRating
    };
  });

  return summaries;
}
