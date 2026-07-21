import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const porta = 4173;
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
        const pilha = erro && erro.stack
            ? String(erro.stack)
            : String(erro && erro.message ? erro.message : erro);
        erros.push(`PAGEERROR:\n${pilha}`);
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

    pagina.on('response', (resposta) => {
        if (
            resposta.status() >= 400
            && !resposta.url().endsWith('/favicon.ico')
        ) {
            erros.push(`HTTP ${resposta.status()}: ${resposta.url()}`);
        }
    });

    pagina.on('requestfailed', (requisicao) => {
        if (requisicao.url().endsWith('/favicon.ico')) return;
        const falha = requisicao.failure();
        erros.push(
            `REQUEST FAILED: ${requisicao.url()} — `
            + `${falha ? falha.errorText : 'falha desconhecida'}`
        );
    });

    await pagina.goto(`${endereco}/?smoke=1`, {
        waitUntil: 'networkidle0',
        timeout: 45000
    });

    await pagina.waitForFunction(
        () => Boolean(
            window.__MIGUEL_GAME__
            && window.__MIGUEL_PHASE1_INSTALLED__
            && window.MIGUEL_AUDIO_MANAGER
        ),
        { timeout: 20000 }
    );

    await pagina.mouse.click(20, 20);

    const instalacao = await pagina.evaluate(() => ({
        fase: window.__MIGUEL_PHASE1_INSTALLED__,
        audio: Boolean(window.MIGUEL_AUDIO_MANAGER),
        robo: window.__MIGUEL_ROBOT_BEHAVIOR_BUILD__ || null
    }));

    console.log('INSTALAÇÃO:', JSON.stringify(instalacao));

    await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'SMOKE');
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
                && cena.boss
                && cena.hudJogo
                && cena.sistemaVida
            );
        },
        { timeout: 20000 }
    );

    const estrutura = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        return {
            build: window.__MIGUEL_PHASE1_BUILD__,
            larguraMundo: cena.physics.world.bounds.width,
            plataformas: cena.plataformas.getLength(),
            moveis: cena.plataformasMoveis.getLength(),
            inimigos: cena.inimigos.getLength(),
            cristais: cena.coletaveis.getLength(),
            checkpoints: cena.checkpoints.getLength(),
            bossVida: cena.boss.getData('vida'),
            playerAtivo: cena.player.active,
            controles: Boolean(cena.controles),
            hud: Boolean(cena.hudJogo),
            vida: cena.sistemaVida.obterEstado()
        };
    });

    console.log('ESTRUTURA:', JSON.stringify(estrutura));

    if (estrutura.larguraMundo !== 5400) {
        erros.push(`largura do mundo inesperada: ${estrutura.larguraMundo}`);
    }
    if (estrutura.plataformas < 15) {
        erros.push(`poucas plataformas: ${estrutura.plataformas}`);
    }
    if (estrutura.inimigos < 8) {
        erros.push(`poucos inimigos: ${estrutura.inimigos}`);
    }
    if (estrutura.cristais !== 16) {
        erros.push(`quantidade de cristais inesperada: ${estrutura.cristais}`);
    }
    if (estrutura.checkpoints !== 2) {
        erros.push(`quantidade de checkpoints inesperada: ${estrutura.checkpoints}`);
    }
    if (estrutura.bossVida !== 12) {
        erros.push(`vida inicial do chefão inesperada: ${estrutura.bossVida}`);
    }

    const arena = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        cena.iniciarBoss();
        return {
            bossAtivo: cena.bossAtivo,
            portaoAtivo: Boolean(cena.portaoArena.body && cena.portaoArena.body.enable),
            barraVisivel: cena.textoBoss.visible
        };
    });

    console.log('ARENA:', JSON.stringify(arena));

    if (!arena.bossAtivo || !arena.portaoAtivo || !arena.barraVisivel) {
        erros.push('arena do chefão não foi ativada integralmente');
    }

    const combate = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        for (let golpe = 0; golpe < 12; golpe += 1) {
            cena.boss.setData('invulneravelAte', 0);
            cena.atingirBoss(1);
        }
        return {
            bossDerrotado: cena.bossDerrotado,
            bossAtivo: cena.bossAtivo,
            pontos: cena.pontos
        };
    });

    console.log('COMBATE:', JSON.stringify(combate));

    if (!combate.bossDerrotado || combate.bossAtivo) {
        erros.push('derrota do chefão não concluiu o estado de combate');
    }

    await new Promise((resolve) => setTimeout(resolve, 1800));

    const resultado = await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        const cena = game.scene.getScene('ResultadoFase1');
        const dados = game.registry.get('resultadoFase1');
        return {
            cenaAtiva: Boolean(cena && cena.sys.isActive()),
            dados: dados || null
        };
    });

    console.log('RESULTADO:', JSON.stringify(resultado));

    if (!resultado.cenaAtiva || !resultado.dados || !resultado.dados.bossDerrotado) {
        erros.push('ResultadoFase1 não recebeu a conclusão da fase');
    }

    if (erros.length > 0) {
        console.error('\nSMOKE TEST REPROVADO');
        erros.forEach((erro) => console.error(`ERRO: ${erro}`));
        process.exitCode = 1;
    } else {
        console.log('\nSMOKE TEST APROVADO');
    }
} finally {
    if (navegador) await navegador.close();
    servidor.kill('SIGTERM');
}
