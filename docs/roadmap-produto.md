# Roadmap — As Aventuras do Miguel

## Identidade do jogo

- plataforma e ação em pixel art estilo 16-bits;
- visual retrô nítido, sem antialiasing;
- experiência infantil, intuitiva e acessível;
- suporte a celular, tablet, computador e gamepad;
- conteúdo inspirado em Miguel, sua família,
  seus cachorros, sua bicicleta e suas aventuras.

## Estrutura principal

- menu principal animado;
- tutorial separado da primeira fase real;
- seleção de fases;
- configurações;
- pausa;
- resultados;
- progressão;
- loja;
- créditos;
- instalação como PWA.

## Controles

### Mobile

- analógico flutuante na área esquerda;
- origem criada no primeiro toque;
- movimento por eixos;
- transparência alta;
- botão visual de pulo;
- botão visual de golpe;
- multitouch;
- vibração opcional.

### Computador

- A/D ou setas;
- W ou seta para cima;
- X ou espaço;
- dicas pequenas e temporárias;
- ausência dos controles grandes de mobile.

### Gamepad

- analógico esquerdo;
- direcional digital;
- pulo;
- ataque;
- poder;
- pausa;
- detecção automática do dispositivo ativo.

## Tutorial

1. mover Miguel;
2. pular;
3. usar o pulo duplo;
4. receber dano do robô;
5. derrotar o robô com golpe;
6. coletar cristais.

Ao terminar:

- começar a aventura;
- voltar ao menu principal.

## Vida e dano

- barra de vida;
- vidas representadas por corações;
- dano leve, médio e alto;
- invulnerabilidade temporária;
- recuo;
- animação de dano;
- checkpoints;
- queda em buracos remove uma vida;
- fim da tentativa quando os corações terminarem.

## Inimigos

Modos de derrota:

- somente golpe;
- somente pulo;
- golpe ou pulo;
- somente poder;
- invulnerável;
- chefe.

Cada inimigo poderá configurar:

- vida;
- dano de contato;
- dano ao ser pisado;
- velocidade;
- resistência;
- modo de derrota;
- recompensa.

## Chefes

- chefe no final das fases principais;
- barra de vida;
- padrões de ataque;
- múltiplas etapas;
- pontos fracos;
- dano variável;
- animação de derrota;
- recompensa especial.

## Progressão

- pontuação por desempenho;
- cristais ou moedas persistentes;
- estrelas ou medalhas;
- loja;
- melhorias de vida;
- escudo;
- poderes;
- cosméticos;
- veículos;
- desbloqueios.

## Tipos de fase

- plataforma horizontal;
- plataforma vertical;
- escalada;
- perseguição;
- corrida automática;
- bicicleta;
- hoverboard;
- combate;
- fases com companheiros;
- desafios com os cachorros.

## Personagens e animações futuras

- Miguel em novas ações;
- Miguel de bicicleta;
- Miguel de hoverboard;
- cachorros baseados em fotografias reais;
- aliados;
- personagens convidados;
- NPCs;
- inimigos comuns;
- chefes.

## Áudio

- música do menu;
- música por fase;
- pulo;
- pulo duplo;
- golpe;
- dano;
- coleta;
- vitória;
- chefes;
- interface;
- música e efeitos configuráveis;
- preferências salvas localmente;
- início mudo até a interação do usuário.

## Configurações

- música;
- efeitos;
- volume;
- vibração;
- qualidade automática, baixa, normal ou alta;
- dicas;
- tipo de controle;
- acessibilidade;
- orientação quando a fase possuir layout compatível.

## Menu principal

- logotipo As Aventuras do Miguel;
- Miguel miniaturizado e animado;
- cenário em movimento;
- iniciar;
- seleção de fases;
- configurações;
- som;
- créditos.

## PWA

- manifest.webmanifest;
- ícones iOS;
- ícones Android;
- ícone maskable;
- tela de abertura;
- instalação na tela inicial;
- atualização controlada;
- funcionamento básico offline.

## Ordem de desenvolvimento

1. fundação e tutorial;
2. HUD, vida e dano;
3. controles mobile, teclado e gamepad;
4. rotação robusta;
5. menu e configurações;
6. áudio e persistência;
7. primeira fase real;
8. chefe;
9. progressão e loja;
10. novos mundos, veículos e personagens.
