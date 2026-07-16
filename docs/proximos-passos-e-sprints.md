# Próximos passos e sprints futuras

Este documento organiza o desenvolvimento após a pausa registrada em 16/07/2026.

## Princípios

- estabilidade antes de conteúdo;
- uma responsabilidade por commit;
- mobile validado em dispositivo real;
- sistemas reutilizáveis antes de criar muitas fases;
- arte produzida em lotes;
- economia local antes de ranking online;
- nenhuma compra com dinheiro real na primeira versão.

## Sprint 2 — Finalizar a base jogável

Objetivo: concluir os sistemas essenciais do personagem.

Entregas:

1. validar a física do agachamento;
2. corrigir a pose visual;
3. validar saída lateral e recentralização;
4. adicionar reinício mobile;
5. adicionar Wake Lock;
6. revisar controles simultâneos;
7. revisar orientação e rotação;
8. criar checklist mobile Android e iOS.

Critério de conclusão:

- nenhuma queda através do chão;
- nenhuma piscada de sprite;
- nenhuma ação bloqueada depois de levantar;
- tela permanece ligada durante a partida;
- reinício funciona sem recarregar a página.

## Sprint 3 — Persistência e perfil local

Objetivo: fazer o progresso sobreviver ao fechamento do jogo.

Entregas:

- esquema versionado de dados;
- nome ou apelido local;
- tutorial concluído;
- fases desbloqueadas;
- pontuação por fase;
- melhor pontuação;
- moedas e cristais;
- itens comprados;
- item equipado;
- configurações;
- migração entre versões;
- opção para apagar o progresso.

Tecnologia inicial:

- `localStorage` para dados pequenos;
- camada própria de armazenamento;
- validação e recuperação de dados corrompidos.

## Sprint 4 — Corrigir o robô

Objetivo: transformar o robô atual em um inimigo confiável.

Separar:

- estado visual;
- corpo de colisão;
- patrulha;
- dano de contato;
- recebimento de golpe;
- recebimento de pulo;
- invulnerabilidade temporária;
- derrota;
- explosão;
- recompensa.

Estados mínimos:

1. parado;
2. patrulhando;
3. atacando ou colidindo;
4. recebendo dano;
5. destruído.

A arte definitiva só deve ser integrada depois que sua máquina de estados e colisões estiverem estáveis.

## Sprint 5 — Arquitetura de fases

Objetivo: deixar de manter todas as fases dentro de uma única estrutura monolítica.

Criar configuração por fase com:

- identificador;
- nome;
- tema;
- cenário;
- música;
- ponto inicial;
- objetivo;
- inimigos;
- colecionáveis;
- checkpoints;
- condição de vitória;
- condição de derrota;
- próxima fase;
- recompensa.

Primeiras entregas:

1. tutorial separado;
2. Fase 1 real;
3. tela de seleção;
4. resultado da fase;
5. desbloqueio da fase seguinte.

## Sprint 6 — Pipeline de arte em magenta

Objetivo: reduzir o retrabalho dos novos personagens.

Processo:

1. listar todos os frames;
2. criar todos em magenta;
3. montar spritesheet de inspeção;
4. revisar proporções;
5. revisar poses;
6. revisar continuidade;
7. corrigir o lote completo;
8. aplicar contorno;
9. aplicar cores;
10. exportar e integrar.

Nenhum personagem deve ser finalizado frame a frame antes de o lote completo existir.

## Sprint 7 — Novos personagens

Ordem sugerida:

1. Miguel base revisado;
2. robô;
3. primeiro aliado;
4. primeiro cachorro;
5. primeiro NPC;
6. novo inimigo comum;
7. chefe da primeira fase.

Cada personagem deve possuir ficha visual, escala padrão, paleta, manifesto de animações, spritesheet magenta, rodadas de correção, spritesheet final e teste de integração.

## Sprint 8 — Veículos

Veículos planejados:

- bicicleta;
- hoverboard;
- patins;
- patinete.

Sistemas necessários:

- entrar no veículo;
- sair do veículo;
- aceleração;
- velocidade máxima;
- frenagem;
- colisão;
- salto ou obstáculo;
- dano;
- queda;
- recuperação;
- câmera;
- áudio;
- animação de vitória.

Cada veículo deve ser implementado isoladamente antes de entrar na loja.

## Sprint 9 — Loja e economia

Objetivo: permitir a compra de veículos e itens com recursos do jogo.

Primeira versão:

- moedas ou cristais;
- catálogo;
- preço;
- bloqueado ou disponível;
- compra;
- confirmação;
- item adquirido;
- item equipado;
- restauração da compra local;
- prévia do personagem usando o item.

Categorias futuras:

- veículos;
- roupas;
- cosméticos;
- poderes;
- escudos;
- melhorias de vida;
- efeitos visuais.

Não usar dinheiro real nesta etapa.

## Sprint 10 — Recordes e compartilhamento

### Etapa local

- melhor pontuação por fase;
- maior quantidade de cristais;
- menor tempo;
- sequência de vitórias;
- tela de recordes;
- cartão compartilhável como imagem.

### Etapa online

- backend;
- autenticação adequada;
- apelido público;
- validação da pontuação;
- proteção contra fraude;
- moderação;
- privacidade;
- ranking por fase;
- ranking semanal;
- ranking geral.

O ranking não deve armazenar nome completo, data de nascimento, fotografia ou outro dado pessoal de criança.

## Sprint 11 — Expansão de conteúdo

- novas fases;
- mundos;
- chefes;
- fases verticais;
- perseguições;
- corridas;
- fases de bicicleta;
- fases de hoverboard;
- fases de patins;
- fases de patinete;
- fases com cachorros;
- desafios especiais.

## Sprint 12 — Finalização de produto

- áudio definitivo;
- acessibilidade;
- PWA;
- funcionamento offline;
- ícones;
- telas de abertura;
- desempenho;
- testes Android;
- testes iOS;
- testes desktop;
- gamepad;
- telemetria respeitando privacidade;
- preparação para publicação.
