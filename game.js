import { saveScore, saveGameAttempt } from "./firebase.js";

/* ==============================
   GAME ENGINE
================================ */

window.startGame = function (difficulty) {

  /* ---------- TIME ---------- */
  const timeMap = { easy: 90, medium: 60, hard: 30 };
  let remainingTime = timeMap[difficulty] || 60;

  /* ---------- GAME STATE ---------- */
  let score = 0;
  let correct = 0;
  let wrong = 0;
  let gameRunning = true;

  /* ---------- DOM ---------- */
  const timerEl = document.getElementById("timerValue");
  const scoreEl = document.getElementById("score");
  const feedbackEl = document.getElementById("feedback");
  const statsEl = document.getElementById("gameStats");
  const itemNameEl = document.getElementById("itemName");

  /* ---------- ITEM DATA (THIS WAS MISSING) ---------- */
  const items = [
    { name: "Used Syringe", bin: "White" },
    { name: "Blood Soaked Gauze", bin: "Yellow" },
    { name: "IV Tubing", bin: "Red" },
    { name: "Broken Ampoule", bin: "Blue" },
    { name: "Food Wrapper", bin: "Green" }
  ];

  let currentIndex = 0;

  function loadItem() {
    const item = items[currentIndex];
    itemNameEl.textContent = item.name;
  }

  loadItem(); // 🔥 CRITICAL LINE

  /* ---------- TIMER ---------- */
  function updateTimer() {
    const m = String(Math.floor(remainingTime / 60)).padStart(2, "0");
    const s = String(remainingTime % 60).padStart(2, "0");
    timerEl.textContent = `${m}:${s}`;
  }

  updateTimer();

  const interval = setInterval(() => {
    remainingTime--;
    updateTimer();

    if (remainingTime <= 0) {
      clearInterval(interval);
      endGame();
    }
  }, 1000);

  /* ---------- BIN HANDLING ---------- */
  document.querySelectorAll(".bin-btn").forEach(btn => {
    btn.onclick = () => {
      if (!gameRunning) return;

      const selected = btn.dataset.bin;
      const correctBin = items[currentIndex].bin;

      if (selected === correctBin) {
        score += 10;
        correct++;
        feedbackEl.textContent = "✅ Correct!";
      } else {
        wrong++;
        feedbackEl.textContent = `❌ Wrong! Correct bin: ${correctBin}`;
      }

      currentIndex++;
      if (currentIndex >= items.length) currentIndex = 0;

      loadItem(); // 🔥 UPDATE ITEM NAME

      scoreEl.textContent = score;
      statsEl.textContent =
        `Correct: ${correct} | Wrong: ${wrong} | Accuracy: ${
          Math.round((correct / (correct + wrong)) * 100) || 0
        }%`;
    };
  });

  /* ---------- GAME OVER ---------- */
  function endGame() {
    gameRunning = false;
    window.finalGameScore = score;
    window.totalTime = timeMap[difficulty];
    document.getElementById("scoreSubmitModal")?.classList.remove("hidden");
  }
};

/* ==============================
   SCORE SUBMISSION (UNCHANGED)
================================ */

document.addEventListener("DOMContentLoaded", () => {

  const submitBtn = document.getElementById("submitScoreBtn");

  submitBtn.onclick = async () => {

    const nameInput = document.getElementById("playerNameInput");
    const errorText = document.getElementById("nameError");
    const name = nameInput.value.trim();

    if (!/^[A-Za-z ]{3,20}$/.test(name)) {
      errorText.classList.remove("hidden");
      return;
    }

    errorText.classList.add("hidden");
    localStorage.setItem("playerName", name);

    await saveScore(
      name,
      window.finalGameScore,
      window.totalTime || 60
    );

    await saveGameAttempt({
      name,
      score: window.finalGameScore,
      duration: window.totalTime || 60
    });

    alert("Score saved!");
    document.getElementById("scoreSubmitModal")?.classList.add("hidden");
  };
});

