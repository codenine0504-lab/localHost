
/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyCKWf4kyQAXYY--WWjxHJVNEZ7nmKEYWfI",
  authDomain: "localhost-16v7h.firebaseapp.com",
  projectId: "localhost-16v7h",
  storageBucket: "localhost-16v7h.appspot.com",
  messagingSenderId: "588349054039",
  appId: "1:588349054039:web:76f7a3a8e5650bb0791712"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message: ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon-192x192.png"
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
