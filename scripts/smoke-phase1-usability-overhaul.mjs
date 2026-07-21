import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const port = 4182;
const address = `http://127.0.0.1:${port}`;
const errors = [];

const findChrome = () => {
    const candidates = [
        process.env.CHROME_BIN,
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser'
    ].filter(Boolean);

    for (const candidate of candidates) {
        try {
            execFileSync(candidate, ['--version'], { stdio: 'ignore' });
            return candidate;
        } catch {
            // Tenta o próximo navegador.
        }
    }
    throw new Error('Google Chrome/Chromium não encontrado no runner.');
};

const server = spawn(
    'python3',
    ['-m', 'http.server', String(port), '--bind', '127.0.0.1'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
);

const waitServer = async () => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
        try {
            const response = await fetch(address);
            if (response.ok) return;
        } catch {
            // Servidor ainda iniciando.
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error('Servidor local não respondeu.');
};

let browser = null;

try {
    await waitServer();
    browser = await puppeteer.launch({
        headless: true,
        executablePath: findChrome(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--use-gl=swiftshader'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({
        width: 1180,
        height: 820,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true
    });

    page.on('pageerror', (error) => {
        errors.push(`PAGEERROR: ${error.stack || error.message}`);
    });

    page.on('console', (message) => {
        const text = message.text();
        if (
            message.type() === 'error'
            && !text.includes('Failed to load resource: the server responded with a status of 404')
        ) {
            errors.push(`CONSOLE: ${text}`);
        }
    });

    await page.goto(`${address}/?smoke=phase1-usability-overhaul`, {
        waitUntil: 'networkidle0',
        timeout: 45000
    });

    await page.evaluate(() => window.localStorage.removeItem('miguel-inventario-v1'));

    await page.waitForFunction(
        () => Boolean(
            window.__MIGUEL_GAME__
            && window.__MIGUEL_PHASE1_INSTALLED__
            && window.__MIGUEL_PHASE1_USABILITY_BUILD__
        ),
        { timeout: 20000 }
    );

    await page.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'USABILIDADE');
        game.registry.set('pontuacao', 0);
        game.scene.start('Fase1');
    });

    await page.waitForFunction(
        () => {
            const game = window.__MIGUEL_GAME__;
            const scene = game && game.scene.getScene('Fase1');
            return Boolean(
                scene
                && scene.sys.isActive()
                && scene.player
                && scene.__MIGUEL_PHASE1_USABILITY_APPLIED__
                && scene.__MIGUEL_INTERACTION_BUTTON__
                && scene.__MIGUEL_HOVERBOARD_STATE__
                && scene.__MIGUEL_CHECKPOINT_VISUALS__
            );
        },
        { timeout: 20000 }
    );

    const structure = await page.evaluate(() => {
        const scene = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        const state = scene.__MIGUEL_PHASE1_USABILITY_STATE__;
        const crystals = [];
        scene.coletaveis.children.iterate((crystal) => {
            if (crystal) crystals.push({
                texture: crystal.texture.key,
                depth: crystal.depth,
                active: crystal.active
            });
        });
        const oldChests = [];
        if (state.legacy && state.legacy.baus && state.legacy.baus.children) {
            state.legacy.baus.children.iterate((chest) => {
                if (chest) oldChests.push({
                    visible: chest.visible,
                    body: Boolean(chest.body && chest.body.enable)
                });
            });
        }
        return {
            chests: state.chests.length,
            checkpoints: scene.__MIGUEL_CHECKPOINT_VISUALS__.length,
            crystals,
            oldChests,
            buttonVisible: scene.__MIGUEL_INTERACTION_BUTTON__.container.visible,
            movementGuard: scene.__MIGUEL_MOVEMENT_GUARD_APPLIED__,
            crystalStyle: scene.__MIGUEL_CRYSTAL_STYLE__
        };
    });

    console.log('ESTRUTURA:', JSON.stringify(structure));
    if (structure.chests !== 4) errors.push(`quantidade de baús inesperada: ${structure.chests}`);
    if (structure.checkpoints !== 2) errors.push(`quantidade de checkpoints inesperada: ${structure.checkpoints}`);
    if (structure.crystals.length !== 16) errors.push(`quantidade de cristais inesperada: ${structure.crystals.length}`);
    if (structure.crystals.some((crystal) => crystal.texture !== 'fase1_cristal_eletrico_v2')) {
        errors.push('nem todos os cristais usam o visual elétrico');
    }
    if (structure.crystals.some((crystal) => crystal.depth < 36)) {
        errors.push('cristais elétricos ficaram abaixo da profundidade esperada');
    }
    if (structure.oldChests.some((chest) => chest.visible || chest.body)) {
        errors.push('baús automáticos antigos continuam ativos');
    }
    if (!structure.movementGuard || structure.crystalStyle !== 'eletrico-v2') {
        errors.push('guarda de movimento ou estilo de cristais não foi instalado');
    }

    const chestPrompt = await page.evaluate(async () => {
        const scene = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        scene.bloqueioInicioAte = 0;
        scene.player.setPosition(920, 455);
        scene.player.body.reset(920, 455);
        await new Promise((resolve) => setTimeout(resolve, 220));
        const button = scene.__MIGUEL_INTERACTION_BUTTON__;
        return {
            visible: button.container.visible,
            label: button.label.text
        };
    });

    console.log('PROMPT BAÚ:', JSON.stringify(chestPrompt));
    if (!chestPrompt.visible || !chestPrompt.label.includes('ABRIR')) {
        errors.push('botão de interação não apareceu próximo do baú');
    }

    const chestOpened = await page.evaluate(async () => {
        const scene = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        scene.__MIGUEL_INTERACT__();
        await new Promise((resolve) => setTimeout(resolve, 180));
        const state = scene.__MIGUEL_PHASE1_USABILITY_STATE__;
        return {
            hoverboard: Boolean(state.inventory.hoverboard),
            opened: Boolean(state.chests[0].opened),
            count: scene.__MIGUEL_CHEST_INTERACTION_COUNT__,
            mounted: Boolean(state.legacy && state.legacy.montado),
            boardVisible: state.hoverboard.container.visible
        };
    });

    console.log('BAÚ ABERTO:', JSON.stringify(chestOpened));
    if (!chestOpened.hoverboard || !chestOpened.opened || chestOpened.count !== 1) {
        errors.push('baú não concedeu e persistiu o hoverboard');
    }

    const movement = await page.evaluate(async () => {
        const scene = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        const state = scene.__MIGUEL_PHASE1_USABILITY_STATE__;
        scene.player.estaMachucado = false;
        scene.player.estaAgachado = false;
        scene.player.estaAtacando = false;
        state.legacy.montado = true;
        state.legacy.inventario.hoverboard = true;
        scene.controles.estaAgachando = () => false;
        scene.controles.obterMovimentoY = () => 0;
        scene.controles.consumirPulo = () => false;
        scene.controles.consumirAtaque = () => false;
        scene.controles.consumirPausa = () => false;
        scene.controles.consumirReiniciar = () => false;
        scene.controles.consumirPoder = () => false;

        scene.controles.obterMovimentoX = () => 1;
        await new Promise((resolve) => setTimeout(resolve, 160));
        const moving = scene.player.body.velocity.x;

        scene.controles.obterMovimentoX = () => 0;
        await new Promise((resolve) => setTimeout(resolve, 160));
        const stopped = scene.player.body.velocity.x;
        const boardDelta = state.hoverboard.container.y - scene.player.y;
        const oldVisible = Boolean(
            state.legacy.hoverboardVisual
            && state.legacy.hoverboardVisual.visible
            && state.legacy.hoverboardVisual.alpha > 0
        );
        const animation = scene.player.anims.currentAnim
            ? scene.player.anims.currentAnim.key
            : null;
        return { moving, stopped, boardDelta, oldVisible, animation };
    });

    console.log('MOVIMENTO/HOVERBOARD:', JSON.stringify(movement));
    if (movement.moving < 270 || movement.moving > 290) {
        errors.push(`velocidade do hoverboard fora da faixa: ${movement.moving}`);
    }
    if (Math.abs(movement.stopped) > 1) {
        errors.push(`Miguel continuou andando sem comando: ${movement.stopped}`);
    }
    if (movement.boardDelta < 86 || movement.boardDelta > 99) {
        errors.push(`hoverboard não ficou sob os pés: ${movement.boardDelta}`);
    }
    if (movement.oldVisible) errors.push('hoverboard legado continua visível entre os pés');
    if (movement.animation === 'walk') errors.push('animação de caminhada permaneceu ativa parado');

    const checkpoint = await page.evaluate(async () => {
        const scene = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        const checkpoint = scene.checkpoints.getChildren()[0];
        scene.player.setPosition(checkpoint.x, checkpoint.y - 55);
        scene.player.body.reset(checkpoint.x, checkpoint.y - 55);
        await new Promise((resolve) => setTimeout(resolve, 180));
        const labelBefore = scene.__MIGUEL_INTERACTION_BUTTON__.label.text;
        scene.__MIGUEL_INTERACT__();
        await new Promise((resolve) => setTimeout(resolve, 160));
        const visual = scene.__MIGUEL_CHECKPOINT_VISUALS__[0];
        return {
            labelBefore,
            activated: Boolean(checkpoint.getData('ativado')),
            visualLabel: visual.label.text,
            containerActive: visual.container.active
        };
    });

    console.log('CHECKPOINT:', JSON.stringify(checkpoint));
    if (!checkpoint.labelBefore.includes('CHECKPOINT') || !checkpoint.activated) {
        errors.push('checkpoint não foi identificado ou ativado pela interação');
    }
    if (checkpoint.visualLabel !== 'CHECKPOINT ATIVO' || !checkpoint.containerActive) {
        errors.push('visual do checkpoint não refletiu a ativação');
    }

    const missile = await page.evaluate(async () => {
        const scene = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        const drones = scene.inimigos.getChildren().filter(
            (enemy) => enemy && enemy.active && enemy.getData('tipo') === 'drone'
        );
        const drone = drones[0];
        if (!drone) return null;
        scene.player.setPosition(drone.x + 250, drone.y + 30);
        scene.player.body.reset(scene.player.x, scene.player.y);
        const projectile = scene.atirar(drone, scene.player, 210, 12, false);
        await new Promise((resolve) => setTimeout(resolve, 80));
        const before = {
            mini: Boolean(projectile && projectile.getData('miniMissil')),
            texture: projectile ? projectile.texture.key : null,
            rotation: projectile ? projectile.rotation : null,
            count: scene.__MIGUEL_MINI_MISSILE_COUNT__
        };
        if (projectile && projectile.active) projectile.destroy();
        await new Promise((resolve) => setTimeout(resolve, 80));
        return {
            before,
            explosions: scene.__MIGUEL_MINI_MISSILE_EXPLOSIONS__
        };
    });

    console.log('MINI MÍSSIL:', JSON.stringify(missile));
    if (!missile || !missile.before.mini || missile.before.texture !== 'fase1_mini_missil_v2') {
        errors.push('drone não disparou mini míssil');
    }
    if (!missile || missile.before.count < 1 || missile.explosions < 1) {
        errors.push('mini míssil não registrou disparo e explosão');
    }

    if (errors.length > 0) {
        console.error('\nSMOKE USABILIDADE DA FASE 1 REPROVADO');
        errors.forEach((error) => console.error(`ERRO: ${error}`));
        process.exitCode = 1;
    } else {
        console.log('\nSMOKE USABILIDADE DA FASE 1 APROVADO');
    }
} finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
}
