(() => {
    const fases = {
        Fase1: Object.freeze({
            id: 'fase-1',
            scene: 'Fase1',

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
                'aprender-ataque',
                'coletar-cristais'
            ]),

            proximaCena: 'Fase2'
        }),

        Fase2: Object.freeze({
            id: 'resultado-fase-1',
            scene: 'Fase2',

            titulo: 'Treinamento Concluído',
            tipo: 'resultado',

            orientacao: 'landscape',

            tamanhoLogico: Object.freeze({
                width: 800,
                height: 600
            }),

            tema: 'resultado-noturno',

            controles: Object.freeze([
                'reiniciar'
            ]),

            camadasDinamicas: Object.freeze([]),

            proximaCena: 'MenuPrincipal'
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
        versao: 1,

        fases: Object.freeze(fases),

        modelos: Object.freeze(modelos)
    });
})();
