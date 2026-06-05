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

/* Visualizer */
function draw() {
  requestAnimationFrame(draw);
  analyser.getByteFrequencyData(dataArray);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

  const barWidth = canvas.width / dataArray.length;

  if (visualizerMode.value === "bars") {
    dataArray.forEach((v, i) => {
      ctx.fillStyle = `hsl(${hue + i},60%,55%)`;
      ctx.fillRect(i * barWidth, canvas.height - v / 2, barWidth - 2, v / 2);
    });
  }

  if (visualizerMode.value === "wave") {
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${hue},70%,60%)`;
    ctx.lineWidth = 2;
    dataArray.forEach((v, i) => {
      const y = canvas.height / 2 + (v - 128);
      if (i === 0) ctx.moveTo(0, y);
      else ctx.lineTo(i * barWidth, y);
    });
    ctx.stroke();
  }

  if (visualizerMode.value === "pulse") {
    ctx.fillStyle = `hsla(${hue},70%,60%,0.6)`;
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 20 + intensity * 60, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* Canvas Resize Handler */
function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* Controls */
function togglePlay() {
  if (!isPlaying) {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    audio.play();
    draw();
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
  const cat = quoteCategory.value;
  const list = quotes[cat];
  quoteText.textContent = `"${list[Math.floor(Math.random() * list.length)]}"`;
}

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

/* Autoplay next */
audio.addEventListener("ended", () => {
  trackSelector.selectedIndex =
    (trackSelector.selectedIndex + 1) % trackSelector.options.length;
  audio.src = trackSelector.value;
  audio.play();
});

trackSelector.addEventListener("change", () => {
  audio.src = trackSelector.value;
  if (isPlaying) audio.play();
});

function format(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Generate an initial quote on load
generateQuote();
