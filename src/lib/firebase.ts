
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging, getToken, onMessage } from "firebase/messaging";


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
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestForToken = async () => {
    if (!messaging) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: "BJlE8ornMI0iCYUeoUMSje7mxfohdpJBuid2v8l4iQKJPvfjvlr5EypSz83hvNX9xNA7pnJ1N7B8n4HYJ-RhsEA", // TODO: Add your VAPID key here
        });
        console.log("FCM Token:", token);
        // Save this token to your Firestore or backend
        return token;
      } else {
        console.warn("Notification permission denied");
      }
    } catch (err) {
      console.error("Error getting FCM token", err);
    }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
});
