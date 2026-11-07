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

// Real-time listener for instant Feed updates
export const subscribeToFeedbacks = (callback) => {
  const q = query(collection(db, 'campus_reviews'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (querySnapshot) => {
    const reviews = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      let dateString = new Date().toISOString().split('T')[0];
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        dateString = data.createdAt.toDate().toISOString().split('T')[0];
      }

      reviews.push({
        id: doc.id,
        ...data,
        createdAt: dateString
      });
    });
    
    callback(reviews);
  }, (error) => {
    console.error('Error listening to Firestore updates:', error);
  });
};

// Standard async fetch fallback
export const fetchFeedbacksFromFirestore = async () => {
  try {
    const q = query(collection(db, 'campus_reviews'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const reviews = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      let dateString = new Date().toISOString().split('T')[0];
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        dateString = data.createdAt.toDate().toISOString().split('T')[0];
      }
      reviews.push({ id: doc.id, ...data, createdAt: dateString });
    });
    
    return reviews;
  } catch (error) {
    console.error('Error reading from Firestore:', error);
    return [];
  }
};