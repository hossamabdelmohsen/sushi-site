import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDkzSf7iMQBYEMyTZCuapA3WsLqCRkcXGU",
  authDomain: "www.sushiboxshop.com",
  projectId: "sushi-site-d73ee",
  storageBucket: "sushi-site-d73ee.firebasestorage.app",
  messagingSenderId: "605281882896",
  appId: "1:605281882896:web:f8572975953f10ea564b95",
  measurementId: "G-MPZPFGSS9M"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});

export const analyticsReady = isSupported()
  .then((supported) => (supported ? getAnalytics(firebaseApp) : null))
  .catch(() => null);
