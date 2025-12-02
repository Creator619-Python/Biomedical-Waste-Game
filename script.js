// --- Configuration ---
const GAME_DURATION = 60; // seconds

// --- Game State ---
let items = [];
let currentItem = null;
let score = 0;
let correctCount = 0;
let wrongCount = 0;
let timeLeft = GAME_DURATION;
let timerInterval = null;
let gameActive = false;

// --- DOM Elements ---
const scoreDisplay = document.getElementById("score");
const itemImage = document.getElementById("itemImage");
const itemName = document.getElementById("itemName");
const feedback = document.getElementById("feedback");
const progressFill = document.getElementById("progressFill");
const timerValue = document.getElementById("timerValue");
const gameStats = document.getElementById("gameStats");
const gameOverModal = document.getElementById("gameOverModal");
const finalScoreText = document.getElementById("finalScoreText");
const finalStatsText = document.getElementById("finalStatsText");
const playAgainBtn = document.getElementById("playAgainBtn");

// --- Utility: format time as MM:SS ---
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

// --- Update Timer UI ---
function updateTimerUI() {
    timerValue.textContent = formatTime(timeLeft);
    const percent = (timeLeft / GAME_DURATION) * 100;
    progressFill.style.width = `${percent}%`;
}

// --- Start Timer ---
function startTimer() {
    timeLeft = GAME_DURATION;
    updateTimerUI();

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();

        if (timeLeft <= 0) {
            timeLeft = 0;
            updateTimerUI();
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

// --- End Game ---
function endGame() {
    gameActive = false;

    // Disable buttons
    document.querySelectorAll(".bin-btn").forEach(btn => {
        btn.disabled = true;
    });

    const totalAttempts = correctCount + wrongCount;
    const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

    feedback.textContent = "⏳ Time's up! Great effort.";
    feedback.classList.remove("correct", "wrong");

    finalScoreText.textContent = `Final Score: ${score}`;
    finalStatsText.textContent =
        `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;

    gameOverModal.classList.remove("hidden");
}

// --- Update Score & Stats (score can go negative) ---
function updateScore(isCorrect) {
    if (isCorrect) {
        score++;
        correctCount++;
    } else {
        score--; // allow negative score
        wrongCount++;
    }

    scoreDisplay.textContent = score;

    const total = correctCount + wrongCount;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    gameStats.textContent =
        `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;
}

// --- Smoothly Load Next Item ---
function loadNextItem() {
    if (!items.length) return;

    const randomIndex = Math.floor(Math.random() * items.length);
    const nextItem = items[randomIndex];
    currentItem = nextItem;

    // Smooth fade-out and fade-in effect
    itemImage.classList.add("fade-out");
    setTimeout(() => {
        itemImage.src = currentItem.image;
        itemName.textContent = currentItem.name;
        itemImage.onload = () => {
            itemImage.classList.remove("fade-out");
            itemImage.classList.add("fade-in");
            setTimeout(() => itemImage.classList.remove("fade-in"), 200);
        };
    }, 150);
}

// --- Handle Bin Click ---
function handleBinClick(binName) {
    if (!gameActive || timeLeft <= 0 || !currentItem) return;

    const isCorrect = (binName === currentItem.bin);

    // Feedback styling
    feedback.classList.remove("correct", "wrong");
    if (isCorrect) {
        feedback.textContent = "✔ Correct segregation!";
        feedback.classList.add("correct");
    } else {
        feedback.textContent = `✖ Wrong bin. Correct bin: ${currentItem.bin}`;
        feedback.classList.add("wrong");
    }

    updateScore(isCorrect);
    loadNextItem();
}

// --- Attach Event Listeners to Bins ---
function setupBinButtons() {
    document.querySelectorAll(".bin-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const selectedBin = btn.dataset.bin;
            handleBinClick(selectedBin);
        });
    });
}

// --- Start Game ---
function startGame() {
    score = 0;
    correctCount = 0;
    wrongCount = 0;
    scoreDisplay.textContent = score;
    gameStats.textContent = "Correct: 0 | Wrong: 0 | Accuracy: 0%";
    feedback.textContent = "";
    gameActive = true;

    document.querySelectorAll(".bin-btn").forEach(btn => {
        btn.disabled = false;
    });

    gameOverModal.classList.add("hidden");

    loadNextItem();
    startTimer();
}

// --- Load Items (from items.json with fallback) ---
function loadItems() {
    fetch("items.json")
        .then(res => res.json())
        .then(data => {
            items = data;
            startGame();
        })
        .catch(err => {
            console.error("Error loading items.json, using fallback items.", err);
            // Fallback items in case JSON fails
            items = [
                { name: "Used syringe with needle", image: "images/syringe_needle.png", bin: "White" },
                { name: "IV set", image: "images/iv_set.png", bin: "Red" },
                { name: "Blood bag (used)", image: "images/blood_bag.png", bin: "Yellow" },
                { name: "Soiled gauze with blood", image: "images/gauze_blood.png", bin: "Yellow" },
                { name: "Broken glass vial", image: "images/broken_vial.png", bin: "Blue" },
                { name: "Scalpel blade", image: "images/scalpel_blade.png", bin: "White" },
                { name: "Face mask (used)", image: "images/used_mask.png", bin: "Yellow" },
                { name: "Catheter tubing", image: "images/catheter_tube.png", bin: "Red" },
                { name: "Food leftovers", image: "images/food_leftovers.png", bin: "Green" },
                { name: "Paper wrapper (clean)", image: "images/paper_wrapper.png", bin: "Green" },
                { name: "Ampoule (unbroken)", image: "images/ampoule.png", bin: "Blue" },
                { name: "Needle cutter sharps container", image: "images/sharps_box.png", bin: "White" }
            ];
            startGame();
        });
}

// --- Play Again Button ---
playAgainBtn.addEventListener("click", () => {
    clearInterval(timerInterval);
    timeLeft = GAME_DURATION;
    updateTimerUI();
    startGame();
});

// --- Initialize on DOM Ready ---
document.addEventListener("DOMContentLoaded", () => {
    setupBinButtons();
    updateTimerUI();
    loadItems();
});



