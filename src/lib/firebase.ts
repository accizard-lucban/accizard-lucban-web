// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyA5I-a7w1LnS9Ww7okoCsq4BO6ri3sJ8ro",
  authDomain: "accizard-lucban.firebaseapp.com",
  projectId: "accizard-lucban",
  storageBucket: "accizard-lucban.firebasestorage.app",
  messagingSenderId: "967856342376",
  appId: "1:967856342376:web:e3b8db3a6fb8470c1802dd",
  measurementId: "G-JDHN4P95S8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export default app;
export { auth, db, storage };
const analytics = getAnalytics(app); 