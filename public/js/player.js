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

let audioCtx, analyser, source, dataArray;
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
  analyser.fftSize = 64;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

let bounceOffset = 0;
let swingAngle = 0;

function draw() {
  requestAnimationFrame(draw);

  ctx.fillStyle = "rgba(3, 7, 17, 0.35)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let bass = 0;
  if (analyser && !audio.paused) {
    analyser.getByteFrequencyData(dataArray);
    bass = (dataArray[0] + dataArray[1] + dataArray[2]) / 3;
  }

  const glowIntensity = Math.min(bass / 180, 1);
  playerEl.style.setProperty('--glow-intensity', glowIntensity.toFixed(2));

  bounceOffset = (bass / 255) * 20;
  swingAngle = Math.sin(Date.now() / 200) * (0.1 + bass / 600);

  const centerX = canvas.width / 2;
  const groundY = 100;
  const bodyY = groundY - 40 - bounceOffset;

  ctx.save();
  ctx.translate(centerX, bodyY);
  ctx.rotate(swingAngle);

  // Nogi
  ctx.strokeStyle = "#8ec5ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, 25); ctx.lineTo(-10, 45);
  ctx.moveTo(6, 25); ctx.lineTo(10, 45);
  ctx.stroke();

  // Tors
  ctx.fillStyle = "#4f9dff";
  ctx.fillRect(-8, 0, 16, 28);

  // Ramiona
  ctx.beginPath();
  ctx.moveTo(-8, 5); ctx.lineTo(-20, 15 - bounceOffset / 2);
  ctx.moveTo(8, 5); ctx.lineTo(20, 15 - bounceOffset / 2);
  ctx.stroke();

  // Głowa
  ctx.fillStyle = "#f4d9b1";
  ctx.beginPath();
  ctx.arc(0, -8, 10, 0, Math.PI * 2);
  ctx.fill();

  // Kapelusz (kowbojski)
  ctx.fillStyle = "#ff2f6e";
  ctx.shadowBlur = bass > 120 ? 15 : 0;
  ctx.shadowColor = "#ff2f6e";
  ctx.beginPath();
  ctx.ellipse(0, -18, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-8, -26, 16, 10);
  ctx.shadowBlur = 0;

  ctx.restore();

  // Linia "podłogi"
  ctx.strokeStyle = "#1e3a63";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();
}

// Uruchomienie pętli graficznej
draw();