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
  let gameRunning = false; // ✅ single source of truth

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
    try {
      const res = await fetch("items.json?v=" + Date.now());
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      items = await res.json();
    } catch (error) {
      console.error("Failed to load items:", error);
      // Provide fallback items or show error to user
      items = [
        { name: "Sample Item", image: "fallback.jpg", bin: "yellow" }
      ];
    }
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
     CONFETTI ANIMATION
  ============================== */
  function launchConfetti() {
    const container = document.getElementById("confettiContainer");
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < 80; i++) {
      const piece = document.createElement("div");
      piece.className = "confetti";
      piece.style.left = Math.random() * 100 + "vw";
      piece.style.animationDelay = Math.random() * 2 + "s";
      piece.style.backgroundColor =
        ["#ffd700", "#4caf50", "#2196f3", "#ff5252"][Math.floor(Math.random() * 4)];

      container.appendChild(piece);
    }

    setTimeout(() => (container.innerHTML = ""), 5000);
  }

  /* =============================
     WHATSAPP SHARE
  ============================== */
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
  ============================== */
  const startGameBtn = document.getElementById("startGameBtn");

  if (startGameBtn) {
    startGameBtn.onclick = async () => {
      if (items.length === 0) await loadItems();
      if (items.length === 0) {
        alert("Failed to load game items. Please refresh and try again.");
        return;
      }

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
    progressFill.style.width = "100%";

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
    if (!gameRunning || items.length === 0) return;

    currentItem = items[Math.floor(Math.random() * items.length)];

    // 🚀 CRITICAL FIX FOR GITHUB PAGES
    try {
      itemImage.src = new URL(currentItem.image, window.location.href).href;
      itemImage.alt = currentItem.name;
    } catch (error) {
      console.error("Error loading image:", error);
      itemImage.src = "fallback.jpg";
    }

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
        feedback.textContent = "✅ Correct!";
        feedback.style.color = "#4caf50";
      } else {
        score = Math.max(0, score - 1);
        wrong++;
        feedback.textContent = `❌ Wrong — Correct bin: ${currentItem.bin}`;
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

    feedback.textContent = "⏱️ Time's up!";
    feedback.style.color = "#ffd700";

    document.querySelectorAll(".bin-btn").forEach(btn => {
      btn.disabled = true;
    });

    window.finalGameScore = score;
    
    // Reset form when showing modal
    const nameInput = document.getElementById("playerNameInput");
    const errorText = document.getElementById("nameError");
    const whatsappBtn = document.getElementById("whatsappShareBtn");
    
    if (nameInput) nameInput.value = "";
    if (errorText) errorText.classList.add("hidden");
    if (whatsappBtn) whatsappBtn.classList.add("hidden");
    
    if (scoreSubmitModal) {
      scoreSubmitModal.classList.remove("hidden");
    }
  }

  /* =============================
     SCORE SUBMIT (SAFE)
  ============================== */
  const submitBtn = document.getElementById("submitScoreBtn");

  if (submitBtn) {
    submitBtn.onclick = async () => {
      const nameInput = document.getElementById("playerNameInput");
      const errorText = document.getElementById("nameError");

      // 🚨 HARD GUARD — prevents crash
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

      try {
        const saved = await saveScore(
          name,
          window.finalGameScore,
          totalTime
        );
        
        if (!saved) {
          alert("Error saving score. Please try again.");
          return;
        }

        // 🎉 CONFETTI CELEBRATION
        launchConfetti();

        // ✅ SUCCESS FLOW
        showWhatsAppShare(name, window.finalGameScore);

      } catch (error) {
        console.error("Error submitting score:", error);
        alert("Error saving score. Please check your connection and try again.");
      }
    };
  }

  /* =============================
     CANCEL SUBMIT
  ============================== */
  const cancelBtn = document.getElementById("cancelSubmitBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (scoreSubmitModal) {
        scoreSubmitModal.classList.add("hidden");
      }
      // Optionally restart game or go to home
      startScreen.classList.remove("hidden");
      gameContainer.classList.add("hidden");
    };
  }
});
