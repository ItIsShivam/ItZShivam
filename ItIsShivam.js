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

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let isPlaying = false;
let audioCtx = null;
let analyser = null;
let source = null;
let currentTrackIndex = 0;

/* -------- TRACK LIST (UNCHANGED) -------- */

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

tracks.forEach((track, index) => {
  const opt = document.createElement("option");
  opt.value = index;
  opt.textContent = track.title;
  trackSelector.appendChild(opt);
});

audio.src = tracks[0].src;

/* -------- AUDIO CONTEXT INIT -------- */

function initAudio() {
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

/* -------- PLAY / PAUSE -------- */

playBtn.addEventListener("click", async () => {
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

  footerInfo.textContent = "Now Playing: " + tracks[currentTrackIndex].title;
});

/* -------- TRACK CHANGE -------- */

trackSelector.addEventListener("change", () => {
  currentTrackIndex = Number(trackSelector.value);
  audio.src = tracks[currentTrackIndex].src;
  footerInfo.textContent = "Now Playing: " + tracks[currentTrackIndex].title;
  if (isPlaying) audio.play();
});

/* -------- AUTOPLAY NEXT TRACK -------- */

audio.addEventListener("ended", () => {
  currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
  trackSelector.value = currentTrackIndex;
  audio.src = tracks[currentTrackIndex].src;
  audio.play();
  footerInfo.textContent = "Now Playing: " + tracks[currentTrackIndex].title;
});

/* -------- PROGRESS -------- */

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  progress.value = (audio.currentTime / audio.duration) * 100;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  remainingTimeEl.textContent = "-" + formatTime(audio.duration - audio.currentTime);
});

progress.addEventListener("input", () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
});

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

/* -------- VOLUME -------- */

volume.addEventListener("input", () => {
  audio.volume = volume.value;
});

/* -------- QUOTES -------- */

const quotes = {
  focus: ["Progress beats perfection.", "Consistency compounds."],
  calm: ["Calm is a superpower.", "Slow down to speed up."],
  growth: ["Growth feels uncomfortable for a reason."],
  life: ["Build a life you do not need to escape from."]
};

function generateQuote() {
  const category =
    quoteCategory.value === "auto"
      ? Object.keys(quotes)[Math.floor(Math.random() * Object.keys(quotes).length)]
      : quoteCategory.value;

  const quote = quotes[category][Math.floor(Math.random() * quotes[category].length)];

  quoteText.style.opacity = 0;
  quoteText.style.transform = "scale(0.98)";
  setTimeout(() => {
    quoteText.textContent = quote;
    quoteText.style.opacity = 1;
    quoteText.style.transform = "scale(1)";
  }, 200);
}

inspireBtn.addEventListener("click", generateQuote);

/* -------- VISUALIZER -------- */

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
  } else {
    ctx.beginPath();
    buffer.forEach((v, i) => {
      ctx.lineTo(i * 3, canvas.height - v / 2);
    });
    ctx.stroke();
  }
}

/* -------- THEME -------- */

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
});
