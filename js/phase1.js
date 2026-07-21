(() => {
    const BUILD = 'fase-1-completa-v1-20260720';
    const LARGURA_MUNDO = 5400;
    const ALTURA_MUNDO = 680;

    const ASSETS = Object.freeze({
        miguel_idle: 'assets/frames/miguel/00_idle.png',
        miguel_walk_1: 'assets/frames/miguel/01_walk_1.png',
        miguel_walk_2: 'assets/frames/miguel/02_walk_2.png',
        miguel_walk_3: 'assets/frames/miguel/03_walk_3.png',
        miguel_jump: 'assets/frames/miguel/04_jump.png',
        miguel_double_jump: 'assets/frames/miguel/05_double_jump.png',
        miguel_punch: 'assets/frames/miguel/06_punch.png',
        miguel_hurt: 'assets/frames/miguel/12_hurt.png',
        miguel_victory: 'assets/frames/miguel/13_victory_trophy.png',
        miguel_crouch: 'assets/frames/miguel/14_crouch.png',
        robo_idle_1: 'assets/frames/robot/robot_idle_1.png',
        robo_idle_2: 'assets/frames/robot/robot_idle_2.png',
        robo_walk_1: 'assets/frames/robot/robot_walk_1.png',
        robo_walk_2: 'assets/frames/robot/robot_walk_2.png',
        robo_walk_3: 'assets/frames/robot/robot_walk_3.png',
        robo_walk_4: 'assets/frames/robot/robot_walk_4.png',
        robo_hit_1: 'assets/frames/robot/robot_hit_1.png',
        robo_hit_2: 'assets/frames/robot/robot_hit_2.png',
        robo_explode_1: 'assets/frames/robot/robot_explode_1.png',
        robo_explode_2: 'assets/frames/robot/robot_explode_2.png',
        robo_explode_3: 'assets/frames/robot/robot_explode_3.png',
        robo_explode_4: 'assets/frames/robot/robot_explode_4.png'
    });

    const audio = () => window.MIGUEL_AUDIO_MANAGER || null;

    const tocar = (nome) => {
        const gerente = audio();
        if (gerente) gerente.tocarEfeito(nome);
    };

    class Fase1Completa extends Phaser.Scene {
        constructor() {
            super('Fase1');
        }

        preload() {
            Object.entries(ASSETS).forEach(([chave, caminho]) => {
                if (!this.textures.exists(chave)) {
                    this.load.image(chave, caminho);
                }
            });
        }

        create() {
            window.__MIGUEL_PHASE1_BUILD__ = BUILD;

            const configuracao = (
                window.MIGUEL_PHASE_CONFIG
                && window.MIGUEL_PHASE_CONFIG.fases
                ? window.MIGUEL_PHASE_CONFIG.fases.Fase1
                : { id: 'fase-1', orientacao: 'landscape' }
            );

            if (window.MIGUEL_DEVICE_MANAGER) {
                window.MIGUEL_DEVICE_MANAGER.ativarFase(configuracao);
            }

            this.inicioEm = this.time.now;
            this.pontosInicio = Number(this.registry.get('pontuacao') || 0);
            this.pontos = this.pontosInicio;
            this.coletados = 0;
            this.totalColetaveis = 0;
            this.inimigosDerrotados = 0;
            this.danosRecebidos = 0;
            this.checkpointAtual = { x: 120, y: 430, indice: 0 };
            this.zonaAtual = 0;
            this.pausado = false;
            this.faseConcluida = false;
            this.bossAtivo = false;
            this.bossDerrotado = false;
            this.ultimoAtaquePlayer = 0;

            this.physics.world.setBounds(0, 0, LARGURA_MUNDO, ALTURA_MUNDO);
            this.cameras.main.setBounds(0, 0, LARGURA_MUNDO, 600);
            this.cameras.main.setBackgroundColor('#071426');

            this.criarAnimacoes();
            this.gerarTexturas();
            this.criarCenario();
            this.criarGrupos();
            this.criarPlataformas();
            this.criarObstaculos();
            this.criarPlayer();
            this.criarInterface();
            this.criarColetaveis();
            this.criarInimigos();
            this.criarBoss();
            this.configurarFisica();
            this.criarIntroducao();

            this.cameras.main.startFollow(
                this.player,
                true,
                0.09,
                0.09,
                -110,
                20
            );

            this.cameras.main.setDeadzone(280, 220);

            const gerenteAudio = audio();
            if (gerenteAudio) gerenteAudio.iniciarMusica('fase1');

            this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
                if (gerenteAudio) gerenteAudio.pararMusica();
            });

            console.info('[FASE 1]', BUILD, 'iniciada');
        }

        criarAnimacoes() {
            const criar = (chave, dados) => {
                if (!this.anims.exists(chave)) {
                    this.anims.create({ key: chave, ...dados });
                }
            };

            criar('walk', {
                frames: [
                    { key: 'miguel_walk_1' },
                    { key: 'miguel_walk_2' },
                    { key: 'miguel_walk_3' }
                ],
                frameRate: 8,
                repeat: -1
            });
            criar('idle', {
                frames: [{ key: 'miguel_idle' }],
                frameRate: 1,
                repeat: -1
            });
            criar('jump', {
                frames: [{ key: 'miguel_jump' }],
                frameRate: 1,
                repeat: 0
            });
            criar('attack', {
                frames: [
                    { key: 'miguel_punch' },
                    { key: 'miguel_punch' },
                    { key: 'miguel_idle' }
                ],
                frameRate: 10,
                repeat: 0
            });
            criar('robo_patrol', {
                frames: [
                    { key: 'robo_walk_1' },
                    { key: 'robo_walk_2' },
                    { key: 'robo_walk_3' },
                    { key: 'robo_walk_4' }
                ],
                frameRate: 7,
                repeat: -1
            });
            criar('robo_damage', {
                frames: [
                    { key: 'robo_hit_1' },
                    { key: 'robo_hit_2' }
                ],
                frameRate: 9,
                repeat: 0
            });
            criar('robo_explosion', {
                frames: [
                    { key: 'robo_explode_1' },
                    { key: 'robo_explode_2' },
                    { key: 'robo_explode_3' },
                    { key: 'robo_explode_4' }
                ],
                frameRate: 7,
                repeat: 0
            });
        }

        texturaRetangular(chave, largura, altura, cor, borda = 0xffffff) {
            if (this.textures.exists(chave)) return;
            const g = this.make.graphics({ x: 0, y: 0, add: false });
            g.fillStyle(cor, 1);
            g.fillRect(0, 0, largura, altura);
            g.lineStyle(2, borda, 0.8);
            g.strokeRect(1, 1, largura - 2, altura - 2);
            g.generateTexture(chave, largura, altura);
            g.destroy();
        }

        gerarTexturas() {
            this.texturaRetangular('fase1_chao', 64, 32, 0x183f52, 0x55dff7);
            this.texturaRetangular('fase1_plataforma', 96, 24, 0x245b6d, 0x8fe9ff);
            this.texturaRetangular('fase1_movel', 96, 20, 0x6b4d18, 0xffcc00);
            this.texturaRetangular('fase1_laser', 12, 120, 0xff2a55, 0xffffff);
            this.texturaRetangular('fase1_portao', 24, 260, 0x641b38, 0xff5c8a);
            this.texturaRetangular('fase1_torre', 40, 52, 0x444a58, 0xff426f);
            this.texturaRetangular('fase1_projetil', 14, 8, 0xff254f, 0xffffff);
            this.texturaRetangular('fase1_projetil_boss', 22, 12, 0xbf32ff, 0xffffff);
            this.texturaRetangular('fase1_checkpoint', 24, 70, 0x145c68, 0x00ffff);

            if (!this.textures.exists('fase1_espinho')) {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                g.fillStyle(0xff334f, 1);
                for (let x = 0; x < 48; x += 16) {
                    g.fillTriangle(x, 32, x + 8, 2, x + 16, 32);
                }
                g.generateTexture('fase1_espinho', 48, 32);
                g.destroy();
            }

            if (!this.textures.exists('fase1_cristal')) {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                g.fillStyle(0x00e5ff, 0.4);
                g.fillCircle(18, 18, 18);
                g.fillStyle(0xffffff, 1);
                g.fillPoints([
                    { x: 18, y: 1 },
                    { x: 34, y: 18 },
                    { x: 18, y: 35 },
                    { x: 2, y: 18 }
                ], true);
                g.lineStyle(3, 0x00ffff, 1);
                g.strokePoints([
                    { x: 18, y: 1 },
                    { x: 34, y: 18 },
                    { x: 18, y: 35 },
                    { x: 2, y: 18 }
                ], true);
                g.generateTexture('fase1_cristal', 36, 36);
                g.destroy();
            }

            if (!this.textures.exists('fase1_energia')) {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                g.fillStyle(0x24ff78, 1);
                g.fillRoundedRect(2, 2, 28, 36, 6);
                g.fillStyle(0xffffff, 1);
                g.fillRect(13, 7, 6, 26);
                g.fillRect(7, 17, 18, 6);
                g.generateTexture('fase1_energia', 32, 40);
                g.destroy();
            }

            if (!this.textures.exists('fase1_drone')) {
                const g = this.make.graphics({ x: 0, y: 0, add: false });
                g.fillStyle(0x4c5262, 1);
                g.fillRoundedRect(8, 8, 40, 22, 8);
                g.fillStyle(0xff315d, 1);
                g.fillCircle(28, 19, 7);
                g.lineStyle(3, 0xa8b2c4, 1);
                g.lineBetween(0, 5, 18, 12);
                g.lineBetween(56, 5, 38, 12);
                g.generateTexture('fase1_drone', 56, 36);
                g.destroy();
            }
        }

        criarCenario() {
            this.add.rectangle(0, 0, LARGURA_MUNDO, 600, 0x071426)
                .setOrigin(0)
                .setScrollFactor(0);

            this.add.circle(680, 110, 62, 0xffe9a6, 0.9)
                .setScrollFactor(0.06)
                .setDepth(-9);

            for (let i = 0; i < 100; i += 1) {
                this.add.circle(
                    Phaser.Math.Between(0, LARGURA_MUNDO),
                    Phaser.Math.Between(20, 300),
                    Phaser.Math.Between(1, 3),
                    0xffffff,
                    Phaser.Math.FloatBetween(0.25, 0.85)
                ).setScrollFactor(0.12).setDepth(-10);
            }

            const secoes = [
                [450, 'PORTÃO DA CIDADE', 0x123c55],
                [1450, 'FÁBRICA ABANDONADA', 0x20364e],
                [2650, 'TÚNEIS DE ENERGIA', 0x182f43],
                [3750, 'PONTE DAS ENGRENAGENS', 0x293242],
                [4850, 'NÚCLEO DO GUARDIÃO', 0x301b3d]
            ];

            secoes.forEach(([x, titulo, cor], indice) => {
                this.add.rectangle(x, 410, 980, 330, cor, 0.7)
                    .setScrollFactor(0.42)
                    .setDepth(-8);
                this.add.text(x, 180 + (indice % 2) * 35, titulo, {
                    fontFamily: 'Courier New',
                    fontSize: '24px',
                    color: '#8fe9ff',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setScrollFactor(0.55).setDepth(-7).setAlpha(0.35);
            });
        }

        criarGrupos() {
            this.plataformas = this.physics.add.staticGroup();
            this.plataformasMoveis = this.physics.add.group({
                allowGravity: false,
                immovable: true
            });
            this.espinhos = this.physics.add.staticGroup();
            this.lasers = this.physics.add.group({ allowGravity: false, immovable: true });
            this.coletaveis = this.physics.add.group({ allowGravity: false });
            this.energias = this.physics.add.group({ allowGravity: false });
            this.checkpoints = this.physics.add.staticGroup();
            this.inimigos = this.physics.add.group();
            this.projeteis = this.physics.add.group({ allowGravity: false });
        }

        adicionarPlataforma(x, y, largura, altura = 32, textura = 'fase1_chao') {
            const plataforma = this.plataformas.create(x, y, textura);
            plataforma.setDisplaySize(largura, altura).refreshBody();
            plataforma.setDepth(2);
            return plataforma;
        }

        criarPlataformas() {
            [
                [350, 570, 700],
                [1210, 570, 780],
                [2135, 570, 730],
                [3055, 570, 770],
                [3935, 570, 730],
                [4865, 570, 970]
            ].forEach(([x, y, largura]) => this.adicionarPlataforma(x, y, largura));

            [
                [620, 450, 180], [860, 390, 160], [1080, 330, 150],
                [1450, 455, 180], [1690, 390, 150], [1930, 320, 160],
                [2320, 450, 170], [2520, 380, 140], [2760, 310, 150],
                [3260, 455, 180], [3500, 380, 150], [3770, 315, 180],
                [4130, 430, 170], [4560, 440, 180], [5050, 390, 190]
            ].forEach(([x, y, largura]) => this.adicionarPlataforma(
                x, y, largura, 24, 'fase1_plataforma'
            ));

            const moveis = [
                { x: 1010, y: 475, eixo: 'y', distancia: 115, duracao: 1800 },
                { x: 2200, y: 410, eixo: 'x', distancia: 170, duracao: 2200 },
                { x: 2980, y: 420, eixo: 'y', distancia: 145, duracao: 2000 },
                { x: 3450, y: 475, eixo: 'x', distancia: 190, duracao: 2400 }
            ];

            moveis.forEach((dados) => {
                const plataforma = this.plataformasMoveis.create(
                    dados.x,
                    dados.y,
                    'fase1_movel'
                );
                plataforma.setImmovable(true);
                plataforma.body.allowGravity = false;
                plataforma.setDepth(3);
                this.tweens.add({
                    targets: plataforma,
                    [dados.eixo]: dados[dados.eixo] + dados.distancia,
                    duration: dados.duracao,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1
                });
            });
        }

        criarObstaculos() {
            [
                [745, 535], [1775, 535], [2590, 535],
                [3375, 535], [4235, 535], [4630, 535]
            ].forEach(([x, y]) => {
                this.espinhos.create(x, y, 'fase1_espinho').refreshBody();
            });

            [
                { x: 1570, y: 470, atraso: 0 },
                { x: 2840, y: 470, atraso: 650 },
                { x: 4010, y: 470, atraso: 1150 }
            ].forEach((dados) => {
                const laser = this.lasers.create(dados.x, dados.y, 'fase1_laser');
                laser.body.allowGravity = false;
                laser.setImmovable(true).setDepth(5);
                laser.setData('ligado', true);

                this.time.addEvent({
                    delay: 1700,
                    startAt: dados.atraso,
                    loop: true,
                    callback: () => {
                        const ligado = !laser.getData('ligado');
                        laser.setData('ligado', ligado);
                        laser.setVisible(ligado);
                        laser.body.enable = ligado;
                    }
                });
            });

            [
                { x: 1320, indice: 1 },
                { x: 3100, indice: 2 }
            ].forEach(({ x, indice }) => {
                const checkpoint = this.checkpoints.create(
                    x,
                    510,
                    'fase1_checkpoint'
                );
                checkpoint.setData('indice', indice);
                checkpoint.setData('ativado', false);
                checkpoint.setDepth(4);
            });
        }

        criarPlayer() {
            this.player = this.physics.add.sprite(120, 430, 'miguel_idle');
            this.player.setScale(0.95).setDepth(20).setCollideWorldBounds(false);
            this.player.body.setSize(54, 116);
            this.player.body.setOffset(101, 108);
            this.player.pulosDisponiveis = 2;
            this.player.estaAtacando = false;
            this.player.estaMachucado = false;
            this.player.estaAgachado = false;
            this.player.giroDuploAtivo = false;
            this.player.estaEmPoeira = false;
            this.player.estavaNoChao = false;

            this.crouchVisual = this.add.image(0, 0, 'miguel_crouch')
                .setScale(1.18)
                .setVisible(false)
                .setDepth(21);

            this.doubleJumpVisual = this.add.image(0, 0, 'miguel_double_jump')
                .setOrigin(127.5 / 256, 163 / 256)
                .setScale(0.95)
                .setVisible(false)
                .setDepth(21);
            this.tweenGiroDuplo = null;

            this.controles = new window.MiguelInputManager(this, { tutorial: false });
            this.controles.iniciar();
        }

        criarInterface() {
            const nome = this.registry.get('nomeJogador') || 'MIGUEL';
            this.hudJogo = new window.MiguelHUDManager(this, {
                nome,
                pontos: this.pontos,
                tipoFase: 'FASE 1',
                totalEtapas: 5
            });
            this.hudJogo.iniciar();
            this.definirZona(1, 'ATRAVESSE O PORTÃO', 'Colete cristais e evite os espinhos.');

            this.sistemaVida = new window.MiguelHealthManager(
                this,
                this.player,
                {
                    vidaMaxima: 100,
                    vidas: 3,
                    hud: this.hudJogo,
                    duracaoInvulnerabilidade: 1050,
                    respawnX: this.checkpointAtual.x,
                    respawnY: this.checkpointAtual.y,
                    onDamage: () => {
                        this.danosRecebidos += 1;
                        tocar('dano');
                    },
                    onLifeLost: () => {
                        this.adicionarPontos(-100, false);
                    },
                    onRespawn: () => {
                        this.sairAgachamento(true);
                        this.cancelarGiroDuplo();
                        this.projeteis.clear(true, true);
                        this.hudJogo.mostrarMensagem('RETORNO AO CHECKPOINT', 1300);
                    },
                    onGameOver: () => {
                        this.registry.set('pontuacao', this.pontosInicio);
                        this.time.delayedCall(900, () => this.scene.restart());
                    }
                }
            );
            this.sistemaVida.iniciar();

            this.textoBoss = this.add.text(400, 94, '', {
                fontFamily: 'Courier New',
                fontSize: '14px',
                color: '#ffffff',
                backgroundColor: '#41102c',
                padding: { x: 12, y: 6 },
                fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(1200).setVisible(false);

            this.overlayPausa = this.add.container(400, 300)
                .setScrollFactor(0)
                .setDepth(2000)
                .setVisible(false);
            const fundo = this.add.rectangle(0, 0, 800, 600, 0x02060d, 0.82);
            const texto = this.add.text(0, 0, 'JOGO PAUSADO\nP/ESC PARA CONTINUAR', {
                fontFamily: 'Courier New',
                fontSize: '28px',
                color: '#ffcc00',
                align: 'center',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            this.overlayPausa.add([fundo, texto]);
        }

        criarColetaveis() {
            const cristais = [
                [260, 485], [520, 400], [860, 335], [1110, 275],
                [1390, 400], [1700, 335], [1960, 265], [2280, 395],
                [2550, 325], [2770, 255], [3170, 400], [3520, 325],
                [3780, 260], [4140, 375], [4580, 385], [5070, 335]
            ];

            cristais.forEach(([x, y], indice) => {
                const item = this.coletaveis.create(x, y, 'fase1_cristal');
                item.body.allowGravity = false;
                item.setData('valor', 25);
                item.setData('indice', indice);
                this.tweens.add({
                    targets: item,
                    y: y - 10,
                    angle: 180,
                    duration: 900 + (indice % 4) * 120,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            });

            [
                [1200, 500], [2720, 500], [4050, 365]
            ].forEach(([x, y]) => {
                const energia = this.energias.create(x, y, 'fase1_energia');
                energia.body.allowGravity = false;
                this.tweens.add({
                    targets: energia,
                    scaleX: 1.12,
                    scaleY: 1.12,
                    duration: 650,
                    yoyo: true,
                    repeat: -1
                });
            });

            this.totalColetaveis = cristais.length;
        }

        criarInimigoRobo(x, y, opcoes = {}) {
            const inimigo = this.inimigos.create(x, y, 'robo_idle_1');
            inimigo.setScale(opcoes.escala || 0.12).setDepth(12);
            inimigo.body.setSize(420, 691);
            inimigo.body.setOffset(417, 300);
            inimigo.setBounce(0);
            inimigo.setData('tipo', opcoes.tipo || 'sentinela');
            inimigo.setData('vida', opcoes.vida || 2);
            inimigo.setData('vidaMaxima', opcoes.vida || 2);
            inimigo.setData('dano', opcoes.dano || 14);
            inimigo.setData('velocidade', opcoes.velocidade || 65);
            inimigo.setData('minX', opcoes.minX || x - 100);
            inimigo.setData('maxX', opcoes.maxX || x + 100);
            inimigo.setData('direcao', 1);
            inimigo.setData('pontos', opcoes.pontos || 120);
            inimigo.setData('atordoadoAte', 0);
            inimigo.setData('proximoTiro', 0);
            inimigo.anims.play('robo_patrol', true);
            return inimigo;
        }

        criarDrone(x, y, opcoes = {}) {
            const drone = this.inimigos.create(x, y, 'fase1_drone');
            drone.body.allowGravity = false;
            drone.setDepth(14);
            drone.setData('tipo', 'drone');
            drone.setData('vida', opcoes.vida || 2);
            drone.setData('vidaMaxima', opcoes.vida || 2);
            drone.setData('dano', 12);
            drone.setData('baseY', y);
            drone.setData('minX', x - (opcoes.raio || 120));
            drone.setData('maxX', x + (opcoes.raio || 120));
            drone.setData('direcao', 1);
            drone.setData('velocidade', 75);
            drone.setData('pontos', 150);
            drone.setData('proximoTiro', this.time.now + Phaser.Math.Between(500, 1100));
            return drone;
        }

        criarTorre(x, y) {
            const torre = this.inimigos.create(x, y, 'fase1_torre');
            torre.body.allowGravity = false;
            torre.setImmovable(true).setDepth(13);
            torre.setData('tipo', 'torre');
            torre.setData('vida', 3);
            torre.setData('vidaMaxima', 3);
            torre.setData('dano', 15);
            torre.setData('pontos', 180);
            torre.setData('proximoTiro', this.time.now + 700);
            return torre;
        }

        criarInimigos() {
            this.criarInimigoRobo(720, 430, { minX: 620, maxX: 780 });
            this.criarInimigoRobo(1510, 430, { minX: 1370, maxX: 1640 });
            this.criarDrone(1870, 250, { raio: 130 });
            this.criarTorre(2400, 500);
            this.criarInimigoRobo(2940, 430, { minX: 2820, maxX: 3200, vida: 3 });
            this.criarDrone(3370, 260, { raio: 170 });
            this.criarTorre(3690, 260);
            this.criarInimigoRobo(3970, 410, {
                minX: 3810,
                maxX: 4220,
                vida: 5,
                dano: 20,
                escala: 0.18,
                velocidade: 85,
                pontos: 400,
                tipo: 'mini-chefe'
            });
        }

        criarBoss() {
            this.boss = this.physics.add.sprite(4920, 330, 'robo_idle_1');
            this.boss.setScale(0.26).setDepth(16);
            this.boss.body.setSize(420, 691);
            this.boss.body.setOffset(417, 300);
            this.boss.setData('vida', 12);
            this.boss.setData('vidaMaxima', 12);
            this.boss.setData('estado', 'aguardando');
            this.boss.setData('proximoAtaque', 0);
            this.boss.setData('estadoAte', 0);
            this.boss.setData('alternancia', 0);
            this.boss.setData('invulneravelAte', 0);
            this.boss.anims.play('robo_patrol', true);

            this.portaoArena = this.physics.add.staticImage(4420, 430, 'fase1_portao');
            this.portaoArena.disableBody(true, true);
        }

        configurarFisica() {
            this.physics.add.collider(this.player, this.plataformas);
            this.physics.add.collider(this.player, this.plataformasMoveis);
            this.physics.add.collider(this.inimigos, this.plataformas);
            this.physics.add.collider(this.boss, this.plataformas);
            this.physics.add.collider(this.player, this.portaoArena);

            this.physics.add.collider(
                this.player,
                this.inimigos,
                this.contatoInimigo,
                null,
                this
            );
            this.physics.add.collider(
                this.player,
                this.boss,
                this.contatoBoss,
                null,
                this
            );
            this.physics.add.overlap(this.player, this.espinhos, () => {
                this.aplicarDano(22, 'espinho', 0, -260);
            });
            this.physics.add.overlap(this.player, this.lasers, (player, laser) => {
                if (laser.getData('ligado')) {
                    this.aplicarDano(18, 'laser', player.x < laser.x ? -1 : 1, -180);
                }
            });
            this.physics.add.overlap(this.player, this.coletaveis, this.coletarCristal, null, this);
            this.physics.add.overlap(this.player, this.energias, this.coletarEnergia, null, this);
            this.physics.add.overlap(this.player, this.checkpoints, this.ativarCheckpoint, null, this);
            this.physics.add.overlap(this.player, this.projeteis, this.receberProjetil, null, this);
            this.physics.add.collider(this.projeteis, this.plataformas, (projetil) => projetil.destroy());
        }

        criarIntroducao() {
            this.bloqueioInicioAte = this.time.now + 1500;
            const painel = this.add.container(400, 300)
                .setScrollFactor(0)
                .setDepth(1800);
            const fundo = this.add.rectangle(0, 0, 620, 210, 0x07111f, 0.94)
                .setStrokeStyle(3, 0x35d9ff, 0.9);
            const titulo = this.add.text(0, -45, 'FASE 1 — A CIDADE SEM ENERGIA', {
                fontFamily: 'Courier New',
                fontSize: '26px',
                color: '#ffcc00',
                fontStyle: 'bold'
            }).setOrigin(0.5);
            const texto = this.add.text(0, 30,
                'Atravesse os cinco setores, reative os checkpoints\n'
                + 'e derrote o Núcleo Guardião.', {
                    fontFamily: 'Courier New',
                    fontSize: '16px',
                    color: '#ffffff',
                    align: 'center',
                    lineSpacing: 8
                }).setOrigin(0.5);
            painel.add([fundo, titulo, texto]);
            this.tweens.add({
                targets: painel,
                alpha: 0,
                y: 260,
                duration: 400,
                delay: 1150,
                onComplete: () => painel.destroy(true)
            });
        }

        definirZona(indice, titulo, dica) {
            if (this.zonaAtual === indice) return;
            this.zonaAtual = indice;
            this.hudJogo.atualizarTutorial({
                etapa: indice,
                totalEtapas: 5,
                titulo,
                dica,
                concluido: false
            });
            if (this.hudJogo.textoEtapa) {
                this.hudJogo.textoEtapa.setText(`FASE 1  ${indice}/5`);
            }
        }

        atualizarZona() {
            const x = this.player.x;
            if (x < 1050) {
                this.definirZona(1, 'ATRAVESSE O PORTÃO', 'Colete cristais e evite os espinhos.');
            } else if (x < 2200) {
                this.definirZona(2, 'FÁBRICA ABANDONADA', 'Use plataformas móveis e atravesse os lasers.');
            } else if (x < 3300) {
                this.definirZona(3, 'TÚNEIS DE ENERGIA', 'Desative torres e alcance o segundo checkpoint.');
            } else if (x < 4400) {
                this.definirZona(4, 'PONTE DAS ENGRENAGENS', 'Derrote o sentinela de elite.');
            } else {
                this.definirZona(5, 'NÚCLEO DO GUARDIÃO', 'Derrote o chefão para restaurar a cidade.');
            }
        }

        adicionarPontos(valor, mostrar = true) {
            this.pontos = Math.max(0, this.pontos + Number(valor || 0));
            this.registry.set('pontuacao', this.pontos);
            this.hudJogo.atualizarPontuacao(this.pontos);
            if (mostrar && valor > 0) {
                this.hudJogo.mostrarMensagem(`+${valor} PONTOS`, 650);
            }
        }

        coletarCristal(player, cristal) {
            if (!cristal.active) return;
            cristal.disableBody(true, true);
            this.coletados += 1;
            this.adicionarPontos(cristal.getData('valor') || 25, false);
            tocar('coletar');
            this.hudJogo.mostrarMensagem(
                `CRISTAL ${this.coletados}/${this.totalColetaveis}  +25`,
                700
            );
        }

        coletarEnergia(player, energia) {
            if (!energia.active) return;
            energia.disableBody(true, true);
            this.sistemaVida.vida = Math.min(
                this.sistemaVida.vidaMaxima,
                this.sistemaVida.vida + 30
            );
            this.sistemaVida.atualizarHUD();
            this.adicionarPontos(75, false);
            tocar('energia');
            this.hudJogo.mostrarMensagem('ENERGIA RESTAURADA  +75', 900);
        }

        ativarCheckpoint(player, checkpoint) {
            if (checkpoint.getData('ativado')) return;
            checkpoint.setData('ativado', true);
            checkpoint.setTint(0x28ff9b);
            const indice = checkpoint.getData('indice');
            this.checkpointAtual = {
                x: checkpoint.x - 45,
                y: checkpoint.y - 60,
                indice
            };
            this.sistemaVida.respawn.x = this.checkpointAtual.x;
            this.sistemaVida.respawn.y = this.checkpointAtual.y;
            this.adicionarPontos(100, false);
            tocar('checkpoint');
            this.hudJogo.mostrarMensagem(`CHECKPOINT ${indice} ATIVADO  +100`, 1200);
        }

        aplicarDano(dano, origem, direcao = 0, impulsoY = -200) {
            if (!this.sistemaVida) return false;
            return this.sistemaVida.receberDano(dano, {
                origem,
                forma: origem,
                direcao: direcao || (this.player.flipX ? 1 : -1),
                impulsoX: 240,
                impulsoY
            });
        }

        contatoInimigo(player, inimigo) {
            if (!inimigo.active || inimigo.getData('morto')) return;
            const pisou = Boolean(
                player.body.velocity.y > 80
                && player.body.bottom <= inimigo.body.top + 26
            );
            if (pisou) {
                player.setVelocityY(-350);
                this.atingirInimigo(inimigo, 1);
                return;
            }
            this.aplicarDano(
                inimigo.getData('dano') || 14,
                inimigo.getData('tipo') || 'inimigo',
                player.x < inimigo.x ? -1 : 1,
                -220
            );
        }

        contatoBoss(player, boss) {
            if (!this.bossAtivo || this.bossDerrotado) return;
            const pisou = Boolean(
                player.body.velocity.y > 100
                && player.body.bottom <= boss.body.top + 30
            );
            if (pisou) {
                player.setVelocityY(-390);
                this.atingirBoss(1);
                return;
            }
            this.aplicarDano(25, 'chefe', player.x < boss.x ? -1 : 1, -260);
        }

        atirar(origem, alvo, velocidade, dano, boss = false, anguloExtra = 0) {
            if (!origem.active || !alvo.active) return;
            const x = origem.x + (alvo.x < origem.x ? -32 : 32);
            const y = origem.y - 18;
            const dx = alvo.x - x;
            const dy = alvo.y - 20 - y;
            const angulo = Math.atan2(dy, dx) + anguloExtra;
            const projetil = this.projeteis.create(
                x,
                y,
                boss ? 'fase1_projetil_boss' : 'fase1_projetil'
            );
            projetil.body.allowGravity = false;
            projetil.setDepth(18);
            projetil.setData('dano', dano);
            projetil.setData('boss', boss);
            projetil.setData('criadoEm', this.time.now);
            projetil.setVelocity(
                Math.cos(angulo) * velocidade,
                Math.sin(angulo) * velocidade
            );
            tocar('disparo');
        }

        receberProjetil(player, projetil) {
            if (!projetil.active) return;
            const dano = projetil.getData('dano') || 12;
            const direcao = projetil.body.velocity.x < 0 ? -1 : 1;
            projetil.destroy();
            this.aplicarDano(dano, projetil.getData('boss') ? 'projetil-chefe' : 'projetil', direcao, -150);
        }

        atingirInimigo(inimigo, dano = 1) {
            if (!inimigo.active || inimigo.getData('morto')) return;
            const vida = Number(inimigo.getData('vida') || 1) - dano;
            inimigo.setData('vida', vida);
            inimigo.setData('atordoadoAte', this.time.now + 280);
            inimigo.setVelocityX(0);
            tocar('inimigoDano');

            if (inimigo.anims && inimigo.texture.key.startsWith('robo_')) {
                inimigo.anims.play('robo_damage', true);
            } else {
                inimigo.setTint(0xffffff);
                this.time.delayedCall(120, () => {
                    if (inimigo.active) inimigo.clearTint();
                });
            }

            if (vida > 0) return;
            inimigo.setData('morto', true);
            inimigo.setVelocity(0, 0);
            inimigo.body.enable = false;
            this.inimigosDerrotados += 1;
            this.adicionarPontos(inimigo.getData('pontos') || 120, false);
            tocar('inimigoDerrotado');

            if (inimigo.texture.key.startsWith('robo_')) {
                inimigo.anims.play('robo_explosion', true);
                inimigo.once('animationcomplete-robo_explosion', () => {
                    if (inimigo.active) inimigo.destroy();
                });
            } else {
                this.tweens.add({
                    targets: inimigo,
                    alpha: 0,
                    scaleX: 1.6,
                    scaleY: 1.6,
                    duration: 240,
                    onComplete: () => inimigo.destroy()
                });
            }
        }

        atingirBoss(dano = 1) {
            if (
                !this.bossAtivo
                || this.bossDerrotado
                || this.time.now < this.boss.getData('invulneravelAte')
            ) return;

            const vida = Math.max(0, this.boss.getData('vida') - dano);
            this.boss.setData('vida', vida);
            this.boss.setData('invulneravelAte', this.time.now + 240);
            this.boss.setVelocityX(0);
            this.boss.anims.play('robo_damage', true);
            tocar('chefeDano');
            this.atualizarBarraBoss();

            if (vida <= 0) this.derrotarBoss();
        }

        atualizarBarraBoss() {
            if (!this.bossAtivo || this.bossDerrotado) {
                this.textoBoss.setVisible(false);
                return;
            }
            const vida = this.boss.getData('vida');
            const maximo = this.boss.getData('vidaMaxima');
            const blocos = Math.max(0, Math.ceil((vida / maximo) * 16));
            this.textoBoss.setText(
                `NÚCLEO GUARDIÃO  ${'█'.repeat(blocos)}${'░'.repeat(16 - blocos)}  ${vida}/${maximo}`
            ).setVisible(true);
        }

        iniciarBoss() {
            if (this.bossAtivo || this.bossDerrotado) return;
            this.bossAtivo = true;
            this.portaoArena.enableBody(false, 4420, 430, true, true);
            this.portaoArena.setDisplaySize(24, 260).refreshBody();
            this.boss.setData('estado', 'perseguindo');
            this.boss.setData('proximoAtaque', this.time.now + 700);
            this.atualizarBarraBoss();
            tocar('alertaChefe');
            const gerenteAudio = audio();
            if (gerenteAudio) gerenteAudio.iniciarMusica('chefe');
            this.cameras.main.shake(450, 0.008);
            this.hudJogo.mostrarMensagem('ALERTA: NÚCLEO GUARDIÃO', 1500);
        }

        atualizarBoss(time) {
            if (!this.bossAtivo || this.bossDerrotado || !this.boss.active) return;
            const vida = this.boss.getData('vida');
            const fase = vida > 8 ? 1 : (vida > 4 ? 2 : 3);
            const dx = this.player.x - this.boss.x;
            const distancia = Math.abs(dx);
            const direcao = dx < 0 ? -1 : 1;
            const estado = this.boss.getData('estado');
            const estadoAte = this.boss.getData('estadoAte') || 0;

            this.boss.setFlipX(direcao < 0);

            if (estado === 'dash') {
                if (time < estadoAte) {
                    this.boss.setVelocityX(direcao * (fase === 3 ? 260 : 220));
                    return;
                }
                this.boss.setData('estado', 'recuperando');
                this.boss.setData('estadoAte', time + 500);
                this.boss.setVelocityX(0);
                return;
            }

            if (estado === 'recuperando') {
                this.boss.setVelocityX(0);
                if (time >= estadoAte) {
                    this.boss.setData('estado', 'perseguindo');
                }
                return;
            }

            if (time >= this.boss.getData('proximoAtaque')) {
                const alternancia = (this.boss.getData('alternancia') || 0) + 1;
                this.boss.setData('alternancia', alternancia);

                if (fase >= 2 && alternancia % 3 === 0) {
                    this.boss.setData('estado', 'dash');
                    this.boss.setData('estadoAte', time + 650);
                    this.boss.setData('proximoAtaque', time + 1700);
                    return;
                }

                const quantidade = fase === 1 ? 1 : (fase === 2 ? 3 : 5);
                for (let i = 0; i < quantidade; i += 1) {
                    const centro = (quantidade - 1) / 2;
                    this.atirar(
                        this.boss,
                        this.player,
                        fase === 3 ? 285 : 245,
                        fase === 3 ? 20 : 17,
                        true,
                        (i - centro) * 0.12
                    );
                }

                if (fase === 3 && alternancia % 2 === 0) {
                    const drone = this.criarDrone(this.boss.x - 150, 260, { raio: 90, vida: 1 });
                    drone.setData('pontos', 60);
                }

                this.boss.setData('proximoAtaque', time + (fase === 3 ? 1050 : 1450));
            }

            const limiteEsquerda = 4510;
            const limiteDireita = 5230;
            if (distancia > 190) {
                const velocidade = fase === 1 ? 75 : (fase === 2 ? 105 : 135);
                const podeMover = (direcao < 0 && this.boss.x > limiteEsquerda)
                    || (direcao > 0 && this.boss.x < limiteDireita);
                this.boss.setVelocityX(podeMover ? direcao * velocidade : 0);
                this.boss.anims.play('robo_patrol', true);
            } else {
                this.boss.setVelocityX(0);
            }
        }

        derrotarBoss() {
            if (this.bossDerrotado) return;
            this.bossDerrotado = true;
            this.bossAtivo = false;
            this.boss.setVelocity(0, 0);
            this.boss.body.enable = false;
            this.projeteis.clear(true, true);
            this.textoBoss.setVisible(false);
            this.portaoArena.disableBody(true, true);
            this.adicionarPontos(1200, false);
            tocar('chefeDerrotado');
            this.boss.anims.play('robo_explosion', true);
            this.cameras.main.shake(850, 0.018);

            this.time.delayedCall(900, () => {
                if (this.boss.active) this.boss.disableBody(true, true);
                this.concluirFase();
            });
        }

        concluirFase() {
            if (this.faseConcluida) return;
            this.faseConcluida = true;
            const segundos = Math.max(1, Math.round((this.time.now - this.inicioEm) / 1000));
            const bonusTempo = Math.max(0, 1500 - segundos * 8);
            const estadoVida = this.sistemaVida.obterEstado();
            const bonusVida = Math.round(estadoVida.vida * 2 + estadoVida.vidas * 150);
            const bonusSemDano = this.danosRecebidos === 0 ? 500 : 0;
            const bonusColeta = this.coletados === this.totalColetaveis ? 400 : 0;
            const totalBonus = bonusTempo + bonusVida + bonusSemDano + bonusColeta;
            this.adicionarPontos(totalBonus, false);

            const resultado = {
                pontosIniciais: this.pontosInicio,
                pontosFinais: this.pontos,
                pontosFase: this.pontos - this.pontosInicio,
                tempoSegundos: segundos,
                bonusTempo,
                bonusVida,
                bonusSemDano,
                bonusColeta,
                cristais: this.coletados,
                totalCristais: this.totalColetaveis,
                inimigosDerrotados: this.inimigosDerrotados,
                danosRecebidos: this.danosRecebidos,
                bossDerrotado: true
            };
            this.registry.set('resultadoFase1', resultado);
            tocar('vitoria');
            const gerenteAudio = audio();
            if (gerenteAudio) gerenteAudio.iniciarMusica('vitoria');
            this.time.delayedCall(700, () => this.scene.start('ResultadoFase1'));
        }

        executarAtaque() {
            if (
                this.player.estaAtacando
                || this.player.estaMachucado
                || this.time.now - this.ultimoAtaquePlayer < 260
            ) return;

            this.sairAgachamento(true);
            this.cancelarGiroDuplo();
            this.ultimoAtaquePlayer = this.time.now;
            this.player.estaAtacando = true;
            this.player.anims.play('attack', true);
            this.player.off('animationcomplete-attack');
            this.player.once('animationcomplete-attack', () => {
                this.player.estaAtacando = false;
            });
            tocar('ataque');

            const alcance = 78;
            const direcao = this.player.flipX ? -1 : 1;
            const area = new Phaser.Geom.Rectangle(
                this.player.x + (direcao > 0 ? 8 : -alcance - 8),
                this.player.y - 55,
                alcance,
                110
            );

            this.inimigos.children.iterate((inimigo) => {
                if (
                    inimigo
                    && inimigo.active
                    && !inimigo.getData('morto')
                    && Phaser.Geom.Rectangle.Overlaps(area, inimigo.getBounds())
                ) {
                    this.atingirInimigo(inimigo, 1);
                }
            });

            if (
                this.bossAtivo
                && !this.bossDerrotado
                && Phaser.Geom.Rectangle.Overlaps(area, this.boss.getBounds())
            ) {
                this.atingirBoss(1);
            }
        }

        entrarAgachamento() {
            if (this.player.estaAgachado || this.player.estaAtacando) return;
            const corpo = this.player.body;
            corpo.updateFromGameObject();
            const base = corpo.bottom;
            this.player.estaAgachado = true;
            this.player.setVelocity(0, 0).setVisible(false);
            corpo.allowGravity = false;
            corpo.setSize(54, 74);
            corpo.setOffset(101, 150);
            corpo.updateFromGameObject();
            this.player.y += base - corpo.bottom;
            const linhaPes = this.player.y + (223 - 128) * 0.95;
            this.crouchVisual
                .setVisible(true)
                .setPosition(this.player.x, linhaPes - (223 - 128) * 1.18)
                .setFlipX(this.player.flipX);
        }

        sairAgachamento(forcar = false) {
            if (!this.player || (!this.player.estaAgachado && !forcar)) return;
            const estava = this.player.estaAgachado;
            const corpo = this.player.body;
            let base = null;
            if (corpo) {
                corpo.updateFromGameObject();
                base = corpo.bottom;
                corpo.allowGravity = true;
                corpo.setSize(54, 116);
                corpo.setOffset(101, 108);
                corpo.updateFromGameObject();
                if (estava && Number.isFinite(base)) this.player.y += base - corpo.bottom;
            }
            this.player.estaAgachado = false;
            this.crouchVisual.setVisible(false);
            this.player.setVisible(true).setScale(0.95);
        }

        sincronizarAgachamento() {
            if (!this.player.estaAgachado) return;
            const linhaPes = this.player.y + (223 - 128) * 0.95;
            this.crouchVisual
                .setPosition(this.player.x, linhaPes - (223 - 128) * 1.18)
                .setFlipX(this.player.flipX);
        }

        iniciarGiroDuplo() {
            this.cancelarGiroDuplo();
            this.player.giroDuploAtivo = true;
            this.player.setVisible(false);
            this.doubleJumpVisual
                .setVisible(true)
                .setAngle(0)
                .setScale(0.95)
                .setFlipX(this.player.flipX);
            this.sincronizarGiroDuplo();
            const direcao = this.player.flipX ? -1 : 1;
            this.tweenGiroDuplo = this.tweens.add({
                targets: this.doubleJumpVisual,
                angle: direcao * 360,
                duration: 440,
                ease: 'Cubic.easeInOut',
                onUpdate: () => this.sincronizarGiroDuplo(),
                onComplete: () => this.cancelarGiroDuplo()
            });
        }

        sincronizarGiroDuplo() {
            if (!this.player.giroDuploAtivo) return;
            this.doubleJumpVisual
                .setPosition(
                    this.player.x + (127.5 - 128) * 0.95,
                    this.player.y + (163 - 128) * 0.95
                )
                .setFlipX(this.player.flipX);
        }

        cancelarGiroDuplo() {
            if (!this.player) return;
            if (this.tweenGiroDuplo) {
                this.tweenGiroDuplo.stop();
                this.tweenGiroDuplo = null;
            }
            this.player.giroDuploAtivo = false;
            if (this.doubleJumpVisual) {
                this.doubleJumpVisual.setVisible(false).setAngle(0).setScale(0.95);
            }
            if (!this.player.estaAgachado) this.player.setVisible(true);
        }

        cancelarPoeira() {
            if (this.player) this.player.estaEmPoeira = false;
        }

        alternarPausa() {
            this.pausado = !this.pausado;
            this.overlayPausa.setVisible(this.pausado);
            if (this.pausado) {
                this.physics.world.pause();
                tocar('pausa');
            } else {
                this.physics.world.resume();
            }
        }

        atualizarInimigos(time) {
            this.inimigos.children.iterate((inimigo) => {
                if (!inimigo || !inimigo.active || inimigo.getData('morto')) return;
                const tipo = inimigo.getData('tipo');
                const atordoado = time < Number(inimigo.getData('atordoadoAte') || 0);
                if (atordoado) {
                    inimigo.setVelocityX(0);
                    return;
                }

                if (tipo === 'drone') {
                    const baseY = inimigo.getData('baseY');
                    inimigo.y = baseY + Math.sin(time / 420 + inimigo.x / 100) * 28;
                    let direcao = inimigo.getData('direcao');
                    if (inimigo.x <= inimigo.getData('minX')) direcao = 1;
                    if (inimigo.x >= inimigo.getData('maxX')) direcao = -1;
                    inimigo.setData('direcao', direcao);
                    inimigo.setVelocityX(direcao * inimigo.getData('velocidade'));
                    inimigo.setFlipX(direcao < 0);

                    if (
                        Math.abs(this.player.x - inimigo.x) < 420
                        && time >= inimigo.getData('proximoTiro')
                    ) {
                        this.atirar(inimigo, this.player, 210, 12, false);
                        inimigo.setData('proximoTiro', time + 1750);
                    }
                    return;
                }

                if (tipo === 'torre') {
                    inimigo.setVelocity(0, 0);
                    inimigo.setFlipX(this.player.x < inimigo.x);
                    if (
                        Math.abs(this.player.x - inimigo.x) < 470
                        && time >= inimigo.getData('proximoTiro')
                    ) {
                        this.atirar(inimigo, this.player, 230, 15, false);
                        inimigo.setData('proximoTiro', time + 1500);
                    }
                    return;
                }

                const dx = this.player.x - inimigo.x;
                const distancia = Math.abs(dx);
                let direcao = inimigo.getData('direcao');
                const detectar = tipo === 'mini-chefe' ? 360 : 230;

                if (distancia <= detectar && Math.abs(this.player.y - inimigo.y) < 150) {
                    direcao = dx < 0 ? -1 : 1;
                } else {
                    if (inimigo.x <= inimigo.getData('minX')) direcao = 1;
                    if (inimigo.x >= inimigo.getData('maxX')) direcao = -1;
                }

                inimigo.setData('direcao', direcao);
                inimigo.setFlipX(direcao < 0);
                const perto = distancia < 76;
                inimigo.setVelocityX(perto ? 0 : direcao * inimigo.getData('velocidade'));
                inimigo.anims.play('robo_patrol', true);

                if (
                    tipo === 'mini-chefe'
                    && distancia < 430
                    && time >= inimigo.getData('proximoTiro')
                ) {
                    this.atirar(inimigo, this.player, 235, 16, false);
                    inimigo.setData('proximoTiro', time + 1450);
                }
            });
        }

        limparProjeteis(time) {
            this.projeteis.children.iterate((projetil) => {
                if (!projetil || !projetil.active) return;
                const expirou = time - Number(projetil.getData('criadoEm') || time) > 3200;
                const fora = projetil.x < -50 || projetil.x > LARGURA_MUNDO + 50
                    || projetil.y < -50 || projetil.y > ALTURA_MUNDO + 50;
                if (expirou || fora) projetil.destroy();
            });
        }

        update(time) {
            if (!this.player || this.faseConcluida) return;

            this.controles.atualizar();
            if (this.hudJogo) {
                this.hudJogo.atualizarDispositivo(this.controles.ultimoDispositivo);
                this.hudJogo.atualizarVisibilidade(this.player);
            }

            if (this.controles.consumirPausa()) this.alternarPausa();
            if (this.pausado) return;
            if (time < this.bloqueioInicioAte) {
                this.player.setVelocityX(0);
                return;
            }

            if (this.controles.consumirReiniciar()) {
                this.scene.restart();
                return;
            }

            const noChao = Boolean(
                this.player.body.blocked.down || this.player.body.touching.down
            );
            if (noChao) this.player.pulosDisponiveis = 2;

            const eixoX = this.controles.obterMovimentoX();
            const eixoY = this.controles.obterMovimentoY();
            const agachar = this.controles.estaAgachando();

            if (
                agachar
                && noChao
                && Math.abs(eixoX) < 0.3
                && !this.player.estaMachucado
            ) {
                this.entrarAgachamento();
            } else {
                this.sairAgachamento();
            }

            if (
                !this.player.estaMachucado
                && !this.player.estaAgachado
            ) {
                if (Math.abs(eixoX) > 0.15) {
                    this.player.setVelocityX(230 * eixoX);
                    this.player.setFlipX(eixoX < 0);
                    if (noChao && !this.player.estaAtacando) {
                        this.player.anims.play('walk', true);
                    }
                } else {
                    this.player.setVelocityX(0);
                    if (noChao && !this.player.estaAtacando) {
                        this.player.anims.play('idle', true);
                    }
                }
            }

            if (
                eixoY > 0.65
                && !noChao
                && this.player.body.velocity.y < 360
            ) {
                this.player.setVelocityY(360);
            }

            if (
                this.controles.consumirPulo()
                && !this.player.estaMachucado
            ) {
                this.sairAgachamento(true);
                if (noChao) {
                    this.player.pulosDisponiveis = 1;
                    this.player.setVelocityY(-520);
                    this.player.anims.play('jump', true);
                    tocar('pulo');
                } else if (this.player.pulosDisponiveis > 0) {
                    this.player.pulosDisponiveis = 0;
                    this.player.setVelocityY(-500);
                    this.iniciarGiroDuplo();
                    tocar('puloDuplo');
                }
            }

            if (this.controles.consumirAtaque()) this.executarAtaque();

            const estaDescendo = !noChao && this.player.body.velocity.y > 40;
            if (estaDescendo && this.player.giroDuploAtivo) {
                this.cancelarGiroDuplo();
            }
            if (
                !noChao
                && !this.player.giroDuploAtivo
                && !this.player.estaAtacando
                && !this.player.estaMachucado
                && !this.player.estaAgachado
            ) {
                this.player.anims.play('jump', true);
            }

            if (this.player.giroDuploAtivo) this.sincronizarGiroDuplo();
            if (this.player.estaAgachado) this.sincronizarAgachamento();

            this.atualizarInimigos(time);
            this.atualizarBoss(time);
            this.limparProjeteis(time);
            this.atualizarZona();

            if (this.player.x > 4400) this.iniciarBoss();

            if (this.player.y > 650 && !this.sistemaVida.invulneravel) {
                this.aplicarDano(1000, 'queda', 0, 0);
                if (this.player.body) this.player.body.enable = false;
                this.player.setVisible(false);
            }

            this.player.estavaNoChao = noChao;
        }
    }

    class ResultadoFase1 extends Phaser.Scene {
        constructor() {
            super('ResultadoFase1');
        }

        preload() {
            if (!this.textures.exists('miguel_victory')) {
                this.load.image('miguel_victory', ASSETS.miguel_victory);
            }
        }

        create() {
            const resultado = this.registry.get('resultadoFase1') || {};
            this.cameras.main.setBackgroundColor('#071426');
            this.add.rectangle(400, 300, 800, 600, 0x071426, 1);
            this.add.image(155, 320, 'miguel_victory').setScale(1.05);

            this.add.text(490, 70, 'FASE 1 CONCLUÍDA!', {
                fontFamily: 'Courier New',
                fontSize: '36px',
                color: '#28ff9b',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const linhas = [
                `PONTOS DA FASE: ${resultado.pontosFase || 0}`,
                `PONTUAÇÃO TOTAL: ${resultado.pontosFinais || 0}`,
                `TEMPO: ${resultado.tempoSegundos || 0}s  BÔNUS ${resultado.bonusTempo || 0}`,
                `CRISTAIS: ${resultado.cristais || 0}/${resultado.totalCristais || 0}`,
                `INIMIGOS: ${resultado.inimigosDerrotados || 0}`,
                `DANOS RECEBIDOS: ${resultado.danosRecebidos || 0}`,
                `BÔNUS VIDA: ${resultado.bonusVida || 0}`,
                `BÔNUS PERFEITO: ${resultado.bonusSemDano || 0}`,
                `BÔNUS COLEÇÃO: ${resultado.bonusColeta || 0}`
            ];

            this.add.text(490, 270, linhas.join('\n'), {
                fontFamily: 'Courier New',
                fontSize: '17px',
                color: '#ffffff',
                lineSpacing: 9,
                align: 'left'
            }).setOrigin(0.5);

            const repetir = this.add.text(420, 520, '[ JOGAR NOVAMENTE ]', {
                fontFamily: 'Courier New',
                fontSize: '18px',
                color: '#071426',
                backgroundColor: '#28ff9b',
                padding: { x: 14, y: 10 },
                fontStyle: 'bold'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            const menu = this.add.text(655, 520, '[ MENU ]', {
                fontFamily: 'Courier New',
                fontSize: '18px',
                color: '#ffcc00',
                padding: { x: 14, y: 10 },
                fontStyle: 'bold'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            repetir.on('pointerdown', () => this.scene.start('Fase1'));
            menu.on('pointerdown', () => {
                if (window.MIGUEL_DEVICE_MANAGER) {
                    window.MIGUEL_DEVICE_MANAGER.desativarFase();
                }
                const gerenteAudio = audio();
                if (gerenteAudio) gerenteAudio.pararMusica();
                this.scene.start('MenuPrincipal');
            });
        }
    }

    const instalar = () => {
        if (!window.Phaser || !window.__MIGUEL_GAME__) return false;
        if (window.__MIGUEL_PHASE1_INSTALLED__ === BUILD) return true;

        const gerente = window.__MIGUEL_GAME__.scene;
        if (!gerente || typeof gerente.add !== 'function') return false;

        try {
            if (gerente.isActive('Fase1')) return false;
            if (gerente.keys && gerente.keys.Fase1) gerente.remove('Fase1');
            if (gerente.keys && gerente.keys.ResultadoFase1) gerente.remove('ResultadoFase1');
            gerente.add('Fase1', Fase1Completa, false);
            gerente.add('ResultadoFase1', ResultadoFase1, false);
            window.__MIGUEL_PHASE1_INSTALLED__ = BUILD;
            console.info('[FASE 1]', BUILD, 'instalada');
            return true;
        } catch (erro) {
            console.error('[FASE 1] falha ao instalar', erro);
            return false;
        }
    };

    const intervalo = window.setInterval(() => {
        if (instalar()) window.clearInterval(intervalo);
    }, 100);

    window.addEventListener('load', instalar, { once: true });
    window.MiguelFase1Completa = Fase1Completa;
    window.MiguelResultadoFase1 = ResultadoFase1;
})();
