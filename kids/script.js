const VIDA_MAX_JUGADOR = 70;
const VIDA_MAX_ENEMIGO = 50;
let vidaJugador = VIDA_MAX_JUGADOR;
let vidaEnemigo = VIDA_MAX_ENEMIGO;
let puntos = 0;
let rondaActual = 1;
let bloqueado = false;

let num;
let den;
let jugadorNombre = 'Mago Aprendiz';
let jugadorAvatar = '🧙‍♂️';
let problemaActual = 1;
const PROBLEMAS_POR_ENEMIGO = 8;
let usedProblemas = new Set();
let temaUsuario = null;

function shuffleArray(array) {
    let arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function seleccionarAvatar(avatar) {
    jugadorAvatar = avatar;
    document.querySelectorAll('.avatar-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.avatar === avatar);
    });
}

function reproducirAudio(audio, { volumen = 0.28, loop = false } = {}) {
    if (!audio) return;

    try {
        audio.muted = false;
        audio.volume = volumen;
        audio.loop = loop;
        audio.currentTime = 0;
        audio.load();
        const playPromise = audio.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch((error) => {
                console.warn('No se pudo reproducir el audio:', error);
            });
        }
    } catch (e) {
        console.warn('No se pudo preparar el audio:', e);
    }
}

function activarSonido() {
    const sonidosFondo = [
        document.getElementById('bg-audio'),
        document.getElementById('bg-audio-2'),
        document.getElementById('bg-audio-3'),
        document.getElementById('bg-audio-4')
    ].filter(Boolean);

    if (sonidosFondo.length === 0) return;

    let indiceActual = 0;

    const reproducirSiguiente = () => {
        const audioActual = sonidosFondo[indiceActual];
        if (!audioActual) return;

        reproducirAudio(audioActual, { volumen: 0.28, loop: false });
        audioActual.onended = () => {
            indiceActual = (indiceActual + 1) % sonidosFondo.length;
            reproducirSiguiente();
        };
    };

    reproducirSiguiente();
}

function ingresarJuego() {
    const nombre = document.getElementById('nombreJugador').value.trim();
    if (!nombre) {
        alert('Escribe un nombre de héroe para comenzar.');
        return;
    }

    jugadorNombre = nombre;
    temaUsuario = crearTemaUsuario();
    usedProblemas.clear();
    document.getElementById('heroe').innerText = jugadorAvatar;
    document.getElementById('heroeNombre').innerText = jugadorNombre;

    document.getElementById('perfil').classList.add('oculto');
    document.getElementById('moduloJuego').classList.remove('oculto');

    const bgVideo = document.getElementById('bg-video');
    if (bgVideo) {
        bgVideo.classList.add('oculto');
        bgVideo.pause();
    }

    activarSonido();
    actualizar();
    generarPregunta();
}

// Motor de audio integrado en JS (Sintetizador por código)
const AudioEngine = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playAcierto() {
        this.init();
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    },
    playFallo() {
        this.init();
        let osc = this.ctx.createOscillator();
        let gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },
    playVictoria() {
        this.init();
        let notas = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notas.forEach((nota, index) => {
            let osc = this.ctx.createOscillator();
            let gain = this.ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(nota, this.ctx.currentTime + (index * 0.1));
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime + (index * 0.1));
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (index * 0.1) + 0.2);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + (index * 0.1));
            osc.stop(this.ctx.currentTime + (index * 0.1) + 0.2);
        });
    },
    playDerrota() {
        this.init();
        let notas = [392.00, 349.23, 311.13, 261.63]; // G4, F4, D#4, C4
        notas.forEach((nota, index) => {
            let osc = this.ctx.createOscillator();
            let gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(nota, this.ctx.currentTime + (index * 0.15));
            gain.gain.setValueAtTime(0.2, this.ctx.currentTime + (index * 0.15));
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + (index * 0.15) + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + (index * 0.15));
            osc.stop(this.ctx.currentTime + (index * 0.15) + 0.3);
        });
    }
};

