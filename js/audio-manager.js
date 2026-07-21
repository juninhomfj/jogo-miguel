(() => {
    class MiguelAudioManager {
        constructor() {
            this.contexto = null;
            this.desbloqueado = false;
            this.temaAtual = null;
            this.intervaloMusica = null;
            this.indiceMusica = 0;
            this.temporizadores = new Set();
            this.listenersInstalados = false;
            this.instalarDesbloqueio();
        }

        instalarDesbloqueio() {
            if (this.listenersInstalados) return;
            this.listenersInstalados = true;

            const desbloquear = () => {
                this.desbloquear();
            };

            ['pointerdown', 'touchstart', 'keydown'].forEach((evento) => {
                window.addEventListener(
                    evento,
                    desbloquear,
                    { passive: true }
                );
            });
        }

        obterContexto() {
            if (this.contexto) return this.contexto;

            const AudioContexto = (
                window.AudioContext
                || window.webkitAudioContext
            );

            if (!AudioContexto) return null;

            this.contexto = new AudioContexto();
            return this.contexto;
        }

        async desbloquear() {
            const contexto = this.obterContexto();
            if (!contexto) return false;

            try {
                if (contexto.state === 'suspended') {
                    await contexto.resume();
                }

                this.desbloqueado = contexto.state === 'running';

                if (
                    this.desbloqueado
                    && window.MIGUEL_SETTINGS_MANAGER
                    && typeof window.MIGUEL_SETTINGS_MANAGER
                        .marcarInteracaoUsuario === 'function'
                ) {
                    window.MIGUEL_SETTINGS_MANAGER
                        .marcarInteracaoUsuario();
                }

                if (this.desbloqueado && this.temaAtual) {
                    this.reiniciarMusica();
                }

                return this.desbloqueado;
            } catch (erro) {
                console.debug('[AUDIO] desbloqueio indisponível', erro);
                return false;
            }
        }

        configuracao() {
            const gerente = window.MIGUEL_SETTINGS_MANAGER;
            if (!gerente) {
                return {
                    musicaAtiva: true,
                    volumeMusica: 0.65,
                    efeitosAtivos: true,
                    volumeEfeitos: 0.8
                };
            }

            return gerente.obterTudo();
        }

        volume(tipo, multiplicador = 1) {
            const cfg = this.configuracao();
            const base = tipo === 'musica'
                ? Number(cfg.volumeMusica || 0)
                : Number(cfg.volumeEfeitos || 0);

            return Math.max(
                0,
                Math.min(0.35, base * multiplicador * 0.24)
            );
        }

        permitido(tipo) {
            const cfg = this.configuracao();
            if (tipo === 'musica') {
                return Boolean(cfg.musicaAtiva && cfg.volumeMusica > 0);
            }
            return Boolean(cfg.efeitosAtivos && cfg.volumeEfeitos > 0);
        }

        tom(frequencia, duracao, opcoes = {}) {
            const contexto = this.obterContexto();
            if (
                !contexto
                || !this.desbloqueado
                || !this.permitido(opcoes.tipo || 'efeito')
            ) {
                return;
            }

            const inicio = contexto.currentTime + Number(opcoes.atraso || 0);
            const fim = inicio + Math.max(0.025, duracao / 1000);
            const oscilador = contexto.createOscillator();
            const ganho = contexto.createGain();

            oscilador.type = opcoes.forma || 'square';
            oscilador.frequency.setValueAtTime(
                Math.max(30, frequencia),
                inicio
            );

            if (Number.isFinite(opcoes.frequenciaFinal)) {
                oscilador.frequency.exponentialRampToValueAtTime(
                    Math.max(30, opcoes.frequenciaFinal),
                    fim
                );
            }

            const volume = this.volume(
                opcoes.tipo || 'efeito',
                Number(opcoes.volume ?? 1)
            );

            ganho.gain.setValueAtTime(0.0001, inicio);
            ganho.gain.exponentialRampToValueAtTime(
                Math.max(0.0002, volume),
                inicio + 0.008
            );
            ganho.gain.exponentialRampToValueAtTime(0.0001, fim);

            oscilador.connect(ganho);
            ganho.connect(contexto.destination);
            oscilador.start(inicio);
            oscilador.stop(fim + 0.02);
        }

        ruido(duracao = 100, volume = 0.5) {
            const contexto = this.obterContexto();
            if (!contexto || !this.desbloqueado || !this.permitido('efeito')) {
                return;
            }

            const amostras = Math.max(
                1,
                Math.floor(contexto.sampleRate * duracao / 1000)
            );
            const buffer = contexto.createBuffer(1, amostras, contexto.sampleRate);
            const dados = buffer.getChannelData(0);

            for (let i = 0; i < dados.length; i += 1) {
                dados[i] = (Math.random() * 2 - 1) * (1 - i / dados.length);
            }

            const fonte = contexto.createBufferSource();
            const ganho = contexto.createGain();
            fonte.buffer = buffer;
            ganho.gain.value = this.volume('efeito', volume);
            fonte.connect(ganho);
            ganho.connect(contexto.destination);
            fonte.start();
        }

        sequencia(notas = []) {
            notas.forEach((nota) => {
                this.tom(
                    nota.f,
                    nota.d,
                    {
                        atraso: Number(nota.a || 0) / 1000,
                        forma: nota.forma || 'square',
                        frequenciaFinal: nota.ff,
                        volume: nota.v ?? 1,
                        tipo: nota.tipo || 'efeito'
                    }
                );
            });
        }

        tocarEfeito(nome) {
            if (!this.desbloqueado) {
                this.desbloquear();
                return false;
            }

            const efeitos = {
                pulo: [
                    { f: 240, ff: 510, d: 120, v: 0.8 }
                ],
                puloDuplo: [
                    { f: 320, ff: 720, d: 150, v: 0.9 },
                    { f: 780, d: 70, a: 95, v: 0.55 }
                ],
                ataque: [
                    { f: 170, ff: 80, d: 90, forma: 'sawtooth', v: 0.8 }
                ],
                coletar: [
                    { f: 660, d: 65, v: 0.65 },
                    { f: 880, d: 85, a: 55, v: 0.7 }
                ],
                energia: [
                    { f: 420, d: 80, v: 0.6 },
                    { f: 560, d: 80, a: 70, v: 0.65 },
                    { f: 840, d: 120, a: 140, v: 0.7 }
                ],
                dano: [
                    { f: 190, ff: 70, d: 220, forma: 'sawtooth', v: 0.95 }
                ],
                inimigoDano: [
                    { f: 150, ff: 260, d: 80, forma: 'square', v: 0.7 }
                ],
                inimigoDerrotado: [
                    { f: 260, ff: 70, d: 240, forma: 'sawtooth', v: 0.85 }
                ],
                checkpoint: [
                    { f: 520, d: 100, v: 0.65 },
                    { f: 660, d: 100, a: 90, v: 0.65 },
                    { f: 1040, d: 180, a: 180, v: 0.75 }
                ],
                disparo: [
                    { f: 520, ff: 120, d: 130, forma: 'sawtooth', v: 0.75 }
                ],
                alertaChefe: [
                    { f: 110, d: 280, forma: 'sawtooth', v: 0.8 },
                    { f: 90, d: 280, a: 260, forma: 'sawtooth', v: 0.85 }
                ],
                chefeDano: [
                    { f: 95, ff: 180, d: 120, forma: 'square', v: 0.9 }
                ],
                chefeDerrotado: [
                    { f: 180, ff: 60, d: 420, forma: 'sawtooth', v: 1 },
                    { f: 520, d: 180, a: 360, v: 0.7 }
                ],
                pausa: [
                    { f: 440, d: 80, v: 0.45 }
                ],
                vitoria: [
                    { f: 523, d: 130, v: 0.7 },
                    { f: 659, d: 130, a: 120, v: 0.7 },
                    { f: 784, d: 130, a: 240, v: 0.7 },
                    { f: 1047, d: 320, a: 360, v: 0.9 }
                ]
            };

            if (!efeitos[nome]) return false;

            this.sequencia(efeitos[nome]);
            if (nome === 'dano' || nome === 'inimigoDerrotado') {
                this.ruido(100, 0.45);
            }
            return true;
        }

        padraoMusical(tema) {
            const padroes = {
                fase1: [196, 247, 294, 392, 294, 247, 220, 294],
                chefe: [110, 131, 147, 98, 110, 165, 147, 131],
                vitoria: [262, 330, 392, 523, 392, 523, 659, 784]
            };
            return padroes[tema] || padroes.fase1;
        }

        iniciarMusica(tema = 'fase1') {
            this.temaAtual = tema;
            this.indiceMusica = 0;
            this.reiniciarMusica();
        }

        reiniciarMusica() {
            this.pararIntervaloMusica();
            if (
                !this.temaAtual
                || !this.desbloqueado
                || !this.permitido('musica')
            ) {
                return;
            }

            const executarPasso = () => {
                if (!this.permitido('musica')) return;

                const padrao = this.padraoMusical(this.temaAtual);
                const frequencia = padrao[this.indiceMusica % padrao.length];
                const grave = frequencia / 2;

                this.tom(frequencia, 150, {
                    tipo: 'musica',
                    forma: 'square',
                    volume: 0.33
                });

                if (this.indiceMusica % 2 === 0) {
                    this.tom(grave, 220, {
                        tipo: 'musica',
                        forma: 'triangle',
                        volume: 0.28
                    });
                }

                this.indiceMusica += 1;
            };

            executarPasso();
            this.intervaloMusica = window.setInterval(executarPasso, 240);
        }

        pararIntervaloMusica() {
            if (this.intervaloMusica !== null) {
                window.clearInterval(this.intervaloMusica);
                this.intervaloMusica = null;
            }
        }

        pararMusica() {
            this.temaAtual = null;
            this.pararIntervaloMusica();
        }

        destruir() {
            this.pararMusica();
            this.temporizadores.forEach((id) => window.clearTimeout(id));
            this.temporizadores.clear();
        }
    }

    window.MiguelAudioManager = MiguelAudioManager;
    window.MIGUEL_AUDIO_MANAGER = (
        window.MIGUEL_AUDIO_MANAGER
        || new MiguelAudioManager()
    );

    window.__MIGUEL_AUDIO__ = {
        unlock: () => window.MIGUEL_AUDIO_MANAGER.desbloquear(),
        effect: (nome) => window.MIGUEL_AUDIO_MANAGER.tocarEfeito(nome),
        music: (tema) => window.MIGUEL_AUDIO_MANAGER.iniciarMusica(tema),
        stop: () => window.MIGUEL_AUDIO_MANAGER.pararMusica()
    };
})();
