# Estado atual e guia de retomada

Atualizado em 16/07/2026.

## Objetivo

Registrar exatamente onde o desenvolvimento foi pausado, quais funcionalidades já existem, quais testes ainda faltam e qual é a ordem segura para retomar.

## Estado protegido da produção

- repositório: `juninhomfj/jogo-miguel`;
- branch: `main`;
- commit: `100d4853d32b907ef40a09b40a0b70a66b0cf58e`;
- build: `crouch-physics-stable-20260716-005908`;
- tag: `pausa-sprint-agachamento-main-20260716-010918`.

## Estado protegido do trabalho

- branch: `regressao/crouch-step-by-step`;
- commit: `62cd3cb8382a7607c63c8dcb4dfae2cfdeb15253`;
- tag: `pausa-sprint-agachamento-trabalho-20260716-010918`.

O nome da branch é histórico. O projeto voltou a avançar a partir de uma base segura e está sendo reconstruído em etapas pequenas e controladas.

## Checkpoints recentes

### Saída lateral do agachamento

- commit: `812f26c1b2ca627182c55b3f63d4c2c8c6070e51`;
- tag: `checkpoint-regressao-agachamento-lateral-20260716-001448`.

### Visual girado

- commit: `fc1fe1e5ae0dd3dc75cc4fb8b6c20b0a6bc8a3a7`;
- tag: `checkpoint-regressao-visual-agachado-direita-20260716-003106`.

### Física estável

- commit de trabalho: `62cd3cb8382a7607c63c8dcb4dfae2cfdeb15253`;
- tag de trabalho: `checkpoint-regressao-fisica-agachamento-20260716-010250`;
- tag de produção: `checkpoint-main-fisica-agachamento-20260716-010629`.

## Funcionalidades existentes

### Estrutura

- Phaser 3.60;
- jogo no navegador;
- resolução lógica 800 × 600;
- layout responsivo;
- menu principal;
- configurações;
- tutorial;
- resultado do tutorial;
- HUD;
- sistema de vida e dano;
- cenário em camadas;
- rotação de tela;
- suporte a mobile, teclado e gamepad.

### Movimento do Miguel

- caminhada;
- pulo;
- pulo duplo;
- ataque;
- poder bloqueado durante o treinamento;
- dano;
- vitória;
- agachamento pelo analógico;
- saída lateral do agachamento;
- recentralização antes de novo agachamento.

### Mobile

- analógico virtual;
- multitouch;
- botão de pulo;
- botão de ataque;
- botão de poder;
- proteção contra zoom acidental;
- adaptação de orientação.

## Última correção publicada

A última publicação buscou corrigir o defeito em que Miguel piscava durante o agachamento, perdia o contato estável com o chão, atravessava a plataforma e podia receber queda rápida durante a pose.

A correção implementada:

- preserva a linha inferior do corpo físico;
- desliga a gravidade enquanto está agachado;
- zera a velocidade vertical;
- bloqueia a queda rápida durante a pose;
- restaura a gravidade ao levantar;
- mantém a saída lateral.

## Validação ainda obrigatória

A correção passou nas verificações estruturais e sintáticas, mas ainda precisa de novo teste no iPhone.

### Teste físico

1. Direcionar o analógico para baixo.
2. Confirmar que Miguel não pisca.
3. Manter a pose por pelo menos cinco segundos.
4. Confirmar que o corpo não desce.
5. Confirmar que não atravessa o chão.
6. Mover lateralmente mantendo o dedo pressionado.
7. Confirmar que Miguel levanta.
8. Recentralizar.
9. Agachar novamente.
10. Pular depois de levantar.
11. Atacar depois de levantar.
12. Receber dano normalmente.

### Teste visual

Confirmar orientação da pose, contato visual com o chão, alinhamento horizontal, escala, ausência de corte e ausência de tremulação.

## Defeito visual conhecido

A pose atual pode parecer Miguel deitado de costas segurando os joelhos em vez de parecer agachado.

Esse defeito deve ser tratado em uma etapa exclusivamente visual. Não alterar física, colisão ou controles junto da correção artística.

## Pendências imediatas

1. Testar a física atual no iPhone.
2. Corrigir a orientação visual do agachamento.
3. Validar novamente o conjunto.
4. Adicionar reinício mobile.
5. Adicionar Wake Lock.
6. Criar persistência local versionada.
7. Corrigir o robô.

## Manter a tela ligada

Criar suporte à Screen Wake Lock API durante a partida. O sistema deve solicitar o bloqueio depois de uma interação do jogador, liberar quando a partida sair de foco, solicitar novamente quando a aba voltar e falhar com segurança em navegadores sem suporte.

## Persistência planejada

A camada de persistência deverá salvar tutorial concluído, fases desbloqueadas, pontuação por fase, melhor pontuação, moedas, cristais, veículos adquiridos, veículo equipado, configurações e recordes locais.

O formato deve possuir versão para permitir futuras migrações.

## Robô

O robô atual precisa ser revisado separando arte, corpo de colisão, patrulha, direção, dano de contato, recebimento de golpe, recebimento de pulo, estado de dano, destruição, explosão e recompensa.

Primeiro estabilizar comportamento e colisão. Depois substituir ou corrigir a arte.

## Fases futuras

A arquitetura deverá permitir configuração de identificador, nome, cenário, tema, música, posição inicial, objetivo, inimigos, colecionáveis, checkpoints, condição de vitória, condição de derrota, recompensa e próxima fase.

O tutorial deverá permanecer separado da primeira fase real.

## Novos personagens

O desenvolvimento seguirá produção em lote:

1. Manifesto completo.
2. Todos os frames em magenta.
3. Folha de inspeção.
4. Correção da identidade.
5. Correção da escala.
6. Correção dos movimentos.
7. Contorno.
8. Paleta.
9. Transparência.
10. Integração.

Não finalizar um frame antes de o conjunto completo existir.

## Veículos futuros

- bicicleta;
- hoverboard;
- patins;
- patinete.

Cada veículo deverá possuir animações próprias e uma versão de Miguel utilizando o item. Os veículos poderão ser adquiridos na loja por moedas ou cristais do jogo.

## Loja

A primeira versão deverá conter catálogo, miniatura, descrição, preço, estado bloqueado, estado disponível, estado adquirido, estado equipado, confirmação de compra e persistência local.

A primeira versão não utilizará dinheiro real.

## Recordes

Primeiro criar recordes locais, melhor pontuação por fase, melhor tempo, maior quantidade de cristais, tela de resultados e imagem compartilhável.

O ranking online será posterior e exigirá validação da pontuação no servidor.

## Ordem segura de retomada

1. Buscar referências remotas.
2. Acessar a branch de trabalho.
3. Confirmar árvore limpa.
4. Confirmar commit esperado.
5. Confirmar `origin/main`.
6. Testar o build atual no iPhone.
7. Registrar o resultado.
8. Criar uma etapa isolada.
9. Alterar somente um comportamento.
10. Validar.
11. Criar commit.
12. Criar checkpoint.
13. Publicar por `cherry-pick`.
14. Retornar à branch de trabalho.
15. Atualizar a documentação.

## Valores esperados na retomada

- branch: `regressao/crouch-step-by-step`;
- trabalho: `62cd3cb8382a7607c63c8dcb4dfae2cfdeb15253`;
- produção: `100d4853d32b907ef40a09b40a0b70a66b0cf58e`;
- build: `crouch-physics-stable-20260716-005908`.

## Regra de continuidade

Não iniciar loja, veículos, ranking ou criação em massa de personagens enquanto os sistemas fundamentais de movimentação e colisão ainda possuírem defeitos conhecidos.
