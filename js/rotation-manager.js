(() => {
    class MiguelRotationManager {
        constructor() {
            this.inicializado = false;

            this.game = null;
            this.deviceManager = null;

            this.overlay = null;
            this.rotator = null;
            this.container = null;

            this.bloqueado = false;

            this.revisao = 0;
            this.temporizadores = [];

            this.cenasPausadas = new Set();

            this.intervalo = null;

            this.aoMudarViewport = (
                this.aoMudarViewport.bind(this)
            );

            this.aoMudarEstado = (
                this.aoMudarEstado.bind(this)
            );
        }

        inicializar(opcoes = {}) {
            if (this.inicializado) {
                return;
            }

            this.inicializado = true;

            this.game = (
                opcoes.game
                || window.__MIGUEL_GAME__
                || null
            );

            this.deviceManager = (
                opcoes.deviceManager
                || window.MIGUEL_DEVICE_MANAGER
                || null
            );

            this.overlay = document.getElementById(
                'orientation-overlay'
            );

            this.rotator = document.getElementById(
                'orientation-rotator'
            );

            this.container = document.getElementById(
                'game-container'
            );

            window.addEventListener(
                'resize',
                this.aoMudarViewport
            );

            window.addEventListener(
                'orientationchange',
                this.aoMudarViewport
            );

            window.addEventListener(
                'miguel:orientation-state',
                this.aoMudarEstado
            );

            document.addEventListener(
                'fullscreenchange',
                this.aoMudarViewport
            );

            document.addEventListener(
                'webkitfullscreenchange',
                this.aoMudarViewport
            );

            if (
                screen.orientation
                && typeof screen.orientation
                    .addEventListener === 'function'
            ) {
                screen.orientation.addEventListener(
                    'change',
                    this.aoMudarViewport
                );
            }

            if (window.visualViewport) {
                window.visualViewport.addEventListener(
                    'resize',
                    this.aoMudarViewport
                );

                window.visualViewport.addEventListener(
                    'scroll',
                    this.aoMudarViewport
                );
            }

            this.intervalo = window.setInterval(
                () => {
                    this.atualizar();
                },
                220
            );

            window.__MIGUEL_ROTATION__ = {
                refresh: () => {
                    this.aoMudarViewport();
                },

                snapshot: () => {
                    return this.obterDiagnostico();
                }
            };

            this.atualizar();

            console.info(
                '[ROTAÇÃO]',
                'controlador iniciado',
                this.obterDiagnostico()
            );
        }

        obterViewport() {
            const visual = window.visualViewport;

            return {
                width: Math.max(
                    1,
                    Math.round(
                        visual
                        ? visual.width
                        : window.innerWidth
                    )
                ),

                height: Math.max(
                    1,
                    Math.round(
                        visual
                        ? visual.height
                        : window.innerHeight
                    )
                ),

                offsetLeft: Math.round(
                    visual
                    ? visual.offsetLeft
                    : 0
                ),

                offsetTop: Math.round(
                    visual
                    ? visual.offsetTop
                    : 0
                )
            };
        }

        obterEstadoDispositivo() {
            try {
                if (
                    this.deviceManager
                    && typeof this.deviceManager
                        .obterEstado === 'function'
                ) {
                    return (
                        this.deviceManager
                            .obterEstado()
                    );
                }

                if (
                    window.__MIGUEL_DEVICE__
                    && typeof window.__MIGUEL_DEVICE__
                        .snapshot === 'function'
                ) {
                    return (
                        window.__MIGUEL_DEVICE__
                            .snapshot()
                    );
                }
            } catch (erro) {
                console.debug(
                    'Estado de orientação indisponível:',
                    erro
                );
            }

            return {};
        }

        obterAnguloTela() {
            let angulo = 0;

            if (
                screen.orientation
                && Number.isFinite(
                    screen.orientation.angle
                )
            ) {
                angulo = Number(
                    screen.orientation.angle
                );
            } else if (
                Number.isFinite(
                    window.orientation
                )
            ) {
                angulo = Number(
                    window.orientation
                );
            }

            return (
                (angulo % 360) + 360
            ) % 360;
        }

        calcularRotacao(
            logica,
            fisica
        ) {
            if (
                !fisica
                || logica === fisica
            ) {
                return 0;
            }

            const angulo = (
                this.obterAnguloTela()
            );

            if (
                logica === 'landscape'
                && fisica === 'portrait'
            ) {
                return (
                    angulo === 270
                    ? 90
                    : -90
                );
            }

            if (
                logica === 'portrait'
                && fisica === 'landscape'
            ) {
                return (
                    angulo === 270
                    ? -90
                    : 90
                );
            }

            return 0;
        }

        atualizarGeometria(
            logica,
            fisica
        ) {
            if (
                !this.overlay
                || !this.rotator
            ) {
                return;
            }

            const viewport = this.obterViewport();

            const rotacao = this.calcularRotacao(
                logica,
                fisica
            );

            const rotacionado = (
                rotacao !== 0
            );

            const largura = (
                rotacionado
                ? viewport.height
                : viewport.width
            );

            const altura = (
                rotacionado
                ? viewport.width
                : viewport.height
            );

            this.overlay.classList.toggle(
                'is-rotated',
                rotacionado
            );

            this.overlay.classList.toggle(
                'physical-portrait',
                fisica === 'portrait'
            );

            this.overlay.classList.toggle(
                'physical-landscape',
                fisica === 'landscape'
            );

            this.overlay.style.setProperty(
                '--orientation-rotation',
                `${rotacao}deg`
            );

            this.overlay.style.setProperty(
                '--orientation-stage-width',
                `${largura}px`
            );

            this.overlay.style.setProperty(
                '--orientation-stage-height',
                `${altura}px`
            );
        }

        limparTemporizadores() {
            this.temporizadores.forEach(
                (temporizador) => {
                    window.clearTimeout(
                        temporizador
                    );
                }
            );

            this.temporizadores = [];
        }

        agendar(
            callback,
            atraso
        ) {
            const temporizador = (
                window.setTimeout(
                    callback,
                    atraso
                )
            );

            this.temporizadores.push(
                temporizador
            );
        }

        solicitarRecalculo() {
            const layout = (
                window.__MIGUEL_LAYOUT__
            );

            if (
                layout
                && typeof layout.recalculate
                    === 'function'
            ) {
                layout.recalculate();
                return;
            }

            if (
                layout
                && typeof layout.refresh
                    === 'function'
            ) {
                layout.refresh();
            }
        }

        resetarControles(cena) {
            if (
                cena.controles
                && typeof cena.controles
                    .resetarEstado === 'function'
            ) {
                cena.controles.resetarEstado();
            }
        }

        normalizarCena(cena) {
            if (!cena) {
                return;
            }

            this.resetarControles(cena);

            if (
                typeof cena.sairAgachamento
                    === 'function'
            ) {
                cena.sairAgachamento(true);
            }

            if (
                typeof cena.cancelarGiroDuplo
                    === 'function'
            ) {
                cena.cancelarGiroDuplo();
            }

            if (
                typeof cena.cancelarPoeira
                    === 'function'
            ) {
                cena.cancelarPoeira();
            }

            if (cena.doubleJumpVisual) {
                cena.doubleJumpVisual
                    .setVisible(false)
                    .setAngle(0);
            }

            if (cena.crouchVisual) {
                cena.crouchVisual
                    .setVisible(false)
                    .setAngle(0);
            }

            if (cena.poeira) {
                cena.poeira.anims.stop();
                cena.poeira.setVisible(false);
            }

            const player = cena.player;

            if (!player || !player.active) {
                return;
            }

            player.estaAtacando = false;
            player.giroDuploAtivo = false;
            player.estaEmPoeira = false;
            player.estaAgachado = false;

            player.off(
                'animationcomplete-attack'
            );

            player
                .setVisible(true)
                .setAlpha(1)
                .setAngle(0);

            if (player.body) {
                if (
                    typeof player.body.stop
                        === 'function'
                ) {
                    player.body.stop();
                } else {
                    player.setVelocity(0, 0);
                }

                if (
                    typeof player.body
                        .setAngularVelocity
                        === 'function'
                ) {
                    player.body.setAngularVelocity(0);
                }

                if (
                    typeof player.body
                        .updateFromGameObject
                        === 'function'
                ) {
                    player.body
                        .updateFromGameObject();
                }
            }

            if (player.estaMachucado) {
                player
                    .setTexture('miguel_hurt')
                    .setVisible(true);

                return;
            }

            const noChao = Boolean(
                player.body
                && (
                    player.body.blocked.down
                    || player.body.touching.down
                )
            );

            player.anims.stop();

            player.anims.play(
                noChao
                ? 'idle'
                : 'jump',
                true
            );
        }

        obterCena(nome) {
            if (
                !this.game
                || !this.game.scene
            ) {
                return null;
            }

            try {
                return this.game.scene.getScene(
                    nome
                );
            } catch (erro) {
                return null;
            }
        }

        pausarJogabilidade() {
            [
                'Tutorial',
                'Fase1'
            ].forEach((nome) => {
                const cena = this.obterCena(nome);

                if (!cena) {
                    return;
                }

                this.normalizarCena(cena);

                try {
                    if (
                        this.game.scene.isActive(nome)
                        && !this.game.scene
                            .isPaused(nome)
                    ) {
                        this.game.scene.pause(nome);

                        this.cenasPausadas.add(
                            nome
                        );
                    }
                } catch (erro) {
                    console.debug(
                        `Cena ${nome} não pausada:`,
                        erro
                    );
                }
            });
        }

        retomarJogabilidade() {
            this.cenasPausadas.forEach(
                (nome) => {
                    const cena = this.obterCena(
                        nome
                    );

                    this.normalizarCena(cena);

                    try {
                        if (
                            this.game.scene
                                .isPaused(nome)
                        ) {
                            this.game.scene.resume(
                                nome
                            );
                        }
                    } catch (erro) {
                        console.debug(
                            `Cena ${nome} não retomada:`,
                            erro
                        );
                    }
                }
            );

            this.cenasPausadas.clear();
        }

        estabilizarLayout(
            deveRetomar = false
        ) {
            this.revisao += 1;

            const revisaoAtual = (
                this.revisao
            );

            this.limparTemporizadores();

            if (this.container) {
                this.container.classList.add(
                    'orientation-transitioning'
                );
            }

            [
                0,
                80,
                180,
                340,
                560,
                780
            ].forEach((atraso) => {
                this.agendar(
                    () => {
                        if (
                            revisaoAtual
                            !== this.revisao
                        ) {
                            return;
                        }

                        this.atualizar();
                        this.solicitarRecalculo();
                    },
                    atraso
                );
            });

            this.agendar(
                () => {
                    if (
                        revisaoAtual
                        !== this.revisao
                    ) {
                        return;
                    }

                    this.atualizar();
                    this.solicitarRecalculo();

                    if (
                        deveRetomar
                        && !this.bloqueado
                    ) {
                        this.retomarJogabilidade();
                    }

                    if (this.container) {
                        this.container.classList.remove(
                            'orientation-transitioning'
                        );
                    }
                },
                920
            );
        }

        aplicarBloqueio(bloqueado) {
            if (this.container) {
                this.container.classList.toggle(
                    'orientation-blocked',
                    bloqueado
                );
            }

            if (bloqueado) {
                this.pausarJogabilidade();
                this.estabilizarLayout(false);
                return;
            }

            this.estabilizarLayout(
                this.cenasPausadas.size > 0
            );
        }

        aoMudarViewport() {
            const mudouBloqueio = (
                this.atualizar()
            );

            if (!mudouBloqueio) {
                this.estabilizarLayout(
                    !this.bloqueado
                    && this.cenasPausadas.size > 0
                );
            }
        }

        aoMudarEstado() {
            this.atualizar();
        }

        atualizar() {
            const estado = (
                this.obterEstadoDispositivo()
            );

            const viewport = this.obterViewport();

            const logica = (
                viewport.width >= viewport.height
                ? 'landscape'
                : 'portrait'
            );

            const fisica = (
                estado.orientacaoFisica
                || null
            );

            const solicitada = (
                estado.orientacaoSolicitada
                || null
            );

            const efetiva = (
                fisica
                || estado.orientacaoAtual
                || logica
            );

            const bloqueado = Boolean(
                estado.modoJogoAtivo
                && estado.movel
                && solicitada
                && solicitada !== 'any'
                && efetiva !== solicitada
            );

            this.atualizarGeometria(
                logica,
                fisica
            );

            if (this.overlay) {
                this.overlay.classList.toggle(
                    'is-visible',
                    bloqueado
                );

                this.overlay.setAttribute(
                    'aria-hidden',
                    bloqueado
                    ? 'false'
                    : 'true'
                );
            }

            const mudou = (
                bloqueado !== this.bloqueado
            );

            if (mudou) {
                this.bloqueado = bloqueado;

                this.aplicarBloqueio(
                    bloqueado
                );
            }

            return mudou;
        }

        obterDiagnostico() {
            const estado = (
                this.obterEstadoDispositivo()
            );

            const viewport = this.obterViewport();

            return {
                build:
                    window.__MIGUEL_BUILD_ID__
                    || null,

                viewport,

                orientacaoLogica: (
                    viewport.width
                    >= viewport.height
                    ? 'landscape'
                    : 'portrait'
                ),

                orientacaoFisica:
                    estado.orientacaoFisica
                    || null,

                orientacaoSolicitada:
                    estado.orientacaoSolicitada
                    || null,

                angulo:
                    this.obterAnguloTela(),

                bloqueado:
                    this.bloqueado,

                cenasPausadas:
                    Array.from(
                        this.cenasPausadas
                    ),

                revisao:
                    this.revisao
            };
        }
    }

    window.MIGUEL_ROTATION_MANAGER = (
        new MiguelRotationManager()
    );
})();
