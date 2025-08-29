
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKWf4kyQAXYY--WWjxHJVNEZ7nmKEYWfI",
  authDomain: "localhost-16v7h.firebaseapp.com",
  projectId: "localhost-16v7h",
  storageBucket: "localhost-16v7h.appspot.com",
  messagingSenderId: "588349054039",
  appId: "1:588349054039:web:76f7a3a8e5650bb0791712"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
