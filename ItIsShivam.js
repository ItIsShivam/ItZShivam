const audio = document.getElementById("audio");
const volume = document.getElementById("volume");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const trackSelector = document.getElementById("trackSelector");
const quoteText = document.getElementById("quoteText");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let isPlaying = false;

/* Quotes */
const quotes = [
  "Strong coffee. Clear mind.",
  "Progress beats perfection.",
  "Consistency compounds.",
  "Focus on what matters.",
  "Small steps add up.",
  "Calm mind. Steady work.",
  "Discipline creates freedom.",
  "Create space to think.",
  "Growth takes patience.",
  "Energy follows attention.",
  "Do less, but do it well.",
  "Direction matters more than speed.",
  "Clarity comes from action."
];

/* Audio Context */
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const source = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();

analyser.fftSize = 128;
source.connect(analyser);
analyser.connect(audioCtx.destination);

const dataArray = new Uint8Array(analyser.frequencyBinCount);

/* Load first track */
audio.src = trackSelector.value;

/* Visualizer + Beat Reactive Background */
function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let bassSum = 0;
  const bassRange = Math.floor(dataArray.length * 0.25);

  const barWidth = canvas.width / dataArray.length;

  dataArray.forEach((v, i) => {
    if (i < bassRange) bassSum += v;

    ctx.fillStyle = `hsl(${180 + v * 0.4}, 55%, 55%)`;
    ctx.fillRect(
      i * barWidth,
      canvas.height - v / 2,
      barWidth - 2,
      v / 2
    );
  });

  /* Beat intensity */
  const bassIntensity = bassSum / bassRange / 255;

  /* Background reaction (soft + safe) */
  const hue = 190 + bassIntensity * 60;
  const opacity = Math.min(0.35, bassIntensity);

  document.body.style.setProperty(
    "--beat-bg",
    `radial-gradient(circle at center, hsla(${hue}, 60%, 55%, ${opacity}), transparent 70%)`
  );

  document.body.style.setProperty("--beat-opacity", opacity);

  document.body.style.setProperty(
    "--overlay-bg",
    `radial-gradient(circle at center, hsla(${hue}, 60%, 55%, ${opacity}), transparent 70%)`
  );

  document.body.style.setProperty("--overlay-opacity", opacity);

  document.body.style.setProperty(
    "--dynamic-bg",
    `hsla(${hue}, 40%, 15%, ${opacity})`
  );

  document.body.style.setProperty("--dynamic-opacity", opacity);

  document.body.style.setProperty("--bg-hue", hue);
  document.body.style.setProperty("--bg-strength", opacity);

  document.body.style.setProperty(
    "background-image",
    `radial-gradient(circle at center, hsla(${hue}, 60%, 55%, ${opacity}), transparent 70%)`
  );

  document.body.style.setProperty("--beat-opacity", opacity);
}

/* Controls */
function togglePlay() {
  if (!isPlaying) {
    audioCtx.resume();
    audio.play();
    drawVisualizer();
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

volume.addEventListener("input", () => {
  audio.volume = volume.value;
});

function generateQuote() {
  quoteText.style.opacity = 0;
  setTimeout(() => {
    quoteText.textContent =
      quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.style.opacity = 1;
  }, 200);
}

/* Progress */
audio.addEventListener("timeupdate", () => {
  progress.value = (audio.currentTime / audio.duration) * 100 || 0;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  durationEl.textContent = formatTime(audio.duration);
});

progress.addEventListener("input", () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
});

/* Autoplay next track */
audio.addEventListener("ended", () => {
  let i = trackSelector.selectedIndex;
  trackSelector.selectedIndex = (i + 1) % trackSelector.options.length;
  audio.src = trackSelector.value;
  audio.play();
});

/* Track change */
trackSelector.addEventListener("change", () => {
  audio.src = trackSelector.value;
  if (isPlaying) audio.play();
});

/* Helpers */
function formatTime(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
