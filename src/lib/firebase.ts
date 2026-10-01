import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

export const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || 'arise-career-craft-510204',
  appId: process.env.FIREBASE_APP_ID || firebaseConfigJson.appId || '1:49281588493:web:c999d13e53f650ce1fa444',
  apiKey: process.env.FIREBASE_API_KEY || firebaseConfigJson.apiKey || 'AIzaSyAFZRCUEY6r9_zU2lNyaWH_WBpxA_Zcngo',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || 'arise-career-craft-510204.firebaseapp.com',
  firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || 'ai-studio-arisecareercraft-9fa42135-0cda-4eac-ba4a-adf2dd1804fb',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || 'arise-career-craft-510204.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '49281588493'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export default app;
