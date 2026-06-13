import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/storage";
import "firebase/compat/firestore";
import "firebase/compat/functions";
import "firebase/compat/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  //measurementId: process.env.REACT_APP_MEASUREMENT_ID,
};

let app;

if (firebase.apps.length === 0) {
  app = firebase.initializeApp(firebaseConfig);
} else {
  app = firebase.app();
}
/**
 * Firestore databse call
 * @param collection = blah
 */
const db = app.firestore();
const rtdb = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();
const functions = firebase.functions();

if (typeof window !== "undefined") {
  db.enablePersistence({ synchronizeTabs: true }).catch((error) => {
    if (error?.code === "failed-precondition") {
      db.enablePersistence().catch((fallbackError) => {
        if (fallbackError?.code !== "unimplemented") {
          console.warn("Firestore persistence fallback failed:", fallbackError);
        }
      });
      return;
    }

    if (error?.code !== "unimplemented") {
      console.warn("Firestore persistence unavailable:", error);
    }
  });
}

export { db, rtdb, auth, storage, functions, firebaseConfig, app };
export default firebase;
