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

// references for difficulty UI (if present)
let diffCards = [];
let startBtn = null;

// Game Link (for QR + certificate)
const GAME_URL = "https://creator619-python.github.io/Biomedical-Waste-Game/";


// =======================================================
// LOAD ITEMS
// =======================================================
async function loadItems() {
    const response = await fetch("items.json");
    items = await response.json();
}


// =======================================================
// INITIALISE GAME (detect UI + start appropriately)
// =======================================================
async function initGame() {
    await loadItems();

    diffCards = document.querySelectorAll(".difficulty-card");
    startBtn = document.getElementById("startGameBtn");

    // CASE 1: Difficulty screen + start button exist
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

        startBtn.addEventListener("click", () => {
            startGame();
        });
    }
    // CASE 2: No start screen in HTML → auto start with medium difficulty
    else {
        selectedDifficulty = "medium";
        startGame();
    }
}


// =======================================================
// DIFFICULTY VALUES
// =======================================================
function applyDifficulty(level) {
    if (level === "easy") totalTime = 90;
    else if (level === "hard") totalTime = 30;
    else totalTime = 60; // default = medium

    timeLeft = totalTime;

    if (typeof gtag === "function") {
        gtag("event", "difficulty_selected", {
            level: selectedDifficulty,
            duration: totalTime
        });
    }
}


// =======================================================
// START GAME
// =======================================================
function startGame() {
    // default if somehow still null
    if (!selectedDifficulty) selectedDifficulty = "medium";

    // hide start screen if present
    const startScreen = document.getElementById("startScreen");
    if (startScreen) startScreen.classList.add("hidden");

    const gameContainer = document.getElementById("gameContainer");
    if (gameContainer) gameContainer.classList.remove("hidden");

    // reset timer + score
    clearInterval(timerInterval);
    applyDifficulty(selectedDifficulty);

    score = 0;
    correctCount = 0;
    wrongCount = 0;

    updateStats();
    updateTimerUI();

    if (typeof gtag === "function") {
        gtag("event", "game_started", {
            difficulty: selectedDifficulty
        });
    }

    loadNextItem();

    // Timer
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) endGame();
    }, 1000);
}


// =======================================================
// NEXT ITEM
// =======================================================
function loadNextItem() {
    if (!items.length) return;

    currentItem = items[Math.floor(Math.random() * items.length)];

    fadeSwap("itemImage", currentItem.image);
    fadeSwap("itemName", currentItem.name);
}


