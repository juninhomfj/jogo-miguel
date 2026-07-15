from pathlib import Path

path = Path(
    "integration-preview/"
    "miguel-frame-lab.html"
)

texto = path.read_text(encoding="utf-8")


def substituir(antes, depois, nome):
    global texto

    quantidade = texto.count(antes)

    if quantidade != 1:
        raise SystemExit(
            f"ERRO: {nome}: esperado 1 trecho, "
            f"encontrados {quantidade}."
        )

    texto = texto.replace(
        antes,
        depois,
        1,
    )


substituir(
"""            groundTop: 470
        };""",
"""            groundTop: 470,

            // Centro visual real do frame de pulo duplo.
            // Bbox aprovado: (81, 126, 174, 200).
            doubleJumpPivotX: 127.5,
            doubleJumpPivotY: 163,

            doubleJumpDuration: 520,
            doubleJumpDegrees: 540,
            doubleJumpTrailDelay: 65
        };""",
"configuração do pulo duplo",
)

substituir(
"""                    trocasTextura: 0,
                    ultimaTextura: null
                };""",
"""                    trocasTextura: 0,
                    ultimaTextura: null,

                    giroDuploAtivo: false,
                    giroDuploIniciadoEm: 0,
                    girosCompletos: 0
                };""",
"estado do pulo duplo",
)

substituir(
"""                this.physics.add.collider(
                    this.player,
                    this.chaoVisual
                );
            }""",
"""                this.physics.add.collider(
                    this.player,
                    this.chaoVisual
                );

                // A camada visual gira separadamente.
                // O corpo físico do jogador permanece reto.
                this.doubleJumpVisual = this.add.image(
                    0,
                    0,
                    TEXTURAS_MIGUEL.doubleJump
                );

                this.doubleJumpVisual.setOrigin(
                    (
                        CONFIG_MIGUEL.doubleJumpPivotX
                        / CONFIG_MIGUEL.canvasWidth
                    ),
                    (
                        CONFIG_MIGUEL.doubleJumpPivotY
                        / CONFIG_MIGUEL.canvasHeight
                    )
                );

                this.doubleJumpVisual.setScale(
                    CONFIG_MIGUEL.scale
                );

                this.doubleJumpVisual.setDepth(11);
                this.doubleJumpVisual.setVisible(false);

                this.tweenGiroDuplo = null;
                this.tweenPulsoDuplo = null;
                this.eventoRastroDuplo = null;
            }""",
"camada visual do pulo duplo",
)

substituir(
"""                        'Pular: ↑ ou W | Segundo toque: pulo duplo',""",
"""                        'Pular: ↑ ou W | 2º toque: cambalhota 1,5x',""",
"texto de ajuda",
)

substituir(
"""                    playIdle: () => {
                        this.estado.bloqueado = false;
                        this.estado.vitoria = false;
                        this.mudarParaIdle();
                    }
                };""",
"""                    playIdle: () => {
                        this.estado.bloqueado = false;
                        this.estado.vitoria = false;
                        this.cancelarGiroDuplo(true);
                        this.mudarParaIdle();
                    },

                    playDoubleJump: () => {
                        this.estado.bloqueado = false;
                        this.estado.vitoria = false;
                        this.estado.pulosDisponiveis = 0;
                        this.player.setVelocityY(-470);
                        this.iniciarGiroDuplo();
                    },

                    cancelDoubleJump: () => {
                        this.cancelarGiroDuplo(true);
                        this.mudarParaIdle();
                    }
                };""",
"API de diagnóstico",
)

