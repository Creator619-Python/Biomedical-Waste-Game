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

const GAME_URL = "https://creator619-python.github.io/Biomedical-Waste-Game/";


// =======================================================
// LOAD ITEMS
// =======================================================
async function loadItems() {
    const response = await fetch("items.json");
    items = await response.json();
}


// =======================================================
// INITIALISE GAME
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
    currentItem = items[Math.floor(Math.random() * items.length)];

    fadeSwap("itemImage", currentItem.image);
    fadeSwap("itemName", currentItem.name);
}


// Fade animation
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
        let chosen = btn.dataset.bin;

        if (chosen === currentItem.bin) {
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
// TIMER UPDATE
// =======================================================
function updateTimerUI() {
    const tv = document.getElementById("timerValue");
    tv.textContent = `00:${timeLeft < 10 ? "0" + timeLeft : timeLeft}`;

    document.getElementById("progressFill").style.width =
        (timeLeft / totalTime * 100) + "%";
}


// =======================================================
// SCORE + ACCURACY
// =======================================================
function updateStats() {
    const accuracy =
        correctCount + wrongCount === 0
            ? 0
            : Math.round((correctCount / (correctCount + wrongCount)) * 100);

    document.getElementById("score").textContent = score;

    document.getElementById("gameStats").textContent =
        `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;
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
// END GAME
// =======================================================
function endGame() {
    clearInterval(timerInterval);

    const modal = document.getElementById("gameOverModal");

    const accuracy =
        correctCount + wrongCount === 0
            ? 0
            : Math.round((correctCount / (correctCount + wrongCount)) * 100);

    document.getElementById("finalScoreText").textContent = `Your Score: ${score}`;
    document.getElementById("finalStatsText").textContent =
        `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;

    modal.classList.remove("hidden");
}


// =======================================================
// PLAY AGAIN
// =======================================================
document.getElementById("playAgainBtn").addEventListener("click", () => {
    document.getElementById("gameOverModal").classList.add("hidden");
    startGame();
});


// =======================================================
// CERTIFICATE DOWNLOAD (FIXED VERSION)
// =======================================================
document.getElementById("downloadCertBtn").addEventListener("click", generateCertificate);

async function generateCertificate() {

    let playerName = prompt("Enter your Name:");
    if (!playerName) playerName = "Anonymous";

    let org = prompt("Enter your Organization:");
    if (!org) org = "Not Specified";

    const accuracy =
        correctCount + wrongCount === 0
            ? 0
            : Math.round((correctCount / (correctCount + wrongCount)) * 100);

    const certID = "BMW-" + Math.floor(100000 + Math.random() * 900000);
    const certDate = new Date().toLocaleDateString();


    // Load libraries
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");

    // Create certificate HTML element
    const certDiv = document.createElement("div");
    certDiv.style.width = "900px";
    certDiv.style.padding = "40px";
    certDiv.style.background = "white";
    certDiv.style.fontFamily = "Arial";
    certDiv.style.textAlign = "center";

    certDiv.innerHTML = `
        <div style="border: 8px solid #2b6cb0; padding: 40px; border-radius: 12px;">
            <h1 style="color:#2b6cb0;">Certificate of Completion</h1>
            <p>This certifies that</p>
            <h2><strong>${playerName}</strong></h2>
            <p>from <strong>${org}</strong></p>
            <p>has successfully completed the</p>
            <h3><strong>Biomedical Waste Segregation Training Game</strong></h3>
            <br>
            <p><strong>Score:</strong> ${score}</p>
            <p><strong>Accuracy:</strong> ${accuracy}%</p>
            <p><strong>Difficulty:</strong> ${selectedDifficulty.toUpperCase()}</p>
            <p><strong>Date:</strong> ${certDate}</p>
            <p><strong>Certificate ID:</strong> ${certID}</p>

            <div id="qr-area"></div>

            <p style="margin-top: 12px; font-size: 0.9rem;">Scan to Play Again: ${GAME_URL}</p>

            <p style="margin-top:16px; font-size:0.8rem; color:#444;">
                Designed & Developed by <strong>Gokul T.B</strong>
            </p>
        </div>
    `;

    // Generate QR Code
    const qrDiv = certDiv.querySelector("#qr-area");
    new QRCode(qrDiv, GAME_URL);

    // FIX: wait for QR image to load
    await new Promise(resolve => setTimeout(resolve, 600));

    // FIX: html2canvas settings
    const canvas = await html2canvas(certDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 2000
    });

    const img = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("landscape", "pt", "a4");

    pdf.addImage(img, "PNG", 0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height);

    pdf.save("certificate.pdf");
}


// =======================================================
// HELPER FUNCTION TO LOAD SCRIPTS
// =======================================================
function loadScript(url) {
    return new Promise(resolve => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = resolve;
        document.body.appendChild(script);
    });
}


// =======================================================
// INIT
// =======================================================
initGame();

