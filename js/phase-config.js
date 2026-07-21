(() => {
    const fases = {
        Tutorial: Object.freeze({
            id: 'tutorial',
            scene: 'Tutorial',

            titulo: 'Treinamento do Herói',
            tipo: 'tutorial',

            orientacao: 'landscape',

            tamanhoLogico: Object.freeze({
                width: 800,
                height: 600
            }),

            tema: 'ceu-tecnologico-noturno',

            controles: Object.freeze([
                'movimento',
                'pulo',
                'pulo-duplo',
                'agachamento',
                'ataque'
            ]),

            camadasDinamicas: Object.freeze([
                'nuvens',
                'cristais',
                'robo-patrulha'
            ]),

            objetivos: Object.freeze([
                'aprender-movimento',
                'aprender-pulo',
                'aprender-pulo-duplo',
                'aprender-agachamento',
                'aprender-dano',
                'aprender-ataque',
                'coletar-cristais'
            ]),

            proximaCena:
                'ResultadoTutorial'
        }),

        ResultadoTutorial: Object.freeze({
            id: 'resultado-tutorial',
            scene: 'ResultadoTutorial',

            titulo: 'Treinamento Concluído',
            tipo: 'resultado',

            orientacao: 'landscape',

            tamanhoLogico: Object.freeze({
                width: 800,
                height: 600
            }),

            tema: 'resultado-noturno',

            controles: Object.freeze([
                'continuar',
                'voltar-menu'
            ]),

            camadasDinamicas:
                Object.freeze([]),

            proximaCena: 'Fase1'
        }),

        Fase1: Object.freeze({
            id: 'fase-1',
            scene: 'Fase1',

            titulo: 'Primeira Aventura',
            tipo: 'fase',

            orientacao: 'landscape',

            tamanhoLogico: Object.freeze({
                width: 800,
                height: 600
            }),

            tema: 'mundo-1',

            controles: Object.freeze([
                'movimento',
                'pulo',
                'pulo-duplo',
                'agachamento',
                'ataque',
                'pausa'
            ]),

            camadasDinamicas: Object.freeze([
                'cenario',
                'plataformas',
                'inimigos',
                'coletaveis',
                'chefe'
            ]),

            objetivos: Object.freeze([
                'atravessar-fase',
                'coletar-itens',
                'derrotar-chefe'
            ]),

            proximaCena:
                'ResultadoFase1'
        })
    };

    const modelos = {
        horizontal: Object.freeze({
            orientacao: 'landscape',

            tamanhoLogico: Object.freeze({
                width: 960,
                height: 540
            }),

            usos: Object.freeze([
                'plataforma',
                'perseguicao',
                'combate',
                'corrida'
            ])
        }),

        vertical: Object.freeze({
            orientacao: 'portrait',

            tamanhoLogico: Object.freeze({
                width: 540,
                height: 960
            }),

            usos: Object.freeze([
                'escalada',
                'queda',
                'torre',
                'desafio-vertical'
            ])
        }),

        livre: Object.freeze({
            orientacao: 'any',

            tamanhoLogico: Object.freeze({
                width: 800,
                height: 600
            }),

            usos: Object.freeze([
                'menu',
                'mapa',
                'resultado'
            ])
        })
    };

    window.MIGUEL_PHASE_CONFIG = Object.freeze({
        versao: 3,

        fases: Object.freeze(fases),

        modelos: Object.freeze(modelos)
    });
})();

/*
 * Comportamento estável do robô do tutorial.
 *
 * Esta camada substitui a máquina experimental de IDLE/ALERTA
 * sem alterar os contratos de dano, explosão ou tutorial.
 */
