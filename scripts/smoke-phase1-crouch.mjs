import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const porta = 4180;
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

    await pagina.goto(`${endereco}/?smoke=phase1-crouch`, {
        waitUntil: 'networkidle0',
        timeout: 45000
    });

    await pagina.waitForFunction(
        () => Boolean(
            window.__MIGUEL_GAME__
            && window.__MIGUEL_PHASE1_INSTALLED__
            && window.__MIGUEL_PHASE1_CROUCH_GUARD_BUILD__
        ),
        { timeout: 20000 }
    );

    await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'AGACHA');
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
                && cena.player.body
                && cena.controles
                && cena.crouchVisual
                && cena.__MIGUEL_PHASE1_CROUCH_GUARD_APPLIED__
            );
        },
        { timeout: 20000 }
    );

    const resultado = await pagina.evaluate(async () => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        cena.bloqueioInicioAte = 0;

        cena.controles.estaAgachando = () => true;
        cena.controles.obterMovimentoX = () => 0;
        cena.controles.obterMovimentoY = () => 0;
        cena.controles.consumirPulo = () => false;
        cena.controles.consumirAtaque = () => false;
        cena.controles.consumirPausa = () => false;
        cena.controles.consumirReiniciar = () => false;

        cena.sairAgachamento(true);
        cena.player.estaMachucado = false;
        cena.player.estaAtacando = false;
        cena.entrarAgachamento();

        const amostras = [];
        for (let indice = 0; indice < 18; indice += 1) {
            await new Promise((resolve) => setTimeout(resolve, 35));
            amostras.push({
                agachado: Boolean(cena.player.estaAgachado),
                playerVisivel: Boolean(cena.player.visible),
                crouchVisivel: Boolean(cena.crouchVisual.visible),
                gravidade: Boolean(cena.player.body.allowGravity)
            });
        }

        const supressoes = Number(
            cena.__MIGUEL_CROUCH_EXIT_SUPPRESSED_COUNT__ || 0
        );

        cena.controles.estaAgachando = () => false;
        await new Promise((resolve) => setTimeout(resolve, 140));

        const liberado = {
            agachado: Boolean(cena.player.estaAgachado),
            playerVisivel: Boolean(cena.player.visible),
            crouchVisivel: Boolean(cena.crouchVisual.visible),
            gravidade: Boolean(cena.player.body.allowGravity)
        };

        cena.controles.estaAgachando = () => true;
        cena.controles.obterMovimentoX = () => 0;
        cena.entrarAgachamento();
        await new Promise((resolve) => setTimeout(resolve, 80));
        cena.controles.obterMovimentoX = () => 0.65;
        await new Promise((resolve) => setTimeout(resolve, 140));

        const movimento = {
            agachado: Boolean(cena.player.estaAgachado),
            playerVisivel: Boolean(cena.player.visible),
            crouchVisivel: Boolean(cena.crouchVisual.visible),
            gravidade: Boolean(cena.player.body.allowGravity)
        };

        return {
            build: window.__MIGUEL_PHASE1_CROUCH_GUARD_BUILD__,
            supressoes,
            amostras,
            liberado,
            movimento
        };
    });

    console.log('AGACHAMENTO FASE 1:', JSON.stringify(resultado));

    const estavel = resultado.amostras.every((amostra) => (
        amostra.agachado
        && !amostra.playerVisivel
        && amostra.crouchVisivel
        && !amostra.gravidade
    ));

    if (!estavel) {
        erros.push('estado agachado alternou entre agachado e em pé');
    }

    if (resultado.supressoes < 1) {
        erros.push('proteção não interceptou a saída transitória do agachamento');
    }

    if (
        resultado.liberado.agachado
        || !resultado.liberado.playerVisivel
        || resultado.liberado.crouchVisivel
        || !resultado.liberado.gravidade
    ) {
        erros.push('Miguel não voltou ao estado em pé após soltar o comando');
    }

    if (
        resultado.movimento.agachado
        || !resultado.movimento.playerVisivel
        || resultado.movimento.crouchVisivel
        || !resultado.movimento.gravidade
    ) {
        erros.push('movimento horizontal não encerrou o agachamento');
    }

    if (erros.length > 0) {
        console.error('\nSMOKE AGACHAMENTO FASE 1 REPROVADO');
        erros.forEach((erro) => console.error(`ERRO: ${erro}`));
        process.exitCode = 1;
    } else {
        console.log('\nSMOKE AGACHAMENTO FASE 1 APROVADO');
    }
} finally {
    if (navegador) await navegador.close();
    servidor.kill('SIGTERM');
}
