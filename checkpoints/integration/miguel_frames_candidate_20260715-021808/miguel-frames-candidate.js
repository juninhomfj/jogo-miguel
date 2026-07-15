// ==========================================
        // CENA 1: MENU PRINCIPAL
        // ==========================================
        class MenuPrincipal extends Phaser.Scene {
            constructor() {
                super('MenuPrincipal');
            }

            preload() {
                // Alerta automático caso a imagem dê erro ao carregar do GitHub
                this.load.on('loaderror', function (file) {
                    alert("AVISO DEV: Não foi possível carregar a imagem '" + file.src + "'. Verifique se o nome está idêntico com letras minúsculas!");
                });

                // MIGUEL — 14 frames individuais aprovados.
                // Cada textura possui canvas RGBA de 256x256.
                this.load.image(
                    'miguel_idle',
                    '../assets/frames/miguel/00_idle.png'
                );
                this.load.image(
                    'miguel_walk_1',
                    '../assets/frames/miguel/01_walk_1.png'
                );
                this.load.image(
                    'miguel_walk_2',
                    '../assets/frames/miguel/02_walk_2.png'
                );
                this.load.image(
                    'miguel_walk_3',
                    '../assets/frames/miguel/03_walk_3.png'
                );
                this.load.image(
                    'miguel_jump',
                    '../assets/frames/miguel/04_jump.png'
                );
                this.load.image(
                    'miguel_double_jump',
                    '../assets/frames/miguel/05_double_jump.png'
                );
                this.load.image(
                    'miguel_punch',
                    '../assets/frames/miguel/06_punch.png'
                );
                this.load.image(
                    'miguel_power_cast',
                    '../assets/frames/miguel/07_power_cast.png'
                );
                this.load.image(
                    'miguel_dust_1',
                    '../assets/frames/miguel/08_dust_1.png'
                );
                this.load.image(
                    'miguel_dust_2',
                    '../assets/frames/miguel/09_dust_2.png'
                );
                this.load.image(
                    'miguel_dust_3',
                    '../assets/frames/miguel/10_dust_3.png'
                );
                this.load.image(
                    'miguel_reserved',
                    '../assets/frames/miguel/11_reserved.png'
                );
                this.load.image(
                    'miguel_hurt',
                    '../assets/frames/miguel/12_hurt.png'
                );
                this.load.image(
                    'miguel_victory',
                    '../assets/frames/miguel/13_victory_trophy.png'
                );

                // Robô histórico provisório.
                // Será substituído quando os frames do robô
                // forem reconstruídos e aprovados.
                this.load.spritesheet(
                    'robo',
                    '../assets/legacy/'
                    + 'sprites-invalidos-2026-07-13/'
                    + 'robo_sprites_original.png',
                    {
                        frameWidth: 215,
                        frameHeight: 129,
                        spacing: 0
                    }
                );

// Gera a textura do cristal tecnológico via código puro
                const graficoCristal = this.make.graphics({ x: 0, y: 0, add: false });
                graficoCristal.fillStyle(0x00E5FF, 0.35);
                graficoCristal.fillCircle(18, 18, 18);
                graficoCristal.fillStyle(0x00FFFF, 1);
                graficoCristal.fillPoints([
                    { x: 18, y: 0 },
                    { x: 34, y: 18 },
                    { x: 18, y: 36 },
                    { x: 2, y: 18 }
                ], true);
                graficoCristal.lineStyle(3, 0xE6FFFF, 1);
                graficoCristal.strokePoints([
                    { x: 18, y: 0 },
                    { x: 34, y: 18 },
                    { x: 18, y: 36 },
                    { x: 2, y: 18 }
                ], true);
                graficoCristal.lineStyle(2, 0x7DF9FF, 0.85);
                graficoCristal.lineBetween(18, 0, 18, 36);
                graficoCristal.lineBetween(2, 18, 34, 18);
                graficoCristal.fillStyle(0xFFFFFF, 0.9);
                graficoCristal.fillCircle(13, 10, 3);
                graficoCristal.generateTexture('cristalTecnologico', 36, 36);
                graficoCristal.destroy();
            }

            create() {
                // Título em Alto Contraste (Amarelo Arcade sobre fundo quase preto)
                this.add.text(400, 140, 'AS AVENTURAS DO MIGUEL', {
                    fontSize: '36px',
                    fill: '#FFCC00',
                    fontStyle: 'bold',
                    fontFamily: 'Courier New'
                }).setOrigin(0.5);

                // Ativa e exibe a caixa de texto em HTML em cima do canvas
                const containerNome = document.getElementById('name-input-container');
                containerNome.style.display = 'flex';
                containerNome.style.visibility = 'visible';

                // Lógica ao clicar no botão "ENTRAR"
                const botaoEntrar = document.getElementById('start-button');
                botaoEntrar.onclick = () => {
                    let nome = document.getElementById('player-name-input').value.trim();
                    if (!nome) nome = "MIG";
                    nome = nome.substring(0, 3).toUpperCase();

                    this.registry.set('nomeJogador', nome);
                    this.registry.set('pontuacao', 0);

                    // Inicia a fase e garante que a camada HTML não bloqueie o canvas.
                    this.scene.start('Fase1');
                    containerNome.style.visibility = 'hidden';
                    containerNome.style.display = 'none';
                };
            }
        }

        // ==========================================
        // CENA 2: FASE 1
        // ==========================================
        class Fase1 extends Phaser.Scene {
            constructor() {
                super('Fase1');
            }

            create() {
                console.log('Fase1 iniciada');

                // Cenário dinâmico ao fundo: nuvens desenhadas por código
                this.nuvens = [];
                const dadosNuvens = [
                    { x: 130, y: 105, escala: 0.9, velocidade: 0.18 },
                    { x: 360, y: 75, escala: 0.7, velocidade: 0.12 },
                    { x: 590, y: 135, escala: 1.05, velocidade: 0.16 },
                    { x: 760, y: 95, escala: 0.8, velocidade: 0.2 }
                ];

                dadosNuvens.forEach((dados) => {
                    const nuvem = this.add.container(dados.x, dados.y).setDepth(-10);
                    const brilho = 0xFFFFFF;
                    nuvem.add(this.add.ellipse(-28, 8, 70, 28, brilho, 0.7));
                    nuvem.add(this.add.ellipse(12, 0, 82, 34, brilho, 0.82));
                    nuvem.add(this.add.ellipse(42, 10, 62, 24, brilho, 0.68));
                    nuvem.setScale(dados.escala);
                    nuvem.velocidade = dados.velocidade;
                    this.nuvens.push(nuvem);
                });

                // Placar de Alto Contraste
                this.nome = this.registry.get('nomeJogador');
                this.pontos = this.registry.get('pontuacao');
                this.textoPlacar = this.add.text(20, 20, `${this.nome} SCORE: ${this.pontos}`, {
                    fontSize: '28px',
                    fill: '#FFCC00',
                    fontStyle: 'bold'
                });

                // PLATAFORMAS (Alto contraste)
                this.plataformas = this.physics.add.staticGroup();

                // Chão Principal (Verde Neon gritante para contrastar com o uniforme vermelho/azul)
                let chao = this.add.rectangle(400, 460, 800, 40, 0x00FF66);
                this.physics.add.existing(chao, true);
                this.plataformas.add(chao);

                // Plataformas flutuantes (Branco Puro para total destaque no fundo escuro)
                let plat1 = this.add.rectangle(600, 300, 180, 24, 0xFFFFFF);
                this.physics.add.existing(plat1, true);
                this.plataformas.add(plat1);

                let plat2 = this.add.rectangle(200, 200, 180, 24, 0xFFFFFF);
                this.physics.add.existing(plat2, true);
                this.plataformas.add(plat2);

                // INIMIGO: robô vilão animado pelo spritesheet novo
                if (!this.textures.exists('particulaVilao')) {
                    const graficoParticula = this.make.graphics({ x: 0, y: 0, add: false });
                    graficoParticula.fillStyle(0xFF2222, 1);
                    graficoParticula.fillRect(0, 0, 8, 8);
                    graficoParticula.generateTexture('particulaVilao', 8, 8);
                    graficoParticula.destroy();
                }

                this.vilao = this.physics.add.sprite(600, 366, 'robo', 0);
                this.vilao.setScale(0.45);
                this.vilao.setCollideWorldBounds(false);
                this.vilao.setVelocityX(90);
                this.vilao.setBounce(0);
                this.vilao.body.setSize(78, 92);
                this.vilao.body.setOffset(25, 24);
                this.vilao.limiteEsquerda = plat1.x - (plat1.width / 2) + (this.vilao.displayWidth / 2);
                this.vilao.limiteDireita = plat1.x + (plat1.width / 2) - (this.vilao.displayWidth / 2);
                this.vilao.direcao = 1;
                this.ultimoDanoVilao = 0;

                // CAIXA INDICADORA DE TESTES (Fica atrás do sprite. Se o sprite sumir, você verá este bloco se mexendo!)
                this.indicadorPosicao = this.add.rectangle(50, 320, 60, 80, 0x333333);

                // CRIANDO O MIGUEL
                this.player = this.physics.add.sprite(50, 320, 'miguel_idle');
                this.player.setScale(0.95);
                this.player.body.setSize(54, 116);
                this.player.body.setOffset(101, 108);
                this.player.pulosDisponiveis = 2;
                this.player.estaAtacando = false;
                this.player.estavaNoChao = false;
                this.player.setDepth(10);
                this.player.setCollideWorldBounds(true);

                this.physics.add.collider(this.player, this.plataformas);
                this.physics.add.collider(this.vilao, this.plataformas);
                this.physics.add.collider(this.player, this.vilao, this.acertarVilao, null, this);

                this.poeira = this.add.sprite(0, 0, 'miguel_dust_1').setVisible(false).setDepth(9);
                this.poeira.setScale(0.95);

                // CRISTAIS TECNOLÓGICOS COLETÁVEIS
                this.cristais = this.physics.add.group({
                    key: 'cristalTecnologico',
                    repeat: 4,
                    setXY: { x: 180, y: 25, stepX: 130 }
                });

                this.cristais.children.iterate(function (child) {
                    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.6));
                    child.setAngularVelocity(90);
                    child.setDepth(5);
                });

                this.physics.add.collider(this.cristais, this.plataformas);
                this.physics.add.overlap(this.player, this.cristais, this.coletarCristal, null, this);

                // ANIMAÇÕES DO MIGUEL
                // Agora utilizam texturas individuais.
                if (!this.anims.exists('walk')) {
                    this.anims.create({
                        key: 'walk',
                        frames: [
                            { key: 'miguel_walk_1' },
                            { key: 'miguel_walk_2' },
                            { key: 'miguel_walk_3' }
                        ],
                        frameRate: 8,
                        repeat: -1
                    });

                    this.anims.create({
                        key: 'idle',
                        frames: [
                            { key: 'miguel_idle' }
                        ],
                        frameRate: 1,
                        repeat: -1
                    });

                    this.anims.create({
                        key: 'jump',
                        frames: [
                            { key: 'miguel_jump' }
                        ],
                        frameRate: 1,
                        repeat: 0
                    });

                    this.anims.create({
                        key: 'jump_double',
                        frames: [
                            { key: 'miguel_double_jump' }
                        ],
                        frameRate: 1,
                        repeat: 0
                    });

                    this.anims.create({
                        key: 'attack',
                        frames: [
                            { key: 'miguel_punch' },
                            { key: 'miguel_punch' },
                            { key: 'miguel_idle' }
                        ],
                        frameRate: 10,
                        repeat: 0
                    });

                    this.anims.create({
                        key: 'power_cast',
                        frames: [
                            { key: 'miguel_power_cast' },
                            { key: 'miguel_power_cast' },
                            { key: 'miguel_idle' }
                        ],
                        frameRate: 10,
                        repeat: 0
                    });

                    this.anims.create({
                        key: 'dust_effect',
                        frames: [
                            { key: 'miguel_dust_1' },
                            { key: 'miguel_dust_2' },
                            { key: 'miguel_dust_3' }
                        ],
                        frameRate: 12,
                        repeat: 0
                    });

                    this.anims.create({
                        key: 'hurt',
                        frames: [
                            { key: 'miguel_hurt' }
                        ],
                        frameRate: 1,
                        repeat: 0
                    });

                    this.anims.create({
                        key: 'victory',
                        frames: [
                            { key: 'miguel_victory' }
                        ],
                        frameRate: 1,
                        repeat: -1
                    });

                    this.anims.create({
                        key: 'robo_patrol',
                        frames: this.anims.generateFrameNumbers(
                            'robo',
                            { start: 0, end: 2 }
                        ),
                        frameRate: 8,
                        repeat: -1
                    });

                    this.anims.create({
                        key: 'robo_damage',
                        frames: this.anims.generateFrameNumbers(
                            'robo',
                            { start: 3, end: 5 }
                        ),
                        frameRate: 12,
                        repeat: 0
                    });

                    this.anims.create({
                        key: 'robo_explosion',
                        frames: this.anims.generateFrameNumbers(
                            'robo',
                            { start: 6, end: 8 }
                        ),
                        frameRate: 16,
                        repeat: 0
                    });
                }

                this.vilao.anims.play(
                    'robo_patrol',
                    true
                );

                // CONTROLES DE TECLADO (Para testes em PC)
                this.cursors = this.input.keyboard.createCursorKeys();
                this.teclaAtaque = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

                // CONTROLES VIRTUAIS NA TELA (MOBILE FIRST - TOUCH)
                this.moveEsquerda = false;
                this.moveDireita = false;
                this.querPular = false;
                this.querAtacar = false;

                // Botão Direcional Esquerda
                this.btnEsq = this.add.rectangle(90, 530, 140, 110, 0x222222, 0.85).setInteractive();
                this.btnEsq.setStrokeStyle(4, 0xFFCC00);
                this.add.text(90, 530, '◀', { fontSize: '56px', fill: '#FFCC00' }).setOrigin(0.5);

                // Botão Direcional Direita
                this.btnDir = this.add.rectangle(270, 530, 140, 110, 0x222222, 0.85).setInteractive();
                this.btnDir.setStrokeStyle(4, 0xFFCC00);
                this.add.text(270, 530, '▶', { fontSize: '56px', fill: '#FFCC00' }).setOrigin(0.5);

                // Botão de Pulo (Amarelo bem visível)
                this.btnPulo = this.add.rectangle(625, 530, 130, 110, 0xFFCC00, 0.95).setInteractive();
                this.add.text(625, 530, 'PULO', { fontSize: '26px', fill: '#0d1117', fontStyle: 'bold' }).setOrigin(0.5);

                // Botão de Ataque (novo botão virtual mobile)
                this.btnAtaque = this.add.rectangle(745, 530, 90, 110, 0xFF3333, 0.95).setInteractive();
                this.btnAtaque.setStrokeStyle(4, 0xFFFFFF);
                this.add.text(745, 530, 'BATER', { fontSize: '18px', fill: '#FFFFFF', fontStyle: 'bold' }).setOrigin(0.5);

                // Vinculando os eventos de toque do Celular
                this.btnEsq.on('pointerdown', () => this.moveEsquerda = true);
                this.btnEsq.on('pointerup', () => this.moveEsquerda = false);
                this.btnEsq.on('pointerout', () => this.moveEsquerda = false);

                this.btnDir.on('pointerdown', () => this.moveDireita = true);
                this.btnDir.on('pointerup', () => this.moveDireita = false);
                this.btnDir.on('pointerout', () => this.moveDireita = false);

                this.btnPulo.on('pointerdown', () => this.querPular = true);
                this.btnPulo.on('pointerup', () => this.querPular = false);
                this.btnPulo.on('pointerout', () => this.querPular = false);

                this.btnAtaque.on('pointerdown', () => this.querAtacar = true);
            }

            update() {
                // Move as nuvens lentamente para a esquerda e recicla no lado direito
                this.nuvens.forEach((nuvem) => {
                    nuvem.x -= nuvem.velocidade;
                    if (nuvem.x < -120) {
                        nuvem.x = 920;
                    }
                });

                // Sincroniza o bloco cinza de testes com a posição do Miguel
                this.indicadorPosicao.x = this.player.x;
                this.indicadorPosicao.y = this.player.y;

                let noChao = this.player.body.blocked.down || this.player.body.touching.down;

                if (noChao && !this.player.estavaNoChao) {
                    this.player.pulosDisponiveis = 2;
                    this.tocarPoeira();
                }
                else if (noChao) {
                    this.player.pulosDisponiveis = 2;
                }

                if (this.vilao && this.vilao.active) {
                    if (this.vilao.x <= this.vilao.limiteEsquerda) {
                        this.vilao.x = this.vilao.limiteEsquerda;
                        this.vilao.direcao = 1;
                        this.vilao.setVelocityX(90);
                    }
                    else if (this.vilao.x >= this.vilao.limiteDireita) {
                        this.vilao.x = this.vilao.limiteDireita;
                        this.vilao.direcao = -1;
                        this.vilao.setVelocityX(-90);
                    }
                }

                // Lógica de Movimentação Unificada (Teclado ou Botão Touch)
                if (this.cursors.left.isDown || this.moveEsquerda) {
                    this.player.setVelocityX(-220);
                    this.player.flipX = true;
                    if (noChao && !this.player.estaAtacando) this.player.anims.play('walk', true);
                }
                else if (this.cursors.right.isDown || this.moveDireita) {
                    this.player.setVelocityX(220);
                    this.player.flipX = false;
                    if (noChao && !this.player.estaAtacando) this.player.anims.play('walk', true);
                }
                else {
                    this.player.setVelocityX(0);
                    if (noChao && !this.player.estaAtacando) this.player.anims.play('idle', true);
                }

                // Lógica do Pulo Duplo Unificada
                if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || this.querPular) {
                    this.executarPulo(noChao);
                    this.querPular = false;
                }

                if (Phaser.Input.Keyboard.JustDown(this.teclaAtaque) || this.querAtacar) {
                    this.executarAtaque();
                    this.querAtacar = false;
                }

                if (!noChao && !this.player.estaAtacando) {
                    this.player.anims.play(this.player.pulosDisponiveis === 0 ? 'jump_double' : 'jump', true);
                }

                this.player.estavaNoChao = noChao;
            }

            executarPulo(noChao) {
                if (noChao) {
                    this.player.pulosDisponiveis = 1;
                    this.player.setVelocityY(-520);
                    this.player.anims.play('jump', true);
                }
                else if (this.player.pulosDisponiveis > 0) {
                    this.player.pulosDisponiveis = 0;
                    this.player.setVelocityY(-500);
                    this.player.anims.play('jump_double', true);
                }
            }

            executarAtaque() {
                if (this.player.estaAtacando) return;

                this.player.estaAtacando = true;
                this.player.anims.play('attack', true);
                this.player.once('animationcomplete-attack', () => {
                    this.player.estaAtacando = false;
                });

                const alcance = 70;
                const direcao = this.player.flipX ? -1 : 1;
                const areaAtaque = new Phaser.Geom.Rectangle(
                    this.player.x + (direcao > 0 ? 10 : -alcance - 10),
                    this.player.y - 45,
                    alcance,
                    90
                );

                if (this.vilao && this.vilao.active && Phaser.Geom.Rectangle.Overlaps(areaAtaque, this.vilao.getBounds())) {
                    this.destruirVilao(this.vilao);
                }
            }

            tocarPoeira() {
                this.poeira.setPosition(this.player.x, this.player.body.bottom - 18);
                this.poeira.setFlipX(this.player.flipX);
                this.poeira.setVisible(true);
                this.poeira.anims.play('dust_effect', true);
                this.poeira.once('animationcomplete-dust_effect', () => this.poeira.setVisible(false));
            }

            destruirVilao(vilao) {
                vilao.setVelocity(0, 0);
                vilao.body.enable = false;
                vilao.anims.play('robo_explosion', true);
                vilao.once('animationcomplete-robo_explosion', () => vilao.disableBody(true, true));
            }

            coletarCristal(player, cristal) {
                cristal.disableBody(true, true);
                this.pontos += 10;
                this.registry.set('pontuacao', this.pontos);
                this.textoPlacar.setText(`${this.nome} SCORE: ${this.pontos}`);

                if (this.cristais.countActive(true) === 0) {
                    this.scene.start('Fase2');
                }
            }
            acertarVilao(player, vilao) {
                const pisouNoVilao = player.body.velocity.y > 0 && player.body.bottom <= vilao.body.top + 18;

                if (pisouNoVilao) {
                    const explosao = this.add.particles(vilao.x, vilao.y, 'particulaVilao', {
                        speed: { min: 80, max: 260 },
                        angle: { min: 0, max: 360 },
                        lifespan: 500,
                        gravityY: 500,
                        scale: { start: 1.4, end: 0 },
                        quantity: 18,
                        emitting: false
                    });

                    explosao.explode(18);
                    this.time.delayedCall(600, () => explosao.destroy());
                    this.destruirVilao(vilao);
                    player.setVelocityY(-300);
                    return;
                }

                if (this.time.now - this.ultimoDanoVilao < 900) return;

                this.ultimoDanoVilao = this.time.now;
                this.pontos -= 5;
                this.registry.set('pontuacao', this.pontos);
                this.textoPlacar.setText(`${this.nome} SCORE: ${this.pontos}`);
                vilao.anims.play('robo_damage', true);
                vilao.once('animationcomplete-robo_damage', () => {
                    if (vilao.active) vilao.anims.play('robo_patrol', true);
                });
                player.setVelocityX(player.x < vilao.x ? -260 : 260);
            }
        }

        // ==========================================
        // CENA 3: TELA DE VITÓRIA
        // ==========================================
        class Fase2 extends Phaser.Scene {
            constructor() {
                super('Fase2');
            }

            create() {
                let nome = this.registry.get('nomeJogador');
                let pontosFinal = this.registry.get('pontuacao');

                this.add.image(
                    175,
                    275,
                    'miguel_victory'
                )
                    .setScale(1.05)
                    .setDepth(5);

                this.add.text(
                    505,
                    175,
                    'FASE 1 CONCLUÍDA!',
                    {
                        fontSize: '38px',
                        fill: '#00FF66',
                        fontStyle: 'bold'
                    }
                ).setOrigin(0.5);

                this.add.text(
                    505,
                    275,
                    `HERÓI: ${nome}`,
                    {
                        fontSize: '26px',
                        fill: '#FFF'
                    }
                ).setOrigin(0.5);

                this.add.text(
                    505,
                    335,
                    `PONTOS: ${pontosFinal}`,
                    {
                        fontSize: '32px',
                        fill: '#FFCC00',
                        fontStyle: 'bold'
                    }
                ).setOrigin(0.5);

                let btnVoltar = this.add.text(
                    505,
                    455,
                    '[ JOGAR NOVAMENTE ]',
                    {
                        fontSize: '24px',
                        fill: '#FFCC00',
                        fontStyle: 'bold'
                    }
                ).setOrigin(0.5);
                btnVoltar.setInteractive();
                btnVoltar.on('pointerdown', () => {
                    this.scene.start('MenuPrincipal');
                });
            }
        }

        // ==========================================
        // CONFIGURAÇÕES GERAIS (ESCAlA MOBILE-FIRST)
        // ==========================================
        const config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: 800,
            height: 600,
            backgroundColor: '#0d1117', // Fundo escuro de altíssimo contraste
            scale: {
                mode: Phaser.Scale.FIT, // Faz o jogo expandir e caber perfeitamente em telas de qualquer celular
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 750 }, debug: false }
            },
            scene: [MenuPrincipal, Fase1, Fase2]
        };

        const game = new Phaser.Game(config);
