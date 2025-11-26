let items = {};
let currentItem = null;
let score = 0;
let mode = "intermediate";
let totalQuestions = 20;
let progress = 0;

fetch("items.json")
    .then(res => res.json())
    .then(data => {
        items = data;
        newItem();
    });

function setMode(m) {
    mode = m;

    document.getElementById("beginnerBtn").classList.remove("active");
    document.getElementById("intermediateBtn").classList.remove("active");
    document.getElementById("expertBtn").classList.remove("active");

    document.getElementById(m + "Btn").classList.add("active");

    totalQuestions = (m === "beginner") ? 10 : (m === "intermediate" ? 20 : 40);
    resetGame();
}

function resetGame() {
    score = 0;
    progress = 0;
    document.getElementById("score").textContent = score;
    document.getElementById("progressFill").style.width = "0%";
    newItem();
}

function newItem() {
    const keys = Object.keys(items);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    currentItem = items[randomKey];

    document.getElementById("itemName").textContent = randomKey;
    document.getElementById("itemImage").src = currentItem.image;

    document.getElementById("feedback").innerHTML = "";
}

function chooseBin(bin) {
    let correct = (bin === currentItem.bin);

    if (correct) {
        score += 10;
        showFeedback(true, "");
    } else {
        showFeedback(false, currentItem.bin);
    }

    document.getElementById("score").textContent = score;

    progress++;
    document.getElementById("progressFill").style.width =
        (progress / totalQuestions * 100) + "%";

    setTimeout(() => newItem(), 900);
}

function showFeedback(isCorrect, correctBin) {
    const fb = document.getElementById("feedback");

    if (isCorrect) {
        fb.innerHTML = `
            <img src="images/check.png" class="result-icon">
            <span class="correct-text">Correct! +10 points</span>
        `;
    } else {
        fb.innerHTML = `
            <img src="images/cross.png" class="result-icon">
            <span class="wrong-text">Wrong! Correct bin: ${correctBin}</span>
        `;
    }
}
