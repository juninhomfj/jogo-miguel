# Pulo duplo com cambalhota dinâmica

Data: 20260715-152323
Branch: recuperacao/fonte-da-verdade
Commit-base: e4053e98458563c4bb56669cac3565885441653e

## Alteração

O laboratório agora usa uma camada visual separada
durante o segundo salto.

Características:

- impulso vertical de -500;
- duração de 520 ms;
- rotação de 540 graus;
- giro invertido ao olhar para a esquerda;
- compressão e expansão visual;
- oito rastros translúcidos;
- movimento horizontal preservado;
- corpo físico permanece reto;
- giro cancelado ao aterrissar ou mudar de estado.

## Integridade

- os 14 PNGs não foram alterados;
- index.html não foi alterado;
- mudança restrita ao laboratório;
- JavaScript aprovado pelo node --check.

## Teste manual

No laboratório:

1. pressione W ou seta para cima;
2. durante o primeiro salto, pressione novamente;
3. use A/D ou setas durante a cambalhota;
4. pressione R para reiniciar.

Console:

window.__MIGUEL_DEBUG__.playDoubleJump()
window.__MIGUEL_DEBUG__.snapshot()