// fade animation for swapping item
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
// BIN CLICK HANDLING
// =======================================================
document.querySelectorAll(".bin-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        if (!currentItem) return;

        let chosen = btn.dataset.bin;

        if (chosen === currentItem.bin) {
            score++;
            correctCount++;

            showFeedback("Correct segregation!", true);

            if (typeof gtag === "function") {
                gtag("event", "correct_answer", {
                    item: currentItem.name,
                    bin: currentItem.bin,
                    difficulty: selectedDifficulty
                });
            }

        } else {
            score--;
            wrongCount++;

            showFeedback(`Wrong! Correct bin: ${currentItem.bin}`, false);

            if (typeof gtag === "function") {
                gtag("event", "wrong_answer", {
                    item: currentItem.name,
                    chosen_bin: chosen,
                    correct_bin: currentItem.bin,
                    difficulty: selectedDifficulty
                });
            }
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
    if (!tv) return;

    tv.textContent = "00:" + (timeLeft < 10 ? "0" + timeLeft : timeLeft);

    const pf = document.getElementById("progressFill");
    if (pf) {
        pf.style.width = (timeLeft / totalTime * 100) + "%";
    }
}


// =======================================================
// UPDATE SCORE PANEL
// =======================================================
function updateStats() {
    let accuracy =
        correctCount + wrongCount === 0
            ? 0
            : Math.round((correctCount / (correctCount + wrongCount)) * 100);

    const scoreElem = document.getElementById("score");
    if (scoreElem) scoreElem.textContent = score;

    const statsElem = document.getElementById("gameStats");
    if (statsElem) {
        statsElem.textContent =
            `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;
    }
}


// =======================================================
// FEEDBACK
// =======================================================
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
// COLLAPSIBLE INSTRUCTIONS
// =======================================================
const toggleBtn = document.getElementById("toggleInstructions");
if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        const panel = document.getElementById("instructionsPanel");
        const btn = document.getElementById("toggleInstructions");

        if (!panel || !btn) return;

        if (panel.classList.contains("hidden")) {
            panel.classList.remove("hidden");
            btn.textContent = "▲ Hide Instructions";
        } else {
            panel.classList.add("hidden");
            btn.textContent = "▼ Show Instructions";
        }
    });
}


// =======================================================
// END GAME
// =======================================================
function endGame() {
    clearInterval(timerInterval);

    const modal = document.getElementById("gameOverModal");

    let accuracy =
        correctCount + wrongCount === 0
            ? 0
            : Math.round((correctCount / (correctCount + wrongCount)) * 100);

    if (typeof gtag === "function") {
        gtag("event", "game_finished", {
            score: score,
            correct: correctCount,
            wrong: wrongCount,
            accuracy: accuracy,
            difficulty: selectedDifficulty
        });
    }

    if (modal) {
        const s = document.getElementById("finalScoreText");
        const st = document.getElementById("finalStatsText");
        if (s) s.textContent = `Your Score: ${score}`;
        if (st) st.textContent =
            `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;

        modal.classList.remove("hidden");
    }
}


// =======================================================
// PLAY AGAIN
// =======================================================
const playAgainBtn = document.getElementById("playAgainBtn");
if (playAgainBtn) {
    playAgainBtn.addEventListener("click", () => {
        const modal = document.getElementById("gameOverModal");
        if (modal) modal.classList.add("hidden");
        startGame();
    });
}


// =======================================================
// CERTIFICATE GENERATION
// =======================================================
const downloadCertBtn = document.getElementById("downloadCertBtn");
if (downloadCertBtn) {
    downloadCertBtn.addEventListener("click", () => {
        generateCertificate();
    });
}

function generateCertificate() {

    let playerName = prompt("Enter your Name:");
    if (!playerName) playerName = "Anonymous";

    let org = prompt("Enter your Organization:");
    if (!org) org = "Not Specified";

    let accuracy =
        correctCount + wrongCount === 0
            ? 0
            : Math.round((correctCount / (correctCount + wrongCount)) * 100);

    // Random certificate ID
    let certID = "BMW-" + Math.floor(Math.random() * 999999);

    // Certificate container
    let certWindow = window.open("", "_blank");

    certWindow.document.write(`
        <html>
        <head>
        <title>Certificate</title>
        <style>
            body {
                font-family: Arial;
                text-align: center;
                padding: 20px;
            }
            .cert-box {
                border: 4px solid #2b6cb0;
                padding: 20px;
                border-radius: 16px;
            }
            h2 { color:#2b6cb0; }
            .credit {
                margin-top: 12px;
                color:#555;
                font-size: 0.8rem;
            }
        </style>
        </head>
        <body>
        <div class="cert-box">
            <h2>Certificate of Completion</h2>
            <p>This is to certify that</p>
            <h3><strong>${playerName}</strong></h3>
            <p>from <strong>${org}</strong></p>
            <p> has successfully completed the <br>
                <strong>Biomedical Waste Segregation Game</strong></p>

            <p><br><strong>Score:</strong> ${score}</p>
            <p><strong>Accuracy:</strong> ${accuracy}%</p>
            <p><strong>Difficulty:</strong> ${selectedDifficulty.toUpperCase()}</p>
            <p><strong>Certificate ID:</strong> ${certID}</p>

            <div id="qrcode"></div>

            <p style="margin-top:10px;font-size:0.8rem;">Scan to Play: ${GAME_URL}</p>

            <p class="credit">Designed & Developed by <strong>Gokul T.B</strong></p>
        </div>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
        <script>
            new QRCode(document.getElementById("qrcode"), "${GAME_URL}");
        </script>
        </body>
        </html>
    `);

    certWindow.document.close();

    if (typeof gtag === "function") {
        gtag("event", "certificate_generated", {
            difficulty: selectedDifficulty,
            score: score,
            accuracy: accuracy
        });
    }
}


// =======================================================
// INIT
// =======================================================
initGame();
