# Produção do vídeo (parte B)

Pré-requisito: `reels.json` com o reel escolhido, storyboard do Design e identidade do projeto (`visual.json`, `design.md`).
Pasta de trabalho: `<saida>/reels/<id>/` (brief, projeto, áudio, out).
Windows: o ffmpeg pode não estar no PATH (WinGet); estenda o PATH para a pasta `bin` do pacote FFmpeg. Use `python` (não `python3`).

## Escolha do caminho
| Caminho | Quando | Resultado |
|---|---|---|
| A. Animação com /claude-video | motion graphic, texto animado, mockup do produto, história com bonecos | MP4 9:16 |
| B. Animação com Remotion | mais controle, 3D, cenas longas com várias sincronias, vários vídeos no mesmo padrão | MP4 9:16 |
| C. Kit de gravação | o reel é filmado no celular (rosto, balcão, bastidor) | checklist + falas + takes |
| D. Locução e áudio | já existe o vídeo mudo e falta voz, trilha e efeitos | MP4 com som |
Pode combinar: A ou B + D.

## Caminho A · /claude-video
1. Monte o **BRIEF** a partir do reel: tamanho 1080 x 1920, duração, 30 fps, sem loop (a menos que o formato peça), **palavras exatas** (os `texto_tela` das cenas), cores em hex e fontes de `visual.json`, logo do projeto, sem mídia real (só desenho) ou com os clipes que a pessoa passar.
2. Escolha o estilo conforme o formato do reel (e diga o porquê em uma linha):
   - dor/humor/história de atendimento → `sessao-na-mesa` (aquarela com bonecos) ou `rabisco-de-caneta`;
   - demo do produto, interface → `interface-escura-3d`, `app-de-motion` ou `diagrama-azul-marinho`;
   - dica em 3 passos, mito x verdade → `cartaz-gritado`, `poster-suico` ou `grafico-de-jornal`;
   - oferta/convite curto → `cartaz-gritado` ou `showreel`.
3. Invoque a skill `claude-video` (Skill tool) com essas respostas já dadas, para ela pular a etapa de perguntas. Siga o fluxo dela: perícia → storyboard → **cards aprovados pela pessoa** → 3 frames → render → checagens.
4. Para a história com personagens: roteiro por cena com tempos, personagens simples (blocos com olhos e boca), cenário pintado uma vez, ação contínua; transições curtas; caption curta por cena; fecho com logo + CTA ≥ 3 s legível.

## Caminho B · Remotion
1. Projeto novo (skill `remotion-create` / `remotion-best-practices`): 1080 x 1920, 30 fps, React + `@remotion/google-fonts` com as fontes do projeto.
2. Tudo que se edita em `src/config.ts` (textos, cores, números, flags, tabela de SFX, cenas `[início, duração]`). Uma `<Sequence>` por cena; componentes reutilizáveis (fundo, texto cinético, mockup do produto, contador, QR/ícones); `spring`/`interpolate` para a entrada de cada elemento; 3D só se agregar (`@remotion/three`, `--gl=angle`, `--image-format=png`).
3. Padrões que evitam retrabalho: palavras sempre com espaço (gap de 0,34 × tamanho), título longo em até 3 linhas, preço com `white-space: nowrap`, texto fora das zonas seguras, `Sequence` para zerar a contagem de frames de cada cena.
4. Frames de aprovação (`remotion still`) de uma cena por tipo → mostrar à pessoa → render `--codec=h264 --crf=18 --pixel-format=yuv420p`.

## Caminho C · Kit de gravação
Entregue `kit-gravacao.md` por reel: lista de takes (plano, duração, o que mostrar), fala palavra por palavra, texto de tela por take, enquadramento (vertical, olho no nível da câmera, fundo limpo), luz (janela ou luz frontal), áudio (microfone de lapela ou local silencioso), ordem de gravação mais eficiente, tempo estimado e checklist de edição (cortes a cada 2 a 3 s, legendas, trilha em baixo volume, CTA).

## Caminho D · Locução, trilha e efeitos (serve a A, B e vídeos já prontos)
1. **Texto de locução:** do `roteiros.md` (bloco corrido). Peça à pessoa para gerar **um arquivo só** no ElevenLabs, com pausa curta entre frases, num tom animado. Dica: ela pode gerar com a voz que já usa no projeto.
2. Receba o MP3. Meça as pausas e a duração: `python SK/scripts/mixar-audio.py --pausas voz.mp3`. Se a fala ficar mais longa que o vídeo, estique a última cena (preferível) ou acelere os trechos longos (até 1,2x).
3. Para casar frase e cena com precisão, transcreva com palavras e tempos (`npx hyperframes transcribe voz16.wav --language pt --json`, 16 kHz mono; o modelo local pode precisar ser instalado uma vez: `npx hyperframes models install parakeet`, ~640 MB; peça licença antes).
4. Escreva `audio.json` (formato no cabeçalho de `mixar-audio.py`): cada frase em `segmentos` com o tempo em que deve entrar no vídeo, efeitos (`sfx`) nos instantes dos eventos visuais (toques, pops, transições, whoosh nas trocas de cena, ding/sino nas confirmações), trilha com ducking.
5. `python SK/scripts/mixar-audio.py audio.json --video final-mudo.mp4 --saida final-com-audio.mp4` (volume de Reels ~ -14 LUFS, pico ≤ -1,3 dBFS).
6. Confira: duração do áudio = do vídeo, nenhuma fala cortada, trilha abaixando nas falas, pico sem clip. Diga que o áudio não foi ouvido, só medido.

## Checagens finais (todo caminho)
- Ritmo: nenhum trecho parado por mais de 1 s; mudança a cada 2 a 3 s.
- Texto legível no celular (≥ 34 px equivalentes) e dentro das zonas seguras (250 px topo, 380 px base).
- CTA legível por pelo menos 2 s no fim.
- Fatos conferidos com `marca.md`; nada de marca de terceiros.
- Arquivo > 20 MB: gerar também cópia leve (`-crf 22`).

## Entrega
Caminho do arquivo, duração, tamanho do quadro, resultado das checagens (inclusive as que falharam e por quê), o que não foi verificado (áudio ouvido, comparação de movimento) e uma linha do que tentar a seguir. Atualize `historico-reels.md` com "produzido: caminho X".
