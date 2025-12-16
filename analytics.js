import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";

/* =====================================================
   FIREBASE CONFIG (SAME AS firebase.js)
===================================================== */
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

/* =====================================================
   LOAD ANALYTICS
===================================================== */
async function loadAnalytics() {
  const snapshot = await getDocs(collection(db, "leaderboard"));

  if (snapshot.empty) {
    console.warn("No analytics data found");
    return;
  }

  let totalAttempts = 0;
  let totalScore = 0;
  let bestScore = 0;

  const labels = [];
  const scores = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    totalAttempts++;
    totalScore += data.score;
    bestScore = Math.max(bestScore, data.score);

    labels.push(data.name);
    scores.push(data.score);
  });

  const avgScore = Math.round(totalScore / totalAttempts);

  renderSummary(totalAttempts, avgScore, bestScore);
  renderChart(labels, scores);
}

/* =====================================================
   SUMMARY
===================================================== */
function renderSummary(total, avg, best) {
  const container = document.createElement("div");
  container.className = "analytics-summary";

  container.innerHTML = `
    <div class="stat-card">
      <h3>Total Attempts</h3>
      <p>${total}</p>
    </div>
    <div class="stat-card">
      <h3>Average Score</h3>
      <p>${avg}</p>
    </div>
    <div class="stat-card">
      <h3>Best Score</h3>
      <p>${best}</p>
    </div>
  `;

  document
    .querySelector(".analytics-container")
    .insertBefore(container, document.getElementById("scoreChart"));
}

/* =====================================================
   CHART
===================================================== */
function renderChart(labels, scores) {
  const ctx = document.getElementById("scoreChart");

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Score",
        data: scores
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

loadAnalytics();
