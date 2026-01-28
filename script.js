const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 440;
canvas.height = 440;

const CX = canvas.width / 2;
const CY = canvas.height / 2;

const BASE_RADIUS = 145;
const POINTS = 360;
const LAYERS = 8;
const LAYER_GAP = 4;

let time = 0;
let energy = 0;

// ===============================
// 🎧 AUDIO SETUP
// ===============================
const audio = document.getElementById("audio");
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();

analyser.fftSize = 1024;

const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

const dataArray = new Uint8Array(analyser.frequencyBinCount);

// Resume audio context on play (browser rule)
audio.addEventListener("play", () => {
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
});

// ===============================
// 🔊 ENERGY FROM AUDIO
// ===============================
function updateEnergyFromAudio() {
  analyser.getByteFrequencyData(dataArray);

  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i];
  }

  const avg = sum / dataArray.length;

  // Smooth envelope
  energy += (avg - energy) * 0.12;
}

// ===============================
// 🌊 RIBBON DRAW
// ===============================
function drawRibbon(radiusOffset, alpha) {
  ctx.beginPath();

  for (let i = 0; i <= POINTS; i++) {
    const angle = (i / POINTS) * Math.PI * 2;

    const idleWave = Math.sin(angle * 3 + time) * 7;

    const energyWave =
      Math.sin(angle * 6 - time * 3) *
      energy * 0.35;

    const radius =
      BASE_RADIUS +
      radiusOffset +
      idleWave +
      energyWave;

    const x = CX + Math.cos(angle) * radius;
    const y = CY + Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();
  ctx.strokeStyle = `rgba(120,180,255,${alpha})`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// ===============================
// 🎞️ ANIMATION LOOP
// ===============================
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  updateEnergyFromAudio();
  time += 0.015;

  // Outer energy bands
  for (let i = 0; i < LAYERS; i++) {
    drawRibbon(i * LAYER_GAP, 0.05 + i * 0.02);
  }

  // Core ribbon
  ctx.save();
  ctx.shadowBlur = 35;
  ctx.shadowColor = "rgba(140,180,255,0.7)";
  ctx.beginPath();

  for (let i = 0; i <= POINTS; i++) {
    const angle = (i / POINTS) * Math.PI * 2;

    const idleWave = Math.sin(angle * 3 + time) * 7;
    const energyWave =
      Math.sin(angle * 6 - time * 3) *
      energy * 0.35;

    const radius = BASE_RADIUS + idleWave + energyWave;

    const x = CX + Math.cos(angle) * radius;
    const y = CY + Math.sin(angle) * radius;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }

  ctx.closePath();

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#3cf2ff");
  gradient.addColorStop(0.5, "#6f6bff");
  gradient.addColorStop(1, "#d96bff");

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  requestAnimationFrame(animate);
}

animate();
