(() => {
    const BUILD = 'phase1-combat-feedback-v1-20260721';

    const runtime = {
        intervalo: null,
        fase: null,
        resultado: null,

        encerrar() {
            if (this.intervalo !== null) {
                window.clearInterval(this.intervalo);
                this.intervalo = null;
            }

            this.fase = null;
            this.resultado = null;
        }
    };

    const anterior = window.__MIGUEL_PHASE1_COMBAT_FEEDBACK_RUNTIME__;
    if (anterior && typeof anterior.encerrar === 'function') {
        anterior.encerrar();
    }

    window.__MIGUEL_PHASE1_COMBAT_FEEDBACK_BUILD__ = BUILD;
    window.__MIGUEL_PHASE1_COMBAT_FEEDBACK_RUNTIME__ = runtime;

    const tocarSequencia = (notas) => {
        const audio = window.MIGUEL_AUDIO_MANAGER;
        if (audio && typeof audio.sequencia === 'function') {
            audio.sequencia(notas);
        }
    };

    const criarFlash = (
        cena,
        cor = 0xff334f,
        alpha = 0.18,
        duracao = 180
    ) => {
        if (!cena || !cena.add || !cena.tweens) return;

        const flash = cena.add.rectangle(
            400,
            300,
            800,
            600,
            cor,
            alpha
        )
            .setScrollFactor(0)
            .setDepth(1950);

        cena.tweens.add({
            targets: flash,
            alpha: 0,
            duration: duracao,
            ease: 'Quad.easeOut',
            onComplete: () => {
                if (flash.active) flash.destroy();
            }
        });
    };

    const criarTextoDano = (cena, evento) => {
        if (!cena.player || !cena.add || !cena.tweens) return;

        const dano = Math.max(
            1,
            Number(evento && evento.dano ? evento.dano : 1)
        );

        const texto = cena.add.text(
            cena.player.x,
            cena.player.y - 78,
            `-${dano}`,
            {
                fontFamily: 'Courier New',
                fontSize: '22px',
                color: '#ff496c',
                stroke: '#24020a',
                strokeThickness: 4,
                fontStyle: 'bold'
            }
        )
            .setOrigin(0.5)
            .setDepth(1600);

        cena.tweens.add({
            targets: texto,
            y: texto.y - 42,
            alpha: 0,
            duration: 620,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (texto.active) texto.destroy();
            }
        });
    };

    const criarBarraInimigo = (cena, inimigo) => {
        const fundo = cena.add.rectangle(
            0,
            0,
            60,
            9,
            0x07111f,
            0.94
        )
            .setDepth(1550)
            .setVisible(false)
            .setStrokeStyle(1, 0xffffff, 0.32);

        const barra = cena.add.rectangle(
            0,
            0,
            54,
            4,
            0x28ff9b,
            1
        )
            .setOrigin(0, 0.5)
            .setDepth(1551)
            .setVisible(false);

        return {
            fundo,
            barra,
            inimigo
        };
    };

    const atualizarBarras = (cena, barras) => {
        if (!cena.inimigos || !cena.inimigos.children) return;

        cena.inimigos.children.iterate((inimigo) => {
            if (!inimigo) return;

            if (!barras.has(inimigo)) {
                barras.set(
                    inimigo,
                    criarBarraInimigo(cena, inimigo)
                );
            }

            const visual = barras.get(inimigo);

            if (
                !inimigo.active
                || inimigo.getData('morto')
            ) {
                visual.fundo.setVisible(false);
                visual.barra.setVisible(false);
                return;
            }

            const vidaMaxima = Math.max(
                1,
                Number(inimigo.getData('vidaMaxima') || 1)
            );

            const vida = Math.max(
                0,
                Number(inimigo.getData('vida') || 0)
            );

            const tipo = inimigo.getData('tipo') || 'sentinela';
            const mostrar = vida < vidaMaxima || tipo === 'mini-chefe';

            if (!mostrar) {
                visual.fundo.setVisible(false);
                visual.barra.setVisible(false);
                return;
            }

            const proporcao = Phaser.Math.Clamp(
                vida / vidaMaxima,
                0,
                1
            );

            const y = inimigo.y - Math.max(
                44,
                inimigo.displayHeight * 0.43
            );

            visual.fundo
                .setPosition(inimigo.x, y)
                .setVisible(true);

            visual.barra
                .setPosition(inimigo.x - 27, y)
                .setDisplaySize(Math.max(1, 54 * proporcao), 4)
                .setFillStyle(
                    proporcao <= 0.34
                        ? 0xff334f
                        : (
                            proporcao <= 0.67
                                ? 0xffcc00
                                : 0x28ff9b
                        ),
                    1
                )
                .setVisible(true);
        });
    };

    const atualizarLasers = (cena, estadosLaser, time) => {
        if (!cena.lasers || !cena.lasers.children) return;

        cena.lasers.children.iterate((laser) => {
            if (!laser || !laser.active) return;

            const ligado = Boolean(laser.getData('ligado'));
            const anteriorLaser = estadosLaser.get(laser);

            if (!anteriorLaser || anteriorLaser.ligado !== ligado) {
                estadosLaser.set(laser, {
                    ligado,
                    mudouEm: time
                });
            }

            const estado = estadosLaser.get(laser);
            const decorrido = Math.max(0, time - estado.mudouEm);

            if (ligado) {
                laser
                    .setVisible(true)
                    .clearTint()
                    .setAlpha(
                        0.72
                        + Math.abs(Math.sin(time / 90))
                        * 0.28
                    );
                return;
            }

            const aproximando = Phaser.Math.Clamp(
                (decorrido - 900) / 800,
                0,
                1
            );

            const pulso = (
                0.1
                + Math.abs(Math.sin(time / 115))
                * (0.12 + aproximando * 0.2)
            );

            laser
                .setVisible(true)
                .setTint(0xffcc00)
                .setAlpha(pulso);
        });
    };

    const obterFaseBoss = (boss) => {
        const vida = Number(boss && boss.getData('vida'));
        if (!Number.isFinite(vida)) return 1;
        return vida > 8 ? 1 : (vida > 4 ? 2 : 3);
    };

    const anunciarFaseBoss = (cena, fase) => {
        if (
            cena.hudJogo
            && typeof cena.hudJogo.mostrarMensagem === 'function'
        ) {
            cena.hudJogo.mostrarMensagem(
                `NÚCLEO GUARDIÃO — FASE ${fase}`,
                1500
            );
        }

        criarFlash(
            cena,
            fase === 3 ? 0xff275f : 0xbf32ff,
            0.22,
            260
        );

        if (cena.cameras && cena.cameras.main) {
            cena.cameras.main.shake(
                320,
                fase === 3 ? 0.012 : 0.007
            );
        }

        tocarSequencia([
            {
                f: fase === 3 ? 92 : 120,
                d: 180,
                forma: 'sawtooth',
                v: 0.8
            },
            {
                f: fase === 3 ? 74 : 96,
                d: 220,
                a: 150,
                forma: 'sawtooth',
                v: 0.9
            }
        ]);

        cena.__MIGUEL_BOSS_PHASE_CUE_COUNT__ = (
            Number(cena.__MIGUEL_BOSS_PHASE_CUE_COUNT__ || 0) + 1
        );
    };

    const instalarFeedbackDano = (cena) => {
        if (
            !cena.sistemaVida
            || cena.__MIGUEL_DAMAGE_FEEDBACK_INSTALLED__
        ) {
            return;
        }

        const original = cena.sistemaVida.onDamage;

        const wrapper = (evento) => {
            if (typeof original === 'function') {
                original.call(cena.sistemaVida, evento);
            }

            cena.__MIGUEL_PHASE1_DAMAGE_FEEDBACK_COUNT__ = (
                Number(
                    cena.__MIGUEL_PHASE1_DAMAGE_FEEDBACK_COUNT__
                    || 0
                ) + 1
            );

            criarTextoDano(cena, evento);
            criarFlash(cena);

            if (cena.cameras && cena.cameras.main) {
                cena.cameras.main.shake(130, 0.006);
            }

            const estado = cena.sistemaVida.obterEstado();
            if (
                estado.vida <= estado.vidaMaxima * 0.25
                && cena.time.now >= Number(
                    cena.__MIGUEL_LOW_HEALTH_AUDIO_AT__ || 0
                )
            ) {
                cena.__MIGUEL_LOW_HEALTH_AUDIO_AT__ = (
                    cena.time.now + 2600
                );

                tocarSequencia([
                    { f: 150, d: 90, v: 0.55 },
                    { f: 150, d: 90, a: 150, v: 0.55 }
                ]);
            }
        };

        cena.__MIGUEL_DAMAGE_FEEDBACK_INSTALLED__ = true;
        cena.__MIGUEL_DAMAGE_FEEDBACK_ORIGINAL__ = original;
        cena.__MIGUEL_DAMAGE_FEEDBACK_WRAPPER__ = wrapper;
        cena.sistemaVida.onDamage = wrapper;
    };

    const restaurarFeedbackDano = (cena) => {
        if (
            cena
            && cena.sistemaVida
            && cena.sistemaVida.onDamage
                === cena.__MIGUEL_DAMAGE_FEEDBACK_WRAPPER__
        ) {
            cena.sistemaVida.onDamage = (
                cena.__MIGUEL_DAMAGE_FEEDBACK_ORIGINAL__
            );
        }

        delete cena.__MIGUEL_DAMAGE_FEEDBACK_INSTALLED__;
        delete cena.__MIGUEL_DAMAGE_FEEDBACK_ORIGINAL__;
        delete cena.__MIGUEL_DAMAGE_FEEDBACK_WRAPPER__;
    };

    const anexarFase = (cena) => {
        if (
            !cena
            || !cena.sys
            || !cena.sys.isActive()
            || cena.__MIGUEL_PHASE1_COMBAT_FEEDBACK_APPLIED__
        ) {
            return false;
        }

        cena.__MIGUEL_PHASE1_COMBAT_FEEDBACK_APPLIED__ = BUILD;
        cena.__MIGUEL_PHASE1_DAMAGE_FEEDBACK_COUNT__ = 0;
        cena.__MIGUEL_BOSS_PHASE_CUE_COUNT__ = 0;

        instalarFeedbackDano(cena);

        const barras = new Map();
        const estadosLaser = new Map();
        let faseBossAnterior = 1;

        const handler = (time) => {
            if (!cena.sys || !cena.sys.isActive()) return;

            atualizarBarras(cena, barras);
            atualizarLasers(cena, estadosLaser, time);

            if (
                cena.bossAtivo
                && cena.boss
                && cena.boss.active
            ) {
                const atual = obterFaseBoss(cena.boss);
                cena.__MIGUEL_BOSS_PHASE__ = atual;

                if (atual > faseBossAnterior) {
                    faseBossAnterior = atual;
                    anunciarFaseBoss(cena, atual);
                }
            }
        };

        cena.events.on('postupdate', handler);
        cena.events.once('shutdown', () => {
            cena.events.off('postupdate', handler);
            restaurarFeedbackDano(cena);

            barras.forEach((visual) => {
                if (visual.fundo.active) visual.fundo.destroy();
                if (visual.barra.active) visual.barra.destroy();
            });
            barras.clear();

            delete cena.__MIGUEL_PHASE1_COMBAT_FEEDBACK_APPLIED__;
            delete cena.__MIGUEL_ENEMY_HEALTH_BARS__;

            if (runtime.fase === cena) {
                runtime.fase = null;
            }
        });

        cena.__MIGUEL_ENEMY_HEALTH_BARS__ = barras;
        runtime.fase = cena;

        console.info('[FASE 1 FEEDBACK]', BUILD, 'aplicado');
        return true;
    };

    const calcularClassificacao = (resultado) => {
        const total = Math.max(
            1,
            Number(resultado.totalCristais || 1)
        );

        const cristais = Math.max(
            0,
            Number(resultado.cristais || 0)
        );

        const danos = Math.max(
            0,
            Number(resultado.danosRecebidos || 0)
        );

        const proporcao = cristais / total;

        if (danos === 0 && proporcao >= 1) return 'S';
        if (danos <= 3 && proporcao >= 0.75) return 'A';
        if (danos <= 6 && proporcao >= 0.5) return 'B';
        return 'C';
    };

    const anexarResultado = (cena) => {
        if (
            !cena
            || !cena.sys
            || !cena.sys.isActive()
            || cena.__MIGUEL_PHASE1_RESULT_FEEDBACK_APPLIED__
        ) {
            return false;
        }

        const resultado = cena.registry.get('resultadoFase1') || {};
        const classificacao = calcularClassificacao(resultado);

        const cores = {
            S: '#ffcc00',
            A: '#28ff9b',
            B: '#8fe9ff',
            C: '#ffffff'
        };

        const texto = cena.add.text(
            490,
            455,
            `CLASSIFICAÇÃO  ${classificacao}`,
            {
                fontFamily: 'Courier New',
                fontSize: '25px',
                color: cores[classificacao],
                stroke: '#071426',
                strokeThickness: 4,
                fontStyle: 'bold'
            }
        )
            .setOrigin(0.5)
            .setDepth(1500);

        cena.__MIGUEL_PHASE1_RESULT_FEEDBACK_APPLIED__ = BUILD;
        cena.__MIGUEL_PHASE1_RANK__ = classificacao;
        cena.__MIGUEL_PHASE1_RANK_TEXT__ = texto;
        runtime.resultado = cena;

        cena.events.once('shutdown', () => {
            if (texto.active) texto.destroy();
            delete cena.__MIGUEL_PHASE1_RESULT_FEEDBACK_APPLIED__;
            delete cena.__MIGUEL_PHASE1_RANK_TEXT__;

            if (runtime.resultado === cena) {
                runtime.resultado = null;
            }
        });

        console.info(
            '[FASE 1 RESULTADO]',
            'classificação',
            classificacao
        );

        return true;
    };

    const procurar = () => {
        const game = window.__MIGUEL_GAME__;
        if (
            !game
            || !game.scene
            || typeof game.scene.getScene !== 'function'
        ) {
            return;
        }

        const fase = game.scene.getScene('Fase1');
        if (fase && fase.sys && fase.sys.isActive()) {
            anexarFase(fase);
        }

        const resultado = game.scene.getScene('ResultadoFase1');
        if (
            resultado
            && resultado.sys
            && resultado.sys.isActive()
        ) {
            anexarResultado(resultado);
        }
    };

    runtime.intervalo = window.setInterval(procurar, 120);
    window.addEventListener('load', procurar, { once: true });
})();
