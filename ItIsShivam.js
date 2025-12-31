const audio = document.getElementById("audio");
const progress = document.getElementById("progress");
const currentTimeEl = document.getElementById("currentTime");
const remainingTimeEl = document.getElementById("remainingTime");
const volume = document.getElementById("volume");
const playlistEl = document.getElementById("playlist");
const quoteText = document.getElementById("quoteText");
const quoteCategory = document.getElementById("quoteCategory");
const visualizerMode = document.getElementById("visualizerMode");
const footerInfo = document.getElementById("footerInfo");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

let isPlaying = false;

/* ---------------- PLAYLIST ---------------- */

let tracks = [
  { title: "Mortals", src: "mortals-funk-remix.mp3" },
  { title: "On & On", src: "on-and-on.mp3" },
  { title: "Make Me Move", src: "make-me-move.mp3" },
  { title: "Heroes Tonight", src: "heroes-tonight.mp3" }
];

function renderPlaylist() {
  playlistEl.innerHTML = "";
  tracks.forEach((t, i) => {
    const li = document.createElement("li");
    li.textContent = t.title;
    li.draggable = true;
    li.onclick = () => playTrack(i);

    li.addEventListener("dragstart", e => e.dataTransfer.setData("i", i));
    li.addEventListener("drop", e => {
      const from = e.dataTransfer.getData("i");
      [tracks[from], tracks[i]] = [tracks[i], tracks[from]];
      renderPlaylist();
    });
    li.addEventListener("dragover", e => e.preventDefault());

    playlistEl.appendChild(li);
  });
}

function playTrack(i) {
  audio.src = tracks[i].src;
  audio.play();
  footerInfo.textContent = "Now Playing: " + tracks[i].title;
  isPlaying = true;
}

renderPlaylist();

/* ---------------- AUDIO ---------------- */

function togglePlay() {
  if (!audio.src) playTrack(0);
  else isPlaying ? audio.pause() : audio.play();
  isPlaying = !isPlaying;
}

volume.oninput = () => audio.volume = volume.value;

audio.ontimeupdate = () => {
  progress.value = (audio.currentTime / audio.duration) * 100;
  currentTimeEl.textContent = format(audio.currentTime);
  remainingTimeEl.textContent = "-" + format(audio.duration - audio.currentTime);
};

progress.oninput = () => audio.currentTime = (progress.value / 100) * audio.duration;

function format(s) {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r < 10 ? "0" : ""}${r}`;
}

/* ---------------- QUOTES ---------------- */

const quotes = {
  focus: ["Progress beats perfection.", "Consistency compounds."],
  calm: ["Calm is a superpower.", "Slow is smooth."],
  life: ["Build a life you do not need to escape from."]
};

function generateQuote() {
  const cat = quoteCategory.value === "auto" ? "focus" : quoteCategory.value;
  const q = quotes[cat][Math.floor(Math.random() * quotes[cat].length)];
  quoteText.style.opacity = 0;
  setTimeout(() => {
    quoteText.textContent = q;
    quoteText.style.opacity = 1;
  }, 200);
}

/* ---------------- VISUALIZER ---------------- */

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();
const source = audioCtx.createMediaElementSource(audio);
const analyser = audioCtx.createAnalyser();

source.connect(analyser);
analyser.connect(audioCtx.destination);
analyser.fftSize = 256;

const buffer = new Uint8Array(analyser.frequencyBinCount);

function draw() {
  requestAnimationFrame(draw);
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

draw();

/* ---------------- THEME ---------------- */

function toggleTheme() {
  document.body.classList.toggle("dark");
  document.body.classList.toggle("light");
}
