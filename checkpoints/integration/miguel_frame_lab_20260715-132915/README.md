# Laboratório isolado dos frames do Miguel

Data: 20260715-132915
Branch: recuperacao/fonte-da-verdade
Commit-base: e16e6bca30460f43d4010ef9a5cc7e5113082361

## Objetivo

Testar Miguel sem cristais, robô, troca de fase ou
cenário completo.

## Arquivo

integration-preview/miguel-frame-lab.html

## Configuração inicial

- canvas do frame: 256x256;
- escala visual: 1.2;
- corpo físico: 66x122;
- offset físico: 95,102;
- linha dos pés nos frames terrestres: y=224;
- chão da cena: y=470;
- três frames de caminhada;
- corpo físico estável durante troca de textura;
- pixelArt e antialias desativado.

## Diagnóstico

Abra com ?debug=1 para visualizar o corpo físico.

Também está disponível no console:

window.__MIGUEL_DEBUG__.snapshot()

## Garantia

O index.html ativo não foi alterado.
