(() => {
    class MiguelHealthManager {
        constructor(
            scene,
            player,
            options = {}
        ) {
            this.scene = scene;
            this.player = player;

            this.hudExterno = (
                options.hud || null
            );

            this.vidaMaxima = Math.max(
                1,
                Number(options.vidaMaxima || 100)
            );

            this.vida = this.vidaMaxima;

            this.vidasMaximas = Math.max(
                1,
                Number(options.vidas || 3)
            );

            this.vidas = this.vidasMaximas;

            this.duracaoInvulnerabilidade = Math.max(
                300,
                Number(
                    options
                        .duracaoInvulnerabilidade
                    || 1100
                )
            );

            this.respawn = {
                x: Number(
                    options.respawnX
                    ?? player.x
                ),

                y: Number(
                    options.respawnY
                    ?? player.y
                )
            };

            this.onDamage = (
                typeof options.onDamage
                    === 'function'
                ? options.onDamage
                : () => {}
            );

            this.onLifeLost = (
                typeof options.onLifeLost
                    === 'function'
                ? options.onLifeLost
                : () => {}
            );

            this.onRespawn = (
                typeof options.onRespawn
                    === 'function'
                ? options.onRespawn
                : () => {}
            );

            this.onGameOver = (
                typeof options.onGameOver
                    === 'function'
                ? options.onGameOver
                : () => {}
            );

            this.invulneravel = false;
            this.morto = false;
            this.destruido = false;

            this.eventoInvulnerabilidade = null;
            this.eventoDerrota = null;
            this.eventoRespawn = null;
            this.tweenPiscar = null;

            this.hud = null;
            this.textoVida = null;
            this.barraVida = null;
            this.textoVidas = null;
        }

        iniciar() {
            if (!this.hudExterno) {
                this.criarHUD();
            }

            this.atualizarHUD();

            this.scene.events.once(
                Phaser.Scenes.Events.SHUTDOWN,
                () => {
                    this.destruir();
                }
            );

            window.__MIGUEL_HEALTH__ = {
                snapshot: () => {
                    return this.obterEstado();
                },

                damage: (
                    quantidade = 10,
                    origem = 'debug'
                ) => {
                    return this.receberDano(
                        quantidade,
                        {
                            origem
                        }
                    );
                }
            };

            console.info(
                '[VIDA]',
                'sistema iniciado',
                this.obterEstado()
            );
        }

        criarHUD() {
            this.hud = this.scene.add.container(
                20,
                52
            );

            this.hud
                .setDepth(910)
                .setScrollFactor(0);

            this.textoVida = this.scene.add.text(
                0,
                0,
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
            );

            const fundoBarra = (
                this.scene.add.rectangle(
                    0,
                    20,
                    132,
                    16,
                    0x101820,
                    0.96
                )
            );

            fundoBarra
                .setOrigin(0, 0)
                .setStrokeStyle(
                    2,
                    0xffffff,
                    0.9
                );

            this.barraVida = (
                this.scene.add.rectangle(
                    3,
                    23,
                    126,
                    10,
                    0x28ff72,
                    1
                )
            );

            this.barraVida.setOrigin(0, 0);

            this.textoVidas = (
                this.scene.add.text(
                    0,
                    42,
                    '',
                    {
                        fontFamily:
                            'Courier New',

                        fontSize:
                            '18px',

                        color:
                            '#ff496c',

                        fontStyle:
                            'bold'
                    }
                )
            );

            this.hud.add([
                this.textoVida,
                fundoBarra,
                this.barraVida,
                this.textoVidas
            ]);
        }

        atualizarHUD() {
            if (
                this.hudExterno
                && typeof this.hudExterno
                    .atualizarVida === 'function'
            ) {
                this.hudExterno.atualizarVida(
                    this.obterEstado()
                );

                return;
            }

            if (
                !this.textoVida
                || !this.barraVida
                || !this.textoVidas
            ) {
                return;
            }

            this.textoVida.setText(
                `VIDA ${Math.ceil(this.vida)}`
                + `/${this.vidaMaxima}`
            );

            const proporcao = Phaser.Math.Clamp(
                this.vida / this.vidaMaxima,
                0,
                1
            );

            this.barraVida.displayWidth = (
                Math.max(
                    0.5,
                    126 * proporcao
                )
            );

            let cor = 0x28ff72;

            if (proporcao <= 0.25) {
                cor = 0xff334f;
            } else if (proporcao <= 0.55) {
                cor = 0xffcc00;
            }

            this.barraVida.setFillStyle(
                cor,
                1
            );

            this.textoVidas.setText(
                Array.from(
                    {
                        length: this.vidas
                    },
                    () => '♥'
                ).join(' ')
            );
        }

        receberDano(
            quantidade,
            contexto = {}
        ) {
            if (
                this.destruido
                || this.invulneravel
                || this.morto
                || !this.player
                || !this.player.active
            ) {
                return false;
            }

            const dano = Math.max(
                0,
                Number(quantidade || 0)
            );

            if (dano <= 0) {
                return false;
            }

            this.invulneravel = true;

            this.vida = Math.max(
                0,
                this.vida - dano
            );

            this.prepararPlayerParaDano(
                contexto
            );

            this.atualizarHUD();

            this.onDamage({
                dano,
                vida: this.vida,
                vidaMaxima: this.vidaMaxima,
                vidas: this.vidas,
                contexto
            });

            console.info(
                '[VIDA]',
                'dano recebido',
                {
                    dano,
                    ...this.obterEstado(),
                    contexto
                }
            );

            if (this.vida <= 0) {
                this.agendarPerdaDeVida(
                    contexto
                );
            } else {
                this.agendarFimDaInvulnerabilidade();
            }

            return true;
        }

        prepararPlayerParaDano(contexto) {
            if (
                typeof this.scene.cancelarGiroDuplo
                    === 'function'
            ) {
                this.scene.cancelarGiroDuplo();
            }

            if (
                typeof this.scene.cancelarPoeira
                    === 'function'
            ) {
                this.scene.cancelarPoeira();
            }

            this.scene.tweens.killTweensOf(
                this.player
            );

            this.player.off(
                'animationcomplete-attack'
            );

            this.player.estaAtacando = false;
            this.player.estaMachucado = true;
            this.player.giroDuploAtivo = false;
            this.player.estaEmPoeira = false;

            this.player
                .setVisible(true)
                .setAlpha(1)
                .setAngle(0)
                .setTexture('miguel_hurt')
                .setTint(0xffa0a0);

            const direcao = Number(
                contexto.direcao
                ?? (
                    this.player.flipX
                    ? 1
                    : -1
                )
            );

            const impulsoX = Math.max(
                120,
                Number(
                    contexto.impulsoX || 280
                )
            );

            const impulsoY = Number(
                contexto.impulsoY ?? -220
            );

            if (this.player.body) {
                this.player.setVelocity(
                    impulsoX
                    * (
                        direcao >= 0
                        ? 1
                        : -1
                    ),

                    impulsoY
                );
            }

            this.tweenPiscar = (
                this.scene.tweens.add({
                    targets: this.player,

                    alpha: {
                        from: 1,
                        to: 0.3
                    },

                    duration: 90,
                    yoyo: true,
                    repeat: 5
                })
            );
        }

        agendarFimDaInvulnerabilidade() {
            this.removerEvento(
                this.eventoInvulnerabilidade
            );

            this.eventoInvulnerabilidade = (
                this.scene.time.delayedCall(
                    this.duracaoInvulnerabilidade,
                    () => {
                        this.encerrarInvulnerabilidade();
                    }
                )
            );
        }

        encerrarInvulnerabilidade() {
            if (
                this.destruido
                || this.morto
                || !this.player
            ) {
                return;
            }

            this.invulneravel = false;
            this.player.estaMachucado = false;

            this.player
                .setAlpha(1)
                .clearTint();

            const noChao = Boolean(
                this.player.body
                && (
                    this.player.body.blocked.down
                    || this.player.body.touching.down
                )
            );

            this.player.anims.play(
                noChao
                ? 'idle'
                : 'jump',
                true
            );
        }

        agendarPerdaDeVida(contexto) {
            this.morto = true;

            this.removerEvento(
                this.eventoInvulnerabilidade
            );

            this.eventoDerrota = (
                this.scene.time.delayedCall(
                    520,
                    () => {
                        if (this.destruido) {
                            return;
                        }

                        this.vidas = Math.max(
                            0,
                            this.vidas - 1
                        );

                        this.atualizarHUD();

                        if (this.player.body) {
                            this.player.body.enable = false;
                        }

                        this.player
                            .setVelocity(0, 0)
                            .setAlpha(1)
                            .clearTint();

                        this.onLifeLost({
                            vidas: this.vidas,
                            contexto
                        });

                        if (this.vidas <= 0) {
                            this.onGameOver({
                                contexto,
                                estado:
                                    this.obterEstado()
                            });

                            return;
                        }

                        this.eventoRespawn = (
                            this.scene.time.delayedCall(
                                650,
                                () => {
                                    this.respawnPlayer();
                                }
                            )
                        );
                    }
                )
            );
        }

        respawnPlayer() {
            if (
                this.destruido
                || !this.player
            ) {
                return;
            }

            this.vida = this.vidaMaxima;
            this.morto = false;
            this.invulneravel = true;

            this.player.estaMachucado = false;
            this.player.estaAtacando = false;
            this.player.giroDuploAtivo = false;
            this.player.estaEmPoeira = false;
            this.player.pulosDisponiveis = 2;

            if (this.player.body) {
                this.player.body.enable = true;

                this.player.body.reset(
                    this.respawn.x,
                    this.respawn.y
                );
            } else {
                this.player.setPosition(
                    this.respawn.x,
                    this.respawn.y
                );
            }

            this.player
                .setVisible(true)
                .setAlpha(1)
                .setAngle(0)
                .clearTint()
                .setTexture('miguel_idle')
                .setVelocity(0, 0);

            this.atualizarHUD();

            this.tweenPiscar = (
                this.scene.tweens.add({
                    targets: this.player,
                    alpha: {
                        from: 1,
                        to: 0.35
                    },
                    duration: 100,
                    yoyo: true,
                    repeat: 4
                })
            );

            this.eventoInvulnerabilidade = (
                this.scene.time.delayedCall(
                    950,
                    () => {
                        this.encerrarInvulnerabilidade();
                    }
                )
            );

            this.onRespawn(
                this.obterEstado()
            );
        }

        removerEvento(evento) {
            if (
                evento
                && typeof evento.remove
                    === 'function'
            ) {
                evento.remove(false);
            }
        }

        obterEstado() {
            return {
                vida: this.vida,
                vidaMaxima: this.vidaMaxima,
                vidas: this.vidas,
                vidasMaximas:
                    this.vidasMaximas,
                invulneravel:
                    this.invulneravel,
                morto: this.morto
            };
        }

        destruir() {
            if (this.destruido) {
                return;
            }

            this.destruido = true;

            [
                this.eventoInvulnerabilidade,
                this.eventoDerrota,
                this.eventoRespawn
            ].forEach((evento) => {
                this.removerEvento(evento);
            });

            if (this.tweenPiscar) {
                this.tweenPiscar.stop();
            }

            if (
                this.hud
                && this.hud.active
            ) {
                this.hud.destroy(true);
            }

            if (
                window.__MIGUEL_HEALTH__
            ) {
                delete window.__MIGUEL_HEALTH__;
            }
        }
    }

    window.MiguelHealthManager = (
        MiguelHealthManager
    );
})();
