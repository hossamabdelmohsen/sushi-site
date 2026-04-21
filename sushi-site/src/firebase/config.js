import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDkzSf7iMQBYEMyTZCuapA3WsLqCRkcXGU",
  authDomain: "sushi-site-d73ee.firebaseapp.com",
  projectId: "sushi-site-d73ee",
  storageBucket: "sushi-site-d73ee.firebasestorage.app",
  messagingSenderId: "605281882896",
  appId: "1:605281882896:web:f8572975953f10ea564b95",
  measurementId: "G-MPZPFGSS9M"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
export const signInWithGoogle = () => signInWithPopup(auth, provider);
