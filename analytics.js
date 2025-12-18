// analytics.js - COMPLETE WORKING VERSION
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Initialize Firebase
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

// Global variables
let allScores = [];
let performanceChart = null;

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log("Analytics page loaded");
    initTabs();
    loadAnalyticsData();
    setupEventListeners();
});

// Initialize tab system
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const activeTab = document.getElementById(tabId + 'Tab');
            if (activeTab) {
                activeTab.classList.add('active');
            }
            
            // Load data for the tab
            if (tabId === 'analytics') {
                renderAnalyticsTab();
            } else if (tabId === 'leaderboard') {
                renderLeaderboardTab();
            } else if (tabId === 'training') {
                renderTrainingTab();
            }
        });
    });
}

// Load all analytics data from Firebase
async function loadAnalyticsData() {
    try {
        showLoadingState();
        
        const q = query(collection(db, "leaderboard"), orderBy("score", "desc"));
        const querySnapshot = await getDocs(q);
        
        allScores = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            allScores.push({
                id: doc.id,
                name: data.name || "Anonymous",
                score: data.score || 0,
                time: data.time || 0,
                createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
                difficulty: data.difficulty || "medium"
            });
        });
        
        console.log(`Loaded ${allScores.length} scores from Firebase`);
        
        // Render the initial tab
        renderAnalyticsTab();
        
        // Update last updated time
        updateLastUpdated();
        
    } catch (error) {
        console.error("Error loading analytics:", error);
        showErrorState("Failed to load data. Please check your internet connection.");
    }
}

// Show loading state
function showLoadingState() {
    const containers = ['analyticsTab', 'leaderboardTab', 'trainingTab'];
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <div class="loading-spinner"></div>
                    <p style="color: #9aa0a6; margin-top: 20px;">Loading data...</p>
                </div>
            `;
        }
    });
}

// Show error state
function showErrorState(message) {
    const containers = ['analyticsTab', 'leaderboardTab', 'trainingTab'];
    containers.forEach(containerId => {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px;">
                    <div style="color: #f44336; font-size: 48px;">⚠️</div>
                    <p style="color: #f44336; margin: 20px 0;">${message}</p>
                    <button onclick="location.reload()" style="
                        background: #238636;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Try Again</button>
                </div>
            `;
        }
    });
}

