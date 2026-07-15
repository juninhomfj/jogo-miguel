const config = {
            type: Phaser.AUTO,
            parent: 'game-container',
            width: 800, height: 600,
            physics: { default: 'arcade', arcade: { gravity: { y: 750 } } },
            scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
            scene: { preload, create, update }
        };

        const game = new Phaser.Game(config);
        let player, plataformas, cristais, cursors;

        function preload() {
            this.load.spritesheet('miguel', 'miguel_sprites.png', { frameWidth: 144, frameHeight: 96, margin: 1 });
            this.load.spritesheet('robo', 'robo_sprites.png', { frameWidth: 215, frameHeight: 129 });
        }

        function create() {
            document.getElementById('btn').onclick = () => {
                document.getElementById('ui').style.display = 'none';
                iniciarFase(this);
            };
        }

        function iniciarFase(scene) {
            scene.cameras.main.setBackgroundColor('#87CEEB');

            // Chão
            plataformas = scene.physics.add.staticGroup();
            plataformas.create(400, 580, null).setSize(800, 40).setVisible(true);

            // Jogador
            player = scene.physics.add.sprite(100, 400, 'miguel').setScale(0.5);
            player.setCollideWorldBounds(true);
            scene.physics.add.collider(player, plataformas);

            // Cristais (Visual temporário)
            cristais = scene.physics.add.group({ key: 'cristal', repeat: 3, setXY: { x: 200, y: 0, stepX: 150 } });
            scene.physics.add.collider(cristais, plataformas);

            // Nuvens simples
            scene.add.ellipse(100, 100, 100, 50, 0xffffff).setDepth(0);
            scene.add.ellipse(500, 150, 120, 60, 0xffffff).setDepth(0);

            cursors = scene.input.keyboard.createCursorKeys();
        }

        function update() {
            if (!player) return;
            if (cursors.left.isDown) player.setVelocityX(-200);
            else if (cursors.right.isDown) player.setVelocityX(200);
            else player.setVelocityX(0);

            if (cursors.up.isDown && player.body.touching.down) player.setVelocityY(-500);
        }