const paletasBase = [
    { activo: '#22c55e', inactivo: '#cbd5e1', borde: '#86efac', brillo: '#bef264' },
    { activo: '#3b82f6', inactivo: '#cbd5e1', borde: '#93c5fd', brillo: '#60a5fa' },
    { activo: '#f59e0b', inactivo: '#e2e8f0', borde: '#fbbf24', brillo: '#fde08a' },
    { activo: '#8b5cf6', inactivo: '#c7d2fe', borde: '#c4b5fd', brillo: '#ddd6fe' },
    { activo: '#14b8a6', inactivo: '#cbe7e2', borde: '#5eead4', brillo: '#a5f3fc' },
    { activo: '#ec4899', inactivo: '#f5d0e4', borde: '#fb7185', brillo: '#fbcfe8' },
    { activo: '#f97316', inactivo: '#fde68a', borde: '#fdba74', brillo: '#fed7aa' }
];

const cronicaAventura = [
    { ronda: 1, heroe: "🧙‍♂️", heroeN: "Mago Aprendiz", enemigo: "👾", enemigoN: "Slime de Virus", minDen: 4, maxDen: 6 },
    { ronda: 2, heroe: "🏹", heroeN: "Arquero Explorador", enemigo: "🤖", enemigoN: "Gólem Mecánico", minDen: 5, maxDen: 8 },
    { ronda: 3, heroe: "🛡️", heroeN: "Caballero de Hierro", enemigo: "👺", enemigoN: "Troll de Montaña", minDen: 7, maxDen: 10 },
    { ronda: 4, heroe: "🥷", heroeN: "Ninja de las Sombras", enemigo: "👹", enemigoN: "Ogro Feroz", minDen: 9, maxDen: 12 },
    { ronda: 5, heroe: "🧜‍♂️", heroeN: "Rey de los Mares", enemigo: "🦑", enemigoN: "Kraken Marino", minDen: 11, maxDen: 15 },
    { ronda: 6, heroe: "🧝‍♀️", heroeN: "Elfa de la Luz", enemigo: "💀", enemigoN: "Señor de la Muerte", minDen: 13, maxDen: 18 },
    { ronda: 7, heroe: "👑", heroeN: "Paladín Supremo", enemigo: "🐲", enemigoN: "Dragón del Caos", minDen: 15, maxDen: 22 }
];

function crearTemaUsuario() {
    const paletas = shuffleArray(paletasBase);
    const extras = shuffleArray(['pentagono','hexagono','estrella','corazon','semicirculo','rombo','trapecio','octagono']);
    const formasPorRonda = [
        ['cuadrado','circulo','rectangulo'],
        ['cuadrado','circulo','rectangulo','triangulo'],
        ['cuadrado','circulo','rectangulo','triangulo', extras[0]],
        ['cuadrado','circulo','rectangulo','triangulo', extras[0], extras[1], extras[2]],
        ['cuadrado','circulo','rectangulo','triangulo', extras[0], extras[1], extras[2], extras[3]],
        ['cuadrado','circulo','rectangulo','triangulo', extras[0], extras[1], extras[2], extras[3], extras[4]],
        ['cuadrado','circulo','rectangulo','triangulo', extras[0], extras[1], extras[2], extras[3], extras[4], extras[5], extras[6], extras[7]]
    ];
    const rangos = cronicaAventura.map((base, index) => {
        const ajuste = Math.floor(Math.random() * 3);
        return {
            ...base,
            minDen: base.minDen + ajuste,
            maxDen: base.maxDen + ajuste + 1,
            paleta: paletas[index]
        };
    });
    return { paletas, formasPorRonda, rangos };
}

function obtenerPaletaRonda(ronda) {
    if (temaUsuario && temaUsuario.rangos && temaUsuario.rangos[ronda - 1]) {
        return temaUsuario.rangos[ronda - 1].paleta;
    }
    const paletas = [
        { activo: '#22c55e', inactivo: '#cbd5e1', borde: '#86efac', brillo: '#bef264' },
        { activo: '#3b82f6', inactivo: '#cbd5e1', borde: '#93c5fd', brillo: '#60a5fa' },
        { activo: '#f59e0b', inactivo: '#e2e8f0', borde: '#fbbf24', brillo: '#fde08a' },
        { activo: '#8b5cf6', inactivo: '#c7d2fe', borde: '#c4b5fd', brillo: '#ddd6fe' },
        { activo: '#14b8a6', inactivo: '#cbe7e2', borde: '#5eead4', brillo: '#a5f3fc' },
        { activo: '#ec4899', inactivo: '#f5d0e4', borde: '#fb7185', brillo: '#fbcfe8' },
        { activo: '#f97316', inactivo: '#fde68a', borde: '#fdba74', brillo: '#fed7aa' }
    ];
    return paletas[Math.min(ronda - 1, paletas.length - 1)];
}

