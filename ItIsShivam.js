// ====== IMMEDIATE THEME LOADING ======
const savedTheme = localStorage.getItem("theme") || "dark";
let isLightMode = savedTheme === "light"; 

if (isLightMode) {
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
const ctx = canvas.getContext("2d", { alpha: false }); 

let isPlaying = false;
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

audio.src = trackSelector.value;

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

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2); 
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let lastIntensity = 0; 
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
  for (let i = 0; i < bassEnd; i++) {
    bass += dataArray[i];
  }

  const intensity = bass / bassEnd / 255;
  const hue = 180 + intensity * 120;

  if (Math.abs(lastIntensity - intensity) > 0.05) {
    document.body.style.setProperty(
      "--beat-bg",
      `radial-gradient(circle, hsla(${hue},60%,55%,${intensity}), transparent 70%)`
    );
    document.body.style.setProperty("--beat-opacity", intensity);
    lastIntensity = intensity;
  }

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

function togglePlay() {
  const playBtn = document.getElementById("playBtn");
  if (!isPlaying) {
    initAudioContext();
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
  
  isLightMode = document.body.classList.contains("light");
  localStorage.setItem("theme", isLightMode ? "light" : "dark");
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

// ====== BACKGROUND CANVAS: INTERACTIVE 3D DNA MATRIX (CIRCLES & OPTIMIZED) ======
const dnaCanvas = document.getElementById('dnaCanvas');
const dnaCtx = dnaCanvas.getContext('2d');

let scrollPos = 0;
window.addEventListener('scroll', () => {
  scrollPos = window.scrollY;
}, { passive: true });

// Array to track multiple fingers/cursors
let activePointers = []; 
const INTERACTION_RADIUS = 150;

// Mouse Listeners
window.addEventListener('mousemove', (e) => {
  activePointers = [{ x: e.clientX, y: e.clientY }];
});

document.addEventListener('mouseleave', () => {
  activePointers = []; 
});

// Multi-Touch Listeners
function updateTouches(e) {
  activePointers = [];
  for (let i = 0; i < e.touches.length; i++) {
    activePointers.push({
      x: e.touches[i].clientX,
      y: e.touches[i].clientY
    });
  }
}

window.addEventListener('touchstart', updateTouches, { passive: true });
window.addEventListener('touchmove', updateTouches, { passive: true });
window.addEventListener('touchend', updateTouches);
window.addEventListener('touchcancel', updateTouches);


// MOBILE GLITCH FIX: Only resize if the screen width changes
let lastWidth = window.innerWidth;
let nodes = calculateNodes(); // Initialize node count

function calculateNodes() {
  if (window.innerWidth < 480) return 40; // Phones
  if (window.innerWidth < 768) return 55; // Tablets
  return 75; // PCs
}

function resizeDnaCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  dnaCanvas.width = window.innerWidth * dpr;
  dnaCanvas.height = window.innerHeight * dpr;
  dnaCtx.scale(dpr, dpr);
}

window.addEventListener('resize', () => {
  if (window.innerWidth !== lastWidth) {
    lastWidth = window.innerWidth;
    nodes = calculateNodes(); // Update nodes dynamically on rotation/resize
    resizeDnaCanvas();
  }
});
resizeDnaCanvas();

// Allow array to handle up to max PC nodes dynamically
const particles = Array.from({ length: 80 }, () => ({
  dx1: 0, dy1: 0, vx1: 0, vy1: 0,
  dx2: 0, dy2: 0, vx2: 0, vy2: 0
}));

const SPRING = 0.05;   
const FRICTION = 0.82; 
const REPULSION = 18;  

function applyPhysics(rawX, rawY, dx, dy, vx, vy) {
  // Elastic spring forcing particles back to their original spots
  vx -= dx * SPRING;
  vy -= dy * SPRING;

  const actualX = rawX + dx;
  const actualY = rawY + dy;

  // Repulsion calculated for EVERY active pointer (multi-touch support)
  for (let i = 0; i < activePointers.length; i++) {
    const pointer = activePointers[i];
    const distX = pointer.x - actualX;
    const distY = pointer.y - actualY;
    const distance = Math.sqrt(distX * distX + distY * distY);
    
    if (distance < INTERACTION_RADIUS) {
      const force = (INTERACTION_RADIUS - distance) / INTERACTION_RADIUS;
      vx -= (distX / distance) * force * REPULSION;
      vy -= (distY / distance) * force * REPULSION;
    }
  }

  vx *= FRICTION;
  vy *= FRICTION;
  dx += vx;
  dy += vy;

  return { dx, dy, vx, vy, x: rawX + dx, y: rawY + dy };
}

function drawDNA() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  
  dnaCtx.clearRect(0, 0, w, h);
  
  // --- RESPONSIVE FIXES ---
  // Center on PC, but push to the right edge (85% of screen width) on mobile/tablet
  const centerX = w < 950 ? w * 0.85 : w / 2;
  
  // Reduce the width (amplitude) of the DNA spiral on smaller screens
  const maxAmplitude = w < 480 ? 40 : (w < 950 ? 70 : 180); 
  
  // Lower the opacity on mobile/tablet so it acts like a watermark
  const opacityMultiplier = w < 950 ? 0.4 : 1.0; 
  // ------------------------

  const time = Date.now() * 0.0003; 
  const scrollRotation = scrollPos * 0.004; 
  const totalRotation = time + scrollRotation;

  const dotColorMain = isLightMode ? 'rgba(10, 10, 10, 0.4)' : 'rgba(255, 255, 255, 0.5)';
  const dotColorAccent = '#ff9f43'; 
  
  // Adjust line color opacity based on screen size
  const baseLineAlpha = (isLightMode ? 0.1 : 0.1) * opacityMultiplier;
  const lineColor = `rgba(${isLightMode ? '0,0,0' : '255,255,255'}, ${baseLineAlpha})`;

  for(let i = 0; i < nodes; i++) {
    const progressVal = i / nodes; 
    const baseY = (h * 0.05) + (progressVal * h * 0.9);
    const amplitude = 15 + Math.pow(progressVal, 1.8) * maxAmplitude; 
    const angle = (progressVal * Math.PI * 12) + totalRotation; 

    const rawX1 = centerX + Math.cos(angle) * amplitude;
    const rawX2 = centerX + Math.cos(angle + Math.PI) * amplitude; 
    const z1 = Math.sin(angle);
    const z2 = Math.sin(angle + Math.PI);

    const p = particles[i];
    
    const state1 = applyPhysics(rawX1, baseY, p.dx1, p.dy1, p.vx1, p.vy1);
    p.dx1 = state1.dx; p.dy1 = state1.dy; p.vx1 = state1.vx; p.vy1 = state1.vy;
    
    const state2 = applyPhysics(rawX2, baseY, p.dx2, p.dy2, p.vx2, p.vy2);
    p.dx2 = state2.dx; p.dy2 = state2.dy; p.vx2 = state2.vx; p.vy2 = state2.vy;

    const lineDist = Math.sqrt(Math.pow(state2.x - state1.x, 2) + Math.pow(state2.y - state1.y, 2));
    const originalDist = Math.abs(rawX2 - rawX1); 
    const stretchRatio = Math.max(0, 1 - (lineDist - originalDist) / 100);

    // Draw connecting lines
    dnaCtx.beginPath();
    dnaCtx.moveTo(state1.x, state1.y);
    dnaCtx.lineTo(state2.x, state2.y);
    dnaCtx.strokeStyle = lineColor;
    dnaCtx.globalAlpha = stretchRatio * opacityMultiplier; 
    dnaCtx.lineWidth = 1;
    dnaCtx.stroke();

    // Draw Circle 1
    const radius1 = Math.max(0.1, 2 + z1 * 1.5);
    dnaCtx.fillStyle = z1 > 0 ? dotColorAccent : dotColorMain; 
    dnaCtx.globalAlpha = (0.3 + ((z1 + 1) / 2) * 0.7) * opacityMultiplier; 
    dnaCtx.beginPath();
    dnaCtx.arc(state1.x, state1.y, radius1, 0, Math.PI * 2);
    dnaCtx.fill();

    // Draw Circle 2
    const radius2 = Math.max(0.1, 2 + z2 * 1.5);
    dnaCtx.fillStyle = z2 > 0 ? dotColorAccent : dotColorMain; 
    dnaCtx.globalAlpha = (0.3 + ((z2 + 1) / 2) * 0.7) * opacityMultiplier; 
    dnaCtx.beginPath();
    dnaCtx.arc(state2.x, state2.y, radius2, 0, Math.PI * 2);
    dnaCtx.fill();
    
    dnaCtx.globalAlpha = 1.0; 
  }
  
  requestAnimationFrame(drawDNA);
}
