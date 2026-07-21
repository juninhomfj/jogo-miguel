import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const porta = 4179;
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

    await pagina.goto(`${endereco}/?smoke=phase1-combat-feedback`, {
        waitUntil: 'networkidle0',
        timeout: 45000
    });

    await pagina.waitForFunction(
        () => Boolean(
            window.__MIGUEL_GAME__
            && window.__MIGUEL_PHASE1_INSTALLED__
            && window.__MIGUEL_PHASE1_COMBAT_FEEDBACK_BUILD__
        ),
        { timeout: 20000 }
    );

    await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'FEEDBACK');
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
                && cena.inimigos
                && cena.boss
                && cena.__MIGUEL_PHASE1_COMBAT_FEEDBACK_APPLIED__
            );
        },
        { timeout: 20000 }
    );

    const dano = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        const vidaAntes = cena.sistemaVida.obterEstado().vida;

        cena.sistemaVida.invulneravel = false;
        cena.sistemaVida.morto = false;
        cena.player.estaMachucado = false;
        cena.aplicarDano(10, 'teste-feedback', 1, 0);

        const estado = cena.sistemaVida.obterEstado();

        return {
            vidaAntes,
            vidaDepois: estado.vida,
            contador: cena.__MIGUEL_PHASE1_DAMAGE_FEEDBACK_COUNT__,
            playerAtivo: Boolean(cena.player && cena.player.active),
            corpoAtivo: Boolean(cena.player && cena.player.body && cena.player.body.enable)
        };
    });

    console.log('DANO:', JSON.stringify(dano));

    if (dano.vidaDepois >= dano.vidaAntes) {
        erros.push('dano de teste não reduziu a vida');
    }

    if (dano.contador < 1) {
        erros.push('feedback de dano não foi contabilizado');
    }

    if (!dano.playerAtivo || !dano.corpoAtivo) {
        erros.push('Miguel ou corpo físico ficou inativo após feedback de dano');
    }

    const inimigoPreparado = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        const inimigo = cena.inimigos.getFirstAlive();

        if (!inimigo) return null;

        const vidaMaxima = Number(inimigo.getData('vidaMaxima') || 2);
        inimigo.setData('vida', Math.max(1, vidaMaxima - 1));
        window.__MIGUEL_INIMIGO_TESTE_FEEDBACK__ = inimigo;

        return {
            vida: inimigo.getData('vida'),
            vidaMaxima,
            tipo: inimigo.getData('tipo')
        };
    });

    await new Promise((resolve) => setTimeout(resolve, 180));

    const barra = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        const inimigo = window.__MIGUEL_INIMIGO_TESTE_FEEDBACK__;
        const mapa = cena.__MIGUEL_ENEMY_HEALTH_BARS__;
        const visual = mapa && inimigo ? mapa.get(inimigo) : null;

        return {
            inimigoExiste: Boolean(inimigo),
            barras: mapa ? mapa.size : -1,
            fundoVisivel: Boolean(visual && visual.fundo && visual.fundo.visible),
            barraVisivel: Boolean(visual && visual.barra && visual.barra.visible)
        };
    });

    console.log('BARRA INIMIGO:', JSON.stringify({ inimigoPreparado, barra }));

    if (!barra.inimigoExiste || barra.barras < 1) {
        erros.push('barra de vida dos mini-vilões não foi criada');
    }

    if (!barra.fundoVisivel || !barra.barraVisivel) {
        erros.push('barra do inimigo ferido não ficou visível');
    }

    await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        cena.iniciarBoss();
        cena.boss.setData('vida', 8);
    });

    await new Promise((resolve) => setTimeout(resolve, 220));

    await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        cena.boss.setData('vida', 4);
    });

    await new Promise((resolve) => setTimeout(resolve, 220));

    const boss = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        return {
            fase: cena.__MIGUEL_BOSS_PHASE__,
            avisos: cena.__MIGUEL_BOSS_PHASE_CUE_COUNT__,
            bossAtivo: cena.bossAtivo,
            bossExiste: Boolean(cena.boss && cena.boss.active)
        };
    });

    console.log('FASES DO CHEFÃO:', JSON.stringify(boss));

    if (boss.fase !== 3) {
        erros.push(`fase final do chefão não foi detectada: ${boss.fase}`);
    }

    if (boss.avisos < 2) {
        erros.push(`transições do chefão não foram anunciadas: ${boss.avisos}`);
    }

    await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('resultadoFase1', {
            pontosFase: 3000,
            pontosFinais: 3070,
            tempoSegundos: 180,
            bonusTempo: 60,
            bonusVida: 500,
            bonusSemDano: 500,
            bonusColeta: 400,
            cristais: 16,
            totalCristais: 16,
            inimigosDerrotados: 8,
            danosRecebidos: 0,
            bossDerrotado: true
        });
        game.scene.stop('Fase1');
        game.scene.start('ResultadoFase1');
    });

    await pagina.waitForFunction(
        () => {
            const game = window.__MIGUEL_GAME__;
            const cena = game && game.scene.getScene('ResultadoFase1');
            return Boolean(
                cena
                && cena.sys.isActive()
                && cena.__MIGUEL_PHASE1_RESULT_FEEDBACK_APPLIED__
            );
        },
        { timeout: 10000 }
    );

    const resultado = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('ResultadoFase1');
        return {
            rank: cena.__MIGUEL_PHASE1_RANK__,
            textoAtivo: Boolean(
                cena.__MIGUEL_PHASE1_RANK_TEXT__
                && cena.__MIGUEL_PHASE1_RANK_TEXT__.active
            ),
            cenaAtiva: cena.sys.isActive()
        };
    });

    console.log('RESULTADO:', JSON.stringify(resultado));

    if (resultado.rank !== 'S') {
        erros.push(`classificação perfeita inesperada: ${resultado.rank}`);
    }

    if (!resultado.textoAtivo || !resultado.cenaAtiva) {
        erros.push('classificação não ficou ativa na tela de resultado');
    }

    if (erros.length > 0) {
        console.error('\nSMOKE FEEDBACK DE COMBATE REPROVADO');
        erros.forEach((erro) => console.error(`ERRO: ${erro}`));
        process.exitCode = 1;
    } else {
        console.log('\nSMOKE FEEDBACK DE COMBATE APROVADO');
    }
} finally {
    if (navegador) await navegador.close();
    servidor.kill('SIGTERM');
}
