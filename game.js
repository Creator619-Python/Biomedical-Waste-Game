import { saveScore, saveGameAttempt } from "./firebase.js";

document.addEventListener("DOMContentLoaded", () => {

  let score = 0;
  let correct = 0;
  let wrong = 0;
  let totalTime = 60;
  let gameRunning = false;

  const submitBtn = document.getElementById("submitScoreBtn");

  function calculateAccuracy() {
    const total = correct + wrong;
    return total === 0 ? 0 : Math.round((correct / total) * 100);
  }

  function gameOver() {
    gameRunning = false;
    window.finalGameScore = score;
    document.getElementById("scoreSubmitModal")?.classList.remove("hidden");
  }

  if (submitBtn) {
    submitBtn.onclick = async () => {
      const nameInput = document.getElementById("playerNameInput");
      const errorText = document.getElementById("nameError");

      if (!nameInput || !errorText) return;

      const name = nameInput.value.trim();

      if (!/^[A-Za-z ]{3,20}$/.test(name)) {
        errorText.classList.remove("hidden");
        return;
      }

      errorText.classList.add("hidden");

      // ✅ CRITICAL FIX
      localStorage.setItem("playerName", name);

      // 🏆 Leaderboard save
      await saveScore(
        name,
        window.finalGameScore,
        totalTime
      );

      // 📊 Analytics save
      await saveGameAttempt({
        name,
        score: window.finalGameScore,
        correct,
        wrong,
        accuracy: calculateAccuracy(),
        duration: totalTime
      });

      alert("Score saved successfully!");
      document.getElementById("scoreSubmitModal")?.classList.add("hidden");
    };
  }
});

