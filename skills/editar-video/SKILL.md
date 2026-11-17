---
name: editar-video
description: Edita o vídeo bruto que a pessoa gravou (talking head, tutorial, bastidor) com acabamento profissional - lembra as preferências dela, faz brainstorming curto, corta pausas, hesitações e recomeços, limpa a voz, rastreia o rosto para nunca cobri-lo, corrige a legenda com glossário, monta um plano de motion automático (títulos cinéticos, palavras gigantes, terminal do Claude Code, card do GitHub, jump cuts, transições, tela final de comentário, música e efeitos), confere tudo antes de mostrar e entrega Reels, capa, versão 4:5 e corte curto. Use quando o usuário digitar /editar-video, subir ou citar um vídeo bruto e pedir "edita meu vídeo", "corta e legenda", "coloca motion", "tenho um vídeo gravado", "edita pra Reels" ou quiser mostrar como usar as skills no Claude Code em vídeo.
---

# /editar-video

Transforma o **vídeo bruto** em um vídeo pronto para postar, com o nível de edição que a pessoa já aprovou antes.
A pessoa não é técnica: responda curto, em português do Brasil, faça o trabalho e nunca peça para rodar comandos.
`SK` = `~/.claude/skills/editar-video` · `PREF` = `~/.claude/editar-video/` (preferências e glossário da pessoa; não ficam na skill).
Pasta de trabalho: ao lado do vídeo, `<nome-do-video>_edicao/` (ou `<saida do projeto>/edicoes/<nome>/`). Nunca altere nem apague o original.

## Modos (argumentos depois do comando)
- `/editar-video <vídeo>`: fluxo completo com uma rodada curta de perguntas.
- `/editar-video <vídeo> rápido`: **sem perguntas**. Usa as preferências salvas e os padrões, mostra a folha e pede só o ok para renderizar.
- `/editar-video <vídeo> viral` (ou `limpo`, `tutorial`, `historia`): já define o estilo.
- `/editar-video verificar`: só roda `SK/scripts/verificar.py` e explica o que falta no computador, em português simples.
- Se a pessoa não mandou vídeo: explique em 3 linhas como gravar bem (abaixo) e ofereça um roteiro com `/reels-conteudo`.

**Dicas de gravação para passar a quem vai gravar** (curtas, só quando fizer sentido): celular em pé, na altura dos olhos; rosto de frente para uma janela; fale a primeira frase forte logo no início; se errar, pare 2 segundos e repita a frase inteira (a skill fica com o último take); grave em lugar silencioso.

## 0. Ambiente e memória
- **Primeiro uso / erro de ferramenta:** rode `python SK/scripts/verificar.py`. Ele lista o que falta (Node, Python, ffmpeg, OpenCV, modelo de transcrição) com o comando para resolver. Explique em uma linha por item e peça licença antes de instalar.
- Se `PREF/preferencias.md` não existir, crie `PREF/` copiando `SK/modelo-preferencias.md` → `PREF/preferencias.md` e `SK/modelo-glossario.json` → `PREF/glossario.json`.
- `ffmpeg` pode não estar no PATH: estenda o PATH com a pasta `bin` do pacote FFmpeg do WinGet. Use `python` (não `python3`).
- Requisitos (uma vez): modelo de transcrição Parakeet (`npx hyperframes models install parakeet`, ~640 MB) e OpenCV (`python -m pip install --user opencv-python-headless`). **Peça licença antes de instalar.** Dependências do Remotion ficam na pasta da skill e são reaproveitadas (o primeiro `montar.mjs` instala).
- **Leia `PREF/preferencias.md` antes de tudo.** Ele manda sobre os padrões desta skill (enquadramento, nível de motion, sons, cores, CTA). Não pergunte de novo o que já está lá.
- **Sempre que a pessoa der um retorno** ("achei simples", "o som incomoda", "gostei disso"), acrescente uma linha datada em `PREF/preferencias.md` com a regra e o motivo, e aplique já nesta edição.

