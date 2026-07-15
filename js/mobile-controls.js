(() => {
    class MiguelMobileControls {
        constructor(options = {}) {
            this.container = (
                options.container
                || document.body
            );

            this.onAxis = (
                typeof options.onAxis
                    === 'function'
                ? options.onAxis
                : () => {}
            );

            this.onAction = (
                typeof options.onAction
                    === 'function'
                ? options.onAction
                : () => {}
            );

            this.onDevice = (
                typeof options.onDevice
                    === 'function'
                ? options.onDevice
                : () => {}
            );

            this.root = null;
            this.zone = null;
            this.base = null;
            this.knob = null;
            this.actions = null;

            this.jumpButton = null;
            this.attackButton = null;
            this.powerButton = null;

            this.powerUnlocked = Boolean(
                options.powerUnlocked
            );

            this.ultimoTouchEnd = 0;

            this.pointerId = null;

            this.center = {
                x: 0,
                y: 0
            };

            this.axis = {
                x: 0,
                y: 0
            };

            this.radius = 68;

            this.abortController = null;

            this.ativo = false;
            this.destruido = false;
        }

        iniciar() {
            if (
                this.ativo
                || this.destruido
            ) {
                return;
            }

            this.ativo = true;

            this.criarEstilo();
            this.criarInterface();
            this.registrarEventos();
            this.atualizarLayout();

            console.info(
                '[CONTROLES FÍSICOS]',
                'iniciados',
                this.snapshot()
            );
        }

        criarEstilo() {
            if (
                document.getElementById(
                    'miguel-mobile-controls-style'
                )
            ) {
                return;
            }

            const style = document.createElement(
                'style'
            );

            style.id = (
                'miguel-mobile-controls-style'
            );

            style.textContent = `
                #mobile-controls-layer {
                    --action-size:
                        clamp(
                            76px,
                            17vmin,
                            116px
                        );

                    --action-gap:
                        clamp(
                            8px,
                            2.2vmin,
                            18px
                        );

                    position: fixed;
                    inset: 0;

                    width: 100vw;
                    height: 100vh;
                    height: 100dvh;

                    z-index: 70;

                    pointer-events: none;
                    touch-action: none;

                    opacity: 1;

                    transition:
                        opacity 150ms linear;

                    contain:
                        layout style size;
                }

                #mobile-controls-layer.is-gamepad {
                    opacity: 0.36;
                }

                #game-container.orientation-blocked
                #mobile-controls-layer,

                #game-container.orientation-transitioning
                #mobile-controls-layer,

                #game-container.layout-settling
                #mobile-controls-layer {
                    opacity: 0;
                    pointer-events: none;
                }

                .miguel-joystick-zone {
                    position: absolute;
                    left: 0;
                    top: 0;

                    width: 56%;
                    height: 100%;

                    pointer-events: auto;
                    touch-action: none;

                    -webkit-tap-highlight-color:
                        transparent;
                }

                .miguel-joystick-base,
                .miguel-joystick-knob {
                    position: absolute;

                    left: 0;
                    top: 0;

                    border-radius: 50%;

                    pointer-events: none;

                    transform:
                        translate(-50%, -50%);

                    opacity: 0;
                    visibility: hidden;

                    transition:
                        opacity 90ms linear;
                }

                .miguel-joystick-base {
                    width:
                        var(
                            --joystick-diameter,
                            136px
                        );

                    height:
                        var(
                            --joystick-diameter,
                            136px
                        );

                    border:
                        3px solid
                        rgba(
                            143,
                            233,
                            255,
                            0.48
                        );

                    background:
                        radial-gradient(
                            circle,
                            rgba(
                                20,
                                61,
                                82,
                                0.13
                            ) 0%,
                            rgba(
                                7,
                                18,
                                34,
                                0.24
                            ) 68%,
                            rgba(
                                7,
                                18,
                                34,
                                0.1
                            ) 100%
                        );

                    box-shadow:
                        inset 0 0 22px
                        rgba(
                            0,
                            217,
                            255,
                            0.1
                        );
                }

                .miguel-joystick-knob {
                    width:
                        calc(
                            var(
                                --joystick-diameter,
                                136px
                            ) * 0.43
                        );

                    height:
                        calc(
                            var(
                                --joystick-diameter,
                                136px
                            ) * 0.43
                        );

                    border:
                        3px solid
                        rgba(
                            255,
                            255,
                            255,
                            0.58
                        );

                    background:
                        rgba(
                            74,
                            210,
                            255,
                            0.48
                        );

                    box-shadow:
                        0 0 18px
                        rgba(
                            0,
                            217,
                            255,
                            0.18
                        );
                }

                #mobile-controls-layer.joystick-active
                .miguel-joystick-base,

                #mobile-controls-layer.joystick-active
                .miguel-joystick-knob {
                    opacity: 1;
                    visibility: visible;
                }

                .miguel-action-area {
                    position: absolute;

                    right:
                        max(
                            14px,
                            env(
                                safe-area-inset-right
                            )
                        );

                    bottom:
                        max(
                            14px,
                            env(
                                safe-area-inset-bottom
                            )
                        );

                    width:
                        calc(
                            var(--action-size) * 2
                            + var(--action-gap)
                        );

                    height:
                        calc(
                            var(--action-size) * 1.85
                        );

                    pointer-events: none;
                }

                .miguel-action-button {
                    position: absolute;

                    width:
                        var(--action-size);

                    height:
                        var(--action-size);

                    display: grid;
                    place-items: center;

                    border-radius: 50%;

                    font-family:
                        'Courier New',
                        monospace;

                    color: #ffffff;

                    pointer-events: auto;
                    touch-action: none;

                    -webkit-tap-highlight-color:
                        transparent;

                    transition:
                        transform 90ms ease,
                        opacity 140ms linear;

                    backdrop-filter:
                        blur(2px);

                    -webkit-backdrop-filter:
                        blur(2px);
                }

                .miguel-action-button.is-pressed {
                    transform: scale(0.86);
                }

                .miguel-action-button.jump {
                    right: 0;

                    bottom:
                        calc(
                            var(--action-size) * 0.25
                        );

                    border:
                        4px solid
                        rgba(
                            174,
                            229,
                            255,
                            0.72
                        );

                    background:
                        rgba(
                            22,
                            140,
                            255,
                            0.35
                        );
                }

                .miguel-action-button.attack {
                    left: 0;
                    bottom: 0;

                    border:
                        4px solid
                        rgba(
                            255,
                            255,
                            255,
                            0.68
                        );

                    background:
                        rgba(
                            214,
                            31,
                            68,
                            0.38
                        );
                }


                .miguel-action-button.power {
                    left:
                        calc(
                            50%
                            - var(--action-size) * 0.36
                        );

                    top: 0;

                    width:
                        calc(
                            var(--action-size) * 0.72
                        );

                    height:
                        calc(
                            var(--action-size) * 0.72
                        );

                    border:
                        3px solid
                        rgba(
                            216,
                            170,
                            255,
                            0.66
                        );

                    background:
                        rgba(
                            117,
                            52,
                            177,
                            0.38
                        );
                }

                .miguel-action-button.power
                .miguel-action-icon {
                    margin-top: -12%;

                    font-size:
                        clamp(
                            25px,
                            6vmin,
                            43px
                        );
                }

                .miguel-action-button.power
                .miguel-action-label {
                    bottom: 7%;

                    font-size:
                        clamp(
                            7px,
                            1.5vmin,
                            10px
                        );
                }

                .miguel-action-button.power.is-locked {
                    opacity: 0.52;
                }

                .miguel-action-button.power.is-locked::after {
                    content: '×';

                    position: absolute;
                    right: 5%;
                    top: 0;

                    color: #ffffff;

                    font-size:
                        clamp(
                            14px,
                            3vmin,
                            22px
                        );

                    font-weight: bold;
                }

                .miguel-action-icon {
                    display: block;

                    margin-top: -8%;

                    font-size:
                        clamp(
                            34px,
                            8vmin,
                            60px
                        );

                    font-weight: bold;
                    line-height: 1;
                }

                .miguel-action-label {
                    position: absolute;

                    left: 50%;
                    bottom: 10%;

                    transform:
                        translateX(-50%);

                    font-size:
                        clamp(
                            8px,
                            1.8vmin,
                            12px
                        );

                    font-weight: bold;

                    white-space: nowrap;
                }

                @media (
                    orientation: landscape
                ) and (
                    min-aspect-ratio: 19 / 9
                ) {
                    .miguel-joystick-zone {
                        width: 53%;
                    }

                    .miguel-action-area {
                        right:
                            max(
                                22px,
                                4vw,
                                env(
                                    safe-area-inset-right
                                )
                            );
                    }
                }

                @media (
                    orientation: landscape
                ) and (
                    max-height: 450px
                ) {
                    #mobile-controls-layer {
                        --action-size:
                            clamp(
                                68px,
                                19vmin,
                                92px
                            );
                    }

                    .miguel-action-area {
                        bottom:
                            max(
                                8px,
                                env(
                                    safe-area-inset-bottom
                                )
                            );
                    }
                }
            `;

            document.head.appendChild(style);
        }

        criarInterface() {
            const root = document.createElement(
                'div'
            );

            root.id = 'mobile-controls-layer';

            const zone = document.createElement(
                'div'
            );

            zone.className = (
                'miguel-joystick-zone'
            );

            zone.setAttribute(
                'aria-label',
                'Área do controle de movimento'
            );

            const base = document.createElement(
                'div'
            );

            base.className = (
                'miguel-joystick-base'
            );

            const knob = document.createElement(
                'div'
            );

            knob.className = (
                'miguel-joystick-knob'
            );

            const actions = document.createElement(
                'div'
            );

            actions.className = (
                'miguel-action-area'
            );

            const attackButton = (
                this.criarBotao(
                    'attack',
                    '✦',
                    'GOLPE',
                    'ataque'
                )
            );

            const jumpButton = (
                this.criarBotao(
                    'jump',
                    '↑',
                    'PULAR',
                    'pulo'
                )
            );

            const powerButton = (
                this.criarBotao(
                    'power',
                    '◆',
                    'PODER',
                    'poder'
                )
            );

            powerButton.classList.toggle(
                'is-locked',
                !this.powerUnlocked
            );

            powerButton.setAttribute(
                'aria-label',
                this.powerUnlocked
                ? 'PODER'
                : 'PODER BLOQUEADO'
            );

            actions.appendChild(
                attackButton
            );

            actions.appendChild(
                powerButton
            );

            actions.appendChild(
                jumpButton
            );

            root.appendChild(zone);
            root.appendChild(base);
            root.appendChild(knob);
            root.appendChild(actions);

            this.container.appendChild(root);

            this.root = root;
            this.zone = zone;
            this.base = base;
            this.knob = knob;
            this.actions = actions;
            this.jumpButton = jumpButton;
            this.attackButton = attackButton;
            this.powerButton = powerButton;
        }

        criarBotao(
            classe,
            icone,
            legenda,
            acao
        ) {
            const button = document.createElement(
                'button'
            );

            button.type = 'button';

            button.className = (
                `miguel-action-button ${classe}`
            );

            button.setAttribute(
                'aria-label',
                legenda
            );

            button.dataset.action = acao;

            const icon = document.createElement(
                'span'
            );

            icon.className = (
                'miguel-action-icon'
            );

            icon.textContent = icone;

            const label = document.createElement(
                'span'
            );

            label.className = (
                'miguel-action-label'
            );

            label.textContent = legenda;

            button.appendChild(icon);
            button.appendChild(label);

            return button;
        }

        registrarEventos() {
            this.abortController = (
                new AbortController()
            );

            const signal = (
                this.abortController.signal
            );

            const bloquearGestoNavegador = (
                evento
            ) => {
                if (evento.cancelable) {
                    evento.preventDefault();
                }
            };

            [
                'gesturestart',
                'gesturechange',
                'gestureend',
                'dblclick'
            ].forEach((tipo) => {
                this.container.addEventListener(
                    tipo,
                    bloquearGestoNavegador,
                    {
                        signal,
                        passive: false
                    }
                );
            });

            this.container.addEventListener(
                'touchend',
                (evento) => {
                    const agora = performance.now();

                    const intervalo = (
                        agora - this.ultimoTouchEnd
                    );

                    if (
                        intervalo > 0
                        && intervalo < 360
                        && evento.cancelable
                    ) {
                        evento.preventDefault();
                    }

                    this.ultimoTouchEnd = agora;
                },
                {
                    signal,
                    passive: false
                }
            );

            this.zone.addEventListener(
                'pointerdown',
                (evento) => {
                    this.iniciarJoystick(evento);
                },
                {
                    signal,
                    passive: false
                }
            );

            this.zone.addEventListener(
                'pointermove',
                (evento) => {
                    this.moverJoystick(evento);
                },
                {
                    signal,
                    passive: false
                }
            );

            [
                'pointerup',
                'pointercancel',
                'lostpointercapture'
            ].forEach((tipo) => {
                this.zone.addEventListener(
                    tipo,
                    (evento) => {
                        this.liberarJoystick(
                            evento.pointerId
                        );
                    },
                    {
                        signal,
                        passive: false
                    }
                );
            });

            [
                this.jumpButton,
                this.attackButton,
                this.powerButton
            ].forEach((button) => {
                button.addEventListener(
                    'pointerdown',
                    (evento) => {
                        evento.preventDefault();
                        evento.stopPropagation();

                        this.onDevice('touch');

                        button.classList.add(
                            'is-pressed'
                        );

                        this.onAction(
                            button.dataset.action
                        );
                    },
                    {
                        signal,
                        passive: false
                    }
                );

                [
                    'pointerup',
                    'pointercancel',
                    'pointerleave'
                ].forEach((tipo) => {
                    button.addEventListener(
                        tipo,
                        () => {
                            button.classList.remove(
                                'is-pressed'
                            );
                        },
                        {
                            signal
                        }
                    );
                });
            });

            window.addEventListener(
                'resize',
                () => {
                    this.atualizarLayout();
                },
                {
                    signal
                }
            );

            window.addEventListener(
                'orientationchange',
                () => {
                    this.reset();
                    this.atualizarLayout();
                },
                {
                    signal
                }
            );

            if (window.visualViewport) {
                window.visualViewport.addEventListener(
                    'resize',
                    () => {
                        this.atualizarLayout();
                    },
                    {
                        signal
                    }
                );
            }
        }

        obterViewport() {
            const visual = window.visualViewport;

            return {
                width: Math.max(
                    1,
                    visual
                    ? visual.width
                    : window.innerWidth
                ),

                height: Math.max(
                    1,
                    visual
                    ? visual.height
                    : window.innerHeight
                )
            };
        }

        atualizarLayout() {
            if (!this.root) {
                return;
            }

            const viewport = (
                this.obterViewport()
            );

            this.radius = Math.min(
                92,
                Math.max(
                    56,
                    Math.min(
                        viewport.width,
                        viewport.height
                    ) * 0.13
                )
            );

            this.root.style.setProperty(
                '--joystick-diameter',
                `${Math.round(
                    this.radius * 2
                )}px`
            );

            if (
                this.pointerId !== null
            ) {
                this.center = (
                    this.limitarCentro(
                        this.center.x,
                        this.center.y
                    )
                );

                this.posicionarElemento(
                    this.base,
                    this.center.x,
                    this.center.y
                );
            }
        }

        limitarCentro(x, y) {
            const viewport = (
                this.obterViewport()
            );

            const limiteDireito = Math.max(
                this.radius + 12,
                viewport.width * 0.56
                    - this.radius
                    - 12
            );

            return {
                x: Math.min(
                    limiteDireito,
                    Math.max(
                        this.radius + 12,
                        x
                    )
                ),

                y: Math.min(
                    viewport.height
                        - this.radius
                        - 12,

                    Math.max(
                        this.radius + 82,
                        y
                    )
                )
            };
        }

        iniciarJoystick(evento) {
            if (
                this.pointerId !== null
                || this.destruido
            ) {
                return;
            }

            evento.preventDefault();

            this.onDevice('touch');

            this.pointerId = evento.pointerId;

            try {
                this.zone.setPointerCapture(
                    evento.pointerId
                );
            } catch (erro) {
                console.debug(
                    'Captura do joystick indisponível:',
                    erro
                );
            }

            this.center = this.limitarCentro(
                evento.clientX,
                evento.clientY
            );

            this.root.classList.add(
                'joystick-active'
            );

            this.posicionarElemento(
                this.base,
                this.center.x,
                this.center.y
            );

            this.posicionarElemento(
                this.knob,
                this.center.x,
                this.center.y
            );

            this.moverJoystick(evento);
        }

        moverJoystick(evento) {
            if (
                this.pointerId === null
                || evento.pointerId
                    !== this.pointerId
            ) {
                return;
            }

            evento.preventDefault();

            const dx = (
                evento.clientX
                - this.center.x
            );

            const dy = (
                evento.clientY
                - this.center.y
            );

            const distancia = Math.max(
                0.0001,
                Math.hypot(dx, dy)
            );

            const escala = (
                distancia > this.radius
                ? this.radius / distancia
                : 1
            );

            const limitadoX = dx * escala;
            const limitadoY = dy * escala;

            this.axis.x = Math.max(
                -1,
                Math.min(
                    1,
                    limitadoX / this.radius
                )
            );

            this.axis.y = Math.max(
                -1,
                Math.min(
                    1,
                    limitadoY / this.radius
                )
            );

            this.posicionarElemento(
                this.knob,
                this.center.x + limitadoX,
                this.center.y + limitadoY
            );

            this.onAxis(
                this.axis.x,
                this.axis.y
            );
        }

        liberarJoystick(
            pointerId = null
        ) {
            if (
                pointerId !== null
                && pointerId !== this.pointerId
            ) {
                return;
            }

            this.pointerId = null;

            this.axis.x = 0;
            this.axis.y = 0;

            if (this.root) {
                this.root.classList.remove(
                    'joystick-active'
                );
            }

            this.onAxis(0, 0);
        }

        posicionarElemento(
            elemento,
            x,
            y
        ) {
            if (!elemento) {
                return;
            }

            elemento.style.left = `${x}px`;
            elemento.style.top = `${y}px`;
        }

        setPowerUnlocked(ativo) {
            this.powerUnlocked = Boolean(
                ativo
            );

            if (!this.powerButton) {
                return;
            }

            this.powerButton.classList.toggle(
                'is-locked',
                !this.powerUnlocked
            );

            this.powerButton.setAttribute(
                'aria-label',
                this.powerUnlocked
                ? 'PODER'
                : 'PODER BLOQUEADO'
            );
        }

        setGamepadMode(ativo) {
            if (!this.root) {
                return;
            }

            this.root.classList.toggle(
                'is-gamepad',
                Boolean(ativo)
            );
        }

        reset() {
            this.liberarJoystick();

            this.ultimoTouchEnd = 0;

            [
                this.jumpButton,
                this.attackButton,
                this.powerButton
            ].forEach((button) => {
                if (button) {
                    button.classList.remove(
                        'is-pressed'
                    );
                }
            });
        }

        snapshot() {
            return {
                ativo: this.ativo,
                pointerId: this.pointerId,

                eixo: {
                    x: Number(
                        this.axis.x.toFixed(3)
                    ),

                    y: Number(
                        this.axis.y.toFixed(3)
                    )
                },

                raio: Math.round(
                    this.radius
                ),

                powerUnlocked:
                    this.powerUnlocked,

                viewport:
                    this.obterViewport()
            };
        }

        destruir() {
            if (this.destruido) {
                return;
            }

            this.destruido = true;
            this.ativo = false;

            this.reset();

            if (this.abortController) {
                this.abortController.abort();
            }

            if (
                this.root
                && this.root.parentNode
            ) {
                this.root.parentNode.removeChild(
                    this.root
                );
            }

            this.root = null;
            this.zone = null;
            this.base = null;
            this.knob = null;
            this.actions = null;
        }
    }

    window.MiguelMobileControls = (
        MiguelMobileControls
    );
})();