function generarPregunta() {
    if (rondaActual > 7) {
        terminarJuego(true);
        return;
    }

    let nivelDatos = temaUsuario && temaUsuario.rangos ? temaUsuario.rangos[rondaActual - 1] : cronicaAventura[rondaActual - 1];
    document.getElementById("enemigo").innerHTML = nivelDatos.enemigo;
    document.getElementById("enemigoNombre").innerHTML = nivelDatos.enemigoN;

    let intento = 0;
    do {
        den = Math.floor(Math.random() * (nivelDatos.maxDen - nivelDatos.minDen + 1)) + nivelDatos.minDen;
        num = Math.floor(Math.random() * (den - 1)) + 1;
        intento++;
        if (intento > 30) break;
    } while (usedProblemas.has(`${num}/${den}`));

    usedProblemas.add(`${num}/${den}`);

    const bloquesArea = document.getElementById("bloquesArea");
    bloquesArea.innerHTML = "";
    
    // Seleccionar forma aleatoria según el reino (ronda)
    const formasPorRonda = temaUsuario && temaUsuario.formasPorRonda ? temaUsuario.formasPorRonda : [
        ['cuadrado','circulo','rectangulo'],
        ['cuadrado','circulo','rectangulo','triangulo'],
        ['cuadrado','circulo','rectangulo','triangulo','pentagono'],
        ['cuadrado','circulo','rectangulo','triangulo','pentagono','hexagono'],
        ['cuadrado','circulo','rectangulo','triangulo','pentagono','hexagono','estrella'],
        ['cuadrado','circulo','rectangulo','triangulo','pentagono','hexagono','estrella','corazon'],
        ['cuadrado','circulo','rectangulo','triangulo','pentagono','hexagono','estrella','corazon','semicirculo','rombo','trapecio','octagono']
    ];
    const paleta = obtenerPaletaRonda(rondaActual);
    const posibles = formasPorRonda[Math.min(rondaActual-1, formasPorRonda.length-1)];
    const formaActual = posibles[Math.floor(Math.random() * posibles.length)];
    const orientaciones = ['vertical', 'horizontal'];
    const orientacion = orientaciones[Math.floor(Math.random() * orientaciones.length)];
    
    // Dos pequeñas, luego dos grandes, dos pequeñas, dos grandes...
    const modoVisual = (Math.floor((problemaActual - 1) / 2) % 2) === 0 ? 'pequenasFiguras' : 'formaGrande';
    
    if (modoVisual === 'formaGrande') {
        const canvas = crearCanvasForma(bloquesArea);
        dibujarFormaCanvas(canvas, formaActual, num, den, orientacion, false, paleta);
    } else {
        dibujarPiezasPequenas(bloquesArea, formaActual, num, den, paleta);
    }

    document.getElementById("respuesta").value = "";
    document.getElementById("respuesta").focus();
    bloqueado = false;
}

function crearCanvasForma(container) {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 320;
    canvas.className = 'shape-canvas';
    canvas.style.width = '320px';
    canvas.style.height = '320px';
    container.appendChild(canvas);
    return canvas;
}