## 1. Receber o material
- Vídeo bruto (arrastado ou caminho). Sem vídeo: ofereça o roteiro com `/reels-conteudo` e pare até ela gravar.
- Se veio de um roteiro do `/reels-conteudo`, use o `reels.json`/`roteiros.md` (cenas, texto de tela, CTA) como guia.
- Projeto (opcional): `~/.claude/conteudo/<slug>/` (`marca.md`, `visual.json`, `glossario.json`) para cores, tom, fatos e CTA.
- Aceite também **material extra**: gravações de tela, clipes e prints (viram overlays `video`/`imagem` com o apresentador em janelinha).

## 2. Brainstorming curto (só o que falta)
No modo `rápido`, pule esta etapa. Senão, leia `SK/brainstorm.md`. Com as preferências carregadas, normalmente basta **uma rodada** de AskUserQuestion: objetivo e CTA deste vídeo, o que mostrar na tela (comandos, prints, números) e qualquer coisa nova. Se o vídeo for horizontal, pergunte se quer recorte vertical no rosto ou o quadro inteiro com fundo animado. Resuma o plano em até 6 linhas e peça o ok.

## 3. Analisar
```
node SK/scripts/analisar.mjs "<video>" "<pasta>/analise"
```
Gera `info.json` (normaliza sozinho vídeo girado por metadado ou com fps variável: use `info.video_normalizado` daqui em diante), `palavras.json`, `silencios.json`, `transcricao.md`. Leia a transcrição inteira.

## 4. Cortes inteligentes e voz
```
python SK/scripts/sugerir-cortes.py "<pasta>/analise/palavras.json" "<pasta>/cortes.json" --duracao <s>
```
Remove pausas longas, hesitações ("ãh", "hum", "é..." isolado) e **recomeços** (mantém o último take), e lista vícios de linguagem e candidatas a gancho em `cortes-relatorio.md`. Revise (você decide) e então:
```
python SK/scripts/cortar.py "<video>" "<pasta>/cortes.json" "<pasta>/cortado.mp4" "<pasta>/analise/palavras.json" --limpar-voz [--cauda 2.8]
```
`--limpar-voz` tira ruído e graves, comprime e dá presença (som de microfone bom). `--cauda` congela o fim para a tela de CTA. Releia a linha do tempo: nenhum corte pode comer palavra ou mudar o sentido.

## 5. Rosto e plano automático
```
python SK/scripts/rosto.py "<pasta>/cortado.mp4" "<pasta>/analise/rosto-cortado.json"
python SK/scripts/planejar.py "<pasta>" --estilo dinamico [--projeto <slug>] [--tema tech|quente|neutro] [--legenda pilula|caixa|karaoke]
```
O planejador escreve o **rascunho** de `edit.json`: legendas corrigidas pelo glossário (`PREF/glossario.json` + do projeto) e posicionadas abaixo da boca; jump cuts nas viradas de frase centrados no rosto; `punch` (soco de zoom de 0,5 s) nas palavras fortes; transições variadas (flash, zoom, wipe, glitch no tema tech) nas trocas de assunto com whoosh discreto; emojis na legenda para palavras comuns (só nos estilos viral/dinâmico); música; e em `_notas`: sugestões de motion (termos-chave, números), palavras suspeitas da transcrição e as frases. **Você completa o conteúdo**: troque cada `<<...>>` e acrescente overlays nos momentos das sugestões. Corrija palavras suspeitas e, se achar um erro recorrente do transcritor, adicione ao `PREF/glossario.json`.

