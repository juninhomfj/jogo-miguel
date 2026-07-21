(() => {
    const fases = {
        Tutorial: Object.freeze({
            id: 'tutorial',
            scene: 'Tutorial',
            titulo: 'Treinamento do Herói',
            tipo: 'tutorial',
            orientacao: 'landscape',
            tamanhoLogico: Object.freeze({
                width: 800,
                height: 600
            }),
            tema: 'ceu-tecnologico-noturno',
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
            tamanhoLogico: Object.freeze({
                width: 800,
                height: 600
            }),
            tema: 'resultado-noturno',
            controles: Object.freeze([
                'continuar',
                'voltar-menu'
            ]),
            camadasDinamicas: Object.freeze([]),
            proximaCena: 'Fase1'
        }),

        Fase1: Object.freeze({
            id: 'fase-1',
            scene: 'Fase1',
            titulo: 'Primeira Aventura',
            tipo: 'fase',
            orientacao: 'landscape',
            tamanhoLogico: Object.freeze({
                width: 800,
                height: 600
            }),
            tema: 'mundo-1',
            controles: Object.freeze([
                'movimento',
                'pulo',
                'pulo-duplo',
                'agachamento',
                'ataque',
                'pausa'
            ]),
            camadasDinamicas: Object.freeze([
                'cenario',
                'plataformas',
                'inimigos',
                'coletaveis',
                'chefe'
            ]),
            objetivos: Object.freeze([
                'atravessar-fase',
                'coletar-itens',
                'derrotar-chefe'
            ]),
            proximaCena: 'ResultadoFase1'
        })
    };

    const modelos = {
        horizontal: Object.freeze({
            orientacao: 'landscape',
            tamanhoLogico: Object.freeze({
                width: 960,
                height: 540
            }),
            usos: Object.freeze([
                'plataforma',
                'perseguicao',
                'combate',
                'corrida'
            ])
        }),

        vertical: Object.freeze({
            orientacao: 'portrait',
            tamanhoLogico: Object.freeze({
                width: 540,
                height: 960
            }),
            usos: Object.freeze([
                'escalada',
                'queda',
                'torre',
                'desafio-vertical'
            ])
        }),

        livre: Object.freeze({
            orientacao: 'any',
            tamanhoLogico: Object.freeze({
                width: 800,
                height: 600
            }),
            usos: Object.freeze([
                'menu',
                'mapa',
                'resultado'
            ])
        })
    };

    window.MIGUEL_PHASE_CONFIG = Object.freeze({
        versao: 4,
        fases: Object.freeze(fases),
        modelos: Object.freeze(modelos)
    });

    const script = document.createElement('script');
    script.src = (
        'js/robot-attack.js'
        + '?v=robot-attack-projectile-v1-20260720'
    );
    script.async = false;
    script.dataset.miguelModule = 'robot-attack';
    document.head.appendChild(script);
})();
