import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebaseConfig';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  // Keeps people signed in between app launches.
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (e) {
  auth = getAuth(app);
}

let db;
try {
  // Long polling is more reliable on weak mobile connections.
  db = initializeFirestore(app, { experimentalForceLongPolling: true });
} catch (e) {
  db = getFirestore(app);
}

export { app, auth, db };
