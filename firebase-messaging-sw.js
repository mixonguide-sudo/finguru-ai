importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Config must match index.html
const firebaseConfig = {
  apiKey: "AIzaSyA7aLkCWaIWlInzQHAnMb4y9XzFBHnRlZw",
  authDomain: "finguru-ai.firebaseapp.com",
  projectId: "finguru-ai",
  storageBucket: "finguru-ai.firebasestorage.app",
  messagingSenderId: "643448473158",
  appId: "1:643448473158:web:fa746228e8eb31ccdd2c47",
  measurementId: "G-1N99X8F4BW"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg', // Ensure you have an icon
    badge: '/vite.svg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});