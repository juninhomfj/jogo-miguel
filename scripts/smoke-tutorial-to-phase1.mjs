import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const port = 4183;
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
            // Tenta o próximo executável.
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
            '--use-gl=swiftshader',
            '--autoplay-policy=no-user-gesture-required'
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

    await page.goto(`${address}/?smoke=tutorial-to-phase1`, {
        waitUntil: 'networkidle0',
        timeout: 45000
    });

    await page.waitForFunction(
        () => Boolean(
            window.__MIGUEL_GAME__
            && window.MiguelTutorialManager
            && window.__MIGUEL_TUTORIAL_TRANSITION_GUARD_BUILD__
            && window.__MIGUEL_RESULT_PHASE1_TRANSITION_BUILD__
            && window.__MIGUEL_PHASE1_INSTALLED__
            && window.__MIGUEL_PHASE1_USABILITY_BUILD__
        ),
        { timeout: 25000 }
    );

    await page.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'FLUXO');
        game.registry.set('pontuacao', 70);
        game.scene.start('Tutorial');
    });

    await page.waitForFunction(
        () => {
            const game = window.__MIGUEL_GAME__;
            const scene = game && game.scene.getScene('Tutorial');
            return Boolean(
                scene
                && scene.sys.isActive()
                && scene.tutorial
                && scene.hudJogo
            );
        },
        { timeout: 20000 }
    );

    await page.evaluate(() => {
        const scene = window.__MIGUEL_GAME__.scene.getScene('Tutorial');
        const tutorial = scene.tutorial;

        tutorial.estado.distanciaMovida = 100;
        tutorial.estado.pulo = true;
        tutorial.estado.puloDuplo = true;
        tutorial.estado.agachamento = true;
        tutorial.estado.danoRobo = true;
        tutorial.estado.ataqueRobo = true;
        tutorial.estado.cristais = Math.max(0, tutorial.totalCristais - 1);
        tutorial.indiceAtual = tutorial.objetivos.length - 1;
        tutorial.concluido = false;
        tutorial.avancoAgendado = false;
        tutorial.transicaoFinalExecutada = false;
        tutorial.registrarAcao('cristal');
    });

    await page.waitForFunction(
        () => {
            const game = window.__MIGUEL_GAME__;
            const result = game && game.scene.getScene('ResultadoTutorial');
            return Boolean(
                result
                && result.sys.isActive()
                && result.__MIGUEL_RESULT_PHASE1_GUARD_APPLIED__
                && result.__MIGUEL_START_PHASE1__
            );
        },
        { timeout: 8000 }
    );

    const resultState = await page.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        const tutorial = game.scene.getScene('Tutorial');
        const result = game.scene.getScene('ResultadoTutorial');
        const button = result.children.list.find(
            (object) => object && typeof object.text === 'string'
                && object.text.includes('COMEÇAR A AVENTURA')
        );

        return {
            tutorialActive: Boolean(tutorial && tutorial.sys.isActive()),
            resultActive: Boolean(result && result.sys.isActive()),
            guard: result.__MIGUEL_RESULT_PHASE1_GUARD_APPLIED__,
            buttonFound: Boolean(button),
            tutorialCompleted: game.registry.get('tutorialConcluido')
        };
    });

    console.log('TELA DE CONQUISTA:', JSON.stringify(resultState));

    if (resultState.tutorialActive || !resultState.resultActive) {
        errors.push('tutorial não entregou corretamente a tela de conquista');
    }
    if (!resultState.buttonFound || !resultState.guard) {
        errors.push('botão de iniciar a Fase 1 não recebeu a guarda');
    }
    if (resultState.tutorialCompleted !== true) {
        errors.push('conclusão do tutorial não foi registrada');
    }

    await page.evaluate(() => {
        const manager = window.MIGUEL_DEVICE_MANAGER;
        window.__MIGUEL_TEST_ORIGINAL_FULLSCREEN__ = manager.solicitarTelaCheia;
        manager.solicitarTelaCheia = () => new Promise(() => {});

        const result = window.__MIGUEL_GAME__.scene.getScene('ResultadoTutorial');
        const button = result.children.list.find(
            (object) => object && typeof object.text === 'string'
                && object.text.includes('COMEÇAR A AVENTURA')
        );
        button.emit('pointerdown');
    });

    await page.waitForFunction(
        () => {
            const game = window.__MIGUEL_GAME__;
            const phase = game && game.scene.getScene('Fase1');
            return Boolean(
                phase
                && phase.sys.isActive()
                && phase.player
                && phase.__MIGUEL_EXPLORATION_LOOT_APPLIED__
                && phase.__MIGUEL_PHASE1_USABILITY_APPLIED__
                && phase.__MIGUEL_INTERACTION_BUTTON__
            );
        },
        { timeout: 9000 }
    );

    const phaseState = await page.evaluate(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1200));

        const game = window.__MIGUEL_GAME__;
        const result = game.scene.getScene('ResultadoTutorial');
        const phase = game.scene.getScene('Fase1');
        const manager = window.MIGUEL_DEVICE_MANAGER;
        const diagnostic = window.__MIGUEL_RESULT_PHASE1_TRANSITION_LAST__ || null;
        const build = window.__MIGUEL_RESULT_PHASE1_TRANSITION_BUILD__;

        if (window.__MIGUEL_TEST_ORIGINAL_FULLSCREEN__) {
            manager.solicitarTelaCheia = window.__MIGUEL_TEST_ORIGINAL_FULLSCREEN__;
            delete window.__MIGUEL_TEST_ORIGINAL_FULLSCREEN__;
        }

        return {
            resultActive: Boolean(result && result.sys.isActive()),
            phaseActive: Boolean(phase && phase.sys.isActive()),
            playerActive: Boolean(phase && phase.player && phase.player.active),
            worldWidth: phase && phase.physics ? phase.physics.world.bounds.width : null,
            usability: phase && phase.__MIGUEL_PHASE1_USABILITY_APPLIED__,
            loot: phase && phase.__MIGUEL_EXPLORATION_LOOT_APPLIED__,
            interaction: Boolean(phase && phase.__MIGUEL_INTERACTION_BUTTON__),
            diagnostic,
            build
        };
    });

    console.log('FASE 1 INICIADA:', JSON.stringify(phaseState));

    if (phaseState.resultActive || !phaseState.phaseActive || !phaseState.playerActive) {
        errors.push('tela de conquista não abriu a Fase 1');
    }
    if (phaseState.worldWidth !== 5400) {
        errors.push(`mundo incorreto após a transição: ${phaseState.worldWidth}`);
    }
    if (!phaseState.usability || !phaseState.loot || !phaseState.interaction) {
        errors.push('últimos módulos da Fase 1 não foram aplicados após o tutorial');
    }
    if (!phaseState.diagnostic || phaseState.diagnostic.build !== phaseState.build) {
        errors.push('diagnóstico da transição não foi registrado');
    }

    if (errors.length > 0) {
        console.error('\nSMOKE TUTORIAL → FASE 1 REPROVADO');
        errors.forEach((error) => console.error(`ERRO: ${error}`));
        process.exitCode = 1;
    } else {
        console.log('\nSMOKE TUTORIAL → FASE 1 APROVADO');
    }
} finally {
    if (browser) await browser.close();
    server.kill('SIGTERM');
}