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

const esperarResultado = async (pagina, timeout = 6000) => {
    try {
        await pagina.waitForFunction(
            () => {
                const game = window.__MIGUEL_GAME__;
                const resultado = game && game.scene.getScene('ResultadoTutorial');
                return Boolean(resultado && resultado.sys.isActive());
            },
            { timeout }
        );
        return true;
    } catch {
        return false;
    }
};

const esperarTutorial = async (pagina, exigirResultadoInativo = false) => {
    await pagina.waitForFunction(
        (resultadoDeveEstarInativo) => {
            const game = window.__MIGUEL_GAME__;
            const cena = game && game.scene.getScene('Tutorial');
            const resultado = game && game.scene.getScene('ResultadoTutorial');
            const tutorialPronto = Boolean(
                cena
                && cena.sys.isActive()
                && cena.tutorial
                && cena.hudJogo
            );
            const resultadoInativo = !resultado || !resultado.sys.isActive();
            return tutorialPronto && (!resultadoDeveEstarInativo || resultadoInativo);
        },
        { timeout: 20000 },
        exigirResultadoInativo
    );
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
    await pagina.setViewport({
        width: 1180,
        height: 820,
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true
    });

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
            && window.__MIGUEL_TUTORIAL_TRANSITION_GUARD_BUILD__
            && window.__MIGUEL_MOBILE_CONTROLS_COMPAT_BUILD__
        ),
        { timeout: 20000 }
    );

    await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'FINAL');
        game.registry.set('pontuacao', 70);
        game.scene.start('Tutorial');
    });

    await esperarTutorial(pagina);

    const inicioNormal = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Tutorial');
        const tutorial = cena.tutorial;

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

        return {
            etapa: tutorial.indiceAtual + 1,
            cristais: tutorial.estado.cristais,
            totalCristais: tutorial.totalCristais,
            concluido: tutorial.concluido
        };
    });

    console.log('FLUXO NORMAL INICIADO:', JSON.stringify(inicioNormal));

    const normalAbriu = await esperarResultado(pagina, 6000);
    if (!normalAbriu) {
        erros.push('fluxo real do último objetivo não abriu ResultadoTutorial');
    }

    const estadoNormal = await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        const tutorial = game.scene.getScene('Tutorial');
        const resultado = game.scene.getScene('ResultadoTutorial');
        return {
            tutorialAtivo: Boolean(tutorial && tutorial.sys.isActive()),
            resultadoAtivo: Boolean(resultado && resultado.sys.isActive()),
            tutorialConcluido: game.registry.get('tutorialConcluido'),
            guarda: window.__MIGUEL_TUTORIAL_TRANSITION_GUARD_LAST__ || null
        };
    });

    console.log('FLUXO NORMAL FINAL:', JSON.stringify(estadoNormal));

    if (normalAbriu) {
        await pagina.evaluate(() => {
            const game = window.__MIGUEL_GAME__;
            window.__MIGUEL_TUTORIAL_TRANSITION_GUARD_LAST__ = null;
            window.__MIGUEL_TRANSICAO_SABOTADA__ = false;
            game.scene.stop('ResultadoTutorial');
            game.scene.start('Tutorial');
        });

        await esperarTutorial(pagina, true);

        const inicioRecuperacao = await pagina.evaluate(() => {
            const cena = window.__MIGUEL_GAME__.scene.getScene('Tutorial');
            const tutorial = cena.tutorial;

            tutorial.onComplete = () => {
                window.__MIGUEL_TRANSICAO_SABOTADA__ = true;
            };
            tutorial.finalizar();

            return {
                concluido: tutorial.concluido,
                transicaoExecutada: tutorial.transicaoFinalExecutada,
                guardaBuild: window.__MIGUEL_TUTORIAL_TRANSITION_GUARD_BUILD__
            };
        });

        console.log('RECUPERAÇÃO INICIADA:', JSON.stringify(inicioRecuperacao));

        const recuperacaoAbriu = await esperarResultado(pagina, 7000);
        if (!recuperacaoAbriu) {
            erros.push('guarda não recuperou uma conclusão sem transição');
        }

        const estadoRecuperacao = await pagina.evaluate(() => {
            const game = window.__MIGUEL_GAME__;
            const tutorial = game.scene.getScene('Tutorial');
            const resultado = game.scene.getScene('ResultadoTutorial');
            return {
                tutorialAtivo: Boolean(tutorial && tutorial.sys.isActive()),
                resultadoAtivo: Boolean(resultado && resultado.sys.isActive()),
                tutorialConcluido: game.registry.get('tutorialConcluido'),
                sabotada: Boolean(window.__MIGUEL_TRANSICAO_SABOTADA__),
                guarda: window.__MIGUEL_TUTORIAL_TRANSITION_GUARD_LAST__ || null
            };
        });

        console.log('RECUPERAÇÃO FINAL:', JSON.stringify(estadoRecuperacao));

        if (
            recuperacaoAbriu
            && (!estadoRecuperacao.guarda || estadoRecuperacao.guarda.forçado !== true)
        ) {
            erros.push('recuperação abriu resultado sem registrar acionamento da guarda');
        }

        if (estadoRecuperacao.tutorialAtivo) {
            erros.push('tutorial permaneceu ativo após recuperação forçada');
        }
    }

    if (!estadoNormal.resultadoAtivo) {
        erros.push('tela de conquista não ficou ativa no fluxo normal');
    }

    if (estadoNormal.tutorialAtivo) {
        erros.push('tutorial permaneceu ativo depois da conclusão normal');
    }

    if (estadoNormal.tutorialConcluido !== true) {
        erros.push('registro tutorialConcluido não foi salvo no fluxo normal');
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
