import { saveScore } from "./firebase.js";

/* =====================================================
   INJECT GLOBAL MODALS TEMPLATE
===================================================== */
const modalTemplate = document.getElementById("global-modals");
if (modalTemplate) {
    document.body.appendChild(modalTemplate.content.cloneNode(true));
}

/* =====================================================
   GLOBAL STATE
===================================================== */
let items = [];
let currentItem = null;

let score = 0;
let correct = 0;
let wrong = 0;

let timer = null;
let totalTime = 60;

/* =====================================================
   LOAD ITEMS.JSON
===================================================== */
async function loadItems() {
    const res = await fetch("items.json");
    items = await res.json();
}

/* =====================================================
   DOM ELEMENTS
===================================================== */
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

/* =====================================================
   UTILS
===================================================== */
function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* =====================================================
   DIFFICULTY SELECTION
===================================================== */
document.querySelectorAll(".difficulty-card").forEach(card => {
    card.onclick = () => {
        document.querySelectorAll(".difficulty-card")
            .forEach(c => c.classList.remove("selected"));

        card.classList.add("selected");

        const level = card.dataset.level;
        if (level === "easy") totalTime = 90;
        if (level === "medium") totalTime = 60;
        if (level === "hard") totalTime = 30;

        timerValue.textContent = formatTime(totalTime);
    };
});

/* =====================================================
   START GAME
===================================================== */
document.getElementById("startGameBtn").onclick = async () => {
    if (items.length === 0) {
        await loadItems();
    }

    startScreen.classList.add("hidden");
    gameContainer.classList.remove("hidden");

    score = 0;
    correct = 0;
    wrong = 0;

    scoreDisplay.textContent = score;
    feedback.textContent = "Choose the correct bin";
    feedback.style.color = "";

    updateStats();
    startTimer();
    loadNewItem();
};

/* =====================================================
   TIMER
===================================================== */
function startTimer() {
    let timeLeft = totalTime;
    timerValue.textContent = formatTime(timeLeft);

    clearInterval(timer);

    timer = setInterval(() => {
        timeLeft--;

        timerValue.textContent = formatTime(timeLeft);
        progressFill.style.width = `${(timeLeft / totalTime) * 100}%`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            gameOver();
        }
    }, 1000);
}

/* =====================================================
   LOAD NEW ITEM
===================================================== */
function loadNewItem() {
    currentItem = items[Math.floor(Math.random() * items.length)];

    itemImage.src = currentItem.image;
    itemImage.alt = currentItem.name;

    itemName.textContent = currentItem.name;
    feedback.textContent = "Choose the correct bin";
    feedback.style.color = "";
}

/* =====================================================
   BIN CLICK HANDLERS
===================================================== */
document.querySelectorAll(".bin-btn").forEach(btn => {
    btn.onclick = () => {
        if (!currentItem) return;

        const chosen = btn.dataset.bin;

        if (chosen === currentItem.bin) {
            score++;
            correct++;
            feedback.textContent = "✔ Correct!";
            feedback.style.color = "#4caf50";
        } else {
            score = Math.max(0, score - 1);
            wrong++;
            feedback.textContent = `✖ Wrong — Correct bin: ${currentItem.bin}`;
            feedback.style.color = "#ff5252";
        }

        scoreDisplay.textContent = score;
        updateStats();
        loadNewItem();
    };
});

/* =====================================================
   UPDATE STATS
===================================================== */
function updateStats() {
    const total = correct + wrong;
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

    gameStats.textContent =
        `Correct: ${correct} | Wrong: ${wrong} | Accuracy: ${accuracy}%`;
}

/* =====================================================
   GAME OVER
===================================================== */
function gameOver() {
    feedback.textContent = "⏱ Time's up!";
    feedback.style.color = "#ffd700";

    window.finalGameScore = score;
    scoreSubmitModal.classList.remove("hidden");
}

/* =====================================================
   SCORE SUBMISSION
===================================================== */
document.getElementById("submitScoreBtn").onclick = async () => {
    const nameInput = document.getElementById("playerNameInput");
    const errorText = document.getElementById("nameError");
    const postActions = document.getElementById("postGameActions");

    const name = nameInput.value.trim();

    if (!/^[A-Za-z ]{3,20}$/.test(name)) {
        errorText.classList.remove("hidden");
        return;
    }

    errorText.classList.add("hidden");

    const saved = await saveScore(name, window.finalGameScore);

    if (saved) {
        postActions.classList.remove("hidden");
    } else {
        alert("Error saving score. Please try again.");
    }
};

/* =====================================================
   OPTIONAL WHATSAPP SHARE
===================================================== */
document.getElementById("shareWhatsappBtn").onclick = () => {
    const text =
`I scored ${window.finalGameScore} in the Biomedical Waste Segregation Game 🏥♻️

Try it here:
https://creator619-python.github.io/Biomedical-Waste-Game/`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
};

/* =====================================================
   OPTIONAL CERTIFICATE
===================================================== */
document.getElementById("getCertificateBtn").onclick = () => {
    const name = document.getElementById("playerNameInput").value.trim();

    document.getElementById("certName").textContent = name;
    document.getElementById("certScore").textContent =
        `Score: ${window.finalGameScore}`;

    document.getElementById("certificateModal")
        .classList.remove("hidden");
};

/* =====================================================
   SKIP ACTIONS
===================================================== */
document.getElementById("skipActionsBtn").onclick = () => {
    window.location.href = "leaderboard.html";
};

/* =====================================================
   CANCEL SUBMISSION
===================================================== */
document.getElementById("cancelSubmitBtn").onclick = () => {
    scoreSubmitModal.classList.add("hidden");
};