function dibujarPiezasPequenas(container, forma, num, den, paleta) {
    container.className = 'bloques-container';
    container.style.cssText = '';
    const piezasContenedor = document.createElement('div');
    piezasContenedor.className = 'pequenas-piezas';
    container.appendChild(piezasContenedor);

    for (let i = 0; i < den; i++) {
        const activo = i < num;
        // Para figuras complejas, usamos SVG embebido en cada bloque pequeño para consistencia
        const pieza = document.createElement('div');
        pieza.className = 'bloque-svg';
        let color = activo ? paleta.activo : paleta.inactivo;
        let border = activo ? paleta.borde : '#94a3b8';
        let fondo = activo ? `linear-gradient(135deg, ${paleta.activo}, ${paleta.brillo})` : `linear-gradient(135deg, ${paleta.inactivo}, #e2e8f0)`;
        if (forma === 'circulo') {
            pieza.className = 'bloque-circulo';
            pieza.style.background = fondo;
            pieza.style.borderColor = border;
            pieza.style.boxShadow = activo ? `0 0 12px ${paleta.activo}` : '0 2px 4px rgba(0,0,0,0.15)';
            piezasContenedor.appendChild(pieza);
            continue;
        }
        if (forma === 'triangulo') {
            pieza.className = 'bloque-triangulo';
            pieza.style.borderBottomColor = color;
            pieza.style.filter = activo ? `drop-shadow(0 0 8px ${paleta.activo})` : 'none';
            piezasContenedor.appendChild(pieza);
            continue;
        }
        if (forma === 'rectangulo') {
            pieza.className = 'bloque-rectangulo';
            pieza.style.background = fondo;
            pieza.style.borderColor = border;
            piezasContenedor.appendChild(pieza);
            continue;
        }

        // Figuras SVG para pentágono, hexágono, estrella, corazón, semicirculo, rombo, trapecio, octagono
        let svg = '';
        if (forma === 'pentagono' || forma === 'hexagono' || forma === 'octagono') {
            const sides = forma === 'pentagono' ? 5 : forma === 'hexagono' ? 6 : 8;
            svg = `<svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg"><polygon points="${generatePolygonPoints(50,50,40,sides)}" fill="${color}" stroke="${border}" stroke-width="2"/></svg>`;
        } else if (forma === 'estrella') {
            svg = `<svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg"><path d="${starPath(5,50,50,36,16)}" fill="${color}" stroke="${border}" stroke-width="2"/></svg>`;
        } else if (forma === 'corazon') {
            svg = `<svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg"><path d="M50 74 L20 44 A14 14 0 0 1 35 20 A18 18 0 0 1 50 34 A18 18 0 0 1 65 20 A14 14 0 0 1 80 44 Z" fill="${color}" stroke="${border}" stroke-width="2"/></svg>`;
        } else if (forma === 'semicirculo') {
            svg = `<svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg"><path d="M10 50 A40 40 0 0 1 90 50 L90 90 L10 90 Z" fill="${color}" stroke="${border}" stroke-width="2"/></svg>`;
        } else if (forma === 'rombo') {
            svg = `<svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg"><polygon points="50,10 90,50 50,90 10,50" fill="${color}" stroke="${border}" stroke-width="2"/></svg>`;
        } else if (forma === 'trapecio') {
            svg = `<svg viewBox="0 0 100 100" width="36" height="36" xmlns="http://www.w3.org/2000/svg"><polygon points="20,25 80,25 70,75 30,75" fill="${color}" stroke="${border}" stroke-width="2"/></svg>`;
        } else {
            // fallback cuadrado
            pieza.className = 'bloque-mat ' + (activo ? 'activo' : 'inactivo');
            piezasContenedor.appendChild(pieza);
            continue;
        }
        pieza.innerHTML = svg;
        piezasContenedor.appendChild(pieza);
    }
}

// Helpers para generar puntos SVG
function generatePolygonPoints(cx, cy, r, sides) {
    const pts = [];
    for (let i=0;i<sides;i++){
        const a = (Math.PI*2*i/sides) - Math.PI/2;
        const x = cx + Math.cos(a)*r;
        const y = cy + Math.sin(a)*r;
        pts.push(x+','+y);
    }
    return pts.join(' ');
}

function starPath(points, cx, cy, outerR, innerR) {
    let path = '';
    for (let i = 0; i < points * 2; i++) {
        const r = (i % 2 === 0) ? outerR : innerR;
        const a = Math.PI / points * i - Math.PI / 2;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        path += (i === 0 ? 'M' : 'L') + x + ' ' + y + ' ';
    }
    path += 'Z';
    return path;
}

