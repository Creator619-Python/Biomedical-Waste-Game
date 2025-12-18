import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp
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
   GLOBAL STATE
===================================================== */
let allScores = [];
let currentPlayerName = localStorage.getItem('playerName') || 'Guest';
let performanceChart = null;
let accuracyChart = null;

/* =====================================================
   DOM READY
===================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initializeTabs();
  initializeShareButton();
  loadAllAnalytics();
  updateLastUpdated();
});

/* =====================================================
   TAB SYSTEM
===================================================== */
function initializeTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show active tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabId}Tab`) {
          content.classList.add('active');
        }
      });
      
      // Load data for the tab if needed
      if (tabId === 'leaderboard') {
        loadLeaderboard('all');
      } else if (tabId === 'training') {
        loadTrainingStats();
      }
    });
  });
}

/* =====================================================
   SHARE BUTTON
===================================================== */
function initializeShareButton() {
  const shareBtn = document.getElementById('shareAnalyticsBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      try {
        const stats = await calculatePlayerStats();
        const text = 
          `🎮 Biomedical Waste Game - My Progress\n\n` +
          `👤 Player: ${stats.name}\n` +
          `🏆 Best Score: ${stats.bestScore}\n` +
          `📈 Average Score: ${stats.avgScore}\n` +
          `🎯 Accuracy: ${stats.accuracy}%\n` +
          `🎮 Sessions: ${stats.sessions}\n\n` +
          `Try the game: https://creator619-python.github.io/Biomedical-Waste-Game/`;
        
        if (navigator.share) {
          await navigator.share({
            title: 'My Game Progress',
            text: text
          });
        } else {
          navigator.clipboard.writeText(text);
          alert('Progress copied to clipboard! 📋');
        }
      } catch (error) {
        console.error('Error sharing:', error);
      }
    });
  }
}

/* =====================================================
   LOAD ALL ANALYTICS
===================================================== */
async function loadAllAnalytics() {
  showLoading('#analyticsTab');
  showLoading('#leaderboardTab');
  showLoading('#trainingTab');
  
  try {
    const q = query(collection(db, "leaderboard"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      showNoData();
      return;
    }
    
    allScores = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      allScores.push({
        id: doc.id,
        name: data.name || 'Anonymous',
        score: data.score || 0,
        time: data.time || 0,
        createdAt: data.createdAt?.toDate() || new Date(),
        difficulty: data.difficulty || 'medium'
      });
    });
    
    // Load each section
    loadPlayerAnalytics();
    loadLeaderboard('all');
    loadTrainingStats();
    
  } catch (error) {
    console.error("Error loading analytics:", error);
    showError("Failed to load analytics. Please check your connection.");
  }
}

/* =====================================================
   PLAYER ANALYTICS
===================================================== */
async function loadPlayerAnalytics() {
  const stats = await calculatePlayerStats();
  renderPlayerStats(stats);
  renderPerformanceChart(stats.recentScores);
  renderRecentAttempts(stats.recentAttempts);
}

async function calculatePlayerStats() {
  const playerScores = allScores.filter(score => 
    score.name.toLowerCase() === currentPlayerName.toLowerCase()
  );
  
  if (playerScores.length === 0) {
    return {
      name: currentPlayerName,
      sessions: 0,
      totalScore: 0,
      avgScore: 0,
      bestScore: 0,
      worstScore: 0,
      accuracy: 0,
      recentScores: [],
      recentAttempts: [],
      rank: 'N/A'
    };
  }
  
  const totalScore = playerScores.reduce((sum, score) => sum + score.score, 0);
  const bestScore = Math.max(...playerScores.map(s => s.score));
  const worstScore = Math.min(...playerScores.map(s => s.score));
  const avgScore = Math.round(totalScore / playerScores.length);
  
  // Calculate accuracy (assuming max 50 points per game)
  const accuracy = Math.round((totalScore / (playerScores.length * 50)) * 100);
  
  // Get recent scores (last 10 attempts)
  const recentScores = playerScores.slice(0, 10).map(s => s.score);
  const recentAttempts = playerScores.slice(0, 5).map(s => ({
    score: s.score,
    date: formatDate(s.createdAt),
    difficulty: s.difficulty
  }));
  
  // Calculate rank
  const allPlayers = getUniquePlayers();
  const sortedPlayers = allPlayers.sort((a, b) => b.bestScore - a.bestScore);
  const playerRank = sortedPlayers.findIndex(p => 
    p.name.toLowerCase() === currentPlayerName.toLowerCase()
  ) + 1;
  
  return {
    name: currentPlayerName,
    sessions: playerScores.length,
    totalScore: totalScore,
    avgScore: avgScore,
    bestScore: bestScore,
    worstScore: worstScore,
    accuracy: accuracy,
    recentScores: recentScores,
    recentAttempts: recentAttempts,
    rank: playerRank || 'N/A'
  };
}

