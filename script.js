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

let selectedDifficulty = "medium"; // Default

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
        const chosen = btn.dataset.bin;

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
        (correctCount + wrongCount === 0)
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
        (correctCount + wrongCount === 0)
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
// FINAL WORKING CERTIFICATE GENERATION
// =======================================================
document.getElementById("downloadCertBtn").addEventListener("click", generateCertificate);

async function generateCertificate() {

    let name = prompt("Enter your Name:");
    if (!name) name = "Anonymous";

    let org = prompt("Enter your Organization:");
    if (!org) org = "Not Specified";

    const accuracy =
        (correctCount + wrongCount === 0)
            ? 0
            : Math.round((correctCount / (correctCount + wrongCount)) * 100);

    const certID = "BMW-" + Math.floor(100000 + Math.random() * 900000);

    // Fill template
    document.getElementById("certName").textContent = name;
    document.getElementById("certOrg").textContent = org;
    document.getElementById("certScore").textContent = score;
    document.getElementById("certAccuracy").textContent = accuracy;
    document.getElementById("certDifficulty").textContent = selectedDifficulty.toUpperCase();
    document.getElementById("certID").textContent = certID;

    // Generate QR
    document.getElementById("certQR").innerHTML = "";
    new QRCode(document.getElementById("certQR"), GAME_URL);

    const element = document.getElementById("certificateContainer");

    // Convert to PDF
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jspdf.jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const ratio = canvas.height / canvas.width;
    const pdfHeight = pdfWidth * ratio;

    pdf.addImage(imgData, "PNG", 0, 5, pdfWidth, pdfHeight);
    pdf.save(`Certificate_${name}.pdf`);
}


// =======================================================
// INIT
// =======================================================
initGame();
