const audio = document.getElementById("audio");
const volumeSlider = document.getElementById("volume");
const progressBar = document.getElementById("progress");
const bars = document.querySelectorAll(".bar");
const quoteText = document.getElementById("quoteText");
const trackSelector = document.getElementById("trackSelector");
const footerInfo = document.getElementById("footerInfo");
const quoteCategory = document.getElementById("quoteCategory");

let isPlaying = false;

/* ================= QUOTES ================= */

const quotes = {
  morning: [
    "Strong coffee. Clear mind.",
    "Start slow. Build momentum.",
    "A calm morning sets the tone.",
    "Show up before the world gets loud."
  ],
  focus: [
    "Progress beats perfection.",
    "Consistency compounds.",
    "Do fewer things. Do them better.",
    "Focus is saying no to many good things."
  ],
  growth: [
    "Small improvements add up.",
    "Discipline gives freedom.",
    "Hard days build strong minds."
  ],
  calm: [
    "Calm is a superpower.",
    "Slow down to speed up.",
    "Protect your energy."
  ],
  life: [
    "Build a life you do not need to escape from.",
    "Choose progress over approval.",
    "Momentum comes from showing up."
  ]
};

function getTimeMood() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "focus";
  if (h >= 17 && h < 21) return "growth";
  return "calm";
}

function setQuote(text) {
  quoteText.style.opacity = 0;
  quoteText.style.transform = "scale(0.97)";
  setTimeout(() => {
    quoteText.textContent = text;
    quoteText.style.opacity = 1;
    quoteText.style.transform = "scale(1)";
    localStorage.setItem("lastQuote", text);
  }, 250);
}

function generateQuote() {
  const category =
    quoteCategory.value === "auto"
      ? getTimeMood()
      : quoteCategory.value;

  const pool = [...quotes[category], ...quotes.life];
  const q = pool[Math.floor(Math.random() * pool.length)];
  setQuote(q);
}

const savedQuote = localStorage.getItem("lastQuote");
if (savedQuote) quoteText.textContent = savedQuote;

/* ================= AUDIO ================= */

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const source = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();

analyser.fftSize = 64;
source.connect(analyser);
analyser.connect(audioCtx.destination);

const dataArray = new Uint8Array(analyser.frequencyBinCount);

function animateEqualizer() {
  requestAnimationFrame(animateEqualizer);
  analyser.getByteFrequencyData(dataArray);
  bars.forEach((bar, i) => {
    bar.style.height = Math.max(dataArray[i] / 3, 8) + "px";
  });
}

function togglePlay() {
  if (!isPlaying) {
    audioCtx.resume();
    audio.play();
    animateEqualizer();
    isPlaying = true;
  } else {
    audio.pause();
    isPlaying = false;
  }
}

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

/* Progress bar */
audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
  }
});

progressBar.addEventListener("input", () => {
  audio.currentTime = (progressBar.value / 100) * audio.duration;
});

/* Tracks */
trackSelector.addEventListener("change", () => {
  audio.src = trackSelector.value;
  footerInfo.textContent =
    "Now Playing: " + trackSelector.options[trackSelector.selectedIndex].text;
  if (isPlaying) audio.play();
});

audio.addEventListener("ended", () => {
  trackSelector.selectedIndex =
    (trackSelector.selectedIndex + 1) % trackSelector.options.length;
  audio.src = trackSelector.value;
  footerInfo.textContent =
    "Now Playing: " + trackSelector.options[trackSelector.selectedIndex].text;
  audio.play();
});

/* Theme */
function toggleTheme() {
  document.body.classList.toggle("light");
  document.body.classList.toggle("dark");
}

audio.volume = volumeSlider.value;
