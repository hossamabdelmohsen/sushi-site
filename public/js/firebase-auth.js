import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db, googleProvider } from "./firebase-config.js?v=20260701a";

let currentUser = null;

async function syncUserRecord(user) {
  if (!user) {
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const payload = {
    uid: user.uid,
    displayName: user.displayName || "Sushi Box Customer",
    email: user.email || "",
    photoURL: user.photoURL || "",
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if (!snapshot.exists()) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(userRef, payload, { merge: true });
}

export function getCurrentUser() {
  return currentUser;
}

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, async (user) => {
    currentUser = user || null;

    if (user) {
      try {
        await syncUserRecord(user);
      } catch (error) {
        console.error("Failed to sync user profile.", error);
      }
    }

    callback(currentUser);
  });
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser() {
  await signOut(auth);
}
