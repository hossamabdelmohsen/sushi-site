import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth, db } from "./firebase-config.js?v=20260502b";
import {
  getScopedStorageKey,
  readStorageArray,
  removeLegacyStorageKeys,
  removeStorageKey,
  writeStorageArray
} from "./scoped-storage.js";
import { trackAddToWishlist } from "./analytics-events.js?v=20260602c";

const LEGACY_WISHLIST_STORAGE_KEY = "sushi-box-wishlist";
const WISHLIST_UPDATED_EVENT = "sushi-box:wishlist-updated";
const REMOVED_PRODUCT_IDS = new Set([["zumra", "oyster", "sauce"].join("-") + "-280ml"]);
const REMOVED_PRODUCT_TERMS = [
  ["Zumra", "Oyster", "Sauce"].join(" ") + " - 280 ml",
  ["cdn", "zumra" + "food", "com"].join("."),
  ["zumra" + "food", "com"].join(".")
];

let wishlistState = [];
let activeUserId = auth.currentUser ? auth.currentUser.uid : null;
let wishlistLoading = Boolean(activeUserId);
let wishlistError = "";
let unsubscribeFavorites = null;
let authWatcherStarted = false;
let wishlistMigrationRunId = 0;

function isRemovedProductItem(item) {
  if (!item || REMOVED_PRODUCT_IDS.has(item.id)) {
    return true;
  }

  const haystack = `${item.name || ""} ${item.image || ""}`;
  return REMOVED_PRODUCT_TERMS.some((term) => haystack.includes(term));
}

function normalizeWishlistItem(item) {
  return {
    id: item.id,
    name: item.name || "",
    price: Number(item.price) || 0,
    image: item.image || "",
    category: item.category || ""
  };
}

function getGuestWishlistStorageKey() {
  return getScopedStorageKey("wishlist", null);
}

function clearLegacyWishlistStorage() {
  removeLegacyStorageKeys([LEGACY_WISHLIST_STORAGE_KEY]);
}

function saveGuestWishlist(items) {
  writeStorageArray(getGuestWishlistStorageKey(), dedupeWishlist(items));
}

function readGuestWishlist() {
  const storageKey = getGuestWishlistStorageKey();
  const items = readStorageArray(storageKey);
  const sanitizedItems = dedupeWishlist(items);

  if (sanitizedItems.length !== items.length) {
    writeStorageArray(storageKey, sanitizedItems);
  }

  return sanitizedItems;
}

function dedupeWishlist(items) {
  const uniqueItems = [];
  const seenIds = new Set();

  items.forEach((item) => {
    const normalizedItem = normalizeWishlistItem(item);
    if (!normalizedItem.id || seenIds.has(normalizedItem.id) || isRemovedProductItem(normalizedItem)) {
      return;
    }

    seenIds.add(normalizedItem.id);
    uniqueItems.push(normalizedItem);
  });

  return uniqueItems;
}

function emitWishlistUpdate(items = wishlistState) {
  window.dispatchEvent(new CustomEvent(WISHLIST_UPDATED_EVENT, {
    detail: {
      wishlist: items,
      loading: wishlistLoading,
      error: wishlistError,
      isGuest: !activeUserId
    }
  }));
}

function setWishlistState(items, shouldPersistGuest = false, options = {}) {
  wishlistState = dedupeWishlist(items);
  wishlistLoading = Boolean(options.loading);
  wishlistError = options.error || "";

  if (!activeUserId && shouldPersistGuest) {
    saveGuestWishlist(wishlistState);
  }

  emitWishlistUpdate();
  return wishlistState;
}

function getFavoriteRef(userId, productId) {
  return doc(db, "users", userId, "favorites", productId);
}

function persistFavorite(product) {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser || !currentAuthUser.uid || !product || !product.id) {
    return;
  }

  const item = normalizeWishlistItem({
    id: product.id,
    name: product.name,
    price: product.price,
    image: (product.images && product.images[0]) || product.image || "",
    category: product.category
  });

  setDoc(getFavoriteRef(currentAuthUser.uid, item.id), {
    ...item,
    productId: item.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true }).catch((error) => {
    console.error("Failed to save favorite.", error);
  });
}

function deleteFavorite(productId) {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser || !currentAuthUser.uid || !productId) {
    return;
  }

  deleteDoc(getFavoriteRef(currentAuthUser.uid, productId)).catch((error) => {
    console.error("Failed to remove favorite.", error);
  });
}

async function migrateGuestWishlistToUser(userId, guestWishlist) {
  const items = dedupeWishlist(guestWishlist);
  const userWishlist = await readUserWishlist(userId);
  const existingIds = new Set(userWishlist.map((item) => item.id));
  const mergedWishlist = dedupeWishlist([...userWishlist, ...items]);
  const newItems = mergedWishlist.filter((item) => !existingIds.has(item.id));

  if (!userId || !items.length) {
    return userWishlist;
  }

  await Promise.all(newItems.map((item) => setDoc(getFavoriteRef(userId, item.id), {
    ...item,
    productId: item.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true })));

  removeStorageKey(getGuestWishlistStorageKey());
  return mergedWishlist;
}