function createShapePath(forma, centerX, centerY, radius, orientacion) {
    const path = new Path2D();
    if (forma === 'pentagono' || forma === 'hexagono' || forma === 'octagono') {
        const sides = forma === 'pentagono' ? 5 : forma === 'hexagono' ? 6 : 8;
        const scale = forma === 'octagono' ? 1.7 : 2.2;
        for (let i = 0; i < sides; i++) {
            const a = (Math.PI * 2 * i / sides) - Math.PI / 2;
            const x = centerX + Math.cos(a) * radius * scale;
            const y = centerY + Math.sin(a) * radius * scale;
            if (i === 0) path.moveTo(x, y);
            else path.lineTo(x, y);
        }
        path.closePath();
    } else if (forma === 'estrella') {
        const outerR = radius * 2.2;
        const innerR = radius * 0.95;
        const points = 5;
        for (let i = 0; i < points * 2; i++) {
            const r = (i % 2 === 0) ? outerR : innerR;
            const a = Math.PI / points * i - Math.PI / 2;
            const x = centerX + Math.cos(a) * r;
            const y = centerY + Math.sin(a) * r;
            if (i === 0) path.moveTo(x, y);
            else path.lineTo(x, y);
        }
        path.closePath();
    } else if (forma === 'corazon') {
        const topY = centerY - radius * 0.2;
        path.moveTo(centerX, centerY + radius * 0.9);
        path.bezierCurveTo(centerX + radius * 1.2, centerY + radius * 0.2, centerX + radius * 0.6, centerY - radius * 1.1, centerX, topY);
        path.bezierCurveTo(centerX - radius * 0.6, centerY - radius * 1.1, centerX - radius * 1.2, centerY + radius * 0.2, centerX, centerY + radius * 0.9);
        path.closePath();
    } else if (forma === 'semicirculo') {
        path.moveTo(centerX - radius * 2, centerY);
        path.arc(centerX, centerY, radius * 2, Math.PI, 0, false);
        path.lineTo(centerX + radius * 2, centerY + radius * 2);
        path.lineTo(centerX - radius * 2, centerY + radius * 2);
        path.closePath();
    } else if (forma === 'rombo') {
        path.moveTo(centerX, centerY - radius * 1.6);
        path.lineTo(centerX + radius * 1.3, centerY);
        path.lineTo(centerX, centerY + radius * 1.6);
        path.lineTo(centerX - radius * 1.3, centerY);
        path.closePath();
    } else if (forma === 'trapecio') {
        const topWidth = radius * 1.2;
        const bottomWidth = radius * 2.0;
        path.moveTo(centerX - topWidth / 2, centerY - radius * 1.0);
        path.lineTo(centerX + topWidth / 2, centerY - radius * 1.0);
        path.lineTo(centerX + bottomWidth / 2, centerY + radius * 1.2);
        path.lineTo(centerX - bottomWidth / 2, centerY + radius * 1.2);
        path.closePath();
    }
    return path;
}

function drawShapeSections(ctx, shapePath, num, den, centerX, centerY, w, h, fillColor) {
    ctx.save();
    ctx.clip(shapePath);
    const startOffset = -Math.PI / 2;
    const radius = Math.max(w, h);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000000';
    for (let i = 0; i < den; i++) {
        const start = startOffset + (i * 2 * Math.PI) / den;
        const end = startOffset + ((i + 1) * 2 * Math.PI) / den;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, start, end);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    for (let i = 0; i < den; i++) {
        const angle = startOffset + (i * 2 * Math.PI) / den;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
    }
    ctx.restore();
}

