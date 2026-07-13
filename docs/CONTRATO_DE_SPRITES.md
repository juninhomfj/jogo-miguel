# Contrato técnico dos sprites — As Aventuras do Miguel

## Decisão

Os novos sprites não serão gerados inicialmente como uma folha única.

Cada frame será criado como um arquivo PNG individual. Somente depois da
validação os arquivos serão agrupados automaticamente em spritesheets.

Isso impede:

- cortes entre células;
- personagens fora do centro;
- efeitos invadindo frames vizinhos;
- células com tamanhos diferentes;
- interpretações incorretas pelo Phaser.

---

# Padrão geral dos frames

Todos os arquivos individuais devem respeitar:

- formato PNG;
- modo RGBA;
- fundo realmente transparente;
- dimensão exata de 256×256 px;
- sem bordas brancas ou pretas;
- sem texto, números, linhas de grade ou rótulos;
- sem partes do desenho fora do canvas;
- sem pixels visíveis nos 8 px externos do canvas;
- pixel art sem suavização;
- personagem inteiro dentro da imagem;
- mesma escala visual em todos os frames;
- pés posicionados na mesma linha-base;
- iluminação e paleta consistentes.

## Área segura

- canvas: 256×256 px;
- área segura horizontal: x=8 até x=247;
- área segura vertical: y=8 até y=247;
- linha-base recomendada para os pés: y=224;
- centro horizontal de referência: x=128.

A ação pode deslocar braços ou efeitos, mas nenhum elemento pode ultrapassar
a área segura.

---

# Miguel

## Aparência fixa

- menino herói de aproximadamente 6 anos;
- proporções infantis;
- cabelo castanho curto;
- sem capacete;
- camiseta ou uniforme vermelho;
- calça e botas azuis;
- luvas azuis;
- símbolo branco inspirado em teia;
- mesmo rosto, cabelo, roupa e proporções em todos os frames.

## Frames obrigatórios

| Arquivo | Índice | Ação |
|---|---:|---|
| `00_idle.png` | 0 | Parado |
| `01_walk_1.png` | 1 | Caminhada, contato inicial |
| `02_walk_2.png` | 2 | Caminhada, passagem |
| `03_walk_3.png` | 3 | Caminhada, contato oposto |
| `04_jump.png` | 4 | Pulo simples |
| `05_double_jump.png` | 5 | Cambalhota do pulo duplo |
| `06_punch.png` | 6 | Soco com braço estendido |
| `07_power_cast.png` | 7 | Mão aberta emitindo energia |
| `08_dust_1.png` | 8 | Poeira, início |
| `09_dust_2.png` | 9 | Poeira, expansão |
| `10_dust_3.png` | 10 | Poeira, dissipação |
| `11_reserved.png` | 11 | Transparente e reservado |

## Observações

Os frames `08`, `09` e `10` devem conter somente o efeito de poeira, sem o
corpo completo do Miguel. Eles serão reproduzidos por um sprite de efeito
separado.

O frame `07_power_cast.png` pode conter um pequeno brilho ligado à mão, mas
não deve conter um projétil grande atravessando o canvas.

O projétil será um asset separado.

## Spritesheet final do Miguel

Após a validação:

- 6 colunas;
- 2 linhas;
- 12 frames;
- cada frame: 256×256 px;
- imagem final: 1536×512 px;
- `frameWidth: 256`;
- `frameHeight: 256`;
- `margin: 0`;
- `spacing: 0`.

---

# Robô patrulheiro

## Aparência fixa

- robô vilão cúbico;
- estrutura metálica;
- rodas ou pernas articuladas;
- antena no topo;
- visor vermelho ou roxo;
- cinza escuro e chumbo;
- mesmo tamanho e proporção em todos os frames.

## Frames obrigatórios

| Arquivo | Índice | Ação |
|---|---:|---|
| `00_idle.png` | 0 | Parado, visor aceso |
| `01_patrol_1.png` | 1 | Patrulha, posição 1 |
| `02_patrol_2.png` | 2 | Patrulha, posição 2 |
| `03_patrol_3.png` | 3 | Patrulha, posição 3 |
| `04_patrol_4.png` | 4 | Patrulha, posição 4 |
| `05_damage.png` | 5 | Dano, faíscas ou visor alterado |
| `06_explosion_1.png` | 6 | Explosão, início |
| `07_explosion_2.png` | 7 | Explosão, expansão |
| `08_explosion_3.png` | 8 | Explosão, dissipação |

## Spritesheet final do robô

Após a validação:

- 3 colunas;
- 3 linhas;
- 9 frames;
- cada frame: 256×256 px;
- imagem final: 768×768 px;
- `frameWidth: 256`;
- `frameHeight: 256`;
- `margin: 0`;
- `spacing: 0`.

---

# Efeitos separados

| Arquivo | Dimensão | Finalidade |
|---|---:|---|
| `power_projectile.png` | 64×64 | Projétil de energia |
| `hit_flash.png` | 64×64 | Impacto do soco ou projétil |

Esses efeitos não devem ser incorporados atravessando frames do personagem.

---

# Critérios de aprovação

Um conjunto somente será aprovado quando:

1. todos os arquivos tiverem as dimensões exatas;
2. nenhum pixel visível tocar os 8 px externos;
3. todos os personagens tiverem escala consistente;
4. os pés utilizarem a mesma linha-base;
5. nenhuma ação estiver dividida entre dois arquivos;
6. não houver conteúdo de um frame dentro de outro;
7. os arquivos forem visualmente inspecionados;
8. o spritesheet final for gerado por script, não manualmente.