async function readUserWishlist(userId) {
  if (!userId) {
    return [];
  }

  const snapshot = await getDocs(collection(db, "users", userId, "favorites"));
  return dedupeWishlist(snapshot.docs.map((favoriteDoc) => ({
    id: favoriteDoc.id,
    ...favoriteDoc.data()
  })));
}

function subscribeToUserFavorites(userId) {
  if (unsubscribeFavorites) {
    unsubscribeFavorites();
    unsubscribeFavorites = null;
  }

  unsubscribeFavorites = onSnapshot(collection(db, "users", userId, "favorites"), (snapshot) => {
    const items = snapshot.docs.map((favoriteDoc) => ({
      id: favoriteDoc.id,
      ...favoriteDoc.data()
    }));

    setWishlistState(items, false);
  }, (error) => {
    console.error("Favorites listener failed.", error);
    setWishlistState([], false, {
      loading: false,
      error: "We could not load your favorites. Please refresh and try again."
    });
  });
}

function ensureAuthWatcher() {
  if (authWatcherStarted) {
    return;
  }

  authWatcherStarted = true;

  onAuthStateChanged(auth, (user) => {
    clearLegacyWishlistStorage();

    if (unsubscribeFavorites) {
      unsubscribeFavorites();
      unsubscribeFavorites = null;
    }

    const nextUserId = user && user.uid ? user.uid : null;
    const previousUserId = activeUserId;
    wishlistMigrationRunId += 1;
    const migrationRunId = wishlistMigrationRunId;

    if (!nextUserId) {
      activeUserId = null;
      setWishlistState(readGuestWishlist(), false, { loading: false });
      return;
    }

    const guestWishlist = readGuestWishlist();
    activeUserId = nextUserId;

    if (previousUserId === nextUserId) {
      subscribeToUserFavorites(activeUserId);
      return;
    }

    setWishlistState([], false, { loading: true });

    migrateGuestWishlistToUser(activeUserId, guestWishlist).catch((error) => {
      console.error("Failed to migrate guest favorites.", error);
      return readUserWishlist(activeUserId).catch(() => []);
    }).then((items) => {
      if (activeUserId !== nextUserId || migrationRunId !== wishlistMigrationRunId) {
        return;
      }

      setWishlistState(items || [], false, { loading: false });
      subscribeToUserFavorites(activeUserId);
    });
  });
}

clearLegacyWishlistStorage();
if (!activeUserId) {
  wishlistState = readGuestWishlist();
}
ensureAuthWatcher();

export function getWishlist() {
  return wishlistState.slice();
}

export function getWishlistCount() {
  return getWishlist().length;
}

export function isProductWishlisted(productId) {
  return getWishlist().some((item) => item.id === productId);
}

export function addWishlistItem(product) {
  if (!product || !product.id) {
    return getWishlist();
  }

  const item = normalizeWishlistItem({
    id: product.id,
    name: product.name,
    price: product.price,
    image: (product.images && product.images[0]) || product.image || "",
    category: product.category
  });
  const currentAuthUser = auth.currentUser;
  const nextWishlist = setWishlistState([...wishlistState, item], !currentAuthUser);

  if (currentAuthUser) {
    persistFavorite(product);
  }

  trackAddToWishlist(item);
  return nextWishlist;
}

export function removeWishlistItem(productId) {
  const currentAuthUser = auth.currentUser;
  const nextWishlist = setWishlistState(wishlistState.filter((item) => item.id !== productId), !currentAuthUser);

  if (currentAuthUser) {
    deleteFavorite(productId);
  }

  return nextWishlist;
}

export function toggleWishlistItem(product) {
  if (!product || !product.id) {
    return {
      added: false,
      wishlist: getWishlist()
    };
  }

  if (isProductWishlisted(product.id)) {
    return {
      added: false,
      wishlist: removeWishlistItem(product.id)
    };
  }

  return {
    added: true,
    wishlist: addWishlistItem(product)
  };
}

export function clearWishlist() {
  const previousWishlist = getWishlist();
  const currentAuthUser = auth.currentUser;
  const nextWishlist = setWishlistState([], !currentAuthUser);

  if (currentAuthUser) {
    previousWishlist.forEach((item) => deleteFavorite(item.id));
  }

  return nextWishlist;
}

export function subscribeToWishlist(callback) {
  const handleUpdate = (event) => {
    callback(event.detail.wishlist, event.detail);
  };

  window.addEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
  callback(getWishlist(), {
    wishlist: getWishlist(),
    loading: wishlistLoading,
    error: wishlistError,
    isGuest: !activeUserId
  });

  return () => {
    window.removeEventListener(WISHLIST_UPDATED_EVENT, handleUpdate);
  };
}