metodos = r"""
            sincronizarVisualPuloDuplo() {
                if (
                    !this.doubleJumpVisual
                    || !this.doubleJumpVisual.visible
                ) {
                    return;
                }

                const escala = CONFIG_MIGUEL.scale;

                const deslocamentoX = (
                    (
                        CONFIG_MIGUEL.doubleJumpPivotX
                        - (
                            CONFIG_MIGUEL.canvasWidth / 2
                        )
                    )
                    * escala
                );

                const deslocamentoY = (
                    (
                        CONFIG_MIGUEL.doubleJumpPivotY
                        - (
                            CONFIG_MIGUEL.canvasHeight / 2
                        )
                    )
                    * escala
                );

                this.doubleJumpVisual.setPosition(
                    this.player.x + deslocamentoX,
                    this.player.y + deslocamentoY
                );

                this.doubleJumpVisual.setFlipX(
                    this.player.flipX
                );
            }

            criarRastroPuloDuplo() {
                if (
                    !this.estado.giroDuploAtivo
                    || !this.doubleJumpVisual.visible
                ) {
                    return;
                }

                const rastro = this.add.image(
                    this.doubleJumpVisual.x,
                    this.doubleJumpVisual.y,
                    TEXTURAS_MIGUEL.doubleJump
                );

                rastro.setOrigin(
                    this.doubleJumpVisual.originX,
                    this.doubleJumpVisual.originY
                );

                rastro.setScale(
                    this.doubleJumpVisual.scaleX,
                    this.doubleJumpVisual.scaleY
                );

                rastro.setFlipX(
                    this.doubleJumpVisual.flipX
                );

                rastro.setAngle(
                    this.doubleJumpVisual.angle
                );

                rastro.setAlpha(0.28);
                rastro.setDepth(9);

                this.tweens.add({
                    targets: rastro,

                    alpha: 0,

                    scaleX: (
                        this.doubleJumpVisual.scaleX
                        * 1.06
                    ),

                    scaleY: (
                        this.doubleJumpVisual.scaleY
                        * 1.06
                    ),

                    duration: 190,
                    ease: 'Quad.easeOut',

                    onComplete: () => {
                        rastro.destroy();
                    }
                });
            }

            cancelarGiroDuplo(
                manterTextura = false
            ) {
                const estavaAtivo = Boolean(
                    this.estado
                    && this.estado.giroDuploAtivo
                );

                if (this.tweenGiroDuplo) {
                    this.tweenGiroDuplo.stop();
                    this.tweenGiroDuplo = null;
                }

                if (this.tweenPulsoDuplo) {
                    this.tweenPulsoDuplo.stop();
                    this.tweenPulsoDuplo = null;
                }

                if (this.eventoRastroDuplo) {
                    this.eventoRastroDuplo.remove(false);
                    this.eventoRastroDuplo = null;
                }

                if (this.doubleJumpVisual) {
                    this.doubleJumpVisual.setVisible(false);
                    this.doubleJumpVisual.setAngle(0);
                    this.doubleJumpVisual.setAlpha(1);

                    this.doubleJumpVisual.setScale(
                        CONFIG_MIGUEL.scale
                    );
                }

                if (this.player) {
                    this.player.setVisible(true);
                    this.player.setAngle(0);

                    this.player.setScale(
                        CONFIG_MIGUEL.scale
                    );
                }

                if (this.estado) {
                    this.estado.giroDuploAtivo = false;
                    this.estado.giroDuploIniciadoEm = 0;
                }

                if (
                    estavaAtivo
                    && !manterTextura
                    && this.player
                ) {
                    this.definirTextura(
                        TEXTURAS_MIGUEL.jump
                    );
                }
            }

            iniciarGiroDuplo() {
                this.cancelarGiroDuplo(true);

                this.estado.giroDuploAtivo = true;
                this.estado.giroDuploIniciadoEm = (
                    this.time.now
                );

                this.definirTextura(
                    TEXTURAS_MIGUEL.doubleJump
                );

                this.player.setVisible(false);

                this.doubleJumpVisual.setTexture(
                    TEXTURAS_MIGUEL.doubleJump
                );

                this.doubleJumpVisual.setVisible(true);
                this.doubleJumpVisual.setAlpha(1);
                this.doubleJumpVisual.setAngle(0);
                this.doubleJumpVisual.setScale(
                    CONFIG_MIGUEL.scale
                );

                this.doubleJumpVisual.setFlipX(
                    this.player.flipX
                );

                this.sincronizarVisualPuloDuplo();

                const direcaoGiro = (
                    this.player.flipX
                    ? -1
                    : 1
                );

                this.eventoRastroDuplo = (
                    this.time.addEvent({
                        delay: (
                            CONFIG_MIGUEL
                                .doubleJumpTrailDelay
                        ),

                        repeat: 7,

                        callback: () => {
                            this.criarRastroPuloDuplo();
                        }
                    })
                );

                this.tweenPulsoDuplo = this.tweens.add({
                    targets: this.doubleJumpVisual,

                    scaleX: (
                        CONFIG_MIGUEL.scale * 0.90
                    ),

                    scaleY: (
                        CONFIG_MIGUEL.scale * 1.10
                    ),

                    duration: (
                        CONFIG_MIGUEL
                            .doubleJumpDuration / 4
                    ),

                    yoyo: true,
                    repeat: 1,
                    ease: 'Sine.easeInOut'
                });

                this.tweenGiroDuplo = this.tweens.add({
                    targets: this.doubleJumpVisual,

                    angle: (
                        direcaoGiro
                        * CONFIG_MIGUEL
                            .doubleJumpDegrees
                    ),

                    duration: (
                        CONFIG_MIGUEL
                            .doubleJumpDuration
                    ),

                    ease: 'Sine.easeInOut',

                    onUpdate: () => {
                        this.sincronizarVisualPuloDuplo();
                    },

                    onComplete: () => {
                        if (
                            !this.estado.giroDuploAtivo
                        ) {
                            return;
                        }

                        this.estado.giroDuploAtivo = false;
                        this.estado.giroDuploIniciadoEm = 0;
                        this.estado.girosCompletos += 1;

                        if (this.eventoRastroDuplo) {
                            this.eventoRastroDuplo
                                .remove(false);

                            this.eventoRastroDuplo = null;
                        }

                        this.tweenGiroDuplo = null;
                        this.tweenPulsoDuplo = null;

                        this.doubleJumpVisual
                            .setVisible(false);

                        this.doubleJumpVisual
                            .setAngle(0);

                        this.doubleJumpVisual.setScale(
                            CONFIG_MIGUEL.scale
                        );

                        this.player.setVisible(true);
                        this.player.setAngle(0);

                        this.definirTextura(
                            TEXTURAS_MIGUEL.doubleJump
                        );
                    }
                });
            }

"""