// Render Analytics Tab
function renderAnalyticsTab() {
    const container = document.getElementById('analyticsTab');
    if (!container) return;
    
    if (allScores.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <p style="color: #9aa0a6;">No data available yet. Play the game first!</p>
                <button onclick="window.location.href='index.html'" style="
                    background: #238636;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 20px;
                ">Play Game</button>
            </div>
        `;
        return;
    }
    
    // Calculate player stats
    const playerName = localStorage.getItem('playerName') || 'You';
    const playerScores = allScores.filter(score => score.name === playerName);
    const stats = calculateStats(playerScores);
    
    container.innerHTML = `
        <div class="tab-header">
            <h2>Your Performance Dashboard</h2>
            <p>Track your improvement journey in biomedical waste segregation</p>
        </div>
        
        <div id="statsContainer" class="stats-grid"></div>
        
        <div class="chart-section">
            <h3>Performance Trend</h3>
            <div class="chart-container">
                <canvas id="scoreChart"></canvas>
            </div>
        </div>
        
        <div id="recentAttempts" class="recent-section"></div>
    `;
    
    // Render stats
    renderStats(stats, playerScores.length > 0);
    
    // Render chart
    if (playerScores.length > 0) {
        renderPerformanceChart(playerScores);
    } else {
        document.querySelector('.chart-container').innerHTML = `
            <div style="text-align: center; padding: 50px; color: #9aa0a6;">
                <p>No performance data available</p>
                <p>Play a game to see your progress!</p>
            </div>
        `;
    }
    
    // Render recent attempts
    renderRecentAttempts(playerScores.slice(0, 5));
}

// Calculate statistics
function calculateStats(scores) {
    if (scores.length === 0) {
        return {
            totalSessions: 0,
            averageScore: 0,
            bestScore: 0,
            accuracy: 0,
            totalPoints: 0,
            improvement: 0
        };
    }
    
    const totalPoints = scores.reduce((sum, score) => sum + score.score, 0);
    const averageScore = Math.round(totalPoints / scores.length);
    const bestScore = Math.max(...scores.map(s => s.score));
    
    // Calculate accuracy (assuming max 50 points per game)
    const maxPossible = scores.length * 50;
    const accuracy = Math.round((totalPoints / maxPossible) * 100);
    
    // Calculate improvement (compare last 3 games with first 3)
    let improvement = 0;
    if (scores.length >= 6) {
        const firstThree = scores.slice(-3).reduce((sum, s) => sum + s.score, 0) / 3;
        const lastThree = scores.slice(0, 3).reduce((sum, s) => sum + s.score, 0) / 3;
        improvement = Math.round(((lastThree - firstThree) / firstThree) * 100);
    }
    
    return {
        totalSessions: scores.length,
        averageScore: averageScore,
        bestScore: bestScore,
        accuracy: accuracy,
        totalPoints: totalPoints,
        improvement: improvement
    };
}

// Render statistics
function renderStats(stats, hasData) {
    const container = document.getElementById('statsContainer');
    if (!container) return;
    
    if (!hasData) {
        container.innerHTML = `
            <div style="text-align: center; grid-column: 1 / -1; padding: 30px; color: #9aa0a6;">
                <p>No statistics available yet</p>
                <p>Complete your first game to see stats!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="stat-card">
            <h3>Total Sessions</h3>
            <p class="stat-number">${stats.totalSessions}</p>
            <p class="stat-sub">Games Played</p>
        </div>
        <div class="stat-card">
            <h3>Average Score</h3>
            <p class="stat-number">${stats.averageScore}</p>
            <p class="stat-sub">Points per Game</p>
        </div>
        <div class="stat-card">
            <h3>Best Score</h3>
            <p class="stat-number">${stats.bestScore}</p>
            <p class="stat-sub">Personal Record</p>
        </div>
        <div class="stat-card">
            <h3>Accuracy</h3>
            <p class="stat-number">${stats.accuracy}%</p>
            <p class="stat-sub">Success Rate</p>
        </div>
    `;
}

// Render performance chart
function renderPerformanceChart(scores) {
    const ctx = document.getElementById('scoreChart');
    if (!ctx) return;
    
    // Destroy existing chart
    if (performanceChart) {
        performanceChart.destroy();
    }
    
    // Prepare data
    const recentScores = scores.slice(0, 10).reverse(); // Last 10 games
    const labels = recentScores.map((score, index) => `Game ${index + 1}`);
    const dataPoints = recentScores.map(score => score.score);
    
    // Calculate average line
    const average = recentScores.reduce((sum, score) => sum + score.score, 0) / recentScores.length;
    const averageLine = Array(recentScores.length).fill(average);
    
    performanceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Your Score',
                    data: dataPoints,
                    borderColor: '#4caf50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#ffd700',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                },
                {
                    label: 'Average',
                    data: averageLine,
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    borderWidth: 1,
                    borderDash: [5, 5],
                    fill: false,
                    pointRadius: 0
                }
            ]
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

// Render recent attempts
function renderRecentAttempts(attempts) {
    const container = document.getElementById('recentAttempts');
    if (!container) return;
    
    if (attempts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #9aa0a6;">
                <p>No recent attempts</p>
            </div>
        `;
        return;
    }
    
    let html = '<h3>Recent Sessions</h3>';
    attempts.forEach(attempt => {
        const dateStr = formatDate(attempt.createdAt);
        const timeAgo = getTimeAgo(attempt.createdAt);
        
        html += `
            <div class="attempt-item">
                <div>
                    <div class="attempt-score">${attempt.score} points</div>
                    <div class="attempt-details">
                        <span class="attempt-difficulty">${attempt.difficulty}</span>
                        <span class="attempt-time">${timeAgo}</span>
                    </div>
                </div>
                <div class="attempt-date">${dateStr}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Render Leaderboard Tab
function renderLeaderboardTab() {
    const container = document.getElementById('leaderboardTab');
    if (!container) return;
    
    if (allScores.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <p style="color: #9aa0a6;">No leaderboard data available yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="tab-header">
            <h2>Global Leaderboard</h2>
            <p>Top players from around the world</p>
            <div class="leaderboard-info">
                <span class="info-badge">🌍 Live Ranking</span>
                <span class="info-badge">🔄 Updates real-time</span>
            </div>
        </div>
        
        <div class="leaderboard-filters">
            <button class="filter-btn active" data-filter="all">All Time</button>
            <button class="filter-btn" data-filter="month">This Month</button>
            <button class="filter-btn" data-filter="week">This Week</button>
        </div>
        
        <div id="leaderboardList" class="leaderboard-full">
            <!-- Leaderboard will be loaded here -->
        </div>
        
        <div id="yourPosition" class="your-position-card"></div>
    `;
    
    // Load leaderboard
    loadLeaderboard('all');
    
    // Setup filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            loadLeaderboard(this.dataset.filter);
        });
    });
}

