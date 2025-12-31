const audio = document.getElementById("audio");
const playBtn = document.getElementById("playBtn");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const remainingTimeEl = document.getElementById("remainingTime");
const volume = document.getElementById("volume");
const trackSelector = document.getElementById("trackSelector");
const footerInfo = document.getElementById("footerInfo");
const quoteText = document.getElementById("quoteText");
const quoteCategory = document.getElementById("quoteCategory");
const visualizerMode = document.getElementById("visualizerMode");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let isPlaying = false;
let audioCtx, analyser, source;

/* ---------------- TRACK LIST ---------------- */

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

/* ---------------- AUDIO CONTEXT SAFE INIT ---------------- */

function initAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;
    drawVisualizer();
  }
}

/* ---------------- PLAY / PAUSE ---------------- */

playBtn.onclick = async () => {
  initAudioContext();
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

/* ---------------- TRACK CHANGE ---------------- */

trackSelector.onchange = () => {
  audio.src = tracks[trackSelector.value].src;
  footerInfo.textContent = "Now Playing: " + tracks[trackSelector.value].title;
  if (isPlaying) audio.play();
};

/* ---------------- PROGRESS ---------------- */

audio.ontimeupdate = () => {
  progress.value = (audio.currentTime / audio.duration) * 100 || 0;
  currentTimeEl.textContent = format(audio.currentTime);
  remainingTimeEl.textContent = "-" + format(audio.duration - audio.currentTime);
};

progress.oninput = () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
};

function format(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

/* ---------------- VOLUME ---------------- */

volume.oninput = () => audio.volume = volume.value;

/* ---------------- QUOTES ---------------- */

const quotes = {
  focus: [
    "Progress beats perfection.",
    "Consistency compounds.",
    "Do the work, even quietly."
  ],
  calm: [
    "Calm is a superpower.",
    "Slow down to speed up."
  ],
  growth: [
    "Growth feels uncomfortable for a reason.",
    "Small steps matter."
  ],
  life: [
    "Build a life you do not need to escape from.",
    "Protect your energy."
  ]
};

function generateQuote() {
  const cat = quoteCategory.value === "auto"
    ? Object.keys(quotes)[Math.floor(Math.random() * 4)]
    : quoteCategory.value;

  const q = quotes[cat][Math.floor(Math.random() * quotes[cat].length)];
  quoteText.style.opacity = 0;
  setTimeout(() => {
    quoteText.textContent = q;
    quoteText.style.opacity = 1;
  }, 200);
}

/* ---------------- VISUALIZER ---------------- */

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  if (!analyser) return;

  const buffer = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(buffer);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (visualizerMode.value === "bars") {
    buffer.forEach((v, i) => {
      ctx.fillRect(i * 3, canvas.height, 2, -v / 2);
    });
  }

  if (visualizerMode.value === "wave") {
    ctx.beginPath();
    buffer.forEach((v, i) => {
      ctx.lineTo(i * 3, canvas.height - v / 2);
    });
    ctx.stroke();
  }
}

/* ---------------- THEME ---------------- */

function toggleTheme() {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
}
