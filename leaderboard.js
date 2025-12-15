// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBoVl_bc3V-DzSzza-1Ymuh13FROKaLxAM",
    authDomain: "biomedicalwastegame.firebaseapp.com",
    projectId: "biomedicalwastegame",
    storageBucket: "biomedicalwastegame.firebasestorage.app",
    messagingSenderId: "502355834534",
    appId: "1:502355834534:web:e7cd3369f7a4b174f3e667"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// UI Element
const list = document.getElementById("leaderboardList");

// Fetch top 50 scores
db.collection("leaderboard")
  .orderBy("score", "desc")
  .limit(50)
  .get()
  .then(snapshot => {
      list.innerHTML = "";
      let rank = 1;

      snapshot.forEach(doc => {
          const data = doc.data();

          let medal = "";
          if (rank === 1) medal = `<span class="rank-medal rank-gold">🥇</span>`;
          else if (rank === 2) medal = `<span class="rank-medal rank-silver">🥈</span>`;
          else if (rank === 3) medal = `<span class="rank-medal rank-bronze">🥉</span>`;
          else medal = `<span class="rank-medal">#${rank}</span>`;

          const row = document.createElement("div");
          row.className = "player-row";
          row.innerHTML = `
              <div>${medal}</div>
              <div>${data.name}</div>
              <div class="score">${data.score} pts</div>
          `;

          list.appendChild(row);
          rank++;
      });
  })
  .catch(err => {
      console.error(err);
      list.innerHTML = `<p style="color:red;">Failed to load leaderboard.</p>`;
  });
