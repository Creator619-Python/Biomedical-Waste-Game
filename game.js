// =======================================================
// GLOBAL VARIABLES
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
// LOAD ITEMS (cache-bypass)
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

    const diffCards = document.querySelectorAll(".difficulty-card");
    const startBtn = document.getElementById("startGameBtn");

    if (diffCards.length && startBtn) {
        diffCards.forEach(card => {
            card.addEventListener("click", () => {
                diffCards.forEach(c => c.classList.remove("selected"));
                card.classList.add("selected");
                selectedDifficulty = card.getAttribute("data-level");
            });
        });

        startBtn.addEventListener("click", startGame);
    }

    // Instructions toggler
    const toggleBtn = document.getElementById("toggleInstructions");
    const instructionsPanel = document.getElementById("instructionsPanel");
    if (toggleBtn && instructionsPanel) {
        toggleBtn.addEventListener("click", () => {
            const isHidden = instructionsPanel.classList.toggle("hidden");
            toggleBtn.textContent = isHidden
                ? "▼ Show Instructions"
                : "▲ Hide Instructions";
        });
    }

    const waBtn = document.getElementById("whatsappShareBtn");
    if (waBtn) {
        waBtn.addEventListener("click", shareOnWhatsApp);
    }
}

// =======================================================
// APPLY DIFFICULTY
// =======================================================
function applyDifficulty(level) {
    if (level === "easy") totalTime = 90;
    else if (level === "hard") totalTime = 30;
    else totalTime = 60;

    timeLeft = totalTime;
}

// =======================================================
// START GAME
// =======================================================
function startGame() {
    const startScreen = document.getElementById("startScreen");
    const gameContainer = document.getElementById("gameContainer");

    if (startScreen) startScreen.classList.add("hidden");
    if (gameContainer) gameContainer.classList.remove("hidden");

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
    if (!items.length) return;

    currentItem = items[Math.floor(Math.random() * items.length)];
    fadeSwap("itemImage", currentItem.image);
    fadeSwap("itemName", currentItem.name);
}

// =======================================================
// FADE + FIXED IMAGE LOADING (ENCODES SPACES!)
// =======================================================
function fadeSwap(id, newValue) {
    const elem = document.getElementById(id);
    if (!elem) return;

    elem.classList.add("fade-out");

    setTimeout(() => {
        if (id === "itemImage") {
            elem.src = encodeURI(newValue);
        } else {
            elem.textContent = newValue;
        }

        elem.classList.remove("fade-out");
        elem.classList.add("fade-in");

        setTimeout(() => elem.classList.remove("fade-in"), 200);
    }, 150);
}

// =======================================================
// BIN CLICK
// =======================================================
document.querySelectorAll(".bin-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!currentItem) return;

        const chosen = btn.dataset.bin.trim().toLowerCase();
        const correct = currentItem.bin.trim().toLowerCase();

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
    });
});

// =======================================================
// UI UPDATE FUNCTIONS
// =======================================================
function updateTimerUI() {
    const tv = document.getElementById("timerValue");
    if (tv) tv.textContent = "00:" + (timeLeft < 10 ? "0" + timeLeft : timeLeft);

    const pf = document.getElementById("progressFill");
    if (pf) {
        pf.style.width = (timeLeft / totalTime * 100) + "%";
    }
}

function updateStats() {
    const total = correctCount + wrongCount;
    const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);

    const scoreEl = document.getElementById("score");
    if (scoreEl) scoreEl.textContent = score;

    const statsElem = document.getElementById("gameStats");
    if (statsElem) {
        statsElem.textContent =
            `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;
    }
}

function showFeedback(text, good) {
    const fb = document.getElementById("feedback");
    if (!fb) return;

    fb.textContent = text;
    fb.className = "feedback " + (good ? "correct" : "wrong");

    setTimeout(() => {
        fb.className = "feedback";
    }, 1500);
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

    const modal = document.getElementById("gameOverModal");
    modal.classList.remove("hidden");

    launchConfetti();
}

function launchConfetti() {
    const container = document.getElementById("confettiContainer");
    if (!container) return;

    container.innerHTML = "";
    const colors = ["#F97316", "#10B981", "#3B82F6", "#E11D48", "#FACC15"];
    const pieces = 120;

    for (let i = 0; i < pieces; i++) {
        const piece = document.createElement("div");
        piece.classList.add("confetti-piece");
        piece.style.left = Math.random() * 100 + "%";
        piece.style.top = "-20px";
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = (Math.random() * 0.5) + "s";
        container.appendChild(piece);
    }

    setTimeout(() => {
        container.innerHTML = "";
    }, 2000);
}

// =======================================================
// PLAY AGAIN
// =======================================================
document.getElementById("playAgainBtn").addEventListener("click", () => {
    document.getElementById("gameOverModal").classList.add("hidden");
    startGame();
});

// =======================================================
// WHATSAPP SHARE
// =======================================================
function shareOnWhatsApp() {
    const total = correctCount + wrongCount;
    const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);
    const url = "https://creator619-python.github.io/Biomedical-Waste-Game/";

    const text =
        `I played the Biomedical Waste Segregation Game!\n\n` +
        `Score: ${score}\n` +
        `Correct: ${correctCount}\n` +
        `Wrong: ${wrongCount}\n` +
        `Accuracy: ${accuracy}%\n\n` +
        `Play here: ${url}`;

    const waLink = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(waLink, "_blank");
}

// =======================================================
// START
// =======================================================
initGame();
