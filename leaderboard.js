import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

/* SAME CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyBoVl_bc3V-DzSzza-1Ymuh13FROKaLxAM",
  authDomain: "biomedicalwastegame.firebaseapp.com",
  projectId: "biomedicalwastegame",
  storageBucket: "biomedicalwastegame.firebasestorage.app",
  messagingSenderId: "502355834534",
  appId: "1:502355834534:web:e7cd3369f7a4b174f3e667",
  measurementId: "G-BBXXM9BXFM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const list = document.getElementById("leaderboardList");

async function loadLeaderboard() {
  const q = query(
    collection(db, "leaderboard"),
    orderBy("score", "desc"),
    limit(10)
  );

  const snapshot = await getDocs(q);
  list.innerHTML = "";

  if (snapshot.empty) {
    list.innerHTML = "<p>No scores yet</p>";
    return;
  }

  snapshot.forEach(doc => {
    const { name, score } = doc.data();
    const row = document.createElement("div");
    row.className = "leaderboard-row";
    row.textContent = `${name} — ${score}`;
    list.appendChild(row);
  });
}

loadLeaderboard();
