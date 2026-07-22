(() => {
    const BUILD = 'result-phase1-transition-guard-v2-20260721';
    const DEVICE_TIMEOUT_MS = 900;
    const PHASE_READY_TIMEOUT_MS = 1800;

    const runtime = {
        interval: null,
        scene: null,
        manager: null,
        originalEnterGameMode: null,
        wrappedEnterGameMode: null,

        stop() {
            if (this.interval !== null) {
                window.clearInterval(this.interval);
                this.interval = null;
            }

            if (
                this.manager
                && this.originalEnterGameMode
                && this.manager.entrarModoJogo === this.wrappedEnterGameMode
            ) {
                this.manager.entrarModoJogo = this.originalEnterGameMode;
            }

            this.scene = null;
            this.manager = null;
            this.originalEnterGameMode = null;
            this.wrappedEnterGameMode = null;
        }
    };

    const previous = window.__MIGUEL_RESULT_PHASE1_TRANSITION_RUNTIME__;
    if (previous && typeof previous.stop === 'function') previous.stop();

    window.__MIGUEL_RESULT_PHASE1_TRANSITION_BUILD__ = BUILD;
    window.__MIGUEL_RESULT_PHASE1_TRANSITION_RUNTIME__ = runtime;

    const record = (data = {}) => {
        window.__MIGUEL_RESULT_PHASE1_TRANSITION_LAST__ = {
            build: BUILD,
            timestamp: Date.now(),
            ...data
        };
    };

    const isPhase1 = (phase) => Boolean(
        phase
        && (
            phase.id === 'fase-1'
            || phase.scene === 'Fase1'
            || phase.titulo === 'A Cidade sem Energia'
        )
    );

    const getDeviceState = (manager) => {
        try {
            return typeof manager.obterEstado === 'function'
                ? manager.obterEstado()
                : null;
        } catch {
            return null;
        }
    };

    const installDeviceTimeout = () => {
        const manager = window.MIGUEL_DEVICE_MANAGER;
        if (!manager || typeof manager.entrarModoJogo !== 'function') return false;

        if (manager.__MIGUEL_PHASE1_TIMEOUT_GUARD__ === BUILD) return true;

        const original = manager.entrarModoJogo.bind(manager);
        const wrapped = async function enterGameModeWithTimeout(phase) {
            if (!isPhase1(phase)) return original(phase);

            let timer = null;
            let timedOut = false;

            const timeout = new Promise((resolve) => {
                timer = window.setTimeout(() => {
                    timedOut = true;
                    resolve(getDeviceState(manager));
                }, DEVICE_TIMEOUT_MS);
            });

            const request = Promise.resolve()
                .then(() => original(phase))
                .catch((error) => {
                    console.warn('[RESULTADO → FASE 1] modo de jogo indisponível', error);
                    return getDeviceState(manager);
                });

            const result = await Promise.race([request, timeout]);
            if (timer !== null) window.clearTimeout(timer);

            record({
                stage: 'device-mode',
                timedOut,
                orientation: phase.orientacao || null
            });

            return result;
        };

        manager.__MIGUEL_PHASE1_TIMEOUT_GUARD__ = BUILD;
        manager.entrarModoJogo = wrapped;

        runtime.manager = manager;
        runtime.originalEnterGameMode = original;
        runtime.wrappedEnterGameMode = wrapped;
        return true;
    };

    const phase1Active = (game) => {
        if (!game || !game.scene || typeof game.scene.getScene !== 'function') return false;
        const phase = game.scene.getScene('Fase1');
        return Boolean(phase && phase.sys && phase.sys.isActive());
    };

    const startPhase1 = (scene, source) => {
        const game = scene && scene.game ? scene.game : window.__MIGUEL_GAME__;
        if (!game || !game.scene) return false;

        if (phase1Active(game)) {
            record({ stage: 'already-active', source, phase1Active: true });
            return true;
        }

        let started = false;

        try {
            if (scene && scene.scene && typeof scene.scene.start === 'function') {
                scene.scene.start('Fase1');
                started = true;
            }
        } catch (error) {
            console.warn('[RESULTADO → FASE 1] ScenePlugin falhou', error);
        }

        if (!started) {
            try {
                game.scene.start('Fase1');
                started = true;
            } catch (error) {
                console.error('[RESULTADO → FASE 1] SceneManager falhou', error);
            }
        }

        record({
            stage: 'start-requested',
            source,
            started,
            phase1Installed: Boolean(window.__MIGUEL_PHASE1_INSTALLED__)
        });

        return started;
    };

    const startWhenReady = (scene, source) => {
        const startedAt = performance.now();

        const attempt = () => {
            if (!scene || !scene.sys || !scene.sys.isActive()) {
                const game = window.__MIGUEL_GAME__;
                if (phase1Active(game)) return;
            }

            const ready = Boolean(window.__MIGUEL_PHASE1_INSTALLED__);
            const expired = performance.now() - startedAt >= PHASE_READY_TIMEOUT_MS;

            if (ready || expired) {
                startPhase1(scene, expired ? `${source}-timeout` : source);
                return;
            }

            window.setTimeout(attempt, 60);
        };

        attempt();

        window.setTimeout(() => {
            const game = window.__MIGUEL_GAME__;
            if (!phase1Active(game)) startPhase1(scene, `${source}-fallback`);
        }, PHASE_READY_TIMEOUT_MS + 650);
    };

    const findAdventureButton = (scene) => {
        if (!scene || !scene.children || !Array.isArray(scene.children.list)) return null;

        return scene.children.list.find((object) => Boolean(
            object
            && typeof object.text === 'string'
            && object.text.includes('COMEÇAR A AVENTURA')
        )) || null;
    };

    const attach = (scene) => {
        if (
            !scene
            || !scene.sys
            || !scene.sys.isActive()
            || scene.__MIGUEL_RESULT_PHASE1_GUARD_APPLIED__
        ) {
            return false;
        }

        const button = findAdventureButton(scene);
        if (!button) return false;

        let transitioning = false;
        const keyboard = scene.input && scene.input.keyboard;
        const keyEnter = keyboard
            ? keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
            : null;
        const keySpace = keyboard
            ? keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE)
            : null;

        const activate = (source = 'pointer') => {
            if (transitioning || phase1Active(scene.game)) return;
            transitioning = true;

            button.disableInteractive();
            button.setText('[ CARREGANDO FASE 1... ]');
            button.setStyle({
                fill: '#0d1117',
                backgroundColor: '#FFCC00'
            });

            record({
                stage: 'interaction',
                source,
                phase1Installed: Boolean(window.__MIGUEL_PHASE1_INSTALLED__)
            });

            const manager = window.MIGUEL_DEVICE_MANAGER;
            const phase = window.MIGUEL_PHASE_CONFIG
                && window.MIGUEL_PHASE_CONFIG.fases
                ? window.MIGUEL_PHASE_CONFIG.fases.Fase1
                : { id: 'fase-1', scene: 'Fase1', orientacao: 'landscape' };

            try {
                const request = manager && typeof manager.entrarModoJogo === 'function'
                    ? manager.entrarModoJogo(phase)
                    : null;

                Promise.resolve(request).catch((error) => {
                    console.warn('[RESULTADO → FASE 1] preparação visual falhou', error);
                });
            } catch (error) {
                console.warn('[RESULTADO → FASE 1] preparação não iniciou', error);
            }

            startWhenReady(scene, source);
        };

        button.removeAllListeners('pointerdown');
        button.on('pointerdown', () => activate('pointer'));

        const onKeyDown = (event) => {
            if (
                event.code === 'Enter'
                || event.code === 'Space'
                || event.key === 'Enter'
                || event.key === ' '
            ) {
                activate('keyboard');
            }
        };

        if (keyboard) keyboard.on('keydown', onKeyDown);

        scene.__MIGUEL_RESULT_PHASE1_GUARD_APPLIED__ = BUILD;
        scene.__MIGUEL_START_PHASE1__ = activate;
        runtime.scene = scene;

        scene.events.once('shutdown', () => {
            if (keyboard) keyboard.off('keydown', onKeyDown);
            delete scene.__MIGUEL_RESULT_PHASE1_GUARD_APPLIED__;
            delete scene.__MIGUEL_START_PHASE1__;
            if (runtime.scene === scene) runtime.scene = null;
        });

        record({ stage: 'attached', buttonFound: true });
        return true;
    };

    const check = () => {
        installDeviceTimeout();

        const game = window.__MIGUEL_GAME__;
        if (!game || !game.scene || typeof game.scene.getScene !== 'function') return;

        const result = game.scene.getScene('ResultadoTutorial');
        if (result && result.sys && result.sys.isActive()) attach(result);
    };

    installDeviceTimeout();
    runtime.interval = window.setInterval(check, 50);
    window.addEventListener('load', check, { once: true });
})();