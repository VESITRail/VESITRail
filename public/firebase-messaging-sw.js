importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    projectId: "vesitrail-e16b0",
    messagingSenderId: "166739007948",
    authDomain: "vesitrail-e16b0.firebaseapp.com",
    apiKey: "AIzaSyDmv7VLR6SGerZcsNHQYBEnAv3dk_PSMmY",
    appId: "1:166739007948:web:c7aab5a492437b13d9e569",
    storageBucket: "vesitrail-e16b0.firebasestorage.app",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    const notificationTitle = payload.notification?.title || 'VESITRail Notification';
    const notificationOptions = {
        icon: '/icons/ios/256.png',
        body: payload.notification?.body || 'You have a new notification',
        data: {
            url: payload.data?.url || '/dashboard/student'
        }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    const url = event.notification.data?.url || '/dashboard/student';

    event.waitUntil(
        clients.openWindow(url)
    );
});
