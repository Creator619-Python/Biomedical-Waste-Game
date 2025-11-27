let score = 0;
let timeLeft = 60; // 1 minute countdown
let timerInterval = null;

const scoreDisplay = document.getElementById("score");
const itemImage = document.getElementById("itemImage");
const itemName = document.getElementById("itemName");
const feedback = document.getElementById("feedback");
const progressFill = document.getElementById("progressFill");

let currentItem;

// -----------------------------
// Start Timer
// -----------------------------
function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;

        // Update progress bar
        let percent = (timeLeft / 60) * 100;
        progressFill.style.width = percent + "%";

        // End game when timer finishes
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}

// -----------------------------
// End Game
// -----------------------------
function endGame() {
    feedback.textContent = `⏳ Time's Up! Final Score: ${score}`;
    feedback.style.color = "blue";

    // Disable all buttons
    document.querySelectorAll(".bin-btn").forEach(btn => {
        btn.disabled = true;
    });

    // Add restart button
    const restartBtn = document.createElement("button");
    restartBtn.textContent = "Play Again";
    restartBtn.className = "restart-btn";
    restartBtn.onclick = () => location.reload();
    document.body.appendChild(restartBtn);
}

// -----------------------------
// Update Score (Can go NEGATIVE)
// -----------------------------
function updateScore(isCorrect) {
    if (isCorrect) {
        score++;
    } else {
        score--; // Score is allowed to go below zero
    }

    scoreDisplay.textContent = score;
}

// -----------------------------
// Load Next Item
// -----------------------------
function loadNextItem() {
    const item = items[Math.floor(Math.random() * items.length)];
    currentItem = item;
    itemImage.src = item.image;
    itemName.textContent = item.name;
}

// -----------------------------
// Handle Bin Clicks
// -----------------------------
document.querySelectorAll(".bin-btn").forEach(button => {
    button.addEventListener("click", () => {
        if (!currentItem || timeLeft <= 0) return;

        const selectedBin = button.dataset.bin;

        if (selectedBin === currentItem.bin) {
            feedback.textContent = "✔ Correct!";
            feedback.style.color = "green";
            updateScore(true);
        } else {
            feedback.textContent = "✖ Wrong!";
            feedback.style.color = "red";
            updateScore(false);
        }

        loadNextItem();
    });
});

// -----------------------------
// Initialize Game
// -----------------------------
loadNextItem();
startTimer();
