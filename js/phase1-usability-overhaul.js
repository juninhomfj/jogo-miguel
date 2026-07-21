(() => {
    const BUILD = 'phase1-usability-overhaul-v1-20260721';
    const CHESTS = Object.freeze([
        Object.freeze({ id: 'fase1-bau-1', x: 920, y: 520, item: 'hoverboard' }),
        Object.freeze({ id: 'fase1-bau-2', x: 2080, y: 520, item: 'luvasEnergia' }),
        Object.freeze({ id: 'fase1-bau-3', x: 3320, y: 520, item: 'escudoIonico' }),
        Object.freeze({ id: 'fase1-bau-4', x: 4540, y: 520, item: 'blasterPulso' })
    ]);

    const runtime = {
        interval: null,
        scene: null,
        stop() {
            if (this.interval !== null) {
                window.clearInterval(this.interval);
                this.interval = null;
            }
            this.scene = null;
        }
    };

    const previous = window.__MIGUEL_PHASE1_USABILITY_RUNTIME__;
    if (previous && typeof previous.stop === 'function') previous.stop();

    window.__MIGUEL_PHASE1_USABILITY_BUILD__ = BUILD;
    window.__MIGUEL_PHASE1_USABILITY_RUNTIME__ = runtime;

    const play = (name) => {
        const audio = window.MIGUEL_AUDIO_MANAGER;
        if (audio && typeof audio.tocarEfeito === 'function') {
            audio.tocarEfeito(name);
        }
    };

    const createTextures = (scene) => {
        if (!scene.textures.exists('fase1_cristal_eletrico_v2')) {
            const g = scene.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0x00d9ff, 0.12);
            g.fillCircle(24, 27, 23);
            g.fillStyle(0x00f6ff, 0.22);
            g.fillCircle(24, 27, 17);
            g.fillStyle(0x082b52, 1);
            g.fillPoints([
                { x: 24, y: 2 },
                { x: 42, y: 24 },
                { x: 30, y: 50 },
                { x: 8, y: 31 }
            ], true);
            g.lineStyle(3, 0x5ff6ff, 1);
            g.strokePoints([
                { x: 24, y: 2 },
                { x: 42, y: 24 },
                { x: 30, y: 50 },
                { x: 8, y: 31 }
            ], true);
            g.fillStyle(0xffffff, 1);
            g.fillPoints([
                { x: 25, y: 9 },
                { x: 16, y: 29 },
                { x: 24, y: 27 },
                { x: 19, y: 43 },
                { x: 34, y: 21 },
                { x: 27, y: 22 }
            ], true);
            g.generateTexture('fase1_cristal_eletrico_v2', 48, 54);
            g.destroy();
        }

        if (!scene.textures.exists('fase1_mini_missil_v2')) {
            const g = scene.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(0xff8a18, 0.35);
            g.fillTriangle(0, 8, 9, 2, 9, 14);
            g.fillStyle(0xfff0a3, 1);
            g.fillTriangle(2, 8, 10, 5, 10, 11);
            g.fillStyle(0x57243d, 1);
            g.fillRoundedRect(8, 3, 20, 10, 4);
            g.fillStyle(0xff315d, 1);
            g.fillTriangle(26, 3, 35, 8, 26, 13);
            g.fillStyle(0xc7f5ff, 1);
            g.fillCircle(24, 8, 3);
            g.fillStyle(0x8fe9ff, 1);
            g.fillTriangle(11, 3, 15, 0, 18, 3);
            g.fillTriangle(11, 13, 15, 16, 18, 13);
            g.generateTexture('fase1_mini_missil_v2', 36, 16);
            g.destroy();
        }
    };

    const neutralizeLegacyObjects = (scene, state) => {
        const legacy = scene.__MIGUEL_HOVERBOARD_STATE__;
        state.legacy = legacy || null;
        scene.__MIGUEL_HOVERBOARD_AUTO_MOUNTED__ = true;

        if (legacy && legacy.hoverboardVisual) {
            legacy.hoverboardVisual.setAlpha(0).setVisible(false);
        }

        if (legacy && legacy.baus && legacy.baus.children) {
            legacy.baus.children.iterate((chest) => {
                if (!chest) return;
                chest.setVisible(false).setAlpha(0);
                if (chest.body) chest.body.enable = false;
            });
        }

        if (scene.energias && scene.energias.children) {
            scene.energias.children.iterate((energy) => {
                if (energy && energy.body) energy.body.enable = false;
            });
        }

        if (scene.checkpoints && scene.checkpoints.children) {
            scene.checkpoints.children.iterate((checkpoint) => {
                if (checkpoint && checkpoint.body) checkpoint.body.enable = false;
            });
        }
    };

    const installPowerButtonGuard = (scene, state) => {
        const mobile = scene.controles && scene.controles.mobileControls;
        if (!mobile || typeof mobile.setPowerUnlocked !== 'function') return;

        const original = mobile.setPowerUnlocked.bind(mobile);
        let last = null;
        const wrapper = (value) => {
            const normalized = Boolean(value);
            if (normalized === last) return;
            last = normalized;
            return original(normalized);
        };

        state.mobile = mobile;
        state.originalSetPowerUnlocked = original;
        state.powerButtonWrapper = wrapper;
        mobile.setPowerUnlocked = wrapper;
        wrapper(true);
    };

    const createInteractionButton = (scene, state) => {
        const container = scene.add.container(400, 518)
            .setScrollFactor(0)
            .setDepth(2600)
            .setVisible(false);
        const shadow = scene.add.rectangle(4, 5, 288, 64, 0x000000, 0.48);
        const background = scene.add.rectangle(0, 0, 288, 62, 0x071426, 0.97)
            .setStrokeStyle(3, 0xffcc00, 1)
            .setInteractive({ useHandCursor: true });
        const icon = scene.add.circle(-118, 0, 20, 0xffcc00, 1);
        const iconText = scene.add.text(-118, 0, 'E', {
            fontFamily: 'Courier New',
            fontSize: '20px',
            color: '#071426',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const label = scene.add.text(18, 0, 'INTERAGIR', {
            fontFamily: 'Courier New',
            fontSize: '17px',
            color: '#ffffff',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        container.add([shadow, background, icon, iconText, label]);
        background.on('pointerdown', () => {
            state.interactionRequested = true;
            background.setFillStyle(0x183f52, 1);
            scene.time.delayedCall(90, () => {
                if (background.active) background.setFillStyle(0x071426, 0.97);
            });
        });

        const keyE = scene.input.keyboard
            ? scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
            : null;
        const keyEnter = scene.input.keyboard
            ? scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
            : null;

        state.interactionButton = { container, background, label, keyE, keyEnter };
        scene.__MIGUEL_INTERACTION_BUTTON__ = state.interactionButton;
    };

    const createChestVisual = (scene, data, opened) => {
        const container = scene.add.container(data.x, data.y)
            .setDepth(36);
        const glow = scene.add.ellipse(0, 22, 92, 22, opened ? 0x28ff9b : 0xffcc00, 0.16);
        const body = scene.add.rectangle(0, 2, 76, 46, 0x603415, 1)
            .setStrokeStyle(3, 0xffd95a, 1);
        const lid = scene.add.rectangle(0, -24, 82, 24, opened ? 0x8f5b25 : 0x734219, 1)
            .setStrokeStyle(3, opened ? 0x28ff9b : 0xffd95a, 1);
        const bandLeft = scene.add.rectangle(-25, 0, 7, 50, 0xc8842f, 1);
        const bandRight = scene.add.rectangle(25, 0, 7, 50, 0xc8842f, 1);
        const lock = scene.add.rectangle(0, 1, 18, 22, opened ? 0x28ff9b : 0xfff0a3, 1)
            .setStrokeStyle(2, 0x3b210e, 1);
        const keyhole = scene.add.circle(0, 1, 3, 0x3b210e, 1);
        const arrow = scene.add.text(0, -68, '▼', {
            fontFamily: 'Courier New',
            fontSize: '24px',
            color: opened ? '#28ff9b' : '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const label = scene.add.text(0, 43, opened ? 'BAÚ ABERTO' : 'BAÚ TECNOLÓGICO', {
            fontFamily: 'Courier New',
            fontSize: '11px',
            color: opened ? '#28ff9b' : '#ffffff',
            backgroundColor: '#071426',
            padding: { x: 6, y: 3 },
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([
            glow,
            body,
            lid,
            bandLeft,
            bandRight,
            lock,
            keyhole,
            arrow,
            label
        ]);

        return {
            ...data,
            container,
            glow,
            body,
            lid,
            lock,
            arrow,
            label,
            opened
        };
    };

    const updateChestVisual = (chest, time) => {
        if (!chest.container.active) return;
        const pulse = 0.84 + Math.abs(Math.sin(time / 260 + chest.x / 150)) * 0.16;
        chest.glow.setAlpha(chest.opened ? 0.18 : 0.12 + pulse * 0.16);
        chest.arrow.setY(-66 - Math.abs(Math.sin(time / 220)) * 6);
        if (!chest.opened) chest.lock.setScale(0.95 + pulse * 0.08);
    };

    const createChests = (scene, state) => {
        const loot = window.MIGUEL_LOOT_SYSTEM;
        state.inventory = loot && typeof loot.carregarInventario === 'function'
            ? loot.carregarInventario()
            : { bausAbertos: [] };

        state.chests = CHESTS.map((data) => createChestVisual(
            scene,
            data,
            Array.isArray(state.inventory.bausAbertos)
                && state.inventory.bausAbertos.includes(data.id)
        ));
    };

    const openChest = (scene, state, chest) => {
        if (!chest || chest.opened) return false;
        const loot = window.MIGUEL_LOOT_SYSTEM;
        if (!loot || typeof loot.adicionarItem !== 'function') return false;

        state.inventory = loot.adicionarItem(state.inventory, chest.item, chest.id);
        scene.registry.set('inventarioMiguel', { ...state.inventory });
        if (state.legacy) state.legacy.inventario = state.inventory;

        chest.opened = true;
        chest.lid.setY(-37).setAngle(-8).setStrokeStyle(3, 0x28ff9b, 1);
        chest.lock.setFillStyle(0x28ff9b, 1);
        chest.arrow.setColor('#28ff9b');
        chest.label.setText('BAÚ ABERTO').setColor('#28ff9b');
        chest.glow.setFillStyle(0x28ff9b, 0.2);

        if (typeof scene.adicionarPontos === 'function') {
            scene.adicionarPontos(150, false);
        }

        const definition = loot.itens && loot.itens[chest.item];
        if (scene.hudJogo) {
            scene.hudJogo.mostrarMensagem(
                `ITEM OBTIDO — ${definition ? definition.nome : chest.item}`,
                1800
            );
        }

        if (chest.item === 'hoverboard' && state.legacy) {
            state.legacy.montado = true;
        }

        play('checkpoint');
        scene.__MIGUEL_CHEST_INTERACTION_COUNT__ = (
            Number(scene.__MIGUEL_CHEST_INTERACTION_COUNT__ || 0) + 1
        );
        return true;
    };

    const createCheckpointVisual = (scene, checkpoint) => {
        checkpoint.setAlpha(0.05).setDepth(3);
        const container = scene.add.container(checkpoint.x, checkpoint.y + 4)
            .setDepth(34);
        const base = scene.add.rectangle(0, 22, 82, 18, 0x17384d, 1)
            .setStrokeStyle(3, 0x8fe9ff, 1);
        const column = scene.add.rectangle(0, -20, 22, 72, 0x12435a, 1)
            .setStrokeStyle(3, 0x35d9ff, 1);
        const core = scene.add.circle(0, -62, 15, 0x00e5ff, 0.9)
            .setStrokeStyle(3, 0xffffff, 1);
        const ring = scene.add.circle(0, -62, 27, 0x00e5ff, 0)
            .setStrokeStyle(3, 0x00e5ff, 0.75);
        const arrow = scene.add.text(0, -112, '▼', {
            fontFamily: 'Courier New',
            fontSize: '28px',
            color: '#ffcc00',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        const label = scene.add.text(0, -91, 'CHECKPOINT', {
            fontFamily: 'Courier New',
            fontSize: '14px',
            color: '#ffffff',
            backgroundColor: '#071426',
            padding: { x: 7, y: 4 },
            fontStyle: 'bold'
        }).setOrigin(0.5);
        container.add([base, column, core, ring, arrow, label]);
        return { checkpoint, container, base, column, core, ring, arrow, label };
    };

    const updateCheckpointVisual = (visual, time) => {
        const active = Boolean(visual.checkpoint.getData('ativado'));
        const color = active ? 0x28ff9b : 0x00e5ff;
        const pulse = 0.86 + Math.abs(Math.sin(time / 240 + visual.checkpoint.x / 200)) * 0.22;
        visual.core.setFillStyle(color, active ? 1 : 0.82).setScale(pulse);
        visual.ring.setStrokeStyle(3, color, active ? 0.9 : 0.55)
            .setScale(0.9 + Math.abs(Math.sin(time / 310)) * 0.28);
        visual.column.setStrokeStyle(3, color, 1);
        visual.arrow.setColor(active ? '#28ff9b' : '#ffcc00')
            .setVisible(!active)
            .setY(-110 - Math.abs(Math.sin(time / 200)) * 7);
        visual.label
            .setText(active ? 'CHECKPOINT ATIVO' : 'CHECKPOINT')
            .setColor(active ? '#28ff9b' : '#ffffff');
    };

    const createCheckpointVisuals = (scene, state) => {
        state.checkpointVisuals = [];
        if (!scene.checkpoints || !scene.checkpoints.children) return;
        scene.checkpoints.children.iterate((checkpoint) => {
            if (checkpoint) state.checkpointVisuals.push(createCheckpointVisual(scene, checkpoint));
        });
        scene.__MIGUEL_CHECKPOINT_VISUALS__ = state.checkpointVisuals;
    };

    const electrifyCrystals = (scene, state) => {
        state.crystalFx = scene.add.graphics().setDepth(35);
        state.crystals = [];
        if (!scene.coletaveis || !scene.coletaveis.children) return;

        scene.coletaveis.children.iterate((crystal) => {
            if (!crystal) return;
            crystal.setTexture('fase1_cristal_eletrico_v2')
                .setDepth(36)
                .setScale(1.02);
            state.crystals.push(crystal);
        });
        scene.__MIGUEL_CRYSTAL_STYLE__ = 'eletrico-v2';
    };

    const updateCrystalFx = (state, time) => {
        if (!state.crystalFx || !state.crystalFx.active) return;
        const g = state.crystalFx;
        g.clear();
        state.crystals.forEach((crystal, index) => {
            if (!crystal || !crystal.active || !crystal.visible) return;
            const phase = time / 170 + index * 0.8;
            const radius = 25 + Math.sin(phase) * 3;
            const x1 = crystal.x + Math.cos(phase) * radius;
            const y1 = crystal.y + Math.sin(phase) * radius * 0.65;
            const x2 = crystal.x + Math.cos(phase + Math.PI) * radius;
            const y2 = crystal.y + Math.sin(phase + Math.PI) * radius * 0.65;
            g.fillStyle(index % 2 ? 0xffffff : 0x00e5ff, 0.85);
            g.fillCircle(x1, y1, 2.4);
            g.fillCircle(x2, y2, 1.8);
            g.lineStyle(2, 0x62f7ff, 0.45);
            g.lineBetween(
                crystal.x - 19,
                crystal.y + Math.sin(phase * 1.7) * 8,
                crystal.x - 10,
                crystal.y - Math.cos(phase) * 11
            );
            g.lineBetween(
                crystal.x + 12,
                crystal.y + Math.cos(phase * 1.3) * 10,
                crystal.x + 21,
                crystal.y - Math.sin(phase) * 7
            );
            crystal.setAngle(Math.sin(time / 260 + index) * 8);
            crystal.setTint(index % 3 === 0 ? 0xc8fbff : 0xffffff);
        });
    };

    const createHoverboardVisual = (scene) => {
        const container = scene.add.container(0, 0)
            .setDepth(19)
            .setVisible(false);
        const shadow = scene.add.ellipse(0, 13, 104, 18, 0x000000, 0.34);
        const glow = scene.add.ellipse(0, 8, 102, 21, 0x00e5ff, 0.2);
        const board = scene.add.rectangle(0, 0, 94, 10, 0x173e5a, 1)
            .setStrokeStyle(3, 0x8fe9ff, 1);
        const deck = scene.add.rectangle(0, -4, 58, 5, 0x3c7290, 1);
        const leftJet = scene.add.circle(-34, 8, 5, 0x28ff9b, 1);
        const rightJet = scene.add.circle(34, 8, 5, 0x28ff9b, 1);
        const leftFlame = scene.add.triangle(-34, 16, -7, -1, 7, -1, 0, 13, 0xffcc00, 0.85);
        const rightFlame = scene.add.triangle(34, 16, -7, -1, 7, -1, 0, 13, 0xffcc00, 0.85);
        container.add([
            shadow,
            glow,
            board,
            deck,
            leftJet,
            rightJet,
            leftFlame,
            rightFlame
        ]);
        return { container, glow, leftFlame, rightFlame };
    };

    const updateHoverboardAndMovement = (scene, state, time) => {
        const legacy = state.legacy;
        if (!legacy || !scene.player || !scene.player.body) return;

        if (legacy.hoverboardVisual) {
            legacy.hoverboardVisual.setAlpha(0).setVisible(false);
        }

        const mounted = Boolean(legacy.montado && legacy.inventario && legacy.inventario.hoverboard);
        state.hoverboard.container.setVisible(mounted);
        if (!mounted) return;

        const player = scene.player;
        const axisRaw = scene.controles && typeof scene.controles.obterMovimentoX === 'function'
            ? Number(scene.controles.obterMovimentoX())
            : 0;
        const axis = Number.isFinite(axisRaw) ? Phaser.Math.Clamp(axisRaw, -1, 1) : 0;
        const grounded = Boolean(player.body.blocked.down || player.body.touching.down);
        const footY = player.y + 92;
        const velocityY = Number(player.body.velocity.y || 0);
        const tilt = Phaser.Math.Clamp(velocityY / 70, -8, 8);

        state.hoverboard.container
            .setPosition(player.x, footY + Math.sin(time / 150) * 1.4)
            .setAngle(tilt);
        const flamePulse = 0.82 + Math.abs(Math.sin(time / 75)) * 0.38;
        state.hoverboard.leftFlame.setScaleY(flamePulse);
        state.hoverboard.rightFlame.setScaleY(flamePulse);
        state.hoverboard.glow.setAlpha(0.16 + Math.abs(Math.sin(time / 110)) * 0.18);

        if (player.estaMachucado || player.estaAgachado || player.estaAtacando) return;

        if (Math.abs(axis) < 0.18) {
            player.setVelocityX(0);
            if (grounded && player.anims && player.anims.currentAnim
                && player.anims.currentAnim.key === 'walk') {
                player.anims.play('idle', true);
            }
            return;
        }

        player.setVelocityX(axis * 285);
        player.setFlipX(axis < 0);
        if (grounded && player.anims) player.anims.play('walk', true);
    };

    const createExplosion = (scene, x, y) => {
        if (!scene.sys || !scene.sys.isActive()) return;
        const core = scene.add.circle(x, y, 8, 0xffffff, 1).setDepth(80);
        const ring = scene.add.circle(x, y, 13, 0xff6a22, 0.75)
            .setStrokeStyle(4, 0xfff0a3, 1)
            .setDepth(79);
        const sparks = scene.add.graphics().setDepth(81);
        for (let index = 0; index < 9; index += 1) {
            const angle = (Math.PI * 2 * index) / 9;
            sparks.lineStyle(3, index % 2 ? 0xffcc00 : 0xff315d, 0.95);
            sparks.lineBetween(
                x + Math.cos(angle) * 8,
                y + Math.sin(angle) * 8,
                x + Math.cos(angle) * 25,
                y + Math.sin(angle) * 25
            );
        }
        scene.tweens.add({
            targets: [core, ring],
            scaleX: 2.8,
            scaleY: 2.8,
            alpha: 0,
            duration: 260,
            ease: 'Cubic.easeOut',
            onComplete: () => {
                if (core.active) core.destroy();
                if (ring.active) ring.destroy();
                if (sparks.active) sparks.destroy();
            }
        });
        play('inimigoDano');
        scene.__MIGUEL_MINI_MISSILE_EXPLOSIONS__ = (
            Number(scene.__MIGUEL_MINI_MISSILE_EXPLOSIONS__ || 0) + 1
        );
    };

    const installMiniMissiles = (scene, state) => {
        if (typeof scene.atirar !== 'function') return;
        const original = scene.atirar;
        const wrapper = function fireWithMiniMissile(
            origin,
            target,
            speed,
            damage,
            boss = false,
            extraAngle = 0
        ) {
            const type = origin && typeof origin.getData === 'function'
                ? origin.getData('tipo')
                : null;
            if (type !== 'drone') {
                return original.call(this, origin, target, speed, damage, boss, extraAngle);
            }
            if (!origin.active || !target.active || !this.projeteis) return;

            const direction = target.x < origin.x ? -1 : 1;
            const x = origin.x + direction * 34;
            const y = origin.y + 2;
            const angle = Math.atan2(target.y - 18 - y, target.x - x) + extraAngle;
            const missile = this.projeteis.create(x, y, 'fase1_mini_missil_v2');
            missile.body.allowGravity = false;
            missile.body.setSize(30, 12);
            missile.setDepth(42);
            missile.setRotation(angle);
            missile.setData('dano', Math.max(10, Number(damage || 12)));
            missile.setData('boss', false);
            missile.setData('miniMissil', true);
            missile.setData('criadoEm', this.time.now);
            missile.setData('explodiu', false);
            missile.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

            const originalDestroy = missile.destroy.bind(missile);
            missile.destroy = (...args) => {
                if (!missile.getData('explodiu')) {
                    missile.setData('explodiu', true);
                    createExplosion(this, missile.x, missile.y);
                }
                state.missiles.delete(missile);
                return originalDestroy(...args);
            };

            state.missiles.add(missile);
            this.__MIGUEL_MINI_MISSILE_COUNT__ = (
                Number(this.__MIGUEL_MINI_MISSILE_COUNT__ || 0) + 1
            );
            play('disparo');
            return missile;
        };

        state.originalFire = original;
        state.fireWrapper = wrapper;
        scene.atirar = wrapper;
    };

    const updateMissiles = (scene, state, time) => {
        if (!state.missileTrail || !state.missileTrail.active) return;
        state.missileTrail.clear();
        state.missiles.forEach((missile) => {
            if (!missile || !missile.active || !missile.body) {
                state.missiles.delete(missile);
                return;
            }
            const vx = missile.body.velocity.x;
            const vy = missile.body.velocity.y;
            missile.setRotation(Math.atan2(vy, vx));
            const length = 18 + Math.abs(Math.sin(time / 65 + missile.x)) * 8;
            const magnitude = Math.max(1, Math.hypot(vx, vy));
            const nx = vx / magnitude;
            const ny = vy / magnitude;
            state.missileTrail.lineStyle(5, 0xff6a22, 0.35);
            state.missileTrail.lineBetween(
                missile.x - nx * 8,
                missile.y - ny * 8,
                missile.x - nx * length,
                missile.y - ny * length
            );
            state.missileTrail.lineStyle(2, 0xfff0a3, 0.85);
            state.missileTrail.lineBetween(
                missile.x - nx * 8,
                missile.y - ny * 8,
                missile.x - nx * (length - 5),
                missile.y - ny * (length - 5)
            );
        });
    };

    const nearestInteraction = (scene, state) => {
        if (!scene.player) return null;
        const candidates = [];
        const add = (kind, target, label, maxDistance, action) => {
            if (!target) return;
            const distance = Phaser.Math.Distance.Between(
                scene.player.x,
                scene.player.y,
                target.x,
                target.y
            );
            if (distance <= maxDistance) candidates.push({ kind, target, label, distance, action });
        };

        state.chests.forEach((chest) => {
            if (!chest.opened) {
                add('chest', chest, 'ABRIR BAÚ', 112, () => openChest(scene, state, chest));
            }
        });

        if (scene.energias && scene.energias.children) {
            scene.energias.children.iterate((energy) => {
                if (energy && energy.active && energy.visible) {
                    add('energy', energy, 'COLETAR ENERGIA', 86, () => {
                        scene.coletarEnergia(scene.player, energy);
                        return true;
                    });
                }
            });
        }

        if (scene.checkpoints && scene.checkpoints.children) {
            scene.checkpoints.children.iterate((checkpoint) => {
                if (checkpoint && !checkpoint.getData('ativado')) {
                    add('checkpoint', checkpoint, 'ATIVAR CHECKPOINT', 112, () => {
                        scene.ativarCheckpoint(scene.player, checkpoint);
                        return true;
                    });
                }
            });
        }

        candidates.sort((a, b) => a.distance - b.distance);
        return candidates[0] || null;
    };

    const updateInteraction = (scene, state) => {
        const button = state.interactionButton;
        const candidate = nearestInteraction(scene, state);
        state.currentInteraction = candidate;

        const keyboardRequested = Boolean(
            (button.keyE && Phaser.Input.Keyboard.JustDown(button.keyE))
            || (button.keyEnter && Phaser.Input.Keyboard.JustDown(button.keyEnter))
        );

        if (!candidate) {
            button.container.setVisible(false);
            state.interactionRequested = false;
            return;
        }

        button.label.setText(candidate.label);
        button.container.setVisible(true);

        if (state.interactionRequested || keyboardRequested) {
            state.interactionRequested = false;
            const done = candidate.action();
            if (done !== false) {
                play('coletar');
                button.container.setVisible(false);
            }
        }
    };

    const attach = (scene) => {
        if (
            !scene
            || !scene.sys
            || !scene.sys.isActive()
            || scene.__MIGUEL_PHASE1_USABILITY_APPLIED__
            || !scene.player
            || !scene.controles
            || !scene.__MIGUEL_HOVERBOARD_STATE__
        ) {
            return false;
        }

        createTextures(scene);
        const state = {
            legacy: null,
            inventory: null,
            chests: [],
            crystals: [],
            crystalFx: null,
            checkpointVisuals: [],
            interactionButton: null,
            interactionRequested: false,
            currentInteraction: null,
            hoverboard: createHoverboardVisual(scene),
            missiles: new Set(),
            missileTrail: scene.add.graphics().setDepth(41),
            originalFire: null,
            fireWrapper: null,
            mobile: null,
            originalSetPowerUnlocked: null,
            powerButtonWrapper: null
        };

        scene.__MIGUEL_PHASE1_USABILITY_APPLIED__ = BUILD;
        scene.__MIGUEL_PHASE1_USABILITY_STATE__ = state;
        scene.__MIGUEL_CHEST_INTERACTION_COUNT__ = 0;
        scene.__MIGUEL_MINI_MISSILE_COUNT__ = 0;
        scene.__MIGUEL_MINI_MISSILE_EXPLOSIONS__ = 0;
        scene.__MIGUEL_MOVEMENT_GUARD_APPLIED__ = true;

        neutralizeLegacyObjects(scene, state);
        installPowerButtonGuard(scene, state);
        createInteractionButton(scene, state);
        createChests(scene, state);
        createCheckpointVisuals(scene, state);
        electrifyCrystals(scene, state);
        installMiniMissiles(scene, state);

        scene.__MIGUEL_INTERACT__ = () => {
            state.interactionRequested = true;
            return true;
        };

        const handler = (time) => {
            if (!scene.sys || !scene.sys.isActive()) return;
            neutralizeLegacyObjects(scene, state);
            state.chests.forEach((chest) => updateChestVisual(chest, time));
            state.checkpointVisuals.forEach((visual) => updateCheckpointVisual(visual, time));
            updateCrystalFx(state, time);
            updateHoverboardAndMovement(scene, state, time);
            updateMissiles(scene, state, time);
            updateInteraction(scene, state);
        };

        scene.events.on('postupdate', handler);
        scene.events.once('shutdown', () => {
            scene.events.off('postupdate', handler);
            if (scene.atirar === state.fireWrapper) scene.atirar = state.originalFire;
            if (
                state.mobile
                && state.mobile.setPowerUnlocked === state.powerButtonWrapper
                && state.originalSetPowerUnlocked
            ) {
                state.mobile.setPowerUnlocked = state.originalSetPowerUnlocked;
            }
            state.chests.forEach((chest) => {
                if (chest.container.active) chest.container.destroy(true);
            });
            state.checkpointVisuals.forEach((visual) => {
                if (visual.container.active) visual.container.destroy(true);
            });
            if (state.crystalFx && state.crystalFx.active) state.crystalFx.destroy();
            if (state.missileTrail && state.missileTrail.active) state.missileTrail.destroy();
            if (state.hoverboard.container.active) state.hoverboard.container.destroy(true);
            if (state.interactionButton.container.active) {
                state.interactionButton.container.destroy(true);
            }
            delete scene.__MIGUEL_INTERACTION_BUTTON__;
            delete scene.__MIGUEL_INTERACT__;
            delete scene.__MIGUEL_PHASE1_USABILITY_STATE__;
            delete scene.__MIGUEL_PHASE1_USABILITY_APPLIED__;
            if (runtime.scene === scene) runtime.scene = null;
        });

        runtime.scene = scene;
        console.info('[FASE 1 USABILIDADE]', BUILD, 'aplicado');
        return true;
    };

    const search = () => {
        const game = window.__MIGUEL_GAME__;
        if (!game || !game.scene || typeof game.scene.getScene !== 'function') return;
        const scene = game.scene.getScene('Fase1');
        if (scene && scene.sys && scene.sys.isActive()) attach(scene);
    };

    runtime.interval = window.setInterval(search, 80);
    window.addEventListener('load', search, { once: true });
})();