marcador = """            obterNoChao() {"""

if texto.count(marcador) != 1:
    raise SystemExit(
        "ERRO: marcador de métodos não encontrado."
    )

texto = texto.replace(
    marcador,
    metodos + marcador,
    1,
)

substituir(
"""                this.estado.bloqueado = true;

                this.player.setVelocityX(0);""",
"""                this.cancelarGiroDuplo(true);

                this.estado.bloqueado = true;

                this.player.setVelocityX(0);""",
"cancelamento em ação temporária",
)

substituir(
"""                this.estado.bloqueado = true;
                this.player.setVelocityX(0);

                this.player.play(
                    'miguel_dust_anim',
                    true
                );""",
"""                this.cancelarGiroDuplo(true);

                this.estado.bloqueado = true;
                this.player.setVelocityX(0);

                this.player.play(
                    'miguel_dust_anim',
                    true
                );""",
"cancelamento na poeira",
)

substituir(
"""            executarVitoria() {
                this.estado.vitoria = true;""",
"""            executarVitoria() {
                this.cancelarGiroDuplo(true);

                this.estado.vitoria = true;""",
"cancelamento na vitória",
)

substituir(
"""            reiniciarEstado() {
                this.estado.vitoria = false;""",
"""            reiniciarEstado() {
                this.cancelarGiroDuplo(true);

                this.estado.vitoria = false;""",
"cancelamento ao reiniciar",
)

substituir(
"""                    this.player.setVelocityY(-470);

                    this.definirTextura(
                        TEXTURAS_MIGUEL.doubleJump
                    );""",
"""                    this.player.setVelocityY(-500);

                    this.iniciarGiroDuplo();""",
"execução do segundo salto",
)

