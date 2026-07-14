# Remoção de chroma — 10_dust_3

Data: 20260714-221635
Branch: recuperacao/fonte-da-verdade
Commit-base: 56f5eb91835c93838f560253275620ceb3e566e3

O fundo magenta foi removido usando preenchimento conectado
às bordas da imagem.

Somente pixels que:
1. atendiam ao critério de chroma magenta; e
2. estavam conectados às bordas

foram transformados em transparência.

O frame ainda precisa de:
- inspeção visual;
- auditoria de componentes;
- normalização;
- validação técnica;
- aprovação visual;
- importação.
