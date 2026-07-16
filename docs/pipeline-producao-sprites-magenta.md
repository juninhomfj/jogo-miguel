# Pipeline de produção de sprites em magenta

## Objetivo

Criar coleções completas antes de iniciar correções detalhadas.

O método anterior, finalizando um frame e depois iniciando o seguinte, gerou diferenças de escala, pose, contorno e identidade. O novo processo trabalha por lote.

## O que significa magenta

Durante a pré-produção:

- personagem ou veículo monocromático em magenta;
- fundo realmente transparente;
- pixel art 8-bits estrito;
- sem antialiasing;
- sem suavização;
- mesma escala;
- mesmo canvas;
- mesmo ponto de apoio;
- mesma espessura lógica de contorno.

O magenta facilita a análise de silhueta, volume, proporção, leitura da pose, continuidade, alinhamento e contato com o chão. Ele não representa a paleta final.

## Etapa 0 — Manifesto

Antes de gerar qualquer imagem, criar um manifesto contendo:

- personagem;
- versão;
- tamanho do canvas;
- orientação;
- escala;
- ponto de apoio;
- lista completa de frames;
- nome de cada frame;
- objetivo da animação;
- quantidade prevista;
- referência visual oficial;
- estado: planejado, rascunho, corrigindo ou aprovado.

Sem manifesto, a geração não começa.

## Etapa 1 — Ficha visual

Definir:

- frente;
- perfil;
- costas quando necessário;
- altura;
- largura;
- proporção cabeça e corpo;
- mãos;
- pés;
- cabelo;
- roupa;
- acessórios;
- veículo;
- espessura de contorno;
- margem transparente;
- paleta futura.

A ficha visual é a fonte de verdade da coleção.

## Etapa 2 — Gerar o lote completo

Todos os frames planejados devem ser criados em magenta antes da primeira rodada de acabamento.

Pacote básico sugerido:

- parado;
- caminhada 1;
- caminhada 2;
- caminhada 3;
- corrida;
- pulo;
- pulo duplo;
- agachamento;
- ataque;
- poder;
- aterrissagem;
- dano;
- derrota;
- vitória.

Frames extras dependem do personagem.

## Etapa 3 — Folha de inspeção

Montar uma spritesheet ou contact sheet contendo:

- grade numerada;
- nome de cada frame;
- linha de base;
- caixa de referência;
- centro do personagem;
- visualização ampliada sem suavização.

Nenhuma correção isolada deve ocorrer sem verificar o conjunto.

## Etapa 4 — Rodadas de correção

### Rodada A — Identidade

Corrigir em todos os frames:

- rosto;
- cabelo;
- cabeça;
- roupa;
- acessórios;
- proporções.

### Rodada B — Escala e alinhamento

Corrigir:

- altura;
- largura;
- base dos pés;
- centro;
- margens;
- tamanho relativo ao cenário.

### Rodada C — Movimento

Corrigir:

- continuidade;
- peso;
- direção;
- leitura da ação;
- antecipação;
- impacto;
- recuperação.

### Rodada D — Contorno

Aplicar contorno consistente em todo o lote.

### Rodada E — Paleta

Substituir o magenta pelas cores oficiais.

### Rodada F — Limpeza técnica

Confirmar:

- transparência real;
- ausência de pixels magenta;
- ausência de antialiasing;
- canvas correto;
- nomes corretos;
- nenhum frame cortado;
- nenhum elemento tocando as bordas.

## Etapa 5 — Aprovação

Aprovar primeiro a folha completa.

Depois da aprovação:

1. separar os frames;
2. gerar hashes;
3. criar checkpoint;
4. integrar no laboratório;
5. testar animações;
6. integrar no jogo;
7. publicar somente depois do teste.

## Estrutura de arquivos

Rascunhos:

```text
assets/drafts/magenta/miguel_base/v001/
  manifest.json
  contact-sheet.png
  01_idle.png
  02_walk_1.png
  03_walk_2.png
  04_walk_3.png
```

Versão final:

```text
assets/frames/miguel/
  miguel_idle.png
  miguel_walk_1.png
  miguel_walk_2.png
  miguel_walk_3.png
```

Rascunhos magenta não devem substituir arquivos aprovados.

## Pacotes de veículos

### Bicicleta

- parado montado;
- início da pedalada;
- pedalada completa;
- velocidade;
- frenagem;
- salto;
- aterrissagem;
- colisão;
- dano;
- queda;
- vitória;
- entrada e saída.

### Hoverboard

- parado flutuando;
- aceleração;
- deslocamento;
- frenagem;
- salto;
- aterrissagem;
- desequilíbrio;
- dano;
- queda;
- vitória.

### Patins

- parado;
- impulso esquerdo;
- impulso direito;
- deslize;
- frenagem;
- curva;
- salto;
- aterrissagem;
- tropeço;
- dano;
- vitória.

### Patinete

- parado;
- impulso;
- pé de apoio;
- deslocamento;
- frenagem;
- curva;
- salto;
- aterrissagem;
- colisão;
- queda;
- vitória.

## Miniaturas da loja

Cada item precisa de:

- miniatura isolada;
- Miguel usando o item;
- estado bloqueado;
- estado disponível;
- estado adquirido;
- estado equipado.

## Robô

O robô seguirá o mesmo processo, mas em duas etapas:

1. corrigir comportamento, colisão e estados;
2. criar todo o pacote visual em magenta.

Pacote mínimo:

- parado;
- patrulha;
- alerta;
- ataque;
- dano;
- derrota;
- explosão;
- peças finais.

## Critério de sucesso

O novo processo será considerado melhor quando todos os frames existirem antes do acabamento, as correções forem feitas por rodada, a identidade permanecer consistente, houver menos regenerações completas, a integração usar somente lotes aprovados e nenhum PNG aprovado for sobrescrito acidentalmente.