Overlays (formato em `modelo-remotion/src/tipos.ts`): `titulo` (cinético; `*palavra*` destaca; `sub` = etiqueta), `palavra` (palavra gigante vazada que se preenche), `terminal` (Claude Code digitando), `lista`, `passos` (linha do tempo), `github` (card do repositório), `numero`, `callout`, `imagem`, `video` (gravação de tela/clipe), `emoji` (figurinha que pula, com `x`/`y`), `comparativo` (antes x depois com ✗ e ✓), `progresso` (barra que enche com %), `cta` (com `palavra`: tela final com o comentário sendo digitado). `pip: true` deixa o apresentador numa **janelinha 9:16 com o quadro inteiro** sobre fundo animado.
Regras:
- **Vídeo do apresentador sempre inteiro** (tela cheia ou janelinha). Nunca `faixa`.
- Overlays de tela cheia ficam no topo (y 280 a ~900) e nunca sobre o rosto; telas grandes usam `pip`.
- Estilos: `viral` (algo novo a cada 2 a 3 s, punch a cada ~3 s), `dinamico` (3 a 4 s), `tutorial`, `historia`, `limpo`. Legenda: `pilula` (padrão), `caixa` (fundo preto, a mais fácil de ler: boa para público amplo e pessoas com baixa visão) ou `karaoke`.
- Receita de um vídeo bem editado (dinâmico): gancho com `titulo` nos 2 primeiros s · `palavra` ou `numero` no termo principal · um `comparativo` ou `lista` quando ela explicar o problema · `terminal`/`video`/`imagem` com `pip` quando mostrar algo · 1 `emoji` a cada ~6 s no máximo · `callout` para nomes de comandos · `cta` fechando.
- Algo novo a cada 3 a 4 s no estilo dinâmico (o conferidor mede). Cada overlay entra quando o assunto é falado e fica legível (o conferidor calcula o mínimo).
- Terminal: comandos reais das skills e saídas curtas e verdadeiras. Nada de fato, número, link ou depoimento inventado.
- Sons: `montar.mjs` gera sozinho a digitação, os dings, os pops e o chaching do CTA (`sfx_auto`). Transições com whoosh até 0,12 e sem impact, salvo preferência contrária.

## 6. Conferir, montar e aprovar (gate)
```
python SK/scripts/checar.py "<pasta>"            # repita até não haver PROBLEMA (avisos: avalie)
node SK/scripts/montar.mjs "<pasta>" "<pasta>/cortado.mp4" "<pasta>/edit.json"
python SK/scripts/folha.py "<pasta>"             # quadros nos momentos-chave → <pasta>/folha.png
```
Olhe a `folha.png` (rosto coberto, texto cortado, contraste, erros de português) e corrija. Mostre a folha (SendUserFile) e pergunte "Pode renderizar?". Para uma prévia em movimento rápida: `npx remotion render src/index.ts Edicao out/previa.mp4 --scale=0.5 --crf=28` (em `<pasta>/remotion`).

## 7. Renderizar e entregar
`cd <pasta>/remotion && npx remotion render src/index.ts Edicao out/final.mp4 --codec=h264 --crf=18 --pixel-format=yuv420p --audio-codec=aac`
Depois:
```
python SK/scripts/exportar.py "<pasta>/remotion/out/final.mp4" "<pasta>/entrega" --capa <s> [--corte <ini> <fim>]
```
Gera o Reels com volume certo (−16 LUFS, pico ≤ −1,5 dBFS), `capa.jpg`, versão **4:5 para o feed**, corte curto opcional e cópia leve se passar de 20 MB. Escreva `<pasta>/entrega/legenda-post.md` (legenda curta, CTA e hashtags; use o `marca.md` do projeto). Olhe 3 quadros do final. Ajuste **só de som**: renderize o áudio (`--codec=wav`) e junte ao vídeo pronto com ffmpeg, sem renderizar a imagem de novo.

Entregue curto: o arquivo (SendUserFile), duração, o que foi cortado, o motion aplicado, os arquivos extras, e **o que não foi verificado** (por exemplo, o áudio não foi ouvido, só medido). Registre em `PREF/preferencias.md` qualquer retorno da pessoa.

## Acessibilidade (sempre)
- Legenda sempre ligada (muita gente assiste sem som ou tem deficiência auditiva), com contraste alto e no máximo 3 palavras por vez. Se a pessoa pedir "mais fácil de ler", use `--legenda caixa`.
- Nada importante só no som: o que é dito como chave também aparece escrito.
- Sem piscadas fortes: no máximo 1 `flash` a cada 5 s e nenhum `glitch` seguido de outro em menos de 3 s.
- Na `legenda-post.md`, inclua um **texto alternativo** de 1 linha descrevendo o vídeo (para leitores de tela) e escreva hashtags em CamelCase (#ClaudeCode).

## Regras duras
- Original intacto. Nunca publicar nas redes. Nunca clonar ou imitar voz.
- Nunca inventar fatos, números, depoimentos, resultados ou links.
- Nunca renderizar o final antes do ok da folha. Nunca dizer que algo foi verificado sem verificar.
- Rosto nunca coberto; zonas seguras respeitadas (250 px topo, ~380 px base).
