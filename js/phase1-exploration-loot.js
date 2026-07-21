(() => {
    const BUILD = 'phase1-exploration-loot-v1-20260721';
    const STORAGE_KEY = 'miguel-inventario-v1';

    const ITENS = Object.freeze({
        hoverboard: Object.freeze({
            nome: 'HOVERBOARD DE ENERGIA',
            descricao: 'Velocidade ampliada e deslocamento sobre a prancha.'
        }),
        luvasEnergia: Object.freeze({
            nome: 'LUVAS DE ENERGIA',
            descricao: 'Reduz o tempo de recarga do poder.'
        }),
        escudoIonico: Object.freeze({
            nome: 'ESCUDO IÔNICO',
            descricao: 'Reduz o dano recebido durante a aventura.'
        }),
        blasterPulso: Object.freeze({
            nome: 'BLASTER DE PULSO',
            descricao: 'Amplia o dano do pulso de energia.'
        })
    });

    const BAUS_FASE1 = Object.freeze([
        Object.freeze({ id: 'fase1-bau-1', x: 920, y: 530, item: 'hoverboard' }),
        Object.freeze({ id: 'fase1-bau-2', x: 2080, y: 530, item: 'luvasEnergia' }),
        Object.freeze({ id: 'fase1-bau-3', x: 3320, y: 530, item: 'escudoIonico' }),
        Object.freeze({ id: 'fase1-bau-4', x: 4540, y: 530, item: 'blasterPulso' })
    ]);

    const runtime = {
        intervalo: null,
        cena: null,

        encerrar() {
            if (this.intervalo !== null) {
                window.clearInterval(this.intervalo);
                this.intervalo = null;
            }
            this.cena = null;
        }
    };

    const anterior = window.__MIGUEL_EXPLORATION_LOOT_RUNTIME__;
    if (anterior && typeof anterior.encerrar === 'function') {
        anterior.encerrar();
    }

    const inventarioPadrao = () => ({
        hoverboard: false,
        luvasEnergia: false,
        escudoIonico: false,
        blasterPulso: false,
        bausAbertos: []
    });

    const normalizarInventario = (dados = {}) => {
        const padrao = inventarioPadrao();
        return {
            hoverboard: Boolean(dados.hoverboard),
            luvasEnergia: Boolean(dados.luvasEnergia),
            escudoIonico: Boolean(dados.escudoIonico),
            blasterPulso: Boolean(dados.blasterPulso),
            bausAbertos: Array.isArray(dados.bausAbertos)
                ? [...new Set(dados.bausAbertos.filter((id) => typeof id === 'string'))]
                : padrao.bausAbertos
        };
    };

    const carregarInventario = () => {
        try {
            const salvo = window.localStorage.getItem(STORAGE_KEY);
            return normalizarInventario(salvo ? JSON.parse(salvo) : {});
        } catch (erro) {
            console.debug('[INVENTÁRIO] armazenamento indisponível', erro);
            return inventarioPadrao();
        }
    };

    const salvarInventario = (inventario) => {
        const normalizado = normalizarInventario(inventario);
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizado));
        } catch (erro) {
            console.debug('[INVENTÁRIO] não foi possível salvar', erro);
        }
        return normalizado;
    };

    const adicionarItem = (inventario, item, bauId = null) => {
        if (!Object.prototype.hasOwnProperty.call(ITENS, item)) {
            return normalizarInventario(inventario);
        }

        const atualizado = normalizarInventario(inventario);
        atualizado[item] = true;
        if (bauId && !atualizado.bausAbertos.includes(bauId)) {
            atualizado.bausAbertos.push(bauId);
        }
        return salvarInventario(atualizado);
    };

    const possuiItem = (inventario, item) => Boolean(
        inventario
        && Object.prototype.hasOwnProperty.call(ITENS, item)
        && inventario[item]
    );

    window.MIGUEL_LOOT_SYSTEM = Object.freeze({
        build: BUILD,
        itens: ITENS,
        carregarInventario,
        salvarInventario,
        adicionarItem,
        possuiItem,
        registrarMapa(cena, baus) {
            if (!cena || !Array.isArray(baus)) return false;
            cena.__MIGUEL_LOOT_MAP_CONFIG__ = baus.map((bau) => ({ ...bau }));
            return true;
        }
    });

    window.__MIGUEL_EXPLORATION_LOOT_BUILD__ = BUILD;
    window.__MIGUEL_EXPLORATION_LOOT_RUNTIME__ = runtime;

    const tocar = (nome) => {
        const audio = window.MIGUEL_AUDIO_MANAGER;
        if (audio && typeof audio.tocarEfeito === 'function') {
            audio.tocarEfeito(nome);
        }
    };

    const criarTexturas = (cena) => {
        if (!cena.textures.exists('miguel_bau_fechado')) {
            const g = cena.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x5c3417, 1);
            g.fillRoundedRect(2, 12, 52, 32, 5);
            g.fillStyle(0x8f5b25, 1);
            g.fillRoundedRect(2, 2, 52, 24, 8);
            g.lineStyle(3, 0xffcc00, 1);
            g.strokeRoundedRect(2, 2, 52, 42, 7);
            g.fillStyle(0xffe06a, 1);
            g.fillRect(24, 19, 8, 13);
            g.generateTexture('miguel_bau_fechado', 56, 46);
            g.destroy();
        }

        if (!cena.textures.exists('miguel_bau_aberto')) {
            const g = cena.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x5c3417, 1);
            g.fillRoundedRect(2, 18, 52, 26, 5);
            g.fillStyle(0x8f5b25, 1);
            g.fillRoundedRect(2, 0, 52, 13, 6);
            g.lineStyle(3, 0x28ff9b, 1);
            g.strokeRoundedRect(2, 18, 52, 26, 5);
            g.strokeRoundedRect(2, 0, 52, 13, 6);
            g.generateTexture('miguel_bau_aberto', 56, 46);
            g.destroy();
        }
    };

    const elevarColetaveis = (cena) => {
        const elevarGrupo = (grupo, profundidade) => {
            if (!grupo || !grupo.children) return;
            grupo.children.iterate((item) => {
                if (item && item.active) item.setDepth(profundidade);
            });
        };

        elevarGrupo(cena.coletaveis, 32);
        elevarGrupo(cena.energias, 32);
        elevarGrupo(cena.checkpoints, 18);
    };

    const ajustarPlataformas = (cena) => {
        if (!cena.plataformas || !cena.plataformas.children) return;

        const larguras = new Map([
            [1450, 250],
            [2320, 250],
            [3770, 290],
            [4130, 250]
        ]);

        cena.plataformas.children.iterate((plataforma) => {
            if (!plataforma || !plataforma.active) return;
            const entrada = [...larguras.entries()].find(
                ([x]) => Math.abs(plataforma.x - x) < 4
            );
            if (!entrada) return;
            plataforma.setDisplaySize(entrada[1], plataforma.displayHeight || 24);
            if (typeof plataforma.refreshBody === 'function') plataforma.refreshBody();
        });
    };

    const ajustarInimigos = (cena) => {
        if (!cena.inimigos || !cena.inimigos.children) return;

        const sentinelas = [];
        let miniChefe = null;

        cena.inimigos.children.iterate((inimigo) => {
            if (!inimigo || !inimigo.active) return;
            const tipo = inimigo.getData('tipo');
            if (tipo === 'sentinela') sentinelas.push(inimigo);
            if (tipo === 'mini-chefe') miniChefe = inimigo;
        });

        sentinelas.sort((a, b) => a.x - b.x);
        const ajustes = [
            { x: 680, minX: 560, maxX: 800 },
            { x: 1430, minX: 1310, maxX: 1530 },
            { x: 3070, minX: 2960, maxX: 3210 }
        ];

        ajustes.forEach((dados, indice) => {
            const inimigo = sentinelas[indice];
            if (!inimigo) return;
            inimigo.setPosition(dados.x, inimigo.y);
            inimigo.setData('minX', dados.minX);
            inimigo.setData('maxX', dados.maxX);
            if (inimigo.body && typeof inimigo.body.reset === 'function') {
                inimigo.body.reset(dados.x, inimigo.y);
            }
        });

        if (miniChefe) {
            miniChefe.setPosition(3860, miniChefe.y);
            miniChefe.setData('minX', 3720);
            miniChefe.setData('maxX', 3980);
            if (miniChefe.body && typeof miniChefe.body.reset === 'function') {
                miniChefe.body.reset(3860, miniChefe.y);
            }
        }
    };

    const ajustarLasers = (cena) => {
        if (!cena.lasers || !cena.lasers.children) return [];

        const lasers = [];
        cena.lasers.children.iterate((laser) => {
            if (laser) lasers.push(laser);
        });
        lasers.sort((a, b) => a.x - b.x);

        [1720, 2680, 4250].forEach((x, indice) => {
            const laser = lasers[indice];
            if (!laser) return;
            laser.setPosition(x, laser.y);
            if (laser.body && typeof laser.body.reset === 'function') {
                laser.body.reset(x, laser.y);
                laser.body.allowGravity = false;
                laser.body.immovable = true;
            }
        });

        return lasers;
    };

    const criarVisualLaser = (cena, laser) => {
        const grafico = cena.add.graphics()
            .setDepth(17);

        return { laser, grafico };
    };

    const desenharLaser = (visual, time) => {
        const { laser, grafico } = visual;
        if (!laser || !laser.active || !grafico.active) return;

        const ligado = Boolean(laser.getData('ligado'));
        grafico.clear();
        grafico.setPosition(laser.x, laser.y);

        if (ligado) {
            const pulso = 0.72 + Math.abs(Math.sin(time / 80)) * 0.28;
            grafico.fillStyle(0xff174a, 0.18 + pulso * 0.12);
            grafico.fillRoundedRect(-12, -62, 24, 124, 10);
            grafico.fillStyle(0xff4f9a, 0.72);
            grafico.fillRect(-5, -60, 10, 120);
            grafico.fillStyle(0xffffff, 0.96);
            grafico.fillRect(-2, -60, 4, 120);
            grafico.lineStyle(2, 0xffc4de, 0.82);

            for (let y = -52; y <= 48; y += 20) {
                const deslocamento = Math.sin(time / 55 + y) * 5;
                grafico.lineBetween(-8 + deslocamento, y, 8 - deslocamento, y + 8);
            }

            grafico.fillStyle(0xff315f, 0.95);
            grafico.fillCircle(0, -63, 9);
            grafico.fillCircle(0, 63, 9);
        } else {
            const alpha = 0.3 + Math.abs(Math.sin(time / 130)) * 0.35;
            grafico.lineStyle(3, 0xffcc00, alpha);
            for (let y = -58; y < 58; y += 18) {
                grafico.lineBetween(0, y, 0, y + 9);
            }
            grafico.fillStyle(0xffcc00, 0.55 + alpha * 0.4);
            grafico.fillCircle(0, -63, 7);
            grafico.fillCircle(0, 63, 7);
        }

        laser.setAlpha(0.04);
    };

    const criarHoverboardVisual = (cena) => {
        const container = cena.add.container(0, 0)
            .setDepth(19)
            .setVisible(false);
        const brilho = cena.add.ellipse(0, 7, 96, 18, 0x00e5ff, 0.2);
        const prancha = cena.add.rectangle(0, 0, 82, 13, 0x164a63, 1)
            .setStrokeStyle(3, 0x8fe9ff, 1);
        const nucleo = cena.add.rectangle(0, 2, 30, 5, 0xffffff, 0.92);
        const propulsorEsquerdo = cena.add.circle(-31, 8, 5, 0x28ff9b, 0.9);
        const propulsorDireito = cena.add.circle(31, 8, 5, 0x28ff9b, 0.9);
        container.add([
            brilho,
            prancha,
            nucleo,
            propulsorEsquerdo,
            propulsorDireito
        ]);
        return container;
    };

    const criarBaus = (cena, estado) => {
        criarTexturas(cena);
        const grupo = cena.physics.add.staticGroup();

        BAUS_FASE1.forEach((dados) => {
            const aberto = estado.inventario.bausAbertos.includes(dados.id);
            const bau = grupo.create(
                dados.x,
                dados.y,
                aberto ? 'miguel_bau_aberto' : 'miguel_bau_fechado'
            );
            bau.setDepth(31);
            bau.setData('id', dados.id);
            bau.setData('item', dados.item);
            bau.setData('aberto', aberto);
            if (aberto && bau.body) bau.body.enable = false;
        });

        cena.physics.add.overlap(
            cena.player,
            grupo,
            (player, bau) => {
                if (!bau.active || bau.getData('aberto')) return;

                const item = bau.getData('item');
                const id = bau.getData('id');
                estado.inventario = adicionarItem(estado.inventario, item, id);
                cena.registry.set('inventarioMiguel', { ...estado.inventario });
                bau.setData('aberto', true);
                bau.setTexture('miguel_bau_aberto');
                if (bau.body) bau.body.enable = false;
                tocar('checkpoint');

                const definicao = ITENS[item];
                if (cena.hudJogo && definicao) {
                    cena.hudJogo.mostrarMensagem(
                        `BAÚ ABERTO — ${definicao.nome}`,
                        1700
                    );
                }

                if (item === 'hoverboard') {
                    estado.montado = true;
                    estado.hoverboardVisual.setVisible(true);
                }
            },
            null,
            cena
        );

        return grupo;
    };

    const montarHoverboard = (cena, estado, mostrarMensagem = true) => {
        if (
            !possuiItem(estado.inventario, 'hoverboard')
            || !cena.player
            || cena.player.estaAgachado
            || cena.player.estaMachucado
        ) {
            return false;
        }

        estado.montado = true;
        estado.hoverboardVisual.setVisible(true);
        if (mostrarMensagem && cena.hudJogo) {
            cena.hudJogo.mostrarMensagem('HOVERBOARD MONTADO', 900);
        }
        tocar('energia');
        return true;
    };

    const desmontarHoverboard = (cena, estado, mostrarMensagem = true) => {
        if (!estado.montado) return false;
        estado.montado = false;
        estado.hoverboardVisual.setVisible(false);
        if (mostrarMensagem && cena.hudJogo) {
            cena.hudJogo.mostrarMensagem('HOVERBOARD RECOLHIDO', 750);
        }
        return true;
    };

    const executarPoder = (cena, estado, time) => {
        const cooldown = possuiItem(estado.inventario, 'luvasEnergia')
            ? 3800
            : 5000;

        if (time < estado.proximoPoder) {
            const segundos = Math.max(1, Math.ceil((estado.proximoPoder - time) / 1000));
            if (cena.hudJogo) {
                cena.hudJogo.mostrarMensagem(`PODER RECARREGANDO — ${segundos}s`, 550);
            }
            return false;
        }

        estado.proximoPoder = time + cooldown;
        const dano = possuiItem(estado.inventario, 'blasterPulso') ? 2 : 1;
        const raioInimigo = possuiItem(estado.inventario, 'blasterPulso') ? 215 : 175;

        const onda = cena.add.circle(
            cena.player.x,
            cena.player.y,
            22,
            0x00e5ff,
            0.18
        )
            .setStrokeStyle(5, 0xffffff, 0.9)
            .setDepth(50);

        cena.tweens.add({
            targets: onda,
            scaleX: 8,
            scaleY: 8,
            alpha: 0,
            duration: 420,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (onda.active) onda.destroy();
            }
        });

        if (cena.projeteis && cena.projeteis.children) {
            cena.projeteis.children.iterate((projetil) => {
                if (
                    projetil
                    && projetil.active
                    && Phaser.Math.Distance.Between(
                        cena.player.x,
                        cena.player.y,
                        projetil.x,
                        projetil.y
                    ) <= 270
                ) {
                    projetil.destroy();
                }
            });
        }

        if (cena.inimigos && cena.inimigos.children) {
            cena.inimigos.children.iterate((inimigo) => {
                if (
                    inimigo
                    && inimigo.active
                    && !inimigo.getData('morto')
                    && Phaser.Math.Distance.Between(
                        cena.player.x,
                        cena.player.y,
                        inimigo.x,
                        inimigo.y
                    ) <= raioInimigo
                ) {
                    cena.atingirInimigo(inimigo, dano);
                }
            });
        }

        if (
            cena.bossAtivo
            && cena.boss
            && cena.boss.active
            && Phaser.Math.Distance.Between(
                cena.player.x,
                cena.player.y,
                cena.boss.x,
                cena.boss.y
            ) <= 190
        ) {
            cena.atingirBoss(1);
        }

        tocar('ataque');
        if (cena.cameras && cena.cameras.main) {
            cena.cameras.main.shake(180, 0.006);
        }
        if (cena.hudJogo) {
            cena.hudJogo.mostrarMensagem('PULSO DE ENERGIA', 800);
        }

        cena.__MIGUEL_PHASE1_POWER_USE_COUNT__ = (
            Number(cena.__MIGUEL_PHASE1_POWER_USE_COUNT__ || 0) + 1
        );
        return true;
    };

    const aplicarEscudo = (cena, estado) => {
        if (
            !possuiItem(estado.inventario, 'escudoIonico')
            || typeof cena.aplicarDano !== 'function'
            || cena.__MIGUEL_ESCUDO_DAMAGE_WRAPPER__
        ) {
            return;
        }

        const original = cena.aplicarDano;
        const wrapper = function aplicarDanoComEscudo(
            dano,
            origem,
            direcao = 0,
            impulsoY = -200
        ) {
            const reduzido = Math.max(1, Math.round(Number(dano || 1) * 0.82));
            return original.call(this, reduzido, origem, direcao, impulsoY);
        };

        cena.__MIGUEL_ESCUDO_DAMAGE_ORIGINAL__ = original;
        cena.__MIGUEL_ESCUDO_DAMAGE_WRAPPER__ = wrapper;
        cena.aplicarDano = wrapper;
    };

    const anexar = (cena) => {
        if (
            !cena
            || !cena.sys
            || !cena.sys.isActive()
            || cena.__MIGUEL_EXPLORATION_LOOT_APPLIED__
            || !cena.player
            || !cena.controles
        ) {
            return false;
        }

        const estado = {
            inventario: carregarInventario(),
            montado: false,
            proximoPoder: 0,
            ultimoVelocityY: 0,
            hoverboardVisual: criarHoverboardVisual(cena),
            visuaisLaser: []
        };

        cena.registry.set('inventarioMiguel', { ...estado.inventario });
        cena.__MIGUEL_EXPLORATION_LOOT_APPLIED__ = BUILD;
        cena.__MIGUEL_PHASE1_POWER_AVAILABLE__ = true;
        cena.__MIGUEL_PHASE1_POWER_USE_COUNT__ = 0;
        cena.__MIGUEL_HOVERBOARD_STATE__ = estado;

        elevarColetaveis(cena);
        ajustarPlataformas(cena);
        ajustarInimigos(cena);
        const lasers = ajustarLasers(cena);
        estado.visuaisLaser = lasers.map((laser) => criarVisualLaser(cena, laser));
        estado.baus = criarBaus(cena, estado);
        aplicarEscudo(cena, estado);

        const mobile = cena.controles.mobileControls;
        if (mobile && typeof mobile.setPowerUnlocked === 'function') {
            mobile.setPowerUnlocked(true);
        }

        const handler = (time) => {
            if (!cena.sys || !cena.sys.isActive() || !cena.player) return;

            elevarColetaveis(cena);
            estado.visuaisLaser.forEach((visual) => desenharLaser(visual, time));

            if (
                estado.montado
                && (
                    cena.player.estaAgachado
                    || cena.player.estaMachucado
                    || !possuiItem(estado.inventario, 'hoverboard')
                )
            ) {
                desmontarHoverboard(cena, estado, false);
            }

            if (estado.montado) {
                estado.hoverboardVisual
                    .setVisible(true)
                    .setPosition(
                        cena.player.x,
                        cena.player.y + 58 + Math.sin(time / 120) * 2
                    )
                    .setFlipX(cena.player.flipX);

                const velocidadeX = Number(cena.player.body.velocity.x || 0);
                if (
                    Math.abs(velocidadeX) > 10
                    && !cena.player.estaMachucado
                    && !cena.player.estaAgachado
                ) {
                    cena.player.setVelocityX(
                        Phaser.Math.Clamp(velocidadeX * 1.24, -300, 300)
                    );
                }
            } else {
                estado.hoverboardVisual.setVisible(false);
            }

            const podeUsarPoder = time >= estado.proximoPoder;
            if (mobile && typeof mobile.setPowerUnlocked === 'function') {
                mobile.setPowerUnlocked(podeUsarPoder || possuiItem(estado.inventario, 'hoverboard'));
            }

            if (
                typeof cena.controles.consumirPoder === 'function'
                && cena.controles.consumirPoder()
            ) {
                const eixoY = typeof cena.controles.obterMovimentoY === 'function'
                    ? Number(cena.controles.obterMovimentoY())
                    : 0;

                if (
                    eixoY > 0.55
                    && possuiItem(estado.inventario, 'hoverboard')
                ) {
                    if (estado.montado) {
                        desmontarHoverboard(cena, estado);
                    } else {
                        montarHoverboard(cena, estado);
                    }
                } else {
                    executarPoder(cena, estado, time);
                }
            }

            if (
                !estado.montado
                && possuiItem(estado.inventario, 'hoverboard')
                && estado.inventario.bausAbertos.includes('fase1-bau-1')
                && cena.player.body
                && (cena.player.body.blocked.down || cena.player.body.touching.down)
                && !cena.player.estaAgachado
                && !cena.player.estaMachucado
                && cena.__MIGUEL_HOVERBOARD_AUTO_MOUNTED__ !== true
            ) {
                cena.__MIGUEL_HOVERBOARD_AUTO_MOUNTED__ = true;
                montarHoverboard(cena, estado, false);
            }
        };

        cena.events.on('postupdate', handler);
        cena.events.once('shutdown', () => {
            cena.events.off('postupdate', handler);

            estado.visuaisLaser.forEach((visual) => {
                if (visual.grafico && visual.grafico.active) visual.grafico.destroy();
            });

            if (estado.hoverboardVisual.active) {
                estado.hoverboardVisual.destroy(true);
            }

            if (
                cena.__MIGUEL_ESCUDO_DAMAGE_WRAPPER__
                && cena.aplicarDano === cena.__MIGUEL_ESCUDO_DAMAGE_WRAPPER__
            ) {
                cena.aplicarDano = cena.__MIGUEL_ESCUDO_DAMAGE_ORIGINAL__;
            }

            delete cena.__MIGUEL_ESCUDO_DAMAGE_ORIGINAL__;
            delete cena.__MIGUEL_ESCUDO_DAMAGE_WRAPPER__;
            delete cena.__MIGUEL_EXPLORATION_LOOT_APPLIED__;
            delete cena.__MIGUEL_HOVERBOARD_STATE__;

            if (runtime.cena === cena) runtime.cena = null;
        });

        runtime.cena = cena;
        console.info('[FASE 1 EXPLORAÇÃO]', BUILD, 'aplicado');
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

        const cena = game.scene.getScene('Fase1');
        if (cena && cena.sys && cena.sys.isActive()) {
            anexar(cena);
        }
    };

    runtime.intervalo = window.setInterval(procurar, 90);
    window.addEventListener('load', procurar, { once: true });
})();
