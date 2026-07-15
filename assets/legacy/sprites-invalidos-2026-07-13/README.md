# Spritesheets antigos e inválidos

Estes arquivos foram preservados apenas como referência visual e histórica.

Eles não devem voltar a ser utilizados diretamente pelo Phaser.

## Miguel

O arquivo original possui 866×288 px.

Embora represente visualmente uma organização aproximada de 6 colunas por
2 linhas, os elementos não respeitam os limites das células:

- o efeito de poder atravessa a divisão entre dois frames;
- os efeitos de poeira atravessam as divisões laterais;
- os personagens não permanecem centralizados de maneira uniforme;
- alguns pixels visíveis encostam nos limites das células.

## Robô

O arquivo original possui 645×387 px, mas não representa uma grade 3×3.

A composição visual possui aproximadamente:

- cinco poses na primeira linha;
- quatro poses na segunda linha;
- larguras e posições diferentes entre as poses;
- elementos atravessando os limites calculados.

Nenhum ajuste de `frameWidth`, `frameHeight`, `margin` ou `spacing` pode
corrigir estruturalmente esses arquivos.
