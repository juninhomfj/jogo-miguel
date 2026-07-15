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
                Number(options.totalEtapas || 6)
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
                    59,
                    776,
                    102,
                    0x07111f,
                    0.92
                )
            );

            painel.setStrokeStyle(
                2,
                0x35d9ff,
                0.72
            );

            const divisorEsquerdo = (
                this.scene.add.rectangle(
                    213,
                    59,
                    2,
                    82,
                    0x35d9ff,
                    0.35
                )
            );

            const divisorDireito = (
                this.scene.add.rectangle(
                    651,
                    59,
                    2,
                    82,
                    0x35d9ff,
                    0.35
                )
            );

            this.textoNome = (
                this.scene.add.text(
                    26,
                    16,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '16px',

                        color:
                            '#ffcc00',

                        fontStyle:
                            'bold'
                    }
                )
            );

            this.textoPontos = (
                this.scene.add.text(
                    26,
                    38,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '13px',

                        color:
                            '#ffffff',

                        fontStyle:
                            'bold'
                    }
                )
            );

            this.textoVida = (
                this.scene.add.text(
                    26,
                    59,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '11px',

                        color:
                            '#dff8ff',

                        fontStyle:
                            'bold'
                    }
                )
            );

            this.fundoVida = (
                this.scene.add.rectangle(
                    26,
                    78,
                    158,
                    13,
                    0x101820,
                    1
                )
            );

            this.fundoVida
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    0xffffff,
                    0.8
                );

            this.barraVida = (
                this.scene.add.rectangle(
                    29,
                    81,
                    152,
                    7,
                    0x28ff72,
                    1
                )
            );

            this.barraVida.setOrigin(0, 0);

            this.textoCoracoes = (
                this.scene.add.text(
                    190,
                    75,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '15px',

                        color:
                            '#ff496c',

                        fontStyle:
                            'bold'
                    }
                )
            ).setOrigin(1, 0);

            this.textoEtapa = (
                this.scene.add.text(
                    232,
                    15,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '12px',

                        color:
                            '#8fe9ff',

                        fontStyle:
                            'bold'
                    }
                )
            );

            this.textoObjetivo = (
                this.scene.add.text(
                    432,
                    39,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '19px',

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
                    432,
                    63,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '11px',

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
                    777,
                    20,
                    this.tipoFase,
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '13px',

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
                    777,
                    49,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '12px',

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
            const largura = 54;
            const espaco = 8;

            const larguraTotal = (
                this.totalEtapas * largura
                + (
                    this.totalEtapas - 1
                ) * espaco
            );

            const inicioX = (
                432
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

                        92,

                        largura,
                        6,

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
                    142,
                    500,
                    46,
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
                    142,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '15px',

                        color:
                            '#ffffff',

                        fontStyle:
                            'bold',

                        align:
                            'center',

                        wordWrap: {
                            width: 455
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
                    152 * proporcao
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
                    this.dispositivo
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
