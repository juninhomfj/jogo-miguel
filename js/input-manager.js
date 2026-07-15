(() => {
    class MiguelInputManager {
        constructor(
            scene,
            options = {}
        ) {
            this.scene = scene;

            this.tutorial = Boolean(
                options.tutorial
            );

            this.ativo = true;
            this.destruido = false;

            this.mobile = this.ehDispositivoTouch();

            this.ultimoDispositivo = (
                this.mobile
                ? 'touch'
                : 'teclado'
            );

            this.eixoTouchX = 0;
            this.eixoTouchY = 0;

            this.eixoTecladoX = 0;
            this.eixoTecladoY = 0;

            this.eixoGamepadX = 0;
            this.eixoGamepadY = 0;

            this.eixoFinalX = 0;
            this.eixoFinalY = 0;

            // Histerese: entra e sai do agachamento
            // usando limites diferentes.
            this.agachamentoSolicitado = false;
            this.limiarAgacharEntrada = 0.62;
            this.limiarAgacharSaida = 0.30;

            // O pulo ocorre somente ao atravessar
            // o limite superior do analógico.
            this.puloAnalogicoArmado = true;
            this.limiarPuloAnalogico = -0.68;
            this.limiarRearmePulo = -0.24;

            this.filaPulo = 0;
            this.filaAtaque = 0;
            this.filaPoder = 0;
            this.filaPausa = 0;
            this.filaReiniciar = 0;



            this.joystickCentro = {
                x: 0,
                y: 0
            };

            this.raioJoystick = 72;

            this.mobileControls = null;

            this.dicaDesktop = null;
            this.eventoOcultarDica = null;

            this.cursors = null;
            this.teclas = null;
            this.teclaAtaque = null;
            this.teclaPausa = null;
            this.teclaPoder = null;

            this.gamepadAnterior = {
                pulo: false,
                ataque: false,
                poder: false,
                pausa: false,
                reiniciar: false
            };

            this.gamepadAtual = null;

            // Os eventos mobile são tratados por uma
            // camada DOM que cobre a tela física inteira.
        }

        iniciar() {
            if (!this.ativo || this.destruido) {
                return;
            }

            this.scene.input.addPointer(5);

            this.criarTeclado();

            if (this.mobile) {
                this.criarInterfaceMobile();
            } else {
                this.criarDicaDesktop();
            }

            this.scene.events.once(
                Phaser.Scenes.Events.SHUTDOWN,
                () => {
                    this.destruir();
                }
            );

            window.__MIGUEL_INPUT__ = {
                snapshot: () => {
                    return this.obterEstado();
                },

                jump: () => {
                    this.solicitarAcao('pulo');
                },

                attack: () => {
                    this.solicitarAcao('ataque');
                },

                power: () => {
                    this.solicitarAcao('poder');
                }
            };

            console.info(
                '[CONTROLES]',
                'iniciados',
                this.obterEstado()
            );
        }

        ehDispositivoTouch() {
            const toque = Boolean(
                'ontouchstart' in window
                || navigator.maxTouchPoints > 0
            );

            const ponteiroGrosso = Boolean(
                window.matchMedia
                && window.matchMedia(
                    '(pointer: coarse)'
                ).matches
            );

            const viewportCompativel = Boolean(
                Math.min(
                    window.innerWidth,
                    window.innerHeight
                ) <= 1024
            );

            return Boolean(
                toque
                && (
                    ponteiroGrosso
                    || viewportCompativel
                )
            );
        }

        criarTeclado() {
            this.cursors = (
                this.scene.input.keyboard
                    .createCursorKeys()
            );

            this.teclas = (
                this.scene.input.keyboard.addKeys({
                    esquerda:
                        Phaser.Input.Keyboard
                            .KeyCodes.A,

                    direita:
                        Phaser.Input.Keyboard
                            .KeyCodes.D,

                    cima:
                        Phaser.Input.Keyboard
                            .KeyCodes.W,

                    baixo:
                        Phaser.Input.Keyboard
                            .KeyCodes.S,

                    ataque:
                        Phaser.Input.Keyboard
                            .KeyCodes.X,

                    poder:
                        Phaser.Input.Keyboard
                            .KeyCodes.E,

                    pausa:
                        Phaser.Input.Keyboard
                            .KeyCodes.P,

                    reiniciar:
                        Phaser.Input.Keyboard
                            .KeyCodes.R
                })
            );

            this.teclaAtaque = (
                this.scene.input.keyboard.addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.SPACE
                )
            );

            this.teclaPausa = (
                this.scene.input.keyboard.addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.ESC
                )
            );

            this.teclaPoder = (
                this.scene.input.keyboard.addKey(
                    Phaser.Input.Keyboard
                        .KeyCodes.Q
                )
            );

            this.scene.input.keyboard.addCapture([
                Phaser.Input.Keyboard.KeyCodes.UP,
                Phaser.Input.Keyboard.KeyCodes.DOWN,
                Phaser.Input.Keyboard.KeyCodes.LEFT,
                Phaser.Input.Keyboard.KeyCodes.RIGHT,

                Phaser.Input.Keyboard.KeyCodes.W,
                Phaser.Input.Keyboard.KeyCodes.A,
                Phaser.Input.Keyboard.KeyCodes.S,
                Phaser.Input.Keyboard.KeyCodes.D,

                Phaser.Input.Keyboard.KeyCodes.Q,
                Phaser.Input.Keyboard.KeyCodes.E,
                Phaser.Input.Keyboard.KeyCodes.P,
                Phaser.Input.Keyboard.KeyCodes.R,
                Phaser.Input.Keyboard.KeyCodes.X,
                Phaser.Input.Keyboard.KeyCodes.SPACE,
                Phaser.Input.Keyboard.KeyCodes.ESC
            ]);
        }

        criarInterfaceMobile() {
            if (
                typeof window.MiguelMobileControls
                    !== 'function'
            ) {
                throw new Error(
                    'MiguelMobileControls indisponível.'
                );
            }

            this.mobileControls = (
                new window.MiguelMobileControls({
                    container:
                        document.getElementById(
                            'game-container'
                        ),

                    powerUnlocked: false,

                    onAxis: (x, y) => {
                        this.eixoTouchX = x;
                        this.eixoTouchY = y;
                    },

                    onAction: (tipo) => {
                        this.usarDispositivo(
                            'touch'
                        );

                        this.solicitarAcao(
                            tipo
                        );
                    },

                    onDevice: () => {
                        this.usarDispositivo(
                            'touch'
                        );
                    }
                })
            );

            this.mobileControls.iniciar();
        }

        criarDicaDesktop() {
            this.dicaDesktop = (
                this.scene.add.container(
                    400,
                    555
                )
            );

            this.dicaDesktop
                .setDepth(1100)
                .setScrollFactor(0);

            const fundo = (
                this.scene.add.rectangle(
                    0,
                    0,
                    620,
                    48,
                    0x07101e,
                    0.76
                )
            );

            fundo.setStrokeStyle(
                2,
                0x8fe9ff,
                0.42
            );

            const texto = (
                this.scene.add.text(
                    0,
                    0,
                    'A/D ou ←→ MOVER  ·  '
                    + 'W/↑ PULAR\n'
                    + 'S/↓ AGACHAR  ·  '
                    + 'X/ESPAÇO GOLPE',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '12px',

                        align:
                            'center',

                        lineSpacing:
                            3,

                        color:
                            '#dff8ff',

                        fontStyle:
                            'bold'
                    }
                )
            ).setOrigin(0.5);

            this.dicaDesktop.add([
                fundo,
                texto
            ]);

            this.eventoOcultarDica = (
                this.scene.time.delayedCall(
                    5200,
                    () => {
                        this.ocultarDicaDesktop();
                    }
                )
            );
        }

        animarBotao(container) {
            this.scene.tweens.killTweensOf(
                container
            );

            container.setScale(0.88);

            this.scene.tweens.add({
                targets: container,
                scaleX: 1,
                scaleY: 1,
                duration: 130,
                ease: 'Back.easeOut'
            });
        }

        solicitarAcao(tipo) {
            switch (tipo) {
                case 'pulo':
                    this.filaPulo = Math.min(
                        3,
                        this.filaPulo + 1
                    );
                    break;

                case 'ataque':
                    this.filaAtaque = Math.min(
                        3,
                        this.filaAtaque + 1
                    );
                    break;

                case 'poder':
                    this.filaPoder = Math.min(
                        2,
                        this.filaPoder + 1
                    );
                    break;

                case 'pausa':
                    this.filaPausa = Math.min(
                        1,
                        this.filaPausa + 1
                    );
                    break;

                case 'reiniciar':
                    this.filaReiniciar = Math.min(
                        1,
                        this.filaReiniciar + 1
                    );
                    break;

                default:
                    break;
            }
        }

        consumirFila(nome) {
            if (this[nome] <= 0) {
                return false;
            }

            this[nome] -= 1;
            return true;
        }

        consumirPulo() {
            return this.consumirFila(
                'filaPulo'
            );
        }

        consumirAtaque() {
            return this.consumirFila(
                'filaAtaque'
            );
        }

        consumirPoder() {
            return this.consumirFila(
                'filaPoder'
            );
        }

        consumirPausa() {
            return this.consumirFila(
                'filaPausa'
            );
        }

        consumirReiniciar() {
            return this.consumirFila(
                'filaReiniciar'
            );
        }

        atualizar() {
            if (
                !this.ativo
                || this.destruido
            ) {
                return;
            }

            this.atualizarTeclado();
            this.atualizarGamepad();

            const touchAtivo = Boolean(
                Math.abs(this.eixoTouchX) > 0.01
                || Math.abs(this.eixoTouchY) > 0.01
            );

            const gamepadAtivo = Boolean(
                Math.abs(this.eixoGamepadX) > 0.12
                || Math.abs(this.eixoGamepadY) > 0.12
            );

            if (touchAtivo) {
                this.eixoFinalX =
                    this.eixoTouchX;

                this.eixoFinalY =
                    this.eixoTouchY;
            } else if (
                gamepadAtivo
                || this.ultimoDispositivo
                    === 'gamepad'
            ) {
                this.eixoFinalX =
                    this.eixoGamepadX;

                this.eixoFinalY =
                    this.eixoGamepadY;
            } else {
                this.eixoFinalX =
                    this.eixoTecladoX;

                this.eixoFinalY =
                    this.eixoTecladoY;
            }

            this.eixoFinalX = (
                this.aplicarZonaMorta(
                    this.eixoFinalX,
                    0.14
                )
            );

            this.eixoFinalY = (
                this.aplicarZonaMorta(
                    this.eixoFinalY,
                    0.18
                )
            );

            this.atualizarGestosDirecionais();
        }

        atualizarGestosDirecionais() {
            const eixoY = this.eixoFinalY;

            if (
                !this.agachamentoSolicitado
                && eixoY
                    >= this.limiarAgacharEntrada
            ) {
                this.agachamentoSolicitado = true;
            } else if (
                this.agachamentoSolicitado
                && eixoY
                    <= this.limiarAgacharSaida
            ) {
                this.agachamentoSolicitado = false;
            }

            const direcionalPodePular = Boolean(
                this.ultimoDispositivo === 'touch'
                || this.ultimoDispositivo === 'gamepad'
            );

            if (!direcionalPodePular) {
                this.puloAnalogicoArmado = true;
                return;
            }

            if (
                this.puloAnalogicoArmado
                && eixoY
                    <= this.limiarPuloAnalogico
            ) {
                this.puloAnalogicoArmado = false;

                this.solicitarAcao(
                    'pulo'
                );

                if (
                    window.MIGUEL_SETTINGS_MANAGER
                ) {
                    window.MIGUEL_SETTINGS_MANAGER
                        .vibrar(10);
                }
            } else if (
                !this.puloAnalogicoArmado
                && eixoY
                    >= this.limiarRearmePulo
            ) {
                this.puloAnalogicoArmado = true;
            }
        }

        estaAgachando() {
            return Boolean(
                this.agachamentoSolicitado
            );
        }

        atualizarTeclado() {
            const esquerda = Boolean(
                this.cursors.left.isDown
                || this.teclas.esquerda.isDown
            );

            const direita = Boolean(
                this.cursors.right.isDown
                || this.teclas.direita.isDown
            );

            const cima = Boolean(
                this.cursors.up.isDown
                || this.teclas.cima.isDown
            );

            const baixo = Boolean(
                this.cursors.down.isDown
                || this.teclas.baixo.isDown
            );

            this.eixoTecladoX = (
                esquerda === direita
                ? 0
                : (
                    esquerda
                    ? -1
                    : 1
                )
            );

            this.eixoTecladoY = (
                cima === baixo
                ? 0
                : (
                    cima
                    ? -1
                    : 1
                )
            );

            const houveMovimento = Boolean(
                esquerda
                || direita
                || cima
                || baixo
            );

            if (houveMovimento) {
                this.usarDispositivo(
                    'teclado'
                );
            }

            const pediuPulo = Boolean(
                Phaser.Input.Keyboard.JustDown(
                    this.cursors.up
                )
                || Phaser.Input.Keyboard.JustDown(
                    this.teclas.cima
                )
            );

            if (pediuPulo) {
                this.usarDispositivo('teclado');
                this.solicitarAcao('pulo');
            }

            const pediuAtaque = Boolean(
                Phaser.Input.Keyboard.JustDown(
                    this.teclas.ataque
                )
                || Phaser.Input.Keyboard.JustDown(
                    this.teclaAtaque
                )
            );

            if (pediuAtaque) {
                this.usarDispositivo('teclado');
                this.solicitarAcao('ataque');
            }

            const pediuPoder = Boolean(
                Phaser.Input.Keyboard.JustDown(
                    this.teclas.poder
                )
                || Phaser.Input.Keyboard.JustDown(
                    this.teclaPoder
                )
            );

            if (pediuPoder) {
                this.usarDispositivo('teclado');
                this.solicitarAcao('poder');
            }

            const pediuPausa = Boolean(
                Phaser.Input.Keyboard.JustDown(
                    this.teclas.pausa
                )
                || Phaser.Input.Keyboard.JustDown(
                    this.teclaPausa
                )
            );

            if (pediuPausa) {
                this.usarDispositivo('teclado');
                this.solicitarAcao('pausa');
            }

            if (
                Phaser.Input.Keyboard.JustDown(
                    this.teclas.reiniciar
                )
            ) {
                this.usarDispositivo('teclado');
                this.solicitarAcao('reiniciar');
            }
        }

        atualizarGamepad() {
            if (
                !navigator.getGamepads
            ) {
                this.eixoGamepadX = 0;
                this.eixoGamepadY = 0;
                return;
            }

            const controles = (
                Array.from(
                    navigator.getGamepads()
                    || []
                )
            );

            const gamepad = controles.find(
                (controle) => {
                    return Boolean(
                        controle
                        && controle.connected
                    );
                }
            );

            this.gamepadAtual = (
                gamepad || null
            );

            if (!gamepad) {
                this.eixoGamepadX = 0;
                this.eixoGamepadY = 0;

                this.gamepadAnterior = {
                    pulo: false,
                    ataque: false,
                    poder: false,
                    pausa: false,
                    reiniciar: false
                };

                return;
            }

            let eixoX = Number(
                gamepad.axes[0] || 0
            );

            let eixoY = Number(
                gamepad.axes[1] || 0
            );

            const esquerdaDigital = (
                this.botaoGamepadPressionado(
                    gamepad,
                    14
                )
            );

            const direitaDigital = (
                this.botaoGamepadPressionado(
                    gamepad,
                    15
                )
            );

            const cimaDigital = (
                this.botaoGamepadPressionado(
                    gamepad,
                    12
                )
            );

            const baixoDigital = (
                this.botaoGamepadPressionado(
                    gamepad,
                    13
                )
            );

            if (
                esquerdaDigital
                !== direitaDigital
            ) {
                eixoX = (
                    esquerdaDigital
                    ? -1
                    : 1
                );
            }

            if (
                cimaDigital
                !== baixoDigital
            ) {
                eixoY = (
                    cimaDigital
                    ? -1
                    : 1
                );
            }

            this.eixoGamepadX = (
                this.aplicarZonaMorta(
                    eixoX,
                    0.18
                )
            );

            this.eixoGamepadY = (
                this.aplicarZonaMorta(
                    eixoY,
                    0.18
                )
            );

            const estadoAtual = {
                // Botão inferior: A/Cruz.
                pulo:
                    this.botaoGamepadPressionado(
                        gamepad,
                        0
                    ),

                // Botão esquerdo: X/Quadrado.
                ataque:
                    this.botaoGamepadPressionado(
                        gamepad,
                        2
                    ),

                // Botão superior: Y/Triângulo.
                poder:
                    this.botaoGamepadPressionado(
                        gamepad,
                        3
                    ),

                pausa:
                    this.botaoGamepadPressionado(
                        gamepad,
                        9
                    ),

                reiniciar:
                    this.botaoGamepadPressionado(
                        gamepad,
                        8
                    )
            };

            Object.entries(
                estadoAtual
            ).forEach(
                ([acao, pressionado]) => {
                    const anterior = Boolean(
                        this.gamepadAnterior[
                            acao
                        ]
                    );

                    if (
                        pressionado
                        && !anterior
                    ) {
                        this.usarDispositivo(
                            'gamepad'
                        );

                        this.solicitarAcao(
                            acao
                        );
                    }
                }
            );

            this.gamepadAnterior =
                estadoAtual;

            if (
                Math.abs(this.eixoGamepadX)
                    > 0.18
                || Math.abs(this.eixoGamepadY)
                    > 0.18
                || esquerdaDigital
                || direitaDigital
                || cimaDigital
                || baixoDigital
            ) {
                this.usarDispositivo(
                    'gamepad'
                );
            }
        }

        botaoGamepadPressionado(
            gamepad,
            indice
        ) {
            const botao = (
                gamepad.buttons[
                    indice
                ]
            );

            return Boolean(
                botao
                && (
                    botao.pressed
                    || botao.value > 0.55
                )
            );
        }

        aplicarZonaMorta(
            valor,
            zona
        ) {
            if (
                Math.abs(valor) < zona
            ) {
                return 0;
            }

            const sinal = Math.sign(valor);

            const normalizado = (
                (
                    Math.abs(valor) - zona
                )
                / (
                    1 - zona
                )
            );

            return Phaser.Math.Clamp(
                normalizado * sinal,
                -1,
                1
            );
        }

        usarDispositivo(tipo) {
            this.ultimoDispositivo = tipo;

            if (
                tipo === 'teclado'
                || tipo === 'gamepad'
            ) {
                this.ocultarDicaDesktop();
            }

            if (this.mobileControls) {
                this.mobileControls.setGamepadMode(
                    tipo === 'gamepad'
                );
            }
        }

        ocultarDicaDesktop() {
            if (
                !this.dicaDesktop
                || !this.dicaDesktop.active
                || this.dicaDesktop.alpha <= 0
            ) {
                return;
            }

            this.scene.tweens.add({
                targets: this.dicaDesktop,
                alpha: 0,
                duration: 400,
                onComplete: () => {
                    if (
                        this.dicaDesktop
                        && this.dicaDesktop.active
                    ) {
                        this.dicaDesktop
                            .setVisible(false);
                    }
                }
            });
        }

        resetarEstado() {
            if (this.mobileControls) {
                this.mobileControls.reset();
            }

            this.eixoTouchX = 0;
            this.eixoTouchY = 0;

            this.eixoTecladoX = 0;
            this.eixoTecladoY = 0;

            this.eixoGamepadX = 0;
            this.eixoGamepadY = 0;

            this.eixoFinalX = 0;
            this.eixoFinalY = 0;

            this.agachamentoSolicitado = false;
            this.puloAnalogicoArmado = true;

            this.filaPulo = 0;
            this.filaAtaque = 0;
            this.filaPoder = 0;
            this.filaPausa = 0;
            this.filaReiniciar = 0;

            this.gamepadAnterior = {
                pulo: false,
                ataque: false,
                poder: false,
                pausa: false,
                reiniciar: false
            };
        }

        obterMovimentoX() {
            return this.eixoFinalX;
        }

        obterMovimentoY() {
            return this.eixoFinalY;
        }

        obterEstado() {
            return {
                ativo: this.ativo,
                mobile: this.mobile,

                ultimoDispositivo:
                    this.ultimoDispositivo,

                movimento: {
                    x: Number(
                        this.eixoFinalX
                            .toFixed(3)
                    ),

                    y: Number(
                        this.eixoFinalY
                            .toFixed(3)
                    )
                },

                gestos: {
                    agachamento:
                        this.agachamentoSolicitado,

                    puloAnalogicoArmado:
                        this.puloAnalogicoArmado
                },

                joystick: (
                    this.mobileControls
                    ? this.mobileControls
                        .snapshot()
                    : null
                ),

                gamepad: (
                    this.gamepadAtual
                    ? {
                        id:
                            this.gamepadAtual.id,

                        mapping:
                            this.gamepadAtual
                                .mapping
                    }
                    : null
                ),

                filas: {
                    pulo: this.filaPulo,
                    ataque: this.filaAtaque,
                    poder: this.filaPoder,
                    pausa: this.filaPausa,
                    reiniciar:
                        this.filaReiniciar
                }
            };
        }

        destruir() {
            if (this.destruido) {
                return;
            }

            this.destruido = true;
            this.ativo = false;

            if (this.mobileControls) {
                this.mobileControls.destroy();
                this.mobileControls = null;
            }

            if (this.eventoOcultarDica) {
                this.eventoOcultarDica
                    .remove(false);
            }

            if (
                this.dicaDesktop
                && this.dicaDesktop.active
            ) {
                this.dicaDesktop.destroy(true);
            }

            if (window.__MIGUEL_INPUT__) {
                delete window.__MIGUEL_INPUT__;
            }
        }
    }

    window.MiguelInputManager = (
        MiguelInputManager
    );
})();
