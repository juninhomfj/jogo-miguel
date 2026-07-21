import { spawn, execFileSync } from 'node:child_process';
import process from 'node:process';
import puppeteer from 'puppeteer-core';

const porta = 4176;
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
        const recursoAusenteGenerico = texto.includes(
            'Failed to load resource: the server responded with a status of 404'
        );

        if (mensagem.type() === 'error' && !recursoAusenteGenerico) {
            erros.push(`CONSOLE: ${texto}`);
        }
    });

    await pagina.goto(`${endereco}/?smoke=tutorial-audio`, {
        waitUntil: 'networkidle0',
        timeout: 45000
    });

    await pagina.waitForFunction(
        () => Boolean(
            window.__MIGUEL_GAME__
            && window.MIGUEL_AUDIO_MANAGER
            && window.__MIGUEL_AUDIO_EXTENSIONS_BUILD__
            && window.__MIGUEL_TUTORIAL_AUDIO_BUILD__
        ),
        { timeout: 20000 }
    );

    await pagina.evaluate(() => {
        const gerente = window.MIGUEL_AUDIO_MANAGER;

        window.__MIGUEL_AUDIO_SMOKE__ = {
            efeitos: [],
            musicas: [],
            paradas: 0
        };

        gerente.desbloqueado = true;
        gerente.tocarEfeito = (nome) => {
            window.__MIGUEL_AUDIO_SMOKE__.efeitos.push(nome);
            return true;
        };
        gerente.iniciarMusica = (tema) => {
            gerente.temaAtual = tema;
            window.__MIGUEL_AUDIO_SMOKE__.musicas.push(tema);
        };
        gerente.pararMusica = () => {
            gerente.temaAtual = null;
            window.__MIGUEL_AUDIO_SMOKE__.paradas += 1;
        };

        const game = window.__MIGUEL_GAME__;
        game.registry.set('nomeJogador', 'SOM');
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
                && cena.sistemaVida
                && cena.__miguelTutorialAudioBuild
            );
        },
        { timeout: 20000 }
    );

    await pagina.evaluate(() => {
        const cena = window.__MIGUEL_GAME__.scene.getScene('Tutorial');

        cena.player.body.allowGravity = false;
        cena.player.setVelocity(0, 0);

        cena.executarPulo(true);

        cena.player.pulosDisponiveis = 1;
        cena.executarPulo(false);

        cena.cancelarGiroDuplo();
        cena.player.estaAtacando = false;
        cena.player.estaMachucado = false;
        cena.executarAtaque();
        cena.player.estaAtacando = false;

        const cristal = cena.cristais.getFirstAlive();
        if (cristal) {
            cena.coletarCristal(cena.player, cristal);
        }

        cena.player.estaAtacando = false;
        cena.player.estaMachucado = false;
        cena.player.estaAgachado = false;
        cena.tocarPoeira();
        cena.cancelarPoeira();

        cena.player.estaAtacando = false;
        cena.player.estaMachucado = false;
        cena.player.giroDuploAtivo = false;
        cena.player.estaEmPoeira = false;
        cena.player.estaAgachado = false;
        cena.entrarAgachamento();
        cena.sairAgachamento(true);

        cena.sistemaVida.invulneravel = false;
        cena.sistemaVida.morto = false;
        cena.player.estaMachucado = false;
        cena.sistemaVida.receberDano(5, {
            origem: 'smoke-audio',
            direcao: 1,
            impulsoX: 120,
            impulsoY: 0
        });
    });

    await new Promise((resolve) => setTimeout(resolve, 350));

    const tutorial = await pagina.evaluate(() => ({
        build: window.__MIGUEL_TUTORIAL_AUDIO_BUILD__,
        extensoes: window.__MIGUEL_AUDIO_EXTENSIONS_BUILD__,
        registro: window.__MIGUEL_AUDIO_SMOKE__,
        cenaAtiva: window.__MIGUEL_GAME__.scene.getScene('Tutorial').sys.isActive()
    }));

    console.log('TUTORIAL AUDIO:', JSON.stringify(tutorial));

    const efeitosObrigatorios = [
        'pulo',
        'puloDuplo',
        'ataque',
        'coletar',
        'aterrissar',
        'agachar',
        'dano'
    ];

    for (const efeito of efeitosObrigatorios) {
        if (!tutorial.registro.efeitos.includes(efeito)) {
            erros.push(`efeito ausente no tutorial: ${efeito}`);
        }
    }

    if (!tutorial.registro.musicas.includes('tutorial')) {
        erros.push('música do tutorial não foi iniciada');
    }

    if (!tutorial.cenaAtiva) {
        erros.push('tutorial deixou de permanecer ativo durante o teste de áudio');
    }

    await pagina.evaluate(() => {
        window.__MIGUEL_GAME__.scene.start('ResultadoTutorial');
    });

    await pagina.waitForFunction(
        () => {
            const game = window.__MIGUEL_GAME__;
            const cena = game && game.scene.getScene('ResultadoTutorial');
            return Boolean(
                cena
                && cena.sys.isActive()
                && cena.__miguelTutorialResultadoAudioBuild
            );
        },
        { timeout: 20000 }
    );

    await new Promise((resolve) => setTimeout(resolve, 180));

    const resultado = await pagina.evaluate(() => ({
        registro: window.__MIGUEL_AUDIO_SMOKE__,
        cenaAtiva: window.__MIGUEL_GAME__
            .scene
            .getScene('ResultadoTutorial')
            .sys
            .isActive()
    }));

    console.log('RESULTADO AUDIO:', JSON.stringify(resultado));

    if (!resultado.registro.efeitos.includes('vitoria')) {
        erros.push('efeito de vitória do tutorial não foi tocado');
    }

    if (!resultado.registro.musicas.includes('vitoria')) {
        erros.push('música de vitória do tutorial não foi iniciada');
    }

    if (!resultado.cenaAtiva) {
        erros.push('ResultadoTutorial não permaneceu ativo');
    }

    if (erros.length > 0) {
        console.error('\nSMOKE TUTORIAL AUDIO REPROVADO');
        erros.forEach((erro) => console.error(`ERRO: ${erro}`));
        process.exitCode = 1;
    } else {
        console.log('\nSMOKE TUTORIAL AUDIO APROVADO');
    }
} finally {
    if (navegador) await navegador.close();
    servidor.kill('SIGTERM');
}