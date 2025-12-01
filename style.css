// =======================================================
// GLOBAL VARIABLES
// =======================================================
let items = [];
let currentItem = null;

let score = 0;
let correctCount = 0;
let wrongCount = 0;

let timeLeft = 60;
let totalTime = 60;
let timerInterval = null;

let selectedDifficulty = "medium";

const GAME_URL = "https://creator619-python.github.io/Biomedical-Waste-Game/";

// Player info storage
let playerInfo = {
    name: "Anonymous Player",
    organization: "Not specified",
    wantsCertificate: false
};

// =======================================================
// HELPER FUNCTION: CALCULATE ACCURACY
// =======================================================
function calculateAccuracy() {
    const totalAttempts = correctCount + wrongCount;
    return totalAttempts === 0 ? 0 : Math.round((correctCount / totalAttempts) * 100);
}

// =======================================================
// LOAD ITEMS
// =======================================================
async function loadItems() {
    const response = await fetch("items.json");
    items = await response.json();
}

// =======================================================
// INITIALISE GAME
// =======================================================
async function initGame() {
    await loadItems();
    
    // Welcome screen flow
    const welcomeContinueBtn = document.getElementById("welcomeContinueBtn");
    if (welcomeContinueBtn) {
        welcomeContinueBtn.addEventListener("click", () => {
            document.getElementById("welcomeScreen").classList.add("hidden");
            document.getElementById("startScreen").classList.remove("hidden");
        });
    }
    
    // Difficulty selection
    const diffCards = document.querySelectorAll(".difficulty-card");
    const startBtn = document.getElementById("startGameBtn");
    
    diffCards.forEach(card => {
        card.addEventListener("click", () => {
            diffCards.forEach(c => c.classList.remove("selected"));
            card.classList.add("selected");
            
            selectedDifficulty = card.getAttribute("data-level");
            
            // Update time display in instructions
            if (selectedDifficulty === "easy") {
                document.getElementById("timeLimitDisplay").textContent = "90";
            } else if (selectedDifficulty === "hard") {
                document.getElementById("timeLimitDisplay").textContent = "30";
            } else {
                document.getElementById("timeLimitDisplay").textContent = "60";
            }
            
            startBtn.disabled = false;
            startBtn.classList.remove("disabled");
        });
    });
    
    // Start game button
    startBtn.addEventListener("click", () => {
        document.getElementById("startScreen").classList.add("hidden");
        document.getElementById("playerInfoScreen").classList.remove("hidden");
    });
    
    // Player info form
    const playerInfoForm = document.getElementById("playerInfoForm");
    const skipInfoBtn = document.getElementById("skipInfoBtn");
    
    playerInfoForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const nameInput = document.getElementById("playerName").value.trim();
        const orgInput = document.getElementById("playerOrganization").value.trim();
        
        playerInfo.name = nameInput || "Anonymous Player";
        playerInfo.organization = orgInput || "Not specified";
        playerInfo.wantsCertificate = true;
        
        startGame();
    });
    
    skipInfoBtn.addEventListener("click", () => {
        playerInfo = {
            name: "Anonymous Player",
            organization: "Not specified",
            wantsCertificate: false
        };
        startGame();
    });
    
    // Instructions toggle
    const toggleInstructions = document.getElementById("toggleInstructions");
    const instructionsPanel = document.getElementById("instructionsPanel");
    
    toggleInstructions.addEventListener("click", () => {
        const isHidden = instructionsPanel.classList.contains("hidden");
        instructionsPanel.classList.toggle("hidden");
        toggleInstructions.textContent = isHidden ? "▲ Hide Instructions" : "▼ Show Instructions";
    });
    
    // Game over modal buttons
    document.getElementById("playAgainBtn").addEventListener("click", playAgain);
    document.getElementById("downloadCertBtn").addEventListener("click", generateCertificate);
    
    // Share buttons
    document.getElementById("shareWhatsAppBtn").addEventListener("click", shareOnWhatsApp);
    document.getElementById("shareImageBtn").addEventListener("click", shareCertificateAsImage);
    
    // Quick play difficulty chips
    document.querySelectorAll(".difficulty-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            selectedDifficulty = chip.getAttribute("data-level");
            playAgain();
        });
    });
}

// =======================================================
// APPLY DIFFICULTY
// =======================================================
function applyDifficulty(level) {
    if (level === "easy") totalTime = 90;
    else if (level === "hard") totalTime = 30;
    else totalTime = 60;
    
    timeLeft = totalTime;
}

