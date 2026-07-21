(() => {
    const BUILD = 'audio-feedback-extensions-v1-20260721';

    const anterior = window.__MIGUEL_AUDIO_EXTENSIONS_RUNTIME__;
    if (anterior && typeof anterior.encerrar === 'function') {
        anterior.encerrar();
    }

    const runtime = {
        intervalo: null,
        gerente: null,
        tocarEfeitoOriginal: null,
        padraoMusicalOriginal: null,
        tocarEfeitoWrapper: null,
        padraoMusicalWrapper: null,

        encerrar() {
            if (this.intervalo !== null) {
                clearInterval(this.intervalo);
                this.intervalo = null;
            }

            if (this.gerente) {
                if (
                    this.tocarEfeitoOriginal
                    && this.gerente.tocarEfeito
                        === this.tocarEfeitoWrapper
                ) {
                    this.gerente.tocarEfeito = this.tocarEfeitoOriginal;
                }

                if (
                    this.padraoMusicalOriginal
                    && this.gerente.padraoMusical
                        === this.padraoMusicalWrapper
                ) {
                    this.gerente.padraoMusical = this.padraoMusicalOriginal;
                }
            }

            this.gerente = null;
            this.tocarEfeitoOriginal = null;
            this.padraoMusicalOriginal = null;
            this.tocarEfeitoWrapper = null;
            this.padraoMusicalWrapper = null;
        }
    };

    window.__MIGUEL_AUDIO_EXTENSIONS_BUILD__ = BUILD;
    window.__MIGUEL_AUDIO_EXTENSIONS_RUNTIME__ = runtime;

    const instalar = () => {
        const gerente = window.MIGUEL_AUDIO_MANAGER;
        if (
            !gerente
            || typeof gerente.tocarEfeito !== 'function'
            || typeof gerente.padraoMusical !== 'function'
            || runtime.gerente === gerente
        ) {
            return false;
        }

        runtime.gerente = gerente;
        runtime.tocarEfeitoOriginal = gerente.tocarEfeito;
        runtime.padraoMusicalOriginal = gerente.padraoMusical;

        runtime.tocarEfeitoWrapper = function tocarEfeitoExpandido(nome) {
            if (nome === 'agachar' || nome === 'aterrissar') {
                if (!this.desbloqueado) {
                    this.desbloquear();
                    return false;
                }

                const notas = nome === 'agachar'
                    ? [
                        {
                            f: 210,
                            ff: 125,
                            d: 90,
                            forma: 'triangle',
                            v: 0.45
                        }
                    ]
                    : [
                        {
                            f: 105,
                            ff: 62,
                            d: 80,
                            forma: 'square',
                            v: 0.42
                        }
                    ];

                this.sequencia(notas);

                if (nome === 'aterrissar') {
                    this.ruido(42, 0.16);
                }

                return true;
            }

            return runtime.tocarEfeitoOriginal.call(this, nome);
        };

        runtime.padraoMusicalWrapper = function padraoMusicalExpandido(tema) {
            if (tema === 'tutorial') {
                return [
                    220,
                    277,
                    330,
                    440,
                    330,
                    294,
                    247,
                    330
                ];
            }

            return runtime.padraoMusicalOriginal.call(this, tema);
        };

        gerente.tocarEfeito = runtime.tocarEfeitoWrapper;
        gerente.padraoMusical = runtime.padraoMusicalWrapper;

        if (runtime.intervalo !== null) {
            clearInterval(runtime.intervalo);
            runtime.intervalo = null;
        }

        console.info('[AUDIO EXTENSIONS]', BUILD, 'instalado');
        return true;
    };

    if (!instalar()) {
        runtime.intervalo = setInterval(instalar, 50);
    }
})();