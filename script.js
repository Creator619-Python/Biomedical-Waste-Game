// Enhanced Biomedical Waste Sorting Game JavaScript

// Game state
let itemsData = {};
let itemNames = [];
let currentItemName = null;
let score = 0;
let questionsAnswered = 0;
let correctAnswers = 0;
let streak = 0;
let maxStreak = 0;
const totalQuestions = 20;

// DOM elements cache
const domElements = {
    itemImage: document.getElementById('itemImage'),
    itemName: document.getElementById('itemName'),
    score: document.getElementById('score'),
    progressFill: document.getElementById('progressFill'),
    feedback: document.getElementById('feedback'),
    binButtons: document.querySelectorAll('.bin-btn')
};

// Game configuration
const config = {
    points: {
        correct: 10,
        incorrect: -5,
        streakBonus: 5
    },
    timing: {
        feedbackDelay: 1200,
        newRoundDelay: 800
    }
};

// Load items.json then start game
document.addEventListener("DOMContentLoaded", () => {
    initializeGame();
});

async function initializeGame() {
    try {
        showLoadingState(true);
        
        const response = await fetch("items.json");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        itemsData = await response.json();
        itemNames = Object.keys(itemsData);
        
        if (itemNames.length === 0) {
            throw new Error("No items found in items.json");
        }
        
        attachBinHandlers();
        resetGame();
        updateGameStats();
        
    } catch (error) {
        console.error("Error loading items.json", error);
        showError("Unable to load game data. Please check if items.json exists and contains valid data.");
    } finally {
        showLoadingState(false);
    }
}

// Attach click listeners to each bin button with enhanced feedback
function attachBinHandlers() {
    domElements.binButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            if (questionsAnswered >= totalQuestions) return;
            
            const bin = btn.getAttribute("data-bin");
            handleAnswer(bin);
            
            // Visual feedback for button press
            animateButtonPress(btn);
        });
        
        // Keyboard navigation support
        btn.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });
}

// Start a new round with a random item
function newRound() {
    if (itemNames.length === 0) {
        showError("No items available for the game.");
        return;
    }

    // Ensure we don't repeat the same item consecutively
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * itemNames.length);
    } while (itemNames[randomIndex] === currentItemName && itemNames.length > 1);
    
    currentItemName = itemNames[randomIndex];
    const item = itemsData[currentItemName];

    // Update DOM with new item
    domElements.itemImage.src = item.image;
    domElements.itemImage.alt = currentItemName;
    domElements.itemName.textContent = currentItemName;

    // Preload next image for better performance
    preloadNextImage();

    // Clear feedback and enable buttons
    clearFeedback();
    enableBinButtons(true);
    
    // Add subtle animation to new item
    animateNewItem();
}

// Preload next image for smoother transitions
function preloadNextImage() {
    if (itemNames.length <= 1) return;
    
    const nextIndex = (itemNames.indexOf(currentItemName) + 1) % itemNames.length;
    const nextItemName = itemNames[nextIndex];
    const nextItem = itemsData[nextItemName];
    
    const preloadImage = new Image();
    preloadImage.src = nextItem.image;
}

// Handle user selecting a bin
function handleAnswer(selectedBin) {
    if (!currentItemName || questionsAnswered >= totalQuestions) return;

    const correctBin = itemsData[currentItemName].bin;
    const isCorrect = (selectedBin === correctBin);

    // Disable buttons during feedback to prevent multiple clicks
    enableBinButtons(false);

    // Update game state
    updateGameState(isCorrect, correctBin);
    updateScoreDisplay();
    updateProgressBar();
    showFeedback(isCorrect, correctBin);
    updateGameStats();

    // Move to next round or end game
    setTimeout(() => {
        if (questionsAnswered >= totalQuestions) {
            endGame();
        } else {
            newRound();
        }
    }, config.timing.newRoundDelay);
}

// Update all game state variables
function updateGameState(isCorrect, correctBin) {
    if (isCorrect) {
        score += config.points.correct;
        correctAnswers++;
        streak++;
        
        // Streak bonus
        if (streak >= 3) {
            const bonus = Math.floor(streak / 3) * config.points.streakBonus;
            score += bonus;
        }
        
        maxStreak = Math.max(maxStreak, streak);
    } else {
        score += config.points.incorrect;
        if (score < 0) score = 0;
        streak = 0;
    }
    
    questionsAnswered++;
}

// Update score on screen with animation
function updateScoreDisplay() {
    const scoreElement = domElements.score;
    const oldScore = parseInt(scoreElement.textContent);
    const newScore = score;
    
    // Animate score change
    animateScoreChange(oldScore, newScore, scoreElement);
}

// Animate score changing
function animateScoreChange(oldScore, newScore, element) {
    const duration = 500;
    const startTime = performance.now();
    const difference = newScore - oldScore;
    
    function updateScore(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentValue = oldScore + Math.floor(difference * easeOut);
        
        element.textContent = currentValue;
        
        // Add visual feedback for score changes
        if (difference > 0) {
            element.style.color = '#1C9C31';
        } else if (difference < 0) {
            element.style.color = '#E3342F';
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateScore);
        } else {
            // Reset color after animation
            setTimeout(() => {
                element.style.color = '#1F5FD6';
            }, 500);
        }
    }
    
    requestAnimationFrame(updateScore);
}

// Update progress bar with smooth animation
function updateProgressBar() {
    const percent = Math.min(100, (questionsAnswered / totalQuestions) * 100);
    domElements.progressFill.style.width = percent + "%";
    
    // Add completion animation when full
    if (percent >= 100) {
        domElements.progressFill.style.animation = 'pulse 1s infinite';
    }
}

