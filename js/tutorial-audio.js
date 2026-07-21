(() => {
    const BUILD = 'tutorial-audio-feedback-v1-20260721';

    const runtime = {
        intervalo: null,
        cenaTutorial: null,
        cenaResultado: null,
        restauradores: [],

        restaurar() {
            while (this.restauradores.length > 0) {
                const restaurar = this.restauradores.pop();
                try {
                    restaurar();
                } catch (erro) {
                    console.debug('[TUTORIAL AUDIO] falha ao restaurar integração', erro);
                }
            }
        },

        encerrar() {
            if (this.intervalo !== null) {
                clearInterval(this.intervalo);
                this.intervalo = null;
            }

            this.restaurar();
            this.cenaTutorial = null;
            this.cenaResultado = null;
        }
    };

    const anterior = window.__MIGUEL_TUTORIAL_AUDIO_RUNTIME__;
    if (anterior && typeof anterior.encerrar === 'function') {
        anterior.encerrar();
    }

    window.__MIGUEL_TUTORIAL_AUDIO_BUILD__ = BUILD;
    window.__MIGUEL_TUTORIAL_AUDIO_RUNTIME__ = runtime;

    const audio = () => window.MIGUEL_AUDIO_MANAGER || null;

    const tocar = (nome) => {
        const gerente = audio();
        if (
            gerente
            && typeof gerente.tocarEfeito === 'function'
        ) {
            gerente.tocarEfeito(nome);
        }
    };

    const iniciarMusica = (tema) => {
        const gerente = audio();
        if (
            gerente
            && typeof gerente.iniciarMusica === 'function'
        ) {
            gerente.iniciarMusica(tema);
        }
    };

    const pararMusicaTutorial = () => {
        const gerente = audio();
        if (
            gerente
            && gerente.temaAtual === 'tutorial'
            && typeof gerente.pararMusica === 'function'
        ) {
            gerente.pararMusica();
        }
    };

    const substituirMetodo = (alvo, nome, criarWrapper) => {
        if (!alvo || typeof alvo[nome] !== 'function') {
            return false;
        }

        const original = alvo[nome];
        const wrapper = criarWrapper(original);

        if (typeof wrapper !== 'function') {
            return false;
        }

        alvo[nome] = wrapper;
        runtime.restauradores.push(() => {
            if (alvo[nome] === wrapper) {
                alvo[nome] = original;
            }
        });

        return true;
    };

    const anexarTutorial = (cena) => {
        if (
            !cena
            || !cena.events
            || runtime.cenaTutorial === cena
            || cena.__miguelTutorialAudioBuild === BUILD
        ) {
            return;
        }

        runtime.restaurar();
        runtime.cenaTutorial = cena;
        cena.__miguelTutorialAudioBuild = BUILD;

        substituirMetodo(
            cena,
            'executarPulo',
            (original) => function executarPuloComAudio(noChao) {
                const pulosAntes = Number(
                    this.player
                    && this.player.pulosDisponiveis
                );

                const resultado = original.apply(this, arguments);

                if (noChao) {
                    tocar('pulo');
                } else if (
                    Number.isFinite(pulosAntes)
                    && pulosAntes > 0
                    && this.player
                    && this.player.pulosDisponiveis === 0
                ) {
                    tocar('puloDuplo');
                }

                return resultado;
            }
        );

        substituirMetodo(
            cena,
            'executarAtaque',
            (original) => function executarAtaqueComAudio() {
                const atacandoAntes = Boolean(
                    this.player
                    && this.player.estaAtacando
                );

                const resultado = original.apply(this, arguments);

                if (
                    !atacandoAntes
                    && this.player
                    && this.player.estaAtacando
                ) {
                    tocar('ataque');
                }

                return resultado;
            }
        );

        substituirMetodo(
            cena,
            'coletarCristal',
            (original) => function coletarCristalComAudio(player, cristal) {
                const estavaAtivo = Boolean(cristal && cristal.active);
                const resultado = original.apply(this, arguments);

                if (
                    estavaAtivo
                    && cristal
                    && !cristal.active
                ) {
                    tocar('coletar');
                }

                return resultado;
            }
        );

        substituirMetodo(
            cena,
            'tocarPoeira',
            (original) => function tocarPoeiraComAudio() {
                const estavaEmPoeira = Boolean(
                    this.player
                    && this.player.estaEmPoeira
                );

                const resultado = original.apply(this, arguments);

                if (
                    !estavaEmPoeira
                    && this.player
                    && this.player.estaEmPoeira
                ) {
                    tocar('aterrissar');
                }

                return resultado;
            }
        );

        substituirMetodo(
            cena,
            'entrarAgachamento',
            (original) => function entrarAgachamentoComAudio() {
                const estavaAgachado = Boolean(
                    this.player
                    && this.player.estaAgachado
                );

                const resultado = original.apply(this, arguments);

                if (
                    !estavaAgachado
                    && this.player
                    && this.player.estaAgachado
                ) {
                    tocar('agachar');
                }

                return resultado;
            }
        );

        substituirMetodo(
            cena,
            'destruirVilao',
            (original) => function destruirVilaoComAudio(vilao) {
                const estavaAtivo = Boolean(vilao && vilao.active);
                const resultado = original.apply(this, arguments);

                if (
                    estavaAtivo
                    && vilao
                    && vilao.body
                    && vilao.body.enable === false
                ) {
                    tocar('inimigoDerrotado');
                }

                return resultado;
            }
        );

        if (
            cena.sistemaVida
            && typeof cena.sistemaVida.receberDano === 'function'
        ) {
            substituirMetodo(
                cena.sistemaVida,
                'receberDano',
                (original) => function receberDanoComAudio() {
                    const vidaAntes = Number(this.vida);
                    const resultado = original.apply(this, arguments);

                    if (
                        resultado === true
                        && Number(this.vida) < vidaAntes
                    ) {
                        tocar('dano');
                    }

                    return resultado;
                }
            );
        }

        iniciarMusica('tutorial');

        cena.events.once(
            Phaser.Scenes.Events.SHUTDOWN,
            () => {
                if (runtime.cenaTutorial === cena) {
                    runtime.restaurar();
                    runtime.cenaTutorial = null;
                }

                pararMusicaTutorial();
            }
        );

        console.info('[TUTORIAL AUDIO]', BUILD, 'anexado');
    };

    const anexarResultado = (cena) => {
        if (
            !cena
            || runtime.cenaResultado === cena
            || cena.__miguelTutorialResultadoAudioBuild === BUILD
        ) {
            return;
        }

        runtime.cenaResultado = cena;
        cena.__miguelTutorialResultadoAudioBuild = BUILD;

        pararMusicaTutorial();
        tocar('vitoria');
        iniciarMusica('vitoria');

        if (cena.events) {
            cena.events.once(
                Phaser.Scenes.Events.SHUTDOWN,
                () => {
                    const gerente = audio();
                    if (
                        gerente
                        && gerente.temaAtual === 'vitoria'
                        && typeof gerente.pararMusica === 'function'
                    ) {
                        gerente.pararMusica();
                    }

                    if (runtime.cenaResultado === cena) {
                        runtime.cenaResultado = null;
                    }
                }
            );
        }

        console.info('[TUTORIAL AUDIO]', BUILD, 'resultado anexado');
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

        const tutorial = game.scene.getScene('Tutorial');
        if (
            tutorial
            && tutorial.sys
            && tutorial.sys.isActive()
        ) {
            anexarTutorial(tutorial);
        }

        const resultado = game.scene.getScene('ResultadoTutorial');
        if (
            resultado
            && resultado.sys
            && resultado.sys.isActive()
        ) {
            anexarResultado(resultado);
        }
    };

    runtime.intervalo = setInterval(procurar, 100);
    addEventListener('load', procurar, { once: true });
})();