function renderPlayerStats(stats) {
  const container = document.getElementById('statsContainer');
  if (!container) return;
  
  container.innerHTML = `
    <div class="stat-card">
      <h3>Total Sessions</h3>
      <p class="stat-number">${stats.sessions}</p>
      <p class="stat-sub">Training Completed</p>
    </div>
    <div class="stat-card">
      <h3>Average Score</h3>
      <p class="stat-number">${stats.avgScore}</p>
      <p class="stat-sub">Per Session</p>
    </div>
    <div class="stat-card">
      <h3>Best Score</h3>
      <p class="stat-number">${stats.bestScore}</p>
      <p class="stat-sub">Personal Record</p>
    </div>
    <div class="stat-card">
      <h3>Accuracy Rate</h3>
      <p class="stat-number">${stats.accuracy}%</p>
      <p class="stat-sub">Success Rate</p>
    </div>
  `;
}

function renderPerformanceChart(scores) {
  const ctx = document.getElementById('scoreChart');
  if (!ctx) return;
  
  if (performanceChart) {
    performanceChart.destroy();
  }
  
  const labels = scores.map((_, i) => `Session ${i + 1}`);
  
  performanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Your Score',
        data: scores,
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#ffd700',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: '#fff',
            font: {
              size: 14
            }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#4caf50',
          borderWidth: 1
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
          suggestedMax: 50,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#9aa0a6',
            callback: function(value) {
              return value + ' pts';
            }
          }
        }
      }
    }
  });
}

function renderRecentAttempts(attempts) {
  const container = document.getElementById('recentAttempts');
  if (!container) return;
  
  if (attempts.length === 0) {
    container.innerHTML = '<p class="no-data">No recent attempts</p>';
    return;
  }
  
  let html = '<h3>Recent Sessions</h3>';
  attempts.forEach(attempt => {
    html += `
      <div class="attempt-item">
        <div>
          <div class="attempt-date">${attempt.date}</div>
          <div class="attempt-difficulty">${attempt.difficulty}</div>
        </div>
        <div class="attempt-score">${attempt.score} pts</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

/* =====================================================
   LEADERBOARD
===================================================== */
function loadLeaderboard(filter) {
  const container = document.getElementById('leaderboardList');
  if (!container) return;
  
  container.innerHTML = '<div class="loading-board"><div class="spinner"></div><p>Loading leaderboard...</p></div>';
  
  // Filter scores based on time
  let filteredScores = [...allScores];
  const now = new Date();
  
  if (filter === 'month') {
    const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
    filteredScores = filteredScores.filter(s => s.createdAt >= monthAgo);
  } else if (filter === 'week') {
    const weekAgo = new Date(now.setDate(now.getDate() - 7));
    filteredScores = filteredScores.filter(s => s.createdAt >= weekAgo);
  }
  
  // Get unique players with their best scores
  const playersMap = new Map();
  filteredScores.forEach(score => {
    const playerName = score.name;
    if (!playersMap.has(playerName) || score.score > playersMap.get(playerName).score) {
      playersMap.set(playerName, {
        name: playerName,
        score: score.score,
        date: score.createdAt,
        attempts: 1
      });
    } else {
      const player = playersMap.get(playerName);
      player.attempts++;
    }
  });
  
  // Sort by score (descending)
  const players = Array.from(playersMap.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 50); // Top 50 players
  
  renderLeaderboard(players);
  renderYourPosition(players);
  
  // Update active filter button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === filter) {
      btn.classList.add('active');
    }
  });
  
  // Add filter button events
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.onclick = () => loadLeaderboard(btn.dataset.filter);
  });
}

function renderLeaderboard(players) {
  const container = document.getElementById('leaderboardList');
  if (!container) return;
  
  if (players.length === 0) {
    container.innerHTML = '<div class="no-data"><p>No players found</p></div>';
    return;
  }
  
  let html = '';
  players.forEach((player, index) => {
    const rankClass = `rank-${index < 3 ? index + 1 : 'other'}`;
    const initials = getInitials(player.name);
    const dateStr = formatDate(player.date);
    
    html += `
      <div class="leaderboard-row">
        <div class="rank-badge ${rankClass}">${index + 1}</div>
        <div class="player-info">
          <div class="player-avatar">${initials}</div>
          <div>
            <div class="player-name">${player.name}</div>
            <div class="player-stats">${dateStr} • ${player.attempts} attempts</div>
          </div>
        </div>
        <div class="player-score">${player.score}</div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

function renderYourPosition(players) {
  const container = document.getElementById('yourPosition');
  if (!container) return;
  
  const playerIndex = players.findIndex(p => 
    p.name.toLowerCase() === currentPlayerName.toLowerCase()
  );
  
  if (playerIndex !== -1) {
    const player = players[playerIndex];
    container.innerHTML = `
      <div class="position-rank">#${playerIndex + 1}</div>
      <div class="position-label">Your Global Rank</div>
      <div class="position-stats">
        Score: ${player.score}
