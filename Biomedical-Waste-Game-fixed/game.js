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
     FIX: template must be injected before any querySelector calls
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
  let gameRunning = false;

  /* =============================
     DOM ELEMENTS
     FIX: all modal elements queried AFTER template injection
  ============================== */
  const startScreen    = document.getElementById("startScreen");
  const gameContainer  = document.getElementById("gameContainer");

  const scoreDisplay   = document.getElementById("score");
  const itemImage      = document.getElementById("itemImage");
  const itemName       = document.getElementById("itemName");
  const feedback       = document.getElementById("feedback");

  const timerValue     = document.getElementById("timerValue");
  const progressFill   = document.getElementById("progressFill");
  const gameStats      = document.getElementById("gameStats");

  // Modals — queried after template injection so they exist in DOM
  const scoreSubmitModal = document.getElementById("scoreSubmitModal");
  const certModal        = document.getElementById("certificateModal");
  const leaderboardModal = document.getElementById("leaderboardModal");

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

    whatsappBtn.classList.remove("hidden");
    whatsappBtn.onclick = () => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
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

      score = 0; correct = 0; wrong = 0; currentItem = null;
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
    timerValue.textContent = formatTime(timeLeft);
    progressFill.style.width = "100%";

    clearInterval(timer);
    timer = setInterval(() => {
      if (!gameRunning) { clearInterval(timer); return; }

      timeLeft--;
      timerValue.textContent = formatTime(timeLeft);
      progressFill.style.width = `${(timeLeft / totalTime) * 100}%`;

      if (timeLeft <= 0) gameOver();
    }, 1000);
  }

  /* =============================
     LOAD ITEM
  ============================== */
  function loadNewItem() {
    if (!gameRunning || items.length === 0) return;

    currentItem = items[Math.floor(Math.random() * items.length)];

    try {
      itemImage.src = new URL(currentItem.image, window.location.href).href;
      itemImage.alt = currentItem.name;
    } catch (error) {
      itemImage.src = "fallback.jpg";
    }

    itemName.textContent = currentItem.name;
    feedback.textContent = "Choose the correct bin";
    feedback.style.color = "";

    // FIX: clear any bin highlights from previous answer
    document.querySelectorAll(".bin-btn").forEach(btn => {
      btn.style.outline = "";
      btn.style.boxShadow = "";
    });
  }

  /* =============================
     BIN HANDLERS
     FIX: highlight correct bin on wrong answer
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
        // Brief green pulse on the correct button
        btn.style.outline = "3px solid #4caf50";
        btn.style.boxShadow = "0 0 12px #4caf50";
      } else {
        score = Math.max(0, score - 1);
        wrong++;
        feedback.textContent = `❌ Wrong — Correct bin: ${currentItem.bin}`;
        feedback.style.color = "#ff5252";

        // FIX: visually highlight the correct bin so players learn
        document.querySelectorAll(".bin-btn").forEach(b => {
          if (b.dataset.bin === currentItem.bin) {
            b.style.outline = "3px solid #4caf50";
            b.style.boxShadow = "0 0 12px #4caf50";
          }
        });
        // Highlight wrong button in red
        btn.style.outline = "3px solid #ff5252";
        btn.style.boxShadow = "0 0 12px #ff5252";
      }

      scoreDisplay.textContent = score;
      updateStats();

      // Small delay so player sees the highlight before next item
      setTimeout(() => loadNewItem(), 600);
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
      btn.style.outline = "";
      btn.style.boxShadow = "";
    });

    window.finalGameScore = score;

    // Show Play Again button
    const playAgainBtn = document.getElementById("playAgainBtn");
    if (playAgainBtn) playAgainBtn.style.display = "block";

    const nameInput  = document.getElementById("playerNameInput");
    const errorText  = document.getElementById("nameError");
    const whatsappBtn = document.getElementById("whatsappShareBtn");

    if (nameInput)    nameInput.value = "";
    if (errorText)    errorText.classList.add("hidden");
    if (whatsappBtn)  whatsappBtn.classList.add("hidden");

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
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";

      try {
        const saved = await saveScore(name, window.finalGameScore, totalTime);

        if (!saved) {
          alert("Error saving score. Please try again.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Score";
          return;
        }

        if (scoreSubmitModal) scoreSubmitModal.classList.add("hidden");

        const thankYouName = document.getElementById("thankYouName");
        const certName     = document.getElementById("certName");
        const certScore    = document.getElementById("certScore");

        if (certModal && thankYouName && certName && certScore) {
          thankYouName.textContent = name;
          certName.textContent     = name;
          certScore.textContent    = `Score: ${window.finalGameScore} | Time: ${formatTime(totalTime)}`;
          certModal.classList.remove("hidden");
        } else {
          alert(`🎉 Thank you, ${name}! Score of ${window.finalGameScore} saved.`);
        }

        setTimeout(() => launchConfetti(), 500);
        setTimeout(() => showWhatsAppShare(name, window.finalGameScore), 1000);

      } catch (error) {
        console.error("Error submitting score:", error);
        alert("❌ Error saving score. Please check your connection and try again.");
      } finally {
        submitBtn.disabled = false;
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
     FIX: was broken because certModal was null at query time
  ============================== */
  const closeCertBtn = document.getElementById("closeCertBtn");
  if (closeCertBtn && certModal) {
    closeCertBtn.onclick = () => {
      certModal.classList.add("hidden");
      returnToStart();
    };
  }

  /* =============================
     FIX: shared return-to-start + play again logic
  ============================== */
  function returnToStart() {
    startScreen.classList.remove("hidden");
    gameContainer.classList.add("hidden");
    const playAgainBtn = document.getElementById("playAgainBtn");
    if (playAgainBtn) playAgainBtn.style.display = "none";
  }

  // Play Again — restarts without going to start screen
  const playAgainBtn = document.getElementById("playAgainBtn");
  if (playAgainBtn) {
    playAgainBtn.onclick = async () => {
      score = 0; correct = 0; wrong = 0; currentItem = null;
      gameRunning = true;

      scoreDisplay.textContent = score;
      feedback.textContent = "Choose the correct bin";
      feedback.style.color = "";
      playAgainBtn.style.display = "none";

      document.querySelectorAll(".bin-btn").forEach(btn => {
        btn.disabled = false;
        btn.style.outline = "";
        btn.style.boxShadow = "";
      });

      updateStats();
      startTimer();
      loadNewItem();
    };
  }

  /* =============================
     LEADERBOARD MODAL — populate with Firebase data
     FIX: was wired up in HTML but never populated
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
      // Dynamically import Firebase to fetch leaderboard scores
      const { initializeApp, getApps } = await import(
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js"
      );
      const { getFirestore, collection, query, orderBy, limit, getDocs } = await import(
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
      );

      const firebaseConfig = {
        apiKey: "AIzaSyBoVl_bc3V-DzSzza-1Ymuh13FROKaLxAM",
        authDomain: "biomedicalwastegame.firebaseapp.com",
        projectId: "biomedicalwastegame",
        storageBucket: "biomedicalwastegame.firebasestorage.app",
        messagingSenderId: "502355834534",
        appId: "1:502355834534:web:e7cd3369f7a4b174f3e667"
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
      snapshot.forEach((doc, i) => {
        const { name, score } = doc.data();
        const rank = medals[i] || `#${i + 1}`;
        const li = document.createElement("li");
        li.style.cssText = "display:flex;justify-content:space-between;padding:10px 12px;background:#1f242c;border-radius:8px;margin-bottom:8px;list-style:none;";
        li.innerHTML = `<span>${rank} ${name}</span><span style="color:#2ea043;font-weight:bold">${score} pts</span>`;
        list.appendChild(li);
      });
    } catch (err) {
      console.error("Leaderboard modal error:", err);
      list.innerHTML = "<li style='color:#ff5252;text-align:center;padding:12px'>Could not load scores.</li>";
    }
  }

  /* =============================
     CERTIFICATE PDF DOWNLOAD
  ============================== */
  const downloadCertBtn = document.getElementById("downloadCertBtn");

  if (downloadCertBtn) {
    downloadCertBtn.addEventListener("click", () => {
      // FIX 1: was grabbing .certificate (the outer modal-content div with overflow:hidden
      // and dark background) — now grabs .certificate-content (the inner printable area only)
      const cert = document.querySelector("#certificateModal .certificate-content");
      if (!cert) { console.error("Certificate content element not found"); return; }

      // Hide action buttons so they don't appear in the PDF
      const actions = cert.querySelector(".cert-actions");
      if (actions) actions.style.display = "none";

      if (typeof html2pdf === "undefined") {
        alert("PDF library not loaded. Please refresh the page.");
        if (actions) actions.style.display = "";
        return;
      }

      // FIX 2: set an explicit white background and padding so the PDF
      // doesn't inherit the dark modal styling or get clipped
      const originalStyle = cert.getAttribute("style") || "";
      cert.style.cssText += ";background:#ffffff;color:#111111;padding:40px;max-width:none;";

      // Also temporarily make all text dark for print readability
      cert.querySelectorAll(".cert-title, .cert-name, .cert-training, .cert-congrats").forEach(el => {
        el.dataset.origColor = el.style.color;
        if (el.classList.contains("cert-name"))      el.style.color = "#1a7a34";
        else if (el.classList.contains("cert-congrats")) el.style.color = "#b8860b";
        else                                          el.style.color = "#111111";
      });
      cert.querySelectorAll(".cert-text, .cert-sub, .cert-performance").forEach(el => {
        el.dataset.origColor = el.style.color;
        el.style.color = "#444444";
      });
      cert.querySelectorAll(".cert-training").forEach(el => {
        el.style.background = "#f0f9f4";
        el.style.color = "#111111";
      });
      cert.querySelectorAll(".cert-performance").forEach(el => {
        el.style.background = "#f0f9f4";
        el.style.color = "#1a7a34";
        el.style.borderColor = "#2ea043";
      });

      html2pdf()
        .set({
          margin:   [15, 20, 15, 20],
          filename: "Biomedical_Waste_Training_Certificate.pdf",
          image:    { type: "jpeg", quality: 0.98 },
          // FIX 3: useCORS + logging=false prevents blank output on some browsers
          html2canvas: { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" },
          jsPDF:    { unit: "mm", format: "a4", orientation: "landscape" }
        })
        .from(cert)
        .save()
        .then(() => {
          restoreCert(cert, originalStyle, actions);
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
      el.style.background = "";
      el.style.borderColor = "";
    });
  }

  /* =============================
     INITIAL LOAD
  ============================== */
  loadItems();
});
