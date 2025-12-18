import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js";

/* =====================================================
   FIREBASE CONFIG
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
   LOADING STATE
===================================================== */
function showLoading() {
  const canvas = document.getElementById('scoreChart');
  if (canvas) {
    canvas.parentElement.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Loading training analytics...</p>
      </div>
    `;
  }
}

function showError(message) {
  const chartContainer = document.querySelector('.chart-container');
  if (chartContainer) {
    chartContainer.innerHTML = `
      <div class="error">
        <p>⚠️ ${message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

/* =====================================================
   LOAD ANALYTICS
===================================================== */
async function loadAnalytics() {
  showLoading();
  
  try {
    // Get all scores sorted by timestamp
    const q = query(collection(db, "leaderboard"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      showError("No training data available yet. Play the game first!");
      return;
    }

    let totalAttempts = 0;
    let totalScore = 0;
    let bestScore = 0;
    let worstScore = Infinity;
    let allScores = [];
    let recentScores = [];
    let players = new Map(); // Track unique players

    // Process all data
    snapshot.forEach(doc => {
      const data = doc.data();
      const score = data.score || 0;
      const name = data.name || "Anonymous";
      const time = data.time || 0;
      
      totalAttempts++;
      totalScore += score;
      bestScore = Math.max(bestScore, score);
      worstScore = Math.min(worstScore, score);
      
      allScores.push({
        score: score,
        name: name,
        time: time,
        date: data.createdAt?.toDate() || new Date()
      });

      // Track unique players
      if (!players.has(name)) {
        players.set(name, {
          name: name,
          totalScore: 0,
          attempts: 0,
          bestScore: 0
        });
      }
      
      const player = players.get(name);
      player.totalScore += score;
      player.attempts++;
      player.bestScore = Math.max(player.bestScore, score);

      // Get recent 10 attempts for chart
      if (recentScores.length < 10) {
        recentScores.unshift(score);
      }
    });

    // Calculate statistics
    const avgScore = Math.round(totalScore / totalAttempts);
    const accuracyRate = Math.round((totalScore / (totalAttempts * 10)) * 100); // Assuming max 10 points per game
    
    // Sort players by best score
    const topPlayers = Array.from(players.values())
      .sort((a, b) => b.bestScore - a.bestScore)
      .slice(0, 10);

    // Prepare chart data
    const labels = Array.from({length: recentScores.length}, (_, i) => `Attempt ${i + 1}`);
    
    // Calculate moving average
    const movingAvg = [];
    for (let i = 0; i < recentScores.length; i++) {
      const slice = recentScores.slice(0, i + 1);
      const avg = Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
      movingAvg.push(avg);
    }

    renderSummary(totalAttempts, avgScore, bestScore, worstScore, accuracyRate);
    renderChart(labels, recentScores, movingAvg);
    renderTopPlayers(topPlayers);

  } catch (error) {
    console.error("Error loading analytics:", error);
    showError("Failed to load analytics. Check your internet connection.");
  }
}

/* =====================================================
   SUMMARY STATISTICS
===================================================== */
function renderSummary(total, avg, best, worst, accuracy) {
  const container = document.createElement("div");
  container.className = "analytics-summary";

  container.innerHTML = `
    <div class="stat-card">
      <h3>Total Training Sessions</h3>
      <p class="stat-number">${total}</p>
      <p class="stat-sub">Games Played</p>
    </div>
    <div class="stat-card">
      <h3>Average Score</h3>
      <p class="stat-number">${avg}</p>
      <p class="stat-sub">Per Session</p>
    </div>
    <div class="stat-card">
      <h3>Best Performance</h3>
      <p class="stat-number">${best}</p>
      <p class="stat-sub">Highest Score</p>
    </div>
    <div class="stat-card">
      <h3>Accuracy Rate</h3>
      <p class="stat-number">${accuracy}%</p>
      <p class="stat-sub">Success Rate</p>
    </div>
  `;

  document.querySelector(".analytics-container")
    .insertBefore(container, document.querySelector(".chart-container"));
}

/* =====================================================
   TRAINING PROGRESS CHART
===================================================== */
function renderChart(labels, scores, movingAvg) {
  const ctx = document.getElementById('scoreChart');
  
  // Ensure we have a canvas element
  if (!ctx) return;
  
  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Session Score",
          data: scores,
          borderColor: "#4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4
        },
        {
          label: "Moving Average",
          data: movingAvg,
          borderColor: "#ffd700",
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#fff',
            font: {
              size: 14
            }
          }
        },
        title: {
          display: true,
          text: 'Training Performance Trend',
          color: '#fff',
          font: {
            size: 16
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#9aa0a6'
          }
        },
        y: {
          beginAtZero: true,
          max: 50,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#9aa0a6'
          }
        }
      }
    }
  });
}

/* =====================================================
   TOP TRAINERS LIST
===================================================== */
function renderTopPlayers(players) {
  const container = document.createElement("div");
  container.className = "players-list";
  
  let html = '<h3>🏆 Top Performers</h3>';
  
  if (players.length === 0) {
    html += '<p class="no-data">No player data available</p>';
  } else {
    players.forEach((player, index) => {
      const avgScore = Math.round(player.totalScore / player.attempts);
      const rankClass = `rank-${index + 1}`;
      
      html += `
        <div class="player-row">
          <div class="player-info">
            <span class="player-rank ${rankClass}">${index + 1}</span>
            <span class="player-name">${player.name}</span>
          </div>
          <div class="player-stats">
            <span class="score">Best: ${player.bestScore}</span>
            <span class="attempts">(${player.attempts} sessions)</span>
          </div>
        </div>
      `;
    });
  }
  
  container.innerHTML = html;
  document.querySelector(".analytics-container").appendChild(container);
}

/* =====================================================
   INITIALIZE ANALYTICS
===================================================== */
// Add chart container if it doesn't exist
if (!document.querySelector('.chart-container')) {
  const chartContainer = document.createElement('div');
  chartContainer.className = 'chart-container';
  chartContainer.innerHTML = '<canvas id="scoreChart"></canvas>';
  
  const container = document.querySelector('.analytics-container');
  const chartElement = container.querySelector('canvas');
  if (chartElement) {
    chartElement.parentNode.replaceChild(chartContainer, chartElement);
  }
}

// Load analytics when page loads
document.addEventListener('DOMContentLoaded', loadAnalytics);
