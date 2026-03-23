importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDEKJk66lH4kdBFsSgI9m9sIRpT-LDizK4",
  authDomain: "gen-lang-client-0047273615.firebaseapp.com",
  projectId: "gen-lang-client-0047273615",
  storageBucket: "gen-lang-client-0047273615.firebasestorage.app",
  messagingSenderId: "706736874765",
  appId: "1:706736874765:web:053ca9bd8ca81b61d6fc44"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://picsum.photos/seed/branmesage/192/192'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
