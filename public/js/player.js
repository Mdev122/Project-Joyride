const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const fileInput = document.getElementById('audio-file');
const folderInput = document.getElementById('folder-input');
const canvas = document.getElementById('convoyCanvas');
const ctx = canvas.getContext('2d');
const playlistEl = document.getElementById('playlist');
const nowPlayingEl = document.getElementById('nowPlaying');
const playerEl = document.getElementById('joyride-player');

canvas.width = 400;
canvas.height = 125;

let audioCtx, analyser, source;
let dataArray = new Uint8Array(128);
let isContextSetup = false;

let tracks = [];
let currentIndex = -1;

fileInput.addEventListener('change', function () {
  const files = Array.from(this.files);
  if (files.length === 0) return;

  files.forEach(file => {
    tracks.push({ name: file.name, url: URL.createObjectURL(file) });
  });

  renderPlaylist();

  if (currentIndex === -1) {
    loadTrack(tracks.length - files.length);
  }
});

folderInput.addEventListener('change', function () {
  const files = Array.from(this.files).filter(file => file.type.startsWith('audio/'));
  if (files.length === 0) return;

  files.forEach(file => {
    tracks.push({ name: file.name, url: URL.createObjectURL(file) });
  });

  renderPlaylist();

  if (currentIndex === -1) {
    loadTrack(tracks.length - files.length);
  }
});

function renderPlaylist() {
  playlistEl.innerHTML = '';
  tracks.forEach((track, index) => {
    const li = document.createElement('li');
    li.textContent = track.name;
    if (index === currentIndex) li.classList.add('active');
    li.addEventListener('click', () => {
      loadTrack(index);
      playCurrent();
    });
    playlistEl.appendChild(li);
  });
}

function loadTrack(index) {
  if (index < 0 || index >= tracks.length) return;
  currentIndex = index;
  audio.src = tracks[index].url;
  nowPlayingEl.textContent = tracks[index].name;
  playBtn.innerText = "Play";
  renderPlaylist();
}

function playCurrent() {
  if (!isContextSetup && audio.src) {
    setupAudioEngine();
    isContextSetup = true;
  }
  audio.play();
  playBtn.innerText = "Pause";
}

playBtn.addEventListener('click', () => {
  if (currentIndex === -1) return;

  if (!isContextSetup) {
    setupAudioEngine();
    isContextSetup = true;
  }

  if (audio.paused) {
    audio.play();
    playBtn.innerText = "Pause";
  } else {
    audio.pause();
    playBtn.innerText = "Play";
  }
});

prevBtn.addEventListener('click', () => {
  if (tracks.length === 0) return;
  const newIndex = (currentIndex - 1 + tracks.length) % tracks.length;
  loadTrack(newIndex);
  playCurrent();
});

nextBtn.addEventListener('click', () => {
  if (tracks.length === 0) return;
  const newIndex = (currentIndex + 1) % tracks.length;
  loadTrack(newIndex);
  playCurrent();
});

audio.addEventListener('ended', () => {
  if (tracks.length > 1) {
    nextBtn.click();
  }
});

function setupAudioEngine() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 256;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

// Parametry equalizera
const BAR_COUNT = 28;
const BAR_GAP = 3;
let peaks = new Array(BAR_COUNT).fill(0);

function draw() {
  requestAnimationFrame(draw);

  ctx.fillStyle = "rgba(3, 7, 17, 0.35)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let overallLevel = 0;

  if (analyser && !audio.paused) {
    analyser.getByteFrequencyData(dataArray);
  }

  const groundY = 110;
  const maxBarHeight = 100;
  const barWidth = (canvas.width - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;
  const usableBins = Math.floor(dataArray.length * 0.75);

  for (let i = 0; i < BAR_COUNT; i++) {
    const t0 = Math.pow(i / BAR_COUNT, 1.5);
    const t1 = Math.pow((i + 1) / BAR_COUNT, 1.5);
    const startBin = Math.floor(t0 * usableBins);
    const endBin = Math.max(startBin + 1, Math.floor(t1 * usableBins));

    let sum = 0;
    let count = 0;
    for (let b = startBin; b < endBin && b < dataArray.length; b++) {
      sum += dataArray[b];
      count++;
    }
    const value = count > 0 ? sum / count : 0;
    overallLevel += value;

    const barHeight = Math.max(2, (value / 255) * maxBarHeight);
    const x = i * (barWidth + BAR_GAP);
    const y = groundY - barHeight;

    const gradient = ctx.createLinearGradient(0, groundY, 0, groundY - maxBarHeight);
    gradient.addColorStop(0, "#2a5fb8");
    gradient.addColorStop(0.6, "#4f9dff");
    gradient.addColorStop(1, "#ff2f6e");

    ctx.fillStyle = gradient;
    ctx.shadowBlur = value > 140 ? 12 : 4;
    ctx.shadowColor = "#4f9dff";
    ctx.fillRect(x, y, barWidth, barHeight);
    ctx.shadowBlur = 0;

    if (barHeight > peaks[i]) {
      peaks[i] = barHeight;
    } else {
      peaks[i] = Math.max(0, peaks[i] - 1.5);
    }

    if (peaks[i] > 2) {
      ctx.fillStyle = "#cfe0ff";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#8ec5ff";
      ctx.fillRect(x, groundY - peaks[i] - 2, barWidth, 2);
      ctx.shadowBlur = 0;
    }
  }

  const glowIntensity = Math.min((overallLevel / BAR_COUNT) / 140, 1);
  playerEl.style.setProperty('--glow-intensity', glowIntensity.toFixed(2));

  ctx.strokeStyle = "#1e3a63";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();
}

draw();