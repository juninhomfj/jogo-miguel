# Prompts para geração dos frames individuais

## Regra principal

Nunca solicitar um spritesheet completo ao gerador de imagens.

Gerar exatamente uma imagem por vez.

Cada imagem final deve ser:

- PNG;
- 256×256 px;
- fundo realmente transparente;
- apenas uma pose ou um efeito;
- sem linhas de grade;
- sem texto;
- sem números;
- sem moldura;
- sem sombras externas;
- sem elementos cortados;
- com ao menos 8 px transparentes em todas as bordas.

---

# Referências a utilizar

Para todos os frames do Miguel, anexar preferencialmente:

1. `assets/reference/miguel/00_idle_reference.png`;
2. a referência específica da ação;
3. o último frame aprovado da mesma sequência, quando existir.

Para o robô, anexar:

- `assets/reference/robo/robo_original_design_reference.png`;
- o último frame aprovado da sequência.

As imagens antigas servem apenas para preservar identidade e estilo.
Corrigir os defeitos de corte e centralização.

---

# Prompt mestre — Miguel

Use este bloco em todos os frames do Miguel:

> Crie apenas um frame individual de animação em pixel art 8-bits.
>
> Use a imagem anexada como referência obrigatória para manter exatamente
> o mesmo personagem: menino herói de aproximadamente 6 anos, proporções
> infantis, cabelo castanho curto, sem capacete, camiseta ou uniforme
> vermelho com símbolo branco inspirado em teia, luvas azuis, calça azul e
> botas azuis.
>
> Preserve o mesmo rosto, penteado, cores, roupa, tamanho da cabeça,
> proporções corporais e estilo visual.
>
> A imagem final deve ter exatamente 256×256 pixels, formato PNG e fundo
> totalmente transparente.
>
> Mostre somente uma pose completa. Não crie spritesheet, grade, sequência,
> texto, números, moldura ou cenário.
>
> Mantenha pelo menos 8 pixels totalmente transparentes em todas as bordas.
> Nenhuma parte do personagem ou efeito pode tocar ou ultrapassar as bordas.
>
> Posicione o centro visual do personagem próximo ao centro horizontal do
> canvas. Para poses no chão, alinhe os pés aproximadamente na coordenada
> vertical 224.
>
> Use pixel art nítida, sem suavização e sem antialiasing.

---

# Frames do Miguel

## 00 — Parado

Salvar como:

`assets/frames/miguel/00_idle.png`

Complemento do prompt:

> Miguel está parado em posição neutra de herói, olhando para a direita,
> com os dois pés apoiados no chão e os braços relaxados em posição de
> prontidão. Corpo inteiro visível e centralizado.

## 01 — Caminhada 1

Salvar como:

`assets/frames/miguel/01_walk_1.png`

Complemento:

> Primeiro quadro de uma animação de caminhada para a direita. Perna
> direita avançada, perna esquerda atrás, braço esquerdo à frente e braço
> direito atrás. Movimento infantil e natural. Corpo inteiro visível.

## 02 — Caminhada 2

Salvar como:

`assets/frames/miguel/02_walk_2.png`

Complemento:

> Segundo quadro da caminhada para a direita. Pose de passagem, corpo
> levemente elevado, pernas próximas ao centro e braços cruzando a posição
> neutra. Deve conectar visualmente os quadros 01 e 03.

## 03 — Caminhada 3

Salvar como:

`assets/frames/miguel/03_walk_3.png`

Complemento:

> Terceiro quadro da caminhada para a direita. Perna esquerda avançada,
> perna direita atrás, braço direito à frente e braço esquerdo atrás.
> Movimento oposto ao quadro 01.

## 04 — Pulo simples

Salvar como:

`assets/frames/miguel/04_jump.png`

Complemento:

> Miguel está no ar executando um pulo simples para a direita, com joelhos
> levemente dobrados e braços auxiliando o impulso. Corpo inteiro visível,
> sem chão, sem poeira e sem cenário.

## 05 — Pulo duplo

Salvar como:

`assets/frames/miguel/05_double_jump.png`

Complemento:

> Miguel está no ar durante uma cambalhota frontal de pulo duplo. O corpo
> deve formar uma pose circular legível, ainda reconhecível como o mesmo
> personagem. Não adicionar poeira nem projétil.

## 06 — Soco

Salvar como:

`assets/frames/miguel/06_punch.png`

Complemento:

> Miguel executa um soco horizontal para a direita. Braço direito
> totalmente estendido, outro braço protegendo o corpo, pernas firmes em
> posição de combate. Não adicionar energia, poeira ou inimigo.

## 07 — Conjuração de poder

Salvar como:

`assets/frames/miguel/07_power_cast.png`

Complemento:

> Miguel está com uma mão aberta apontada para a direita, preparando ou
> disparando um poder. Adicione apenas um brilho azul pequeno junto à palma
> da mão. Não desenhe um projétil grande e não deixe o brilho tocar a borda.

## 08 — Poeira 1

Salvar como:

`assets/frames/miguel/08_dust_1.png`

Prompt específico:

> Crie apenas um pequeno efeito de poeira em pixel art 8-bits, sem
> personagem. O efeito representa o primeiro instante do impacto dos pés no
> chão: duas pequenas nuvens bege próximas ao centro inferior. PNG
> 256×256, fundo transparente e pelo menos 8 pixels livres nas bordas.

## 09 — Poeira 2

Salvar como:

`assets/frames/miguel/09_dust_2.png`

Prompt específico:

