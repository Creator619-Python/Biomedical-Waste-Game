* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
    background: linear-gradient(135deg, #f7fafc, #e2e8f0);
    color: #1a202c;
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 20px;
}

.container {
    width: 100%;
    max-width: 1100px;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
    padding: 24px;
}

.title {
    text-align: center;
    font-size: 1.9rem;
    margin-bottom: 8px;
    color: #1a365d;
}

.subtitle {
    text-align: center;
    color: #4a5568;
    font-size: 0.95rem;
    margin-bottom: 20px;
}

/* Status Bar: Timer + Progress */

.status-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
}

.timer-box {
    background: #edf2f7;
    border-radius: 12px;
    padding: 10px 16px;
    min-width: 160px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.timer-label {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #4a5568;
}

.timer-value {
    font-size: 1.4rem;
    font-weight: 700;
    color: #2b6cb0;
    margin-top: 2px;
}

/* Progress */

.progress-container {
    flex: 1;
    min-width: 200px;
}

.progress-bar {
    width: 100%;
    height: 10px;
    background: #e2e8f0;
    border-radius: 999px;
    overflow: hidden;
    margin-bottom: 4px;
}

#progressFill {
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, #48bb78, #ed8936, #e53e3e);
    transition: width 0.25s ease-out;
}

.progress-text {
    font-size: 0.75rem;
    color: #718096;
}

/* Cards */

.cards-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 16px;
}

.card {
    flex: 1;
    min-width: 260px;
    background: #f7fafc;
    border-radius: 14px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(160, 174, 192, 0.35);
}

.item-card {
    text-align: center;
    position: relative;
    overflow: hidden;
}

.item-image {
    width: 180px;
    height: 180px;
    object-fit: contain;
    margin: 8px auto;
    display: block;
    transition: opacity 0.3s ease;
}

.item-image.fade-out {
    opacity: 0;
}

.item-image.fade-in {
    opacity: 1;
}

.item-name {
    font-size: 1.05rem;
    font-weight: 600;
    color: #2d3748;
}

.score-card {
    text-align: center;
}

.score-value {
    font-size: 2.2rem;
    font-weight: 700;
    color: #2f855a;
    margin: 10px 0;
}

.game-stats {
    margin-top: 6px;
    font-size: 0.85rem;
    color: #4a5568;
}

/* Feedback */

.feedback {
    min-height: 28px;
    margin-bottom: 16px;
    font-size: 1rem;
    font-weight: 600;
    text-align: center;
}

.feedback.correct {
    color: #2f855a;
    animation: pulse-green 0.3s;
}

.feedback.wrong {
    color: #e53e3e;
    animation: pulse-red 0.3s;
}

@keyframes pulse-green {
    0% { transform: scale(1); }
    50% { transform: scale(1.08); }
    100% { transform: scale(1); }
}

@keyframes pulse-red {
    0% { transform: scale(1); }
    50% { transform: scale(1.08); }
    100% { transform: scale(1); }
}

/* Bins */

.bin-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 14px;
    margin-bottom: 18px;
}

.bin-btn {
    background: #ffffff;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    padding: 10px;
    cursor: pointer;
    text-align: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
    box-shadow: 0 3px 10px rgba(148, 163, 184, 0.3);
}

.bin-btn:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 8px 18px rgba(99, 179, 237, 0.45);
    border-color: #63b3ed;
}

.bin-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    box-shadow: none;
}

.bin-icon {
    width: 60px;
    height: 70px;
    object-fit: contain;
    margin-bottom: 4px;
}

.bin-label {
    font-weight: 600;
    margin-bottom: 2px;
}

/* Instructions */

.instructions {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
}

.instructions h3 {
    font-size: 1rem;
    margin-bottom: 8px;
    color: #2d3748;
}

.bin-info {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
    font-size: 0.85rem;
}

.bin-info-item {
    padding: 6px 8px;
    border-radius: 8px;
}

.bin-info-item.yellow {
    background: #fefcbf;
}

.bin-info-item.red {
    background: #fed7d7;
}

.bin-info-item.white {
    background: #edf2f7;
}

.bin-info-item.blue {
    background: #bee3f8;
}

.bin-info-item.green {
    background: #c6f6d5;
}

/* Modal */

.modal {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
}

.modal.hidden {
    display: none;
}

.modal-content {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px 20px;
    width: 90%;
    max-width: 420px;
    text-align: center;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

.modal-content h2 {
    font-size: 1.5rem;
    margin-bottom: 10px;
    color: #1a365d;
}

.modal-content p {
    font-size: 0.95rem;
    color: #4a5568;
    margin: 4px 0;
}

.primary-btn {
    margin-top: 12px;
    padding: 10px 18px;
    border-radius: 999px;
    border: none;
    background: linear-gradient(135deg, #3182ce, #2b6cb0);
    color: #ffffff;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    box-shadow: 0 6px 14px rgba(49, 130, 206, 0.5);
    transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.primary-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(49, 130, 206, 0.7);
}

/* Responsive */

@media (max-width: 640px) {
    .title {
        font-size: 1.5rem;
    }
    .timer-box {
        width: 100%;
        align-items: center;
    }
    .timer-value {
        font-size: 1.3rem;
    }
}
