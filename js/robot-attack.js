(() => {
    const BUILD = 'robot-attack-projectile-v2-20260721';
    const CFG = Object.freeze({
        ronda: 90,
        perseguicao: 120,
        detectar: 230,
        perder: 310,
        atacar: 190,
        cancelarAtaque: 250,
        parar: 82,
        retomar: 104,
        carregar: 650,
        mostrarDisparo: 140,
        recuperar: 500,
        cooldown: 1800,
        projetil: 240,
        vidaProjetil: 2500,
        dano: 15
    });

    const anterior = window.__MIGUEL_ROBOT_BEHAVIOR_RUNTIME__;
    if (anterior && typeof anterior.encerrar === 'function') {
        anterior.encerrar();
    }

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

    window.__MIGUEL_ROBOT_BEHAVIOR_BUILD__ = BUILD;
    window.__MIGUEL_ROBOT_BEHAVIOR_RUNTIME__ = runtime;

    const animacao = (robo) => (
        robo.anims && robo.anims.currentAnim
            ? robo.anims.currentAnim.key
            : null
    );

    const podeAtacar = (robo) => Boolean(
        robo
        && (
            !robo.capacidades
            || robo.capacidades.atacar !== false
        )
    );

    const patrulhar = (robo) => {
        if (animacao(robo) !== 'robo_patrol') {
            robo.anims.play('robo_patrol', true);
        }
    };

    const mostrar = (robo, textura) => {
        const animacaoAtual = animacao(robo);
        const texturaAtual = robo.texture ? robo.texture.key : null;

        if (animacaoAtual) {
            robo.anims.stop();
        }

        if (texturaAtual !== textura) {
            robo.setTexture(textura);
        }

        if (
            robo.body
            && robo.body.velocity
            && robo.body.velocity.x !== 0
        ) {
            robo.setVelocityX(0);
        }
    };

    const mudar = (robo, estado, agora) => {
        robo.estadoRoboV3 = estado;
        robo.estadoRoboV3Desde = agora;

        if (estado === 'RONDA') {
            robo.alvoProximoV3 = false;
            if (robo.x <= robo.limiteEsquerda) robo.direcao = 1;
            if (robo.x >= robo.limiteDireita) robo.direcao = -1;
            if (robo.direcao !== -1 && robo.direcao !== 1) {
                robo.direcao = 1;
            }
            patrulhar(robo);
            return;
        }

        if (estado === 'PERSEGUICAO') {
            robo.alvoProximoV3 = false;
            patrulhar(robo);
            return;
        }

        if (estado === 'CARREGANDO') {
            mostrar(robo, 'robo_attack_charge');
            return;
        }

        mostrar(robo, 'robo_attack_fire');
    };

    const removerProjeteis = (cena) => {
        if (cena.projeteisRoboV3 && cena.projeteisRoboV3.active) {
            cena.projeteisRoboV3.clear(true, true);
        }
    };

    const garantirProjeteis = (cena) => {
        if (!cena || !cena.physics || !cena.player) {
            return null;
        }

        if (cena.projeteisRoboV3 && cena.projeteisRoboV3.active) {
            return cena.projeteisRoboV3;
        }

        const grupo = cena.physics.add.group({
            allowGravity: false,
            immovable: true,
            maxSize: 4
        });
        cena.projeteisRoboV3 = grupo;

        cena.physics.add.overlap(
            grupo,
            cena.player,
            (projetil, player) => {
                if (!projetil || !projetil.active || !player.active) return;

                const direcao = (
                    projetil.body
                    && projetil.body.velocity.x < 0
                    ? -1
                    : 1
                );

                projetil.destroy();

                if (
                    cena.sistemaVida
                    && typeof cena.sistemaVida.receberDano === 'function'
                ) {
                    cena.sistemaVida.receberDano(CFG.dano, {
                        origem: 'robo-tutorial-projetil',
                        forma: 'projetil',
                        direcao,
                        impulsoX: 200,
                        impulsoY: -140
                    });
                }
            },
            null,
            cena
        );

        if (cena.plataformas) {
            cena.physics.add.collider(
                grupo,
                cena.plataformas,
                (projetil) => {
                    if (projetil && projetil.active) projetil.destroy();
                }
            );
        }

        return grupo;
    };

    const limparProjeteis = (cena, agora) => {
        const grupo = cena.projeteisRoboV3;
        if (!grupo || !grupo.active) return;

        grupo.children.iterate((projetil) => {
            if (!projetil || !projetil.active) return;
            const expirou = Number.isFinite(projetil.criadoEmV3)
                && agora - projetil.criadoEmV3 > CFG.vidaProjetil;
            const fora = projetil.x < -32 || projetil.x > 832
                || projetil.y < -32 || projetil.y > 632;
            if (expirou || fora) projetil.destroy();
        });
    };

    const disparar = (cena, robo, player, agora) => {
        if (
            !podeAtacar(robo)
            || !cena.sys
            || !cena.sys.isActive()
            || !cena.textures
            || !cena.textures.exists('particulaVilao')
        ) {
            return null;
        }

        const grupo = garantirProjeteis(cena);
        if (!grupo) return null;

        const x = robo.x + (robo.flipX ? -54 : 54);
        const y = robo.y - 24;
        const dx = player.x - x;
        const dy = player.y - 18 - y;
        const tamanho = Math.max(1, Math.hypot(dx, dy));
        const projetil = grupo.create(x, y, 'particulaVilao');

        if (!projetil) return null;

        projetil
            .setDepth(13)
            .setScale(1.25)
            .setVelocity(
                (dx / tamanho) * CFG.projetil,
                (dy / tamanho) * CFG.projetil
            );
        projetil.body.allowGravity = false;
        projetil.criadoEmV3 = agora;
        return projetil;
    };

    const ronda = (robo, player, agora) => {
        if (Math.abs(player.x - robo.x) <= CFG.detectar) {
            mudar(robo, 'PERSEGUICAO', agora);
            return;
        }

        if (robo.x <= robo.limiteEsquerda) {
            robo.x = robo.limiteEsquerda;
            robo.direcao = 1;
        } else if (robo.x >= robo.limiteDireita) {
            robo.x = robo.limiteDireita;
            robo.direcao = -1;
        }

        robo.setFlipX(robo.direcao < 0);
        patrulhar(robo);
        robo.setVelocityX(robo.direcao * CFG.ronda);
    };

    const perseguir = (robo, player, agora) => {
        const dx = player.x - robo.x;
        const distancia = Math.abs(dx);
        const direcao = dx < 0 ? -1 : 1;

        if (distancia > CFG.perder) {
            mudar(robo, 'RONDA', agora);
            return;
        }

        robo.setFlipX(direcao < 0);

        if (
            podeAtacar(robo)
            && distancia <= CFG.atacar
            && agora >= (robo.proximoAtaqueV3 || 0)
        ) {
            mudar(robo, 'CARREGANDO', agora);
            return;
        }

        if (robo.alvoProximoV3 && distancia >= CFG.retomar) {
            robo.alvoProximoV3 = false;
        }
        if (!robo.alvoProximoV3 && distancia <= CFG.parar) {
            robo.alvoProximoV3 = true;
        }
        if (robo.alvoProximoV3) {
            mostrar(robo, 'robo_idle_1');
            return;
        }

        const bloqueado = (direcao < 0 && robo.x <= robo.limiteEsquerda)
            || (direcao > 0 && robo.x >= robo.limiteDireita);
        if (bloqueado) {
            mostrar(robo, 'robo_idle_1');
            return;
        }

        patrulhar(robo);
        robo.setVelocityX(direcao * CFG.perseguicao);
    };

    const carregar = (cena, robo, player, agora) => {
        if (!podeAtacar(robo)) {
            removerProjeteis(cena);
            robo.proximoAtaqueV3 = Number.POSITIVE_INFINITY;
            mudar(robo, 'PERSEGUICAO', agora);
            return;
        }

        const dx = player.x - robo.x;
        const distancia = Math.abs(dx);
        robo.setFlipX(dx < 0);
        robo.setVelocityX(0);

        if (distancia > CFG.cancelarAtaque) {
            mudar(robo, 'PERSEGUICAO', agora);
            return;
        }

        if (agora - robo.estadoRoboV3Desde < CFG.carregar) {
            mostrar(robo, 'robo_attack_charge');
            return;
        }

        mostrar(robo, 'robo_attack_fire');
        const projetil = disparar(cena, robo, player, agora);

        if (!projetil) {
            robo.proximoAtaqueV3 = agora + CFG.cooldown;
            mudar(robo, 'PERSEGUICAO', agora);
            return;
        }

        robo.proximoAtaqueV3 = agora + CFG.cooldown;
        mudar(robo, 'RECUPERACAO', agora);
    };

    const recuperar = (robo, player, agora) => {
        const tempo = agora - robo.estadoRoboV3Desde;
        robo.setFlipX(player.x < robo.x);

        if (tempo < CFG.mostrarDisparo) {
            mostrar(robo, 'robo_attack_fire');
            return;
        }
        if (tempo < CFG.recuperar) {
            mostrar(robo, 'robo_attack_recover');
            return;
        }

        mudar(
            robo,
            Math.abs(player.x - robo.x) > CFG.perder
                ? 'RONDA'
                : 'PERSEGUICAO',
            agora
        );
    };

    const atualizar = (cena, time) => {
        const agora = Number.isFinite(time)
            ? time
            : (cena.time ? cena.time.now : performance.now());
        limparProjeteis(cena, agora);

        const robo = cena.vilao;
        const player = cena.player;
        if (
            !robo || !robo.active || !robo.body || !robo.body.enable
            || !player || !player.active
        ) {
            removerProjeteis(cena);
            return;
        }

        if (!podeAtacar(robo)) {
            removerProjeteis(cena);
            robo.proximoAtaqueV3 = Number.POSITIVE_INFINITY;

            if (
                robo.estadoRoboV3 === 'CARREGANDO'
                || robo.estadoRoboV3 === 'RECUPERACAO'
            ) {
                mudar(robo, 'PERSEGUICAO', agora);
            }
        }

        const atual = animacao(robo);
        if (atual === 'robo_explosion') {
            robo.setVelocityX(0);
            return;
        }
        if (atual === 'robo_damage') {
            robo.setVelocityX(0);
            robo.estadoRoboV3 = 'PERSEGUICAO';
            robo.proximoAtaqueV3 = podeAtacar(robo)
                ? Math.max(robo.proximoAtaqueV3 || 0, agora + 600)
                : Number.POSITIVE_INFINITY;
            return;
        }

        if (!robo.estadoRoboV3) {
            robo.proximoAtaqueV3 = podeAtacar(robo)
                ? 0
                : Number.POSITIVE_INFINITY;
            mudar(robo, 'RONDA', agora);
        }

        if (robo.estadoRoboV3 === 'CARREGANDO') {
            carregar(cena, robo, player, agora);
        } else if (robo.estadoRoboV3 === 'RECUPERACAO') {
            recuperar(robo, player, agora);
        } else if (robo.estadoRoboV3 === 'PERSEGUICAO') {
            perseguir(robo, player, agora);
        } else {
            ronda(robo, player, agora);
        }
    };

    const falhaSegura = (cena, erro) => {
        console.error('[ROBOT BEHAVIOR] atualização interrompida com segurança', erro);
        removerProjeteis(cena);

        const robo = cena && cena.vilao;
        if (!robo || !robo.active) return;

        robo.proximoAtaqueV3 = Number.POSITIVE_INFINITY;
        robo.estadoRoboV3 = 'RONDA';
        robo.estadoRoboV3Desde = cena.time ? cena.time.now : 0;
        robo.setVelocityX(0);

        if (robo.anims) {
            patrulhar(robo);
        }
    };

    const anexar = (cena) => {
        if (!cena || !cena.events || runtime.cena === cena) return;

        if (runtime.cena && runtime.handler) {
            runtime.cena.events.off('postupdate', runtime.handler);
        }

        cena.atualizarComportamentoRobo = () => {};
        const handler = (time) => {
            try {
                atualizar(cena, time);
            } catch (erro) {
                falhaSegura(cena, erro);
            }
        };
        cena.events.on('postupdate', handler);
        cena.events.once('shutdown', () => {
            cena.events.off('postupdate', handler);
            removerProjeteis(cena);
            if (runtime.cena === cena) {
                runtime.cena = null;
                runtime.handler = null;
            }
        });

        runtime.cena = cena;
        runtime.handler = handler;

        if (cena.vilao && podeAtacar(cena.vilao)) {
            garantirProjeteis(cena);
        } else {
            removerProjeteis(cena);
        }

        if (cena.vilao) {
            cena.vilao.proximoAtaqueV3 = podeAtacar(cena.vilao)
                ? 0
                : Number.POSITIVE_INFINITY;
            mudar(cena.vilao, 'RONDA', cena.time ? cena.time.now : 0);
        }

        console.info('[ROBOT BEHAVIOR]', BUILD, 'anexado');
    };

    const procurar = () => {
        const game = window.__MIGUEL_GAME__;
        if (!game || !game.scene || typeof game.scene.getScene !== 'function') {
            return;
        }
        const cena = game.scene.getScene('Tutorial');
        if (cena && cena.sys && cena.sys.isActive()) anexar(cena);
    };

    runtime.intervalo = setInterval(procurar, 100);
    addEventListener('load', procurar, { once: true });
})();
