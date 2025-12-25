const firebaseConfig = {
  apiKey: "AIzaSyBoVl_bc3V-DzSzza-1Ymuh13FROKaLxAM",
  authDomain: "biomedicalwastegame.firebaseapp.com",
  projectId: "biomedicalwastegame",
  storageBucket: "biomedicalwastegame.firebasestorage.app",
  messagingSenderId: "502355834534",
  appId: "1:502355834534:web:e7cd3369f7a4b174f3e667"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let allAttempts = [];
let performanceChart = null;

document.addEventListener("DOMContentLoaded", () => {
  loadAnalytics();
});

async function loadAnalytics() {
  try {
    const snapshot = await db
      .collection("game_attempts")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    allAttempts = [];
    snapshot.forEach(doc => {
      const d = doc.data();
      allAttempts.push({
        name: d.name,
        score: d.score,
        accuracy: d.accuracy,
        createdAt: d.createdAt ? d.createdAt.toDate() : new Date()
      });
    });

    renderAnalytics();

  } catch (err) {
    console.error("Analytics load error:", err);
  }
}

function renderAnalytics() {
  const container = document.getElementById("analyticsTab");
  const playerName = localStorage.getItem("playerName");

  const myAttempts = allAttempts.filter(a => a.name === playerName);

  if (myAttempts.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:#9aa0a6">
        No performance data available<br>
        Play the game to generate analytics
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <h2>Your Performance</h2>
    <canvas id="scoreChart"></canvas>
  `;

  renderChart(myAttempts);
}

function renderChart(attempts) {
  const ctx = document.getElementById("scoreChart");
  if (!ctx) return;

  if (performanceChart) performanceChart.destroy();

  const labels = attempts.map((_, i) => `Game ${i + 1}`).reverse();
  const scores = attempts.map(a => a.score).reverse();

  performanceChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Score",
        data: scores,
        borderWidth: 3,
        fill: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
