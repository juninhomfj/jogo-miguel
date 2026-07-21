(() => {
    const BUILD = 'phase1-exploration-compat-v1-20260721';

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

    const anterior = window.__MIGUEL_EXPLORATION_COMPAT_RUNTIME__;
    if (anterior && typeof anterior.encerrar === 'function') {
        anterior.encerrar();
    }

    window.__MIGUEL_EXPLORATION_COMPAT_BUILD__ = BUILD;
    window.__MIGUEL_EXPLORATION_COMPAT_RUNTIME__ = runtime;

    const instalarFlipContainer = () => {
        const Container = (
            window.Phaser
            && Phaser.GameObjects
            && Phaser.GameObjects.Container
        );

        if (!Container || typeof Container.prototype.setFlipX === 'function') {
            return;
        }

        Container.prototype.setFlipX = function setFlipX(ativo) {
            const magnitude = Math.max(0.0001, Math.abs(Number(this.scaleX || 1)));
            this.scaleX = ativo ? -magnitude : magnitude;
            return this;
        };
    };

    const instalarEscudoTardio = (cena, estado) => {
        if (
            !estado.inventario.escudoIonico
            || cena.__MIGUEL_ESCUDO_DAMAGE_WRAPPER__
            || cena.__MIGUEL_ESCUDO_COMPAT_WRAPPER__
            || typeof cena.aplicarDano !== 'function'
        ) {
            return;
        }

        const original = cena.aplicarDano;
        const wrapper = function aplicarDanoComEscudoTardio(
            dano,
            origem,
            direcao = 0,
            impulsoY = -200
        ) {
            const reduzido = Math.max(1, Math.round(Number(dano || 1) * 0.82));
            return original.call(this, reduzido, origem, direcao, impulsoY);
        };

        cena.__MIGUEL_ESCUDO_COMPAT_ORIGINAL__ = original;
        cena.__MIGUEL_ESCUDO_COMPAT_WRAPPER__ = wrapper;
        cena.aplicarDano = wrapper;
    };

    const anexar = (cena) => {
        if (
            !cena
            || !cena.sys
            || !cena.sys.isActive()
            || cena.__MIGUEL_EXPLORATION_COMPAT_APPLIED__
            || !cena.__MIGUEL_HOVERBOARD_STATE__
        ) {
            return false;
        }

        const estado = cena.__MIGUEL_HOVERBOARD_STATE__;
        let hoverboardAnterior = Boolean(estado.inventario.hoverboard);

        cena.__MIGUEL_HOVERBOARD_AUTO_MOUNTED__ = false;
        cena.__MIGUEL_EXPLORATION_COMPAT_APPLIED__ = BUILD;

        const handler = () => {
            if (!cena.sys || !cena.sys.isActive()) return;

            const possuiHoverboard = Boolean(estado.inventario.hoverboard);
            if (!hoverboardAnterior && possuiHoverboard) {
                cena.__MIGUEL_HOVERBOARD_AUTO_MOUNTED__ = true;
            }

            if (estado.montado && possuiHoverboard) {
                cena.__MIGUEL_HOVERBOARD_AUTO_MOUNTED__ = true;
            }

            hoverboardAnterior = possuiHoverboard;
            instalarEscudoTardio(cena, estado);
        };

        cena.events.on('postupdate', handler);
        cena.events.once('shutdown', () => {
            cena.events.off('postupdate', handler);

            if (
                cena.__MIGUEL_ESCUDO_COMPAT_WRAPPER__
                && cena.aplicarDano === cena.__MIGUEL_ESCUDO_COMPAT_WRAPPER__
            ) {
                cena.aplicarDano = cena.__MIGUEL_ESCUDO_COMPAT_ORIGINAL__;
            }

            delete cena.__MIGUEL_ESCUDO_COMPAT_ORIGINAL__;
            delete cena.__MIGUEL_ESCUDO_COMPAT_WRAPPER__;
            delete cena.__MIGUEL_EXPLORATION_COMPAT_APPLIED__;
            delete cena.__MIGUEL_HOVERBOARD_AUTO_MOUNTED__;

            if (runtime.cena === cena) runtime.cena = null;
        });

        runtime.cena = cena;
        return true;
    };

    const procurar = () => {
        instalarFlipContainer();

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

    instalarFlipContainer();
    runtime.intervalo = window.setInterval(procurar, 70);
    window.addEventListener('load', procurar, { once: true });
})();
