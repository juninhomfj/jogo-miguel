# Remoção de chroma — 13_victory_trophy

Data: 20260715-003341
Branch: recuperacao/fonte-da-verdade
Commit-base: 933aa524f81c1663263908587ad1b3d25b2da411

O fundo magenta foi removido usando preenchimento conectado
às bordas.

Somente pixels que:
1. atendiam ao critério de chroma; e
2. estavam conectados às bordas

foram convertidos em transparência.

Ainda faltam:
- auditoria de componentes;
- localização de chroma residual;
- limpeza visual;
- normalização;
- validação técnica;
- aprovação visual;
- importação.
