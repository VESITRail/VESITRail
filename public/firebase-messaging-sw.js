importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

const firebaseConfig = {
	projectId: "vesitrail-e16b0",
	messagingSenderId: "166739007948",
	authDomain: "vesitrail-e16b0.firebaseapp.com",
	apiKey: "AIzaSyDmv7VLR6SGerZcsNHQYBEnAv3dk_PSMmY",
	appId: "1:166739007948:web:c7aab5a492437b13d9e569",
	storageBucket: "vesitrail-e16b0.firebasestorage.app"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
	if (!payload.notification && payload.data) {
		const notificationTitle = payload.data.title || "VESITRail Notification";

		const notificationOptions = {
			sound: "default",
			icon: "/icons/ios/256.png",
			tag: "vesitrail-notification",
			vibrate: [200, 100, 200, 100, 200],
			body: payload.data.body || "You have a new notification",
			data: {
				url: payload.data.url || "/dashboard/student",
				messageId: payload.messageId || Date.now().toString()
			},
			actions: [
				{
					action: "open",
					title: "Open App"
				}
			]
		};

		return self.registration.showNotification(notificationTitle, notificationOptions);
	}
});

self.addEventListener("notificationclick", function (event) {
	event.notification.close();

	if (event.action === "open" || !event.action) {
		const url = event.notification.data?.url || "/dashboard/student";

		event.waitUntil(
			clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
				for (let i = 0; i < clientList.length; i++) {
					const client = clientList[i];
					if (client.url.includes(url.split("?")[0]) && "focus" in client) {
						return client.focus();
					}
				}

				if (clients.openWindow) {
					return clients.openWindow(url);
				}
			})
		);
	}
});
