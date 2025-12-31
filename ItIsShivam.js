const audio = document.getElementById("audio");
const volumeSlider = document.getElementById("volume");
const bars = document.querySelectorAll(".bar");
const quoteText = document.getElementById("quoteText");
const trackSelector = document.getElementById("trackSelector");
const footerInfo = document.getElementById("footerInfo");

let isPlaying = false;

const quotes = [
  "Strong coffee. Clear mind.",
  "Progress beats perfection.",
  "Let the music do the heavy lifting.",
  "Consistency compounds.",
  "Create space to think.",
  "Momentum comes from showing up."
];

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

function generateQuote() {
  quoteText.style.opacity = 0;
  setTimeout(() => {
    quoteText.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.style.opacity = 1;
  }, 200);
}

trackSelector.addEventListener("change", () => {
  audio.src = trackSelector.value;
  footerInfo.textContent = "Now Playing: " + trackSelector.options[trackSelector.selectedIndex].text;
  if (isPlaying) audio.play();
});
