import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
	appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
	apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
	projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
	authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
	storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
};

const app = initializeApp(firebaseConfig);

export const messaging = async () => {
	const supported = await isSupported();
	return supported ? getMessaging(app) : null;
};

export default app;
