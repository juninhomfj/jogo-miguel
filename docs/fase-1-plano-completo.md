# Fase 1 — A Cidade sem Energia

## Visão geral

A primeira fase pós-tutorial transforma os comandos aprendidos em uma aventura completa de plataforma e combate. Miguel atravessa uma cidade tecnológica sem energia, reativa dois checkpoints, supera cinco setores e derrota o Núcleo Guardião.

- Resolução lógica: 800 × 600.
- Mundo horizontal: 5.400 × 680.
- Duração-alvo: 7 a 12 minutos.
- Checkpoints: 2.
- Cristais: 16.
- Corações: 3.
- Vida por coração: 100.
- Chefão: 12 pontos de vida e 3 fases de comportamento.

## Fluxo do início ao fim

1. **Introdução**
   - Cartela curta apresenta o problema da cidade.
   - Controle fica bloqueado por 1,5 segundo.
   - Música da fase começa após a primeira interação do jogador.

2. **Setor 1 — Portão da Cidade**
   - Reforça movimento, pulo e golpe em situação real.
   - Obstáculos: espinhos, primeiro vão e plataformas baixas.
   - Mini-vilão: sentinela terrestre.
   - Recompensa: cristais em linha de leitura simples.

3. **Setor 2 — Fábrica Abandonada**
   - Introduz plataformas móveis e laser intermitente.
   - Mini-vilões: sentinela e drone.
   - Primeiro checkpoint ao final do setor.
   - Uma cápsula de energia restaura 30 de vida.

4. **Setor 3 — Túneis de Energia**
   - Plataforma vertical moderada.
   - Obstáculos: laser, espinhos e segundo vão.
   - Mini-vilões: torre de tiro e sentinela reforçada.
   - Segundo checkpoint próximo ao fim.

5. **Setor 4 — Ponte das Engrenagens**
   - Combina plataforma móvel horizontal, laser e combate.
   - Mini-vilões: drone, torre e sentinela de elite.
   - A sentinela de elite possui 5 de vida, dano maior e disparo.

6. **Setor 5 — Núcleo do Guardião**
   - O portão fecha ao entrar na arena.
   - Barra de vida do chefão aparece no topo.
   - A música troca para o tema de chefe.
   - Ao derrotar o Núcleo Guardião, a arena é liberada e a fase termina.

7. **Resultado**
   - Exibe pontuação da fase, pontuação total, tempo, cristais, inimigos e bônus.
   - Permite jogar novamente ou voltar ao menu.

## Obstáculos

### Espinhos

- Dano: 22.
- Aplicam recuo vertical.
- Colocados antes e depois de saltos importantes.

### Lasers intermitentes

- Dano: 18.
- Alternam ligados e desligados a cada 1,7 segundo.
- Usam atrasos diferentes para impedir que todos pisquem juntos.

### Vãos

- Queda causa perda imediata do coração atual.
- O respawn ocorre no checkpoint mais recente.

### Plataformas móveis

- Quatro plataformas.
- Duas verticais e duas horizontais.
- Velocidades e amplitudes diferentes.

## Mini-vilões

### Sentinela

- Vida: 2.
- Dano de contato: 14.
- Patrulha uma região limitada.
- Persegue Miguel quando ele entra no raio de detecção.
- Pontuação: 120.

### Sentinela reforçada

- Vida: 3.
- Usa a mesma base visual com resistência maior.
- Pontuação: 120.

### Drone

- Vida: 2.
- Movimento aéreo oscilante.
- Dispara quando Miguel entra em 420 pixels.
- Dano do projétil: 12.
- Pontuação: 150.

### Torre

- Vida: 3.
- Fica imóvel.
- Dispara a cada 1,5 segundo quando Miguel entra em 470 pixels.
- Dano do projétil: 15.
- Pontuação: 180.

### Sentinela de elite

- Vida: 5.
- Dano de contato: 20.
- Velocidade superior.
- Dispara a cada 1,45 segundo.
- Pontuação: 400.

## Chefão — Núcleo Guardião

### Vida e arena

- Vida máxima: 12.
- Dano de contato: 25.
- Portão fecha na entrada da arena.
- Barra com 16 blocos representa a vida restante.

### Fase 1 do chefe — 12 a 9 de vida

- Movimento: 75 pixels por segundo.
- Ataque: um projétil direcionado.
- Intervalo: aproximadamente 1,45 segundo.

### Fase 2 do chefe — 8 a 5 de vida

