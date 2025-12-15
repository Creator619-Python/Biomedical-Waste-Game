// Score history stored locally
let history = JSON.parse(localStorage.getItem("bmw_scores") || "[]");

// Draw chart
function drawChart() {
    const ctx = document.getElementById("scoreChart").getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: history.map((h, i) => `Game ${i+1}`),
            datasets: [{
                label: "Score",
                data: history.map(h => h.score),
                borderWidth: 2,
                borderColor: "#2ea043",
                backgroundColor: "rgba(46,160,67,0.3)"
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

drawChart();
