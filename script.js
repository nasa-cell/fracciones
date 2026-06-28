let nivel = "facil";
let modo = "alternativas";
let operacionesSeleccionadas = {
  suma: true,
  resta: true,
  multiplicacion: true,
  division: true,
};
let vidas = 3;
let errores = 0;
let puntos = 0;
let actual = 1;
let correcta = { num: 0, den: 1 };
let seleccionActual = null;
let audioContext = null;
let videoActivo = true;
let usedProblemas = new Set();

function toggleOperacion(op) {
  operacionesSeleccionadas[op] = !operacionesSeleccionadas[op];
  let elemento = document.getElementById(`op-${op}`);
  elemento.classList.toggle("active", operacionesSeleccionadas[op]);
  playClick();
}

function seleccionarDificultad(n) {
  playClick();
  nivel = n;
  document.querySelectorAll('.level-card').forEach(card => card.classList.remove('active'));
  document.getElementById(`nivel-${n}`).classList.add('active');
}

function seleccionarModo(m) {
  playClick();
  modo = m;
  document.querySelectorAll('.modo-grid .op-card').forEach(card => card.classList.remove('active'));
  document.getElementById(`modo-${m}`).classList.add('active');
  actualizarModo();
}

function actualizarModo() {
  const modoBox = document.getElementById('modo');
  if (!modoBox) return;
  modoBox.innerText = modo === 'alternativas' ? 'Modo: Con alternativas' : 'Modo: Sin alternativas';
  const alternativas = document.getElementById('alternativas');
  const respuestaArea = document.getElementById('respuesta-area');
  const respuestaInput = document.getElementById('respuesta');

  if (alternativas) {
    alternativas.classList.toggle('hidden', modo !== 'alternativas');
  }
  if (respuestaArea) {
    respuestaArea.classList.toggle('hidden', modo === 'alternativas');
  }
  if (respuestaInput) {
    respuestaInput.classList.toggle('hidden', modo === 'alternativas');
  }
}

function hayOperacionActiva() {
  return operacionesSeleccionadas.suma ||
         operacionesSeleccionadas.resta ||
         operacionesSeleccionadas.multiplicacion ||
         operacionesSeleccionadas.division;
}

function comenzar() {
  if (!hayOperacionActiva()) {
    alert("Selecciona al menos una operación antes de comenzar.");
    return;
  }

  if (!nivel) {
    alert("Selecciona una dificultad antes de comenzar.");
    return;
  }

  playClick();
  resetGame();

  const menu = document.getElementById("menu");
  const final = document.getElementById("final");
  const juego = document.getElementById("juego");

  if (menu) menu.classList.add("hidden");
  if (final) final.classList.add("hidden");
  if (juego) juego.classList.remove("hidden");

  crearProblema();
  actualizarModo();
}

function volverInicio() {
  resetGame();
  document.getElementById("juego").classList.add("hidden");
  document.getElementById("final").classList.add("hidden");
  document.getElementById("menu").classList.remove("hidden");
}

function actualizarProgreso() {
  const progressFill = document.getElementById("progress-fill");
  const progressCount = document.getElementById("progress-count");
  const porcentaje = Math.min(100, Math.max(0, (actual / 40) * 100));

  if (progressFill) {
    progressFill.style.width = `${porcentaje}%`;
  }
  if (progressCount) {
    progressCount.innerText = `${Math.min(actual, 40)}/40`;
  }
}

function resetGame() {
  vidas = 3;
  errores = 0;
  puntos = 0;
  actual = 1;
  correcta = { num: 0, den: 1 };

  const vidasEl = document.getElementById("vidas");
  const erroresEl = document.getElementById("errores");
  const puntosEl = document.getElementById("puntos");
  const mensajeEl = document.getElementById("mensaje");
  const listaEl = document.getElementById("lista");

  if (vidasEl) vidasEl.innerText = vidas;
  if (erroresEl) erroresEl.innerText = errores;
  if (puntosEl) puntosEl.innerText = puntos;
  if (mensajeEl) mensajeEl.innerText = "";
  usedProblemas.clear();
  actualizarProgreso();
}

