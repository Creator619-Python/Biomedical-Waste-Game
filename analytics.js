// analytics.js — Firebase Analytics (FINAL)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";

/* =====================================================
   FIREBASE CONFIG (MUST MATCH game.js)
===================================================== */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* =====================================================
   LOAD ANALYTICS DATA
===================================================== */
async function loadAnalytics() {
  const snapshot = await getDocs(collection(db, "scores"));

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
   SUMMARY METRICS
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
