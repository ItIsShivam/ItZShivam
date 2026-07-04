// ====== SYSTEM-AWARE THEME LOADING & LIVE SYNC ======
const savedTheme = localStorage.getItem("theme");

// Default to Light Mode, but check system preferences
let isLightMode = true; 

// 1. Initial Load Check
if (savedTheme !== null) {
  // Respect previously saved choice
  isLightMode = savedTheme === "light"; 
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  // Match system dark mode
  isLightMode = false; 
}

// Function to apply the theme to the DOM
function applyTheme() {
  if (isLightMode) {
    document.body.classList.add("light");
    document.body.classList.remove("dark");
  } else {
    document.body.classList.add("dark");
    document.body.classList.remove("light");
  }
}

// Apply initially
applyTheme();

// 2. LIVE SYSTEM THEME LISTENER
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  // event.matches is true if the system just switched to Dark Mode
  isLightMode = !event.matches;
  
  // Apply the new theme immediately
  applyTheme();
  
  // Update local storage so the new system preference is remembered
  localStorage.setItem("theme", isLightMode ? "light" : "dark");
});

// Update the manual toggle function to use the new applyTheme helper
function toggleTheme() {
  isLightMode = !isLightMode;
  applyTheme();
  localStorage.setItem("theme", isLightMode ? "light" : "dark");
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
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  
  if (!analyser) {
    source = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();

    analyser.fftSize = 128;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }
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

// ====== BACKGROUND CANVAS: INTERACTIVE THREE.JS WEBGL ENGINE ======
let scene, camera, renderer;
let dnaGroup, fluidPoints, burstPoints;
let fluidPositions, fluidBasePositions, fluidVelocities, fluidDisplacements;
let burstPositions, burstVelocities, burstAges, burstMaxAges;
const maxBurstParticles = 180;
let burstIndex = 0;

// DNA Helix specific variables
let strand1Geo, strand2Geo, connectionLines;
let dnaNodes, helixRadius, helixHeight, turns;
let dnaDust, dustStates, dustCount, dustMaterial;
let dnaPulseProgress = 1.5; // active when < 1.2
let dnaGroupInner, backbone1, backbone2;

// Interactive Playground Configuration Parameters (Bending locked to 0)
let pgDnaSpeed = 1.0;
let pgDnaBend = 0.0; // DNA completely stable, does not bend with cursor moves
let pgOceanWaveHeight = 12;
let pgTrailSize = 4;

// Scroll velocity tracking states
let lastScrollY = window.scrollY || document.documentElement.scrollTop;
let scrollVelocity = 0;

// Custom Cursor & Trail overlay variables
let cursorDot, cursorRing, cursorTrailCanvas, cursorTrailCtx;
let targetX = 0, targetY = 0;
let currentX = 0, currentY = 0;
let particles = [];
let cursorActive = false;

let mouse = new THREE.Vector2(-9999, -9999);
let raycaster = new THREE.Raycaster();
let interactionPlane;
let targetMousePos = new THREE.Vector3(0, 0, -50);
let currentMousePos = new THREE.Vector3(0, 0, -50);

// Interaction states
let isMouseDown = false;
let scrollRatio = 0;

// Responsive settings
let gridCols = window.innerWidth < 768 ? 45 : (window.innerWidth < 1024 ? 55 : 70);
let gridRows = window.innerWidth < 768 ? 70 : (window.innerWidth < 1024 ? 70 : 65);
const gridSpacing = 6;
const interactionRadius = 75;
const springStrength = 0.045;
const frictionStrength = 0.84;
const repulsionStrength = 24;

function initThree() {
  const container = document.getElementById('webgl-canvas');
  if (!container) return;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.z = 220;

  // Renderer
  renderer = new THREE.WebGLRenderer({ canvas: container, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // Invisible Plane for Raycasting (at z = -50, depth of fluid grid)
  const planeGeo = new THREE.PlaneGeometry(2000, 2000);
  const planeMat = new THREE.MeshBasicMaterial({ visible: false });
  interactionPlane = new THREE.Mesh(planeGeo, planeMat);
  interactionPlane.position.z = -50;
  scene.add(interactionPlane);

  // Glow Texture
  const glowTexture = createGlowTexture();

  // --- 1. DNA HELIX BUILD ---
  dnaGroup = new THREE.Group();
  scene.add(dnaGroup);

  // Set outer group vertical and stable (anchored at top/bottom, bends in middle)
  dnaGroup.rotation.z = 0;
  dnaGroup.rotation.x = 0;

  dnaGroupInner = new THREE.Group();
  dnaGroup.add(dnaGroupInner);

  // Real human DNA: Higher node density and unequal Major/Minor Groove angles
  dnaNodes = window.innerWidth < 768 ? 55 : 95;
  helixRadius = window.innerWidth < 768 ? 22 : 36;
  helixHeight = 280; // slightly taller to fully cover the scroll height
  turns = 4.0; // 4 full turns
  const majorMinorOffset = 2.2; // 126 degrees offset instead of 180 degrees (Math.PI) to create real human major/minor grooves!
  
  strand1Geo = new THREE.BufferGeometry();
  strand2Geo = new THREE.BufferGeometry();
  const strand1Pos = new Float32Array(dnaNodes * 3);
  const strand2Pos = new Float32Array(dnaNodes * 3);
  const lineIndices = [];
  const linePositions = new Float32Array(dnaNodes * 2 * 3);

  for (let i = 0; i < dnaNodes; i++) {
    const t = i / dnaNodes;
    const angle = t * turns * Math.PI * 2;
    const y = (t - 0.5) * helixHeight;
    
    // Strand 1
    const x1 = Math.cos(angle) * helixRadius;
    const z1 = Math.sin(angle) * helixRadius;
    strand1Pos[i * 3] = x1;
    strand1Pos[i * 3 + 1] = y;
    strand1Pos[i * 3 + 2] = z1;

    // Strand 2 (using asymmetric offset to create the major and minor grooves of real DNA)
    const x2 = Math.cos(angle + majorMinorOffset) * helixRadius;
    const z2 = Math.sin(angle + majorMinorOffset) * helixRadius;
    strand2Pos[i * 3] = x2;
    strand2Pos[i * 3 + 1] = y;
    strand2Pos[i * 3 + 2] = z2;

    // Connecting line positions (rungs)
    linePositions[i * 6] = x1;
    linePositions[i * 6 + 1] = y;
    linePositions[i * 6 + 2] = z1;
    linePositions[i * 6 + 3] = x2;
    linePositions[i * 6 + 4] = y;
    linePositions[i * 6 + 5] = z2;

    lineIndices.push(i * 2, i * 2 + 1);
  }

  strand1Geo.setAttribute('position', new THREE.BufferAttribute(strand1Pos, 3));
  strand2Geo.setAttribute('position', new THREE.BufferAttribute(strand2Pos, 3));

  const dnaNodeMaterial1 = new THREE.PointsMaterial({
    size: window.innerWidth < 768 ? 6 : 8.5,
    map: glowTexture,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });

  const dnaNodeMaterial2 = new THREE.PointsMaterial({
    size: window.innerWidth < 768 ? 4 : 5.5,
    map: glowTexture,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });

  const points1 = new THREE.Points(strand1Geo, dnaNodeMaterial1);
  const points2 = new THREE.Points(strand2Geo, dnaNodeMaterial2);
  dnaGroupInner.add(points1);
  dnaGroupInner.add(points2);

  // Add the continuous, glowing double helix backbones connecting the points!
  const dnaBackboneMaterial = new THREE.LineBasicMaterial({
    transparent: true,
    opacity: 0.55,
    linewidth: 1.5
  });
  
  backbone1 = new THREE.Line(strand1Geo, dnaBackboneMaterial);
  backbone2 = new THREE.Line(strand2Geo, dnaBackboneMaterial);
  dnaGroupInner.add(backbone1);
  dnaGroupInner.add(backbone2);

  // Connecting lines (rungs)
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setIndex(lineIndices);

  const dnaLineMaterial = new THREE.LineBasicMaterial({
    transparent: true,
    opacity: 0.28,
    linewidth: 1
  });

  connectionLines = new THREE.LineSegments(lineGeo, dnaLineMaterial);
  dnaGroupInner.add(connectionLines);

  // --- 1.1 DNA ORBITING DUST BUILD ---
  dustCount = window.innerWidth < 768 ? 60 : 120;
  const dustGeo = new THREE.BufferGeometry();
  const dustPosArray = new Float32Array(dustCount * 3);
  dustStates = [];

  for (let i = 0; i < dustCount; i++) {
    const t = Math.random();
    const y = (t - 0.5) * helixHeight;
    const angle = Math.random() * Math.PI * 2;
    const orbitRadius = helixRadius * (1.15 + Math.random() * 0.45);
    const speed = 0.008 + Math.random() * 0.018;

    dustStates.push({ t, angle, orbitRadius, speed, y });

    const x = Math.cos(angle) * orbitRadius;
    const z = Math.sin(angle) * orbitRadius;

    dustPosArray[i * 3] = x;
    dustPosArray[i * 3 + 1] = y;
    dustPosArray[i * 3 + 2] = z;
  }

  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPosArray, 3));

  dustMaterial = new THREE.PointsMaterial({
    size: window.innerWidth < 768 ? 2.5 : 4,
    map: glowTexture,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.4,
    depthWrite: false
  });

  dnaDust = new THREE.Points(dustGeo, dustMaterial);
  dnaGroupInner.add(dnaDust);

  // --- 2. FLUID PARTICLES BUILD ---
  const numParticles = gridCols * gridRows;
  const fluidGeo = new THREE.BufferGeometry();
  fluidPositions = new Float32Array(numParticles * 3);
  fluidBasePositions = new Float32Array(numParticles * 3);
  fluidVelocities = new Float32Array(numParticles * 3);
  fluidDisplacements = new Float32Array(numParticles * 3);

  const startX = -((gridCols - 1) * gridSpacing) / 2;
  const startY = -((gridRows - 1) * gridSpacing) / 2;

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const idx = r * gridCols + c;
      const x = startX + c * gridSpacing;
      const y = startY + r * gridSpacing;
      const z = -50; // rested position

      fluidPositions[idx * 3] = x;
      fluidPositions[idx * 3 + 1] = y;
      fluidPositions[idx * 3 + 2] = z;

      fluidBasePositions[idx * 3] = x;
      fluidBasePositions[idx * 3 + 1] = y;
      fluidBasePositions[idx * 3 + 2] = z;

      fluidVelocities[idx * 3] = 0;
      fluidVelocities[idx * 3 + 1] = 0;
      fluidVelocities[idx * 3 + 2] = 0;

      fluidDisplacements[idx * 3] = 0;
      fluidDisplacements[idx * 3 + 1] = 0;
      fluidDisplacements[idx * 3 + 2] = 0;
    }
  }

  fluidGeo.setAttribute('position', new THREE.BufferAttribute(fluidPositions, 3));

  const fluidMaterial = new THREE.PointsMaterial({
    size: window.innerWidth < 768 ? 4 : 5.5,
    map: glowTexture,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });

  fluidPoints = new THREE.Points(fluidGeo, fluidMaterial);
  scene.add(fluidPoints);

  // --- 3. BURST/TRAIL PARTICLES BUILD ---
  const burstGeo = new THREE.BufferGeometry();
  burstPositions = new Float32Array(maxBurstParticles * 3);
  burstVelocities = new Float32Array(maxBurstParticles * 3);
  burstAges = new Int16Array(maxBurstParticles);
  burstMaxAges = new Int16Array(maxBurstParticles);

  // Initialize off-screen
  for (let i = 0; i < maxBurstParticles; i++) {
    burstPositions[i * 3] = 9999;
    burstPositions[i * 3 + 1] = 9999;
    burstPositions[i * 3 + 2] = 9999;
    burstAges[i] = 999;
    burstMaxAges[i] = 0;
  }

  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));

  const burstMaterial = new THREE.PointsMaterial({
    size: window.innerWidth < 768 ? 3.5 : 5,
    map: glowTexture,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
  });

  burstPoints = new THREE.Points(burstGeo, burstMaterial);
  scene.add(burstPoints);

  // Store references for animation loop
  window.threeState = {
    dnaNodeMaterial1,
    dnaNodeMaterial2,
    dnaLineMaterial,
    dnaBackboneMaterial,
    fluidMaterial,
    burstMaterial,
    dustMaterial,
    connectionLines
  };

  // Initialize Custom Cursor
  initCustomCursor();

  // Add event listeners
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('touchmove', onTouchMove, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  window.addEventListener('touchend', onMouseUp);
  
  // Track scroll position ratio
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // initial call

  window.addEventListener('resize', onResize);

  animate();
}

