(() => {
    class MiguelTutorialManager {
        constructor(
            scene,
            options = {}
        ) {
            this.scene = scene;

            this.totalCristais = (
                options.totalCristais || 5
            );

            this.onComplete = (
                typeof options.onComplete
                    === 'function'
                ? options.onComplete
                : () => {}
            );

            this.mobile = Boolean(
                'ontouchstart' in window
                || navigator.maxTouchPoints > 0
                || (
                    window.matchMedia
                    && window.matchMedia(
                        '(pointer: coarse)'
                    ).matches
                )
            );

            this.ativo = true;
            this.concluido = false;
            this.avancoAgendado = false;

            this.indiceAtual = 0;

            this.ultimaPosicaoX = null;

            this.estado = {
                distanciaMovida: 0,
                pulo: false,
                puloDuplo: false,
                danoRobo: false,
                ataqueRobo: false,
                cristais: 0
            };

            this.objetivos = [
                {
                    id: 'movimento',

                    titulo:
                        'MOVA MIGUEL',

                    dicaMobile:
                        'Use ◀ e ▶ para se movimentar.',

                    dicaTeclado:
                        'Use A/D ou ←/→ para se mover.',

                    concluido: () => {
                        return (
                            this.estado
                                .distanciaMovida >= 90
                        );
                    }
                },

                {
                    id: 'pulo',

                    titulo:
                        'FAÇA UM PULO',

                    dicaMobile:
                        'Toque em PULO uma vez.',

                    dicaTeclado:
                        'Pressione W ou ↑ uma vez.',

                    concluido: () => {
                        return this.estado.pulo;
                    }
                },

                {
                    id: 'pulo-duplo',

                    titulo:
                        'USE O PULO DUPLO',

                    dicaMobile:
                        'No ar, toque em PULO novamente.',

                    dicaTeclado:
                        'No ar, pressione W ou ↑ novamente.',

                    concluido: () => {
                        return this.estado.puloDuplo;
                    }
                },

                {
                    id: 'dano-robo',

                    titulo:
                        'CUIDADO COM O ROBÔ',

                    dicaMobile:
                        'Encoste no robô para aprender '
                        + 'como funciona o dano.',

                    dicaTeclado:
                        'Encoste no robô para aprender '
                        + 'como funciona o dano.',

                    concluido: () => {
                        return this.estado.danoRobo;
                    }
                },

                {
                    id: 'ataque-robo',

                    titulo:
                        'DERROTE O ROBÔ',

                    dicaMobile:
                        'Agora use o botão de golpe.',

                    dicaTeclado:
                        'Agora use X ou ESPAÇO.',

                    concluido: () => {
                        return this.estado.ataqueRobo;
                    }
                },

                {
                    id: 'cristais',

                    titulo:
                        'COLETE OS CRISTAIS',

                    dicaMobile:
                        'Passe por todos os cristais azuis.',

                    dicaTeclado:
                        'Passe por todos os cristais azuis.',

                    concluido: () => {
                        return (
                            this.estado.cristais
                            >= this.totalCristais
                        );
                    }
                }
            ];

            this.container = null;
            this.textoEtapa = null;
            this.textoObjetivo = null;
            this.textoDica = null;

            this.barras = [];

            this.toastFundo = null;
            this.toastTexto = null;

            this.eventoAvanco = null;
            this.eventoToast = null;
            this.eventoFinal = null;

            this.revisaoToast = 0;
        }

        iniciar() {
            if (!this.ativo) {
                return;
            }

            this.criarHUD();

            this.ultimaPosicaoX = (
                this.scene.player
                ? this.scene.player.x
                : null
            );

            this.atualizarHUD();

            this.scene.events.once(
                Phaser.Scenes.Events.SHUTDOWN,
                () => {
                    this.destruir();
                }
            );

            window.__MIGUEL_TUTORIAL__ = {
                snapshot: () => {
                    return this.obterEstado();
                },

                mostrarDica: (mensagem) => {
                    this.mostrarDicaTemporaria(
                        mensagem
                    );
                }
            };

            console.info(
                '[TUTORIAL]',
                'iniciado',
                this.obterEstado()
            );
        }

        criarHUD() {
            this.container = (
                this.scene.add.container(
                    400,
                    78
                )
            );

            this.container
                .setDepth(900)
                .setScrollFactor(0);

            const painel = (
                this.scene.add.rectangle(
                    0,
                    0,
                    500,
                    94,
                    0x08111f,
                    0.94
                )
            );

            painel.setStrokeStyle(
                3,
                0x00d9ff,
                0.9
            );

            this.textoEtapa = (
                this.scene.add.text(
                    -232,
                    -36,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '14px',

                        color:
                            '#8fe9ff',

                        fontStyle:
                            'bold'
                    }
                )
            );

            this.textoObjetivo = (
                this.scene.add.text(
                    0,
                    -11,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '20px',

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
                    0,
                    15,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '12px',

                        color:
                            '#ffffff',

                        align:
                            'center'
                    }
                )
            ).setOrigin(0.5);

            this.container.add([
                painel,
                this.textoEtapa,
                this.textoObjetivo,
                this.textoDica
            ]);

            const larguraBarra = 72;
            const espacamento = 8;

            const larguraTotal = (
                this.objetivos.length
                * larguraBarra
                + (
                    this.objetivos.length - 1
                )
                * espacamento
            );

            const inicioX = (
                -larguraTotal / 2
                + larguraBarra / 2
            );

            this.objetivos.forEach(
                (objetivo, indice) => {
                    const barra = (
                        this.scene.add.rectangle(
                            inicioX
                            + indice
                            * (
                                larguraBarra
                                + espacamento
                            ),

                            36,

                            larguraBarra,
                            7,

                            0x29405a,
                            1
                        )
                    );

                    this.barras.push(barra);
                    this.container.add(barra);
                }
            );

            this.toastFundo = (
                this.scene.add.rectangle(
                    400,
                    176,
                    430,
                    54,
                    0x062b23,
                    0.96
                )
            );

            this.toastFundo
                .setDepth(920)
                .setScrollFactor(0)
                .setVisible(false)
                .setStrokeStyle(
                    3,
                    0x28ff9b,
                    1
                );

            this.toastTexto = (
                this.scene.add.text(
                    400,
                    176,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '17px',

                        color:
                            '#ffffff',

                        fontStyle:
                            'bold',

                        align:
                            'center',

                        wordWrap: {
                            width: 390
                        }
                    }
                )
            );

            this.toastTexto
                .setOrigin(0.5)
                .setDepth(921)
                .setScrollFactor(0)
                .setVisible(false);
        }

        registrarMovimento(x) {
            if (
                !this.ativo
                || this.concluido
                || !Number.isFinite(x)
            ) {
                return;
            }

            if (
                !Number.isFinite(
                    this.ultimaPosicaoX
                )
            ) {
                this.ultimaPosicaoX = x;
                return;
            }

            const delta = Math.abs(
                x - this.ultimaPosicaoX
            );

            this.ultimaPosicaoX = x;

            // Ignora teletransportes ou correções
            // abruptas do corpo físico.
            if (
                delta <= 0
                || delta > 70
            ) {
                return;
            }

            this.estado.distanciaMovida = (
                Math.min(
                    300,
                    this.estado.distanciaMovida
                    + delta
                )
            );

            this.avaliarObjetivoAtual();
        }

        registrarAcao(
            tipo,
            dados = {}
        ) {
            if (
                !this.ativo
                || this.concluido
            ) {
                return;
            }

            switch (tipo) {
                case 'pulo':
                    this.estado.pulo = true;
                    break;

                case 'pulo-duplo':
                    this.estado.puloDuplo = true;
                    break;

                case 'dano-robo':
                    this.estado.danoRobo = true;
                    break;

                case 'ataque-robo':
                    this.estado.ataqueRobo = true;
                    break;

                case 'cristal':
                    this.estado.cristais = Math.min(
                        this.totalCristais,
                        this.estado.cristais + 1
                    );
                    break;

                default:
                    console.debug(
                        '[TUTORIAL]',
                        'ação ignorada',
                        tipo,
                        dados
                    );
                    return;
            }

            console.info(
                '[TUTORIAL]',
                tipo,
                this.obterEstado()
            );

            this.avaliarObjetivoAtual();
        }

        avaliarObjetivoAtual() {
            if (
                !this.ativo
                || this.concluido
                || this.avancoAgendado
            ) {
                return;
            }

            const objetivo = (
                this.objetivos[
                    this.indiceAtual
                ]
            );

            if (
                objetivo
                && objetivo.concluido()
            ) {
                this.concluirObjetivo(
                    objetivo
                );
            }
        }

        concluirObjetivo(objetivo) {
            if (
                this.avancoAgendado
                || this.concluido
            ) {
                return;
            }

            this.avancoAgendado = true;

            const barra = (
                this.barras[
                    this.indiceAtual
                ]
            );

            if (barra) {
                barra.setFillStyle(
                    0x28ff9b,
                    1
                );
            }

            this.mostrarFeedback(
                `✓ ${objetivo.titulo}`
            );

            this.eventoAvanco = (
                this.scene.time.delayedCall(
                    650,
                    () => {
                        if (!this.ativo) {
                            return;
                        }

                        this.indiceAtual += 1;
                        this.avancoAgendado = false;

                        if (
                            this.indiceAtual
                            >= this.objetivos.length
                        ) {
                            this.finalizar();
                            return;
                        }

                        this.atualizarHUD();

                        // Uma ação pode ter ocorrido antes
                        // de a instrução correspondente.
                        this.avaliarObjetivoAtual();
                    }
                )
            );
        }

        finalizar() {
            if (
                this.concluido
                || !this.ativo
            ) {
                return;
            }

            this.concluido = true;
            this.avancoAgendado = false;

            this.barras.forEach((barra) => {
                barra.setFillStyle(
                    0x28ff9b,
                    1
                );
            });

            this.textoEtapa.setText(
                `TREINAMENTO ${
                    this.objetivos.length
                }/${this.objetivos.length}`
            );

            this.textoObjetivo.setText(
                'TREINAMENTO CONCLUÍDO!'
            );

            this.textoDica.setText(
                'Preparando o resultado da fase...'
            );

            this.mostrarFeedback(
                '★ TODOS OS OBJETIVOS CONCLUÍDOS ★',
                900
            );

            console.info(
                '[TUTORIAL]',
                'concluído',
                this.obterEstado()
            );

            this.eventoFinal = (
                this.scene.time.delayedCall(
                    950,
                    () => {
                        if (!this.ativo) {
                            return;
                        }

                        this.onComplete(
                            this.obterEstado()
                        );
                    }
                )
            );
        }

        atualizarHUD() {
            if (
                !this.ativo
                || this.concluido
            ) {
                return;
            }

            const objetivo = (
                this.objetivos[
                    this.indiceAtual
                ]
            );

            if (!objetivo) {
                return;
            }

            this.textoEtapa.setText(
                `TREINAMENTO ${
                    this.indiceAtual + 1
                }/${this.objetivos.length}`
            );

            this.textoObjetivo.setText(
                objetivo.titulo
            );

            this.textoDica.setText(
                this.mobile
                    ? objetivo.dicaMobile
                    : objetivo.dicaTeclado
            );

            this.barras.forEach(
                (barra, indice) => {
                    if (indice < this.indiceAtual) {
                        barra.setFillStyle(
                            0x28ff9b,
                            1
                        );
                    } else if (
                        indice === this.indiceAtual
                    ) {
                        barra.setFillStyle(
                            0xffcc00,
                            1
                        );
                    } else {
                        barra.setFillStyle(
                            0x29405a,
                            1
                        );
                    }
                }
            );
        }

        mostrarFeedback(
            mensagem,
            duracao = 650
        ) {
            if (!this.ativo) {
                return;
            }

            this.revisaoToast += 1;

            const revisao = this.revisaoToast;

            if (this.eventoToast) {
                this.eventoToast.remove(false);
                this.eventoToast = null;
            }

            this.toastTexto.setText(
                mensagem
            );

            this.toastFundo.setVisible(true);
            this.toastTexto.setVisible(true);

            this.eventoToast = (
                this.scene.time.delayedCall(
                    duracao,
                    () => {
                        if (
                            !this.ativo
                            || revisao
                                !== this.revisaoToast
                        ) {
                            return;
                        }

                        this.toastFundo
                            .setVisible(false);

                        this.toastTexto
                            .setVisible(false);
                    }
                )
            );
        }

        mostrarDicaTemporaria(mensagem) {
            this.mostrarFeedback(
                mensagem,
                1200
            );
        }

        podeDerrotarRobo() {
            return Boolean(
                this.estado.danoRobo
            );
        }

        podeConcluirFase() {
            return this.concluido;
        }

        obterEstado() {
            const objetivo = (
                this.objetivos[
                    this.indiceAtual
                ]
            );

            return {
                ativo: this.ativo,
                concluido: this.concluido,

                etapa: Math.min(
                    this.indiceAtual + 1,
                    this.objetivos.length
                ),

                totalEtapas:
                    this.objetivos.length,

                objetivoAtual:
                    objetivo
                    ? objetivo.id
                    : null,

                totalCristais:
                    this.totalCristais,

                estado: {
                    ...this.estado,

                    distanciaMovida:
                        Math.round(
                            this.estado
                                .distanciaMovida
                        )
                }
            };
        }

        destruir() {
            if (!this.ativo) {
                return;
            }

            this.ativo = false;

            [
                this.eventoAvanco,
                this.eventoToast,
                this.eventoFinal
            ].forEach((evento) => {
                if (
                    evento
                    && typeof evento.remove
                        === 'function'
                ) {
                    evento.remove(false);
                }
            });

            if (
                this.container
                && this.container.active
            ) {
                this.container.destroy(true);
            }

            if (
                this.toastFundo
                && this.toastFundo.active
            ) {
                this.toastFundo.destroy();
            }

            if (
                this.toastTexto
                && this.toastTexto.active
            ) {
                this.toastTexto.destroy();
            }

            if (
                window.__MIGUEL_TUTORIAL__
            ) {
                delete window.__MIGUEL_TUTORIAL__;
            }
        }
    }

    window.MiguelTutorialManager = (
        MiguelTutorialManager
    );
})();