const startBtn = document.getElementById('startBtn');
if (startBtn) {
  startBtn.addEventListener('click', comenzar);
  startBtn.onclick = comenzar;
}

window.addEventListener('DOMContentLoaded', () => {
  actualizarModo();
});

function toggleVideo() {
  const video = document.getElementById('bg-video');
  const btn = document.getElementById('videoToggleBtn');
  if (!video || !btn) return;

  videoActivo = !videoActivo;
  if (videoActivo) {
    video.style.display = 'block';
    video.muted = false;
    video.volume = 0.24;
    video.play().catch(() => {});
    btn.innerHTML = '🎬 Ocultar video';
  } else {
    video.style.display = 'none';
    video.muted = true;
    video.volume = 0;
    btn.innerHTML = '📽️ Mostrar video';
  }
}

function mcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);

  while (b) {
    let r = a % b;
    a = b;
    b = r;
  }
  return a;
}

function simplificar(n, d) {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  if (n === 0) {
    return { num: 0, den: 1 };
  }
  let m = mcd(n, d);
  return { num: n / m, den: d / m };
}

function fraccionToString(frac) {
  return frac.num + "/" + frac.den;
}

function formatFraction(a, b) {
  return `
    <span class="fraction"><span class="num">${a}</span>
      <span class="bar"></span>
      <span class="den">${b}</span></span>`;
}

function crearProblema() {
  actualizarModo();
  const rangos = {
    facil: { min: 1, max: 6 },
    medio: { min: 1, max: 12 },
    dificil: { min: 1, max: 30 },
  };

  const { min, max } = rangos[nivel] || rangos.facil;

  let a = Math.floor(Math.random() * (max - min + 1)) + min;
  let b = Math.floor(Math.random() * (max - min + 1)) + min;
  let c = Math.floor(Math.random() * (max - min + 1)) + min;
  let d = Math.floor(Math.random() * (max - min + 1)) + min;

  let operaciones = [];

  if (operacionesSeleccionadas.suma) operaciones.push("+");
  if (operacionesSeleccionadas.resta) operaciones.push("-");
  if (operacionesSeleccionadas.multiplicacion) operaciones.push("×");
  if (operacionesSeleccionadas.division) operaciones.push("÷");

  if (operaciones.length === 0) operaciones.push("+");

  let operacion = operaciones[Math.floor(Math.random() * operaciones.length)];
  let resultado;
  let problemaStr;
  let intento = 0;

  do {
    if (intento > 0) {
      a = Math.floor(Math.random() * (max - min + 1)) + min;
      b = Math.floor(Math.random() * (max - min + 1)) + min;
      c = Math.floor(Math.random() * (max - min + 1)) + min;
      d = Math.floor(Math.random() * (max - min + 1)) + min;
      operacion = operaciones[Math.floor(Math.random() * operaciones.length)];
    }

    if (operacion === "+") {
      resultado = simplificar(a * d + c * b, b * d);
    } else if (operacion === "-") {
      resultado = simplificar(a * d - c * b, b * d);
    } else if (operacion === "×") {
      resultado = simplificar(a * c, b * d);
    } else if (operacion === "÷") {
      resultado = simplificar(a * d, b * c);
    } else {
      resultado = simplificar(a * d + c * b, b * d);
    }

    problemaStr = `${a}/${b} ${operacion} ${c}/${d}`;
    intento++;
  } while (usedProblemas.has(problemaStr) && intento < 60);

  usedProblemas.add(problemaStr);
  correcta = resultado;
  let preguntaHTML =
    formatFraction(a, b) +
    `<span class="operador">${operacion}</span>` +
    formatFraction(c, d);

  document.getElementById("pregunta").innerHTML = preguntaHTML;
  actualizarProgreso();
  if (modo === 'alternativas') {
    mostrarAlternativas();
  } else {
    document.getElementById('alternativas').innerHTML = '';
    document.getElementById('respuesta').value = '';
  }
}

