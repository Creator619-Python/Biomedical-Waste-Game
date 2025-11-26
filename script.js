let itemsData = {};
let itemNames = [];
let itemsByBin = {};
let currentItem = null;

let score = 0;
let streak = 0;
let feedbackText = "";
let explanationText = "";
let gameOver = false;

let currentLevel = "Intermediate";
let maxTime = 60;
let timeLeft = 60;
let timerInterval = null;

// Bin explanations
const binExplanations = {
    Yellow: "Yellow bin: human anatomical waste, soiled dressings, cotton, plaster casts, and expired medicines – sent for incineration as per BMWM rules.",
    Red: "Red bin: contaminated plastic items like IV sets, catheters, urine bags, blood bags and syringes without needles – sent for autoclaving/shredding.",
    Translucent: "White/translucent container: sharps such as needles, blades, scalpels, syringes with needles – to be mutilated/shredded and treated.",
    Blue: "Blue bin: glassware including vials, ampoules, slides and broken glass – disinfected and sent for recycling.",
    Green: "Green bin: general / biodegradable non-infectious waste."
};

function randomItem() {
    const idx = Math.floor(Math.random() * itemNames.length);
    return itemNames[idx];
}

function buildStudyData() {
    itemsByBin = {};
    itemNames.forEach(name => {
        const bin = itemsData[name].bin;
        if (!itemsByBin[bin]) itemsByBin[bin] = [];
        itemsByBin[bin].push(name);
    });
}

function renderStudyPanel() {
    const panel = document.getElementById("studyPanel");
    panel.innerHTML = "";

    const binOrder = ["Yellow", "Red", "Translucent", "Blue", "Green"];
    binOrder.forEach(bin => {
        const items = itemsByBin[bin] || [];
        if (items.length === 0) return;

        const binDiv = document.createElement("div");
        binDiv.className = "study-bin";

        const h3 = document.createElement("h3");
        h3.textContent = bin + " Bin";
        binDiv.appendChild(h3);

        const desc = document.createElement("p");
        desc.className = "study-bin-desc";
        desc.textContent = binExplanations[bin] || (bin + " bin items used in this game.");
        binDiv.appendChild(desc);

        const row = document.createElement("div");
        row.className = "study-items-row";

        items.forEach(name => {
            const itDiv = document.createElement("div");
            itDiv.className = "study-item";

            const img = document.createElement("img");
            img.src = itemsData[name].image;
            img.alt = name;
            itDiv.appendChild(img);

            const span = document.createElement("span");
            span.textContent = name;
            itDiv.appendChild(span);

            row.appendChild(itDiv);
        });

        binDiv.appendChild(row);
        panel.appendChild(binDiv);
    });
}

function updateLevelButtons() {
    document.querySelectorAll(".level-btn").forEach(btn => {
        if (btn.dataset.level === currentLevel) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

function setLevel(level) {
    currentLevel = level;
    if (level === "Beginner") maxTime = 90;
    else if (level === "Expert") maxTime = 45;
    else maxTime = 60;

    updateLevelButtons();
    newGame(); // restart with new difficulty
}

function newGame() {
    score = 0;
    streak = 0;
    feedbackText = "";
    explanationText = "";
    gameOver = false;
    timeLeft = maxTime;
    updateUI();

    // pick first item
    currentItem = randomItem();
    showCurrentItem();

    // restart timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
    if (gameOver) {
        clearInterval(timerInterval);
        return;
    }
    timeLeft -= 1;
    if (timeLeft <= 0) {
        timeLeft = 0;
        gameOver = true;
        feedbackText = `Game Over! Final Score: ${score}`;
    }
    updateTimerBar();
    document.getElementById("scoreDisplay").innerText = score;
    document.getElementById("feedback").innerText = feedbackText;
}

function updateTimerBar() {
    const fill = document.getElementById("timerFill");
    const pct = (timeLeft / maxTime) * 100;
    fill.style.width = pct + "%";
}

function showCurrentItem() {
    const img = document.getElementById("wasteImage");
    const nameEl = document.getElementById("itemName");

    if (!currentItem) return;
    const item = itemsData[currentItem];

    img.style.opacity = 0;
    setTimeout(() => {
        img.src = item.image;
        img.alt = currentItem;
        img.style.opacity = 1;
    }, 150);

    nameEl.textContent = currentItem;
}

function getItemExplanation(name) {
    const bin = itemsData[name].bin;
    const base = `${name} should go to the ${bin} bin. `;
    const extra = binExplanations[bin] || "";
    return base + extra;
}

function playSound(type) {
    let el = null;
    if (type === "correct") el = document.getElementById("soundCorrect");
    if (type === "wrong") el = document.getElementById("soundWrong");
    if (el) {
        el.currentTime = 0;
        el.play().catch(() => {});
    }
}

function sortItem(binName) {
    if (gameOver || !currentItem) return;

    const correctBin = itemsData[currentItem].bin;
    let bonus = 0;

    if (binName === correctBin) {
        streak += 1;
        let delta = 10;
        if (streak >= 3) {
            bonus = 5;
            delta += bonus;
        }
        score += delta;
        feedbackText = `Correct! +${delta} points`;
        playSound("correct");
    } else {
        streak = 0;
        score -= 5;
        feedbackText = `Wrong! -5 points (Correct bin: ${correctBin})`;
        playSound("wrong");
    }

    explanationText = getItemExplanation(currentItem);
    currentItem = randomItem();
    showCurrentItem();
    updateUI();
}

function updateUI() {
    document.getElementById("scoreDisplay").innerText = score;
    document.getElementById("feedback").innerText = feedbackText;
    document.getElementById("explanation").innerText = explanationText;

    const streakInfo = document.getElementById("streakInfo");
    if (streak >= 2) {
        let text = `Streak: ${streak} correct in a row!`;
        streakInfo.innerText = text;
    } else {
        streakInfo.innerText = "";
    }
    updateTimerBar();
}

function toggleStudyMode() {
    const panel = document.getElementById("studyPanel");
    panel.style.display = (panel.style.display === "block") ? "none" : "block";
}

function attachEventHandlers() {
    // Level buttons
    document.querySelectorAll(".level-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            setLevel(btn.dataset.level);
        });
    });

    // New game button
    document.getElementById("newGameBtn").addEventListener("click", () => {
        newGame();
    });

    // Bins
    document.querySelectorAll(".bin").forEach(bin => {
        bin.addEventListener("click", () => {
            const binName = bin.dataset.bin;
            sortItem(binName);
        });
    });

    // Study mode toggle
    document.getElementById("studyToggleBtn").addEventListener("click", () => {
        toggleStudyMode();
    });
}

function initGame() {
    fetch("items.json")
        .then(r => r.json())
        .then(data => {
            itemsData = data;
            itemNames = Object.keys(itemsData);
            buildStudyData();
            renderStudyPanel();
            updateLevelButtons();
            newGame();
        })
        .catch(err => {
            console.error("Error loading items.json", err);
            alert("Unable to load items.json. Check console for details.");
        });
}

document.addEventListener("DOMContentLoaded", () => {
    attachEventHandlers();
    initGame();
});