function dibujarFormaCanvas(canvas, forma, num, den, orientacion = 'vertical', mostrarFraccion = true, paleta = null) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const centerX = w / 2;
    const centerY = h / 2;
    const radius = Math.min(w, h) * 0.38;
    const fillColor = '#f97316';
    const strokeWidth = 10;
    const strokeColor = '#000000';

    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = strokeColor;

    if (forma === 'circulo') {
        const startAngleOffset = -Math.PI / 2;
        for (let i = 0; i < den; i++) {
            const startAngle = startAngleOffset + (i * 2 * Math.PI) / den;
            const endAngle = startAngleOffset + ((i + 1) * 2 * Math.PI) / den;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.stroke();
        }
    } else if (forma === 'triangulo') {
        const top = { x: centerX, y: orientacion === 'vertical' ? centerY - radius * 0.95 : centerY + radius * 0.95 };
        const left = { x: centerX - radius, y: orientacion === 'vertical' ? centerY + radius * 0.8 : centerY - radius * 0.8 };
        const right = { x: centerX + radius, y: orientacion === 'vertical' ? centerY + radius * 0.8 : centerY - radius * 0.8 };
        for (let i = 0; i < den; i++) {
            const x1 = left.x + ((right.x - left.x) * i) / den;
            const x2 = left.x + ((right.x - left.x) * (i + 1)) / den;
            ctx.beginPath();
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(x1, left.y);
            ctx.lineTo(x2, left.y);
            ctx.closePath();
            ctx.fillStyle = fillColor;
            ctx.fill();
            ctx.stroke();
        }
        if (den > 1) {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 10;
            for (let i = 1; i < den; i++) {
                const x = left.x + ((right.x - left.x) * i) / den;
                ctx.beginPath();
                ctx.moveTo(x, left.y);
                ctx.lineTo(top.x, top.y);
                ctx.stroke();
            }
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = strokeWidth;
            ctx.beginPath();
            ctx.moveTo(top.x, top.y);
            ctx.lineTo(left.x, left.y);
            ctx.lineTo(right.x, right.y);
            ctx.closePath();
            ctx.stroke();
        }
    } else if (forma === 'rectangulo') {
        const isHorizontal = orientacion === 'horizontal';
        const rectWidth = isHorizontal ? radius * 1.7 : radius * 1.1;
        const rectHeight = isHorizontal ? radius * 1.1 : radius * 1.7;
        const left = centerX - rectWidth / 2;
        const top = centerY - rectHeight / 2;
        const sliceSize = isHorizontal ? rectWidth / den : rectHeight / den;
        for (let i = 0; i < den; i++) {
            ctx.fillStyle = fillColor;
            if (isHorizontal) {
                ctx.fillRect(left + sliceSize * i, top, sliceSize, rectHeight);
                ctx.strokeRect(left + sliceSize * i, top, sliceSize, rectHeight);
            } else {
                ctx.fillRect(left, top + sliceSize * i, rectWidth, sliceSize);
                ctx.strokeRect(left, top + sliceSize * i, rectWidth, sliceSize);
            }
        }
    } else {
        const formasComplejas = ['pentagono', 'hexagono', 'estrella', 'corazon', 'semicirculo', 'rombo', 'trapecio', 'octagono'];
        if (formasComplejas.includes(forma)) {
            const shapePath = createShapePath(forma, centerX, centerY, radius, orientacion);
            drawShapeSections(ctx, shapePath, num, den, centerX, centerY, w, h, fillColor);
            ctx.strokeStyle = '#000000cc';
            ctx.lineWidth = strokeWidth;
            ctx.stroke(shapePath);
        } else {
            const squareSize = orientacion === 'horizontal' ? radius * 1.9 : radius * 1.4;
            const left = centerX - squareSize / 2;
            const top = centerY - squareSize / 2;
            const sliceWidth = squareSize / den;
            for (let i = 0; i < den; i++) {
                ctx.fillStyle = fillColor;
                ctx.fillRect(left + sliceWidth * i, top, sliceWidth, squareSize);
                ctx.strokeRect(left + sliceWidth * i, top, sliceWidth, squareSize);
            }
        }
    }

    if (mostrarFraccion) {
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${num}/${den}`, centerX, h - 26);
        ctx.strokeStyle = '#00000033';
        ctx.lineWidth = 1;
        ctx.strokeText(`${num}/${den}`, centerX, h - 26);
    }
}


function actualizar() {
    if (vidaJugador < 0) vidaJugador = 0;
    if (vidaEnemigo < 0) vidaEnemigo = 0;

    document.getElementById("vidaJugadorTxt").innerHTML = `${vidaJugador} / ${VIDA_MAX_JUGADOR}`;
    document.getElementById("vidaEnemigoTxt").innerHTML = `${vidaEnemigo} / ${VIDA_MAX_ENEMIGO}`;

    document.getElementById("vidaJugador").style.width = `${Math.max(0, Math.min(100, (vidaJugador / VIDA_MAX_JUGADOR) * 100))}%`;
    document.getElementById("vidaEnemigo").style.width = `${Math.max(0, Math.min(100, (vidaEnemigo / VIDA_MAX_ENEMIGO) * 100))}%`;

    // Aplicar efectos de daño visual
    let porcentajeDañoHeroe = 1 - (vidaJugador / VIDA_MAX_JUGADOR);
    let porcentajeDañoEnemigo = 1 - (vidaEnemigo / VIDA_MAX_ENEMIGO);
    
    let heroeSprite = document.getElementById("heroe");
    let enemigoSprite = document.getElementById("enemigo");
    let heroDaño = document.getElementById("heroeDaño");
    let enemigoDaño = document.getElementById("enemigoDaño");
    
    // Mostrar rajaduras según el daño - más notorio conforme aumenta
    if (heroDaño) {
        heroDaño.style.opacity = Math.min(1, porcentajeDañoHeroe * 3);
        let escalaRajaduraHeroe = 1 + (porcentajeDañoHeroe * 0.5);
        heroDaño.style.transform = `translate(-50%, -50%) scale(${escalaRajaduraHeroe})`;
    }
    if (enemigoDaño) {
        enemigoDaño.style.opacity = Math.min(1, porcentajeDañoEnemigo * 3);
        let escalaRajaduraEnemigo = 1 + (porcentajeDañoEnemigo * 0.5);
        enemigoDaño.style.transform = `translate(-50%, -50%) scale(${escalaRajaduraEnemigo})`;
    }
    
    // Efecto: Escala reducida + Rotación
    if (heroeSprite) {
        let escalaHeroe = 1 - (porcentajeDañoHeroe * 0.2);
        let rotacionHeroe = porcentajeDañoHeroe * 8;
        let briHeroHeroe = 1 - (porcentajeDañoHeroe * 0.4);
        heroeSprite.style.transform = `scale(${escalaHeroe}) rotate(${rotacionHeroe}deg)`;
        heroeSprite.style.filter = `brightness(${briHeroHeroe})`;
    }
    if (enemigoSprite) {
        let escalaEnemigo = 1 - (porcentajeDañoEnemigo * 0.2);
        let rotacionEnemigo = porcentajeDañoEnemigo * 8;
        let brightnessEnemigo = 1 - (porcentajeDañoEnemigo * 0.4);
        enemigoSprite.style.transform = `scale(${escalaEnemigo}) rotate(${rotacionEnemigo}deg)`;
        enemigoSprite.style.filter = `brightness(${brightnessEnemigo})`;
    }
    
    const puntosElem = document.getElementById("puntos");
    const rondaElem = document.getElementById("rondaTxt");
    const problemaElem = document.getElementById("problemaTxt");

    if (puntosElem) puntosElem.innerHTML = puntos;
    if (rondaElem) rondaElem.innerHTML = `${rondaActual} / 7`;
    if (problemaElem) problemaElem.innerHTML = `${Math.min(problemaActual, PROBLEMAS_POR_ENEMIGO)} / ${PROBLEMAS_POR_ENEMIGO}`;
}

function crearDisparo(esDelHeroe) {
    const container = document.getElementById("disparosContainer");
    const disparo = document.createElement("div");
    disparo.classList.add("disparo");
    
    if (esDelHeroe) {
        disparo.classList.add("disparo-heroe", "heroe-ataca");
    } else {
        disparo.classList.add("disparo-enemigo", "enemigo-ataca");
    }
    
    container.appendChild(disparo);
    
    setTimeout(() => {
        disparo.remove();
    }, 600);
}

function crearMultiplesDisparos(esDelHeroe, cantidad = 5) {
    for (let i = 0; i < cantidad; i++) {
        setTimeout(() => {
            crearDisparo(esDelHeroe);
        }, i * 80);
    }
}

function verificar() {
    if (bloqueado) return;

    let r = document.getElementById("respuesta").value.trim();
    let mensajeBox = document.getElementById("mensaje");
    let heroeSprite = document.getElementById("heroe");
    let enemigoSprite = document.getElementById("enemigo");

    if (!r.includes("/")) {
        mensajeBox.style.color = "#fbbf24";
        mensajeBox.innerHTML = "⚠️ ¡Escribe la respuesta en formato de fracción! (Ej: 2/5)";
        return;
    }

    bloqueado = true;

    if (r === num + "/" + den) {
        problemaActual++;
        AudioEngine.playAcierto();

        mensajeBox.style.color = "#4ade80";
        mensajeBox.innerHTML = "💥 ¡GOLPE CRÍTICO ACERTADO!";

        let daño = 10;
        vidaEnemigo -= daño;

        crearMultiplesDisparos(true, 5);

        heroeSprite.classList.add("atacarIzq");
        setTimeout(() => {
            heroeSprite.classList.remove("atacarIzq");
            enemigoSprite.classList.add("recibirDaño");
        }, 250);

        setTimeout(() => {
            enemigoSprite.classList.remove("recibirDaño");
        }, 650);

        puntos += 100;

        if (vidaEnemigo <= 0) {
            setTimeout(() => {
                AudioEngine.playVictoria();
                
                rondaActual++;
                problemaActual = 1;
                if (rondaActual > 7) {
                    terminarJuego(true);
                } else {
                    mensajeBox.innerHTML = "✨ ¡Rival derrotado! Viajando al siguiente reino...";
                    vidaEnemigo = VIDA_MAX_ENEMIGO;
                    actualizar();
                    setTimeout(generarPregunta, 1500);
                }
            }, 800);
            actualizar();
            return;
        }

    } else {
        AudioEngine.playFallo();

        mensajeBox.style.color = "#f87171";
        mensajeBox.innerHTML = `❌ ¡FALLASTE! La respuesta correcta era ${num}/${den}`;

        vidaJugador -= 25;

        crearMultiplesDisparos(false, 5);

        enemigoSprite.classList.add("atacarDer");
        setTimeout(() => {
            enemigoSprite.classList.remove("atacarDer");
            heroeSprite.classList.add("recibirDaño");
        }, 250);

        setTimeout(() => {
            heroeSprite.classList.remove("recibirDaño");
        }, 650);

        if (vidaJugador <= 0) {
            actualizar();
            setTimeout(() => { terminarJuego(false); }, 800);
            return;
        }
    }

    actualizar();
    setTimeout(generarPregunta, 1800);
}

function terminarJuego(victoria) {
    document.getElementById("moduloJuego").classList.add("oculto");
    document.getElementById("moduloFinal").classList.remove("oculto");

    let titulo = document.getElementById("tituloFinal");
    let rangoBox = document.getElementById("rangoFinal");
    document.getElementById("puntosFinal").innerHTML = puntos;

    if (victoria) {
        AudioEngine.playVictoria();
        titulo.innerHTML = "🏆 ¡AVENTURA COMPLETADA CON ÉXITO!";
        titulo.style.color = "#f59e0b";
        
        if (puntos >= 700) rangoBox.innerHTML = "Rango Absoluto: 👑 DIOS DE LAS FRACCIONES";
        else if (puntos >= 500) rangoBox.innerHTML = "Rango: 🥇 HÉROE LEYENDA";
        else rangoBox.innerHTML = "Rango: 🥈 GUERRERO EXPERTO";
    } else {
        AudioEngine.playDerrota();
        titulo.innerHTML = "💀 EL HÉROE HA CAÍDO EN COMBATE";
        titulo.style.color = "#ef4444";
        rangoBox.innerHTML = "Rango obtenido: 📚 APRENDIZ CAÍDO";
    }
}

function reiniciarJuego() {
    vidaJugador = VIDA_MAX_JUGADOR;
    vidaEnemigo = VIDA_MAX_ENEMIGO;
    puntos = 0;
    rondaActual = 1;
    problemaActual = 1;
    temaUsuario = crearTemaUsuario();
    usedProblemas.clear();
    
    document.getElementById("moduloFinal").classList.add("oculto");
    document.getElementById("moduloJuego").classList.remove("oculto");
    document.getElementById("mensaje").innerHTML = "";
    
    actualizar();
    generarPregunta();
}

document.getElementById("respuesta").addEventListener("keypress", function(e) {
    if (e.key === "Enter") verificar();
});

document.getElementById('perfilIngresarBtn').addEventListener('click', ingresarJuego);
document.querySelectorAll('.avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        seleccionarAvatar(btn.dataset.avatar);
        activarSonido();
    });
});

document.getElementById('moduloJuego').classList.add('oculto');
document.getElementById('moduloFinal').classList.add('oculto');

// Pre-seleccionar avatar por defecto y mantener pantalla de perfil visible
seleccionarAvatar(jugadorAvatar);

