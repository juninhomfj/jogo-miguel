(() => {
    const BUILD = 'phaser-scale-guard-v1-20260720';
    let tentativas = 0;
    let intervalo = null;

    const instalar = () => {
        const PhaserGlobal = window.Phaser;
        const Classe = (
            PhaserGlobal
            && PhaserGlobal.Scale
            && PhaserGlobal.Scale.ScaleManager
        );

        if (!Classe || !Classe.prototype) {
            return false;
        }

        const prototipo = Classe.prototype;

        if (prototipo.__miguelRefreshGuardBuild === BUILD) {
            return true;
        }

        const refreshOriginal = prototipo.refresh;

        if (typeof refreshOriginal !== 'function') {
            return false;
        }

        prototipo.refresh = function refreshProtegido(...argumentos) {
            if (
                !this.canvas
                || !this.canvas.style
                || !this.parent
            ) {
                return this;
            }

            return refreshOriginal.apply(this, argumentos);
        };

        prototipo.__miguelRefreshGuardBuild = BUILD;
        window.__MIGUEL_SCALE_GUARD_BUILD__ = BUILD;

        console.info('[ESCALA]', BUILD, 'instalado');
        return true;
    };

    const verificar = () => {
        tentativas += 1;

        if (instalar() || tentativas >= 500) {
            if (intervalo !== null) {
                window.clearInterval(intervalo);
                intervalo = null;
            }
        }
    };

    verificar();

    if (!window.__MIGUEL_SCALE_GUARD_BUILD__) {
        intervalo = window.setInterval(verificar, 4);
    }
})();
