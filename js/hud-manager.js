(() => {
    class MiguelHUDManager {
        constructor(
            scene,
            options = {}
        ) {
            this.scene = scene;

            this.nome = String(
                options.nome || 'MIG'
            ).substring(0, 12);

            this.pontos = Number(
                options.pontos || 0
            );

            this.tipoFase = String(
                options.tipoFase || 'TUTORIAL'
            );

            this.totalEtapas = Math.max(
                1,
                Number(options.totalEtapas || 7)
            );

            this.vida = 100;
            this.vidaMaxima = 100;
            this.vidas = 3;
            this.vidasMaximas = 3;

            this.etapa = 1;
            this.objetivo = 'PREPARANDO...';
            this.dica = '';
            this.tutorialConcluido = false;

            this.dispositivo = 'touch';

            this.ativo = true;
            this.destruido = false;

            this.container = null;

            this.textoNome = null;
            this.textoPontos = null;

            this.textoVida = null;
            this.fundoVida = null;
            this.barraVida = null;
            this.textoCoracoes = null;

            this.textoEtapa = null;
            this.textoObjetivo = null;
            this.textoDica = null;

            this.textoFase = null;
            this.textoDispositivo = null;

            this.segmentos = [];

            this.toastFundo = null;
            this.toastTexto = null;

            this.eventoToast = null;
            this.revisaoToast = 0;

            this.hudSuavizado = false;
            this.alphaHud = 1;
        }

        iniciar() {
            if (
                !this.ativo
                || this.destruido
            ) {
                return;
            }

            this.criarInterface();

            this.atualizarIdentidade();
            this.atualizarVida({
                vida: this.vida,
                vidaMaxima: this.vidaMaxima,
                vidas: this.vidas,
                vidasMaximas:
                    this.vidasMaximas
            });

            this.atualizarTutorial({
                etapa: this.etapa,
                totalEtapas:
                    this.totalEtapas,
                titulo:
                    this.objetivo,
                dica:
                    this.dica,
                concluido: false
            });

            this.atualizarDispositivo(
                this.dispositivo
            );

            this.scene.events.once(
                Phaser.Scenes.Events.SHUTDOWN,
                () => {
                    this.destruir();
                }
            );

            window.__MIGUEL_HUD__ = {
                snapshot: () => {
                    return this.obterEstado();
                },

                message: (
                    mensagem,
                    duracao = 1200
                ) => {
                    this.mostrarMensagem(
                        mensagem,
                        duracao
                    );
                }
            };

            console.info(
                '[HUD]',
                'iniciado',
                this.obterEstado()
            );
        }

        criarInterface() {
            this.container = (
                this.scene.add.container(
                    0,
                    0
                )
            );

            this.container
                .setDepth(1050)
                .setScrollFactor(0);

            const painel = (
                this.scene.add.rectangle(
                    400,
                    42,
                    780,
                    74,
                    0x07111f,
                    0.86
                )
            );

            painel.setStrokeStyle(
                2,
                0x35d9ff,
                0.68
            );

            const divisorEsquerdo = (
                this.scene.add.rectangle(
                    208,
                    42,
                    2,
                    58,
                    0x35d9ff,
                    0.32
                )
            );

            const divisorDireito = (
                this.scene.add.rectangle(
                    652,
                    42,
                    2,
                    58,
                    0x35d9ff,
                    0.32
                )
            );

            this.textoNome = (
                this.scene.add.text(
                    20,
                    9,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '13px',

                        color:
                            '#ffcc00',

                        fontStyle:
                            'bold'
                    }
                )
            );

            this.textoPontos = (
                this.scene.add.text(
                    20,
                    27,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '11px',

                        color:
                            '#ffffff',

                        fontStyle:
                            'bold'
                    }
                )
            );

            this.textoVida = (
                this.scene.add.text(
                    20,
                    45,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '9px',

                        color:
                            '#dff8ff',

                        fontStyle:
                            'bold'
                    }
                )
            );

            this.fundoVida = (
                this.scene.add.rectangle(
                    20,
                    61,
                    120,
                    10,
                    0x101820,
                    1
                )
            );

            this.fundoVida
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    0xffffff,
                    0.76
                );

            this.barraVida = (
                this.scene.add.rectangle(
                    23,
                    64,
                    114,
                    4,
                    0x28ff72,
                    1
                )
            );

            this.barraVida.setOrigin(0, 0);

            this.textoCoracoes = (
                this.scene.add.text(
                    194,
                    55,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '12px',

                        color:
                            '#ff496c',

                        fontStyle:
                            'bold'
                    }
                )
            ).setOrigin(1, 0);

            this.textoEtapa = (
                this.scene.add.text(
                    224,
                    8,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '10px',

                        color:
                            '#8fe9ff',

                        fontStyle:
                            'bold'
                    }
                )
            );

            this.textoObjetivo = (
                this.scene.add.text(
                    430,
                    28,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '16px',

                        color:
                            '#ffcc00',

                        fontStyle:
                            'bold',

                        align:
                            'center'
                    }
                )
            ).setOrigin(0.5);

            this.textoDica = (
                this.scene.add.text(
                    430,
                    47,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '9px',

                        color:
                            '#ffffff',

                        align:
                            'center',

                        wordWrap: {
                            width: 405
                        }
                    }
                )
            ).setOrigin(0.5);

            this.textoFase = (
                this.scene.add.text(
                    780,
                    12,
                    this.tipoFase,
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '10px',

                        color:
                            '#8fe9ff',

                        fontStyle:
                            'bold',

                        align:
                            'right'
                    }
                )
            ).setOrigin(1, 0);

            this.textoDispositivo = (
                this.scene.add.text(
                    780,
                    39,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '9px',

                        color:
                            '#ffffff',

                        fontStyle:
                            'bold',

                        align:
                            'right'
                    }
                )
            ).setOrigin(1, 0);

            this.container.add([
                painel,
                divisorEsquerdo,
                divisorDireito,
                this.textoNome,
                this.textoPontos,
                this.textoVida,
                this.fundoVida,
                this.barraVida,
                this.textoCoracoes,
                this.textoEtapa,
                this.textoObjetivo,
                this.textoDica,
                this.textoFase,
                this.textoDispositivo
            ]);

            this.criarSegmentos();
            this.criarToast();
        }

        criarSegmentos() {
            const largura = 45;
            const espaco = 7;

            const larguraTotal = (
                this.totalEtapas * largura
                + (
                    this.totalEtapas - 1
                ) * espaco
            );

            const inicioX = (
                430
                - larguraTotal / 2
                + largura / 2
            );

            for (
                let indice = 0;
                indice < this.totalEtapas;
                indice += 1
            ) {
                const segmento = (
                    this.scene.add.rectangle(
                        inicioX
                        + indice
                        * (
                            largura + espaco
                        ),

                        68,

                        largura,
                        5,

                        0x29405a,
                        1
                    )
                );

                this.segmentos.push(
                    segmento
                );

                this.container.add(
                    segmento
                );
            }
        }

        criarToast() {
            this.toastFundo = (
                this.scene.add.rectangle(
                    400,
                    104,
                    460,
                    38,
                    0x062b23,
                    0.96
                )
            );

            this.toastFundo
                .setStrokeStyle(
                    2,
                    0x28ff9b,
                    0.92
                )
                .setVisible(false);

            this.toastTexto = (
                this.scene.add.text(
                    400,
                    104,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '13px',

                        color:
                            '#ffffff',

                        fontStyle:
                            'bold',

                        align:
                            'center',

                        wordWrap: {
                            width: 420
                        }
                    }
                )
            );

            this.toastTexto
                .setOrigin(0.5)
                .setVisible(false);

            this.container.add([
                this.toastFundo,
                this.toastTexto
            ]);
        }

        atualizarIdentidade(
            nome = this.nome,
            pontos = this.pontos
        ) {
            this.nome = String(
                nome || 'MIG'
            ).substring(0, 12);

            this.pontos = Number(
                pontos || 0
            );

            if (this.textoNome) {
                this.textoNome.setText(
                    this.nome.toUpperCase()
                );
            }

            if (this.textoPontos) {
                this.textoPontos.setText(
                    `${this.pontos} PONTOS`
                );
            }
        }

        atualizarPontuacao(pontos) {
            this.pontos = Number(
                pontos || 0
            );

            this.atualizarIdentidade(
                this.nome,
                this.pontos
            );
        }

        atualizarVida(estado = {}) {
            this.vida = Number(
                estado.vida
                ?? this.vida
            );

            this.vidaMaxima = Math.max(
                1,
                Number(
                    estado.vidaMaxima
                    ?? this.vidaMaxima
                )
            );

            this.vidas = Math.max(
                0,
                Number(
                    estado.vidas
                    ?? this.vidas
                )
            );

            this.vidasMaximas = Math.max(
                this.vidas,
                Number(
                    estado.vidasMaximas
                    ?? this.vidasMaximas
                )
            );

            if (
                !this.textoVida
                || !this.barraVida
                || !this.textoCoracoes
            ) {
                return;
            }

            this.textoVida.setText(
                `VIDA ${Math.ceil(this.vida)}`
                + `/${this.vidaMaxima}`
            );

            const proporcao = (
                Phaser.Math.Clamp(
                    this.vida
                    / this.vidaMaxima,

                    0,
                    1
                )
            );

            this.barraVida.displayWidth = (
                Math.max(
                    0.5,
                    114 * proporcao
                )
            );

            let cor = 0x28ff72;

            if (proporcao <= 0.25) {
                cor = 0xff334f;
            } else if (
                proporcao <= 0.55
            ) {
                cor = 0xffcc00;
            }

            this.barraVida.setFillStyle(
                cor,
                1
            );

            const cheios = Array.from(
                {
                    length: this.vidas
                },
                () => '♥'
            );

            const vazios = Array.from(
                {
                    length: Math.max(
                        0,
                        this.vidasMaximas
                        - this.vidas
                    )
                },
                () => '♡'
            );

            this.textoCoracoes.setText(
                [
                    ...cheios,
                    ...vazios
                ].join(' ')
            );
        }

        atualizarTutorial(dados = {}) {
            this.etapa = Phaser.Math.Clamp(
                Number(
                    dados.etapa
                    ?? this.etapa
                ),

                1,
                this.totalEtapas
            );

            this.objetivo = String(
                dados.titulo
                || this.objetivo
            );

            this.dica = String(
                dados.dica
                ?? this.dica
            );

            this.tutorialConcluido = Boolean(
                dados.concluido
            );

            if (
                !this.textoEtapa
                || !this.textoObjetivo
                || !this.textoDica
            ) {
                return;
            }

            this.textoEtapa.setText(
                `TREINAMENTO ${this.etapa}`
                + `/${this.totalEtapas}`
            );

            this.textoObjetivo.setText(
                this.objetivo
            );

            this.textoDica.setText(
                this.dica
            );

            this.segmentos.forEach(
                (segmento, indice) => {
                    let cor = 0x29405a;

                    if (
                        this.tutorialConcluido
                        || indice < this.etapa - 1
                    ) {
                        cor = 0x28ff9b;
                    } else if (
                        indice === this.etapa - 1
                    ) {
                        cor = 0xffcc00;
                    }

                    segmento.setFillStyle(
                        cor,
                        1
                    );
                }
            );
        }

        atualizarDispositivo(tipo) {
            const normalizado = String(
                tipo || 'touch'
            ).toLowerCase();

            this.dispositivo = normalizado;

            if (!this.textoDispositivo) {
                return;
            }

            const nomes = {
                touch: 'CONTROLE: TOQUE',
                teclado: 'CONTROLE: TECLADO',
                gamepad: 'CONTROLE: GAMEPAD'
            };

            this.textoDispositivo.setText(
                nomes[normalizado]
                || 'CONTROLE: AUTOMÁTICO'
            );
        }

        mostrarMensagem(
            mensagem,
            duracao = 1200
        ) {
            if (
                !this.ativo
                || this.destruido
                || !this.toastFundo
                || !this.toastTexto
            ) {
                return;
            }

            this.revisaoToast += 1;

            const revisaoAtual = (
                this.revisaoToast
            );

            if (this.eventoToast) {
                this.eventoToast.remove(false);
                this.eventoToast = null;
            }

            this.toastTexto.setText(
                String(mensagem || '')
            );

            this.toastFundo
                .setVisible(true)
                .setAlpha(1);

            this.toastTexto
                .setVisible(true)
                .setAlpha(1);

            this.eventoToast = (
                this.scene.time.delayedCall(
                    Math.max(
                        350,
                        Number(duracao || 1200)
                    ),

                    () => {
                        if (
                            !this.ativo
                            || this.destruido
                            || revisaoAtual
                                !== this.revisaoToast
                        ) {
                            return;
                        }

                        this.scene.tweens.add({
                            targets: [
                                this.toastFundo,
                                this.toastTexto
                            ],

                            alpha: 0,
                            duration: 220,

                            onComplete: () => {
                                if (
                                    revisaoAtual
                                    !== this.revisaoToast
                                ) {
                                    return;
                                }

                                this.toastFundo
                                    .setVisible(false)
                                    .setAlpha(1);

                                this.toastTexto
                                    .setVisible(false)
                                    .setAlpha(1);
                            }
                        });
                    }
                )
            );
        }

        atualizarVisibilidade(player) {
            if (
                !this.container
                || !player
                || !player.active
            ) {
                return;
            }

            const toastVisivel = Boolean(
                this.toastFundo
                && this.toastFundo.visible
            );

            const topoPlayer = (
                player.body
                ? player.body.top
                : player.y - 70
            );

            const suavizar = Boolean(
                !toastVisivel
                && topoPlayer < 112
            );

            if (
                suavizar
                === this.hudSuavizado
            ) {
                return;
            }

            this.hudSuavizado = suavizar;

            const alphaAlvo = (
                suavizar
                ? 0.28
                : 1
            );

            this.alphaHud = alphaAlvo;

            this.scene.tweens.killTweensOf(
                this.container
            );

            this.scene.tweens.add({
                targets: this.container,
                alpha: alphaAlvo,
                duration: 150,
                ease: 'Sine.easeOut'
            });
        }

        obterEstado() {
            return {
                nome: this.nome,
                pontos: this.pontos,

                vida: this.vida,
                vidaMaxima:
                    this.vidaMaxima,

                vidas: this.vidas,
                vidasMaximas:
                    this.vidasMaximas,

                etapa: this.etapa,
                totalEtapas:
                    this.totalEtapas,

                objetivo:
                    this.objetivo,

                dica: this.dica,

                tutorialConcluido:
                    this.tutorialConcluido,

                dispositivo:
                    this.dispositivo,

                hudSuavizado:
                    this.hudSuavizado,

                alphaHud:
                    this.alphaHud
            };
        }

        destruir() {
            if (this.destruido) {
                return;
            }

            this.destruido = true;
            this.ativo = false;

            if (this.eventoToast) {
                this.eventoToast.remove(false);
            }

            if (
                this.container
                && this.container.active
            ) {
                this.container.destroy(true);
            }

            if (window.__MIGUEL_HUD__) {
                delete window.__MIGUEL_HUD__;
            }
        }
    }

    window.MiguelHUDManager = (
        MiguelHUDManager
    );
})();