substituir(
"""                    textureChanges: (
                        this.estado.trocasTextura
                    )
                };""",
"""                    textureChanges: (
                        this.estado.trocasTextura
                    ),

                    playerAngle: Number(
                        this.player.angle.toFixed(2)
                    ),

                    doubleJumpActive: (
                        this.estado.giroDuploAtivo
                    ),

                    doubleJumpAngle: (
                        this.doubleJumpVisual
                        ? Number(
                            this.doubleJumpVisual
                                .angle
                                .toFixed(2)
                        )
                        : 0
                    ),

                    doubleJumpElapsed: (
                        this.estado.giroDuploAtivo
                        ? Math.round(
                            this.time.now
                            - this.estado
                                .giroDuploIniciadoEm
                        )
                        : 0
                    ),

                    completedSpins: (
                        this.estado.girosCompletos
                    )
                };""",
"diagnóstico do giro",
)

substituir(
"""                    `PULOS: ${info.jumps}`,
                    `BLOQUEADO: ${info.locked}`,""",
"""                    `PULOS: ${info.jumps}`,
                    (
                        `GIRO DUPLO: `
                        + info.doubleJumpActive
                    ),
                    (
                        `ÂNGULO GIRO: `
                        + info.doubleJumpAngle
                    ),
                    (
                        `TEMPO GIRO: `
                        + info.doubleJumpElapsed
                        + 'ms'
                    ),
                    (
                        `GIROS CONCLUÍDOS: `
                        + info.completedSpins
                    ),
                    `BLOQUEADO: ${info.locked}`,""",
"painel do giro",
)

substituir(
"""                if (
                    noChao
                    && !this.estado.estavaNoChao
                ) {
                    this.estado.pulosDisponiveis = 2;
                } else if (noChao) {""",
"""                if (
                    noChao
                    && !this.estado.estavaNoChao
                ) {
                    this.estado.pulosDisponiveis = 2;

                    if (this.estado.giroDuploAtivo) {
                        this.cancelarGiroDuplo(true);
                    }

                    this.player.setAngle(0);
                    this.player.setVisible(true);
                } else if (noChao) {""",
"cancelamento ao aterrissar",
)

substituir(
"""                    if (!noChao) {
                        if (
                            this.estado.pulosDisponiveis === 0
                        ) {
                            this.definirTextura(
                                TEXTURAS_MIGUEL.doubleJump
                            );
                        } else {
                            this.definirTextura(
                                TEXTURAS_MIGUEL.jump
                            );
                        }
                    }""",
"""                    if (
                        !noChao
                        && !this.estado.giroDuploAtivo
                    ) {
                        if (
                            this.estado.pulosDisponiveis === 0
                        ) {
                            this.definirTextura(
                                TEXTURAS_MIGUEL.doubleJump
                            );
                        } else {
                            this.definirTextura(
                                TEXTURAS_MIGUEL.jump
                            );
                        }
                    }""",
"proteção da textura durante o giro",
)

substituir(
"""                this.estado.estavaNoChao = noChao;

                this.atualizarPainel();""",
"""                this.sincronizarVisualPuloDuplo();

                this.estado.estavaNoChao = noChao;

                this.atualizarPainel();""",
"sincronização no update",
)

texto = "\n".join(
    linha.rstrip()
    for linha in texto.splitlines()
) + "\n"

obrigatorios = [
    "doubleJumpVisual",
    "iniciarGiroDuplo",
    "cancelarGiroDuplo",
    "criarRastroPuloDuplo",
    "doubleJumpDegrees: 540",
    "doubleJumpDuration: 520",
    "GIRO DUPLO:",
    "playDoubleJump",
]

for obrigatorio in obrigatorios:
    if obrigatorio not in texto:
        raise SystemExit(
            f"ERRO: trecho ausente: {obrigatorio}"
        )

path.write_text(
    texto,
    encoding="utf-8",
)

print("Arquivo atualizado:", path)
print("Linhas:", len(texto.splitlines()))
print("Duração do giro: 520 ms")
print("Rotação: 540 graus")
print("Rastros: 8")
print("OK: cambalhota dinâmica instalada.")
