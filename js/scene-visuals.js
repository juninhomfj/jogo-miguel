(() => {
    class MiguelSceneVisuals {
        constructor(
            scene,
            options = {}
        ) {
            this.scene = scene;

            this.tipo = String(
                options.tipo || 'tutorial'
            );

            this.gerenciadorConfiguracoes = (
                window.MIGUEL_SETTINGS_MANAGER
                || null
            );

            this.fatorQualidade = (
                this.gerenciadorConfiguracoes
                ? this.gerenciadorConfiguracoes
                    .obterFatorVisual()
                : 0.8
            );

            this.objetos = [];
            this.estrelas = [];
            this.nuvens = [];
            this.particulas = [];
            this.camadasParalaxe = [];

            this.tweens = [];

            this.ativo = true;
            this.destruido = false;

            this.tempo = 0;

            this.scene.events.once(
                Phaser.Scenes.Events.SHUTDOWN,
                () => {
                    this.destruir();
                }
            );
        }

        adicionar(
            objeto,
            profundidade = 0
        ) {
            objeto.setDepth(
                profundidade
            );

            this.objetos.push(
                objeto
            );

            return objeto;
        }

        criarMenu() {
            this.criarCeu({
                estrelas: 54,
                luaX: 690,
                luaY: 105
            });

            this.criarMontanhas();
            this.criarCidade();
            this.criarNuvens(4);

            const brilhoHeroi = (
                this.adicionar(
                    this.scene.add.circle(
                        162,
                        326,
                        105,
                        0x00d9ff,
                        0.08
                    ),
                    4
                )
            );

            brilhoHeroi.setStrokeStyle(
                3,
                0x00d9ff,
                0.18
            );

            const brilhoInterno = (
                this.adicionar(
                    this.scene.add.circle(
                        162,
                        326,
                        74,
                        0xffcc00,
                        0.06
                    ),
                    5
                )
            );

            const miguel = (
                this.adicionar(
                    this.scene.add.image(
                        162,
                        325,
                        'miguel_idle'
                    ),
                    8
                )
            );

            miguel.setScale(1.02);

            const tweenMiguel = (
                this.scene.tweens.add({
                    targets: miguel,

                    y: {
                        from: 325,
                        to: 316
                    },

                    angle: {
                        from: -1,
                        to: 1
                    },

                    duration: 1450,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                })
            );

            const tweenBrilho = (
                this.scene.tweens.add({
                    targets: [
                        brilhoHeroi,
                        brilhoInterno
                    ],

                    scaleX: {
                        from: 0.94,
                        to: 1.08
                    },

                    scaleY: {
                        from: 0.94,
                        to: 1.08
                    },

                    alpha: {
                        from: 0.65,
                        to: 1
                    },

                    duration: 1250,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                })
            );

            this.tweens.push(
                tweenMiguel,
                tweenBrilho
            );

            const sombraTitulo = (
                this.adicionar(
                    this.scene.add.text(
                        492,
                        75,
                        'AS AVENTURAS DO',
                        {
                            fontFamily:
                                'Courier New',

                            fontSize:
                                '25px',

                            color:
                                '#08111f',

                            fontStyle:
                                'bold',

                            stroke:
                                '#08111f',

                            strokeThickness:
                                7,

                            letterSpacing:
                                2
                        }
                    ),
                    8
                )
            );

            sombraTitulo.setOrigin(0.5);

            const tituloSuperior = (
                this.adicionar(
                    this.scene.add.text(
                        490,
                        71,
                        'AS AVENTURAS DO',
                        {
                            fontFamily:
                                'Courier New',

                            fontSize:
                                '25px',

                            color:
                                '#8fe9ff',

                            fontStyle:
                                'bold',

                            stroke:
                                '#123247',

                            strokeThickness:
                                4,

                            letterSpacing:
                                2
                        }
                    ),
                    9
                )
            );

            tituloSuperior.setOrigin(0.5);

            const tituloMiguelSombra = (
                this.adicionar(
                    this.scene.add.text(
                        492,
                        131,
                        'MIGUEL',
                        {
                            fontFamily:
                                'Courier New',

                            fontSize:
                                '61px',

                            color:
                                '#08111f',

                            fontStyle:
                                'bold',

                            stroke:
                                '#08111f',

                            strokeThickness:
                                10,

                            letterSpacing:
                                4
                        }
                    ),
                    8
                )
            );

            tituloMiguelSombra.setOrigin(0.5);

            const tituloMiguel = (
                this.adicionar(
                    this.scene.add.text(
                        488,
                        125,
                        'MIGUEL',
                        {
                            fontFamily:
                                'Courier New',

                            fontSize:
                                '61px',

                            color:
                                '#ffcc00',

                            fontStyle:
                                'bold',

                            stroke:
                                '#9b2800',

                            strokeThickness:
                                6,

                            letterSpacing:
                                4
                        }
                    ),
                    10
                )
            );

            tituloMiguel.setOrigin(0.5);

            const subtitulo = (
                this.adicionar(
                    this.scene.add.text(
                        494,
                        183,
                        'UMA AVENTURA DE HERÓI',
                        {
                            fontFamily:
                                'Courier New',

                            fontSize:
                                '15px',

                            color:
                                '#ffffff',

                            fontStyle:
                                'bold',

                            letterSpacing:
                                1
                        }
                    ),
                    10
                )
            );

            subtitulo.setOrigin(0.5);

            const painel = (
                this.adicionar(
                    this.scene.add.rectangle(
                        494,
                        330,
                        390,
                        210,
                        0x081624,
                        0.48
                    ),
                    3
                )
            );

            painel.setStrokeStyle(
                2,
                0x35d9ff,
                0.22
            );

            this.criarParticulas(
                15,
                {
                    profundidade: 3,
                    areaInferior: 570
                }
            );

            return this;
        }

        criarTutorial() {
            this.criarCeu({
                estrelas: 48,
                luaX: 700,
                luaY: 148
            });

            this.criarMontanhas();
            this.criarCidade();
            this.criarNuvens(5);

            const subsolo = (
                this.adicionar(
                    this.scene.add.rectangle(
                        400,
                        535,
                        800,
                        150,
                        0x071a20,
                        1
                    ),
                    -8
                )
            );

            subsolo.setStrokeStyle(
                2,
                0x1b5860,
                0.34
            );

            for (
                let x = 20;
                x < 800;
                x += 42
            ) {
                const detalhe = (
                    this.adicionar(
                        this.scene.add.rectangle(
                            x,
                            505
                            + (
                                (
                                    x / 42
                                ) % 2
                                ? 17
                                : 0
                            ),

                            18,
                            42,

                            0x12343a,
                            0.52
                        ),
                        -7
                    )
                );

                detalhe.setAngle(
                    x % 84 === 0
                    ? 12
                    : -12
                );
            }

            this.criarParticulas(
                20,
                {
                    profundidade: -4,
                    areaInferior: 455
                }
            );

            const placa = (
                this.adicionar(
                    this.scene.add.rectangle(
                        400,
                        166,
                        250,
                        28,
                        0x07111f,
                        0.62
                    ),
                    -1
                )
            );

            placa.setStrokeStyle(
                1,
                0x35d9ff,
                0.36
            );

            const textoPlaca = (
                this.adicionar(
                    this.scene.add.text(
                        400,
                        166,
                        'ÁREA DE TREINAMENTO',
                        {
                            fontFamily:
                                'Courier New',

                            fontSize:
                                '12px',

                            color:
                                '#8fe9ff',

                            fontStyle:
                                'bold',

                            letterSpacing:
                                1
                        }
                    ),
                    0
                )
            );

            textoPlaca.setOrigin(0.5);

            return this;
        }

        criarCeu(opcoes = {}) {
            const cores = [
                0x06101e,
                0x0a1930,
                0x102642,
                0x173851,
                0x1a4655,
                0x1b5158
            ];

            cores.forEach(
                (cor, indice) => {
                    this.adicionar(
                        this.scene.add.rectangle(
                            400,
                            50 + indice * 100,
                            800,
                            102,
                            cor,
                            1
                        ),
                        -120 + indice
                    );
                }
            );

            const quantidade = Math.max(
                12,
                Math.round(
                    Number(
                        opcoes.estrelas || 45
                    )
                    * this.fatorQualidade
                )
            );

            for (
                let indice = 0;
                indice < quantidade;
                indice += 1
            ) {
                const raio = (
                    indice % 9 === 0
                    ? 2.2
                    : (
                        indice % 4 === 0
                        ? 1.5
                        : 1
                    )
                );

                const estrela = (
                    this.adicionar(
                        this.scene.add.circle(
                            Phaser.Math.Between(
                                12,
                                788
                            ),

                            Phaser.Math.Between(
                                14,
                                330
                            ),

                            raio,

                            indice % 7 === 0
                            ? 0x8fe9ff
                            : 0xffffff,

                            Phaser.Math.FloatBetween(
                                0.28,
                                0.92
                            )
                        ),
                        -108
                    )
                );

                estrela.baseAlpha =
                    estrela.alpha;

                estrela.faseBrilho =
                    Phaser.Math.FloatBetween(
                        0,
                        Math.PI * 2
                    );

                estrela.velocidadeBrilho =
                    Phaser.Math.FloatBetween(
                        0.0014,
                        0.0034
                    );

                this.estrelas.push(
                    estrela
                );
            }

            const luaX = Number(
                opcoes.luaX || 690
            );

            const luaY = Number(
                opcoes.luaY || 120
            );

            this.adicionar(
                this.scene.add.circle(
                    luaX,
                    luaY,
                    76,
                    0x8fe9ff,
                    0.04
                ),
                -104
            );

            this.adicionar(
                this.scene.add.circle(
                    luaX,
                    luaY,
                    58,
                    0x8fe9ff,
                    0.07
                ),
                -103
            );

            this.adicionar(
                this.scene.add.circle(
                    luaX,
                    luaY,
                    39,
                    0xffedb2,
                    0.94
                ),
                -102
            );

            this.adicionar(
                this.scene.add.circle(
                    luaX - 12,
                    luaY - 8,
                    7,
                    0xd5c995,
                    0.38
                ),
                -101
            );

            this.adicionar(
                this.scene.add.circle(
                    luaX + 13,
                    luaY + 11,
                    5,
                    0xd5c995,
                    0.32
                ),
                -101
            );
        }

        criarMontanhas() {
            const fundo = (
                this.adicionar(
                    this.scene.add.graphics(),
                    -90
                )
            );

            fundo.fillStyle(
                0x10283b,
                1
            );

            fundo.fillTriangle(
                -80,
                450,
                150,
                245,
                330,
                450
            );

            fundo.fillTriangle(
                150,
                450,
                390,
                218,
                590,
                450
            );

            fundo.fillTriangle(
                420,
                450,
                690,
                260,
                880,
                450
            );

            fundo.fillStyle(
                0x17384a,
                1
            );

            fundo.fillTriangle(
                -100,
                470,
                90,
                320,
                260,
                470
            );

            fundo.fillTriangle(
                180,
                470,
                490,
                292,
                720,
                470
            );

            fundo.fillTriangle(
                560,
                470,
                790,
                325,
                930,
                470
            );

            fundo.baseX = 0;
            fundo.fatorParalaxe = 0.012;

            this.camadasParalaxe.push(
                fundo
            );
        }

        criarCidade() {
            const cidade = (
                this.adicionar(
                    this.scene.add.container(
                        0,
                        0
                    ),
                    -70
                )
            );

            for (
                let x = 0;
                x < 830;
                x += 38
            ) {
                const altura = (
                    38
                    + (
                        (
                            x * 17
                        ) % 72
                    )
                );

                const predio = (
                    this.scene.add.rectangle(
                        x,
                        442 - altura / 2,
                        30,
                        altura,
                        0x0a202d,
                        0.92
                    )
                );

                cidade.add(predio);

                for (
                    let y = 0;
                    y < altura - 12;
                    y += 18
                ) {
                    if (
                        (
                            x + y
                        ) % 3 === 0
                    ) {
                        cidade.add(
                            this.scene.add.rectangle(
                                x - 7,
                                420 - y,
                                4,
                                5,
                                0x35d9ff,
                                0.34
                            )
                        );
                    }
                }
            }

            cidade.baseX = 0;
            cidade.fatorParalaxe = 0.025;

            this.camadasParalaxe.push(
                cidade
            );
        }

        criarNuvens(quantidade) {
            quantidade = Math.max(
                2,
                Math.round(
                    Number(quantidade || 2)
                    * this.fatorQualidade
                )
            );

            for (
                let indice = 0;
                indice < quantidade;
                indice += 1
            ) {
                const x = (
                    80
                    + indice * (
                        760 / Math.max(
                            1,
                            quantidade - 1
                        )
                    )
                );

                const y = (
                    105
                    + (
                        indice % 3
                    ) * 58
                );

                const nuvem = (
                    this.adicionar(
                        this.scene.add.container(
                            x,
                            y
                        ),
                        -82
                    )
                );

                const cor = (
                    indice % 2 === 0
                    ? 0xdff8ff
                    : 0xb8dce8
                );

                nuvem.add(
                    this.scene.add.ellipse(
                        -30,
                        8,
                        62,
                        24,
                        cor,
                        0.28
                    )
                );

                nuvem.add(
                    this.scene.add.ellipse(
                        5,
                        0,
                        76,
                        31,
                        cor,
                        0.34
                    )
                );

                nuvem.add(
                    this.scene.add.ellipse(
                        40,
                        9,
                        54,
                        21,
                        cor,
                        0.25
                    )
                );

                nuvem.setScale(
                    0.72
                    + (
                        indice % 3
                    ) * 0.13
                );

                nuvem.velocidade = (
                    0.009
                    + indice * 0.002
                );

                nuvem.baseY = y;

                this.nuvens.push(
                    nuvem
                );
            }
        }

        criarParticulas(
            quantidade,
            opcoes = {}
        ) {
            quantidade = Math.max(
                4,
                Math.round(
                    Number(quantidade || 4)
                    * this.fatorQualidade
                )
            );

            for (
                let indice = 0;
                indice < quantidade;
                indice += 1
            ) {
                const particula = (
                    this.adicionar(
                        this.scene.add.rectangle(
                            Phaser.Math.Between(
                                15,
                                785
                            ),

                            Phaser.Math.Between(
                                190,
                                Number(
                                    opcoes
                                        .areaInferior
                                    || 570
                                )
                            ),

                            indice % 4 === 0
                            ? 3
                            : 2,

                            indice % 4 === 0
                            ? 3
                            : 2,

                            indice % 3 === 0
                            ? 0xffcc00
                            : 0x8fe9ff,

                            Phaser.Math.FloatBetween(
                                0.18,
                                0.52
                            )
                        ),

                        Number(
                            opcoes.profundidade
                            || -5
                        )
                    )
                );

                particula.velocidadeY =
                    Phaser.Math.FloatBetween(
                        0.005,
                        0.018
                    );

                particula.oscilacao =
                    Phaser.Math.FloatBetween(
                        0.001,
                        0.004
                    );

                particula.fase =
                    Phaser.Math.FloatBetween(
                        0,
                        Math.PI * 2
                    );

                this.particulas.push(
                    particula
                );
            }
        }

        decorarPlataforma(
            plataforma,
            opcoes = {}
        ) {
            const tipo = (
                opcoes.tipo || 'flutuante'
            );

            plataforma.setFillStyle(
                tipo === 'chao'
                ? 0x16464a
                : 0x1b5061,

                1
            );

            plataforma.setStrokeStyle(
                3,
                tipo === 'chao'
                ? 0x35d9a0
                : 0x35d9ff,

                0.88
            );

            plataforma.setDepth(0);

            const topo = (
                this.adicionar(
                    this.scene.add.rectangle(
                        plataforma.x,
                        plataforma.y
                        - plataforma.height / 2
                        + 4,

                        plataforma.width - 6,
                        7,

                        tipo === 'chao'
                        ? 0x5ef2a8
                        : 0x8fe9ff,

                        0.94
                    ),
                    1
                )
            );

            topo.setStrokeStyle(
                1,
                0xffffff,
                0.38
            );

            const quantidade = Math.max(
                1,
                Math.floor(
                    plataforma.width / 34
                )
            );

            for (
                let indice = 0;
                indice < quantidade;
                indice += 1
            ) {
                const centroX = (
                    plataforma.x
                    - plataforma.width / 2
                    + 20
                    + indice * 34
                );

                this.adicionar(
                    this.scene.add.rectangle(
                        centroX,
                        plataforma.y + 5,
                        14,
                        5,
                        0x071a20,
                        0.48
                    ),
                    1
                );
            }

            return plataforma;
        }

        atualizar(
            tempo = 0,
            delta = 16.67,
            playerX = 400
        ) {
            if (
                !this.ativo
                || this.destruido
            ) {
                return;
            }

            this.tempo = tempo;

            this.estrelas.forEach(
                (estrela) => {
                    estrela.alpha = (
                        estrela.baseAlpha
                        * (
                            0.68
                            + 0.32
                            * (
                                Math.sin(
                                    tempo
                                    * estrela
                                        .velocidadeBrilho
                                    + estrela
                                        .faseBrilho
                                )
                                + 1
                            )
                            / 2
                        )
                    );
                }
            );

            this.nuvens.forEach(
                (nuvem) => {
                    nuvem.x -= (
                        nuvem.velocidade
                        * delta
                    );

                    nuvem.y = (
                        nuvem.baseY
                        + Math.sin(
                            tempo * 0.00045
                            + nuvem.baseY
                        ) * 2
                    );

                    if (nuvem.x < -125) {
                        nuvem.x = 925;
                    }
                }
            );

            this.particulas.forEach(
                (particula) => {
                    particula.y -= (
                        particula.velocidadeY
                        * delta
                    );

                    particula.x += (
                        Math.sin(
                            tempo
                            * particula.oscilacao
                            + particula.fase
                        )
                        * 0.08
                    );

                    if (particula.y < 145) {
                        particula.y = 575;
                        particula.x = (
                            Phaser.Math.Between(
                                15,
                                785
                            )
                        );
                    }
                }
            );

            const deslocamento = (
                Phaser.Math.Clamp(
                    Number(playerX || 400)
                    - 400,

                    -400,
                    400
                )
            );

            this.camadasParalaxe.forEach(
                (camada) => {
                    camada.x = (
                        camada.baseX
                        - deslocamento
                        * camada.fatorParalaxe
                    );
                }
            );
        }

        destruir() {
            if (this.destruido) {
                return;
            }

            this.destruido = true;
            this.ativo = false;

            this.tweens.forEach(
                (tween) => {
                    if (
                        tween
                        && typeof tween.stop
                            === 'function'
                    ) {
                        tween.stop();
                    }
                }
            );

            this.objetos.forEach(
                (objeto) => {
                    if (
                        objeto
                        && objeto.active
                        && typeof objeto.destroy
                            === 'function'
                    ) {
                        objeto.destroy();
                    }
                }
            );

            this.objetos = [];
            this.estrelas = [];
            this.nuvens = [];
            this.particulas = [];
            this.camadasParalaxe = [];
            this.tweens = [];
        }
    }

    window.MiguelSceneVisuals = (
        MiguelSceneVisuals
    );
})();
