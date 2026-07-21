(() => {
    const BUILD = 'phase1-crouch-guard-v1-20260721';

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

    const anterior = window.__MIGUEL_PHASE1_CROUCH_GUARD_RUNTIME__;
    if (anterior && typeof anterior.encerrar === 'function') {
        anterior.encerrar();
    }

    window.__MIGUEL_PHASE1_CROUCH_GUARD_BUILD__ = BUILD;
    window.__MIGUEL_PHASE1_CROUCH_GUARD_RUNTIME__ = runtime;

    const estaSolicitandoAgachamento = (cena) => {
        if (
            !cena
            || !cena.player
            || !cena.player.estaAgachado
            || cena.player.estaMachucado
            || cena.player.estaAtacando
            || !cena.controles
            || typeof cena.controles.estaAgachando !== 'function'
        ) {
            return false;
        }

        const eixoX = (
            typeof cena.controles.obterMovimentoX === 'function'
                ? Number(cena.controles.obterMovimentoX())
                : 0
        );

        return Boolean(
            cena.controles.estaAgachando()
            && Math.abs(Number.isFinite(eixoX) ? eixoX : 0) < 0.3
        );
    };

    const anexar = (cena) => {
        if (
            !cena
            || !cena.sys
            || !cena.sys.isActive()
            || cena.__MIGUEL_PHASE1_CROUCH_GUARD_APPLIED__
            || typeof cena.sairAgachamento !== 'function'
        ) {
            return false;
        }

        const original = cena.sairAgachamento;

        const wrapper = function sairAgachamentoEstavel(forcar = false) {
            if (!forcar && estaSolicitandoAgachamento(this)) {
                const corpo = this.player && this.player.body;

                if (corpo) {
                    corpo.allowGravity = false;
                    this.player.setVelocityY(0);
                }

                if (typeof this.sincronizarAgachamento === 'function') {
                    this.sincronizarAgachamento();
                }

                this.__MIGUEL_CROUCH_EXIT_SUPPRESSED_COUNT__ = (
                    Number(this.__MIGUEL_CROUCH_EXIT_SUPPRESSED_COUNT__ || 0)
                    + 1
                );

                return;
            }

            return original.apply(this, arguments);
        };

        cena.sairAgachamento = wrapper;
        cena.__MIGUEL_PHASE1_CROUCH_GUARD_APPLIED__ = BUILD;
        cena.__MIGUEL_CROUCH_EXIT_SUPPRESSED_COUNT__ = 0;
        runtime.cena = cena;

        cena.events.once('shutdown', () => {
            if (cena.sairAgachamento === wrapper) {
                cena.sairAgachamento = original;
            }

            delete cena.__MIGUEL_PHASE1_CROUCH_GUARD_APPLIED__;

            if (runtime.cena === cena) {
                runtime.cena = null;
            }
        });

        console.info('[FASE 1 AGACHAMENTO]', BUILD, 'aplicado');
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

    runtime.intervalo = window.setInterval(procurar, 80);
    window.addEventListener('load', procurar, { once: true });
})();