function generarAlternativas(correcta) {
  let opciones = [correcta];

  while (opciones.length < 4) {
    let variacionNum = Math.floor(Math.random() * 7) - 3;
    let variacionDen = Math.floor(Math.random() * 7) - 3;
    let num = correcta.num + variacionNum;
    let den = correcta.den + variacionDen;

    if (den === 0) {
      den = correcta.den + 1;
    }

    let alternativa = simplificar(num, den);
    if (alternativa.den === 0) continue;
    if (alternativa.num === correcta.num && alternativa.den === correcta.den) continue;
    if (opciones.some(opt => opt.num === alternativa.num && opt.den === alternativa.den)) continue;

    opciones.push(alternativa);
  }

  return opciones.sort(() => Math.random() - 0.5);
}

function mostrarAlternativas() {
  seleccionActual = null;
  let alternativas = generarAlternativas(correcta);
  let html = alternativas.map((frac, index) =>
    `<button class="alternativa" data-num="${frac.num}" data-den="${frac.den}" onclick="seleccionarAlternativa(this)">${formatFraction(frac.num, frac.den)}</button>`
  ).join("");

  document.getElementById("alternativas").innerHTML = html;
}

function seleccionarAlternativa(button) {
  seleccionActual = {
    num: parseInt(button.dataset.num, 10),
    den: parseInt(button.dataset.den, 10),
  };

  document.querySelectorAll('.alternativa').forEach(btn => {
    btn.classList.remove('seleccionada');
  });
  button.classList.add('seleccionada');
}

function playClick() {
  initAudio();
  unlockVideoSound();
  playTone(950, 0.02, 'square', 0.08);
}

function unlockVideoSound() {
  const video = document.getElementById('bg-video');
  if (!video) return;
  video.muted = !videoActivo;
  video.volume = videoActivo ? 0.24 : 0;
  if (videoActivo) {
    video.play().catch(() => {});
  }
}

function playCorrect() {
  initAudio();
  playTone(660, 0.1, 'triangle', 0.16);
  setTimeout(() => playTone(880, 0.08, 'triangle', 0.12), 80);
  lanzarConfetti(1.5, 35);
}

function playError() {
  initAudio();
  playTone(220, 0.12, 'sawtooth', 0.16);
  setTimeout(() => playTone(180, 0.08, 'sawtooth', 0.12), 80);
}

