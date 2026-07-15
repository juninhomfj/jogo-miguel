# Checkpoint — Miguel 10_dust_3

## Estado

- Branch: `recuperacao/fonte-da-verdade`
- Commit-base: `723e90ce46b7ad64a6c7eb5f093851039a54426c`
- Data do checkpoint: `2026-07-14`
- Frame: `10_dust_3.png`
- Situação: trabalho em andamento
- Manifesto: `pendente`

## Arquivos preservados

- `10_dust_3_branco.png`: imagem original gerada.
- `10_dust_3_limpo.png`: resultado após preservação dos oito componentes selecionados.
- `relatorio_componentes.txt`: auditoria dos componentes encontrados.

## Trabalho concluído

- imagem bruta gerada;
- primeira tentativa de remoção do fundo executada;
- 2.213 componentes encontrados;
- C00 a C07 preservados;
- 2.205 componentes descartados;
- bounding box atual: `(239, 418, 1034, 985)`.

## Atenção

O frame ainda não está pronto.

A inspeção visual mostrou fragmentos do quadriculado gravado na imagem e
conectados ao personagem e à poeira. Esses resíduos aparecem principalmente
ao redor do cabelo, braços, pernas e partículas.

Não normalizar, importar ou aprovar este frame antes da limpeza adicional.

## Próxima etapa

1. remover os resíduos claros e escuros do quadriculado conectados ao C00;
2. preservar as cores legítimas do símbolo, olhos e poeira;
3. executar nova auditoria visual;
4. normalizar para 256x256;
5. validar tecnicamente;
6. obter aprovação visual;
7. importar e atualizar o manifesto.

Os frames `08_dust_1.png` e `09_dust_2.png` já estão aprovados.
