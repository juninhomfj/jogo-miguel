# Limpeza final — 10_dust_3

Data: 20260714-222211
Branch: recuperacao/fonte-da-verdade
Commit-base: de0c1b39fbd203b06028e429e513752591ccbb78

## Procedimento

- C00 a C11 foram preservados;
- o componente C12, com apenas 2 pixels, foi descartado;
- os 18 pixels residuais classificados como chroma magenta
  foram removidos;
- nenhuma normalização foi realizada nesta etapa.

## Próxima etapa

- inspeção visual;
- normalização para 256x256;
- validação técnica;
- aprovação visual;
- importação e atualização do manifesto.
