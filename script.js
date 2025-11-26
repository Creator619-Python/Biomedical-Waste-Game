// Game state
let itemsData = {};
let itemNames = [];
let currentItemName = null;
let score = 0;
let questionsAnswered = 0;
const totalQuestions = 20; // progress bar target

// Load items.json then start game
document.addEventListener("DOMContentLoaded", () => {
    fetch("items.json")
        .then(res => res.json())
        .then(data => {
            itemsData = data;
            itemNames = Object.keys(itemsData);
            attachBinHandlers();
            newRound();
        })
        .catch(err => {
            console.error("Error loading items.json", err);
            alert("Unable to load items.json. Please check the console.");
        });
});

// Attach click listeners to each bin button
function attachBinHandlers() {
    const buttons = document.querySelectorAll(".bin-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const bin = btn.getAttribute("data-bin");
            handleAnswer(bin);
        });
    });
}

// Start a new round with a random item
function newRound() {
    if (itemNames.length === 0) return;

    const randomIndex = Math.floor(Math.random() * itemNames.length);
    currentItemName = itemNames[randomIndex];

    const item = itemsData[currentItemName];

    const imgEl = document.getElementById("itemImage");
    const nameEl = document.getElementById("itemName");

    imgEl.src = item.image;
    imgEl.alt = currentItemName;
    nameEl.textContent = currentItemName;

    // Clear feedback
    document.getElementById("feedback").innerHTML = "";
}

// Handle user selecting a bin
function handleAnswer(selectedBin) {
    if (!currentItemName) return;

    const correctBin = itemsData[currentItemName].bin;
    const isCorrect = (selectedBin === correctBin);

    if (isCorrect) {
        score += 10;
    } else {
        score -= 5;
        if (score < 0) score = 0; // prevent negative score
    }

    questionsAnswered++;
    updateScoreDisplay();
    updateProgressBar();
    showFeedback(isCorrect, correctBin);

    // After short delay, move to next item (unless finished)
    setTimeout(() => {
        if (questionsAnswered >= totalQuestions) {
            endGame();
        } else {
            newRound();
        }
    }, 900);
}

// Update score on screen
function updateScoreDisplay() {
    document.getElementById("score").textContent = score;
}

// Update progress bar (0–100%)
function updateProgressBar() {
    const percent = Math.min(100, (questionsAnswered / totalQuestions) * 100);
    document.getElementById("progressFill").style.width = percent + "%";
}

// Show ✔ or ✖ feedback
function showFeedback(isCorrect, correctBin) {
    const fb = document.getElementById("feedback");
    if (isCorrect) {
        fb.innerHTML = `
            <img src="images/check.png" class="result-icon" alt="Correct">
            <span class="correct-text">Correct! +10 points</span>
        `;
    } else {
        fb.innerHTML = `
            <img src="images/cross.png" class="result-icon" alt="Wrong">
            <span class="wrong-text">Wrong! -5 points (Correct bin: ${correctBin})</span>
        `;
    }
}

// When totalQuestions reached
function endGame() {
    const fb = document.getElementById("feedback");
    fb.innerHTML = `
        <span class="correct-text">
            Game over! Final score: ${score}
        </span>
    `;
}