function initAudio() {
  if (audioContext) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function playTone(freq, duration = 0.08, type = 'sine', gainValue = 0.14) {
  if (!audioContext) return;
  let osc = audioContext.createOscillator();
  let gain = audioContext.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  gain.gain.setValueAtTime(gainValue, audioContext.currentTime);
  osc.connect(gain);
  gain.connect(audioContext.destination);
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
  osc.stop(audioContext.currentTime + duration + 0.02);
}

function parseFraccion(value) {
  let text = value.trim();
  if (!text) {
    return null;
  }
  let parts = text.split("/").map(part => part.trim());
  if (parts.length === 1) {
    let num = parseInt(parts[0], 10);
    if (isNaN(num)) return null;
    return simplificar(num, 1);
  }
  if (parts.length === 2) {
    let num = parseInt(parts[0], 10);
    let den = parseInt(parts[1], 10);
    if (isNaN(num) || isNaN(den) || den === 0) return null;
    return simplificar(num, den);
  }
  return null;
}

function compararFracciones(a, b) {
  return a.num === b.num && a.den === b.den;
}

function enviar() {
  if (modo === 'alternativas') {
    if (!seleccionActual) {
      document.getElementById("mensaje").innerText = "Selecciona una alternativa antes de enviar.";
      return;
    }

    if (compararFracciones(seleccionActual, correcta)) {
      puntos += 5;
      document.getElementById("mensaje").innerText = "✅ Correcto";
      playCorrect();
    } else {
      errores++;
      vidas--;
      document.getElementById("mensaje").innerText =
        "❌ Incorrecto. La respuesta era " + fraccionToString(correcta);
      playError();
    }

    document.querySelectorAll('.alternativa').forEach(btn => btn.disabled = true);
    document.getElementById("vidas").innerText = vidas;
    document.getElementById("errores").innerText = errores;
    document.getElementById("puntos").innerText = puntos;
    seleccionActual = null;
  } else {
    let respuestaInput = document.getElementById("respuesta").value;
    let respuesta = parseFraccion(respuestaInput);

    if (respuesta && compararFracciones(respuesta, correcta)) {
      puntos += 5;
      document.getElementById("mensaje").innerText = "✅ Correcto";
      playCorrect();
    } else {
      vidas--;
      document.getElementById("mensaje").innerText =
        "❌ Incorrecto. La respuesta era " + fraccionToString(correcta);
      playError();
    }

    document.getElementById("respuesta").value = "";
    document.getElementById("vidas").innerText = vidas;
    document.getElementById("puntos").innerText = puntos;
  }

  actual++;

  if (vidas <= 0 || actual > 40) {
    setTimeout(terminar, 300);
  } else {
    setTimeout(crearProblema, 300);
  }
}

function terminar() {
  playClick();
  document.getElementById("juego").classList.add("hidden");

  if (vidas <= 0) {
    mostrarVideoDerrota();
    return;
  }

  document.getElementById("final").classList.remove("hidden");
  const resultadoEl = document.getElementById("resultado");
  resultadoEl.innerHTML =
    "🎉 Ganastes el juego, felicidades!<br><br>⭐ Puntos: " + puntos +
    "<br>✅ Aciertos: " + Math.min(40, Math.floor(puntos / 5)) + "/40";
  lanzarConfetti();
}

function mostrarVideoDerrota() {
  const bgVideo = document.getElementById('bg-video');
  const loseVideo = document.getElementById('lose-video');
  const overlay = document.getElementById('lose-overlay');
  if (bgVideo) {
    bgVideo.classList.add('hidden');
  }
  if (!loseVideo || !overlay) return;

  overlay.classList.remove('hidden');
  loseVideo.classList.remove('hidden');
  loseVideo.currentTime = 0;
  loseVideo.muted = false;
  loseVideo.volume = 0.8;
  loseVideo.play().catch(() => {});

  loseVideo.onended = () => {
    overlay.classList.remove('hidden');
  };
}

function ocultarVideoDerrota() {
  const bgVideo = document.getElementById('bg-video');
  const loseVideo = document.getElementById('lose-video');
  const overlay = document.getElementById('lose-overlay');
  if (bgVideo) {
    bgVideo.classList.remove('hidden');
  }
  if (!loseVideo || !overlay) return;
  loseVideo.pause();
  loseVideo.currentTime = 0;
  loseVideo.classList.add('hidden');
  overlay.classList.add('hidden');
}

function lanzarConfetti(duration = 5, count = 80) {
  const confetti = document.getElementById('confetti');
  if (!confetti) return;

  confetti.innerHTML = '';
  confetti.classList.remove('hidden');

  const colors = ['#ff3cac', '#3acaff', '#ffdc3a', '#6bff4b', '#ff7a28', '#9b5cff'];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = Math.random() * 12 + 6;
    const width = size * (Math.random() * 0.7 + 0.6);
    const height = size * (Math.random() * 1.8 + 0.8);
    piece.style.width = `${width}px`;
    piece.style.height = `${height}px`;
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `${-Math.random() * 20 - 10}px`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.opacity = `${Math.random() * 0.4 + 0.7}`;
    piece.style.animationDuration = `${Math.random() * 1.5 + duration}s`;
    piece.style.animationDelay = `${Math.random() * 0.6}s`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.setProperty('--dx', `${Math.random() * 220 - 110}px`);
    if (Math.random() > 0.7) {
      piece.style.borderRadius = '50%';
    }
    confetti.appendChild(piece);
  }

  setTimeout(() => {
    confetti.classList.add('hidden');
    confetti.innerHTML = '';
  }, (duration + 0.6) * 1000);
}

function clearConfetti() {
  const confetti = document.getElementById('confetti');
  if (!confetti) return;
  confetti.classList.add('hidden');
  confetti.innerHTML = '';
}