function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.18)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(canvas);
}

function spawnParticles(origin, count) {
  for (let i = 0; i < count; i++) {
    const idx = burstIndex;
    burstIndex = (burstIndex + 1) % maxBurstParticles;
    
    // Set position at raycast click origin
    burstPositions[idx * 3] = origin.x + (Math.random() - 0.5) * 4;
    burstPositions[idx * 3 + 1] = origin.y + (Math.random() - 0.5) * 4;
    burstPositions[idx * 3 + 2] = origin.z + (Math.random() - 0.5) * 4;

    // Direct radial velocity + randomized drift
    const speed = 1.2 + Math.random() * 2.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    
    burstVelocities[idx * 3] = Math.sin(phi) * Math.cos(theta) * speed;
    burstVelocities[idx * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    burstVelocities[idx * 3 + 2] = Math.cos(phi) * speed;

    burstAges[idx] = 0;
    burstMaxAges[idx] = 25 + Math.random() * 20; // age limits
  }
}

function onMouseMove(e) {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  
  if (mouse.x > -999) {
    spawnParticles(currentMousePos, isMouseDown ? 4 : 1);
  }
}

function onTouchMove(e) {
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const clientX = touch.pageX - scrollX;
    const clientY = touch.pageY - scrollY;
    
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    spawnParticles(currentMousePos, isMouseDown ? 4 : 1);
  }
}

