(() => {
    const BUILD = 'phase1-polish-v1-20260721';

    const CONFIG = Object.freeze({
        invulnerabilidade: 1200,
        camera: Object.freeze({
            lerpX: 0.11,
            lerpY: 0.1,
            offsetX: -90,
            offsetY: 14,
            deadzoneLargura: 250,
            deadzoneAltura: 190
        }),
        dano: Object.freeze({
            espinho: 18,
            laser: 16,
            sentinela: 12,
            drone: 10,
            torre: 13,
            'mini-chefe': 18,
            chefe: 22,
            projetil: 13,
            'projetil-chefe': 18
        })
    });

    const NOMES_SETORES = Object.freeze({
        1: 'PORTÃO DA CIDADE',
        2: 'FÁBRICA ABANDONADA',
        3: 'TÚNEIS DE ENERGIA',
        4: 'PONTE DAS ENGRENAGENS',
        5: 'NÚCLEO DO GUARDIÃO'
    });

    const runtime = {
        intervalo: null,
        cena: null,
        handler: null,
        encerrar() {
            if (this.intervalo !== null) {
                clearInterval(this.intervalo);
                this.intervalo = null;
            }

            if (this.cena && this.handler && this.cena.events) {
                this.cena.events.off('postupdate', this.handler);
            }

            this.cena = null;
            this.handler = null;
        }
    };

    window.__MIGUEL_PHASE1_POLISH_BUILD__ = BUILD;
    window.__MIGUEL_PHASE1_POLISH_RUNTIME__ = runtime;

    const criarSilhuetas = (cena) => {
        const dados = [
            [160, 405, 190, 250],
            [520, 380, 260, 300],
            [930, 420, 210, 220],
            [1380, 365, 300, 330],
            [1840, 410, 240, 240],
            [2300, 360, 300, 340],
            [2780, 405, 250, 250],
            [3260, 350, 320, 360],
            [3760, 400, 250, 260],
            [4250, 355, 310, 350],
            [4740, 400, 250, 260],
            [5200, 365, 300, 330]
        ];

        dados.forEach(([x, y, largura, altura], indice) => {
            const predio = cena.add.rectangle(
                x,
                y,
                largura,
                altura,
                indice % 2 === 0 ? 0x0c2234 : 0x102b3d,
                0.9
            )
                .setDepth(1)
                .setScrollFactor(0.34);

            predio.setStrokeStyle(2, 0x22546a, 0.45);

            const colunas = Math.max(2, Math.floor(largura / 58));
            const linhas = Math.max(2, Math.floor(altura / 72));

            for (let coluna = 0; coluna < colunas; coluna += 1) {
                for (let linha = 0; linha < linhas; linha += 1) {
                    if ((coluna + linha + indice) % 3 !== 0) continue;

                    cena.add.rectangle(
                        x - largura / 2 + 28 + coluna * 54,
                        y - altura / 2 + 34 + linha * 64,
                        12,
                        18,
                        indice >= 8 ? 0xff4d8d : 0x35d9ff,
                        0.42
                    )
                        .setDepth(1.1)
                        .setScrollFactor(0.34);
                }
            }
        });

        for (let x = 120; x < 5400; x += 420) {
            cena.add.circle(
                x,
                235 + (x % 3) * 12,
                5,
                0x35d9ff,
                0.24
            )
                .setDepth(1.2)
                .setScrollFactor(0.22);
        }
    };

    const criarFaixaSetor = (cena) => {
        const container = cena.add.container(400, 150)
            .setScrollFactor(0)
            .setDepth(1500)
            .setAlpha(0)
            .setVisible(false);

        const fundo = cena.add.rectangle(
            0,
            0,
            430,
            64,
            0x06111f,
            0.92
        ).setStrokeStyle(2, 0x35d9ff, 0.8);

        const texto = cena.add.text(0, 0, '', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([fundo, texto]);

        return {
            container,
            texto,
            mostrar(indice) {
                const nome = NOMES_SETORES[indice];
                if (!nome || !container.active) return;

                cena.tweens.killTweensOf(container);
                texto.setText(`SETOR ${indice}/5  —  ${nome}`);
                container
                    .setVisible(true)
                    .setAlpha(0)
                    .setY(132);

                cena.tweens.add({
                    targets: container,
                    alpha: 1,
                    y: 150,
                    duration: 220,
                    ease: 'Quad.easeOut',
                    hold: 850,
                    yoyo: true,
                    onComplete: () => {
                        if (container.active) container.setVisible(false);
                    }
                });
            }
        };
    };

    const ajustarCamera = (cena) => {
        const camera = cena.cameras && cena.cameras.main;
        if (!camera || !cena.player) return;

        camera.startFollow(
            cena.player,
            true,
            CONFIG.camera.lerpX,
            CONFIG.camera.lerpY,
            CONFIG.camera.offsetX,
            CONFIG.camera.offsetY
        );
        camera.setDeadzone(
            CONFIG.camera.deadzoneLargura,
            CONFIG.camera.deadzoneAltura
        );
        camera.roundPixels = true;
    };

    const ajustarDanos = (cena) => {
        if (
            cena.__MIGUEL_APLICAR_DANO_ORIGINAL__
            || typeof cena.aplicarDano !== 'function'
        ) {
            return;
        }

        const original = cena.aplicarDano.bind(cena);
        cena.__MIGUEL_APLICAR_DANO_ORIGINAL__ = original;

        cena.aplicarDano = (
            dano,
            origem,
            direcao = 0,
            impulsoY = -200
        ) => {
            const danoBalanceado = Object.prototype.hasOwnProperty.call(
                CONFIG.dano,
                origem
            )
                ? CONFIG.dano[origem]
                : Math.max(1, Number(dano || 1));

            return original(
                danoBalanceado,
                origem,
                direcao,
                impulsoY
            );
        };

        if (cena.sistemaVida) {
            cena.sistemaVida.duracaoInvulnerabilidade = (
                CONFIG.invulnerabilidade
            );
        }

        if (cena.inimigos && cena.inimigos.children) {
            cena.inimigos.children.iterate((inimigo) => {
                if (!inimigo || !inimigo.active) return;
                const tipo = inimigo.getData('tipo') || 'sentinela';
                const dano = CONFIG.dano[tipo];
                if (Number.isFinite(dano)) inimigo.setData('dano', dano);
            });
        }
    };

    const animarElementos = (cena, time) => {
        if (cena.lasers && cena.lasers.children) {
            cena.lasers.children.iterate((laser) => {
                if (!laser || !laser.active) return;

                if (!laser.getData('ligado')) {
                    laser.setAlpha(0);
                    return;
                }

                const pulso = 0.62 + Math.abs(Math.sin(time / 105)) * 0.38;
                laser.setAlpha(pulso);
            });
        }

        if (cena.checkpoints && cena.checkpoints.children) {
            cena.checkpoints.children.iterate((checkpoint) => {
                if (!checkpoint || !checkpoint.active) return;

                if (checkpoint.getData('ativado')) {
                    checkpoint.setAlpha(1);
                    checkpoint.setScale(1);
                    return;
                }

                const pulso = 0.78 + Math.abs(Math.sin(time / 280)) * 0.22;
                checkpoint.setAlpha(pulso);
                checkpoint.setScale(0.98 + (pulso - 0.78) * 0.08);
            });
        }
    };

    const anexar = (cena) => {
        if (
            !cena
            || !cena.sys
            || !cena.sys.isActive()
            || cena.__MIGUEL_PHASE1_POLISH_APPLIED__
        ) {
            return false;
        }

        cena.__MIGUEL_PHASE1_POLISH_APPLIED__ = BUILD;
        criarSilhuetas(cena);
        ajustarCamera(cena);
        ajustarDanos(cena);

        const faixa = criarFaixaSetor(cena);
        let zonaAnterior = null;

        const handler = (time) => {
            if (!cena.sys || !cena.sys.isActive()) return;

            animarElementos(cena, time);

            if (cena.zonaAtual !== zonaAnterior) {
                zonaAnterior = cena.zonaAtual;
                faixa.mostrar(zonaAnterior);
            }
        };

        cena.events.on('postupdate', handler);
        cena.events.once('shutdown', () => {
            cena.events.off('postupdate', handler);

            if (cena.__MIGUEL_APLICAR_DANO_ORIGINAL__) {
                cena.aplicarDano = cena.__MIGUEL_APLICAR_DANO_ORIGINAL__;
                delete cena.__MIGUEL_APLICAR_DANO_ORIGINAL__;
            }

            delete cena.__MIGUEL_PHASE1_POLISH_APPLIED__;

            if (runtime.cena === cena) {
                runtime.cena = null;
                runtime.handler = null;
            }
        });

        runtime.cena = cena;
        runtime.handler = handler;

        console.info('[FASE 1 POLISH]', BUILD, 'aplicado');
        return true;
    };

    const procurar = () => {
        const game = window.__MIGUEL_GAME__;
        if (!game || !game.scene || typeof game.scene.getScene !== 'function') {
            return;
        }

        const cena = game.scene.getScene('Fase1');
        if (cena && cena.sys && cena.sys.isActive()) anexar(cena);
    };

    runtime.intervalo = setInterval(procurar, 120);
    window.addEventListener('load', procurar, { once: true });
})();
