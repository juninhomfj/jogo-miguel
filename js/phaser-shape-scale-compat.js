(() => {
    const BUILD = 'phaser-shape-scale-compat-v2-20260721';

    const installShapeCompatibility = () => {
        if (!window.Phaser || !Phaser.GameObjects) return false;

        const prototypes = [
            Phaser.GameObjects.Triangle && Phaser.GameObjects.Triangle.prototype,
            Phaser.GameObjects.Arc && Phaser.GameObjects.Arc.prototype,
            Phaser.GameObjects.Ellipse && Phaser.GameObjects.Ellipse.prototype
        ].filter(Boolean);

        prototypes.forEach((prototype) => {
            if (typeof prototype.setScaleY !== 'function') {
                prototype.setScaleY = function setScaleY(value) {
                    return this.setScale(this.scaleX, value);
                };
            }
            if (typeof prototype.setScaleX !== 'function') {
                prototype.setScaleX = function setScaleX(value) {
                    return this.setScale(value, this.scaleY);
                };
            }
        });

        window.__MIGUEL_PHASER_SHAPE_SCALE_COMPAT_BUILD__ = BUILD;
        return true;
    };

    const attachedScenes = new WeakSet();

    const attachCrystalLayerGuard = (scene) => {
        if (
            !scene
            || !scene.sys
            || !scene.sys.isActive()
            || !scene.__MIGUEL_PHASE1_USABILITY_APPLIED__
            || attachedScenes.has(scene)
        ) {
            return false;
        }

        const enforce = () => {
            if (!scene.coletaveis || !scene.coletaveis.children) return;
            scene.coletaveis.children.iterate((crystal) => {
                if (crystal && crystal.active) crystal.setDepth(36);
            });
        };

        attachedScenes.add(scene);
        scene.events.on('postupdate', enforce);
        scene.events.once('shutdown', () => {
            scene.events.off('postupdate', enforce);
        });
        enforce();
        scene.__MIGUEL_CRYSTAL_LAYER_GUARD__ = BUILD;
        return true;
    };

    const install = () => {
        installShapeCompatibility();
        const game = window.__MIGUEL_GAME__;
        if (!game || !game.scene || typeof game.scene.getScene !== 'function') return;
        attachCrystalLayerGuard(game.scene.getScene('Fase1'));
    };

    install();
    const interval = window.setInterval(install, 60);
    window.addEventListener('beforeunload', () => window.clearInterval(interval), { once: true });
})();
