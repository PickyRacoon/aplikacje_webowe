let time = 0;         // czas w sekundach
let interval = null;    

const display = document.getElementById("display");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const resetBtn = document.getElementById("reset");


function updateDisplay() {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;

    const h = String(hours).padStart(2, "0");
    const m = String(minutes).padStart(2, "0");
    const s = String(seconds).padStart(2, "0");

    if (hours > 0) {
        display.textContent = `${h}h${m}m${s}s`;
    } else if (minutes > 0) {
        display.textContent = `${m}m${s}s`;
    } else {
        display.textContent = `${s}s`;
    }
}

startBtn.addEventListener("click", () => {
    if (interval === null) { 
        interval = setInterval(() => {
            time++;
            updateDisplay();
        }, 1000);           // wykonuje co sekundę
    }
});

stopBtn.addEventListener("click", () => {
    clearInterval(interval);        // zatrzymuje licznik
    interval = null;
});

resetBtn.addEventListener("click", () => {
    clearInterval(interval);
    interval = null;
    time = 0;
    updateDisplay();
});

updateDisplay();
