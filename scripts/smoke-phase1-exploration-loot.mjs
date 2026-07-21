import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const porta = 4181;
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

    await pagina.goto(`${endereco}/?smoke=phase1-exploration-loot`, {
        waitUntil: 'networkidle0',
        timeout: 45000
    });

    await pagina.evaluate(() => {
        localStorage.removeItem('miguel-inventario-v1');
    });

    await pagina.waitForFunction(
        () => Boolean(
            window.__MIGUEL_GAME__
            && window.__MIGUEL_PHASE1_INSTALLED__
            && window.__MIGUEL_EXPLORATION_LOOT_BUILD__
            && window.__MIGUEL_EXPLORATION_COMPAT_BUILD__
            && window.__MIGUEL_PHASE1_USABILITY_BUILD__
            && window.MIGUEL_LOOT_SYSTEM
        ),
        { timeout: 20000 }
    );

    await pagina.evaluate(() => {
        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'BAUS');
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
                && cena.__MIGUEL_EXPLORATION_LOOT_APPLIED__
                && cena.__MIGUEL_EXPLORATION_COMPAT_APPLIED__
                && cena.__MIGUEL_HOVERBOARD_STATE__
                && cena.__MIGUEL_PHASE1_USABILITY_APPLIED__
                && cena.__MIGUEL_PHASE1_USABILITY_STATE__
            );
        },
        { timeout: 20000 }
    );

    const estrutura = await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        cena.bloqueioInicioAte = 0;

        if (cena.inimigos && cena.inimigos.children) {
            cena.inimigos.children.iterate((inimigo) => {
                if (inimigo && inimigo.body) inimigo.body.enable = false;
            });
        }
        if (cena.lasers && cena.lasers.children) {
            cena.lasers.children.iterate((laser) => {
                if (laser && laser.body) laser.body.enable = false;
            });
        }

        const coletaveis = [];
        cena.coletaveis.children.iterate((item) => {
            if (item) coletaveis.push({
                x: item.x,
                depth: item.depth,
                textura: item.texture.key
            });
        });

        const lasers = [];
        cena.lasers.children.iterate((laser) => {
            if (laser) lasers.push(laser.x);
        });
        lasers.sort((a, b) => a - b);

        const inimigos = [];
        cena.inimigos.children.iterate((inimigo) => {
            if (!inimigo) return;
            const tipo = inimigo.getData('tipo');
            if (tipo === 'sentinela' || tipo === 'mini-chefe') {
                inimigos.push({
                    tipo,
                    x: inimigo.x,
                    minX: inimigo.getData('minX'),
                    maxX: inimigo.getData('maxX')
                });
            }
        });

        const plataformas = [];
        cena.plataformas.children.iterate((plataforma) => {
            if (
                plataforma
                && [1450, 2320, 3770, 4130].some((x) => Math.abs(plataforma.x - x) < 4)
            ) {
                plataformas.push({ x: plataforma.x, largura: plataforma.displayWidth });
            }
        });

        const legado = cena.__MIGUEL_HOVERBOARD_STATE__;
        const usabilidade = cena.__MIGUEL_PHASE1_USABILITY_STATE__;
        return {
            build: window.__MIGUEL_EXPLORATION_LOOT_BUILD__,
            powerAvailable: cena.__MIGUEL_PHASE1_POWER_AVAILABLE__,
            powerConfig: window.MIGUEL_PHASE_CONFIG.fases.Fase1.controles.includes('poder'),
            interactionConfig: window.MIGUEL_PHASE_CONFIG.fases.Fase1.controles.includes('interagir'),
            coletaveis,
            lasers,
            inimigos,
            plataformas,
            baus: usabilidade.chests.length,
            bausLegadosAtivos: legado.baus ? legado.baus.countActive(true) : -1,
            visuaisLaser: legado.visuaisLaser.length,
            inventario: usabilidade.inventory
        };
    });

    console.log('ESTRUTURA EXPLORAÇÃO:', JSON.stringify(estrutura));

    if (!estrutura.powerAvailable || !estrutura.powerConfig || !estrutura.interactionConfig) {
        erros.push('poder ou interação não ficaram disponíveis na Fase 1');
    }

    if (estrutura.coletaveis.length !== 16) {
        erros.push(`quantidade inesperada de cristais: ${estrutura.coletaveis.length}`);
    }

    if (!estrutura.coletaveis.every((item) => item.depth >= 30)) {
        erros.push('existem cristais atrás das camadas semitransparentes');
    }

    if (!estrutura.coletaveis.every((item) => item.textura === 'fase1_cristal_eletrico_v2')) {
        erros.push('cristais não receberam o visual elétrico atualizado');
    }

    if (JSON.stringify(estrutura.lasers) !== JSON.stringify([1720, 2680, 4250])) {
        erros.push(`posições dos lasers inesperadas: ${estrutura.lasers.join(',')}`);
    }

    if (estrutura.visuaisLaser !== 3) {
        erros.push('novo efeito visual não foi criado para todos os lasers');
    }

    if (estrutura.baus !== 4) {
        erros.push(`quantidade inesperada de baús: ${estrutura.baus}`);
    }

    if (estrutura.plataformas.length !== 4) {
        erros.push('plataformas de combate não foram ampliadas');
    }

    const miniChefe = estrutura.inimigos.find((inimigo) => inimigo.tipo === 'mini-chefe');
    if (!miniChefe || miniChefe.maxX > 3990) {
        erros.push('mini-chefe continua sem área segura antes do laser final');
    }

    const coleta = await pagina.evaluate(async () => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        const usabilidade = cena.__MIGUEL_PHASE1_USABILITY_STATE__;
        const legado = cena.__MIGUEL_HOVERBOARD_STATE__;

        for (const bau of usabilidade.chests) {
            cena.player.setPosition(bau.x, bau.y - 65);
            if (cena.player.body && typeof cena.player.body.reset === 'function') {
                cena.player.body.reset(bau.x, bau.y - 65);
            }
            await new Promise((resolve) => setTimeout(resolve, 150));
            cena.__MIGUEL_INTERACT__();
            await new Promise((resolve) => setTimeout(resolve, 170));
        }

        return {
            inventario: { ...usabilidade.inventory },
            montado: legado.montado,
            hoverboardVisivel: usabilidade.hoverboard.container.visible,
            bausAbertos: usabilidade.inventory.bausAbertos.length,
            interacoes: cena.__MIGUEL_CHEST_INTERACTION_COUNT__
        };
    });

    console.log('COLETA DE BAÚS:', JSON.stringify(coleta));

    for (const item of ['hoverboard', 'luvasEnergia', 'escudoIonico', 'blasterPulso']) {
        if (!coleta.inventario[item]) {
            erros.push(`item não coletado: ${item}`);
        }
    }

    if (coleta.bausAbertos !== 4 || coleta.interacoes !== 4) {
        erros.push(`baús abertos não persistiram: ${coleta.bausAbertos}/${coleta.interacoes}`);
    }

    if (!coleta.montado || !coleta.hoverboardVisivel) {
        erros.push('hoverboard não foi montado após a coleta');
    }

    const poder = await pagina.evaluate(async () => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Fase1');
        let pendente = true;
        cena.controles.consumirPoder = () => {
            if (!pendente) return false;
            pendente = false;
            return true;
        };
        cena.controles.obterMovimentoY = () => 0;
        await new Promise((resolve) => setTimeout(resolve, 180));

        return {
            usos: cena.__MIGUEL_PHASE1_POWER_USE_COUNT__,
            proximoPoder: cena.__MIGUEL_HOVERBOARD_STATE__.proximoPoder,
            agora: cena.time.now,
            cenaAtiva: cena.sys.isActive(),
            playerAtivo: Boolean(cena.player && cena.player.active)
        };
    });

    console.log('PODER:', JSON.stringify(poder));

    if (poder.usos < 1 || poder.proximoPoder <= poder.agora) {
        erros.push('poder de pulso não foi executado ou entrou em cooldown');
    }

    if (!poder.cenaAtiva || !poder.playerAtivo) {
        erros.push('cena ou Miguel ficaram inativos após usar o poder');
    }

    if (erros.length > 0) {
        console.error('\nSMOKE EXPLORAÇÃO E LOOT REPROVADO');
        erros.forEach((erro) => console.error(`ERRO: ${erro}`));
        process.exitCode = 1;
    } else {
        console.log('\nSMOKE EXPLORAÇÃO E LOOT APROVADO');
    }
} finally {
    if (navegador) await navegador.close();
    servidor.kill('SIGTERM');
}