function onTouchStart(e) {
  isMouseDown = true;
  onTouchMove(e);
  // Trigger larger splash on touch tap
  spawnParticles(currentMousePos, 15);
  dnaPulseProgress = -0.15; // Trigger DNA energy shockwave ripple
}

function onMouseDown() {
  isMouseDown = true;
  spawnParticles(currentMousePos, 20); // click splash
  dnaPulseProgress = -0.15; // Trigger DNA energy shockwave ripple
}

function onMouseUp() {
  isMouseDown = false;
}

function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  scrollRatio = maxScroll > 0 ? window.scrollY / maxScroll : 0;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  // Re-adjust DNA parameters
  const isMobile = window.innerWidth < 768;
  window.threeState.dnaNodeMaterial1.size = isMobile ? 5.5 : 8;
  window.threeState.dnaNodeMaterial2.size = isMobile ? 4 : 5.5;
  window.threeState.fluidMaterial.size = isMobile ? 4 : 5.5;
  window.threeState.burstMaterial.size = isMobile ? 3.5 : 5;
  if (window.threeState.dustMaterial) {
    window.threeState.dustMaterial.size = isMobile ? 2.5 : 4;
  }
}

const targetDnaColor = new THREE.Color();
const targetFluidColor = new THREE.Color();

// Helper to interpolate between multiple color stops based on scroll ratio
function getMultiLerpColor(colors, ratio) {
  const segments = colors.length - 1;
  const scaledRatio = ratio * segments;
  const index = Math.min(segments - 1, Math.floor(scaledRatio));
  const t = scaledRatio - index;
  
  const c1 = colors[index];
  const c2 = colors[index + 1];
  
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  
  return [r, g, b];
}

