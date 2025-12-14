/* =============================================================
   BIOMEDICAL WASTE GAME ENGINE — FINAL VERSION
   With Adaptive Difficulty, Analytics Panel, GA4, PWA Safe
   Author: Gokul T.B.
============================================================= */

/* -------------------------------------------------------------
   LOAD ITEM LIST (same as items.json)
------------------------------------------------------------- */
const items = [
  { name: "Ampoules", image: "images/Ampoules.webp", bin: "Blue" },
  { name: "Blade", image: "images/Blade.webp", bin: "White" },
  { name: "Blood Bag", image: "images/Blood Bag.avif", bin: "Yellow" },
  { name: "Catheter", image: "images/Catheter.jpg", bin: "Red" },
  { name: "Contaminated Cotton Swabs", image: "images/Contaminated-Cotton-Swabs.webp", bin: "Yellow" },
  { name: "Dialysis Kit", image: "images/Dialysis Kit.webp", bin: "Red" },
  { name: "Expired Medicines", image: "images/Expired Medicines.webp", bin: "Yellow" },
  { name: "Human Anatomical Waste", image: "images/Human anatomical waste.webp", bin: "Yellow" },
  { name: "IV Set", image: "images/IV SET.png", bin: "Red" },
  { name: "IV Bottles", image: "images/IV bottles.jpg", bin: "Blue" },
  { name: "Lab Slides", image: "images/Lab Slides.jpg", bin: "Blue" },
  { name: "Mask", image: "images/Mask.webp", bin: "Yellow" },
  { name: "Metallic Body Implants", image: "images/Metallic body implants.png", bin: "Blue" },
  { name: "Needles", image: "images/Needles.jpg", bin: "White" },
  { name: "Placenta", image: "images/Placenta.webp", bin: "Yellow" },
  { name: "Plaster Cast", image: "images/Plaster cast.jpg", bin: "Yellow" },
  { name: "Scalpel", image: "images/Scalpel.webp", bin: "White" },
  { name: "Scissors", image: "images/Scissors.webp", bin: "White" },
  { name: "Syringe", image: "images/Syringe.webp", bin: "Red" },
  { name: "Syringes with Needles", image: "images/Syringes with needles.png", bin: "White" },
  { name: "Urine Bag", image: "images/Urine Bag.webp", bin: "Red" },
  { name: "Vacutainers", image: "images/Vacutainers.webp", bin: "Red" },
  { name: "Vial", image: "images/Vial.jpg", bin: "Blue" },
  { name: "Wound Dressing", image: "images/Wound dressing.webp", bin: "Yellow" }
];

/* -------------------------------------------------------------
   DOM ELEMENTS
------------------------------------------------------------- */
const startScreen = document.getElementById("startScreen");
const gameContainer = document.getElementById("gameContainer");
const startBtn = document.getElementById("startGameBtn");
const scoreEl = document.getElementById("score");
const timerValue = document.getElementById("timerValue");
const progressFill = document.getElementById("progressFill");
const feedback = document.getElementById("feedback");
const itemImage = document.getElementById("itemImage");
const itemName = document.getElementById("itemName");
const gameStatsEl = document.getElementById("gameStats");

const gameOverModal = document.getElementById("gameOverModal");
const finalScoreText = document.getElementById("finalScoreText");
const finalStatsText = document.getElementById("finalStatsText");

const playAgainBtn = document.getElementById("playAgainBtn");
const whatsappShareBtn = document.getElementById("whatsappShareBtn");

/* ANALYTICS PANEL */
const analyticsBtn = document.getElementById("analyticsBtn");
const analyticsPanel = document.getElementById("analyticsPanel");
const closeAnalytics = document.getElementById("closeAnalytics");

/* LOCAL STATS ELEMENTS */
const statTotalGames = document.getElementById("statTotalGames");
const statBestScore = document.getElementById("statBestScore");
const statAvgScore = document.getElementById("statAvgScore");
const statTotalCorrect = document.getElementById("statTotalCorrect");
const statTotalWrong = document.getElementById("statTotalWrong");
const statOverallAccuracy = document.getElementById("statOverallAccuracy");
const weakBinsList = document.getElementById("weakBinsList");
const difficultyLog = document.getElementById("difficultyLog");

/* -------------------------------------------------------------
   VARIABLES
------------------------------------------------------------- */
let selectedDifficulty = "medium";
let timeLeft = 60;
let timer;
let score = 0;
let correct = 0;
let wrong = 0;
let currentItem = null;

