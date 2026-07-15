# Fluxo de aprovação dos frames

Todos os novos sprites devem passar por validação técnica e visual.

## Processo

1. Salvar o frame gerado em incoming/sprites/.
2. Executar tools/assets/run_frame_validator.sh.
3. Corrigir a imagem caso o resultado seja REPROVADO.
4. Importar usando tools/assets/import_frame.sh.
5. Inspecionar visualmente antes do commit.
6. Alterar o manifesto para aprovado.

## Validar Miguel

./tools/assets/run_frame_validator.sh incoming/sprites/00_idle.png character

## Importar Miguel

./tools/assets/import_frame.sh incoming/sprites/00_idle.png miguel 00_idle.png

## Status permitidos

- pendente
- validado_tecnico
- aprovado
- reprovado

Nunca versionar um spritesheet gerado diretamente por IA.
