// =======================================================
// GLOBAL STATE
// =======================================================
let items = [];
let currentItem = null;

let score = 0;
let correctCount = 0;
let wrongCount = 0;

let timeLeft = 60;
let totalTime = 60;
let timerInterval = null;
let selectedDifficulty = "medium";

// =======================================================
// LOAD ITEMS
// =======================================================
async function loadItems() {
    const response = await fetch("items.json?v=" + Date.now());
    items = await response.json();
}

// =======================================================
// INIT GAME
// =======================================================
async function initGame() {
    await loadItems();

    document.querySelectorAll(".difficulty-card").forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll(".difficulty-card").forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            selectedDifficulty = card.dataset.level;
        });
    });

    document.getElementById("startGameBtn").addEventListener("click", startGame);
    document.getElementById("playAgainBtn").addEventListener("click", () => {
        document.getElementById("gameOverModal").classList.add("hidden");
        startGame();
    });

    document.getElementById("whatsappShareBtn").addEventListener("click", shareOnWhatsApp);

    const instructionsPanel = document.getElementById("instructionsPanel");
    document.getElementById("toggleInstructions").addEventListener("click", () => {
        const hidden = instructionsPanel.classList.toggle("hidden");
        document.getElementById("toggleInstructions").textContent =
            hidden ? "▼ Show Instructions" : "▲ Hide Instructions";
    });

    // Fullscreen mode
    document.getElementById("fullscreenBtn").addEventListener("click", toggleFullscreen);

    // Bin click handlers
    document.querySelectorAll(".bin-btn").forEach(btn => {
        btn.addEventListener("click", handleBinClick);
    });
}

// =======================================================
// FULLSCREEN TOGGLE
// =======================================================
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        this.textContent = "⤡";
    } else {
        document.exitFullscreen();
        this.textContent = "⤢";
    }
}

// =======================================================
// DIFFICULTY
// =======================================================
function applyDifficulty(level) {
    totalTime = level === "easy" ? 90 : level === "hard" ? 30 : 60;
    timeLeft = totalTime;
}

// =======================================================
// START GAME
// =======================================================
function startGame() {
    document.getElementById("startScreen").classList.add("hidden");
    document.getElementById("gameContainer").classList.remove("hidden");

    clearInterval(timerInterval);
    applyDifficulty(selectedDifficulty);

    score = 0;
    correctCount = 0;
    wrongCount = 0;

    updateStats();
    updateTimerUI();

    loadNextItem();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) endGame();
    }, 1000);
}

// =======================================================
// LOAD NEXT ITEM
// =======================================================
function loadNextItem() {
    currentItem = items[Math.floor(Math.random() * items.length)];
    fadeSwap("itemImage", currentItem.image);
    fadeSwap("itemName", currentItem.name);
}

// =======================================================
// FADE + FIX FILE SPACES
// =======================================================
function fadeSwap(id, value) {
    const el = document.getElementById(id);
    el.classList.add("fade-out");

    setTimeout(() => {
        if (id === "itemImage") el.src = encodeURI(value);
        else el.textContent = value;

        el.classList.remove("fade-out");
        el.classList.add("fade-in");
        setTimeout(() => el.classList.remove("fade-in"), 150);
    }, 150);
}

// =======================================================
// BIN CLICK
// =======================================================
function handleBinClick() {
    if (!currentItem) return;

    const chosen = this.dataset.bin.toLowerCase();
    const correct = currentItem.bin.toLowerCase();

    // Mobile vibration
    if (navigator.vibrate) navigator.vibrate(chosen === correct ? 35 : 90);

    if (chosen === correct) {
        score++;
        correctCount++;
        showFeedback("Correct segregation!", true);
    } else {
        score--;
        wrongCount++;
        showFeedback(`Wrong! Correct bin: ${currentItem.bin}`, false);
    }

    updateStats();
    loadNextItem();
}

// =======================================================
// FEEDBACK
// =======================================================
function showFeedback(text, good) {
    const fb = document.getElementById("feedback");
    fb.textContent = text;
    fb.className = "feedback " + (good ? "correct" : "wrong");

    setTimeout(() => fb.className = "feedback", 1500);
}

// =======================================================
// TIMER + STATS
// =======================================================
function updateTimerUI() {
    document.getElementById("timerValue").textContent =
        "00:" + (timeLeft < 10 ? "0" + timeLeft : timeLeft);

    document.getElementById("progressFill").style.width =
        (timeLeft / totalTime * 100) + "%";
}

function updateStats() {
    const total = correctCount + wrongCount;
    const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    document.getElementById("score").textContent = score;
    document.getElementById("gameStats").textContent =
        `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;
}

// =======================================================
// END GAME + CONFETTI
// =======================================================
function endGame() {
    clearInterval(timerInterval);

    const total = correctCount + wrongCount;
    const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    document.getElementById("finalScoreText").textContent = `Your Score: ${score}`;
    document.getElementById("finalStatsText").textContent =
        `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;

    document.getElementById("gameOverModal").classList.remove("hidden");

    launchConfetti();
}

function launchConfetti() {
    const container = document.getElementById("confettiContainer");
    container.innerHTML = "";

    const colors = ["#F97316", "#10B981", "#3B82F6", "#E11D48", "#FACC15"];
    for (let i = 0; i < 120; i++) {
        const piece = document.createElement("div");
        piece.classList.add("confetti-piece");
        piece.style.left = Math.random() * 100 + "%";
        piece.style.top = "-20px";
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = (Math.random() * 0.4) + "s";
        container.appendChild(piece);
    }

    setTimeout(() => container.innerHTML = "", 2000);
}

// =======================================================
// WHATSAPP SHARE
// =======================================================
function shareOnWhatsApp() {
    const total = correctCount + wrongCount;
    const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    const text =
        `I played the Biomedical Waste Segregation Game!\n\n` +
        `Score: ${score}\nCorrect: ${correctCount}\nWrong: ${wrongCount}\n` +
        `Accuracy: ${accuracy}%\n\n` +
        `Play here: https://creator619-python.github.io/Biomedical-Waste-Game/`;

    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
}

// =======================================================
// START APP
// =======================================================
initGame();
