// firebase.js
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ✅ REAL CONFIG FROM YOUR FIREBASE SCREENSHOT
const firebaseConfig = {
  apiKey: "AIzaSyBoVl_bc3V-DzSzza-1Ymuh13FROKaLxAM",
  authDomain: "biomedicalwastegame.firebaseapp.com",
  projectId: "biomedicalwastegame",
  storageBucket: "biomedicalwastegame.firebasestorage.app",
  messagingSenderId: "502355834534",
  appId: "1:502355834534:web:e7cd3369f7a4b174f3e667"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function saveScore(name, score, timeTaken = 0) {
  try {
    await addDoc(collection(db, "leaderboard"), {
      name: name,
      score: score,
      time: timeTaken,              // ✅ REQUIRED
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("Firestore error:", err);
    return false;
  }
}

