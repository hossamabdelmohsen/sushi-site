const { cert, getApps, initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const MAX_PRODUCT_ID_LENGTH = 150;

function createReviewSummaryError(message, code = "review_summary_error", statusCode = 500, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
      return {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key
      };
    } catch (error) {
      throw createReviewSummaryError("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.", "invalid_service_account", 500);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || "";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "";
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    return null;
  }

  return { projectId, clientEmail, privateKey };
}

function getAdminDb() {
  const serviceAccount = getServiceAccount();

  if (!serviceAccount) {
    throw createReviewSummaryError("Review summary storage is not configured.", "review_summary_not_configured", 500);
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId
    });
  }

  return getFirestore();
}

function cleanProductId(value) {
  const productId = String(value || "").trim();

  if (!productId || productId.length > MAX_PRODUCT_ID_LENGTH || /[/.#[\]]/.test(productId)) {
    throw createReviewSummaryError("Product id contains unsupported path characters.", "invalid_product_id", 400);
  }

  return productId;
}

function getRatingStats(snapshot) {
  return snapshot.docs.reduce((stats, ratingDoc) => {
    const rating = Number(ratingDoc.data()?.rating);

    if (Number.isFinite(rating) && rating >= 1 && rating <= 5) {
      stats.count += 1;
      stats.sum += rating;
    }

    return stats;
  }, {
    count: 0,
    sum: 0
  });
}

function getProductName(...snapshots) {
  for (const snapshot of snapshots) {
    const match = snapshot.docs.find((ratingDoc) => {
      const productName = ratingDoc.data()?.productName;
      return typeof productName === "string" && productName.trim();
    });

    if (match) {
      return match.data().productName.trim();
    }
  }

  return "";
}

async function refreshReviewSummary(productIdInput) {
  const productId = cleanProductId(productIdInput);
  const db = getAdminDb();
  const [reviewsSnapshot, guestRatingsSnapshot] = await Promise.all([
    db.collection("products").doc(productId).collection("reviews").get(),
    db.collection("products").doc(productId).collection("guestRatings").get()
  ]);
  const signedInStats = getRatingStats(reviewsSnapshot);
  const guestStats = getRatingStats(guestRatingsSnapshot);
  const totalReviews = signedInStats.count + guestStats.count;
  const ratingSum = signedInStats.sum + guestStats.sum;
  const averageRating = totalReviews ? ratingSum / totalReviews : 0;
  const lastUpdated = new Date();
  const summary = {
    productId,
    productName: getProductName(reviewsSnapshot, guestRatingsSnapshot) || productId,
    totalReviews,
    averageRating,
    ratingSum,
    signedInReviewCount: signedInStats.count,
    signedInRatingSum: signedInStats.sum,
    guestRatingCount: guestStats.count,
    guestRatingSum: guestStats.sum,
    lastUpdated
  };

  await db.collection("reviewSummaries").doc(productId).set(summary, { merge: true });

  return {
    ...summary,
    lastUpdated: lastUpdated.toISOString()
  };
}

module.exports = {
  refreshReviewSummary
};
