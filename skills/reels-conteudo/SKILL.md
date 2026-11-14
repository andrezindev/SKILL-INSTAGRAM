---
name: reels-conteudo
description: Cria roteiros de Reels para QUALQUER projeto ou marca da pessoa - 3 ideias por vez com gancho, cenas, texto na tela, fala, o que filmar, legenda e hashtags, storyboard desenhado no /design, e depois transforma o reel escolhido em VÍDEO PRONTO (animação com /claude-video ou Remotion, locução com texto para o ElevenLabs, trilha e efeitos sonoros) ou em kit de gravação. Use quando o usuário digitar /reels-conteudo [projeto], pedir "ideia de reels", "roteiro de reels", "reels de hoje", "o que gravar hoje", "transforma esse reel em vídeo" ou "script de vídeo curto pro Instagram".
---

# /reels-conteudo

Duas partes: **(A) roteiros** de 3 Reels com storyboard no Design e **(B) produção**: transformar o reel escolhido em vídeo pronto (ou em kit de gravação).
A pessoa não é técnica: responda curto, em português do Brasil, faça o trabalho e nunca peça para rodar comandos.
`SK` = `~/.claude/skills/reels-conteudo`; `IG` = `~/.claude/skills/instagram-conteudo`; `PROJ` = `~/.claude/conteudo/<slug>/` (dados do projeto, compartilhados com `/instagram-conteudo`).

## 0. Projeto e modo
1. Escolha o projeto como em `/instagram-conteudo` (seção 0): um só projeto → use; vários → pergunte com AskUserQuestion; nenhum ou "novo projeto" → faça o cadastro descrito em `IG/SKILL.md` (seção Cadastrar projeto) antes.
2. Argumentos depois do comando: projeto, foco ("só demo do produto", "humor", "15 segundos", "segmento X") e modo: `rápido` (storyboard em PNG, sem Design) ou `produzir <n>` (pular direto para a parte B com o reel n do último roteiro).
3. Leia do projeto: `projeto.json`, `marca.md`, `temas.md`, `visual.json`, `design.md`, `historico-reels.md`. Leia também `SK/formatos.md` e `IG/guia-design.md`.

# PARTE A · Roteiros

## 1. Planejar
Escolha **3 reels de formatos diferentes** (`SK/formatos.md`) e **um segmento** (rodízio de `temas.md`, sem repetir formato + segmento + gancho dos últimos 7 dias de `historico-reels.md`). Um reel deve **mostrar o produto/serviço/método em ação** (demonstração) e um deve ter **gancho de dor ou curiosidade**. Para marca pessoal, troque "produto" por método, história ou opinião. Duração padrão 15 a 25 s.

## 2. Escrever `reels.json`
Pasta: `saida` de `projeto.json` (trocando `{data}`) + `/reels/`. Salve `reels.json` com, por reel: `id`, `formato`, `titulo`, `duracao`, `gancho`, `audio`, `cenas[]` (`tempo`, `texto_tela` até 6 palavras, `fala`, `visual`), `cta`, `legenda`, `hashtags`, `producao` (caminho sugerido da parte B).
Regras:
- **Gancho** nos 2 primeiros segundos (dor, pergunta, curiosidade, contraste, número). Nunca "Olá" nem o nome da marca.
- Cenas de 2 a 4 s, uma ideia cada, mudança visual a cada 2 a 3 s. Texto de tela fora dos 250 px de cima e 380 px de baixo.
- Voz do projeto (`marca.md`), falado, frases curtas. Sem emojis no texto de tela.
- Um único CTA no fim; oferta só se `marca.md` disser `valendo`.
- **Só fatos de `marca.md`.** Nada de dado, depoimento, cliente com nome, promessa de resultado ou concorrente por nome.
- `visual` precisa ser produzível por quem toca o projeto: celular, tela do produto, ou animação feita aqui.

## 3. Storyboard no /design
Siga `IG/guia-design.md`: artboards 1080 x 1920, um por cena, agrupados por reel em linhas do canvas, mais uma **capa** por reel; identidade de `visual.json` + `design.md`, **composições variadas** entre os reels. Cada quadro é o momento-chave da cena com a cara final (texto real, mockup, zona segura) e uma nota com `tempo`, `fala`, `visual`. Modo `rápido`: PNGs com `node IG/scripts/render.mjs <pasta>/storyboard.json <slug>` (itens `formato: "story"`, `layout: "titulo"`, ids `reelN-cenaM`).
Abra e **olhe**; corrija (até 2 rodadas).

## 4. Roteiro para gravar e fala pronta
Escreva `<pasta>/roteiros.md`: por reel, cenas (tempo, o que filmar, fala, texto na tela), áudio, legenda e hashtags para colar, e "como produzir". Inclua também, por reel, o **texto de locução corrido** (só a fala, em um bloco, com pausas marcadas) pronto para colar no ElevenLabs, com a observação do tempo-alvo.

## 5. Registrar e entregar a parte A
1. Acrescente a `PROJ/historico-reels.md`: `AAAA-MM-DD | segmento | formato | gancho` (uma linha por reel).
2. Mensagem curta: uma linha por reel (formato, gancho, duração), link do Design, caminho de `roteiros.md`.
3. **Pergunte com AskUserQuestion qual reel produzir e como** (parte B): opções de `SK/producao.md` (animação com /claude-video; animação com Remotion; kit de gravação; só locução + áudio). Se a pessoa disser "depois", encerre.

# PARTE B · Produção do vídeo

Quando a pessoa escolher reel + caminho, siga **`SK/producao.md`** (passo a passo de cada caminho: brief automático, storyboard aprovado, locução, trilha e efeitos, render, checagens e entrega). Resumo:
- **Animação com /claude-video:** invoque a skill `claude-video` já com as 5 respostas preenchidas a partir do roteiro e da marca (formato 9:16, duração, textos exatos, cores/logo do `visual.json`, sem mídia real). Estilos que combinam com cada formato estão em `producao.md`.
- **Animação com Remotion:** projeto 1080x1920 a 30 fps, dirigido por um `config.ts`, com cenas, mockups e efeitos sincronizados. Use as skills `remotion-*`.
- **Kit de gravação:** lista de takes, falas, enquadramento, luz e checklist, sem render.
- **Locução e áudio (qualquer caminho):** a pessoa gera a voz no ElevenLabs com o texto de locução; você corta por frase, encaixa nas cenas, mixa trilha e efeitos com `SK/scripts/mixar-audio.py`.
Nunca renderize o final sem a aprovação dos quadros (cards) pela pessoa. Diga o que verificou e o que não verificou (por exemplo, que o áudio não foi ouvido).

## Regras duras
- Nunca inventar fatos, preços, depoimentos ou resultados; nunca citar concorrentes; nunca prometer ganho garantido.
- Nunca usar a voz de uma pessoa real/famosa sem autorização dela; a locução vem de uma voz própria da pessoa, de uma voz padrão de TTS ou de uma voz que ela criou.
- Nunca misturar dados de projetos diferentes.
- Não publicar nas redes: só gerar arquivos e o link do Design.
