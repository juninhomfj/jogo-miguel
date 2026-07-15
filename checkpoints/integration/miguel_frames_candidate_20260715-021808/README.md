# Candidato completo com os frames do Miguel

Data: 20260715-021808
Branch: recuperacao/fonte-da-verdade
Commit-base: eb874b957d3d1512637736e606b7d06615af697f
Fonte funcional: 4e7974b

## Objetivo

Criar uma versão executável candidata baseada no último
jogo completo, sem substituir o index.html ativo.

## Arquivo para teste

integration-preview/miguel-frames-candidate.html

## Integração

Os 14 PNGs aprovados são carregados como texturas
individuais do Phaser.

O candidato não utiliza miguel_sprites.png e não utiliza
generateFrameNumbers para o Miguel.

## Estado

- JavaScript verificado com node --check;
- mapeamento estrutural auditado;
- index.html atual preservado;
- teste visual e funcional ainda pendente.
