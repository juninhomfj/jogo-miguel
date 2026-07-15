# Diagnóstico da integração dos frames do Miguel

Data do teste visual: 2026-07-15

## Estado protegido

Branch:

`recuperacao/fonte-da-verdade`

Candidato testado:

`integration-preview/miguel-frames-candidate.html`

Commit que contém o candidato:

`26cf1e0 feat: add full game candidate with approved miguel frames`

Checkpoint da coleção de frames:

`checkpoint-miguel-frames-completos-2026-07-15`

O `index.html` ativo não foi substituído pelo candidato.

## Resultado técnico HTTP

O teste HTTP foi aprovado porque todos os arquivos responderam
sem erros de carregamento HTTP.

Foram encontrados:

- 14 frames individuais do Miguel;
- HTML candidato;
- spritesheet provisório do robô;
- Phaser 3.60 disponível pelo CDN;
- zero falhas HTTP.

Esse resultado não representa aprovação visual ou funcional.

## Resultado visual e funcional

Status:

**REPROVADO**

Problemas observados no navegador:

1. A tela continua com enquadramento inadequado ou aparência cortada.
2. Os controles inferiores não aparecem corretamente.
3. Os cristais aparecem como quadrados pretos com contorno e diagonal
   verde, indicando textura ausente ou inválida no Phaser.
4. O Miguel aparece pequeno em relação ao cenário.
5. O alinhamento do sprite com o chão está incorreto.
6. As pernas parecem cortadas ou escondidas.
7. A caminhada não apresenta troca visível entre os três frames.
8. O cenário ainda utiliza formas geométricas provisórias.
9. O candidato não está pronto para substituir o `index.html`.
10. Os frames `hurt` e `power_cast` ainda não estão ligados à jogabilidade.

## Hipóteses que precisam ser verificadas

Não considerar estas hipóteses como correções confirmadas:

- geração de `cristalTecnologico` no ciclo de vida incorreto;
- textura gerada no `preload` da cena de menu não disponível na `Fase1`;
- escala visual do Miguel incompatível com o canvas de 800x600;
- corpo físico e offset inadequados para os PNGs de 256x256;
- posição do chão incompatível com a âncora visual y=224;
- controles touch posicionados muito próximos do limite inferior;
- animação `walk` sendo interrompida ou não avançando;
- necessidade de separar o visual do personagem do corpo físico;
- necessidade de usar uma escala responsiva e uma área segura de HUD.

## Próxima sessão

A próxima etapa não deve promover o candidato.

Ordem de trabalho recomendada:

1. abrir o console do navegador e registrar erros;
2. confirmar a existência das 14 texturas do Miguel;
3. confirmar `textures.exists('cristalTecnologico')`;
4. corrigir primeiro a textura dos cristais;
5. criar uma cena isolada de teste dos frames do Miguel;
6. testar `walk` sem física, inimigos ou controles;
7. definir escala visual correta para o personagem;
8. ajustar corpo físico e alinhamento com o chão;
9. corrigir escala do canvas e área segura dos controles;
10. testar pulo, ataque, poeira e vitória separadamente;
11. somente depois reintegrar à fase completa;
12. substituir o `index.html` apenas após aprovação visual.

## Restrições

- não alterar os 14 PNGs aprovados;
- não remover os checkpoints existentes;
- não promover o candidato atual;
- não substituir o `index.html` simplificado sem validação;
- não considerar o teste HTTP como teste funcional;
- preservar o commit `26cf1e0` para comparação.