let time = 0;
function animate() {
  requestAnimationFrame(animate);

  // --- 0. AUDIO FREQUENCY ANALYSIS FOR REACTOR ---
  let audioIntensity = 0;
  let bassBoost = 0;

  if (isPlaying && analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    let bassSum = 0;
    const len = dataArray.length;
    const bassBins = Math.max(1, Math.floor(len * 0.25)); // First 25% bins represent bass
    
    for (let i = 0; i < len; i++) {
      sum += dataArray[i];
      if (i < bassBins) {
        bassSum += dataArray[i];
      }
    }
    audioIntensity = sum / len / 255;
    bassBoost = bassSum / bassBins / 255;
  }

  // Modulate time step based on audio intensity
  time += 0.015 + audioIntensity * 0.025;

  // --- 1. DNA ROTATION, SCALING & PARALLAX ---
  // Decay scroll velocity towards 0 slowly
  scrollVelocity *= 0.94;

  // Rotation speed formula: base slow spin (0.005) + scroll speed add + audio beat boost
  const scrollRotationAdd = Math.min(0.09, scrollVelocity * 0.0035);
  const audioRotationAdd = audioIntensity * 0.025;
  const stepRotation = (0.005 + scrollRotationAdd + audioRotationAdd) * pgDnaSpeed;

  // Spin DNA sideways around its own vertical Y-axis (axial rotation)
  if (dnaGroupInner) {
    dnaGroupInner.rotation.y += stepRotation;
  }
  
  // Keep the outer DNA group vertically stable (fixed X and Z axes, top/bottom fixed)
  dnaGroup.rotation.z = 0;
  dnaGroup.rotation.x = 0;

  // Pulse DNA helix scale to the beat of the bass
  const dnaScale = 1.0 + bassBoost * 0.14;
  dnaGroup.scale.set(dnaScale, dnaScale, dnaScale);

  // Scroll-Driven Camera Descent path & mouse parallax tilt
  let targetCamX = 0;
  let targetCamY = -scrollRatio * 150; // Descend up to 150 units as you scroll down
  
  if (mouse.x > -999) {
    targetCamX = mouse.x * 28;
    targetCamY += mouse.y * 22;
  }
  camera.position.x += (targetCamX - camera.position.x) * 0.04;
  camera.position.y += (targetCamY - camera.position.y) * 0.04;
  camera.lookAt(0, -scrollRatio * 150, -20); // Look at camera's center height

  // Responsive Horizontal Offset
  // Centered DNA at center-stage (0) for both desktop and mobile as requested!
  const targetDnaX = 0;
  dnaGroup.position.x += (targetDnaX - dnaGroup.position.x) * 0.04;
  
  // Slide DNA vertically to stay in camera view as scroll ratio increases
  dnaGroup.position.y = -scrollRatio * 150;

  // --- 1.2 DYNAMIC DNA HELIX UNDULATION & ORBITING DUST ---
  if (dnaPulseProgress < 1.25) {
    dnaPulseProgress += 0.018; // Speed of propagation along the helix
  }

  // Adjust line segment opacity dynamically during click pulse
  if (window.threeState.dnaLineMaterial) {
    let linePulseAmt = 0;
    if (dnaPulseProgress >= -0.15 && dnaPulseProgress <= 1.25) {
      linePulseAmt = Math.max(0, 1.0 - Math.min(1.0, Math.abs(0.5 - dnaPulseProgress) * 2.0));
    }
    window.threeState.dnaLineMaterial.opacity = 0.28 + linePulseAmt * 0.48;
  }

  if (strand1Geo && strand2Geo && connectionLines) {
    const pos1 = strand1Geo.attributes.position.array;
    const pos2 = strand2Geo.attributes.position.array;
    const posLine = connectionLines.geometry.attributes.position.array;
    
    // Sideways bending calculations based on mouse coordinates (anchored at ends)
    const targetBendX = currentMousePos.x * 20 * pgDnaBend;
    const targetBendZ = currentMousePos.y * 20 * pgDnaBend;

    for (let i = 0; i < dnaNodes; i++) {
      const t = i / dnaNodes;
      const angle = t * turns * Math.PI * 2;
      
      // Calculate local pulse force if shockwave is near height t
      let pulseForce = 0;
      if (dnaPulseProgress >= -0.15 && dnaPulseProgress <= 1.25) {
        const pulseDist = Math.abs(t - dnaPulseProgress);
        if (pulseDist < 0.16) {
          pulseForce = (0.16 - pulseDist) / 0.16; // ranges 0 to 1
        }
      }

      // Sine envelope: 0 at top and bottom (t=0, t=1), peaking at 1 in the middle
      const bendFactor = Math.sin(t * Math.PI);
      const bendX = targetBendX * bendFactor;
      const bendZ = targetBendZ * bendFactor;

      // Calculate dynamic wavy undulation and pulsing radius based on time and vertical position t
      // Add extra ripple and radius expansion from the energy shockwave click pulse
      const waveOffset = Math.sin(t * 8 - time * 2.2) * 5 + Math.cos(time * 14 + t * 25) * 10 * pulseForce;
      const currentRadius = (helixRadius + Math.cos(t * 5 + time * 3) * 3 * (1.0 + bassBoost * 1.5)) * (1.0 + pulseForce * 0.4);
      
      const y = (t - 0.5) * helixHeight;
      
      // Strand 1 Position (bent sideways organically, top and bottom anchored at 0)
      const x1 = Math.cos(angle) * currentRadius + bendX;
      const z1 = Math.sin(angle) * currentRadius + waveOffset + bendZ;
      pos1[i * 3] = x1;
      pos1[i * 3 + 1] = y;
      pos1[i * 3 + 2] = z1;
      
      // Strand 2 Position (offset by asymmetric 2.2 radians + bent sideways organically)
      const x2 = Math.cos(angle + 2.2) * currentRadius + bendX;
      const z2 = Math.sin(angle + 2.2) * currentRadius + waveOffset + bendZ;
      pos2[i * 3] = x2;
      pos2[i * 3 + 1] = y;
      pos2[i * 3 + 2] = z2;
      
      // Connection Line Positions (two points: start = strand 1, end = strand 2)
      posLine[i * 6] = x1;
      posLine[i * 6 + 1] = y;
      posLine[i * 6 + 2] = z1;
      posLine[i * 6 + 3] = x2;
      posLine[i * 6 + 4] = y;
      posLine[i * 6 + 5] = z2;
    }
    
    strand1Geo.attributes.position.needsUpdate = true;
    strand2Geo.attributes.position.needsUpdate = true;
    connectionLines.geometry.attributes.position.needsUpdate = true;
  }

  // Update DNA Dust Particles Orbiting DNA helix
  if (dnaDust && dustStates) {
    const dustPos = dnaDust.geometry.attributes.position.array;
    const targetBendX = currentMousePos.x * 20 * pgDnaBend;
    const targetBendZ = currentMousePos.y * 20 * pgDnaBend;

    for (let i = 0; i < dustCount; i++) {
      const state = dustStates[i];
      // Spin around DNA, speed increased by music intensity
      state.angle += state.speed * (1.0 + audioIntensity * 2.2);
      
      // Match the main helix bending envelope
      const bendFactor = Math.sin(state.t * Math.PI);
      const bendX = targetBendX * bendFactor;
      const bendZ = targetBendZ * bendFactor;

      // Orbit radius oscillates slightly
      const currentRadius = state.orbitRadius + Math.sin(time * 1.5 + state.y * 0.04) * 5 * (1.0 + bassBoost);
      const x = Math.cos(state.angle) * currentRadius + bendX;
      const z = Math.sin(state.angle) * currentRadius + bendZ;
      
      dustPos[i * 3] = x;
      dustPos[i * 3 + 1] = state.y;
      dustPos[i * 3 + 2] = z;
    }
    dnaDust.geometry.attributes.position.needsUpdate = true;
  }

  // Animate custom 2D cursor and trail particles overlay
  animateCursorRing();
  updateTrailParticles();

  // --- 2. THEME-BASED COLOR LERPING & NODE PULSING (SCROLL COLOR SHIFTS) ---
  let activeRGB;
  if (isLightMode) {
    const colors = [
      [5, 150, 105],   // Emerald Green (Hero)
      [29, 78, 216],   // Cobalt Blue (Terminal)
      [126, 34, 206],  // Grape Purple (Analytics)
      [190, 18, 60]    // Crimson Rose (Sandbox/Footer)
    ];
    activeRGB = getMultiLerpColor(colors, scrollRatio);
    targetDnaColor.setRGB(activeRGB[0] / 255, activeRGB[1] / 255, activeRGB[2] / 255);
    targetFluidColor.set('#10b981'); // Soft minty green-teal
  } else {
    const colors = [
      [255, 159, 67],  // Neon Orange (Hero)
      [217, 70, 239],  // Magenta (Terminal)
      [0, 210, 255],   // Electric Teal (Analytics)
      [0, 255, 170]    // Neon Green (Sandbox/Footer)
    ];
    activeRGB = getMultiLerpColor(colors, scrollRatio);
    targetDnaColor.setRGB(activeRGB[0] / 255, activeRGB[1] / 255, activeRGB[2] / 255);
    targetFluidColor.setRGB(activeRGB[0] / 255 * 0.85, activeRGB[1] / 255 * 0.85, activeRGB[2] / 255 * 0.85);
  }

  // Update dynamic CSS variables so cursor and borders shift color on scroll
  const hexColor = `#${((1 << 24) + (activeRGB[0] << 16) + (activeRGB[1] << 8) + activeRGB[2]).toString(16).slice(1)}`;
  document.documentElement.style.setProperty('--accent', hexColor);
  document.documentElement.style.setProperty('--accent-rgb', `${activeRGB[0]}, ${activeRGB[1]}, ${activeRGB[2]}`);
  
  window.threeState.dnaNodeMaterial1.color.lerp(targetDnaColor, 0.08);
  window.threeState.dnaNodeMaterial2.color.lerp(targetDnaColor, 0.08);
  window.threeState.dnaLineMaterial.color.lerp(targetDnaColor, 0.08);
  if (window.threeState.dnaBackboneMaterial) {
    window.threeState.dnaBackboneMaterial.color.lerp(targetDnaColor, 0.08);
  }
  window.threeState.fluidMaterial.color.lerp(targetFluidColor, 0.08);
  window.threeState.burstMaterial.color.lerp(targetDnaColor, 0.08); // sparks use DNA color
  if (window.threeState.dustMaterial) {
    window.threeState.dustMaterial.color.lerp(targetDnaColor, 0.08); // dust particles match DNA color
  }

  // Dynamic particle scaling on musical beats
  const isMobile = window.innerWidth < 768;
  window.threeState.dnaNodeMaterial1.size = (isMobile ? 5.5 : 8) * (1.0 + bassBoost * 0.35);
  window.threeState.dnaNodeMaterial2.size = (isMobile ? 4 : 5.5) * (1.0 + bassBoost * 0.35);
  window.threeState.fluidMaterial.size = (isMobile ? 4 : 5.5) * (1.0 + audioIntensity * 0.3);
  if (window.threeState.dustMaterial) {
    window.threeState.dustMaterial.size = (isMobile ? 2.5 : 4) * (1.0 + bassBoost * 0.3);
  }

  // --- 3. FLUID PHYSICS SIMULATION ---
  // Raycast to find mouse 3D world coordinate on fluid depth plane (z = -50)
  if (mouse.x > -999) {
    if (interactionPlane) {
      interactionPlane.position.y = camera.position.y * 0.94;
    }
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(interactionPlane);
    if (intersects.length > 0) {
      targetMousePos.copy(intersects[0].point);
    }
  }

  // Smooth mouse coordinates
  currentMousePos.lerp(targetMousePos, 0.08);

  const numParticles = gridCols * gridRows;
  const positionAttribute = fluidPoints.geometry.attributes.position;
  
  for (let i = 0; i < numParticles; i++) {
    const idx = i * 3;
    const bx = fluidBasePositions[idx];
    const by = fluidBasePositions[idx + 1];
    const bz = fluidBasePositions[idx + 2];

    // Swell background waves in sync with bass beat intensity
    const wave = Math.sin(bx * 0.015 + time * 1.5) * Math.cos(by * 0.015 + time * 1.5) * (pgOceanWaveHeight + bassBoost * 18);

    // Displacements
    let dx = fluidDisplacements[idx];
    let dy = fluidDisplacements[idx + 1];
    let dz = fluidDisplacements[idx + 2];

    // Velocities
    let vx = fluidVelocities[idx];
    let vy = fluidVelocities[idx + 1];
    let vz = fluidVelocities[idx + 2];

    // Current particle position (resting position + physical displacement + scrolling parallax)
    const px = bx + dx;
    const py = by + dy + (camera.position.y * 0.94);
    const pz = bz + dz + wave;

    const distX = px - currentMousePos.x;
    const distY = py - currentMousePos.y;
    const distZ = pz - currentMousePos.z;
    const dist = Math.sqrt(distX * distX + distY * distY + distZ * distZ);

    // Apply repulsion force if within threshold radius
    if (dist < interactionRadius) {
      const force = (interactionRadius - dist) / interactionRadius;
      
      // Repel from cursor
      vx += (distX / (dist + 0.001)) * force * repulsionStrength * 0.14;
      vy += (distY / (dist + 0.001)) * force * repulsionStrength * 0.14;
      
      // Swirling vector flow field (adds water/vortex ripple effect)
      vx += -(distY / (dist + 0.001)) * force * repulsionStrength * 0.07;
      vy += (distX / (dist + 0.001)) * force * repulsionStrength * 0.07;
    }

    // Hooke's Law Spring Force pulling back to base coordinates
    vx += (0 - dx) * springStrength;
    vy += (0 - dy) * springStrength;
    vz += (0 - dz) * springStrength;

    // Dampen using friction coefficient
    vx *= frictionStrength;
    vy *= frictionStrength;
    vz *= frictionStrength;

    // Integrate
    dx += vx;
    dy += vy;
    dz += vz;

    // Save state back to buffers
    fluidDisplacements[idx] = dx;
    fluidDisplacements[idx + 1] = dy;
    fluidDisplacements[idx + 2] = dz;

    fluidVelocities[idx] = vx;
    fluidVelocities[idx + 1] = vy;
    fluidVelocities[idx + 2] = vz;

    // Set updated values in Three.js geometry positions buffer (with Y parallax following the camera)
    fluidPositions[idx] = bx + dx;
    fluidPositions[idx + 1] = by + dy + (camera.position.y * 0.94);
    fluidPositions[idx + 2] = bz + dz + wave;
  }

  positionAttribute.needsUpdate = true;

  // --- 4. BURST/TRAIL PARTICLES UPDATE ---
  const burstPosAttr = burstPoints.geometry.attributes.position;
  
  for (let i = 0; i < maxBurstParticles; i++) {
    if (burstAges[i] < burstMaxAges[i]) {
      burstAges[i]++;
      
      // Update position by velocity
      burstPositions[i * 3] += burstVelocities[i * 3];
      burstPositions[i * 3 + 1] += burstVelocities[i * 3 + 1];
      burstPositions[i * 3 + 2] += burstVelocities[i * 3 + 2];
      
      // Decay velocity (drag)
      burstVelocities[i * 3] *= 0.96;
      burstVelocities[i * 3 + 1] *= 0.96;
      burstVelocities[i * 3 + 2] *= 0.96;
      
      // Drift upwards slightly (smoke/heat effect)
      burstPositions[i * 3 + 1] += 0.12;
    } else {
      // Offscreen
      burstPositions[i * 3] = 9999;
      burstPositions[i * 3 + 1] = 9999;
      burstPositions[i * 3 + 2] = 9999;
    }
  }
  
  burstPosAttr.needsUpdate = true;

  renderer.render(scene, camera);
}

