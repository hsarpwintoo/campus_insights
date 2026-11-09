import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "campus-insight-623f0.firebaseapp.com",
  projectId: "campus-insight-623f0",
  storageBucket: "campus-insight-623f0.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Auth Helpers
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Auth Error:", error);
    throw error;
  }
};

export const logoutUser = () => signOut(auth);

export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Save feedback document to Firestore
export const saveFeedbackToFirestore = async (feedbackData) => {
  try {
    const docRef = await addDoc(collection(db, 'campus_reviews'), {
      ...feedbackData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error writing to Firestore:', error);
    throw error;
  }
};

const normalizeFeedbackDocument = (documentSnapshot) => {
  const data = documentSnapshot.data();
  const rawTimestamp = data.createdAt;
  const createdAtMillis = rawTimestamp && typeof rawTimestamp.toDate === 'function'
    ? rawTimestamp.toDate().getTime()
    : typeof rawTimestamp === 'string' || typeof rawTimestamp === 'number'
      ? new Date(rawTimestamp).getTime()
      : null;
  const validTimestamp = Number.isFinite(createdAtMillis) ? createdAtMillis : null;

  return {
    id: documentSnapshot.id,
    ...data,
    createdAt: validTimestamp === null
      ? 'Date unavailable'
      : new Date(validTimestamp).toISOString().split('T')[0],
    createdAtMillis: validTimestamp
  };
};

// Real-time listener for instant Feed updates
export const subscribeToFeedbacks = (callback, onError = () => {}) => {
  const q = query(collection(db, 'campus_reviews'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const reviews = querySnapshot.docs.map(normalizeFeedbackDocument);
    callback(reviews);
  }, (error) => {
    console.error('Error listening to Firestore updates:', error);
    onError(error);
  });
};

// Standard async fetch fallback
export const fetchFeedbacksFromFirestore = async ({ throwOnError = false } = {}) => {
  try {
    const q = query(collection(db, 'campus_reviews'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(normalizeFeedbackDocument);
  } catch (error) {
    console.error('Error reading from Firestore:', error);
    if (throwOnError) {
      throw error;
    }
    return [];
  }
};