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

function seleccionarAvatar(avatar) {
    jugadorAvatar = avatar;
    document.querySelectorAll('.avatar-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.avatar === avatar);
    });
}

function activarSonido() {
    const bgAudio = document.getElementById('bg-audio');
    const bgAudio2 = document.getElementById('bg-audio-2');
    if (bgAudio) {
        bgAudio.muted = false;
        bgAudio.volume = 0.28;
        bgAudio.load();
        bgAudio.play().catch((error) => {
            console.warn('No se pudo reproducir el audio de fondo:', error);
        });
        
        // Cuando termine el primer audio, inicia el segundo
        bgAudio.addEventListener('ended', function() {
            if (bgAudio2) {
                bgAudio2.muted = false;
                bgAudio2.volume = 0.28;
                bgAudio2.load();
                bgAudio2.play().catch((error) => {
                    console.warn('No se pudo reproducir el audio 2 de fondo:', error);
                });
                
                // Cuando termine el segundo, vuelve a reproducir el primero
                bgAudio2.addEventListener('ended', function() {
                    activarSonido();
                }, { once: true });
            }
        }, { once: true });
    }
}

function ingresarJuego() {
    const nombre = document.getElementById('nombreJugador').value.trim();
    if (!nombre) {
        alert('Escribe un nombre de héroe para comenzar.');
        return;
    }

    jugadorNombre = nombre;
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

const cronicaAventura = [
    { ronda: 1, heroe: "🧙‍♂️", heroeN: "Mago Aprendiz", enemigo: "👾", enemigoN: "Slime de Virus", minDen: 4, maxDen: 6 },
    { ronda: 2, heroe: "🏹", heroeN: "Arquero Explorador", enemigo: "🤖", enemigoN: "Gólem Mecánico", minDen: 5, maxDen: 8 },
    { ronda: 3, heroe: "🛡️", heroeN: "Caballero de Hierro", enemigo: "👺", enemigoN: "Troll de Montaña", minDen: 7, maxDen: 10 },
    { ronda: 4, heroe: "🥷", heroeN: "Ninja de las Sombras", enemigo: "👹", enemigoN: "Ogro Feroz", minDen: 9, maxDen: 12 },
    { ronda: 5, heroe: "🧜‍♂️", heroeN: "Rey de los Mares", enemigo: "🦑", enemigoN: "Kraken Marino", minDen: 11, maxDen: 14 },
    { ronda: 6, heroe: "🧝‍♀️", heroeN: "Elfa de la Luz", enemigo: "💀", enemigoN: "Señor de la Muerte", minDen: 13, maxDen: 16 },
    { ronda: 7, heroe: "👑", heroeN: "Paladín Supremo", enemigo: "🐲", enemigoN: "Dragón del Caos", minDen: 15, maxDen: 20 }
];

function generarPregunta() {
    if (rondaActual > 7) {
        terminarJuego(true);
        return;
    }

    if (problemaActual === 1) {
        usedProblemas.clear();
    }

    let nivelDatos = cronicaAventura[rondaActual - 1];
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
    
    for (let i = 0; i < den; i++) {
        const bloque = document.createElement("div");
        bloque.classList.add("bloque-mat");
        if (i < num) {
            bloque.classList.add("activo");
        } else {
            bloque.classList.add("inactiva", "bloque-mat", "inactivo");
        }
        bloquesArea.appendChild(bloque);
    }

    document.getElementById("respuesta").value = "";
    document.getElementById("respuesta").focus();
    bloqueado = false;
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
    heroDaño.style.opacity = Math.min(1, porcentajeDañoHeroe * 3);
    enemigoDaño.style.opacity = Math.min(1, porcentajeDañoEnemigo * 3);
    
    // Escala de rajaduras: más grandes conforme hay más daño
    let escalaRajaduraHeroe = 1 + (porcentajeDañoHeroe * 0.5);
    let escalaRajaduraEnemigo = 1 + (porcentajeDañoEnemigo * 0.5);
    heroDaño.style.transform = `translate(-50%, -50%) scale(${escalaRajaduraHeroe})`;
    enemigoDaño.style.transform = `translate(-50%, -50%) scale(${escalaRajaduraEnemigo})`;
    
    // Efecto: Escala reducida + Rotación
    let escalaHeroe = 1 - (porcentajeDañoHeroe * 0.2);
    let rotacionHeroe = porcentajeDañoHeroe * 8;
    let briHeroHeroe = 1 - (porcentajeDañoHeroe * 0.4);
    heroeSprite.style.transform = `scale(${escalaHeroe}) rotate(${rotacionHeroe}deg)`;
    heroeSprite.style.filter = `brightness(${briHeroHeroe})`;
    
    let escalaEnemigo = 1 - (porcentajeDañoEnemigo * 0.2);
    let rotacionEnemigo = porcentajeDañoEnemigo * 8;
    let brightnessEnemigo = 1 - (porcentajeDañoEnemigo * 0.4);
    enemigoSprite.style.transform = `scale(${escalaEnemigo}) rotate(${rotacionEnemigo}deg)`;
    enemigoSprite.style.filter = `brightness(${brightnessEnemigo})`;

    document.getElementById("puntos").innerHTML = puntos;
    document.getElementById("rondaTxt").innerHTML = `${rondaActual} / 7`;
    document.getElementById("problemaTxt").innerHTML = `${Math.min(problemaActual, PROBLEMAS_POR_ENEMIGO)} / ${PROBLEMAS_POR_ENEMIGO}`;

    let progresoAventura = ((rondaActual - 1) / 7) * 100;
    document.getElementById("xpBar").style.width = progresoAventura + "%";
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

