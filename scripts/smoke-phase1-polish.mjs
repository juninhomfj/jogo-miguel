import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const porta = 4175;
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
            '--use-gl=swiftshader'
        ]
    });

    const pagina = await navegador.newPage();
    await pagina.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });

    pagina.on('pageerror', (erro) => {
        erros.push(`PAGEERROR: ${erro.message}`);
    });

    pagina.on('console', (mensagem) => {
        const texto = mensagem.text();
        if (
            mensagem.type() === 'error'
            && !texto.startsWith('Failed to load resource:')
        ) {
            erros.push(`CONSOLE: ${texto}`);
        }
    });

    await pagina.goto(`${endereco}/?smoke=phase1-polish`, {
        waitUntil: 'networkidle0',
        timeout: 45000
    });

    await pagina.waitForFunction(
        () => Boolean(
            window.__MIGUEL_GAME__
            && window.__MIGUEL_PHASE1_INSTALLED__
            && window.__MIGUEL_PHASE1_POLISH_BUILD__
        ),
        { timeout: 20000 }
    );

    await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'POL');
        game.registry.set('pontuacao', 0);
        game.scene.start('Fase1');
    });

    await pagina.waitForFunction(
        () => {
            const game = window.__MIGUEL_GAME__;
            const cena = game && game.scene.getScene('Fase1');
            return Boolean(
                cena
                && cena.sys.isActive()
                && cena.player
                && cena.sistemaVida
                && cena.__MIGUEL_PHASE1_POLISH_APPLIED__
            );
        },
        { timeout: 20000 }
    );

    const estado = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        const camera = cena.cameras.main;
        const inimigos = {};

        cena.inimigos.children.iterate((inimigo) => {
            if (!inimigo || !inimigo.active) return;
            const tipo = inimigo.getData('tipo') || 'sentinela';
            inimigos[tipo] = inimigo.getData('dano');
        });

        const vidaAntes = cena.sistemaVida.obterEstado().vida;
        cena.aplicarDano(999, 'laser', 1, -120);
        const vidaDepois = cena.sistemaVida.obterEstado().vida;

        return {
            build: window.__MIGUEL_PHASE1_POLISH_BUILD__,
            aplicado: cena.__MIGUEL_PHASE1_POLISH_APPLIED__,
            vidaAntes,
            vidaDepois,
            invulnerabilidade: cena.sistemaVida.duracaoInvulnerabilidade,
            camera: {
                deadzoneLargura: camera.deadzone ? camera.deadzone.width : null,
                deadzoneAltura: camera.deadzone ? camera.deadzone.height : null,
                roundPixels: camera.roundPixels
            },
            inimigos,
            cenaAtiva: cena.sys.isActive(),
            playerAtivo: cena.player.active,
            playerTemBody: Boolean(cena.player.body)
        };
    });

    console.log('POLIMENTO:', JSON.stringify(estado));

    if (estado.build !== 'phase1-polish-v1-20260721') {
        erros.push(`build de polimento inesperada: ${estado.build}`);
    }

    if (estado.vidaAntes - estado.vidaDepois !== 16) {
        erros.push(
            `dano de laser não foi balanceado para 16: `
            + `${estado.vidaAntes} -> ${estado.vidaDepois}`
        );
    }

    if (estado.invulnerabilidade !== 1200) {
        erros.push(
            `invulnerabilidade inesperada: ${estado.invulnerabilidade}`
        );
    }

    if (
        estado.camera.deadzoneLargura !== 250
        || estado.camera.deadzoneAltura !== 190
        || estado.camera.roundPixels !== true
    ) {
        erros.push(`câmera não recebeu o ajuste esperado: ${JSON.stringify(estado.camera)}`);
    }

    if (estado.inimigos.drone !== 10) {
        erros.push(`dano do drone inesperado: ${estado.inimigos.drone}`);
    }

    if (estado.inimigos.torre !== 13) {
        erros.push(`dano da torre inesperado: ${estado.inimigos.torre}`);
    }

    if (estado.inimigos['mini-chefe'] !== 18) {
        erros.push(
            `dano do mini-chefe inesperado: ${estado.inimigos['mini-chefe']}`
        );
    }

    if (!estado.cenaAtiva || !estado.playerAtivo || !estado.playerTemBody) {
        erros.push('Fase 1 ou Miguel ficaram inválidos após o teste de dano');
    }

    if (erros.length > 0) {
        console.error('\nSMOKE POLIMENTO FASE 1 REPROVADO');
        erros.forEach((erro) => console.error(`ERRO: ${erro}`));
        process.exitCode = 1;
    } else {
        console.log('\nSMOKE POLIMENTO FASE 1 APROVADO');
    }
} finally {
    if (navegador) await navegador.close();
    servidor.kill('SIGTERM');
}
