const audio = document.getElementById("audio");
const volumeSlider = document.getElementById("volume");
const bars = document.querySelectorAll(".bar");
const quoteText = document.getElementById("quoteText");
const trackSelector = document.getElementById("trackSelector");
const footerInfo = document.getElementById("footerInfo");

let isPlaying = false;

/* =========================
   QUOTES BY MOOD
========================= */

const quotes = {
  morning: [
    "Strong coffee. Clear mind.",
    "Start slow. Build momentum.",
    "A calm morning sets the tone.",
    "Show up before the world gets loud.",
    "Today only asks for your best effort."
  ],

  focus: [
    "Progress beats perfection.",
    "Consistency compounds.",
    "Do fewer things. Do them better.",
    "Focus is saying no to many good things.",
    "Clarity comes from action."
  ],

  growth: [
    "Small improvements add up.",
    "Discipline gives freedom.",
    "Hard days build strong minds.",
    "Growth feels uncomfortable for a reason.",
    "Your habits shape your future."
  ],

  calm: [
    "Calm is a superpower.",
    "Silence helps you hear what matters.",
    "Slow down to speed up.",
    "Protect your energy.",
    "Not every win is loud."
  ],

  life: [
    "Build a life you do not need to escape from.",
    "Choose progress over approval.",
    "Long term thinking beats short term comfort.",
    "You are allowed to move at your own pace.",
    "Momentum comes from showing up."
  ]
};

/* =========================
   TIME BASED MOOD PICKER
========================= */

function getTimeMood() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "focus";
  if (hour >= 17 && hour < 21) return "growth";
  return "calm";
}

/* =========================
   QUOTE DISPLAY
========================= */

function setQuote(text) {
  quoteText.style.opacity = 0;
  quoteText.style.transform = "scale(0.98)";

  setTimeout(() => {
    quoteText.textContent = text;
    quoteText.style.opacity = 1;
    quoteText.style.transform = "scale(1)";
    localStorage.setItem("lastQuote", text);
  }, 250);
}

function generateQuote() {
  const mood = getTimeMood();
  const pool = [...quotes[mood], ...quotes.life];
  const randomQuote = pool[Math.floor(Math.random() * pool.length)];
  setQuote(randomQuote);
}

/* Restore last quote */
const savedQuote = localStorage.getItem("lastQuote");
if (savedQuote) {
  quoteText.textContent = savedQuote;
}

/* =========================
   AUDIO + EQUALIZER
========================= */

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
    const height = Math.max(dataArray[i] / 3, 8);
    bar.style.height = height + "px";
  });
}

/* =========================
   CONTROLS
========================= */

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

function toggleTheme() {
  document.body.classList.toggle("light");
  document.body.classList.toggle("dark");
}

volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value;
});

trackSelector.addEventListener("change", () => {
  audio.src = trackSelector.value;
  footerInfo.textContent =
    "Now Playing: " +
    trackSelector.options[trackSelector.selectedIndex].text;

  if (isPlaying) audio.play();
});

/* =========================
   AUTO NEXT TRACK
========================= */

audio.addEventListener("ended", () => {
  let nextIndex = (trackSelector.selectedIndex + 1) % trackSelector.options.length;
  trackSelector.selectedIndex = nextIndex;
  audio.src = trackSelector.value;
  footerInfo.textContent =
    "Now Playing: " +
    trackSelector.options[trackSelector.selectedIndex].text;
  audio.play();
});

/* =========================
   INITIAL STATE
========================= */

audio.volume = volumeSlider.value;
