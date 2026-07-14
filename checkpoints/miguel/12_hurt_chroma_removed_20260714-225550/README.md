# Remoção de chroma — 12_hurt

Data: 20260714-225550
Branch: recuperacao/fonte-da-verdade
Commit-base: fa14a21b3dce50ca704e8a0128d99d4440b4571b

O fundo magenta foi removido por preenchimento conectado
às bordas.

Somente pixels que:
1. atendiam ao critério de chroma; e
2. estavam conectados às bordas

foram convertidos em transparência.

O frame ainda precisa de:
- auditoria de componentes;
- limpeza de possíveis resíduos;
- normalização;
- validação técnica;
- aprovação visual;
- importação.
