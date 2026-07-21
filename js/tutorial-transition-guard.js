(() => {
    const BUILD = 'tutorial-transition-guard-v1-20260721';
    const ATRASO_FORCADO = 1800;

    const anterior = window.__MIGUEL_TUTORIAL_TRANSITION_GUARD_RUNTIME__;
    if (anterior && typeof anterior.encerrar === 'function') {
        anterior.encerrar();
    }

    const runtime = {
        intervalo: null,
        cena: null,
        conclusaoDetectadaEm: null,
        forçando: false,

        resetar() {
            this.cena = null;
            this.conclusaoDetectadaEm = null;
            this.forçando = false;
        },

        encerrar() {
            if (this.intervalo !== null) {
                window.clearInterval(this.intervalo);
                this.intervalo = null;
            }
            this.resetar();
        }
    };

    window.__MIGUEL_TUTORIAL_TRANSITION_GUARD_BUILD__ = BUILD;
    window.__MIGUEL_TUTORIAL_TRANSITION_GUARD_RUNTIME__ = runtime;

    const resultadoAtivo = (game) => {
        if (!game || !game.scene || typeof game.scene.getScene !== 'function') {
            return false;
        }

        const resultado = game.scene.getScene('ResultadoTutorial');
        return Boolean(
            resultado
            && resultado.sys
            && resultado.sys.isActive()
        );
    };

    const registrar = (dados) => {
        window.__MIGUEL_TUTORIAL_TRANSITION_GUARD_LAST__ = {
            build: BUILD,
            instante: Date.now(),
            ...dados
        };
    };

    const forcarResultado = (game, cena) => {
        if (
            runtime.forçando
            || !game
            || !game.scene
            || !cena
            || !cena.sys
            || !cena.sys.isActive()
        ) {
            return;
        }

        runtime.forçando = true;

        try {
            game.registry.set('tutorialConcluido', true);
        } catch (erro) {
            console.error('[TUTORIAL GUARD] falha ao salvar conclusão', erro);
        }

        try {
            if (
                cena.controles
                && typeof cena.controles.resetarEstado === 'function'
            ) {
                cena.controles.resetarEstado();
            }
        } catch (erro) {
            console.error('[TUTORIAL GUARD] falha ao limpar controles', erro);
        }

        try {
            if (cena.tutorial) {
                cena.tutorial.transicaoFinalExecutada = true;
            }
            cena.transicaoTutorialEmAndamento = true;
        } catch (erro) {
            console.debug('[TUTORIAL GUARD] estado de transição indisponível', erro);
        }

        let solicitada = false;

        try {
            if (cena.scene && typeof cena.scene.start === 'function') {
                cena.scene.start('ResultadoTutorial');
                solicitada = true;
            }
        } catch (erro) {
            console.error('[TUTORIAL GUARD] ScenePlugin falhou', erro);
        }

        if (!solicitada) {
            try {
                if (typeof game.scene.stop === 'function') {
                    game.scene.stop('Tutorial');
                }
                game.scene.start('ResultadoTutorial');
                solicitada = true;
            } catch (erro) {
                console.error('[TUTORIAL GUARD] SceneManager falhou', erro);
            }
        }

        registrar({
            forçado: true,
            solicitada,
            resultadoAtivo: resultadoAtivo(game)
        });

        console.warn(
            '[TUTORIAL GUARD]',
            'transição de recuperação solicitada',
            { solicitada }
        );

        window.setTimeout(() => {
            if (resultadoAtivo(game)) {
                runtime.resetar();
                return;
            }

            try {
                if (typeof game.scene.stop === 'function') {
                    game.scene.stop('Tutorial');
                }
                game.scene.start('ResultadoTutorial');
            } catch (erro) {
                runtime.forçando = false;
                console.error('[TUTORIAL GUARD] segunda tentativa falhou', erro);
            }
        }, 450);
    };

    const verificar = () => {
        const game = window.__MIGUEL_GAME__;
        if (!game || !game.scene || typeof game.scene.getScene !== 'function') {
            return;
        }

        if (resultadoAtivo(game)) {
            runtime.resetar();
            return;
        }

        const cena = game.scene.getScene('Tutorial');
        const ativa = Boolean(
            cena
            && cena.sys
            && cena.sys.isActive()
        );

        if (!ativa) {
            runtime.resetar();
            return;
        }

        const concluido = Boolean(
            cena.tutorial
            && cena.tutorial.concluido
        );

        if (!concluido) {
            if (runtime.cena !== cena) runtime.resetar();
            runtime.cena = cena;
            return;
        }

        if (runtime.cena !== cena || runtime.conclusaoDetectadaEm === null) {
            runtime.cena = cena;
            runtime.conclusaoDetectadaEm = performance.now();
            runtime.forçando = false;
            registrar({ forçado: false, detectado: true });
            return;
        }

        if (
            !runtime.forçando
            && performance.now() - runtime.conclusaoDetectadaEm >= ATRASO_FORCADO
        ) {
            forcarResultado(game, cena);
        }
    };

    runtime.intervalo = window.setInterval(verificar, 100);
    window.addEventListener('load', verificar, { once: true });
})();
