// ====== IMMEDIATE THEME LOADING (Prevents light mode screen flash) ======
const savedTheme = localStorage.getItem("theme") || "dark";
if (savedTheme === "light") {
  document.body.classList.add("light");
  document.body.classList.remove("dark");
} else {
  document.body.classList.add("dark");
  document.body.classList.remove("light");
}

// ====== AUDIO & UI CONTROLS ELEMENT MAPPING ======
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

// Web Audio Processing pipelines (Initialized purely on-demand)
let audioCtx = null;
let source = null;
let analyser = null;
let dataArray = null;

/* Set Current Year in Footer */
document.getElementById('year').textContent = new Date().getFullYear();

/* Professional Quotes Matrix */
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

// Bind baseline media value
audio.src = trackSelector.value;

/**
 * Lazy Initializer for Web Audio Engine
 * Defers instantiation until real physical user gesture to pass browser policy locks
 */
function initAudioContext() {
  if (audioCtx) return; 

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AudioContextClass();
  source = audioCtx.createMediaElementSource(audio);
  analyser = audioCtx.createAnalyser();

  analyser.fftSize = 128;
  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

/* High DPI Canvas Scaling Controller */
function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', () => { requestAnimationFrame(resizeCanvas); });
resizeCanvas();

/* Audio Reactive Engine Loop */
function draw() {
  if (!isPlaying || !analyser) return;
  requestAnimationFrame(draw);
  
  analyser.getByteFrequencyData(dataArray);
  const rect = canvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  ctx.clearRect(0, 0, w, h);

  let bass = 0;
  const bassEnd = dataArray.length * 0.25;
  dataArray.forEach((v, i) => { if (i < bassEnd) bass += v; });

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
      const barHeight = (v / 255) * h * 0.8; 
      ctx.fillRect(i * barWidth, h - barHeight, barWidth - 2, barHeight);
    });
  } else if (visualizerMode.value === "wave") {
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${hue},70%,60%)`;
    ctx.lineWidth = 3;
    dataArray.forEach((v, i) => {
      const y = h / 2 + ((v - 128) / 128) * (h / 2);
      if (i === 0) ctx.moveTo(0, y); else ctx.lineTo(i * barWidth, y);
    });
    ctx.stroke();
  } else if (visualizerMode.value === "pulse") {
    ctx.fillStyle = `hsla(${hue},70%,60%,0.6)`;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 20 + intensity * Math.min(w, h) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* UI Action Hooks */
function togglePlay() {
  const playBtn = document.getElementById("playBtn");
  if (!isPlaying) {
    initAudioContext(); // Instantiates nodes seamlessly on execution gesture
    
    if (audioCtx.state === 'suspended') audioCtx.resume();
    audio.play();
    isPlaying = true;
    playBtn.textContent = "Pause";
    draw();
  } else {
    audio.pause();
    isPlaying = false;
    playBtn.textContent = "Play";
    document.body.style.setProperty("--beat-opacity", 0);
  }
}

function toggleTheme() {
  document.body.classList.toggle("light");
  document.body.classList.toggle("dark");
  
  const currentMode = document.body.classList.contains("light") ? "light" : "dark";
  localStorage.setItem("theme", currentMode);
}

volume.addEventListener("input", () => { audio.volume = volume.value; });

function generateQuote() {
  const cat = quoteCategory.value;
  const list = quotes[cat];
  quoteText.style.opacity = 0;
  setTimeout(() => {
    quoteText.textContent = `"${list[Math.floor(Math.random() * list.length)]}"`;
    quoteText.style.opacity = 1;
  }, 200);
}
quoteText.style.transition = "opacity 0.2s ease";

/* Dynamic Media Events mapping */
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

function playSelectedTrack() {
  audio.src = trackSelector.value;
  progress.value = 0;
  currentTimeEl.textContent = "0:00";
  if (isPlaying) audio.play();
}

audio.addEventListener("ended", () => {
  trackSelector.selectedIndex = (trackSelector.selectedIndex + 1) % trackSelector.options.length;
  playSelectedTrack();
  if (!isPlaying) togglePlay(); 
});
trackSelector.addEventListener("change", playSelectedTrack);

function format(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

generateQuote();

// ====== BACKGROUND CANVAS: GEOMETRIC 3D DNA MATRIX SYSTEM ======
const dnaCanvas = document.getElementById('dnaCanvas');
const dnaCtx = dnaCanvas.getContext('2d');

let scrollPos = 0;
window.addEventListener('scroll', () => {
  scrollPos = window.scrollY;
});

function resizeDnaCanvas() {
  const dpr = window.devicePixelRatio || 1;
  dnaCanvas.width = window.innerWidth * dpr;
  dnaCanvas.height = window.innerHeight * dpr;
  dnaCtx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeDnaCanvas);
resizeDnaCanvas();

function drawDNA() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  
  dnaCtx.clearRect(0, 0, w, h);
  
  const centerX = w / 2;
  const time = Date.now() * 0.0003; 
  const scrollRotation = scrollPos * 0.004; 
  const totalRotation = time + scrollRotation;

  const isLightMode = document.body.classList.contains('light');
  const dotColorMain = isLightMode ? 'rgba(10, 10, 10, 0.4)' : 'rgba(255, 255, 255, 0.5)';
  const dotColorAccent = '#ff9f43'; 
  const lineColor = isLightMode ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';

  const nodes = 70; 
  const isMobile = w < 768;
  const maxAmplitude = isMobile ? 80 : 180; 

  for(let i = 0; i < nodes; i++) {
    const progressVal = i / nodes; 
    const y = (h * 0.05) + (progressVal * h * 0.9);
    const amplitude = 15 + Math.pow(progressVal, 1.8) * maxAmplitude; 
    const angle = (progressVal * Math.PI * 12) + totalRotation; 

    const x1 = centerX + Math.cos(angle) * amplitude;
    const x2 = centerX + Math.cos(angle + Math.PI) * amplitude; 
    
    const z1 = Math.sin(angle);
    const z2 = Math.sin(angle + Math.PI);

    dnaCtx.beginPath();
    dnaCtx.moveTo(x1, y);
    dnaCtx.lineTo(x2, y);
    dnaCtx.strokeStyle = lineColor;
    dnaCtx.lineWidth = 1;
    dnaCtx.stroke();

    function drawDot(x, y, z, color1, color2) {
      const radius = 2 + z * 1.5; 
      dnaCtx.fillStyle = z > 0 ? color2 : color1; 
      dnaCtx.globalAlpha = 0.3 + ((z + 1) / 2) * 0.7; 
      dnaCtx.beginPath();
      dnaCtx.arc(x, y, Math.max(0.1, radius), 0, Math.PI * 2);
      dnaCtx.fill();
    }

    drawDot(x1, y, z1, dotColorMain, dotColorAccent);
    drawDot(x2, y, z2, dotColorMain, dotColorAccent);
    
    dnaCtx.globalAlpha = 1.0; 
  }
  
  requestAnimationFrame(drawDNA);
}

drawDNA();
