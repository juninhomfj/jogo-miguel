# Instruções operacionais — Jogo Miguel

Este documento orienta futuras sessões de desenvolvimento, assistentes, agentes e colaboradores do projeto.

## Estado protegido em 16/07/2026

### Produção

- branch: `main`;
- commit: `100d4853d32b907ef40a09b40a0b70a66b0cf58e`;
- build: `crouch-physics-stable-20260716-005908`;
- tag: `pausa-sprint-agachamento-main-20260716-010918`.

### Trabalho

- branch: `regressao/crouch-step-by-step`;
- commit: `62cd3cb8382a7607c63c8dcb4dfae2cfdeb15253`;
- tag: `pausa-sprint-agachamento-trabalho-20260716-010918`.

O nome da branch de regressão é histórico. O projeto voltou a avançar a partir de um checkpoint seguro.

## Estado do agachamento

A correção física foi publicada, mas ainda precisa de teste real no iPhone. Antes de considerar concluído, confirmar que Miguel não pisca, não atravessa o chão, permanece estável, levanta com movimento lateral, pode agachar novamente após recentralizar e continua pulando, atacando e recebendo dano normalmente.

A orientação artística ainda está pendente. O frame atual pode parecer Miguel deitado de costas segurando os joelhos.

## Regras de engenharia

1. Inspecionar o código exato antes de criar patches.
2. Alterar apenas um comportamento por etapa.
3. Não misturar física, visual, controles e persistência.
4. Usar um commit por objetivo.
5. Evitar substituições genéricas em trechos repetidos.
6. Confirmar quantas ocorrências serão substituídas.
7. Restaurar automaticamente arquivos quando um patch falhar.
8. Executar `node --check` nos JavaScripts alterados.
9. Executar `git diff --check`.
10. Conferir a lista exata de arquivos modificados.
11. Registrar hashes dos PNGs nas integrações visuais.
12. Criar backup de `main` antes de cada publicação.
13. Publicar commits aprovados por `cherry-pick`.
14. Retornar à branch de trabalho depois da publicação.
15. Não declarar sucesso sem a saída real do terminal.

## Proteção dos assets aprovados

Os PNGs aprovados em `assets/frames/miguel/` não devem ser alterados durante sprints de programação. Alterações de arte exigem sprint própria, manifesto de frames, pasta de rascunhos, folha de inspeção, revisão visual, hashes antes e depois e checkpoint de integração.

## Processo para novos personagens

Não finalizar um frame por vez.

1. Definir o manifesto completo de animações.
2. Criar todos os frames da coleção em magenta.
3. Montar uma folha de inspeção.
4. Revisar silhueta, escala e proporções do conjunto.
5. Corrigir o lote completo por rodadas.
6. Aplicar contornos.
7. Aplicar a paleta final.
8. Remover todo o magenta.
9. Exportar PNGs transparentes.
10. Integrar somente o lote aprovado.

O magenta é um estágio de pré-produção. Nenhum frame magenta deve entrar na versão pública.

## Rodadas de correção dos sprites

### Identidade

- rosto;
- cabelo;
- cabeça;
- roupas;
- acessórios;
- proporções.

### Escala e alinhamento

- altura;
- largura;
- centro;
- base dos pés;
- margens transparentes.

### Movimento

- continuidade;
- leitura da pose;
- direção;
- antecipação;
- impacto;
- recuperação.

### Acabamento

- contorno;
- paleta;
- transparência;
- nomes;
- exportação;
- hashes.

## Veículos planejados

- bicicleta;
- hoverboard;
- patins;
- patinete.

Cada veículo deve ter manifesto próprio, miniatura para a loja, Miguel usando o veículo, entrada, saída, movimento, frenagem, salto ou obstáculo, dano, queda e vitória.

## Loja e economia

A primeira versão da loja deve usar somente moedas ou cristais conquistados dentro do jogo. Não implementar pagamento com dinheiro real na primeira versão.

A persistência deverá guardar progresso das fases, moedas, cristais, veículos adquiridos, veículo equipado, recordes, configurações e tutorial concluído.

## Recordes e ranking

Criar primeiro os recordes locais. O ranking online somente poderá ser criado depois de existir backend, identificador de jogador, apelido público seguro, validação da pontuação, proteção contra fraude e política de privacidade.

Não armazenar nome completo, fotografia, data de nascimento ou outros dados pessoais de crianças.

## Ordem de retomada

1. Testar a física atual no iPhone.
2. Corrigir somente a pose visual do agachamento.
3. Adicionar reinício mobile.
4. Adicionar Wake Lock.
5. Criar persistência local versionada.
6. Corrigir o robô.
7. Estruturar as fases reais.
8. Iniciar o pipeline de arte em magenta.
9. Criar novos personagens.
10. Implementar veículos.
11. Criar loja e economia.
12. Criar recordes locais.
13. Avaliar ranking compartilhável.

## Definição de pronto

Uma etapa está pronta somente quando possui código ou arte revisada, teste automatizado quando aplicável, teste real no dispositivo quando aplicável, arquivos alterados conferidos, commit identificado, checkpoint remoto, publicação confirmada e documentação atualizada.
