// ===============================
// MODULE IMPORT
// ===============================
import { saveScore } from "./firebase.js";

// ===============================
// DOM READY
// ===============================
document.addEventListener("DOMContentLoaded", () => {

  /* =============================
     INJECT GLOBAL MODALS FIRST
  ============================== */
  const modalTemplate = document.getElementById("global-modals");
  if (modalTemplate) {
    document.body.appendChild(modalTemplate.content.cloneNode(true));
  }

  /* =============================
     GLOBAL STATE
  ============================== */
  let items        = [];
  let shuffleQueue = [];   // FEATURE: shuffle queue — no close repeats
  let currentItem  = null;

  let score   = 0;
  let correct = 0;
  let wrong   = 0;

  let timer      = null;
  let totalTime  = 60;
  let timeUsed   = 0;
  let gameRunning = false;

  // FEATURE: item-level attempt log for trainer CSV
  let attemptLog = [];

  /* =============================
     DOM ELEMENTS
  ============================== */
  const startScreen   = document.getElementById("startScreen");
  const gameContainer = document.getElementById("gameContainer");

  const scoreDisplay  = document.getElementById("score");
  const itemImage     = document.getElementById("itemImage");
  const itemName      = document.getElementById("itemName");
  const feedback      = document.getElementById("feedback");

  const timerValue    = document.getElementById("timerValue");
  const progressFill  = document.getElementById("progressFill");
  const gameStats     = document.getElementById("gameStats");

  const scoreSubmitModal = document.getElementById("scoreSubmitModal");
  const certModal        = document.getElementById("certificateModal");
  const leaderboardModal = document.getElementById("leaderboardModal");

  /* =============================
     LOAD ITEMS
  ============================== */
  async function loadItems() {
    try {
      const res = await fetch("items.json?v=" + Date.now());
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      items = await res.json();
    } catch (error) {
      console.error("Failed to load items:", error);
      items = [{ name: "Sample Item", image: "fallback.jpg", bin: "Yellow" }];
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
     CONFETTI
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
     SHUFFLE QUEUE
     Cycles through all items in random order.
     Only reshuffles once the full set is exhausted —
     guarantees no close repeats and full coverage.
  ============================== */
  function refillQueue() {
    shuffleQueue = [...items].sort(() => Math.random() - 0.5);
  }

  function nextItem() {
    if (shuffleQueue.length === 0) refillQueue();
    return shuffleQueue.pop();
  }

  /* =============================
     WIN CARD + SHARE SYSTEM (FIXED)
  ============================== */
  const GAME_URL = "https://creator619-python.github.io/Biomedical-Waste-Game/";
  const LS_KEY   = "bmwg_last_score";

  function getPreviousScore() {
    try {
      const val = localStorage.getItem(LS_KEY);
      return val !== null ? parseInt(val) : null;
    } catch { return null; }
  }

  function saveLastScore(s) {
    try { localStorage.setItem(LS_KEY, s); } catch {}
  }

  // Helper: rounded rectangle path
  function roundRectPath(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  // ================= FIXED DRAW FUNCTION =================
  function drawWinCard(canvas, name, cardScore, prevScore, logicalW, logicalH) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Set physical buffer size & CSS size
    canvas.width = logicalW * dpr;
    canvas.height = logicalH * dpr;
    canvas.style.width = `${logicalW}px`;
    canvas.style.height = `${logicalH}px`;

    // Reset any previous transform and apply DPR scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, logicalW, logicalH);
    bg.addColorStop(0, "#0d1117");
    bg.addColorStop(1, "#161b22");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, logicalW, logicalH);

    // Top green bar
    ctx.fillStyle = "#2ea043";
    ctx.fillRect(0, 0, logicalW, 5);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(46,160,67,0.07)";
    ctx.lineWidth = 1;
    for (let x = 0; x < logicalW; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, logicalH); ctx.stroke();
    }
    for (let y = 0; y < logicalH; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(logicalW, y); ctx.stroke();
    }

    // Header
    ctx.fillStyle = "#9aa0a6";
    ctx.font = "500 14px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BIOMEDICAL WASTE SEGREGATION GAME", logicalW / 2, 44);

    ctx.fillStyle = "#ffffff";
    ctx.font = "700 28px system-ui, sans-serif";
    ctx.fillText(name, logicalW / 2, 90);

    // Score section (dynamic Y based on logical height)
    const scoreSectionY = 130;
    const boxWidth = 150;
    const boxHeight = 90;

    if (prevScore !== null) {
      // Draw previous vs current scores
      ctx.fillStyle = "#9aa0a6";
      ctx.font = "500 13px system-ui, sans-serif";
      ctx.fillText("LAST TIME", logicalW / 2 - 110, scoreSectionY - 10);
      ctx.fillText("THIS TIME", logicalW / 2 + 110, scoreSectionY - 10);

      // Previous score box
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.strokeStyle = "#30363d";
      ctx.lineWidth = 1;
      roundRectPath(ctx, logicalW / 2 - 190, scoreSectionY, boxWidth, boxHeight, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#9aa0a6";
      ctx.font = "700 42px system-ui, sans-serif";
      ctx.fillText(prevScore, logicalW / 2 - 115, scoreSectionY + 60);

      // Arrow
      const improved = cardScore > prevScore;
      ctx.fillStyle = improved ? "#2ea043" : "#e05d44";
      ctx.font = "700 28px system-ui, sans-serif";
      ctx.fillText("→", logicalW / 2, scoreSectionY + 52);

      // Current score box
      ctx.fillStyle = improved ? "rgba(46,160,67,0.15)" : "rgba(224,93,68,0.12)";
      ctx.strokeStyle = improved ? "#2ea043" : "#e05d44";
      ctx.lineWidth = 2;
      roundRectPath(ctx, logicalW / 2 + 40, scoreSectionY, boxWidth, boxHeight, 10);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = improved ? "#2ea043" : "#e05d44";
      ctx.font = "700 48px system-ui, sans-serif";
      ctx.fillText(cardScore, logicalW / 2 + 115, scoreSectionY + 62);

      const delta = cardScore - prevScore;
      const deltaText = `${improved ? "▲" : "▼"} ${Math.abs(delta)} pts`;
      ctx.fillStyle = improved ? "#2ea043" : "#e05d44";
      ctx.font = "700 18px system-ui, sans-serif";
      ctx.fillText(deltaText, logicalW / 2 + 115, scoreSectionY + 106);

      const msg = improved
        ? "🏆 New personal best! Keep going!"
        : delta === 0
          ? "Consistent! Can you push higher?"
          : "Every attempt builds knowledge 💪";
      ctx.fillStyle = "#9aa0a6";
      ctx.font = "500 14px system-ui, sans-serif";
      ctx.fillText(msg, logicalW / 2, scoreSectionY + 160);
    } else {
      // First time score display
      ctx.fillStyle = "rgba(46,160,67,0.12)";
      ctx.strokeStyle = "#2ea043";
      ctx.lineWidth = 2;
      roundRectPath(ctx, logicalW / 2 - 90, scoreSectionY, 180, 110, 14);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#2ea043";
      ctx.font = "700 64px system-ui, sans-serif";
      ctx.fillText(cardScore, logicalW / 2, scoreSectionY + 80);
      ctx.fillStyle = "#9aa0a6";
      ctx.font = "500 14px system-ui, sans-serif";
      ctx.fillText("🎉 First attempt complete! Can you beat this?", logicalW / 2, scoreSectionY + 150);
      ctx.fillStyle = "#9aa0a6";
      ctx.font = "500 13px system-ui, sans-serif";
      ctx.fillText("Score out of 100", logicalW / 2, scoreSectionY + 178);
    }

    // URL line at bottom
    ctx.fillStyle = "rgba(46,160,67,0.6)";
    ctx.font = "500 13px system-ui, sans-serif";
    ctx.fillText("Can you beat this? → " + GAME_URL, logicalW / 2, logicalH - 18);

    // Bottom green bar
    ctx.fillStyle = "#2ea043";
    ctx.fillRect(0, logicalH - 4, logicalW, 4);

    // Debug border – remove after confirming everything fits
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, logicalW, logicalH);
  }

  // ================= FIXED SHOW FUNCTION =================
  function showWinCard(name, cardScore, onContinue) {
    const prevScore = getPreviousScore();
    saveLastScore(cardScore);

    const modal = document.getElementById("winCardModal");
    const canvas = document.getElementById("winCardCanvas");
    if (!modal || !canvas) return;

    // Show the modal FIRST so clientWidth is measurable (was 0 while hidden → crop bug)
    modal.classList.remove("hidden");

    // Determine logical canvas size that fits the modal without cropping
    const modalContent = document.querySelector(".win-card-modal");
    const available = modalContent ? modalContent.clientWidth - 40 : 500;
    const maxWidth = Math.min(600, available > 100 ? available : 500);
    const logicalW = maxWidth;
    // Minimum height 420px ensures all content (score boxes, messages, URL) fits
    const logicalH = Math.max(420, Math.round(logicalW * 0.7));

    // Draw the card with explicit dimensions
    drawWinCard(canvas, name, cardScore, prevScore, logicalW, logicalH);

    // Improvement badge
    const badge = document.getElementById("winCardImprovementBadge");
    const deltaEl = document.getElementById("winCardDelta");
    if (prevScore !== null) {
      const diff = cardScore - prevScore;
      const improved = diff > 0;
      badge.classList.remove("hidden");
      badge.style.background = improved
        ? "linear-gradient(135deg,#2ea043,#1a7a34)"
        : diff === 0 ? "linear-gradient(135deg,#555,#333)" : "linear-gradient(135deg,#e05d44,#b03a2a)";
      deltaEl.textContent = improved
        ? `▲ +${diff} pts from last time!`
        : diff === 0 ? "Same as last time" : `▼ ${Math.abs(diff)} pts from last time`;
    } else {
      badge.classList.add("hidden");
    }

    // WhatsApp share button
    document.getElementById("winCardWhatsApp").onclick = () => {
      const diff = prevScore !== null ? cardScore - prevScore : null;
      const text = diff !== null && diff > 0
        ? `🏆 I improved my Biomedical Waste score from ${prevScore} → ${cardScore} (+${diff} pts)!\n\nThink you can beat me? Try it 👇\n${GAME_URL}`
        : diff !== null && diff === 0
          ? `🎯 I scored ${cardScore} again in the Biomedical Waste Segregation Game!\n\nCan you beat ${cardScore}? Try it 👇\n${GAME_URL}`
          : `🎉 I scored ${cardScore} in the Biomedical Waste Segregation Game!\n\nCan you beat this? Try it 👇\n${GAME_URL}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    // Download image button
    document.getElementById("winCardDownload").onclick = () => {
      const dataUrl = canvas.toDataURL("image/png");
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        const win = window.open();
        win.document.write(`<img src="${dataUrl}" style="max-width:100%;display:block;margin:auto"/>`);
        win.document.write(`<p style="font-family:sans-serif;color:#666;text-align:center;padding:12px">Long press the image → Save to Photos</p>`);
      } else {
        const link = document.createElement("a");
        link.download = `BMW_Score_${name}_${cardScore}.png`;
        link.href = dataUrl;
        link.click();
      }
    };

    // Continue button
    document.getElementById("winCardContinue").onclick = () => {
      modal.classList.add("hidden");
      if (typeof onContinue === "function") onContinue();
    };
  }

  /* =============================
     TRAINER CSV REPORT
  ============================== */
  function generateTrainerCSV(name, cardScore, difficulty, dateTaken) {
    const rows = [];

    // Header block
    rows.push(["BIOMEDICAL WASTE SEGREGATION TRAINING — TRAINER REPORT"]);
    rows.push([]);
    rows.push(["Trainee Name", name]);
    rows.push(["Final Score",  cardScore]);
    rows.push(["Difficulty",   difficulty]);
    rows.push(["Date",         dateTaken]);
    rows.push(["Total Attempts", attemptLog.length]);
    rows.push(["Correct",      attemptLog.filter(a => a.result === "Correct").length]);
    rows.push(["Wrong",        attemptLog.filter(a => a.result === "Wrong").length]);
    rows.push([]);

    // Item detail header
    rows.push(["#", "Item", "Correct Bin", "Selected Bin", "Result"]);

    attemptLog.forEach((a, i) => {
      rows.push([i + 1, a.item, a.correctBin, a.chosenBin, a.result]);
    });

    rows.push([]);

    // Wrong answer summary
    const wrongOnes = attemptLog.filter(a => a.result === "Wrong");
    if (wrongOnes.length > 0) {
      rows.push(["ITEMS NEEDING REINFORCEMENT"]);
      rows.push(["Item", "Correct Bin", "Was Selected"]);
      wrongOnes.forEach(a => {
        rows.push([a.item, a.correctBin, a.chosenBin]);
      });
    }

    // Convert to CSV string
    return rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    ).join("\n");
  }

  function downloadTrainerCSV(name, cardScore, difficulty, dateTaken) {
    const csv   = generateTrainerCSV(name, cardScore, difficulty, dateTaken);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      // iOS: open CSV as plain text in new tab — user can copy or share
      const win = window.open();
      win.document.write(`<pre style="font-family:monospace;font-size:13px;padding:16px;white-space:pre-wrap">${csv}</pre>`);
      win.document.write(`<p style="font-family:sans-serif;color:#666;padding:0 16px">Tap Share → Save to Files to download as CSV</p>`);
    } else {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href     = url;
      link.download = `BMW_TrainerReport_${name}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  /* =============================
     DIFFICULTY
  ============================== */
  function currentDifficulty() {
    const sel = document.querySelector(".difficulty-card.selected");
    return sel ? sel.dataset.level : "medium";
  }

  document.querySelectorAll(".difficulty-card").forEach(card => {
    card.onclick = () => {
      document.querySelectorAll(".difficulty-card")
        .forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");

      const level = card.dataset.level;
      if (level === "easy")   totalTime = 90;
      if (level === "medium") totalTime = 60;
      if (level === "hard")   totalTime = 30;

      timerValue.textContent = formatTime(totalTime);
    };
  });

  /* =============================
     START GAME
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

      score = 0; correct = 0; wrong = 0;
      currentItem = null;
      attemptLog  = [];   // reset attempt log for new game
      refillQueue();      // fresh shuffle queue
      gameRunning = true;

      scoreDisplay.textContent = score;
      feedback.textContent = "Choose the correct bin";
      feedback.style.color = "";

      document.querySelectorAll(".bin-btn").forEach(btn => {
        btn.disabled = false;
        btn.style.outline = "";
        btn.style.transform = "";
      });

      updateStats();
      startTimer();
      loadNewItem();
    };
  }

  /* =============================
     TIMER
  ============================== */
  function startTimer() {
    let timeLeft = totalTime;
    timeUsed = 0;
    timerValue.textContent = formatTime(timeLeft);
    progressFill.style.width = "100%";

    clearInterval(timer);
    timer = setInterval(() => {
      if (!gameRunning) { clearInterval(timer); return; }

      timeLeft--;
      timeUsed++;
      timerValue.textContent = formatTime(timeLeft);
      progressFill.style.width = `${(timeLeft / totalTime) * 100}%`;

      if (timeLeft <= 0) gameOver();
    }, 1000);
  }

  /* =============================
     LOAD ITEM — uses shuffle queue
  ============================== */
  function loadNewItem() {
    if (!gameRunning || items.length === 0) return;

    currentItem = nextItem();  // FEATURE: shuffle queue

    try {
      itemImage.src = new URL(currentItem.image, window.location.href).href;
      itemImage.alt = currentItem.name;
    } catch {
      itemImage.src = "fallback.jpg";
    }

    itemName.textContent = currentItem.name;
    feedback.textContent = "Choose the correct bin";
    feedback.style.color = "";

    document.querySelectorAll(".bin-btn").forEach(btn => {
      btn.style.outline   = "";
      btn.style.boxShadow = "";
    });
  }

  /* =============================
     BIN HANDLERS
  ============================== */
  document.querySelectorAll(".bin-btn").forEach(btn => {
    btn.onclick = () => {
      if (!gameRunning || !currentItem) return;

      const chosen    = btn.dataset.bin;
      const isCorrect = chosen === currentItem.bin;

      if (isCorrect) {
        score++;
        correct++;
        feedback.textContent = "✅ Correct!";
        feedback.style.color = "#4caf50";
        btn.style.outline   = "3px solid #4caf50";
        btn.style.boxShadow = "0 0 12px #4caf50";
      } else {
        score = Math.max(0, score - 1);
        wrong++;
        feedback.textContent = `❌ Wrong — Correct bin: ${currentItem.bin}`;
        feedback.style.color = "#ff5252";

        document.querySelectorAll(".bin-btn").forEach(b => {
          if (b.dataset.bin === currentItem.bin) {
            b.style.outline   = "3px solid #4caf50";
            b.style.boxShadow = "0 0 12px #4caf50";
          }
        });
        btn.style.outline   = "3px solid #ff5252";
        btn.style.boxShadow = "0 0 12px #ff5252";
      }

      // FEATURE: log every attempt for trainer report
      attemptLog.push({
        item:       currentItem.name,
        correctBin: currentItem.bin,
        chosenBin:  chosen,
        result:     isCorrect ? "Correct" : "Wrong"
      });

      scoreDisplay.textContent = score;
      updateStats();
      setTimeout(() => loadNewItem(), 600);
    };
  });

  /* =============================
     STATS
  ============================== */
  function updateStats() {
    const total    = correct + wrong;
    const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);
    gameStats.textContent =
      `Correct: ${correct} | Wrong: ${wrong} | Accuracy: ${accuracy}%`;
  }

  /* =============================
     GAME OVER
  ============================== */
  // ===== Private per-device history for Analytics =====
  function saveGameToHistory(finalScore, correctCount, wrongCount, secondsUsed) {
    try {
      const HISTORY_KEY = "bmwg_score_history";
      let history = [];
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) { try { history = JSON.parse(raw) || []; } catch { history = []; } }
      if (!Array.isArray(history)) history = [];

      history.push({
        score:    finalScore,
        correct:  correctCount,
        wrong:    wrongCount,
        timeUsed: secondsUsed,
        date:     new Date().toISOString()
      });

      // Keep the last 50 sessions only
      if (history.length > 50) history = history.slice(history.length - 50);

      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("Could not save game history:", e);
    }
  }

  function gameOver() {
    if (!gameRunning) return;

    gameRunning = false;
    clearInterval(timer);

    feedback.textContent = "⏱️ Time's up!";
    feedback.style.color = "#ffd700";

    document.querySelectorAll(".bin-btn").forEach(btn => {
      btn.disabled        = true;
      btn.style.outline   = "";
      btn.style.boxShadow = "";
    });

    window.finalGameScore = score;

    // Save private per-device history for the Analytics page
    saveGameToHistory(score, correct, wrong, timeUsed);

    const playAgainBtn = document.getElementById("playAgainBtn");
    if (playAgainBtn) playAgainBtn.style.display = "block";

    const nameInput = document.getElementById("playerNameInput");
    const errorText = document.getElementById("nameError");

    if (nameInput) nameInput.value = "";
    if (errorText) errorText.classList.add("hidden");

    if (scoreSubmitModal) scoreSubmitModal.classList.remove("hidden");
  }

  /* =============================
     SCORE SUBMIT
  ============================== */
  const submitBtn = document.getElementById("submitScoreBtn");

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
      submitBtn.disabled    = true;
      submitBtn.textContent = "Saving...";

      try { localStorage.setItem("playerName", name); } catch {}

      const difficulty = currentDifficulty();
      const now        = new Date();
      const dateTaken  = now.toLocaleDateString("en-IN", {
        day: "2-digit", month: "long", year: "numeric"
      });

      try {
        const saved = await saveScore(name, window.finalGameScore, timeUsed, difficulty);

        if (!saved) {
          alert("Error saving score. Please try again.");
          submitBtn.disabled    = false;
          submitBtn.textContent = "Submit Score";
          return;
        }

        if (scoreSubmitModal) scoreSubmitModal.classList.add("hidden");

        // Pre-populate certificate fields
        const thankYouName = document.getElementById("thankYouName");
        const certName     = document.getElementById("certName");
        const certScore    = document.getElementById("certScore");
        const certDateEl   = document.getElementById("certDate");

        if (thankYouName) thankYouName.textContent = name;
        if (certName)     certName.textContent     = name;
        if (certScore)    certScore.textContent    = `Score: ${window.finalGameScore} | Time: ${formatTime(timeUsed)}`;
        if (certDateEl)   certDateEl.textContent   = dateTaken;

        // Wire trainer CSV download button
        const trainerBtn = document.getElementById("downloadTrainerReportBtn");
        if (trainerBtn) {
          trainerBtn.onclick = () =>
            downloadTrainerCSV(name, window.finalGameScore, difficulty, dateTaken);
        }

        // Show Win Card first, then certificate
        setTimeout(() => {
          showWinCard(name, window.finalGameScore, () => {
            if (certModal) {
              certModal.classList.remove("hidden");
              setTimeout(() => launchConfetti(), 300);
            }
          });
        }, 600);

      } catch (error) {
        console.error("Error submitting score:", error);
        alert("❌ Error saving score. Please check your connection and try again.");
      } finally {
        submitBtn.disabled    = false;
        submitBtn.textContent = "Submit Score";
      }
    };
  }

  /* =============================
     CANCEL SUBMIT
  ============================== */
  const cancelBtn = document.getElementById("cancelSubmitBtn");
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      if (scoreSubmitModal) scoreSubmitModal.classList.add("hidden");
      returnToStart();
    };
  }

  /* =============================
     CERTIFICATE CLOSE
  ============================== */
  const closeCertBtn = document.getElementById("closeCertBtn");
  if (closeCertBtn && certModal) {
    closeCertBtn.onclick = () => {
      certModal.classList.add("hidden");
      returnToStart();
    };
  }

  /* =============================
     CERTIFICATE PDF DOWNLOAD — named after user
  ============================== */
  const downloadCertBtn = document.getElementById("downloadCertBtn");

  if (downloadCertBtn) {
    downloadCertBtn.addEventListener("click", () => {
      const cert = document.querySelector("#certificateModal .certificate-content");
      if (!cert) { console.error("Certificate content element not found"); return; }

      const actions = cert.querySelector(".cert-actions");
      if (actions) actions.style.display = "none";

      if (typeof html2pdf === "undefined") {
        alert("PDF library not loaded. Please refresh the page.");
        if (actions) actions.style.display = "";
        return;
      }

      // FEATURE: filename uses trainee name
      const nameEl    = document.getElementById("certName");
      const traineeName = nameEl ? nameEl.textContent.trim().replace(/\s+/g, "_") : "Trainee";
      const filename  = `BMW_Certificate_${traineeName}.pdf`;

      const originalStyle = cert.getAttribute("style") || "";
      cert.style.cssText += ";background:#ffffff;color:#111111;padding:40px;max-width:none;";

      cert.querySelectorAll(".cert-title, .cert-name, .cert-training, .cert-congrats").forEach(el => {
        el.dataset.origColor = el.style.color;
        if (el.classList.contains("cert-name"))          el.style.color = "#1a7a34";
        else if (el.classList.contains("cert-congrats")) el.style.color = "#b8860b";
        else                                             el.style.color = "#111111";
      });
      cert.querySelectorAll(".cert-text, .cert-sub, .cert-performance").forEach(el => {
        el.dataset.origColor = el.style.color;
        el.style.color = "#444444";
      });
      cert.querySelectorAll(".cert-training").forEach(el => {
        el.style.background = "#f0f9f4";
        el.style.color      = "#111111";
      });
      cert.querySelectorAll(".cert-performance").forEach(el => {
        el.style.background  = "#f0f9f4";
        el.style.color       = "#1a7a34";
        el.style.borderColor = "#2ea043";
        el.style.display     = "block";
        el.style.minHeight   = "44px";
      });
      cert.querySelectorAll(".cert-date-row").forEach(el => {
        el.style.color = "#444444";
      });

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      html2pdf()
        .set({
          margin:      [15, 20, 15, 20],
          filename,
          image:       { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" },
          jsPDF:       { unit: "mm", format: "a4", orientation: "landscape" }
        })
        .from(cert)
        .outputPdf("blob")
        .then(blob => {
          restoreCert(cert, originalStyle, actions);
          const url = URL.createObjectURL(blob);
          if (isIOS) {
            // iOS Safari: open PDF in new tab — user taps Share → Save to Files
            window.open(url, "_blank");
          } else {
            const link    = document.createElement("a");
            link.href     = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
          }
        })
        .catch(err => {
          console.error("PDF error:", err);
          alert("Error generating PDF. Please try again.");
          restoreCert(cert, originalStyle, actions);
        });
    });
  }

  function restoreCert(cert, originalStyle, actions) {
    cert.setAttribute("style", originalStyle);
    if (actions) actions.style.display = "";
    cert.querySelectorAll("[data-orig-color]").forEach(el => {
      el.style.color = el.dataset.origColor;
      delete el.dataset.origColor;
    });
    cert.querySelectorAll(".cert-training").forEach(el => {
      el.style.background = "";
    });
    cert.querySelectorAll(".cert-performance").forEach(el => {
      el.style.background  = "";
      el.style.borderColor = "";
      el.style.display     = "";
      el.style.minHeight   = "";
    });
    cert.querySelectorAll(".cert-date-row").forEach(el => {
      el.style.color = "";
    });
  }

  /* =============================
     RETURN TO START
  ============================== */
  function returnToStart() {
    startScreen.classList.remove("hidden");
    gameContainer.classList.add("hidden");
    const playAgainBtn = document.getElementById("playAgainBtn");
    if (playAgainBtn) playAgainBtn.style.display = "none";
  }

  const playAgainBtn = document.getElementById("playAgainBtn");
  if (playAgainBtn) {
    playAgainBtn.onclick = async () => {
      score = 0; correct = 0; wrong = 0;
      currentItem = null;
      attemptLog  = [];
      refillQueue();
      gameRunning = true;

      scoreDisplay.textContent = score;
      feedback.textContent     = "Choose the correct bin";
      feedback.style.color     = "";
      playAgainBtn.style.display = "none";

      document.querySelectorAll(".bin-btn").forEach(btn => {
        btn.disabled        = false;
        btn.style.outline   = "";
        btn.style.boxShadow = "";
      });

      updateStats();
      startTimer();
      loadNewItem();
    };
  }

  /* =============================
     LEADERBOARD
  ============================== */
  const openLeaderboardBtn  = document.getElementById("openLeaderboardBtn");
  const closeLeaderboardBtn = document.getElementById("closeLeaderboardBtn");

  if (openLeaderboardBtn && leaderboardModal) {
    openLeaderboardBtn.onclick = () => {
      leaderboardModal.classList.remove("hidden");
      populateLeaderboardModal();
    };
  }

  if (closeLeaderboardBtn && leaderboardModal) {
    closeLeaderboardBtn.onclick = () => leaderboardModal.classList.add("hidden");
  }

  async function populateLeaderboardModal() {
    const list = document.getElementById("leaderboardList");
    if (!list) return;

    list.innerHTML = "<li style='color:#9aa0a6;text-align:center;padding:12px'>Loading...</li>";

    try {
      const { initializeApp, getApps } = await import(
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"
      );
      const { getFirestore, collection, query, orderBy, limit, getDocs } = await import(
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
      );

      const firebaseConfig = {
        apiKey:            "AIzaSyBoVl_bc3V-DzSzza-1Ymuh13FROKaLxAM",
        authDomain:        "biomedicalwastegame.firebaseapp.com",
        projectId:         "biomedicalwastegame",
        storageBucket:     "biomedicalwastegame.firebasestorage.app",
        messagingSenderId: "502355834534",
        appId:             "1:502355834534:web:e7cd3369f7a4b174f3e667"
      };

      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
      const db  = getFirestore(app);

      const q        = query(collection(db, "leaderboard"), orderBy("score", "desc"), limit(10));
      const snapshot = await getDocs(q);

      list.innerHTML = "";

      if (snapshot.empty) {
        list.innerHTML = "<li style='color:#9aa0a6;text-align:center;padding:12px'>No scores yet. Be the first! 🎯</li>";
        return;
      }

      const medals = ["🥇", "🥈", "🥉"];
      let i = 0;
      snapshot.forEach(doc => {
        const { name, score: s } = doc.data();
        const rank = medals[i] || `#${i + 1}`;
        const li   = document.createElement("li");
        li.style.cssText = "display:flex;justify-content:space-between;padding:10px 12px;background:#1f242c;border-radius:8px;margin-bottom:8px;list-style:none;";
        li.innerHTML = `<span>${rank} ${name}</span><span style="color:#2ea043;font-weight:bold">${s} pts</span>`;
        list.appendChild(li);
        i++;
      });
    } catch (err) {
      console.error("Leaderboard error:", err);
      list.innerHTML = "<li style='color:#ff5252;text-align:center;padding:12px'>Could not load scores.</li>";
    }
  }

  /* =============================
     INITIAL LOAD
  ============================== */
  loadItems();
});