- Movimento: 105 pixels por segundo.
- Ataque: três projéteis em leque.
- A cada três ciclos, executa uma investida.

### Fase 3 do chefe — 4 a 1 de vida

- Movimento: 135 pixels por segundo.
- Ataque: cinco projéteis em leque.
- Investida mais rápida.
- Invoca drones auxiliares em ciclos alternados.

### Derrota

- Para o movimento e desativa o corpo físico.
- Limpa os projéteis da arena.
- Executa animação de explosão.
- Adiciona 1.200 pontos.
- Calcula bônus e abre a tela de resultado.

## Pontuação

| Evento | Pontos |
|---|---:|
| Cristal | 25 |
| Cápsula de energia | 75 |
| Checkpoint | 100 |
| Sentinela | 120 |
| Drone | 150 |
| Torre | 180 |
| Sentinela de elite | 400 |
| Chefão | 1.200 |
| Todos os cristais | 400 |
| Completar sem dano | 500 |

### Bônus de tempo

`máximo(0, 1500 - segundos × 8)`

### Bônus de vida

`vida restante × 2 + corações restantes × 150`

### Penalidade

- Perder um coração: menos 100 pontos.
- A pontuação nunca fica negativa.

## Vida, dano e respawn

- Miguel começa com 100 de vida e 3 corações.
- Invulnerabilidade após dano: 1.050 ms.
- Ao perder um coração, retorna ao checkpoint mais recente com vida cheia.
- Ao perder todos os corações, a fase reinicia e restaura a pontuação do início da fase.
- Cápsulas de energia restauram até 30 pontos de vida.

## Animações

### Miguel

- Parado.
- Caminhada.
- Pulo.
- Pulo duplo com giro apenas durante a subida.
- Queda vertical.
- Agachamento com linha dos pés preservada.
- Golpe.
- Dano.
- Vitória.

### Robôs

- Patrulha.
- Dano.
- Explosão.
- Chefão usa os mesmos frames em escala maior.

### Inimigos gerados por código

- Drone com movimento oscilante e olho vermelho.
- Torre com corpo metálico e disparo.
- Projéteis comuns e projéteis do chefe possuem tamanhos e cores diferentes.

## Sons

A primeira versão usa áudio procedural 8-bit, sem depender de arquivos externos.

### Música

- Tema da fase: arpejo tecnológico moderado.
- Tema do chefe: notas graves e tensão maior.
- Tema de vitória: sequência ascendente.

### Efeitos

- Pulo.
- Pulo duplo.
- Golpe.
- Cristal.
- Cura.
- Dano em Miguel.
- Dano em inimigo.
- Inimigo derrotado.
- Checkpoint.
- Disparo.
- Alerta do chefe.
- Dano no chefe.
- Derrota do chefe.
- Pausa.
- Vitória.

### Regras de áudio

- Respeita as configurações de música, efeitos e volume.
- Só inicia após uma interação aceita pelo navegador.
- Música é interrompida ao sair da cena.
- Tema é trocado ao entrar na arena do chefe.

## Estrutura técnica

- `js/phase-config.js`: catálogo de fases, setores, objetivos e valores.
- `js/phase1.js`: cena completa, resultado, inimigos, obstáculos, pontuação e chefão.
- `js/audio-manager.js`: música e efeitos procedurais.
- `js/robot-attack.js`: comportamento do robô do tutorial.
- `js/input-manager.js`: teclado, toque e gamepad.
- `js/hud-manager.js`: pontuação, vida, objetivos e mensagens.
- `js/health-manager.js`: vida, corações, invulnerabilidade e respawn.
- `scripts/validate-project.mjs`: validação estrutural e sintática.
- `.github/workflows/validate.yml`: execução automática dos testes.

## Critérios de aceite

- O tutorial continua abrindo e concluindo normalmente.
- O botão de aventura abre a Fase 1 completa, não a tela provisória.
- Miguel atravessa os cinco setores usando teclado, toque ou gamepad.
- Os dois checkpoints alteram corretamente o ponto de respawn.
- Espinhos, lasers, quedas, inimigos e projéteis causam dano.
- Cristais e inimigos atualizam a pontuação.
- Música e efeitos respeitam as configurações.
- O chefão muda de comportamento conforme perde vida.
- A fase só termina depois da derrota do chefão.
- A tela de resultado apresenta todos os bônus.
- Todos os arquivos JavaScript passam por `node --check`.
