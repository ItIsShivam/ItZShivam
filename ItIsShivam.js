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

// ====== BACKGROUND CANVAS: INTERACTIVE PARTICLE NETWORK ======
const bgCanvas = document.getElementById('dnaCanvas'); // Kept ID same so HTML doesn't change
const bgCtx = bgCanvas.getContext('2d');

let particlesArray = [];
let isMobileBg = window.innerWidth < 768;

// Mouse tracking for interaction
let mouse = {
  x: null,
  y: null,
  radius: isMobileBg ? 80 : 150 
};

// Track mouse movements
window.addEventListener('mousemove', (event) => {
  mouse.x = event.x;
  mouse.y = event.y;
});

// Prevent particles from sticking to mouse when cursor leaves the window
window.addEventListener('mouseout', () => {
  mouse.x = null;
  mouse.y = null;
});

// Handle high-res screens and window resizing seamlessly
function resizeBgCanvas() {
  const dpr = window.devicePixelRatio || 1;
  bgCanvas.width = window.innerWidth * dpr;
  bgCanvas.height = window.innerHeight * dpr;
  bgCtx.scale(dpr, dpr);
  isMobileBg = window.innerWidth < 768;
  initParticles(); // Re-scatter dots to fit new screen size
}
window.addEventListener('resize', resizeBgCanvas);

// Blueprint for a single particle
class Particle {
  constructor() {
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.size = Math.random() * 2 + 1; // Random dot size
    this.speedX = (Math.random() - 0.5) * 1.2; // Slow drift
    this.speedY = (Math.random() - 0.5) * 1.2;
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    // Bounce smoothly off the edges of the screen
    if (this.x < 0 || this.x > window.innerWidth) this.speedX = -this.speedX;
    if (this.y < 0 || this.y > window.innerHeight) this.speedY = -this.speedY;

    // Interactive mouse repel calculation (Pythagorean theorem)
    if (mouse.x != null && mouse.y != null) {
      let dx = mouse.x - this.x;
      let dy = mouse.y - this.y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < mouse.radius) {
        const forceDirectionX = dx / distance;
        const forceDirectionY = dy / distance;
        const force = (mouse.radius - distance) / mouse.radius;
        const maxSpeed = 3;
        
        // Push particle away from cursor
        this.x -= forceDirectionX * force * maxSpeed;
        this.y -= forceDirectionY * force * maxSpeed;
      }
    }
  }
  
  draw(dotColor) {
    bgCtx.fillStyle = dotColor;
    bgCtx.beginPath();
    bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    bgCtx.fill();
  }
}

// Generate the network
function initParticles() {
  particlesArray = [];
  // Scale density down for mobile to save phone battery & performance
  const numberOfParticles = isMobileBg ? 50 : 120; 
  for (let i = 0; i < numberOfParticles; i++) {
    particlesArray.push(new Particle());
  }
}

// Animation loop
function animateParticles() {
  bgCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  
  // Theme awareness checks
  const isLightMode = document.body.classList.contains('light');
  const dotColor = isLightMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.3)';
  
  // Update & connect logic
  for (let i = 0; i < particlesArray.length; i++) {
    particlesArray[i].update();
    particlesArray[i].draw(dotColor);
    
    // Check distance between all particles to draw connecting lines
    for (let j = i; j < particlesArray.length; j++) {
      let dx = particlesArray[i].x - particlesArray[j].x;
      let dy = particlesArray[i].y - particlesArray[j].y;
      let distance = Math.sqrt(dx * dx + dy * dy);
      
      // If dots are close enough, draw a line between them
      if (distance < 110) {
        // Line fades out the further apart the dots drift
        let opacity = 1 - (distance / 110);
        
        // Theme-aware laser lines (Dark mode gets the orange accent!)
        bgCtx.strokeStyle = isLightMode 
          ? `rgba(0, 0, 0, ${opacity * 0.15})` 
          : `rgba(255, 159, 67, ${opacity * 0.35})`; 
          
        bgCtx.lineWidth = 1.5;
        bgCtx.beginPath();
        bgCtx.moveTo(particlesArray[i].x, particlesArray[i].y);
        bgCtx.lineTo(particlesArray[j].x, particlesArray[j].y);
        bgCtx.stroke();
      }
    }
  }
  requestAnimationFrame(animateParticles);
}

// Kickoff
resizeBgCanvas();
animateParticles();