// Show enhanced feedback with more information
function showFeedback(isCorrect, correctBin) {
    const fb = domElements.feedback;
    
    if (isCorrect) {
        let feedbackText = `
            <img src="images/check.png" class="result-icon" alt="Correct">
            <span class="correct-text">Correct! +${config.points.correct} points</span>
        `;
        
        // Add streak bonus message
        if (streak >= 3) {
            const bonus = Math.floor(streak / 3) * config.points.streakBonus;
            feedbackText += `<div style="font-size: 0.9em; margin-top: 5px;">${streak} in a row! +${bonus} bonus</div>`;
        }
        
        fb.innerHTML = feedbackText;
        fb.className = 'feedback correct';
    } else {
        fb.innerHTML = `
            <img src="images/cross.png" class="result-icon" alt="Wrong">
            <span class="wrong-text">Incorrect! ${config.points.incorrect} points</span>
            <div style="font-size: 0.9em; margin-top: 5px;">Correct bin: 
                <span style="color: ${getBinColor(correctBin)}; font-weight: bold;">${correctBin}</span>
            </div>
        `;
        fb.className = 'feedback incorrect';
    }
    
    // Add animation
    fb.style.animation = 'none';
    setTimeout(() => {
        fb.style.animation = 'pop 0.3s ease-out';
    }, 10);
}

// Get color for bin type
function getBinColor(bin) {
    const colors = {
        'Yellow': '#FFD600',
        'Red': '#E3342F',
        'White': '#718096',
        'Blue': '#1F5FD6',
        'Green': '#1C9C31'
    };
    return colors[bin] || '#718096';
}

// Clear feedback area
function clearFeedback() {
    domElements.feedback.innerHTML = '';
    domElements.feedback.className = 'feedback';
}

// Enable or disable bin buttons
function enableBinButtons(enabled) {
    domElements.binButtons.forEach(btn => {
        if (enabled) {
            btn.removeAttribute('disabled');
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        } else {
            btn.setAttribute('disabled', 'true');
            btn.style.opacity = '0.6';
            btn.style.cursor = 'not-allowed';
        }
    });
}

// When totalQuestions reached - enhanced end game
function endGame() {
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const performance = getPerformanceRating(accuracy);
    
    domElements.feedback.innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: #1F5FD6; margin-bottom: 10px;">Game Completed! 🎉</h3>
            <div style="font-size: 1.2rem; font-weight: bold; color: #1C9C31; margin: 10px 0;">
                Final Score: ${score}
            </div>
            <div style="margin: 5px 0;">Accuracy: ${accuracy}% (${correctAnswers}/${totalQuestions})</div>
            <div style="margin: 5px 0;">Best Streak: ${maxStreak} in a row</div>
            <div style="margin: 10px 0; font-weight: bold; color: ${performance.color};">
                ${performance.message}
            </div>
            <button id="playAgainBtn" style="
                background: #1F5FD6;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                margin-top: 15px;
                transition: background 0.3s;
            ">Play Again</button>
        </div>
    `;
    
    // Add play again button handler
    document.getElementById('playAgainBtn').addEventListener('click', resetGame);
    
    // Celebrate completion
    celebrateCompletion();
}

// Get performance rating based on accuracy
function getPerformanceRating(accuracy) {
    if (accuracy >= 90) return { message: "Expert Level! 🏆", color: "#FFD600" };
    if (accuracy >= 80) return { message: "Great Job! 👍", color: "#1C9C31" };
    if (accuracy >= 70) return { message: "Good Work! 👏", color: "#1F5FD6" };
    if (accuracy >= 60) return { message: "Not Bad! 💪", color: "#F6AD55" };
    return { message: "Keep Practicing! 📚", color: "#718096" };
}

// Reset game to initial state
function resetGame() {
    score = 0;
    questionsAnswered = 0;
    correctAnswers = 0;
    streak = 0;
    maxStreak = 0;
    
    // show 0 immediately
    domElements.score.textContent = '0';
    updateProgressBar();
    clearFeedback();
    enableBinButtons(true);
    updateGameStats();
    
    newRound();
}

// Update game statistics display
function updateGameStats() {
    const statsElement = document.getElementById('gameStats');
    if (statsElement) {
        const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
        statsElement.innerHTML = `
            <div>Streak: ${streak}</div>
            <div>Accuracy: ${accuracy}%</div>
        `;
    }
}

// Animation functions
function animateButtonPress(button) {
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = '';
    }, 150);
}

function animateNewItem() {
    domElements.itemImage.style.opacity = '0.7';
    domElements.itemImage.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        domElements.itemImage.style.transition = 'all 0.3s ease';
        domElements.itemImage.style.opacity = '1';
        domElements.itemImage.style.transform = 'scale(1)';
    }, 50);
}

function celebrateCompletion() {
    domElements.feedback.style.animation = 'celebrate 0.6s ease-out';
}

// Utility functions
function showLoadingState(show) {
    const container = document.querySelector('.container');
    if (show) {
        container.classList.add('loading');
    } else {
        container.classList.remove('loading');
    }
}

function showError(message) {
    domElements.feedback.innerHTML = `
        <span style="color: #E3342F; font-weight: bold;">
            ⚠️ ${message}
        </span>
    `;
}

// Extra animations (for progress bar etc.)
const extraStyle = document.createElement('style');
extraStyle.textContent = `
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.7; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(extraStyle);
