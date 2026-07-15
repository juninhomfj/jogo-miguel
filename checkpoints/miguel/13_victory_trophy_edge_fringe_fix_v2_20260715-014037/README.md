# Limpeza controlada de franjas V2 — 13_victory_trophy

Data: 20260715-014037
Branch: recuperacao/fonte-da-verdade
Commit-base: 02be8e0b09e117b2ce98c460a587f3bccdc60cef

A primeira execução parou no pixel (500, 658) porque o
agrupamento suspeito era maior que o raio local de busca.

A versão V2:

- atravessa pixels selecionados dentro do mesmo componente;
- nunca atravessa transparência;
- busca cores legítimas até 24 pixels de distância;
- utiliza a paleta aprovada como salvaguarda final;
- não altera a camada alfa;
- não altera a silhueta;
- não altera o bounding box.

O candidato anterior foi preservado.
