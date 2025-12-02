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

let selectedDifficulty = null;

const GAME_URL = "https://creator619-python.github.io/Biomedical-Waste-Game/";


// =======================================================
// LOAD ITEMS (IMPORTANT: ADD CACHE-BYPASS)
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

                startBtn.disabled = false;
                startBtn.classList.remove("disabled");
            });
        });

        startBtn.addEventListener("click", startGame);
    } else {
        selectedDifficulty = "medium";
        startGame();
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
    if (!selectedDifficulty) selectedDifficulty = "medium";

    const startScreen = document.getElementById("startScreen");
    if (startScreen) startScreen.classList.add("hidden");

    const gameContainer = document.getElementById("gameContainer");
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


// FADE EFFECT
function fadeSwap(id, newValue) {
    const elem = document.getElementById(id);
    if (!elem) return;

    elem.classList.add("fade-out");

    setTimeout(() => {
        if (id === "itemImage") elem.src = newValue;
        else elem.textContent = newValue;

        elem.classList.remove("fade-out");
        elem.classList.add("fade-in");

        setTimeout(() => elem.classList.remove("fade-in"), 250);
    }, 200);
}


// =======================================================
// BIN CLICK — FIXED COMPARISON
// =======================================================
document.querySelectorAll(".bin-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!currentItem) return;

        let chosen = btn.dataset.bin.trim().toLowerCase();
        let correct = currentItem.bin.trim().toLowerCase();

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
// UPDATE TIMER
// =======================================================
function updateTimerUI() {
    const tv = document.getElementById("timerValue");
    if (tv) tv.textContent = "00:" + (timeLeft < 10 ? "0" + timeLeft : timeLeft);

    const pf = document.getElementById("progressFill");
    if (pf) pf.style.width = (timeLeft / totalTime * 100) + "%";
}


// =======================================================
// UPDATE SCORE + ACCURACY
// =======================================================
function updateStats() {
    let accuracy =
        correctCount + wrongCount === 0
            ? 0
            : Math.round((correctCount / (correctCount + wrongCount)) * 100);

    document.getElementById("score").textContent = score;

    const statsElem = document.getElementById("gameStats");
    if (statsElem)
        statsElem.textContent =
            `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;
}


// =======================================================
// FEEDBACK MESSAGE
// =======================================================
function showFeedback(text, good) {
    const fb = document.getElementById("feedback");
    if (!fb) return;

    fb.textContent = text;
    fb.className = "feedback " + (good ? "correct" : "wrong");

    setTimeout(() => fb.className = "feedback", 1500);
}


// =======================================================
// END GAME
// =======================================================
function endGame() {
    clearInterval(timerInterval);

    const accuracy =
        correctCount + wrongCount === 0
            ? 0
            : Math.round((correctCount / (correctCount + wrongCount)) * 100);

    document.getElementById("finalScoreText").textContent = `Your Score: ${score}`;
    document.getElementById("finalStatsText").textContent =
        `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;

    document.getElementById("gameOverModal").classList.remove("hidden");
}


// =======================================================
// PLAY AGAIN
// =======================================================
document.getElementById("playAgainBtn").addEventListener("click", () => {
    document.getElementById("gameOverModal").classList.add("hidden");
    startGame();
});


// =======================================================
// CERTIFICATE (TEMPORARY PLACEHOLDER)
// =======================================================
document.getElementById("downloadCertBtn").addEventListener("click", () => {
    alert("Certificate feature will be added after testing!");
});


// =======================================================
// INIT
// =======================================================
initGame();
