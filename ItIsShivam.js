const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const inspireBtn = document.getElementById("inspireBtn");
const themeBtn = document.getElementById("themeBtn");

const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const remainingTimeEl = document.getElementById("remainingTime");
const volume = document.getElementById("volume");

const trackSelector = document.getElementById("trackSelector");
const footerInfo = document.getElementById("footerInfo");

const quoteText = document.getElementById("quoteText");
const quoteCategory = document.getElementById("quoteCategory");
const visualizerMode = document.getElementById("visualizerMode");

const controls = document.getElementById("controls");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let audioCtx, analyser, source;
let isPlaying = false;
let currentTrackIndex = 0;

/* TRACK LIST (UNCHANGED) */
const tracks = [
  { title: "Mortals (Funk Remix)", src: "mortals-funk-remix.mp3" },
  { title: "On & On", src: "on-and-on.mp3" },
  { title: "Make Me Move", src: "make-me-move.mp3" },
  { title: "Heroes Tonight", src: "heroes-tonight.mp3" },
  { title: "Power", src: "power.mp3" },
  { title: "Only Human", src: "only-human.mp3" },
  { title: "Want Your Body", src: "want-your-body.mp3" },
  { title: "Did It Mean Forever", src: "did-it-mean-forever.mp3" },
  { title: "Digital Death", src: "digital-death.mp3" },
  { title: "All I Need", src: "all-i-need.mp3" }
];

tracks.forEach((t, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = t.title;
  trackSelector.appendChild(opt);
});

audio.src = tracks[0].src;

/* AUDIO INIT */
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    draw();
  }
}

/* PLAY / PAUSE */
playBtn.onclick = async () => {
  initAudio();
  await audioCtx.resume();

  if (!isPlaying) {
    audio.play();
    playBtn.textContent = "Pause";
    isPlaying = true;
  } else {
    audio.pause();
    playBtn.textContent = "Play";
    isPlaying = false;
  }
};

/* AUTOPLAY NEXT */
audio.addEventListener("ended", () => {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  trackSelector.value = currentTrackIndex;
  audio.src = tracks[currentTrackIndex].src;
  audio.play();
});

/* TRACK SELECT */
trackSelector.onchange = () => {
  currentTrackIndex = Number(trackSelector.value);
  audio.src = tracks[currentTrackIndex].src;
  if (isPlaying) audio.play();
};

/* PROGRESS */
audio.ontimeupdate = () => {
  if (!audio.duration) return;
  progress.value = (audio.currentTime / audio.duration) * 100;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  remainingTimeEl.textContent = "-" + formatTime(audio.duration - audio.currentTime);
};

progress.oninput = () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
};

function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

/* VOLUME */
volume.oninput = () => audio.volume = volume.value;

/* QUOTES */
const quotes = {
  focus: ["Progress beats perfection.", "Deep work compounds."],
  calm: ["Slow is smooth. Smooth is fast."],
  growth: ["Discomfort is the price of growth."],
  life: ["Build a life you respect."]
};

inspireBtn.onclick = () => {
  const keys = Object.keys(quotes);
  const cat = quoteCategory.value === "auto"
    ? keys[Math.floor(Math.random() * keys.length)]
    : quoteCategory.value;

  const q = quotes[cat][Math.floor(Math.random() * quotes[cat].length)];
  quoteText.style.opacity = 0;
  setTimeout(() => {
    quoteText.textContent = q;
    quoteText.style.opacity = 1;
  }, 200);
};

/* AUTO AMBIENT MODE */
let inactivityTimer;
const AMBIENT_DELAY = 5000;

function activateAmbient() {
  document.body.classList.add("ambient");
}

function deactivateAmbient() {
  document.body.classList.remove("ambient");
}

function resetInactivity() {
  deactivateAmbient();
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(activateAmbient, AMBIENT_DELAY);
}

["mousemove", "mousedown", "touchstart", "scroll", "keydown"].forEach(evt => {
  document.addEventListener(evt, resetInactivity, { passive: true });
});

resetInactivity();

/* VISUALIZER + SOFT BG RESPONSE */
function draw() {
  requestAnimationFrame(draw);
  if (!analyser) return;

  const data = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(data);

  const avg = data.reduce((a, b) => a + b) / data.length;
  document.body.style.backgroundPosition = `${Math.min(60, avg / 2)}% 50%`;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (visualizerMode.value === "radial") {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    data.forEach((v, i) => {
      const angle = (i / data.length) * Math.PI * 2;
      const r = v / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    });
  } else if (visualizerMode.value === "dots") {
    data.forEach((v, i) => {
      ctx.beginPath();
      ctx.arc(i * 3, canvas.height - v / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (visualizerMode.value === "wave") {
    ctx.beginPath();
    data.forEach((v, i) => ctx.lineTo(i * 3, canvas.height - v / 2));
    ctx.stroke();
  } else {
    data.forEach((v, i) => {
      ctx.fillRect(i * 3, canvas.height, 2, -v / 2);
    });
  }
}

/* THEME */
themeBtn.onclick = () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
};
