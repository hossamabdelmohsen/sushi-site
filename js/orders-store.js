import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, db } from "./firebase-config.js?v=20260502b";
import { getGuestSessionId } from "./scoped-storage.js";

function waitForAuthState() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user || null);
    }, () => {
      unsubscribe();
      resolve(null);
    });
  });
}

function getCustomerOrdersCollection(user) {
  if (user && !user.isAnonymous) {
    return {
      ref: collection(db, "users", user.uid, "orders"),
      scope: "user",
      ownerId: user.uid
    };
  }

  const guestId = getGuestSessionId();
  return {
    ref: collection(db, "guestSessions", guestId, "orders"),
    scope: "guest",
    ownerId: guestId
  };
}

function getCustomerOrderDoc(user, orderId) {
  if (user && !user.isAnonymous) {
    return doc(db, "users", user.uid, "orders", orderId);
  }

  return doc(db, "guestSessions", getGuestSessionId(), "orders", orderId);
}

function snapshotToOrders(snapshot) {
  return snapshot.docs.map((orderDoc) => ({
    id: orderDoc.id,
    ...orderDoc.data()
  }));
}

// Read-only customer order access. All order writes happen through Vercel API
// routes so checkout totals and payment status cannot be changed in the browser.
export function subscribeToCustomerOrders(callback) {
  let unsubscribeOrders = null;
  let latestScope = "";

  callback({
    loading: true,
    error: "",
    orders: [],
    scope: "",
    ownerId: ""
  });

  const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    if (unsubscribeOrders) {
      unsubscribeOrders();
      unsubscribeOrders = null;
    }

    const ordersCollection = getCustomerOrdersCollection(user);
    latestScope = ordersCollection.scope;
    callback({
      loading: true,
      error: "",
      orders: [],
      scope: ordersCollection.scope,
      ownerId: ordersCollection.ownerId
    });

    unsubscribeOrders = onSnapshot(
      query(ordersCollection.ref, orderBy("createdAt", "desc"), limit(50)),
      (snapshot) => {
        callback({
          loading: false,
          error: "",
          orders: snapshotToOrders(snapshot),
          scope: ordersCollection.scope,
          ownerId: ordersCollection.ownerId
        });
      },
      (error) => {
        console.error("Orders listener failed.", error);
        callback({
          loading: false,
          error: "We could not load your orders. Please refresh and try again.",
          orders: [],
          scope: latestScope || ordersCollection.scope,
          ownerId: ordersCollection.ownerId
        });
      }
    );
  }, (error) => {
    console.error("Auth listener for orders failed.", error);
    callback({
      loading: false,
      error: "We could not check your account. Please refresh and try again.",
      orders: [],
      scope: "",
      ownerId: ""
    });
  });

  return () => {
    if (unsubscribeOrders) {
      unsubscribeOrders();
    }
    unsubscribeAuth();
  };
}

export async function getCurrentCustomerOrder(orderId) {
  const cleanOrderId = String(orderId || "").trim();
  if (!cleanOrderId) {
    return null;
  }

  const user = await waitForAuthState();
  const snapshot = await getDoc(getCustomerOrderDoc(user, cleanOrderId));
  return snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : null;
}
