// ===============================
// MODULE IMPORT
// ===============================
import { saveScore } from "./firebase.js";

// ===============================
// DOM READY
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  /* =============================
     INJECT GLOBAL MODALS
  ============================== */
  const modalTemplate = document.getElementById("global-modals");
  if (modalTemplate) {
    document.body.appendChild(modalTemplate.content.cloneNode(true));
  }

  /* =============================
     GLOBAL STATE
  ============================== */
  let items = [];
  let currentItem = null;

  let score = 0;
  let correct = 0;
  let wrong = 0;

  let timer = null;
  let totalTime = 60;
  let gameRunning = false; // 🔑 single source of truth

  /* =============================
     DOM ELEMENTS
  ============================== */
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

  /* =============================
     LOAD ITEMS (NO CACHE)
  ============================== */
  async function loadItems() {
    const res = await fetch("items.json?v=" + Date.now());
    items = await res.json();
  }

  /* =============================
     UTIL
  ============================== */
  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  /* =============================
     DIFFICULTY
  ============================== */
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

  /* =============================
   START GAME (SAFE)
============================= */
const startGameBtn = document.getElementById("startGameBtn");

if (startGameBtn) {
  startGameBtn.onclick = async () => {
    if (items.length === 0) await loadItems();

    startScreen.classList.add("hidden");
    gameContainer.classList.remove("hidden");

    // reset state
    score = 0;
    correct = 0;
    wrong = 0;
    currentItem = null;
    gameRunning = true;

    // reset UI
    scoreDisplay.textContent = score;
    feedback.textContent = "Choose the correct bin";
    feedback.style.color = "";

    document.querySelectorAll(".bin-btn").forEach(btn => {
      btn.disabled = false;
    });

    updateStats();
    startTimer();
    loadNewItem();
  };
} else {
  console.error("startGameBtn not found in DOM");
}

  /* =============================
     TIMER (HARD STOP)
  ============================== */
  function startTimer() {
    let timeLeft = totalTime;
    timerValue.textContent = formatTime(timeLeft);

    clearInterval(timer);
    timer = setInterval(() => {
      if (!gameRunning) {
        clearInterval(timer);
        return;
      }

      timeLeft--;
      timerValue.textContent = formatTime(timeLeft);
      progressFill.style.width = `${(timeLeft / totalTime) * 100}%`;

      if (timeLeft <= 0) {
        gameOver();
      }
    }, 1000);
  }

  /* =============================
     LOAD ITEM (IMAGE FIX ✅)
  ============================== */
  function loadNewItem() {
    if (!gameRunning) return;

    currentItem = items[Math.floor(Math.random() * items.length)];

    // 🔥 CRITICAL FIX FOR GITHUB PAGES
    itemImage.src = new URL(currentItem.image, window.location.href).href;
    itemImage.alt = currentItem.name;

    itemName.textContent = currentItem.name;
    feedback.textContent = "Choose the correct bin";
    feedback.style.color = "";
  }

  /* =============================
     BIN HANDLERS
  ============================== */
  document.querySelectorAll(".bin-btn").forEach(btn => {
    btn.onclick = () => {
      if (!gameRunning || !currentItem) return;

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

  /* =============================
     STATS
  ============================== */
  function updateStats() {
    const total = correct + wrong;
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
    gameStats.textContent =
      `Correct: ${correct} | Wrong: ${wrong} | Accuracy: ${accuracy}%`;
  }

  /* =============================
     GAME OVER
  ============================== */
  function gameOver() {
    if (!gameRunning) return;

    gameRunning = false;
    clearInterval(timer);

    feedback.textContent = "⏱ Time's up!";
    feedback.style.color = "#ffd700";

    document.querySelectorAll(".bin-btn").forEach(btn => {
      btn.disabled = true;
    });

    window.finalGameScore = score;
    scoreSubmitModal.classList.remove("hidden");
  }

  /* =============================
   SCORE SUBMIT (SAFE)
============================= */

const submitBtn = document.getElementById("submitScoreBtn");

if (submitBtn) {
  /* =============================
   WHATSAPP SHARE
============================= */
function showWhatsAppShare(name, score) {
  const whatsappBtn = document.getElementById("whatsappShareBtn");
  if (!whatsappBtn) return;

  const text =
    `🎉 I just completed the Biomedical Waste Segregation Game!\n\n` +
    `👤 Name: ${name}\n` +
    `🏆 Score: ${score}\n\n` +
    `Try it yourself 👇\n` +
    `https://creator619-python.github.io/Biomedical-Waste-Game/`;

  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;

  whatsappBtn.classList.remove("hidden");
  whatsappBtn.onclick = () => window.open(url, "_blank");
}

  submitBtn.onclick = async () => {

    const nameInput = document.getElementById("playerNameInput");
    const errorText = document.getElementById("nameError");

    // 🛑 HARD GUARD — prevents crash
    if (!nameInput || !errorText) {
      console.error("Score submit elements not found in DOM");
      return;
    }

    const name = nameInput.value.trim();

    if (!/^[A-Za-z ]{3,20}$/.test(name)) {
      errorText.classList.remove("hidden");
      return;
    }

    errorText.classList.add("hidden");

    const saved = await saveScore(
  name,
  window.finalGameScore,
  totalTime   // or actual time used (see note below)
);
if (!saved) {
  alert("Error saving score. Please try again.");
  return;
}

// ✅ SUCCESS FLOW
showWhatsAppShare(name, window.finalGameScore);


  /* =============================
     CANCEL
  ============================== */
  const cancelBtn = document.getElementById("cancelSubmitBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      scoreSubmitModal.classList.add("hidden");
    };
  }

});