> Crie apenas o segundo quadro do efeito de poeira, sem personagem. As
> nuvens bege estão maiores e se expandem horizontalmente a partir do
> centro inferior, com pequenas partículas. PNG 256×256 e fundo
> transparente. Não tocar as bordas.

## 10 — Poeira 3

Salvar como:

`assets/frames/miguel/10_dust_3.png`

Prompt específico:

> Crie apenas o terceiro quadro do efeito de poeira, sem personagem. A
> poeira está dissipando, com pequenas partículas espaçadas e baixa
> densidade perto do centro inferior. PNG 256×256 e fundo transparente.

## 11 — Reservado

Esse arquivo será criado automaticamente como imagem totalmente
transparente. Não precisa ser gerado por IA.

---

# Prompt mestre — Robô

> Crie apenas um frame individual de animação em pixel art 8-bits.
>
> Use a imagem anexada como referência de identidade visual. O personagem é
> um robô vilão cúbico de metal cinza escuro e chumbo, com antena no topo,
> visor eletrônico vermelho ou roxo, rodas ou pernas mecânicas articuladas
> e pequenos detalhes neon.
>
> Preserve exatamente o mesmo formato do corpo, antena, visor, paleta,
> proporções e escala em todos os frames.
>
> A imagem final deve ter exatamente 256×256 pixels, formato PNG e fundo
> totalmente transparente.
>
> Gere somente uma pose. Não crie spritesheet, grade, texto, números,
> moldura ou cenário.
>
> Mantenha ao menos 8 pixels transparentes em todas as bordas.
>
> Para frames sem explosão, alinhe a base do robô aproximadamente na
> coordenada vertical 224.
>
> Use pixel art nítida, sem suavização e sem antialiasing.

---

# Frames do robô

## 00 — Parado

`assets/frames/robo/00_idle.png`

> Robô parado, voltado para a direita, visor eletrônico aceso e postura
> neutra. Corpo inteiro visível.

## 01 — Patrulha 1

`assets/frames/robo/01_patrol_1.png`

> Primeiro quadro da patrulha. Roda ou perna dianteira avançando e corpo
> ligeiramente inclinado para a direita.

## 02 — Patrulha 2

`assets/frames/robo/02_patrol_2.png`

> Segundo quadro da patrulha. Corpo em posição intermediária e suspensão
> mecânica levemente comprimida.

## 03 — Patrulha 3

`assets/frames/robo/03_patrol_3.png`

> Terceiro quadro da patrulha. Movimento oposto ao primeiro quadro, com a
> outra roda ou perna avançada.

## 04 — Patrulha 4

`assets/frames/robo/04_patrol_4.png`

> Quarto quadro da patrulha. Corpo em posição intermediária, conectando o
> terceiro quadro de volta ao primeiro.

## 05 — Dano

`assets/frames/robo/05_damage.png`

> Robô recebendo dano. Visor alterado, corpo piscando em vermelho e poucas
> faíscas pequenas. O corpo ainda deve permanecer inteiro.

## 06 — Explosão 1

`assets/frames/robo/06_explosion_1.png`

> Primeiro quadro da explosão. Carcaça começando a se romper, pequeno brilho
> laranja no centro e poucas peças metálicas se soltando.

## 07 — Explosão 2

`assets/frames/robo/07_explosion_2.png`

> Segundo quadro da explosão. Explosão maior no centro e peças metálicas se
> afastando, mantendo tudo dentro da área segura.

## 08 — Explosão 3

`assets/frames/robo/08_explosion_3.png`

> Terceiro quadro da explosão. Restam pequenas peças, partículas e um brilho
> dissipando. Não mostrar o robô inteiro.

---

# Ordem de geração recomendada

1. Miguel parado;
2. três frames de caminhada;
3. pulo simples;
4. pulo duplo;
5. soco;
6. conjuração de poder;
7. três frames de poeira;
8. robô parado;
9. quatro frames de patrulha;
10. dano;
11. três frames de explosão.

Aprovar visualmente cada imagem antes de gerar a próxima.


## Miguel — 12_hurt.png

Crie um frame individual em pixel art 8-bits estrito, fundo transparente,
do personagem Miguel levando dano.

Requisitos:
- usar como base o mesmo personagem Miguel já aprovado;
- menino herói de aproximadamente 6 anos;
- cabelo castanho curto;
- camiseta vermelha com símbolo branco;
- luvas azuis;
- calça azul;
- botas azuis;
- preservar a identidade visual, escala, proporções e espessura de contorno.

Pose:
- reação de dano / impacto;
- corpo levemente inclinado;
- expressão de dor ou susto;
- braços reagindo ao impacto;
- leitura clara de que levou um golpe;
- sem exagerar efeitos externos;
- manter composição adequada para frame individual 256x256.



## Miguel — 13_victory_trophy.png

Crie um frame individual em pixel art 8-bits estrito, fundo transparente,
do personagem Miguel em pose de vitória segurando um troféu pequeno.

Requisitos:
- usar como base o mesmo personagem Miguel já aprovado;
- menino herói de aproximadamente 6 anos;
- cabelo castanho curto;
- camiseta vermelha com símbolo branco;
- luvas azuis;
- calça azul;
- botas azuis;
- preservar identidade visual, escala, proporções e espessura de contorno.

Pose:
- pose alegre de vitória;
- troféu pequeno visível em uma das mãos;
- expressão feliz/orgulhosa;
- postura infantil e heroica;
- sem fundo;
- composição adequada para frame individual 256x256.

