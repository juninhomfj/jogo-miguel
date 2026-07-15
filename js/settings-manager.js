(() => {
    class MiguelSettingsManager {
        constructor() {
            this.storageKey = (
                'miguel.settings.v1'
            );

            this.padroes = Object.freeze({
                musicaAtiva: true,
                volumeMusica: 0.65,

                efeitosAtivos: true,
                volumeEfeitos: 0.8,

                vibracaoAtiva: true,

                qualidade: 'auto',

                mostrarDicas: true,

                modoControle: 'auto'
            });

            this.configuracoes = (
                this.carregar()
            );

            this.audioDesbloqueado = false;

            this.listeners = new Set();

            this.aplicar(false);
        }

        carregar() {
            let armazenado = {};

            try {
                const bruto = (
                    window.localStorage.getItem(
                        this.storageKey
                    )
                );

                if (bruto) {
                    armazenado = JSON.parse(
                        bruto
                    );
                }
            } catch (erro) {
                console.warn(
                    '[CONFIGURAÇÕES]',
                    'armazenamento indisponível',
                    erro
                );
            }

            return this.normalizar({
                ...this.padroes,
                ...armazenado
            });
        }

        normalizar(entrada = {}) {
            const qualidades = [
                'auto',
                'low',
                'normal',
                'high'
            ];

            const controles = [
                'auto',
                'touch',
                'keyboard',
                'gamepad'
            ];

            const limitarVolume = (valor) => {
                const numero = Number(valor);

                if (!Number.isFinite(numero)) {
                    return 0;
                }

                return Math.max(
                    0,
                    Math.min(1, numero)
                );
            };

            return {
                musicaAtiva: Boolean(
                    entrada.musicaAtiva
                ),

                volumeMusica: limitarVolume(
                    entrada.volumeMusica
                ),

                efeitosAtivos: Boolean(
                    entrada.efeitosAtivos
                ),

                volumeEfeitos: limitarVolume(
                    entrada.volumeEfeitos
                ),

                vibracaoAtiva: Boolean(
                    entrada.vibracaoAtiva
                ),

                qualidade: (
                    qualidades.includes(
                        entrada.qualidade
                    )
                    ? entrada.qualidade
                    : 'auto'
                ),

                mostrarDicas: Boolean(
                    entrada.mostrarDicas
                ),

                modoControle: (
                    controles.includes(
                        entrada.modoControle
                    )
                    ? entrada.modoControle
                    : 'auto'
                )
            };
        }

        salvar() {
            try {
                window.localStorage.setItem(
                    this.storageKey,

                    JSON.stringify(
                        this.configuracoes
                    )
                );

                return true;
            } catch (erro) {
                console.warn(
                    '[CONFIGURAÇÕES]',
                    'não foi possível salvar',
                    erro
                );

                return false;
            }
        }

        obter(chave) {
            return this.configuracoes[
                chave
            ];
        }

        obterTudo() {
            return {
                ...this.configuracoes,

                qualidadeResolvida:
                    this.obterQualidadeResolvida(),

                audioDesbloqueado:
                    this.audioDesbloqueado
            };
        }

        definir(
            chave,
            valor
        ) {
            if (
                !Object.prototype
                    .hasOwnProperty.call(
                        this.padroes,
                        chave
                    )
            ) {
                console.warn(
                    '[CONFIGURAÇÕES]',
                    'chave ignorada',
                    chave
                );

                return false;
            }

            const candidato = this.normalizar({
                ...this.configuracoes,
                [chave]: valor
            });

            const anterior = (
                this.configuracoes[chave]
            );

            const novo = candidato[chave];

            if (anterior === novo) {
                return false;
            }

            this.configuracoes = candidato;

            this.salvar();
            this.aplicar();

            return true;
        }

        alternar(chave) {
            return this.definir(
                chave,
                !Boolean(
                    this.obter(chave)
                )
            );
        }

        definirVolume(
            chave,
            valor
        ) {
            const arredondado = (
                Math.round(
                    Number(valor) * 4
                ) / 4
            );

            return this.definir(
                chave,
                arredondado
            );
        }

        avancarVolume(chave) {
            const atual = Number(
                this.obter(chave) || 0
            );

            const proximo = (
                atual >= 1
                ? 0
                : atual + 0.25
            );

            return this.definirVolume(
                chave,
                proximo
            );
        }

        avancarQualidade() {
            const opcoes = [
                'auto',
                'low',
                'normal',
                'high'
            ];

            const atual = opcoes.indexOf(
                this.obter('qualidade')
            );

            const proximo = opcoes[
                (
                    atual + 1
                ) % opcoes.length
            ];

            return this.definir(
                'qualidade',
                proximo
            );
        }

        avancarModoControle() {
            const opcoes = [
                'auto',
                'touch',
                'keyboard',
                'gamepad'
            ];

            const atual = opcoes.indexOf(
                this.obter(
                    'modoControle'
                )
            );

            const proximo = opcoes[
                (
                    atual + 1
                ) % opcoes.length
            ];

            return this.definir(
                'modoControle',
                proximo
            );
        }

        resetar() {
            this.configuracoes = {
                ...this.padroes
            };

            this.salvar();
            this.aplicar();

            return this.obterTudo();
        }

        obterQualidadeResolvida() {
            const configurada = (
                this.obter('qualidade')
            );

            if (configurada !== 'auto') {
                return configurada;
            }

            const memoria = Number(
                navigator.deviceMemory || 0
            );

            const nucleos = Number(
                navigator.hardwareConcurrency
                || 0
            );

            if (
                (
                    memoria > 0
                    && memoria <= 4
                )
                || (
                    nucleos > 0
                    && nucleos <= 4
                )
            ) {
                return 'low';
            }

            if (
                memoria >= 8
                || nucleos >= 8
            ) {
                return 'high';
            }

            return 'normal';
        }

        obterFatorVisual() {
            const qualidade = (
                this.obterQualidadeResolvida()
            );

            const fatores = {
                low: 0.5,
                normal: 0.8,
                high: 1.15
            };

            return fatores[qualidade] || 0.8;
        }

        marcarInteracaoUsuario() {
            if (this.audioDesbloqueado) {
                return;
            }

            this.audioDesbloqueado = true;

            this.emitir();

            console.info(
                '[CONFIGURAÇÕES]',
                'áudio liberado por interação'
            );
        }

        podeReproduzirAudio(tipo) {
            if (!this.audioDesbloqueado) {
                return false;
            }

            if (tipo === 'musica') {
                return Boolean(
                    this.obter(
                        'musicaAtiva'
                    )
                    && this.obter(
                        'volumeMusica'
                    ) > 0
                );
            }

            return Boolean(
                this.obter(
                    'efeitosAtivos'
                )
                && this.obter(
                    'volumeEfeitos'
                ) > 0
            );
        }

        vibrar(padrao = 18) {
            if (
                !this.obter(
                    'vibracaoAtiva'
                )
                || typeof navigator.vibrate
                    !== 'function'
            ) {
                return false;
            }

            try {
                return Boolean(
                    navigator.vibrate(
                        padrao
                    )
                );
            } catch (erro) {
                return false;
            }
        }

        aplicar(emitir = true) {
            const qualidade = (
                this.obterQualidadeResolvida()
            );

            document.documentElement.dataset
                .miguelQuality = qualidade;

            document.documentElement.dataset
                .miguelHints = (
                    this.obter(
                        'mostrarDicas'
                    )
                    ? 'on'
                    : 'off'
                );

            document.documentElement.dataset
                .miguelControl = (
                    this.obter(
                        'modoControle'
                    )
                );

            if (emitir) {
                this.emitir();
            }
        }

        assinar(listener) {
            if (
                typeof listener
                    !== 'function'
            ) {
                return () => {};
            }

            this.listeners.add(listener);

            return () => {
                this.listeners.delete(
                    listener
                );
            };
        }

        emitir() {
            const estado = (
                this.obterTudo()
            );

            this.listeners.forEach(
                (listener) => {
                    try {
                        listener(estado);
                    } catch (erro) {
                        console.error(
                            '[CONFIGURAÇÕES]',
                            erro
                        );
                    }
                }
            );

            window.dispatchEvent(
                new CustomEvent(
                    'miguel:settings-changed',
                    {
                        detail: estado
                    }
                )
            );
        }
    }

    window.MIGUEL_SETTINGS_MANAGER = (
        new MiguelSettingsManager()
    );

    window.__MIGUEL_SETTINGS__ = {
        snapshot: () => {
            return window
                .MIGUEL_SETTINGS_MANAGER
                .obterTudo();
        },

        reset: () => {
            return window
                .MIGUEL_SETTINGS_MANAGER
                .resetar();
        }
    };
})();
