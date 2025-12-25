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
      
      // ✅ Ensure all bin values in items are lowercase for consistency
      items = items.map(item => ({
        ...item,
        bin: item.bin.toLowerCase()
      }));
      
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
     GENERATE PDF AS BLOB (REUSABLE)
  ============================== */
  function generatePDFBlob(element) {
    return new Promise((resolve, reject) => {
      if (typeof html2pdf === 'undefined') {
        reject(new Error('PDF library not loaded'));
        return;
      }
      
      const opt = {
        margin: [10, 10, 10, 10],
        image: { 
          type: 'jpeg', 
          quality: 1.0
        },
        html2canvas: { 
          scale: 3,
          useCORS: true,
          logging: false,
          width: 794,
          height: 1123,
          windowWidth: 794
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        }
      };
      
      // Generate PDF as blob
      html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then(pdf => {
          const blob = pdf.output('blob');
          resolve(blob);
        })
        .catch(reject);
    });
  }

  /* =============================
     WHATSAPP SHARE WITH PDF - ENHANCED
  ============================== */
  function shareCertificateOnWhatsApp(name, score) {
    const whatsappBtn = document.querySelector("#certificateModal #whatsappShareBtn");
    const cert = document.querySelector("#certificateModal .certificate");
    
    if (!whatsappBtn || !cert) {
      console.error("Required elements not found!");
      return;
    }

    // Remove any existing listeners
    whatsappBtn.replaceWith(whatsappBtn.cloneNode(true));
    const freshWhatsappBtn = document.querySelector("#certificateModal #whatsappShareBtn");
    freshWhatsappBtn.classList.remove("hidden");
    
    freshWhatsappBtn.addEventListener("click", async () => {
      try {
        // Show loading state
        freshWhatsappBtn.disabled = true;
        freshWhatsappBtn.textContent = "Generating PDF...";
        
        // Temporarily hide buttons for clean PDF
        const buttonsContainer = cert.querySelector(".certificate-buttons");
        const originalDisplay = buttonsContainer ? buttonsContainer.style.display : "";
        if (buttonsContainer) buttonsContainer.style.display = "none";
        
        // Add current date to certificate for PDF
        const currentDate = new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const dateElement = document.createElement('div');
        dateElement.className = 'certificate-date';
        dateElement.innerHTML = `<p style="text-align: center; margin: 10px 0; font-size: 14px; color: #666;"><strong>Date:</strong> ${currentDate}</p>`;
        
        const footer = cert.querySelector('.certificate-footer');
        let note = null;
        if (footer) {
          note = footer.querySelector('.certificate-note');
          if (note) {
            footer.insertBefore(dateElement, note);
          } else {
            footer.appendChild(dateElement);
          }
        }
        
        // Generate PDF first
        const pdfBlob = await generatePDFBlob(cert);
        
        // Remove date element
        if (dateElement.parentNode) {
          dateElement.parentNode.removeChild(dateElement);
        }
        
        // Restore buttons
        if (buttonsContainer) buttonsContainer.style.display = originalDisplay;
        
        // Create WhatsApp share message
        const message = `🏥 *Biomedical Waste Training Certificate* 🎓

👤 *Name:* ${name}
🏆 *Score:* ${score}/15
⏱ *Time:* ${formatTime(totalTime)}

✅ I just completed the Biomedical Waste Segregation Training!
Test your knowledge too:

🔗 Play the game: https://creator619-python.github.io/Biomedical-Waste-Game/

#BiomedicalWaste #HealthcareTraining #WasteManagement #Certificate`;

        // Create a temporary download link and share
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const fileName = `Biomedical_Waste_Certificate_${name.replace(/\s+/g, '_')}.pdf`;
        
        // Method 1: Share via WhatsApp Web API (if supported)
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfBlob] })) {
          await navigator.share({
            files: [new File([pdfBlob], fileName, { type: 'application/pdf' })],
            title: 'My Biomedical Waste Certificate',
            text: message
          });
        } 
        // Method 2: WhatsApp Web with download link (fallback)
        else {
          // Create a temporary link for download
          const link = document.createElement('a');
          link.href = pdfUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Open WhatsApp with message
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
          
          // Show instructions
          setTimeout(() => {
            alert('📲 PDF downloaded! Now share it on WhatsApp:\n1. Open WhatsApp\n2. Select contact/group\n3. Attach the downloaded PDF\n4. Share your achievement!');
          }, 1000);
        }
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
        
      } catch (error) {
        console.error('WhatsApp share error:', error);
        alert('Error sharing certificate. Please try downloading the PDF and sharing manually.');
      } finally {
        // Reset button
        freshWhatsappBtn.disabled = false;
        freshWhatsappBtn.textContent = "📤 Share on WhatsApp";
      }
    });
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
     BIN HANDLERS - FIXED CASE SENSITIVITY
  ============================== */
  document.querySelectorAll(".bin-btn").forEach(btn => {
    btn.onclick = () => {
      if (!gameRunning || !currentItem) return;

      // ✅ FIX: Normalize to lowercase for consistent comparison
      const chosen = btn.dataset.bin.toLowerCase();
      
      // currentItem.bin is already lowercase from loadItems()
      const correctBin = currentItem.bin;

      if (chosen === correctBin) {
        score++;
        correct++;
        feedback.textContent = "✅ Correct!";
        feedback.style.color = "#4caf50";
      } else {
        score = Math.max(0, score - 1);
        wrong++;
        feedback.textContent = `❌ Wrong — Correct bin: ${currentItem.bin.charAt(0).toUpperCase() + currentItem.bin.slice(1)}`;
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
    
    // ✅ IMPROVEMENT: Use scoped selector for WhatsApp button
    const whatsappBtn = document.querySelector("#certificateModal #whatsappShareBtn");
    
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

      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";

      try {
        const saved = await saveScore(
          name,
          window.finalGameScore,
          totalTime
        );
        
        if (!saved) {
          alert("Error saving score. Please try again.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Submit Score";
          return;
        }

        // ✅ SUCCESS - SHOW COMPLETION FLOW
        
        // 1. Hide score submit modal
        if (scoreSubmitModal) {
          scoreSubmitModal.classList.add("hidden");
        }

        // 2. Show certificate with thank you message
        // ✅ IMPROVEMENT: Use scoped selectors for certificate elements
        const certModal = document.getElementById("certificateModal");
        const thankYouName = document.querySelector("#certificateModal #thankYouName");
        const certName = document.querySelector("#certificateModal #certName");
        const certScore = document.querySelector("#certificateModal #certScore");
        const certTime = document.querySelector("#certificateModal #certTime");

        if (certModal && thankYouName && certName && certScore && certTime) {
          // Set thank you message (user sees this first!)
          thankYouName.textContent = name;
          
          // Set certificate details
          certName.textContent = name.toUpperCase(); // Capitalized for certificate feel
          certScore.textContent = window.finalGameScore;
          certTime.textContent = formatTime(totalTime);
          
          // Generate a simple certificate ID (timestamp-based)
          const certId = Date.now().toString(36).toUpperCase();
          const certIdElement = document.querySelector("#certificateModal #certId");
          if (certIdElement) certIdElement.textContent = certId;
          
          // Show the certificate modal
          certModal.classList.remove("hidden");
          console.log("🎉 Certificate modal shown with thank you message");
        } else {
          console.error("Certificate modal elements not found!");
          // Fallback
          alert(`🎉 Thank you, ${name}! Your score of ${window.finalGameScore} has been saved to the leaderboard.`);
        }

        // 3. Launch confetti celebration
        setTimeout(() => launchConfetti(), 500);

        // 4. Enable WhatsApp sharing (appears in certificate modal)
        setTimeout(() => {
          shareCertificateOnWhatsApp(name, window.finalGameScore);
          console.log("📤 WhatsApp share enabled with PDF attachment");
        }, 1000);

      } catch (error) {
        console.error("Error submitting score:", error);
        alert("❌ Error saving score. Please check your connection and try again.");
      } finally {
        // Reset button state
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
      if (scoreSubmitModal) {
        scoreSubmitModal.classList.add("hidden");
      }
      // Optionally restart game or go to home
      startScreen.classList.remove("hidden");
      gameContainer.classList.add("hidden");
    };
  }

  /* =============================
     CERTIFICATE PDF DOWNLOAD - IMPROVED SCOPING
  ============================== */
  const downloadCertBtn = document.querySelector("#certificateModal #downloadCertBtn");
  
  if (downloadCertBtn) {
    downloadCertBtn.addEventListener("click", () => {
      const cert = document.querySelector("#certificateModal .certificate");
      if (!cert) {
        console.error("Certificate element not found");
        return;
      }
      
      // Store original styles
      const originalWidth = cert.style.width;
      const originalHeight = cert.style.height;
      const originalMargin = cert.style.margin;
      const originalPadding = cert.style.padding;
      
      // Apply print-optimized styles
      cert.style.width = '210mm';
      cert.style.height = '297mm';
      cert.style.margin = '0 auto';
      cert.style.padding = '20mm';
      
      // Hide buttons for PDF
      const buttonsContainer = cert.querySelector(".certificate-buttons");
      if (buttonsContainer) buttonsContainer.style.display = "none";
      
      // Add current date for PDF
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const dateElement = document.createElement('div');
      dateElement.className = 'certificate-date';
      dateElement.innerHTML = `<p style="text-align: center; margin: 10px 0; font-size: 14px; color: #666;"><strong>Date:</strong> ${currentDate}</p>`;
      
      const footer = cert.querySelector('.certificate-footer');
      if (footer) {
        const note = footer.querySelector('.certificate-note');
        if (note) {
          footer.insertBefore(dateElement, note);
        } else {
          footer.appendChild(dateElement);
        }
      }
      
      // Check if html2pdf is available
      if (typeof html2pdf === 'undefined') {
        console.error("html2pdf library not loaded");
        alert("PDF generation library not loaded. Please refresh the page.");
        restoreStyles();
        return;
      }
      
      const playerName = document.querySelector("#certificateModal #thankYouName")?.textContent || "Player";
      const filename = `Biomedical_Waste_Training_Certificate_${playerName.replace(/\s+/g, '_')}.pdf`;
      
      // Generate PDF
      html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: filename,
          image: { 
            type: 'jpeg', 
            quality: 1.0
          },
          html2canvas: { 
            scale: 3,
            useCORS: true,
            logging: false,
            width: 794,
            height: 1123,
            windowWidth: 794
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          }
        })
        .from(cert)
        .save()
        .then(() => {
          console.log("✅ PDF certificate downloaded successfully");
        })
        .catch(err => {
          console.error("PDF generation error:", err);
          alert("Error generating PDF. Please try again.");
        })
        .finally(() => {
          // Restore everything
          restoreStyles();
          
          // Remove the date element
          if (dateElement && dateElement.parentNode) {
            dateElement.parentNode.removeChild(dateElement);
          }
          
          // Show buttons again
          if (buttonsContainer) buttonsContainer.style.display = "flex";
        });
      
      function restoreStyles() {
        cert.style.width = originalWidth;
        cert.style.height = originalHeight;
        cert.style.margin = originalMargin;
        cert.style.padding = originalPadding;
      }
    });
  }

  /* =============================
     CERTIFICATE MODAL CLOSE - IMPROVED SCOPING
  ============================== */
  const closeCertBtn = document.querySelector("#certificateModal #closeCertBtn");
  const certModal = document.getElementById("certificateModal");
  
  if (closeCertBtn && certModal) {
    closeCertBtn.addEventListener("click", () => {
      certModal.classList.add("hidden");
      // Go back to start screen
      startScreen.classList.remove("hidden");
      gameContainer.classList.add("hidden");
    });
  }
});