(() => {
    const BUILD = 'robot-patrol-chase-v2-20260720';

    const CONFIGURACAO = Object.freeze({
        velocidadeRonda: 90,
        velocidadePerseguicao: 120,
        distanciaDeteccao: 230,
        distanciaPerdaAlvo: 310,
        distanciaParada: 82,
        distanciaRetomada: 104
    });

    const runtimeAnterior = (
        window.__MIGUEL_ROBOT_BEHAVIOR_RUNTIME__
    );

    if (
        runtimeAnterior
        && typeof runtimeAnterior.encerrar === 'function'
    ) {
        runtimeAnterior.encerrar();
    }

    const runtime = {
        intervalo: null,
        cena: null,
        manipulador: null,

        encerrar() {
            if (this.intervalo !== null) {
                window.clearInterval(this.intervalo);
                this.intervalo = null;
            }

            if (
                this.cena
                && this.manipulador
                && this.cena.events
            ) {
                this.cena.events.off(
                    'postupdate',
                    this.manipulador
                );
            }

            this.cena = null;
            this.manipulador = null;
        }
    };

    window.__MIGUEL_ROBOT_BEHAVIOR_BUILD__ = BUILD;
    window.__MIGUEL_ROBOT_BEHAVIOR_RUNTIME__ = runtime;

    const animacaoPossuiPrioridade = (vilao) => {
        const animacaoAtual = (
            vilao.anims
            && vilao.anims.currentAnim
            ? vilao.anims.currentAnim.key
            : null
        );

        return Boolean(
            animacaoAtual === 'robo_damage'
            || animacaoAtual === 'robo_explosion'
        );
    };

    const tocarPatrulha = (vilao) => {
        const atual = (
            vilao.anims
            && vilao.anims.currentAnim
            ? vilao.anims.currentAnim.key
            : null
        );

        if (atual !== 'robo_patrol') {
            vilao.anims.play(
                'robo_patrol',
                true
            );
        }
    };

    const mostrarParadoNormal = (vilao) => {
        vilao.anims.stop();
        vilao.setTexture('robo_idle_1');
        vilao.setVelocityX(0);
    };

    const iniciarRonda = (vilao) => {
        vilao.estadoComportamentoV2 = 'RONDA';
        vilao.alvoProximoV2 = false;

        if (
            vilao.direcao !== -1
            && vilao.direcao !== 1
        ) {
            vilao.direcao = 1;
        }

        tocarPatrulha(vilao);
    };

    const atualizarRonda = (vilao, player) => {
        const distanciaX = Math.abs(
            player.x - vilao.x
        );

        if (
            distanciaX
            <= CONFIGURACAO.distanciaDeteccao
        ) {
            vilao.estadoComportamentoV2 =
                'PERSEGUICAO';
            vilao.alvoProximoV2 = false;
            return;
        }

        if (
            vilao.x
            <= vilao.limiteEsquerda
        ) {
            vilao.x = vilao.limiteEsquerda;
            vilao.direcao = 1;
        } else if (
            vilao.x
            >= vilao.limiteDireita
        ) {
            vilao.x = vilao.limiteDireita;
            vilao.direcao = -1;
        }

        vilao.setFlipX(vilao.direcao < 0);
        tocarPatrulha(vilao);
        vilao.setVelocityX(
            vilao.direcao
            * CONFIGURACAO.velocidadeRonda
        );
    };

    const atualizarPerseguicao = (vilao, player) => {
        const diferencaX = player.x - vilao.x;
        const distanciaX = Math.abs(diferencaX);

        if (
            distanciaX
            > CONFIGURACAO.distanciaPerdaAlvo
        ) {
            iniciarRonda(vilao);
            return;
        }

        const direcaoAlvo = diferencaX < 0 ? -1 : 1;
        vilao.setFlipX(direcaoAlvo < 0);

        if (
            vilao.alvoProximoV2
            && distanciaX
                >= CONFIGURACAO.distanciaRetomada
        ) {
            vilao.alvoProximoV2 = false;
        }

        if (
            !vilao.alvoProximoV2
            && distanciaX
                <= CONFIGURACAO.distanciaParada
        ) {
            vilao.alvoProximoV2 = true;
        }

        if (vilao.alvoProximoV2) {
            mostrarParadoNormal(vilao);
            return;
        }

        const bloqueadoNaEsquerda = Boolean(
            direcaoAlvo < 0
            && vilao.x <= vilao.limiteEsquerda
        );

        const bloqueadoNaDireita = Boolean(
            direcaoAlvo > 0
            && vilao.x >= vilao.limiteDireita
        );

        if (
            bloqueadoNaEsquerda
            || bloqueadoNaDireita
        ) {
            mostrarParadoNormal(vilao);
            return;
        }

        tocarPatrulha(vilao);
        vilao.setVelocityX(
            direcaoAlvo
            * CONFIGURACAO.velocidadePerseguicao
        );
    };

    const atualizar = (cena) => {
        const vilao = cena.vilao;
        const player = cena.player;

        if (
            !vilao
            || !vilao.active
            || !vilao.body
            || !vilao.body.enable
            || !player
            || !player.active
        ) {
            return;
        }

        if (animacaoPossuiPrioridade(vilao)) {
            vilao.setVelocityX(0);
            return;
        }

        if (
            vilao.estadoComportamentoV2
            !== 'RONDA'
            && vilao.estadoComportamentoV2
                !== 'PERSEGUICAO'
        ) {
            iniciarRonda(vilao);
        }

        if (
            vilao.estadoComportamentoV2
            === 'PERSEGUICAO'
        ) {
            atualizarPerseguicao(vilao, player);
            return;
        }

        atualizarRonda(vilao, player);
    };

    const anexar = (cena) => {
        if (
            !cena
            || !cena.events
            || runtime.cena === cena
        ) {
            return;
        }

        if (
            runtime.cena
            && runtime.manipulador
        ) {
            runtime.cena.events.off(
                'postupdate',
                runtime.manipulador
            );
        }

        /*
         * Neutraliza a máquina experimental incorporada à cena.
         * O controle definitivo ocorre no postupdate, depois da
         * lógica normal do tutorial e antes da renderização.
         */
        cena.atualizarComportamentoRobo = () => {};

        const manipulador = () => {
            atualizar(cena);
        };

        cena.events.on(
            'postupdate',
            manipulador
        );

        cena.events.once(
            'shutdown',
            () => {
                cena.events.off(
                    'postupdate',
                    manipulador
                );

                if (runtime.cena === cena) {
                    runtime.cena = null;
                    runtime.manipulador = null;
                }
            }
        );

        runtime.cena = cena;
        runtime.manipulador = manipulador;

        if (cena.vilao) {
            iniciarRonda(cena.vilao);
        }

        console.info(
            '[ROBOT BEHAVIOR]',
            BUILD,
            'anexado'
        );
    };

    const procurarCena = () => {
        const game = window.__MIGUEL_GAME__;

        if (
            !game
            || !game.scene
            || typeof game.scene.getScene
                !== 'function'
        ) {
            return;
        }

        const cena = game.scene.getScene('Tutorial');

        if (
            cena
            && cena.sys
            && cena.sys.isActive()
        ) {
            anexar(cena);
        }
    };

    runtime.intervalo = window.setInterval(
        procurarCena,
        100
    );

    window.addEventListener(
        'load',
        procurarCena,
        { once: true }
    );
})();
