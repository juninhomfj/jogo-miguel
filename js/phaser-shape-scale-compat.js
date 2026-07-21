(() => {
    const BUILD = 'phaser-shape-scale-compat-v1-20260721';

    const install = () => {
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

    if (!install()) {
        const interval = window.setInterval(() => {
            if (install()) window.clearInterval(interval);
        }, 40);
    }
})();