// Load leaderboard with filter
function loadLeaderboard(filter) {
    const container = document.getElementById('leaderboardList');
    if (!container) return;
    
    // Filter scores
    let filteredScores = [...allScores];
    const now = new Date();
    
    if (filter === 'month') {
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
        filteredScores = filteredScores.filter(s => s.createdAt >= monthAgo);
    } else if (filter === 'week') {
        const weekAgo = new Date(now.setDate(now.getDate() - 7));
        filteredScores = filteredScores.filter(s => s.createdAt >= weekAgo);
    }
    
    // Get top 50 unique players (best score per player)
    const playersMap = new Map();
    filteredScores.forEach(score => {
        if (!playersMap.has(score.name) || score.score > playersMap.get(score.name).score) {
            playersMap.set(score.name, {
                name: score.name,
                score: score.score,
                date: score.createdAt,
                attempts: 1
            });
        }
    });
    
    const topPlayers = Array.from(playersMap.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);
    
    // Render leaderboard
    container.innerHTML = '';
    topPlayers.forEach((player, index) => {
        const rankClass = index < 3 ? `rank-${index + 1}` : 'rank-other';
        const initials = getInitials(player.name);
        const dateStr = formatDate(player.date);
        
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        row.innerHTML = `
            <div class="rank-badge ${rankClass}">${index + 1}</div>
            <div class="player-info">
                <div class="player-avatar">${initials}</div>
                <div>
                    <div class="player-name">${player.name}</div>
                    <div class="player-stats">${dateStr}</div>
                </div>
            </div>
            <div class="player-score">${player.score}</div>
        `;
        container.appendChild(row);
    });
    
    // Show user's position
    showUserPosition(topPlayers);
}

// Show user's position on leaderboard
function showUserPosition(players) {
    const container = document.getElementById('yourPosition');
    if (!container) return;
    
    const playerName = localStorage.getItem('playerName');
    if (!playerName) {
        container.style.display = 'none';
        return;
    }
    
    const userIndex = players.findIndex(p => p.name === playerName);
    if (userIndex !== -1) {
        const user = players[userIndex];
        container.innerHTML = `
            <div class="position-rank">#${userIndex + 1}</div>
            <div class="position-label">Your Global Rank</div>
            <div class="position-stats">
                Score: ${user.score} • ${formatDate(user.date)}
            </div>
        `;
        container.classList.add('show');
    } else {
        container.style.display = 'none';
    }
}