// Initialize all frontend portfolio subsystems
function initAllSystems() {
  initThree();
  initAnalyticsChart();
  initTextDecryption();
  initTerminal();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initAllSystems();
} else {
  document.addEventListener('DOMContentLoaded', initAllSystems);
}

// ====== INTERSECTION OBSERVER FOR SCROLL CARD REVEALS ======
const revealOptions = {
  root: null,
  rootMargin: '0px -10% -10% 0px', // slightly offset to trigger naturally
  threshold: 0.1
};

const cardRevealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      
      // Decrypt all data-decrypt headers inside the revealed card
      entry.target.querySelectorAll("[data-decrypt]").forEach(el => {
        decryptText(el);
      });
      
      // If the analytics panel is revealed, start the radar chart animation!
      if (entry.target.id === "analytics") {
        chartTriggered = true;
      }
      
      observer.unobserve(entry.target); // trigger once
    }
  });
}, revealOptions);

document.querySelectorAll('.hero, .portfolio-section').forEach(card => {
  cardRevealObserver.observe(card);
});

// ====== SEAMLESS CIRCULAR WAVE THEME TOGGLER ======
const themeToggleBtn = document.getElementById("themeToggleBtn");
if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", (e) => {
    let waveX = e.clientX;
    let waveY = e.clientY;

    // Fallback if triggered via keyboard event
    if (e.clientX === 0 && e.clientY === 0) {
      const rect = themeToggleBtn.getBoundingClientRect();
      waveX = rect.left + rect.width / 2;
      waveY = rect.top + rect.height / 2;
    }

    let waveEl = document.getElementById("theme-wave");
    if (!waveEl) {
      waveEl = document.createElement("div");
      waveEl.id = "theme-wave";
      document.body.appendChild(waveEl);
    }

    const nextIsLight = !isLightMode;
    const targetBgColor = nextIsLight ? "#f3f7f9" : "#0b131a";

    // Position overlay wave at cursor coordinates
    waveEl.style.setProperty("--wave-x", `${waveX}px`);
    waveEl.style.setProperty("--wave-y", `${waveY}px`);
    waveEl.style.setProperty("--wave-bg", targetBgColor);

    // Expand the wave circle
    waveEl.classList.add("active");

    // Toggle theme state halfway through circular transition expansion
    setTimeout(() => {
      isLightMode = nextIsLight;
      applyTheme();
      localStorage.setItem("theme", isLightMode ? "light" : "dark");
    }, 450);

    // Fade out and reset wave overlay circle once transition finishes
    setTimeout(() => {
      waveEl.classList.remove("active");
    }, 950);
  });
}

