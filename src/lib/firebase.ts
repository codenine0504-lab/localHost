
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB6T0zAh64sKZHGm1evMS_exRgyixQQhco",
  authDomain: "localhost-fa8e9.firebaseapp.com",
  projectId: "localhost-fa8e9",
  storageBucket: "localhost-fa8e9.appspot.com",
  messagingSenderId: "72670053488",
  appId: "1:72670053488:web:ee582b2a9419c2aa8be0b5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "main");
export const auth = getAuth(app);
export const storage = getStorage(app);
