import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAj2N1rJoyGBoKX0s5w34Nf907MIfnM_J0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "splitthis-50c1e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "splitthis-50c1e",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "splitthis-50c1e.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "989582334432",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:989582334432:web:3912d2955f4cafda833385",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
