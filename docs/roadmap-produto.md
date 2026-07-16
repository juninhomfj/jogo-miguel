# Roadmap — As Aventuras do Miguel

## Identidade do jogo

- plataforma e ação em pixel art 8-bits estrito;
- visual retrô nítido, sem antialiasing;
- experiência infantil, intuitiva e acessível;
- suporte a celular, tablet, computador e gamepad;
- conteúdo inspirado em Miguel, sua família, seus cachorros e suas aventuras.

## Estrutura principal

- menu principal animado;
- tutorial separado da primeira fase real;
- seleção de fases;
- configurações;
- pausa;
- resultados;
- progressão;
- loja;
- recordes;
- créditos;
- instalação como PWA.

## Controles

### Mobile

- analógico flutuante;
- movimento por eixos;
- pulo;
- golpe;
- poder;
- agachamento puxando o analógico para baixo;
- reinício mobile planejado;
- multitouch;
- vibração opcional;
- Wake Lock durante a partida.

### Computador

- A/D ou setas;
- W ou seta para cima;
- S ou seta para baixo para agachar;
- teclas de ação;
- dicas temporárias.

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
4. agachar;
5. receber dano do robô;
6. derrotar o robô;
7. coletar cristais.

Ao terminar:

- começar a aventura;
- voltar ao menu principal.

## Vida e dano

- barra de vida;
- corações;
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

## Robô

O robô atual precisa ser corrigido antes da expansão de inimigos.

Separar:

- máquina de estados;
- patrulha;
- direção;
- colisão;
- dano de contato;
- recebimento de dano;
- invulnerabilidade temporária;
- derrota;
- explosão;
- recompensa;
- arte definitiva.

Primeiro estabilizar comportamento e colisões. Depois criar o novo lote visual em magenta.

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
- recordes locais;
- ranking compartilhável com validação;
- desbloqueios.

## Persistência

Salvar com formato versionado:

- tutorial concluído;
- fases desbloqueadas;
- melhor pontuação por fase;
- moedas;
- cristais;
- veículos adquiridos;
- veículo equipado;
- configurações;
- recordes locais.

## Tipos de fase

- plataforma horizontal;
- plataforma vertical;
- escalada;
- perseguição;
- corrida automática;
- bicicleta;
- hoverboard;
- patins;
- patinete;
- combate;
- fases com companheiros;
- desafios com os cachorros.

## Arquitetura de fases

Cada fase deverá configurar:

- identificador;
- nome;
- tema;
- cenário;
- música;
- posição inicial;
- objetivo;
- inimigos;
- colecionáveis;
- checkpoints;
- condição de vitória;
- condição de derrota;
- recompensa;
- próxima fase.

O tutorial permanece separado da Fase 1 real.

## Personagens e animações futuras

- Miguel em novas ações;
- Miguel de bicicleta;
- Miguel de hoverboard;
- Miguel de patins;
- Miguel de patinete;
- cachorros baseados em referências autorizadas;
- aliados;
- personagens convidados;
- NPCs;
- inimigos comuns;
- chefes.

## Pipeline de arte

Todos os novos personagens e veículos seguirão produção em lote:

1. manifesto completo;
2. ficha visual;
3. todos os frames em magenta;
4. folha de inspeção;
5. correção de identidade;
6. correção de escala e alinhamento;
7. correção do movimento;
8. contorno;
9. paleta final;
10. transparência e exportação;
11. hashes e checkpoint;
12. integração no jogo.

Nenhum frame será finalizado isoladamente antes de o conjunto completo existir.

## Veículos

Veículos planejados:

- bicicleta;
- hoverboard;
- patins;
- patinete.

Cada veículo deverá possuir:

- entrada e saída;
- movimento;
- aceleração;
- frenagem;
- salto ou obstáculo;
- dano;
- queda;
- vitória;
- miniatura para a loja;
- versão de Miguel usando o item.

## Loja

Primeira versão com moedas ou cristais do próprio jogo:

- catálogo;
- miniatura;
- descrição;
- preço;
- estado bloqueado;
- estado disponível;
- estado adquirido;
- estado equipado;
- confirmação de compra;
- persistência local.

Não usar dinheiro real na primeira versão.

## Recordes e compartilhamento

### Local

- melhor pontuação por fase;
- melhor tempo;
- maior quantidade de cristais;
- tela de recordes;
- cartão compartilhável como imagem.

### Online

Somente depois de existir backend, autenticação adequada, apelido público seguro, validação da pontuação, proteção contra fraude, moderação e política de privacidade.

Não armazenar dados pessoais de crianças no ranking público.

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
- início mudo até interação do usuário.

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

1. validar a física atual do agachamento;
2. corrigir a pose visual;
3. adicionar reinício mobile e Wake Lock;
4. criar persistência local versionada;
5. corrigir completamente o robô;
6. criar arquitetura reutilizável de fases;
7. implementar a primeira fase real;
8. implantar o pipeline de arte em magenta;
9. criar novos personagens e inimigos;
10. implementar veículos;
11. criar progressão e loja;
12. criar recordes locais;
13. avaliar ranking compartilhável;
14. expandir mundos, chefes, áudio e PWA.

## Documentos operacionais

- [Estado atual e retomada](estado-atual-e-retomada.md)
- [Próximas sprints](proximos-passos-e-sprints.md)
- [Pipeline de sprites em magenta](pipeline-producao-sprites-magenta.md)
- [Instruções para agentes](../AGENTS.md)
