(() => {
    const BUILD = 'mobile-controls-compat-v1-20260721';
    let intervalo = null;
    let tentativas = 0;

    const aplicar = () => {
        const Classe = window.MiguelMobileControls;

        if (!Classe || !Classe.prototype) {
            return false;
        }

        const prototipo = Classe.prototype;

        if (
            typeof prototipo.destroy !== 'function'
            && typeof prototipo.destruir === 'function'
        ) {
            Object.defineProperty(
                prototipo,
                'destroy',
                {
                    configurable: true,
                    writable: true,
                    value: function destroy() {
                        return this.destruir();
                    }
                }
            );
        }

        window.__MIGUEL_MOBILE_CONTROLS_COMPAT_BUILD__ = BUILD;

        if (intervalo !== null) {
            window.clearInterval(intervalo);
            intervalo = null;
        }

        console.info('[MOBILE CONTROLS COMPAT]', BUILD, 'aplicado');
        return true;
    };

    if (!aplicar()) {
        intervalo = window.setInterval(() => {
            tentativas += 1;

            if (aplicar()) return;

            if (tentativas >= 300) {
                window.clearInterval(intervalo);
                intervalo = null;
                console.error(
                    '[MOBILE CONTROLS COMPAT]',
                    'MiguelMobileControls não foi encontrado'
                );
            }
        }, 20);
    }
})();