// ====== CUSTOM CURSOR & TRAIL PARTICLES OVERLAY ENGINE ======
class TrailParticle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * (pgTrailSize * 1.25) + (pgTrailSize * 0.5);
    this.speedX = (Math.random() - 0.5) * 1.6;
    this.speedY = (Math.random() - 0.5) * 1.6 - 0.3; // slight upward drift
    this.color = color;
    this.alpha = 1.0;
    this.decay = Math.random() * 0.02 + 0.015;
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.alpha -= this.decay;
    if (this.size > 0.1) this.size -= (pgTrailSize * 0.02);
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.shadowBlur = 8;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function initCustomCursor() {
  cursorDot = document.getElementById("custom-cursor-dot");
  cursorRing = document.getElementById("custom-cursor-ring");
  cursorTrailCanvas = document.getElementById("cursor-trail-canvas");
  
  if (!cursorTrailCanvas) return;
  cursorTrailCtx = cursorTrailCanvas.getContext("2d");
  
  resizeTrailCanvas();
  
  // Monitor mouse movements
  window.addEventListener("mousemove", (e) => {
    if (window.innerWidth > 950) {
      if (!cursorActive) {
        if (cursorDot) cursorDot.style.opacity = "1";
        if (cursorRing) cursorRing.style.opacity = "1";
        cursorActive = true;
      }
      targetX = e.clientX;
      targetY = e.clientY;
      if (cursorDot) {
        cursorDot.style.transform = `translate(-50%, -50%) translate3d(${targetX}px, ${targetY}px, 0)`;
      }
    }
    
    // Spawn 2D trail particles
    const particleColor = isLightMode ? "rgba(5, 150, 105, 0.65)" : "rgba(255, 159, 67, 0.65)";
    spawnTrailParticle(e.clientX, e.clientY, particleColor);
  });

  // Support touch events for mobile drawing trail
  window.addEventListener("touchmove", (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const x = touch.pageX - scrollX;
      const y = touch.pageY - scrollY;
      const particleColor = isLightMode ? "rgba(5, 150, 105, 0.65)" : "rgba(255, 159, 67, 0.65)";
      spawnTrailParticle(x, y, particleColor);
    }
  }, { passive: true });

  window.addEventListener("touchstart", (e) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const x = touch.pageX - scrollX;
      const y = touch.pageY - scrollY;
      const particleColor = isLightMode ? "rgba(5, 150, 105, 0.65)" : "rgba(255, 159, 67, 0.65)";
      // Splash of particles on tap
      for (let i = 0; i < 8; i++) {
        spawnTrailParticle(x, y, particleColor);
      }
    }
  }, { passive: true });
  
  // Hide cursor when leaving page
  document.addEventListener("mouseleave", () => {
    if (cursorDot && cursorRing) {
      cursorDot.style.opacity = "0";
      cursorRing.style.opacity = "0";
    }
    cursorActive = false;
  });

  document.addEventListener("mouseenter", () => {
    if (window.innerWidth > 950 && cursorDot && cursorRing) {
      cursorDot.style.opacity = "1";
      cursorRing.style.opacity = "1";
      cursorActive = true;
    }
  });

  setupCursorInteractions();
}

function resizeTrailCanvas() {
  if (cursorTrailCanvas) {
    cursorTrailCanvas.width = window.innerWidth;
    cursorTrailCanvas.height = window.innerHeight;
    cursorTrailCanvas.style.width = window.innerWidth + "px";
    cursorTrailCanvas.style.height = window.innerHeight + "px";
  }
}

function setupCursorInteractions() {
  document.body.addEventListener("mouseover", (e) => {
    const target = e.target.closest("a, button, select, input, .skill-tag, .timeline-item, select option");
    if (target && cursorRing) {
      cursorRing.classList.add("hovering");
      cursorDot.classList.add("hovering");
    }
  });

  document.body.addEventListener("mouseout", (e) => {
    const target = e.target.closest("a, button, select, input, .skill-tag, .timeline-item, select option");
    if (target && cursorRing) {
      const related = e.relatedTarget;
      if (!related || !related.closest("a, button, select, input, .skill-tag, .timeline-item, select option")) {
        cursorRing.classList.remove("hovering");
        cursorDot.classList.remove("hovering");
      }
    }
  });
}

function animateCursorRing() {
  if (window.innerWidth > 950 && cursorRing) {
    currentX += (targetX - currentX) * 0.14;
    currentY += (targetY - currentY) * 0.14;
    cursorRing.style.transform = `translate(-50%, -50%) translate3d(${currentX}px, ${currentY}px, 0)`;
  }
}

function spawnTrailParticle(x, y, color) {
  const maxParticles = window.innerWidth < 768 ? 80 : 200;
  if (particles.length < maxParticles) {
    particles.push(new TrailParticle(x, y, color));
  }
}

function updateTrailParticles() {
  if (!cursorTrailCanvas || !cursorTrailCtx) return;
  cursorTrailCtx.clearRect(0, 0, cursorTrailCanvas.width, cursorTrailCanvas.height);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.update();
    if (p.alpha <= 0 || p.size <= 0.1) {
      particles.splice(i, 1);
    } else {
      p.draw(cursorTrailCtx);
    }
  }
}

// ====== FUTURE TEXT DECRYPTION SYSTEM ======
const decryptChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_+=*#&%!/?@$";

function decryptText(element) {
  if (!element) return;
  const originalText = element.dataset.original || element.textContent;
  if (!element.dataset.original) {
    element.dataset.original = originalText;
  }
  
  let iterations = 0;
  clearInterval(element.decryptInterval);
  
  element.decryptInterval = setInterval(() => {
    element.textContent = originalText
      .split("")
      .map((char, index) => {
        if (char === " ") return " ";
        if (index < iterations) return originalText[index];
        return decryptChars[Math.floor(Math.random() * decryptChars.length)];
      })
      .join("");
      
    if (iterations >= originalText.length) {
      clearInterval(element.decryptInterval);
    }
    iterations += 1 / 3; // Speed of decoding resolution
  }, 20);
}