/* Adaptive difficulty */
let difficultyHistory = [];

/* Error pattern tracking */
let binMistakes = {
    Yellow: 0,
    Red: 0,
    White: 0,
    Blue: 0,
    Green: 0
};

/* -------------------------------------------------------------
   DIFFICULTY SELECTION
------------------------------------------------------------- */
document.querySelectorAll(".difficulty-card").forEach(card => {
    card.addEventListener("click", () => {
        document.querySelectorAll(".difficulty-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedDifficulty = card.dataset.level;

        if (selectedDifficulty === "easy") timeLeft = 90;
        if (selectedDifficulty === "medium") timeLeft = 60;
        if (selectedDifficulty === "hard") timeLeft = 30;
    });
});

/* -------------------------------------------------------------
   START GAME
------------------------------------------------------------- */
startBtn.addEventListener("click", startGame);

function startGame() {
    startScreen.classList.add("hidden");
    gameContainer.classList.remove("hidden");

    score = 0;
    correct = 0;
    wrong = 0;

    scoreEl.textContent = "0";
    feedback.textContent = "Choose the correct bin";
    feedback.className = "feedback";

    /* Reset adaptive difficulty tracking */
    difficultyHistory = [];
    binMistakes = { Yellow: 0, Red: 0, White: 0, Blue: 0, Green: 0 };

    startTimer();
    loadNewItem();

    /* GA4 EVENT */
    if (typeof gtag === "function") {
        gtag("event", "game_start", { difficulty: selectedDifficulty });
    }
}

/* -------------------------------------------------------------
   TIMER
------------------------------------------------------------- */
function startTimer() {
    updateTimerDisplay();

    timer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        /* Adaptive difficulty: If performing well → reduce time slightly */
        if (correct > wrong + 3 && timeLeft > 10) {
            timeLeft -= 0.05;
            difficultyHistory.push("Increased speed (good performance)");
        }

        if (timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

function updateTimerDisplay() {
    timerValue.textContent = `00:${Math.max(0, Math.floor(timeLeft))}`;
    progressFill.style.width = `${(timeLeft / (selectedDifficulty === "easy" ? 90 : selectedDifficulty === "medium" ? 60 : 30)) * 100}%`;
}

/* -------------------------------------------------------------
   LOAD RANDOM ITEM
------------------------------------------------------------- */
function loadNewItem() {
    currentItem = items[Math.floor(Math.random() * items.length)];
    itemImage.src = currentItem.image;
    itemName.textContent = currentItem.name;
}

/* -------------------------------------------------------------
   BIN BUTTONS
------------------------------------------------------------- */
document.querySelectorAll(".bin-btn").forEach(btn => {
    btn.addEventListener("click", () => checkAnswer(btn.dataset.bin));
});

function checkAnswer(selectedBin) {
    if (!currentItem) return;

    if (selectedBin === currentItem.bin) {
        correct++;
        score++;
        feedback.textContent = "Correct!";
        feedback.className = "feedback correct";
        vibrate(60);
    } else {
        wrong++;
        score--;
        feedback.textContent = `Wrong! Correct bin: ${currentItem.bin}`;
        feedback.className = "feedback wrong";
        binMistakes[currentItem.bin] += 1;
        vibrate(120);
    }

    scoreEl.textContent = score;

    const accuracy = Math.max(0, Math.floor((correct / (correct + wrong)) * 100 || 0));
    gameStatsEl.textContent = `Correct: ${correct} | Wrong: ${wrong} | Accuracy: ${accuracy}%`;

    setTimeout(loadNewItem, 400);
}

/* -------------------------------------------------------------
   MOBILE VIBRATION
------------------------------------------------------------- */
function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
}

/* -------------------------------------------------------------
   END GAME
------------------------------------------------------------- */
function endGame() {
    clearInterval(timer);

    const accuracy = Math.max(0, Math.floor((correct / (correct + wrong)) * 100 || 0));

    /* STORE LOCAL STATS */
    updateLocalStats(score, correct, wrong, accuracy);

    /* SHOW MODAL */
    finalScoreText.textContent = `Your Score: ${score}`;
    finalStatsText.textContent = `Correct: ${correct} | Wrong: ${wrong} | Accuracy: ${accuracy}%`;

    gameOverModal.classList.remove("hidden");
    launchConfetti();

    /* GA4 EVENT */
    if (typeof gtag === "function") {
        gtag("event", "game_over", {
            score,
            correct,
            wrong,
            accuracy,
            difficulty: selectedDifficulty
        });
    }
}

/* -------------------------------------------------------------
   PLAY AGAIN
------------------------------------------------------------- */
playAgainBtn.addEventListener("click", () => {
    gameOverModal.classList.add("hidden");
    timeLeft = selectedDifficulty === "easy" ? 90 : selectedDifficulty === "medium" ? 60 : 30;
    startGame();
});

/* -------------------------------------------------------------
   WHATSAPP SHARE
------------------------------------------------------------- */
whatsappShareBtn.addEventListener("click", () => {
    const url = "https://creator619-python.github.io/Biomedical-Waste-Game/";
    const text = `I scored ${score} in the Biomedical Waste Game! Try it: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);

    if (typeof gtag === "function") {
        gtag("event", "whatsapp_share", { score });
    }
});

/* -------------------------------------------------------------
   CONFETTI EFFECT
------------------------------------------------------------- */
function launchConfetti() {
    const container = document.getElementById("confettiContainer");

    for (let i = 0; i < 40; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti-piece";
        confetti.style.left = Math.random() * 100 + "%";
        confetti.style.background = randomColor();
        container.appendChild(confetti);

        setTimeout(() => confetti.remove(), 2000);
    }
}

function randomColor() {
    const colors = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#6366f1"];
    return colors[Math.floor(Math.random() * colors.length)];
}

/* -------------------------------------------------------------
   FULLSCREEN TOGGLE
------------------------------------------------------------- */
document.getElementById("fullscreenBtn").addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
});

/* -------------------------------------------------------------
   ANALYTICS PANEL (SLIDE-OUT)
------------------------------------------------------------- */
analyticsBtn.addEventListener("click", () => {
    loadAnalyticsPanel();
    analyticsPanel.classList.add("open");
});

closeAnalytics.addEventListener("click", () => {
    analyticsPanel.classList.remove("open");
});

/* -------------------------------------------------------------
   LOCAL STORAGE STAT ENGINE
------------------------------------------------------------- */
function updateLocalStats(score, correct, wrong, accuracy) {
    let stats = JSON.parse(localStorage.getItem("bmwStats")) || {
        games: 0,
        bestScore: 0,
        totalScore: 0,
        totalCorrect: 0,
        totalWrong: 0
    };

    stats.games++;
    stats.totalScore += score;
    stats.totalCorrect += correct;
    stats.totalWrong += wrong;
    stats.bestScore = Math.max(stats.bestScore, score);

    localStorage.setItem("bmwStats", JSON.stringify(stats));
}

/* -------------------------------------------------------------
   LOAD ANALYTICS PANEL DATA
------------------------------------------------------------- */
function loadAnalyticsPanel() {
    let stats = JSON.parse(localStorage.getItem("bmwStats")) || {
        games: 0,
        bestScore: 0,
        totalScore: 0,
        totalCorrect: 0,
        totalWrong: 0
    };

    statTotalGames.textContent = stats.games;
    statBestScore.textContent = stats.bestScore;
    statAvgScore.textContent = stats.games > 0 ? (stats.totalScore / stats.games).toFixed(1) : 0;
    statTotalCorrect.textContent = stats.totalCorrect;
    statTotalWrong.textContent = stats.totalWrong;

    const totalAttempts = stats.totalCorrect + stats.totalWrong;
    statOverallAccuracy.textContent = totalAttempts > 0 
        ? Math.floor((stats.totalCorrect / totalAttempts) * 100) + "%" 
        : "0%";

    /* Weak bins analysis */
    weakBinsList.innerHTML = "";
    Object.keys(binMistakes).forEach(bin => {
        if (binMistakes[bin] > 0) {
            const li = document.createElement("li");
            li.textContent = `${bin}: ${binMistakes[bin]} mistakes`;
            weakBinsList.appendChild(li);
        }
    });

    /* Difficulty adaptation log */
    difficultyLog.innerHTML = "";
    if (difficultyHistory.length === 0) {
        difficultyLog.textContent = "No adaptation changes recorded.";
    } else {
        difficultyHistory.forEach(entry => {
            const div = document.createElement("div");
            div.textContent = "• " + entry;
            difficultyLog.appendChild(div);
        });
    }
}

