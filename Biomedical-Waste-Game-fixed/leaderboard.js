// leaderboard.js — fixed: converted from ES module to compat SDK to match leaderboard.html

const firebaseConfig = {
  apiKey: "AIzaSyBoVl_bc3V-DzSzza-1Ymuh13FROKaLxAM",
  authDomain: "biomedicalwastegame.firebaseapp.com",
  projectId: "biomedicalwastegame",
  storageBucket: "biomedicalwastegame.firebasestorage.app",
  messagingSenderId: "502355834534",
  appId: "1:502355834534:web:e7cd3369f7a4b174f3e667"
};

// Use compat SDK (loaded via <script> tags in leaderboard.html)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

const list = document.getElementById("leaderboardList");

async function loadLeaderboard() {
  try {
    const snapshot = await db
      .collection("leaderboard")
      .orderBy("score", "desc")
      .limit(10)
      .get();

    list.innerHTML = "";

    if (snapshot.empty) {
      list.innerHTML = "<p class='no-scores'>No scores yet. Be the first! 🎯</p>";
      return;
    }

    snapshot.forEach((doc, index) => {
      const { name, score } = doc.data();
      const rank = ["🥇", "🥈", "🥉"][snapshot.docs.indexOf(doc)] || `#${snapshot.docs.indexOf(doc) + 1}`;
      const row = document.createElement("div");
      row.className = "leaderboard-row";
      row.innerHTML = `<span class="rank">${rank}</span><span class="player-name">${name}</span><span class="player-score">${score} pts</span>`;
      list.appendChild(row);
    });
  } catch (err) {
    console.error("Leaderboard load error:", err);
    list.innerHTML = "<p class='no-scores'>Could not load scores. Check your connection.</p>";
  }
}

loadLeaderboard();