function initTextDecryption() {
  document.querySelectorAll("[data-decrypt]").forEach(el => {
    el.addEventListener("mouseenter", () => {
      decryptText(el);
    });
  });
}

// ====== INTERACTIVE LINUX TERMINAL SYSTEM ======
function initTerminal() {
  const terminalInput = document.getElementById("terminal-input");
  const terminalBody = document.getElementById("terminal-body");
  const terminalContainer = document.querySelector(".terminal-container");

  if (!terminalInput || !terminalBody) return;

  terminalInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const command = terminalInput.value.trim();
      executeTerminalCommand(command, terminalBody);
      terminalInput.value = "";
    }
  });

  if (terminalContainer) {
    terminalContainer.addEventListener("click", () => {
      terminalInput.focus();
    });
  }
}

function executeTerminalCommand(command, bodyEl) {
  const normalizedCmd = command.trim().toLowerCase();
  
  // Output the user prompt line
  const promptLine = document.createElement("div");
  promptLine.className = "terminal-line user-cmd";
  promptLine.innerHTML = `<span class="terminal-prompt">shivam@debian:~$</span> ${command}`;
  
  const inputRow = bodyEl.querySelector(".terminal-input-line");
  bodyEl.insertBefore(promptLine, inputRow);
  
  const responseLine = document.createElement("div");
  responseLine.className = "terminal-line";

  const args = command.trim().split(/\s+/);
  const cmdBase = args[0].toLowerCase();

  switch (cmdBase) {
    case "help":
      responseLine.innerHTML = `Available commands:<br>
      - <span class="term-highlight">about</span> : Learn more about Souman Maity<br>
      - <span class="term-highlight">neofetch</span> : Show custom operating system specs<br>
      - <span class="term-highlight">skills</span> : Show technical and analytics tools<br>
      - <span class="term-highlight">ls</span> : List workspace file directory<br>
      - <span class="term-highlight">cat &lt;file&gt;</span> : Read a text file (e.g., cat bio.txt)<br>
      - <span class="term-highlight">crt</span> : Toggle retro holographic monitor CRT filter<br>
      - <span class="term-highlight">theme &lt;mode&gt;</span> : Set system theme (theme light | theme dark)<br>
      - <span class="term-highlight">contact</span> : Get in touch<br>
      - <span class="term-highlight">clear</span> : Clear output`;
      break;
    case "about":
      responseLine.innerHTML = `Souman Maity is a Business Operations Accounts & Sales Executive and an MBA Business/Data Analytics candidate. He is specialized in Custom Linux setups, financial administration, spreadsheet optimization, and workflow automation.`;
      break;
    case "neofetch":
      responseLine.innerHTML = `<pre class="neofetch-art">
   &nbsp;___&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>shivam@debian</b>
  / __|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-------------
 | |&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;OS: Debian GNU/Linux 13 (trixie) x86_64
 | |___&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Host: Inspiron 15-3552 (4.3.0)
  \\____|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Kernel: Linux 6.12.94+deb13-amd64
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Uptime: 1 hour, 41 mins
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Packages: 1709 (dpkg)
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Shell: bash 5.2.37
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;WM: Sway 1.10.1 (Wayland)
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Theme: catppuccin-mocha-teal [GTK2/3]
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Terminal: foot 1.21.0
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CPU: Intel Pentium N3710 (4) @ 2.56 GHz
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;GPU: Intel Integrated Graphics
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Memory: 2.77 GiB / 3.74 GiB (74%)
</pre>`;
      break;
    case "skills":
      responseLine.innerHTML = `Skills Matrix:<br>
      - Analytics: Tally ERP, MS Excel, Data Operations<br>
      - Dev: HTML5, CSS3, Javascript, Linux Admin<br>
      - OS: Debian Custom, Fedora, Arch Linux`;
      break;
    case "ls":
      responseLine.innerHTML = `total 2<br>
      -rw-r--r-- 1 shivam shivam  230 Jul  4 12:40 <span class="term-highlight">bio.txt</span><br>
      -rw-r--r-- 1 shivam shivam  142 Jul  4 12:40 <span class="term-highlight">skills.txt</span>`;
      break;
    case "cat":
      const file = args[1];
      if (!file) {
        responseLine.innerHTML = `Usage: cat &lt;filename&gt; (e.g. cat bio.txt)`;
      } else if (file.toLowerCase() === "bio.txt") {
        responseLine.innerHTML = `Souman Maity is a Business Operations Accounts & Sales Executive and an MBA Business/Data Analytics candidate. He is specialized in Custom Linux setups, financial administration, spreadsheet optimization, and workflow automation.`;
      } else if (file.toLowerCase() === "skills.txt") {
        responseLine.innerHTML = `Core Capabilities:<br>
        • Advanced Data Analytics & Modeling<br>
        • Tally ERP Integration & Administration<br>
        • Spreadsheet Architecture & Formulas<br>
        • Custom Linux Shell Operations & Dotfiles`;
      } else {
        responseLine.innerHTML = `cat: ${file}: No such file or directory.`;
      }
      break;
    case "crt":
      const crtEl = document.getElementById("crt-overlay");
      if (crtEl) {
        const isActive = crtEl.classList.toggle("active");
        responseLine.innerHTML = `CRT monitor overlay filter: <span class="term-highlight">${isActive ? "ENABLED" : "DISABLED"}</span>`;
      } else {
        responseLine.innerHTML = `CRT controller module not found.`;
      }
      break;
    case "theme":
      const targetTheme = args[1];
      if (!targetTheme) {
        responseLine.innerHTML = `Current theme: <span class="term-highlight">${isLightMode ? "light" : "dark"}</span>. Usage: theme light | theme dark`;
      } else if (targetTheme.toLowerCase() === "light") {
        if (!isLightMode) {
          isLightMode = true;
          applyTheme();
          localStorage.setItem("theme", "light");
          responseLine.innerHTML = `Theme set to [LIGHT] mode.`;
        } else {
          responseLine.innerHTML = `System already in LIGHT mode.`;
        }
      } else if (targetTheme.toLowerCase() === "dark") {
        if (isLightMode) {
          isLightMode = false;
          applyTheme();
          localStorage.setItem("theme", "dark");
          responseLine.innerHTML = `Theme set to [DARK] mode.`;
        } else {
          responseLine.innerHTML = `System already in DARK mode.`;
        }
      } else {
        responseLine.innerHTML = `Unknown theme option: ${targetTheme}. Use: theme light | theme dark`;
      }
      break;
    case "contact":
      responseLine.innerHTML = `Mail: <a href="mailto:devsparadise999@duck.com" class="term-link">devsparadise999@duck.com</a><br>
      GitHub: <a href="https://github.com" target="_blank" class="term-link">github.com</a>`;
      break;
    case "clear":
      const lines = bodyEl.querySelectorAll(".terminal-line:not(.terminal-input-line)");
      lines.forEach(l => l.remove());
      responseLine.remove();
      return;
    default:
      if (normalizedCmd === "") {
        responseLine.remove();
        return;
      }
      responseLine.innerHTML = `Command not found: <span class="term-error">${command}</span>. Type <span class="term-highlight">help</span> for commands.`;
  }

  if (responseLine.innerHTML) {
    bodyEl.insertBefore(responseLine, inputRow);
  }

  // Scroll to bottom
  bodyEl.scrollTop = bodyEl.scrollHeight;
}

