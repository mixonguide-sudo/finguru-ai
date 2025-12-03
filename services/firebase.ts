
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot,
  enableIndexedDbPersistence
} from 'firebase/firestore';
// Note: We use dynamic imports for messaging to prevent crashes in unsupported browsers
import { Transaction, Settings, BudgetStrategy, SavingsGoal, RecurringExpense, CategoryPlan, UserProfile, Investment, ChatMessage } from '../types';
import { toLocalISOString } from '../utils/dateUtils';

const firebaseConfig = {
  apiKey: "AIzaSyA7aLkCWaIWlInzQHAnMb4y9XzFBHnRlZw",
  authDomain: "finguru-ai.firebaseapp.com",
  projectId: "finguru-ai",
  storageBucket: "finguru-ai.firebasestorage.app",
  messagingSenderId: "643448473158",
  appId: "1:643448473158:web:fa746228e8eb31ccdd2c47",
  measurementId: "G-1N99X8F4BW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Attempt to enable offline persistence
try {
  enableIndexedDbPersistence(db).catch((err) => {
      if (err.code == 'failed-precondition') {
          console.warn('Persistence failed: Multiple tabs open.');
      } else if (err.code == 'unimplemented') {
          console.warn('Persistence not supported by browser.');
      }
  });
} catch (e) {
  console.warn("Offline persistence setup failed", e);
}

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Login Error:", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
};

export const loginWithEmail = async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
};

export const logoutUser = async () => {
  await signOut(auth);
};

// --- FCM Logic (Dynamic Import) ---

const VAPID_KEY = 'BNadsMray8fSItPmJwbTKmuM8zQI_CeYgwMN15imokkDaKka4neTKxb5TD2VkfiC5JKNohWGB42lN9iQS34ET2Q'; 

export const requestFCMToken = async () => {
  try {
    // Dynamically import messaging to avoid crash if unsupported
    const { getMessaging, getToken } = await import('firebase/messaging');
    const messaging = getMessaging(app);

    // Explicitly register service worker to ensure correct scope
    let registration;
    try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    } catch (e) {
        console.warn("SW Registration for FCM failed, trying default flow", e);
    }

    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration 
    });
    
    console.log('FCM Token:', token);
    return token;

  } catch (error) {
    console.warn('FCM request failed (likely permission denied or unsupported):', error);
    return null;
  }
};

export const saveFCMToken = async (userId: string, token: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, { fcmToken: token }, { merge: true });
    console.log('FCM Token saved to Firestore');
  } catch (error) {
    console.error("Error saving FCM token:", error);
  }
};

export const onForegroundMessage = async (callback: (payload: any) => void) => {
  try {
    const { getMessaging, onMessage } = await import('firebase/messaging');
    const messaging = getMessaging(app);
    
    onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch (error) {
    console.log('FCM Foreground listener not supported');
  }
};

// --- Sync Functions ---

export interface UserData {
  transactions: Transaction[];
  settings: Settings;
  strategy: BudgetStrategy;
  goals: SavingsGoal[];
  recurring: RecurringExpense[];
  plans: CategoryPlan[];
  profile: UserProfile;
  investments: Investment[];
  chatHistory: ChatMessage[];
  lastUpdated: string;
}

// Helper to remove undefined values which Firestore hates
const sanitizeData = (data: any): any => {
    if (data === undefined) return null;
    if (data === null) return null;
    // Fix NaN which breaks firestore
    if (typeof data === 'number' && Number.isNaN(data)) return 0; 

    if (Array.isArray(data)) {
        return data.map(item => sanitizeData(item));
    }
    
    if (typeof data === 'object' && data !== null) {
        // Convert dates to strings if they somehow are Date objects
        if (data instanceof Date) return data.toISOString();

        const result: any = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                result[key] = sanitizeData(data[key]);
            }
        }
        return result;
    }
    return data;
};

export const saveUserData = async (userId: string, data: UserData) => {
  try {
    const safeData = sanitizeData(data);
    await setDoc(doc(db, 'users', userId), {
      ...safeData,
      lastUpdated: toLocalISOString(new Date())
    }, { merge: true });
    
  } catch (error: any) {
    if (error.code === 'permission-denied') {
        console.error("[Firebase] SAVE FAILED: Permission denied.");
    } else {
        console.error("[Firebase] Save Error:", error);
    }
    throw error;
  }
};

export const subscribeToUserData = (userId: string, onUpdate: (data: UserData | null) => void) => {
    return onSnapshot(doc(db, 'users', userId), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data() as UserData;
            onUpdate(data);
        } else {
            onUpdate(null);
        }
    }, (error) => {
        if (error.code === 'permission-denied') {
            console.error("[Firebase] SYNC FAILED: Permission denied.");
        } else {
            console.error("[Firebase] Subscription Error:", error);
        }
    });
};
