importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

console.log('[FCM Service Worker] Loading...');

// Config must match index.html and services/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyA7aLkCWaIWlInzQHAnMb4y9XzFBHnRlZw",
  authDomain: "finguru-ai.firebaseapp.com",
  projectId: "finguru-ai",
  storageBucket: "finguru-ai.firebasestorage.app",
  messagingSenderId: "643448473158",
  appId: "1:643448473158:web:fa746228e8eb31ccdd2c47",
  measurementId: "G-1N99X8F4BW"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();
  console.log('[FCM Service Worker] Firebase initialized successfully');

  // Handle background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'Finguru AI';
    const notificationOptions = {
      body: payload.notification?.body || 'Новое уведомление',
      icon: '/vite.svg',
      badge: '/vite.svg',
      tag: 'finguru-notification', // Allows replacing previous notification
      requireInteraction: false,
      data: payload.data || {}
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });

  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    console.log('[FCM] Notification clicked:', event);
    event.notification.close();
    
    // Open app when notification is clicked
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  });

  console.log('[FCM Service Worker] Ready to receive messages');
} catch (error) {
  console.error('[FCM Service Worker] Firebase initialization failed:', error);
}