// ====== CUSTOM ANALYTICS RADAR CHART SYSTEM ======
const chartCanvas = document.getElementById("analytics-chart");
let chartCtx = null;
let chartAnimationProgress = 0;
let chartTriggered = false;

const skillLabels = ["Data Modeling", "Predictive Analytics", "Tally ERP", "Spreadsheets", "Visualizations", "Operations Logistics"];
const skillValues = [88, 80, 92, 85, 88, 83];

function initAnalyticsChart() {
  if (!chartCanvas) return;
  chartCtx = chartCanvas.getContext("2d");
  
  resizeChartCanvas();
  window.addEventListener("resize", resizeChartCanvas);
  
  // Render loop
  function drawChartLoop() {
    drawRadarChart();
    requestAnimationFrame(drawChartLoop);
  }
  drawChartLoop();
}

function resizeChartCanvas() {
  if (!chartCanvas || !chartCtx) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  
  // Use stable layout sizes clientWidth & clientHeight set by CSS
  const width = chartCanvas.clientWidth;
  const height = chartCanvas.clientHeight || 320;
  
  chartCanvas.width = width * dpr;
  chartCanvas.height = height * dpr;
  
  chartCtx.resetTransform();
  chartCtx.scale(dpr, dpr);
}

function drawRadarChart() {
  if (!chartCtx || !chartCanvas) return;
  
  const w = chartCanvas.clientWidth;
  const h = chartCanvas.clientHeight || 320;
  
  chartCtx.clearRect(0, 0, w, h);
  
  const cx = w / 2;
  const cy = h / 2;
  // Reduce maxRadius slightly to leave plenty of margin space for text labels
  const maxRadius = Math.min(w, h) * 0.32; 
  const sides = skillLabels.length;
  
  // Fetch colors
  const accentColor = getComputedStyle(document.body).getPropertyValue('--accent').trim();
  const accentRGB = getComputedStyle(document.body).getPropertyValue('--accent-rgb').trim();
  
  // Animate skill values loading on reveal
  if (chartTriggered && chartAnimationProgress < 1.0) {
    chartAnimationProgress += 0.018; // Speed up animation slightly
  }
  
  // Concentric hexagons representing grid levels (33%, 66%, 100%)
  chartCtx.strokeStyle = isLightMode ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.06)";
  chartCtx.lineWidth = 1;
  for (let g = 1; g <= 3; g++) {
    const r = (g / 3) * maxRadius;
    chartCtx.beginPath();
    for (let s = 0; s < sides; s++) {
      const angle = (s * Math.PI * 2) / sides - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (s === 0) chartCtx.moveTo(x, y); else chartCtx.lineTo(x, y);
    }
    chartCtx.closePath();
    chartCtx.stroke();
  }
  
  // Draw radar axis lines and labels
  for (let s = 0; s < sides; s++) {
    const angle = (s * Math.PI * 2) / sides - Math.PI / 2;
    const x = cx + Math.cos(angle) * maxRadius;
    const y = cy + Math.sin(angle) * maxRadius;
    
    // Draw Axis
    chartCtx.beginPath();
    chartCtx.moveTo(cx, cy);
    chartCtx.lineTo(x, y);
    chartCtx.stroke();
    
    // Set Alignment based on orientation to prevent clipping
    const cosAngle = Math.cos(angle);
    if (Math.abs(cosAngle) < 0.1) {
      chartCtx.textAlign = "center";
    } else if (cosAngle > 0) {
      chartCtx.textAlign = "left";
    } else {
      chartCtx.textAlign = "right";
    }
    chartCtx.textBaseline = "middle";
    
    // Label placement
    const labelDistance = maxRadius + 15;
    const labelX = cx + Math.cos(angle) * labelDistance;
    const labelY = cy + Math.sin(angle) * labelDistance;
    
    // Set styles for label drawing
    chartCtx.fillStyle = isLightMode ? "#2c3e50" : "#a9b7c6";
    chartCtx.font = "bold 9.5px 'Outfit', sans-serif";
    
    const currentPct = Math.round(skillValues[s] * chartAnimationProgress);
    const labelText = `${skillLabels[s]} [${currentPct}%]`;
    chartCtx.fillText(labelText, labelX, labelY);
  }
  
  // Draw active data polygon area
  chartCtx.beginPath();
  for (let s = 0; s < sides; s++) {
    const angle = (s * Math.PI * 2) / sides - Math.PI / 2;
    const val = (skillValues[s] / 100) * maxRadius * chartAnimationProgress;
    
    // Add dynamic sine wave ripple to chart polygon
    const pulseWave = Math.sin(time * 2.2 + s) * 1.8;
    const x = cx + Math.cos(angle) * (val + pulseWave);
    const y = cy + Math.sin(angle) * (val + pulseWave);
    
    if (s === 0) chartCtx.moveTo(x, y); else chartCtx.lineTo(x, y);
  }
  chartCtx.closePath();
  
  // Stroke data outline
  chartCtx.strokeStyle = accentColor;
  chartCtx.lineWidth = 2.5;
  chartCtx.shadowBlur = 10;
  chartCtx.shadowColor = accentColor;
  chartCtx.stroke();
  chartCtx.shadowBlur = 0;
  
  // Fill data interior
  chartCtx.fillStyle = `rgba(${accentRGB}, 0.12)`;
  chartCtx.fill();
  
  // Draw glowing grid node dots
  for (let s = 0; s < sides; s++) {
    const angle = (s * Math.PI * 2) / sides - Math.PI / 2;
    const val = (skillValues[s] / 100) * maxRadius * chartAnimationProgress;
    const pulseWave = Math.sin(time * 2.2 + s) * 1.8;
    const x = cx + Math.cos(angle) * (val + pulseWave);
    const y = cy + Math.sin(angle) * (val + pulseWave);
    
    // Outer glow dot
    chartCtx.fillStyle = accentColor;
    chartCtx.beginPath();
    chartCtx.arc(x, y, 4, 0, Math.PI * 2);
    chartCtx.fill();
    
    // Inner white dot
    chartCtx.fillStyle = "#ffffff";
    chartCtx.beginPath();
    chartCtx.arc(x, y, 1.8, 0, Math.PI * 2);
    chartCtx.fill();
  }
}


