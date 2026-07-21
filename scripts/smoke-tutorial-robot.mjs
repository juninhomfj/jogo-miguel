import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const porta = 4174;
const endereco = `http://127.0.0.1:${porta}`;
const erros = [];

const encontrarChrome = () => {
    const candidatos = [
        process.env.CHROME_BIN,
        '/usr/bin/google-chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/chromium',
        '/usr/bin/chromium-browser'
    ].filter(Boolean);

    for (const candidato of candidatos) {
        try {
            execFileSync(candidato, ['--version'], { stdio: 'ignore' });
            return candidato;
        } catch {
            // Tenta o próximo executável.
        }
    }

    throw new Error('Google Chrome/Chromium não encontrado no runner.');
};

const servidor = spawn(
    'python3',
    ['-m', 'http.server', String(porta), '--bind', '127.0.0.1'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
);

const esperarServidor = async () => {
    for (let tentativa = 0; tentativa < 40; tentativa += 1) {
        try {
            const resposta = await fetch(endereco);
            if (resposta.ok) return;
        } catch {
            // Servidor ainda está iniciando.
        }
        await new Promise((resolve) => setTimeout(resolve, 150));
    }
    throw new Error('Servidor local não respondeu.');
};

let navegador = null;

try {
    await esperarServidor();

    navegador = await puppeteer.launch({
        headless: true,
        executablePath: encontrarChrome(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--use-gl=swiftshader',
            '--autoplay-policy=no-user-gesture-required'
        ]
    });

    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

    pagina.on('pageerror', (erro) => {
        erros.push(`PAGEERROR: ${erro.message}`);
    });

    pagina.on('console', (mensagem) => {
        const texto = mensagem.text();
        if (mensagem.type() === 'error') {
            erros.push(`CONSOLE: ${texto}`);
        }
    });

    await pagina.goto(`${endereco}/?smoke=tutorial-robo`, {
        waitUntil: 'networkidle0',
        timeout: 45000
    });

    await pagina.waitForFunction(
        () => Boolean(
            window.__MIGUEL_GAME__
            && window.__MIGUEL_ROBOT_BEHAVIOR_BUILD__
        ),
        { timeout: 20000 }
    );

    await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'BOT');
        game.registry.set('pontuacao', 0);
        game.scene.start('Tutorial');
    });

    await pagina.waitForFunction(
        () => {
            const game = window.__MIGUEL_GAME__;
            const cena = game && game.scene.getScene('Tutorial');
            return Boolean(
                cena
                && cena.sys.isActive()
                && cena.player
                && cena.vilao
                && cena.sistemaVida
                && cena.projeteisRoboV3
            );
        },
        { timeout: 20000 }
    );

    const antes = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Tutorial');
        cena.player.setPosition(cena.vilao.x - 150, cena.vilao.y);
        cena.player.setVelocity(0, 0);
        cena.vilao.proximoAtaqueV3 = 0;
        cena.vilao.estadoRoboV3 = 'PERSEGUICAO';
        cena.vilao.estadoRoboV3Desde = 0;
        return {
            tempo: cena.time.now,
            vida: cena.sistemaVida.obterEstado().vida,
            estado: cena.vilao.estadoRoboV3
        };
    });

    await new Promise((resolve) => setTimeout(resolve, 1400));

    const depois = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Tutorial');
        return {
            ativa: cena.sys.isActive(),
            tempo: cena.time.now,
            vida: cena.sistemaVida.obterEstado().vida,
            estado: cena.vilao.estadoRoboV3,
            projeteis: cena.projeteisRoboV3
                ? cena.projeteisRoboV3.countActive(true)
                : -1,
            playerAtivo: Boolean(cena.player && cena.player.active),
            roboAtivo: Boolean(cena.vilao && cena.vilao.active)
        };
    });

    console.log('ANTES:', JSON.stringify(antes));
    console.log('DEPOIS:', JSON.stringify(depois));

    if (!depois.ativa || !depois.playerAtivo || !depois.roboAtivo) {
        erros.push('tutorial deixou de permanecer ativo após o disparo');
    }

    if (depois.tempo <= antes.tempo + 700) {
        erros.push('relógio da cena não avançou após o disparo');
    }

    if (!['RECUPERACAO', 'PERSEGUICAO', 'RONDA'].includes(depois.estado)) {
        erros.push(`estado inesperado após disparo: ${depois.estado}`);
    }

    if (erros.length > 0) {
        console.error('\nSMOKE TUTORIAL ROBÔ REPROVADO');
        erros.forEach((erro) => console.error(`ERRO: ${erro}`));
        process.exitCode = 1;
    } else {
        console.log('\nSMOKE TUTORIAL ROBÔ APROVADO');
    }
} finally {
    if (navegador) await navegador.close();
    servidor.kill('SIGTERM');
}