// =======================================================
// START GAME
// =======================================================
function startGame() {
    const playerInfoScreen = document.getElementById("playerInfoScreen");
    const gameContainer = document.getElementById("gameContainer");
    const gameOverModal = document.getElementById("gameOverModal");
    
    // Hide all other screens
    document.querySelectorAll(".welcome-screen, .start-screen, .player-info-screen, .modal").forEach(el => {
        el.classList.add("hidden");
    });
    
    // Show game container
    gameContainer.classList.remove("hidden");
    gameOverModal.classList.add("hidden");
    
    // Reset game state
    clearInterval(timerInterval);
    applyDifficulty(selectedDifficulty);
    
    score = 0;
    correctCount = 0;
    wrongCount = 0;
    
    updateStats();
    updateTimerUI();
    
    // Load first item
    loadNextItem();
    
    // Start timer
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerUI();
        if (timeLeft <= 0) endGame();
    }, 1000);
    
    // Setup bin buttons
    document.querySelectorAll(".bin-btn").forEach(btn => {
        btn.addEventListener("click", handleBinClick);
    });
}

// =======================================================
// HANDLE BIN CLICK
// =======================================================
function handleBinClick() {
    const chosenBin = this.getAttribute("data-bin");
    
    if (chosenBin === currentItem.bin) {
        score++;
        correctCount++;
        showFeedback("Correct segregation!", true);
    } else {
        score--;
        wrongCount++;
        showFeedback(`Wrong! Correct bin: ${currentItem.bin}`, false);
    }
    
    updateStats();
    loadNextItem();
}

// =======================================================
// LOAD NEXT ITEM
// =======================================================
function loadNextItem() {
    currentItem = items[Math.floor(Math.random() * items.length)];
    
    fadeSwap("itemImage", currentItem.image);
    fadeSwap("itemName", currentItem.name);
}

// =======================================================
// FADE ANIMATION
// =======================================================
function fadeSwap(id, newValue) {
    const elem = document.getElementById(id);
    if (!elem) return;
    
    elem.classList.add("fade-out");
    
    setTimeout(() => {
        if (id === "itemImage") elem.src = newValue;
        else elem.textContent = newValue;
        
        elem.classList.remove("fade-out");
        elem.classList.add("fade-in");
        
        setTimeout(() => elem.classList.remove("fade-in"), 250);
    }, 200);
}

// =======================================================
// TIMER UPDATE
// =======================================================
function updateTimerUI() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    
    document.getElementById("timerValue").textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const progressPercent = (timeLeft / totalTime) * 100;
    document.getElementById("progressFill").style.width = `${progressPercent}%`;
}

// =======================================================
// UPDATE STATS
// =======================================================
function updateStats() {
    const accuracy = calculateAccuracy();
    
    document.getElementById("score").textContent = score;
    document.getElementById("gameStats").textContent = 
        `Correct: ${correctCount} | Wrong: ${wrongCount} | Accuracy: ${accuracy}%`;
}

// =======================================================
// SHOW FEEDBACK
// =======================================================
function showFeedback(text, good) {
    const fb = document.getElementById("feedback");
    fb.textContent = text;
    fb.className = "feedback " + (good ? "correct" : "wrong");
    
    setTimeout(() => fb.className = "feedback", 1500);
}

// =======================================================
// END GAME
// =======================================================
function endGame() {
    clearInterval(timerInterval);
    
    // Calculate final stats
    const accuracy = calculateAccuracy();
    
    // Update modal content
    document.getElementById("finalScore").textContent = score;
    document.getElementById("finalAccuracy").textContent = `${accuracy}%`;
    document.getElementById("finalDifficulty").textContent = 
        selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
    
    // Show trophy and confetti for high scores
    const trophyIcon = document.getElementById("trophyIcon");
    if (accuracy >= 80) {
        trophyIcon.style.display = "block";
        showConfetti();
    } else {
        trophyIcon.style.display = "none";
    }
    
    // Performance message
    const performanceMessage = document.getElementById("performanceMessage");
    if (accuracy >= 90) {
        performanceMessage.textContent = "Outstanding! Perfect segregation skills! 🏆";
    } else if (accuracy >= 70) {
        performanceMessage.textContent = "Great job! You have good waste management knowledge! 👍";
    } else if (accuracy >= 50) {
        performanceMessage.textContent = "Good effort! Keep practicing to improve. 💪";
    } else {
        performanceMessage.textContent = "Good attempt! Review the instructions and try again. 📚";
    }
    
    // Show modal
    document.getElementById("gameContainer").classList.add("hidden");
    document.getElementById("gameOverModal").classList.remove("hidden");
}

// =======================================================
// PLAY AGAIN
// =======================================================
function playAgain() {
    document.getElementById("gameOverModal").classList.add("hidden");
    startGame();
}

