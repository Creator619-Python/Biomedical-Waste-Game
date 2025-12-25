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

/* ===============================
   🏆 LEADERBOARD
================================ */
export async function saveScore(name, score, timeTaken = 0) {
  try {
    await addDoc(collection(db, "leaderboard"), {
      name,
      score,
      time: timeTaken,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("Leaderboard save error:", err);
    return false;
  }
}

/* ===============================
   📊 ANALYTICS (PER GAME ATTEMPT)
================================ */
export async function saveGameAttempt(data) {
  try {
    await addDoc(collection(db, "game_attempts"), {
      ...data,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.error("Analytics save error:", err);
    return false;
  }
}
