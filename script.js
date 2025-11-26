/* Add to your existing CSS */
#gameStats {
    background: white;
    padding: 15px;
    border-radius: 12px;
    margin: 15px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    text-align: center;
}

#gameStats div {
    padding: 8px;
    background: #f8fafc;
    border-radius: 8px;
    font-weight: 600;
    color: #2D3748;
}

@keyframes celebrate {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

.celebrate {
    animation: celebrate 0.6s ease-out;
}
