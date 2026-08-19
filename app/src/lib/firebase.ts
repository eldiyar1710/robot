import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCokcLecDh3ZapAbOu-WVgqHfSH9hGSwdI",
  authDomain: "partner-2974c.firebaseapp.com",
  databaseURL: "https://partner-2974c-default-rtdb.firebaseio.com",
  projectId: "partner-2974c",
  storageBucket: "partner-2974c.firebasestorage.app",
  messagingSenderId: "977820426941",
  appId: "1:977820426941:web:5e5db2b8d24f34e97acdd4",
  measurementId: "G-JN6GYMCF6K",
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getDatabase(firebaseApp);

if (typeof window !== "undefined") {
  void isSupported()
    .then((ok) => {
      if (ok) getAnalytics(firebaseApp);
    })
    .catch(() => undefined);
}