// =======================================================
// CONFETTI ANIMATION
// =======================================================
function showConfetti() {
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    
    for (let i = 0; i < 150; i++) {
        const confetti = document.createElement("div");
        confetti.className = "confetti";
        confetti.style.cssText = `
            position: fixed;
            width: 10px;
            height: 10px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            top: -20px;
            left: ${Math.random() * 100}%;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            animation: fall ${2 + Math.random() * 3}s linear forwards;
            z-index: 9999;
            pointer-events: none;
        `;
        
        // Add random horizontal movement
        const xEnd = Math.random() * 100 - 50;
        confetti.style.setProperty('--x-end', `${xEnd}px`);
        
        document.body.appendChild(confetti);
        
        // Remove after animation
        setTimeout(() => {
            confetti.remove();
        }, 3000);
    }
}

// =======================================================
// GENERATE CERTIFICATE
// =======================================================
async function generateCertificate() {
    const accuracy = calculateAccuracy();
    
    // Generate certificate ID
    const certID = `BW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // Current date
    const now = new Date();
    const certDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Fill certificate template
    document.getElementById("certName").textContent = playerInfo.name;
    document.getElementById("certOrg").textContent = playerInfo.organization;
    document.getElementById("certScore").textContent = score;
    document.getElementById("certAccuracy").textContent = accuracy;
    document.getElementById("certCorrect").textContent = correctCount;
    document.getElementById("certWrong").textContent = wrongCount;
    document.getElementById("certTotal").textContent = correctCount + wrongCount;
    document.getElementById("certDifficulty").textContent = 
        selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1);
    document.getElementById("certID").textContent = certID;
    document.getElementById("certDate").textContent = certDate;
    
    // Generate QR code
    const qrContainer = document.getElementById("certQR");
    qrContainer.innerHTML = "";
    
    const qrData = {
        id: certID,
        name: playerInfo.name,
        score: score,
        accuracy: accuracy,
        difficulty: selectedDifficulty,
        date: now.toISOString().split('T')[0],
        url: GAME_URL
    };
    
    new QRCode(qrContainer, {
        text: JSON.stringify(qrData),
        width: 120,
        height: 120,
        colorDark: "#2b6cb0",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Wait for QR code to render
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Generate PDF
    const certElement = document.getElementById("certificateContainer");
    certElement.style.display = "block";
    
    const canvas = await html2canvas(certElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        imageTimeout: 2000
    });
    
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("landscape", "pt", "a4");
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    
    // Save with personalized filename
    const fileName = `Biomedical_Waste_Certificate_${playerInfo.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    pdf.save(fileName);
    
    // Hide certificate
    certElement.style.display = "none";
    
    // Show confetti for certificate generation
    if (accuracy >= 70) {
        showConfetti();
    }
}

// =======================================================
// SHARE ON WHATSAPP
// =======================================================
function shareOnWhatsApp() {
    const accuracy = calculateAccuracy();
    
    const shareText = `🏥 I, ${playerInfo.name} from ${playerInfo.organization}, completed Biomedical Waste Sorting Training with ${accuracy}% accuracy! Score: ${score} points on ${selectedDifficulty} difficulty. Try it: ${GAME_URL}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, "_blank");
}

// =======================================================
// SHARE CERTIFICATE AS IMAGE
// =======================================================
async function shareCertificateAsImage() {
    const accuracy = calculateAccuracy();
    
    // First generate certificate
    await generateCertificate();
    
    // Show certificate temporarily
    const certElement = document.getElementById("certificateContainer");
    certElement.style.display = "block";
    
    // Convert to image
    const canvas = await html2canvas(certElement, { scale: 2 });
    const imageData = canvas.toDataURL("image/png");
    
    // For mobile sharing API
    if (navigator.share) {
        try {
            const blob = await (await fetch(imageData)).blob();
            const file = new File([blob], 'biomedical_waste_certificate.png', { type: 'image/png' });
            
            await navigator.share({
                files: [file],
                title: 'My Biomedical Waste Training Certificate',
                text: `I scored ${score} points with ${accuracy}% accuracy in the Biomedical Waste Sorting Game!`
            });
        } catch (err) {
            console.log("Sharing cancelled or failed:", err);
            // Fallback to download
            downloadImage(imageData);
        }
    } else {
        // Fallback for desktop
        downloadImage(imageData);
    }
    
    // Hide certificate
    certElement.style.display = "none";
}

function downloadImage(imageData) {
    const accuracy = calculateAccuracy();
    const link = document.createElement("a");
    link.download = `Biomedical_Waste_Certificate_${playerInfo.name}_${score}_${accuracy}%.png`;
    link.href = imageData;
    link.click();
}

// =======================================================
// INITIALIZE GAME
// =======================================================
initGame();
