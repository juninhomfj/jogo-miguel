import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const porta = 4178;
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
        erros.push(`PAGEERROR: ${erro.stack || erro.message}`);
    });

    pagina.on('console', (mensagem) => {
        const texto = mensagem.text();
        if (
            mensagem.type() === 'error'
            && !texto.includes('Failed to load resource: the server responded with a status of 404')
        ) {
            erros.push(`CONSOLE: ${texto}`);
        }
    });

    await pagina.goto(`${endereco}/?smoke=tutorial-completion`, {
        waitUntil: 'networkidle0',
        timeout: 45000
    });

    await pagina.waitForFunction(
        () => Boolean(
            window.__MIGUEL_GAME__
            && window.MiguelTutorialManager
            && window.__MIGUEL_TUTORIAL_AUDIO_BUILD__
        ),
        { timeout: 20000 }
    );

    await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'FINAL');
        game.registry.set('pontuacao', 70);
        game.scene.start('Tutorial');
    });

    await pagina.waitForFunction(
        () => {
            const game = window.__MIGUEL_GAME__;
            const cena = game && game.scene.getScene('Tutorial');
            return Boolean(
                cena
                && cena.sys.isActive()
                && cena.tutorial
                && cena.hudJogo
                && cena.__miguelTutorialAudioBuild
            );
        },
        { timeout: 20000 }
    );

    const antes = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Tutorial');
        cena.tutorial.finalizar();
        return {
            ativa: cena.sys.isActive(),
            concluido: cena.tutorial.concluido,
            transicaoExecutada: cena.tutorial.transicaoFinalExecutada,
            travaCena: cena.transicaoTutorialEmAndamento
        };
    });

    console.log('ANTES DA TRANSIÇÃO:', JSON.stringify(antes));

    try {
        await pagina.waitForFunction(
            () => {
                const game = window.__MIGUEL_GAME__;
                const resultado = game && game.scene.getScene('ResultadoTutorial');
                return Boolean(resultado && resultado.sys.isActive());
            },
            { timeout: 5000 }
        );
    } catch {
        erros.push('ResultadoTutorial não abriu após tutorial.finalizar()');
    }

    const depois = await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        const tutorial = game.scene.getScene('Tutorial');
        const resultado = game.scene.getScene('ResultadoTutorial');
        return {
            tutorialAtivo: Boolean(tutorial && tutorial.sys.isActive()),
            resultadoAtivo: Boolean(resultado && resultado.sys.isActive()),
            tutorialConcluido: game.registry.get('tutorialConcluido'),
            gerenciador: tutorial && tutorial.tutorial
                ? tutorial.tutorial.obterEstado()
                : null,
            transicaoExecutada: tutorial && tutorial.tutorial
                ? tutorial.tutorial.transicaoFinalExecutada
                : null,
            travaCena: tutorial
                ? tutorial.transicaoTutorialEmAndamento
                : null
        };
    });

    console.log('DEPOIS DA TRANSIÇÃO:', JSON.stringify(depois));

    if (!depois.resultadoAtivo) {
        erros.push('tela de conquista não ficou ativa');
    }

    if (depois.tutorialAtivo) {
        erros.push('tutorial permaneceu ativo depois da conclusão');
    }

    if (depois.tutorialConcluido !== true) {
        erros.push('registro tutorialConcluido não foi salvo');
    }

    if (erros.length > 0) {
        console.error('\nSMOKE CONCLUSÃO DO TUTORIAL REPROVADO');
        erros.forEach((erro) => console.error(`ERRO: ${erro}`));
        process.exitCode = 1;
    } else {
        console.log('\nSMOKE CONCLUSÃO DO TUTORIAL APROVADO');
    }
} finally {
    if (navegador) await navegador.close();
    servidor.kill('SIGTERM');
}
