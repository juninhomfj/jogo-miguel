(() => {
    class MiguelDeviceManager {
        constructor() {
            this.inicializado = false;

            this.modoJogoAtivo = false;
            this.faseAtiva = null;

            this.overlay = null;
            this.tituloOverlay = null;
            this.textoOverlay = null;
            this.statusOverlay = null;

            this.botaoOrientacao = null;
            this.botaoSensor = null;

            this.sensorInstalado = false;

            this.ultimaOrientacaoFisica = null;
            this.ultimaOrientacaoFisicaEm = 0;

            this.estadoSensor = {
                disponivel: (
                    'DeviceOrientationEvent'
                    in window
                ),

                permissao: 'nao-verificada',

                alpha: null,
                beta: null,
                gamma: null,

                atualizadoEm: null
            };

            this.aoMudarOrientacao = (
                this.aoMudarOrientacao.bind(this)
            );

            this.aoReceberOrientacao = (
                this.aoReceberOrientacao.bind(this)
            );
        }

        inicializar() {
            if (this.inicializado) {
                return;
            }

            this.inicializado = true;

            this.overlay = document.getElementById(
                'orientation-overlay'
            );

            this.tituloOverlay = document.getElementById(
                'orientation-title'
            );

            this.textoOverlay = document.getElementById(
                'orientation-message'
            );

            this.statusOverlay = document.getElementById(
                'orientation-status'
            );

            this.botaoOrientacao = document.getElementById(
                'orientation-action'
            );

            this.botaoSensor = document.getElementById(
                'sensor-action'
            );

            if (this.botaoOrientacao) {
                this.botaoOrientacao.addEventListener(
                    'click',
                    async () => {
                        if (!this.faseAtiva) {
                            return;
                        }

                        await this.entrarModoJogo(
                            this.faseAtiva
                        );
                    }
                );
            }

            if (this.botaoSensor) {
                this.botaoSensor.addEventListener(
                    'click',
                    async () => {
                        await this.habilitarSensor(
                            true
                        );
                    }
                );
            }

            window.addEventListener(
                'resize',
                this.aoMudarOrientacao
            );

            window.addEventListener(
                'orientationchange',
                this.aoMudarOrientacao
            );

            document.addEventListener(
                'fullscreenchange',
                this.aoMudarOrientacao
            );

            if (
                screen.orientation
                && typeof screen.orientation
                    .addEventListener === 'function'
            ) {
                screen.orientation.addEventListener(
                    'change',
                    this.aoMudarOrientacao
                );
            }

            // Em navegadores que não exigem uma
            // permissão explícita, o sensor será
            // iniciado silenciosamente.
            this.habilitarSensor(false);

            this.atualizarInterface();

            window.__MIGUEL_DEVICE__ = {
                snapshot: () => this.obterEstado(),

                entrarModoJogo: async (
                    orientacao = 'landscape'
                ) => {
                    const faseTemporaria = {
                        id: 'debug',
                        titulo: 'Debug',
                        orientacao
                    };

                    return this.entrarModoJogo(
                        faseTemporaria
                    );
                },

                habilitarSensor: async () => {
                    return this.habilitarSensor(true);
                }
            };
        }

        ehDispositivoMovel() {
            const toque = (
                'ontouchstart' in window
                || navigator.maxTouchPoints > 0
            );

            const ponteiroGrosso = (
                window.matchMedia
                && window.matchMedia(
                    '(pointer: coarse)'
                ).matches
            );

            return Boolean(
                toque || ponteiroGrosso
            );
        }


        obterOrientacaoFisica() {
            const agora = Date.now();

            const manterUltima = () => {
                if (
                    this.ultimaOrientacaoFisica
                    && (
                        agora
                        - this.ultimaOrientacaoFisicaEm
                    ) <= 1800
                ) {
                    return (
                        this.ultimaOrientacaoFisica
                    );
                }

                return null;
            };

            if (
                this.estadoSensor.permissao
                    !== 'ativa'
                || !Number.isFinite(
                    this.estadoSensor.beta
                )
                || !Number.isFinite(
                    this.estadoSensor.gamma
                )
                || !this.estadoSensor.atualizadoEm
                || (
                    agora
                    - this.estadoSensor.atualizadoEm
                ) > 2600
            ) {
                return manterUltima();
            }

            const beta = Math.abs(
                this.estadoSensor.beta
            );

            const gamma = Math.abs(
                this.estadoSensor.gamma
            );

            if (
                gamma >= 34
                && gamma > beta + 7
            ) {
                return 'landscape';
            }

            if (
                beta >= 34
                && beta > gamma + 7
            ) {
                return 'portrait';
            }

            return manterUltima();
        }

        obterOrientacaoAtual() {
            if (this.modoJogoAtivo) {
                const orientacaoFisica = (
                    this.obterOrientacaoFisica()
                );

                if (orientacaoFisica) {
                    return orientacaoFisica;
                }
            }

            if (
                screen.orientation
                && screen.orientation.type
            ) {
                if (
                    screen.orientation.type
                        .startsWith('landscape')
                ) {
                    return 'landscape';
                }

                if (
                    screen.orientation.type
                        .startsWith('portrait')
                ) {
                    return 'portrait';
                }
            }

            return (
                window.innerWidth
                >= window.innerHeight
                ? 'landscape'
                : 'portrait'
            );
        }

        orientacaoEstaCorreta() {
            if (
                !this.faseAtiva
                || this.faseAtiva.orientacao === 'any'
            ) {
                return true;
            }

            return (
                this.obterOrientacaoAtual()
                === this.faseAtiva.orientacao
            );
        }

        ativarFase(fase) {
            this.faseAtiva = fase;
            this.modoJogoAtivo = true;

            this.atualizarInterface();
        }

        desativarFase() {
            this.modoJogoAtivo = false;
            this.faseAtiva = null;

            this.atualizarInterface();

            if (
                screen.orientation
                && typeof screen.orientation.unlock
                    === 'function'
            ) {
                try {
                    screen.orientation.unlock();
                } catch (erro) {
                    console.debug(
                        'Orientação não desbloqueada:',
                        erro
                    );
                }
            }
        }

        async entrarModoJogo(fase) {
            this.ativarFase(fase);

            if (!this.ehDispositivoMovel()) {
                return this.obterEstado();
            }

            // O clique em ENTRAR é uma ação direta
            // do usuário e permite solicitar o sensor.
            await this.habilitarSensor(true);

            await this.solicitarTelaCheia();
            await this.bloquearOrientacao(
                fase.orientacao
            );

            this.atualizarInterface();

            // O navegador pode atualizar a viewport em
            // etapas depois do fullscreen e do lock.
            if (
                window.__MIGUEL_LAYOUT__
                && window.__MIGUEL_LAYOUT__.refresh
            ) {
                window.__MIGUEL_LAYOUT__.refresh();
            }

            return this.obterEstado();
        }

        async solicitarTelaCheia() {
            if (
                document.fullscreenElement
                || document.webkitFullscreenElement
            ) {
                return true;
            }

            // A página inteira entra em tela cheia.
            // Isso evita que o container mantenha
            // dimensões calculadas antes da rotação.
            const alvo = document.documentElement;

            const solicitar = (
                alvo.requestFullscreen
                || alvo.webkitRequestFullscreen
            );

            if (!solicitar) {
                return false;
            }

            try {
                await solicitar.call(alvo);

                return true;
            } catch (erro) {
                console.info(
                    'Tela cheia não autorizada:',
                    erro
                );

                return false;
            }
        }

        async bloquearOrientacao(orientacao) {
            if (
                orientacao === 'any'
                || !screen.orientation
                || typeof screen.orientation.lock
                    !== 'function'
            ) {
                return false;
            }

            try {
                await screen.orientation.lock(
                    orientacao
                );

                return true;
            } catch (erro) {
                console.info(
                    'Bloqueio de orientação indisponível:',
                    erro
                );

                return false;
            }
        }

        async habilitarSensor(
            pedirPermissao
        ) {
            if (
                this.estadoSensor.permissao
                    === 'ativa'
            ) {
                return true;
            }

            const EventoOrientacao = (
                window.DeviceOrientationEvent
            );

            if (!EventoOrientacao) {
                this.estadoSensor.disponivel = false;
                this.estadoSensor.permissao = (
                    'indisponivel'
                );

                this.atualizarInterface();

                return false;
            }

            if (
                typeof EventoOrientacao
                    .requestPermission === 'function'
            ) {
                if (!pedirPermissao) {
                    this.estadoSensor.permissao = (
                        'aguardando-acao'
                    );

                    this.atualizarInterface();

                    return false;
                }

                try {
                    const resultado = (
                        await EventoOrientacao
                            .requestPermission()
                    );

                    if (resultado !== 'granted') {
                        this.estadoSensor.permissao = (
                            'negada'
                        );

                        this.atualizarInterface();

                        return false;
                    }
                } catch (erro) {
                    this.estadoSensor.permissao = (
                        'erro'
                    );

                    console.info(
                        'Sensor não autorizado:',
                        erro
                    );

                    this.atualizarInterface();

                    return false;
                }
            }

            if (!this.sensorInstalado) {
                window.addEventListener(
                    'deviceorientation',
                    this.aoReceberOrientacao,
                    true
                );

                this.sensorInstalado = true;
            }

            this.estadoSensor.permissao = 'ativa';

            this.atualizarInterface();

            return true;
        }

        aoReceberOrientacao(evento) {
            this.estadoSensor.alpha = (
                Number.isFinite(evento.alpha)
                ? Number(evento.alpha.toFixed(1))
                : null
            );

            this.estadoSensor.beta = (
                Number.isFinite(evento.beta)
                ? Number(evento.beta.toFixed(1))
                : null
            );

            this.estadoSensor.gamma = (
                Number.isFinite(evento.gamma)
                ? Number(evento.gamma.toFixed(1))
                : null
            );

            this.estadoSensor.atualizadoEm = (
                Date.now()
            );

            const orientacaoFisica = (
                this.obterOrientacaoFisica()
            );

            if (orientacaoFisica) {
                const mudou = (
                    orientacaoFisica
                    !== this.ultimaOrientacaoFisica
                );

                this.ultimaOrientacaoFisica = (
                    orientacaoFisica
                );

                this.ultimaOrientacaoFisicaEm = (
                    Date.now()
                );

                if (mudou) {
                    this.atualizarInterface();
                } else {
                    this.atualizarStatus();
                }

                return;
            }

            this.atualizarStatus();
        }

        aoMudarOrientacao() {
            window.setTimeout(
                () => {
                    this.atualizarInterface();
                },
                80
            );
        }

        atualizarInterface() {
            if (!this.overlay) {
                return;
            }

            const ehMovel = (
                this.ehDispositivoMovel()
            );

            const precisaOrientar = Boolean(
                this.modoJogoAtivo
                && ehMovel
                && !this.orientacaoEstaCorreta()
            );

            this.overlay.classList.toggle(
                'is-visible',
                precisaOrientar
            );

            this.overlay.setAttribute(
                'aria-hidden',
                precisaOrientar
                    ? 'false'
                    : 'true'
            );

            if (
                this.faseAtiva
                && this.faseAtiva.orientacao
                    === 'portrait'
            ) {
                this.tituloOverlay.textContent = (
                    'GIRE PARA VERTICAL'
                );

                this.textoOverlay.textContent = (
                    'Esta fase usa o celular em pé.'
                );
            } else {
                this.tituloOverlay.textContent = (
                    'GIRE PARA HORIZONTAL'
                );

                this.textoOverlay.textContent = (
                    'Esta fase foi criada para jogar '
                    + 'com o celular deitado.'
                );
            }

            if (this.botaoSensor) {
                const ativa = (
                    this.estadoSensor.permissao
                    === 'ativa'
                );

                this.botaoSensor.textContent = (
                    ativa
                    ? 'SENSOR ATIVO'
                    : 'ATIVAR SENSOR'
                );

                this.botaoSensor.disabled = ativa;
            }

            this.atualizarStatus();

            window.dispatchEvent(
                new CustomEvent(
                    'miguel:orientation-state',
                    {
                        detail: this.obterEstado()
                    }
                )
            );
        }

        atualizarStatus() {
            if (!this.statusOverlay) {
                return;
            }

            const orientacao = (
                this.obterOrientacaoAtual()
            );

            const tipoTela = (
                screen.orientation
                && screen.orientation.type
                ? screen.orientation.type
                : orientacao
            );

            const angulo = (
                screen.orientation
                && Number.isFinite(
                    screen.orientation.angle
                )
                ? screen.orientation.angle
                : window.orientation ?? 0
            );

            const sensor = (
                this.estadoSensor.permissao
            );

            const fisica = (
                this.obterOrientacaoFisica()
                || 'indefinida'
            );

            this.statusOverlay.textContent = (
                `Tela: ${tipoTela} · `
                + `Ângulo: ${angulo}° · `
                + `Sensor: ${sensor} · `
                + `Física: ${fisica}`
            );
        }

        obterEstado() {
            return {
                movel: this.ehDispositivoMovel(),

                modoJogoAtivo:
                    this.modoJogoAtivo,

                fase: (
                    this.faseAtiva
                    ? this.faseAtiva.id
                    : null
                ),

                orientacaoSolicitada: (
                    this.faseAtiva
                    ? this.faseAtiva.orientacao
                    : null
                ),

                orientacaoFisica:
                    this.obterOrientacaoFisica(),

                orientacaoAtual:
                    this.obterOrientacaoAtual(),

                orientacaoCorreta:
                    this.orientacaoEstaCorreta(),

                telaCheia: Boolean(
                    document.fullscreenElement
                    || document.webkitFullscreenElement
                ),

                sensor: {
                    ...this.estadoSensor
                },

                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight,

                    devicePixelRatio:
                        window.devicePixelRatio
                }
            };
        }
    }

    window.MIGUEL_DEVICE_MANAGER = (
        new MiguelDeviceManager()
    );
})();
