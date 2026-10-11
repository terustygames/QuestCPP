
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA5uh7T_pimoWZR0960cuMgmk10J6jaCHo",
  authDomain: "random-balls.firebaseapp.com",
  projectId: "random-balls",
  storageBucket: "random-balls.firebasestorage.app",
  messagingSenderId: "978166781680",
  appId: "1:978166781680:web:2e693f12f7e8755d01d435"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export async function signInPlayer() {
  const result = await signInAnonymously(auth);
  return result.user;
}