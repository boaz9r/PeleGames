import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBRgFcE0G4YkVeOM5PCzsiJMyvGo3eMU7c",
  authDomain: "pelegames-3058c.firebaseapp.com",
  projectId: "pelegames-3058c",
  storageBucket: "pelegames-3058c.firebasestorage.app",
  messagingSenderId: "1052579266453",
  appId: "1:1052579266453:web:59fda99d5809915af8809c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, "pelegames");

// ── Storage helpers (drop-in replacements for window.storage) ──────────────

export async function saveShared(key, data) {
  try {
    // key format:  "player-data:Name"  →  collection "playerData", doc "Name"
    // key format:  "uncle-claude-apikey" →  collection "settings", doc "apikey"
    const { col, docId } = parseKey(key);
    await setDoc(doc(db, col, docId), { value: JSON.stringify(data), updatedAt: Date.now() });
  } catch (e) {
    console.error("Firebase saveShared:", e);
  }
}

export async function loadShared(key, fallback) {
  try {
    const { col, docId } = parseKey(key);
    const snap = await getDoc(doc(db, col, docId));
    if (snap.exists()) return JSON.parse(snap.data().value);
    return fallback;
  } catch {
    return fallback;
  }
}

export async function deleteShared(key) {
  try {
    const { col, docId } = parseKey(key);
    await deleteDoc(doc(db, col, docId));
  } catch (e) {
    console.error("Firebase deleteShared:", e);
  }
}

export async function listShared(prefix) {
  try {
    // prefix is always "player-data:" so we list the playerData collection
    const snap = await getDocs(collection(db, "playerData"));
    return snap.docs.map(d => `player-data:${d.id}`);
  } catch {
    return [];
  }
}

function parseKey(key) {
  if (key.startsWith("player-data:")) {
    return { col: "playerData", docId: key.replace("player-data:", "") };
  }
  // settings keys: uncle-claude-apikey, uncle-claude-avatar, uncle-claude-testmode
  return { col: "settings", docId: key.replace("uncle-claude-", "") };
}