// Render Training Tab
function renderTrainingTab() {
    const container = document.getElementById('trainingTab');
    if (!container) return;
    
    if (allScores.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <p style="color: #9aa0a6;">No training data available yet</p>
            </div>
        `;
        return;
    }
    
    // Calculate training stats
    const playerName = localStorage.getItem('playerName');
    const playerScores = playerName ? allScores.filter(s => s.name === playerName) : [];
    const totalPlayers = new Set(allScores.map(s => s.name)).size;
    const totalGames = allScores.length;
    const avgScoreAll = Math.round(allScores.reduce((sum, s) => sum + s.score, 0) / totalGames);
    
    container.innerHTML = `
        <div class="tab-header">
            <h2>Training Statistics</h2>
            <p>Detailed breakdown of learning progress</p>
        </div>
        
        <div class="training-grid">
            <div class="training-card">
                <h4>Global Participation</h4>
                <p class="stat-number">${totalPlayers}</p>
                <p class="stat-sub">Unique Players</p>
            </div>
            <div class="training-card">
                <h4>Total Games Played</h4>
                <p class="stat-number">${totalGames}</p>
                <p class="stat-sub">Worldwide Attempts</p>
            </div>
            <div class="training-card">
                <h4>Global Average</h4>
                <p class="stat-number">${avgScoreAll}</p>
                <p class="stat-sub">Average Score</p>
            </div>
            <div class="training-card">
                <h4>Your Progress</h4>
                <p class="stat-number">${playerScores.length}</p>
                <p class="stat-sub">Your Sessions</p>
            </div>
        </div>
        
        <div class="accuracy-section">
            <h3>Difficulty Distribution</h3>
            <div class="accuracy-chart-container">
                <canvas id="difficultyChart"></canvas>
            </div>
        </div>
    `;
    
    // Render difficulty chart
    renderDifficultyChart();
}

// Render difficulty distribution chart
function renderDifficultyChart() {
    const ctx = document.getElementById('difficultyChart');
    if (!ctx) return;
    
    // Count difficulties
    const difficulties = {
        easy: allScores.filter(s => s.difficulty === 'easy').length,
        medium: allScores.filter(s => s.difficulty === 'medium').length,
        hard: allScores.filter(s => s.difficulty === 'hard').length
    };
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Easy', 'Medium', 'Hard'],
            datasets: [{
                data: [difficulties.easy, difficulties.medium, difficulties.hard],
                backgroundColor: ['#4caf50', '#2196f3', '#f44336'],
                borderColor: ['#388e3c', '#1976d2', '#d32f2f'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#fff',
                        font: {
                            size: 14
                        }
                    }
                }
            }
        }
    });
}

// Utility functions
function formatDate(date) {
    if (!date) return 'Unknown';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
}

function getInitials(name) {
    return name.split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function updateLastUpdated() {
    const element = document.getElementById('lastUpdated');
    if (element) {
        element.textContent = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

function setupEventListeners() {
    // Share progress button
    const shareBtn = document.getElementById('shareAnalyticsBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            const playerName = localStorage.getItem('playerName') || 'Player';
            const playerScores = allScores.filter(s => s.name === playerName);
            const stats = calculateStats(playerScores);
            
            const shareText = 
                `🎮 Biomedical Waste Game - My Progress\n\n` +
                `👤 Player: ${playerName}\n` +
                `🏆 Best Score: ${stats.bestScore}\n` +
                `📈 Average Score: ${stats.averageScore}\n` +
                `🎯 Accuracy: ${stats.accuracy}%\n` +
                `🎮 Sessions: ${stats.totalSessions}\n\n` +
                `Play the game: https://creator619-python.github.io/Biomedical-Waste-Game/`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'My Game Progress',
                    text: shareText
                });
            } else {
                navigator.clipboard.writeText(shareText);
                alert('Progress copied to clipboard! 📋');
            }
        });
    }
}

// Add CSS for loading spinner
const style = document.createElement('style');
style.textContent = `
    .loading-spinner {
        border: 4px solid rgba(255, 255, 255, 0.1);
        border-left-color: #4caf50;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
