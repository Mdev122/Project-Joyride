const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const fileInput = document.getElementById('audio-file');
const canvas = document.getElementById('convoyCanvas');
const ctx = canvas.getContext('2d');

// Dopasowanie rozdzielczości canvasu
canvas.width = 400;
canvas.height = 125;

// Zmienne audio dla analizatora basu
let audioCtx, analyser, source, dataArray;
let isContextSetup = false;

// Ładowanie pliku muzycznego
fileInput.addEventListener('change', function () {
  const files = this.files;
  if (files.length > 0) {
    audio.src = URL.createObjectURL(files[0]);
    playBtn.innerText = "Play";
  }
});

// Kontrola odtwarzania
playBtn.addEventListener('click', () => {
  if (!isContextSetup && audio.src) {
    setupAudioEngine();
    isContextSetup = true;
  }

  if (audio.paused && audio.src) {
    audio.play();
    playBtn.innerText = "Pause";
  } else {
    audio.pause();
    playBtn.innerText = "Play";
  }
});

// Silnik audio wyciągający częstotliwości (basy)
function setupAudioEngine() {
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();
  source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioCtx.destination);
  analyser.fftSize = 64;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
}

// Parametry animacji kowbojki
let bounceOffset = 0;
let swingAngle = 0;

// Główna pętla rysowania Canvas
function draw() {
  requestAnimationFrame(draw);

  // Czyszczenie ekranu z lekkim efektem smugi (motion blur)
  ctx.fillStyle = "rgba(11, 12, 16, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let bass = 0;
  if (analyser && !audio.paused) {
    analyser.getByteFrequencyData(dataArray);
    bass = (dataArray[0] + dataArray[1] + dataArray[2]) / 3;
  }

  // Bas napędza skok i kołysanie
  bounceOffset = (bass / 255) * 20;
  swingAngle = Math.sin(Date.now() / 200) * (0.1 + bass / 600);

  const centerX = canvas.width / 2;
  const groundY = 100;
  const bodyY = groundY - 40 - bounceOffset;

  ctx.save();
  ctx.translate(centerX, bodyY);
  ctx.rotate(swingAngle);

  // Nogi
  ctx.strokeStyle = "#66fcf1";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, 25); ctx.lineTo(-10, 45);
  ctx.moveTo(6, 25); ctx.lineTo(10, 45);
  ctx.stroke();

  // Tors
  ctx.fillStyle = "#45f3ff";
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
  ctx.fillStyle = "#ff007f";
  ctx.shadowBlur = bass > 120 ? 15 : 0;
  ctx.shadowColor = "#ff007f";
  ctx.beginPath();
  ctx.ellipse(0, -18, 16, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-8, -26, 16, 10);
  ctx.shadowBlur = 0;

  ctx.restore();

  // Linia "podłogi"
  ctx.strokeStyle = "#1f2833";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(canvas.width, groundY);
  ctx.stroke();
}

// Uruchomienie pętli graficznej
draw();