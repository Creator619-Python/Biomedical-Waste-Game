import { saveScore } from "./firebase.js";

let items = [];
let currentItem = null;
let score = 0;
let correct = 0;
let wrong = 0;
let timer = null;
let totalTime = 60;

// ===============================
// LOAD ITEMS.JSON
// ===============================
async function loadItems() {
    const res = await fetch("items.json");
    items = await res.json();
}

loadItems();

// ===============================
// DOM ELEMENTS
// ===============================
const startScreen = document.getElementById("startScreen");
const gameContainer = document.getElementById("gameContainer");
const scoreDisplay = document.getElementById("score");
const itemImage = document.getElementById("itemImage");
const itemName = document.getElementById("itemName");
const feedback = document.getElementById("feedback");
const timerValue = document.getElementById("timerValue");
const progressFill = document.getElementById("progressFill");
const gameStats = document.getElementById("gameStats");
const scoreSubmitModal = document.getElementById("scoreSubmitModal");

// Difficulty buttons
document.querySelectorAll(".difficulty-card").forEach(card => {
    card.onclick = () => {
        document.querySelectorAll(".difficulty-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");

        const level = card.dataset.level;
        if (level === "easy") totalTime = 90;
        if (level === "medium") totalTime = 60;
        if (level === "hard") totalTime = 30;

        timerValue.textContent = `00:${totalTime}`;
    };
});

// ===============================
// START GAME
// ===============================
document.getElementById("startGameBtn").onclick = () => {
    startScreen.classList.add("hidden");
    gameContainer.classList.remove("hidden");

    score = 0;
    correct = 0;
    wrong = 0;

    updateStats();
    startTimer();
    loadNewItem();
};

// ===============================
// TIMER
// ===============================
function startTimer() {
    let timeLeft = totalTime;

    timer = setInterval(() => {
        timeLeft--;
        timerValue.textContent = `00:${String(timeLeft).padStart(2, "0")}`;

        progressFill.style.width = `${(timeLeft / totalTime) * 100}%`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            gameOver();
        }
    }, 1000);
}

// ===============================
// NEW ITEM
// ===============================
function loadNewItem() {
    currentItem = items[Math.floor(Math.random() * items.length)];
    itemImage.src = currentItem.image;
    itemName.textContent = currentItem.name;
    feedback.textContent = "Choose the correct bin";
}

// ===============================
// BIN CLICK
// ===============================
document.querySelectorAll(".bin-btn").forEach(btn => {
    btn.onclick = () => {
        const chosen = btn.dataset.bin;

        if (chosen === currentItem.bin) {
            score++;
            correct++;
            feedback.textContent = "✔ Correct!";
            feedback.style.color = "#4caf50";
        } else {
            score--;
            wrong++;
            feedback.textContent = `✖ Wrong — Correct bin: ${currentItem.bin}`;
            feedback.style.color = "#ff5252";
        }

        scoreDisplay.textContent = score;
        updateStats();
        loadNewItem();
    };
});

// ===============================
// UPDATE STATS
// ===============================
function updateStats() {
    const accuracy = correct + wrong === 0 
        ? 0 
        : Math.round((correct / (correct + wrong)) * 100);

    gameStats.textContent = `Correct: ${correct} | Wrong: ${wrong} | Accuracy: ${accuracy}%`;
}

// ===============================
// GAME OVER
// ===============================
function gameOver() {
    feedback.textContent = "Time's up!";
    feedback.style.color = "#ffd700";

    // Show score submission modal
    scoreSubmitModal.classList.remove("hidden");

    // Store score globally
    window.finalGameScore = score;
}

// ===============================
// SCORE SUBMISSION
// ===============================
document.getElementById("submitScoreBtn").onclick = async () => {
    const nameInput = document.getElementById("playerNameInput");
    const errorText = document.getElementById("nameError");

    let name = nameInput.value.trim();

    if (!name.match(/^[A-Za-z ]{3,20}$/)) {
        errorText.classList.remove("hidden");
        return;
    }

    errorText.classList.add("hidden");

    const saved = await saveScore(name, window.finalGameScore);

    if (saved) {
        window.location.href = "leaderboard.html";
    } else {
        alert("Error saving score. Please try again.");
    }
};

document.getElementById("cancelSubmitBtn").onclick = () => {
    scoreSubmitModal.classList.add("hidden");
};
