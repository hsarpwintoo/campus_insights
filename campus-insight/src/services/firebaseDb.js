import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
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
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';

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
export const storage = getStorage(app);
storage.maxUploadRetryTime = 8000; // Limit retry loop to 8 seconds instead of default 10 minutes
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

export const isMfuEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const normalized = email.trim().toLowerCase();
  return normalized.endsWith('@lamduan.mfu.ac.th') || normalized.endsWith('@mfu.ac.th');
};

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

// Delete a feedback document from Firestore
export const deleteFeedbackFromFirestore = async (reviewId) => {
  try {
    const docRef = doc(db, 'campus_reviews', reviewId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error('Error deleting feedback from Firestore:', error);
    throw error;
  }
};

// Update an existing feedback document in Firestore
export const updateFeedbackInFirestore = async (reviewId, updateData) => {
  try {
    const docRef = doc(db, 'campus_reviews', reviewId);
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating feedback in Firestore:', error);
    throw error;
  }
};

// Toggle helpful upvote on a review
export const toggleHelpfulFeedback = async (reviewId, userEmail) => {
  if (!reviewId || !userEmail) {
    throw new Error('Review ID and user email are required to upvote.');
  }

  const reviewRef = doc(db, 'campus_reviews', reviewId);
  return await runTransaction(db, async (transaction) => {
    const reviewDoc = await transaction.get(reviewRef);
    if (!reviewDoc.exists()) {
      throw new Error('Review does not exist.');
    }

    const data = reviewDoc.data();
    const currentUsers = Array.isArray(data.helpfulUsers) ? data.helpfulUsers : [];
    const hasVoted = currentUsers.includes(userEmail);

    let updatedUsers;
    let newCount;

    if (hasVoted) {
      updatedUsers = currentUsers.filter((email) => email !== userEmail);
      newCount = Math.max(0, (Number(data.helpfulCount) || 1) - 1);
    } else {
      updatedUsers = [...currentUsers, userEmail];
      newCount = (Number(data.helpfulCount) || 0) + 1;
    }

    transaction.update(reviewRef, {
      helpfulUsers: updatedUsers,
      helpfulCount: newCount,
      updatedAt: serverTimestamp()
    });

    return {
      isHelpful: !hasVoted,
      helpfulCount: newCount
    };
  });
};

// Report a review for content moderation
export const reportFeedback = async (reviewId, userEmail, reason, details = '') => {
  if (!reviewId) throw new Error('Review ID is required.');

  // 1. Log report in feedback_reports collection
  await addDoc(collection(db, 'feedback_reports'), {
    reviewId,
    reporterEmail: userEmail || 'anonymous',
    reason: reason || 'Inappropriate content',
    details: details.trim(),
    createdAt: serverTimestamp(),
    status: 'pending'
  });

  // 2. Increment reportCount and record reporter on review doc
  const reviewRef = doc(db, 'campus_reviews', reviewId);
  return await runTransaction(db, async (transaction) => {
    const reviewDoc = await transaction.get(reviewRef);
    if (!reviewDoc.exists()) return;

    const data = reviewDoc.data();
    const reportedUsers = Array.isArray(data.reportedUsers) ? data.reportedUsers : [];
    const updatedReported = userEmail && !reportedUsers.includes(userEmail)
      ? [...reportedUsers, userEmail]
      : reportedUsers;
    const reportCount = (Number(data.reportCount) || 0) + 1;

    transaction.update(reviewRef, {
      reportCount,
      reportedUsers: updatedReported,
      isFlagged: reportCount >= 3,
      updatedAt: serverTimestamp()
    });

    return { reportCount, isFlagged: reportCount >= 3 };
  });
};

// Client-side image downscaling and compression before upload
export const compressImage = (file, maxWidth = 1200, quality = 0.75) => {
  return new Promise((resolve) => {
    if (!file || typeof window === 'undefined' || !file.type.startsWith('image/')) {
      return resolve({ file, dataUrl: null });
    }

    const reader = new FileReader();
    reader.onerror = () => resolve({ file, dataUrl: null });
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve({ file, dataUrl: null });
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve({ file, dataUrl: null });
            }
            const compressed = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: mimeType, lastModified: Date.now() }
            );
            const dataUrl = canvas.toDataURL(mimeType, quality);
            resolve({ file: compressed, dataUrl });
          },
          mimeType,
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Upload a feedback evidence photo to Firebase Storage with compression and resilient fallback
export const uploadFeedbackPhoto = async (file, userId) => {
  if (!file) return null;

  // 1. Client-side compression: shrinks a 4MB smartphone photo to ~100KB in ~150ms
  let compressed;
  try {
    compressed = await compressImage(file, 1200, 0.75);
  } catch {
    compressed = { file, dataUrl: null };
  }

  const uploadTarget = compressed.file || file;

  // 2. Upload to Firebase Storage with a strict 8s timeout
  try {
    const timestamp = Date.now();
    const cleanName = uploadTarget.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storagePath = `feedback_photos/${userId || 'student'}_${timestamp}_${cleanName}`;
    const storageRef = ref(storage, storagePath);
    
    const uploadTask = uploadBytes(storageRef, uploadTarget, {
      contentType: uploadTarget.type || 'image/jpeg'
    }).then((snapshot) => getDownloadURL(snapshot.ref));

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('STORAGE_TIMEOUT')), 8000);
    });

    const downloadUrl = await Promise.race([uploadTask, timeoutPromise]);
    return downloadUrl;
  } catch (error) {
    console.warn('Firebase Storage upload failed or timed out:', error.message || error);

    // 3. Resilient Fallback: If Storage bucket is 404 or unconfigured, use the compressed base64 data URL
    if (compressed?.dataUrl && compressed.dataUrl.length < 500000) {
      console.info('Saved photo as optimized inline data URL.');
      return compressed.dataUrl;
    }

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