import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc,
  doc,
  getDoc,
  getDocs, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  setDoc,
  runTransaction
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

export const saveLecturerReviewToFirestore = async (reviewData) => {
  try {
    const lecturerRef = doc(db, 'lecturers', reviewData.lecturerId);
    const reviewRef = doc(collection(db, 'lecturer_reviews'));
    await runTransaction(db, async (transaction) => {
      const lecturerSnapshot = await transaction.get(lecturerRef);
      const previousSummary = lecturerSnapshot.data()?.reviewSummary || { count: 0, criteria: {} };
      const count = Number(previousSummary.count) || 0;
      const criteria = Object.fromEntries(
        Object.entries(reviewData.ratings).map(([key, score]) => {
          const previousAverage = Number(previousSummary.criteria?.[key]) || 0;
          return [key, Number(((previousAverage * count + score) / (count + 1)).toFixed(2))];
        })
      );
      const average = Object.values(criteria).reduce((total, score) => total + score, 0) / Object.keys(criteria).length;

      transaction.set(reviewRef, {
        ...reviewData,
        reviewId: reviewRef.id,
        createdAt: serverTimestamp(),
        createdAtMillis: Date.now()
      });
      transaction.set(lecturerRef, {
        reviewSummary: {
          count: count + 1,
          average: Number(average.toFixed(2)),
          criteria,
          updatedAt: serverTimestamp()
        },
        updatedAt: serverTimestamp()
      }, { merge: true });
    });
    return reviewRef.id;
  } catch (error) {
    console.error('Error writing lecturer evaluation to Firestore:', error);
    throw error;
  }
};

export const syncLecturersToFirestore = async (schools) => {
  try {
    await Promise.all(schools.flatMap((school) => school.lecturers.map(async (lecturer) => {
      const lecturerRef = doc(db, 'lecturers', lecturer.id);
      const lecturerSnapshot = await getDoc(lecturerRef);
      await setDoc(lecturerRef, {
        uid: lecturer.id,
        schoolId: school.id,
        schoolName: school.name,
        name: lecturer.name,
        title: lecturer.title,
        department: lecturer.department,
        email: lecturer.email,
        office: lecturer.office,
        ...(lecturerSnapshot.exists() ? {} : { reviews: lecturer.reviews }),
        updatedAt: serverTimestamp()
      }, { merge: true });
    })));
  } catch (error) {
    console.error('Error syncing lecturers to Firestore:', error);
    throw error;
  }
};

const normalizeLecturerReview = (documentSnapshot) => {
  const data = documentSnapshot.data();
  const rawTimestamp = data.createdAt;
  const createdAtMillis = rawTimestamp && typeof rawTimestamp.toDate === 'function'
    ? rawTimestamp.toDate().getTime()
    : typeof rawTimestamp === 'string' || typeof rawTimestamp === 'number'
      ? new Date(rawTimestamp).getTime()
      : null;

  return {
    id: documentSnapshot.id,
    ...data,
    createdAtMillis: Number.isFinite(createdAtMillis) ? createdAtMillis : null
  };
};

export const subscribeToLecturerReviews = (callback, onError = () => {}) => {
  const q = query(collection(db, 'lecturer_reviews'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (querySnapshot) => {
    callback(querySnapshot.docs.map(normalizeLecturerReview));
  }, (error) => {
    console.error('Error listening to lecturer evaluations:', error);
    onError(error);
  });
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