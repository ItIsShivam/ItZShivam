const audio = document.getElementById("audio");
const volume = document.getElementById("volume");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const trackSelector = document.getElementById("trackSelector");
const quoteText = document.getElementById("quoteText");
const quoteCategory = document.getElementById("quoteCategory");
const visualizerMode = document.getElementById("visualizerMode");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let isPlaying = false;

/* Set Current Year in Footer */
document.getElementById('year').textContent = new Date().getFullYear();

/* Upgraded Professional Quotes */
const quotes = {
  all: [],
  focus: [
    "Deep work produces massive results.",
    "Mastery is the byproduct of sustained concentration.",
    "Where focus goes, energy flows.",
    "Eliminate distractions. Elevate execution."
  ],
  career: [
    "Value is created through solving hard problems.",
    "Consistency compounds over time.",
    "Continuous learning is the ultimate competitive advantage.",
    "Great execution is the ultimate differentiator."
  ],
  calm: [
    "Clarity comes from a quiet mind.",
    "Embrace the process; detach from the immediate outcome.",
    "A calm mind is a highly creative mind.",
    "Patience in the macro, speed in the micro."
  ]
};

quotes.all = [...quotes.focus, ...quotes.career, ...quotes.calm];

/* Audio setup */
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const source = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();

analyser.fftSize = 128;
source.connect(analyser);
analyser.connect(audioCtx.destination);

const dataArray = new Uint8Array(analyser.frequencyBinCount);
audio.src = trackSelector.value;

/* High DPI Canvas Setup (Fixes blurriness on mobile/Mac) */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  
  ctx.scale(dpr, dpr);
}

window.addEventListener('resize', () => {
  requestAnimationFrame(resizeCanvas);
});
resizeCanvas(); // Initialize on load

/* Visualizer */
function draw() {
  if (!isPlaying) return; // Save processing power when paused
  requestAnimationFrame(draw);
  
  analyser.getByteFrequencyData(dataArray);
  
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  
  ctx.clearRect(0, 0, w, h);

  let bass = 0;
  const bassEnd = dataArray.length * 0.25;

  dataArray.forEach((v, i) => {
    if (i < bassEnd) bass += v;
  });

  const intensity = bass / bassEnd / 255;
  const hue = 180 + intensity * 120;

  document.body.style.setProperty(
    "--beat-bg",
    `radial-gradient(circle, hsla(${hue},60%,55%,${intensity}), transparent 70%)`
  );
  document.body.style.setProperty("--beat-opacity", intensity);

  const barWidth = w / dataArray.length;

  if (visualizerMode.value === "bars") {
    dataArray.forEach((v, i) => {
      ctx.fillStyle = `hsl(${hue + i},60%,55%)`;
      // Scale visualizer relative to canvas height
      const barHeight = (v / 255) * h * 0.8; 
      ctx.fillRect(i * barWidth, h - barHeight, barWidth - 2, barHeight);
    });
  }

  if (visualizerMode.value === "wave") {
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${hue},70%,60%)`;
    ctx.lineWidth = 3;
    dataArray.forEach((v, i) => {
      const y = h / 2 + ((v - 128) / 128) * (h / 2);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * barWidth, y);
    });
    ctx.stroke();
  }

  if (visualizerMode.value === "pulse") {
    ctx.fillStyle = `hsla(${hue},70%,60%,0.6)`;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 20 + intensity * Math.min(w, h) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* Controls */
function togglePlay() {
  const playBtn = document.getElementById("playBtn");
  if (!isPlaying) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    audio.play();
    isPlaying = true;
    playBtn.textContent = "Pause";
    draw(); // Kick off animation loop
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = "Play";
    // Fade out beat background
    document.body.style.setProperty("--beat-opacity", 0);
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
  const cat = quoteCategory.value;
  const list = quotes[cat];
  
  // Quick fade animation for quote transition
  quoteText.style.opacity = 0;
  setTimeout(() => {
    quoteText.textContent = `"${list[Math.floor(Math.random() * list.length)]}"`;
    quoteText.style.opacity = 1;
  }, 200);
}
quoteText.style.transition = "opacity 0.2s ease";

/* Progress */
audio.addEventListener("timeupdate", () => {
  if (!isNaN(audio.duration)) {
    progress.value = (audio.currentTime / audio.duration) * 100 || 0;
    currentTimeEl.textContent = format(audio.currentTime);
    durationEl.textContent = format(audio.duration);
  }
});

progress.addEventListener("input", () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
});

/* Autoplay next & Track Selection */
function playSelectedTrack() {
  audio.src = trackSelector.value;
  progress.value = 0;
  currentTimeEl.textContent = "0:00";
  if (isPlaying) {
    audio.play();
  }
}

audio.addEventListener("ended", () => {
  trackSelector.selectedIndex =
    (trackSelector.selectedIndex + 1) % trackSelector.options.length;
  playSelectedTrack();
  if (!isPlaying) togglePlay(); // Ensure it starts playing if it was somehow paused
});

trackSelector.addEventListener("change", playSelectedTrack);

function format(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Generate an initial quote on load
generateQuote();
