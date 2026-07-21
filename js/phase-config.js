(() => {
    const fases = {
        Tutorial: Object.freeze({
            id: 'tutorial',
            scene: 'Tutorial',
            titulo: 'Treinamento do Herói',
            tipo: 'tutorial',
            orientacao: 'landscape',
            tamanhoLogico: Object.freeze({ width: 800, height: 600 }),
            tema: 'ceu-tecnologico-noturno',
            musica: 'tutorial',
            controles: Object.freeze([
                'movimento',
                'pulo',
                'pulo-duplo',
                'agachamento',
                'ataque'
            ]),
            camadasDinamicas: Object.freeze([
                'nuvens',
                'cristais',
                'robo-patrulha'
            ]),
            objetivos: Object.freeze([
                'aprender-movimento',
                'aprender-pulo',
                'aprender-pulo-duplo',
                'aprender-agachamento',
                'aprender-dano',
                'aprender-ataque',
                'coletar-cristais'
            ]),
            proximaCena: 'ResultadoTutorial'
        }),

        ResultadoTutorial: Object.freeze({
            id: 'resultado-tutorial',
            scene: 'ResultadoTutorial',
            titulo: 'Treinamento Concluído',
            tipo: 'resultado',
            orientacao: 'landscape',
            tamanhoLogico: Object.freeze({ width: 800, height: 600 }),
            tema: 'resultado-noturno',
            controles: Object.freeze(['continuar', 'voltar-menu']),
            camadasDinamicas: Object.freeze([]),
            proximaCena: 'Fase1'
        }),

        Fase1: Object.freeze({
            id: 'fase-1',
            scene: 'Fase1',
            titulo: 'A Cidade sem Energia',
            tipo: 'fase',
            orientacao: 'landscape',
            tamanhoLogico: Object.freeze({ width: 800, height: 600 }),
            tamanhoMundo: Object.freeze({ width: 5400, height: 680 }),
            tema: 'cidade-tecnologica-noturna',
            musica: 'fase1',
            controles: Object.freeze([
                'movimento',
                'pulo',
                'pulo-duplo',
                'agachamento',
                'ataque',
                'pausa'
            ]),
            setores: Object.freeze([
                'portao-da-cidade',
                'fabrica-abandonada',
                'tuneis-de-energia',
                'ponte-das-engrenagens',
                'nucleo-do-guardiao'
            ]),
            camadasDinamicas: Object.freeze([
                'cenario-parallax',
                'plataformas',
                'plataformas-moveis',
                'obstaculos',
                'inimigos',
                'coletaveis',
                'checkpoints',
                'chefe'
            ]),
            objetivos: Object.freeze([
                'atravessar-cinco-setores',
                'ativar-dois-checkpoints',
                'coletar-dezesseis-cristais',
                'derrotar-mini-viloes',
                'derrotar-nucleo-guardiao'
            ]),
            pontuacao: Object.freeze({
                cristal: 25,
                energia: 75,
                checkpoint: 100,
                sentinela: 120,
                drone: 150,
                torre: 180,
                miniChefe: 400,
                chefe: 1200,
                colecaoCompleta: 400,
                semDano: 500
            }),
            proximaCena: 'ResultadoFase1'
        }),

        ResultadoFase1: Object.freeze({
            id: 'resultado-fase-1',
            scene: 'ResultadoFase1',
            titulo: 'Fase 1 Concluída',
            tipo: 'resultado',
            orientacao: 'landscape',
            tamanhoLogico: Object.freeze({ width: 800, height: 600 }),
            tema: 'cidade-restaurada',
            controles: Object.freeze(['jogar-novamente', 'voltar-menu']),
            camadasDinamicas: Object.freeze([]),
            proximaCena: null
        })
    };

    const modelos = {
        horizontal: Object.freeze({
            orientacao: 'landscape',
            tamanhoLogico: Object.freeze({ width: 960, height: 540 }),
            usos: Object.freeze(['plataforma', 'perseguicao', 'combate', 'corrida'])
        }),
        vertical: Object.freeze({
            orientacao: 'portrait',
            tamanhoLogico: Object.freeze({ width: 540, height: 960 }),
            usos: Object.freeze(['escalada', 'queda', 'torre', 'desafio-vertical'])
        }),
        livre: Object.freeze({
            orientacao: 'any',
            tamanhoLogico: Object.freeze({ width: 800, height: 600 }),
            usos: Object.freeze(['menu', 'mapa', 'resultado'])
        })
    };

    window.MIGUEL_PHASE_CONFIG = Object.freeze({
        versao: 8,
        fases: Object.freeze(fases),
        modelos: Object.freeze(modelos)
    });

    const carregarModulo = (nome, caminho, versao) => {
        if (document.querySelector(`[data-miguel-module="${nome}"]`)) return;
        const script = document.createElement('script');
        script.src = `${caminho}?v=${versao}`;
        script.async = false;
        script.dataset.miguelModule = nome;
        document.head.appendChild(script);
    };

    carregarModulo(
        'scale-guard',
        'js/scale-guard.js',
        'phaser-scale-guard-v1-20260720'
    );
    carregarModulo(
        'audio-manager',
        'js/audio-manager.js',
        'audio-procedural-v1-20260720'
    );
    carregarModulo(
        'audio-feedback-extensions',
        'js/audio-feedback-extensions.js',
        'audio-feedback-extensions-v1-20260721'
    );
    carregarModulo(
        'tutorial-transition-guard',
        'js/tutorial-transition-guard.js',
        'tutorial-transition-guard-v1-20260721'
    );
    carregarModulo(
        'tutorial-audio',
        'js/tutorial-audio.js',
        'tutorial-audio-feedback-v1-20260721'
    );
    carregarModulo(
        'robot-attack',
        'js/robot-attack.js',
        'robot-attack-projectile-v3-20260721'
    );

    const carregarFase1 = () => {
        carregarModulo(
            'phase1',
            'js/phase1.js',
            'fase-1-completa-v1-20260720'
        );
        carregarModulo(
            'phase1-polish',
            'js/phase1-polish.js',
            'phase1-polish-v1-20260721'
        );
    };

    if (document.readyState === 'complete') {
        carregarFase1();
    } else {
        window.addEventListener(
            'load',
            carregarFase1,
            { once: true }
        );
    }
})();
