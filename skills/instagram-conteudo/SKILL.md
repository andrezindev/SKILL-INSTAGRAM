---
name: instagram-conteudo
description: Gera o conteúdo do dia para o Instagram de QUALQUER projeto ou marca da pessoa (negócios e marcas pessoais) - 6 stories, 3 posts de feed e carrossel, desenhados no /design (Claude Design) com identidade própria de cada projeto, mais legendas, hashtags e histórico para não repetir. Cada projeto tem sua pasta (marca, temas, visual). Use quando o usuário digitar /instagram-conteudo [projeto], pedir "conteúdo de hoje", "stories do dia", "posts do dia", "carrossel", "ideias de stories/posts" ou "gera meus stories", quiser o planejamento da semana ("semana", "calendário"), ou quiser cadastrar um projeto novo ("novo projeto", "adicionar projeto").
---

# /instagram-conteudo

Entrega, para o projeto escolhido, **6 stories + 3 posts de feed** (e **carrossel** quando pedido), desenhados no **/design**, com legendas e hashtags prontas.
A pessoa não é técnica: responda curto, em português do Brasil, faça o trabalho e nunca peça para rodar comandos.
`SK` = esta pasta (`~/.claude/skills/instagram-conteudo`). `PROJ` = `~/.claude/conteudo/<slug>/` (dados de cada projeto; a skill em si não guarda dado de marca nenhuma).

## 0. Escolher o projeto
1. Liste as pastas de `~/.claude/conteudo/` (ignore `_modelo`). O argumento depois do comando pode ser o slug ou o nome do projeto, mais um foco ou modo (`carrossel`, `rápido`, `semana`, "foco em oferta", "só stories", "só carrossel").
2. Se há **um** projeto, use-o. Se há **vários** e a pessoa não disse qual, pergunte com AskUserQuestion (2 a 4 opções com os nomes). Se **não há nenhum** ou ela pediu "novo projeto", vá para a seção **Cadastrar projeto**.
3. Leia sempre, do projeto: `projeto.json`, `marca.md`, `temas.md`, `visual.json`, `design.md`, `historico.md` e `preferencias.md` (se existir). Leia também `SK/guia-design.md` e, para títulos e capas, os moldes de `~/.claude/skills/reels-conteudo/ganchos.md` (se existir).
4. **Memória do projeto:** toda reação da pessoa ("gostei do story 2", "menos texto", "não usa a cor verde", "esse tom é formal demais") vira uma linha datada em `PROJ/preferencias.md` e vale para as próximas vezes (e para `/reels-conteudo`). Preferência vence o padrão da skill.
   Se `marca.md` ou `temas.md` ainda tiver os textos de exemplo do modelo (campos "(...)" vazios), pare e complete o cadastro primeiro (seção Cadastrar projeto).

## Cadastrar projeto
Faça no máximo uma rodada de perguntas (AskUserQuestion ou uma mensagem única, com padrões entre colchetes):
1. **Nome** e se é **negócio** ou **marca pessoal**. [negócio]
2. **O que é, para quem, e o que vende/ensina** (3 linhas). Pode colar o site, e eu leio.
3. **Ofertas e condições reais** (preço, teste, vagas) e se estão valendo.
4. **Tom de voz** (3 adjetivos) e o que **não pode** dizer.
5. **Visual:** cores, fontes, logo (arraste o arquivo) e algo que admira. [eu proponho, se não souber]
6. **@ do Instagram** e **link da bio**.
Depois: `node SK/scripts/novo-projeto.mjs --slug <slug> --nome "<Nome>" --tipo <negocio|pessoal> --site <site> [--logo <arquivo>] [--saida "<pasta>/{data}"]`, preencha `marca.md`, `temas.md` (pilares e segmentos sob medida), `design.md` e `visual.json` (cores reais em 3 temas) com as respostas. Se houver site, leia-o para extrair fatos (sem inventar). Mostre um resumo de 5 linhas e siga.

## Modo `semana` (planejamento)
Monte `<pasta da semana>/calendario.md` com 7 dias: para cada dia, segmento, pilar, os 6 stories (uma linha cada), os 3 posts (título + tipo) e 1 ideia de reel; equilibre os pilares (educar, conectar, provar, vender no máximo 2 dias) e marque datas comemorativas relevantes ao público. Não desenhe nada ainda. Mostre um resumo de 7 linhas e diga: "é só digitar `/instagram-conteudo` em cada dia que eu desenho o dia seguindo o calendário". No dia, se existir `calendario.md` cobrindo a data, siga-o.

## 1. Planejar o dia
Data de hoje (AAAA-MM-DD). Escolha o **segmento/ângulo do dia** em rodízio (de `temas.md`) e **um pilar principal** que não apareceu nos últimos 3 dias (de `historico.md`). Nunca repita ângulo ou título dos últimos 7 dias. Foco dado pela pessoa vence o rodízio.
Distribuição padrão (ajustável em `projeto.json`): **6 stories** na sequência de `temas.md` e **3 posts** (educativo, antes x depois/dor→solução, oferta/CTA). Se o projeto não tem oferta, o post 3 vira prova/curiosidade/convite para seguir.
Escolha também as **composições** do dia (arquétipos de `SK/guia-design.md`), diferentes das de ontem.

## 2. Escrever `conteudo.json`
Pasta de saída: o campo `saida` de `projeto.json`, trocando `{data}` pela data de hoje. Salve nela `conteudo.json`:
```json
{
  "projeto": "slug", "data": "AAAA-MM-DD", "segmento": "...", "pilar": "dor",
  "itens": [
    { "id": "story-01", "formato": "story", "layout": "enquete", "tema": "escuro", "composicao": "tipografico",
      "kicker": "PERGUNTA", "titulo": "Pergunta com *destaque*", "opcoes": ["Sim", "Não"], "nota": "Adicione o sticker de enquete" },
    { "id": "post-01", "formato": "post", "layout": "lista", "tema": "claro", "composicao": "caderno",
      "kicker": "3 SINAIS", "titulo": "...", "itens": ["...", "...", "..."], "legenda": "...", "hashtags": "#a #b" }
  ],
  "carrossel": { "tema": "...", "slides": [ { "titulo": "...", "sub": "...", "visual": "..." } ], "legenda": "...", "hashtags": "..." }
}
```
Layouts (modo rápido): `titulo`, `lista`, `comparativo`, `passo`, `enquete`, `cta`. No Design os layouts são livres; `layout` e `composicao` orientam o desenho. O campo `tema` deve ser uma chave de `visual.json` (`temas`).
Regras de texto:
- Idioma do projeto, frases curtas e diretas, na voz de `marca.md`. Título até 14 palavras; subtítulo até 25. Uma ideia por tela. Destaque uma palavra com `*asteriscos*`.
- **Só fatos de `marca.md`.** Nada de números, depoimentos, resultados, clientes ou concorrentes inventados. Exemplos devem dizer "exemplo". Oferta só se `marca.md` disser `valendo`.
- Todo post e o carrossel têm `legenda` (abre com dor ou pergunta, termina em um único CTA) e `hashtags` (5 a 8, específicas). Stories têm `nota` quando precisam de sticker (enquete, caixa de perguntas, link).
- Sem emojis dentro das imagens; poucos nas legendas.
- Cada post e cada slide do carrossel têm `alt` (texto alternativo de 1 a 2 frases descrevendo a imagem e o texto dela, para leitores de tela; o Instagram aceita em "Configurações avançadas > Escrever texto alternativo").
- Capa do carrossel e título do post 1 usam um molde de gancho (dor, número, contraste, curiosidade); o último slide sempre diz o que fazer (salvar, comentar, link na bio).

## 3. Desenhar no /design (padrão)
Siga `SK/guia-design.md`: crie o artifact Design do dia com **um artboard por peça** (6 stories, 3 posts e, se pedido, o carrossel), usando os textos do `conteudo.json`, a identidade de `visual.json` + `design.md` e **composições variadas** entre as peças. Cada peça leva um elemento visual próprio, não só texto sobre fundo.
**Carrossel:** quando a pessoa pedir ou quando o pilar do dia for educativo (6 a 10 slides: capa com gancho, uma ideia por slide, CTA no último).
**Modo rápido** (`rápido`, ou se o Design não estiver disponível): `node SK/scripts/render.mjs <pasta>/conteudo.json <slug>` gera PNGs simples e `folha.png`.

## 4. Conferir com os próprios olhos (obrigatório)
Abra o Design publicado (ou `folha.png`) e olhe cada artboard: texto cortado, hierarquia, contraste, repetição de composição, zona segura, erros de português, fatos fora de `marca.md`. Corrija e republique (até 3 rodadas).
Dê uma **nota de 0 a 10** a cada peça e refaça as que ficarem abaixo de 8:
| Critério | Pontos |
|---|---|
| Para o dedo em 1 s (título forte, um elemento visual que chama) | 2 |
| Uma ideia só, lida em até 3 s | 2 |
| Contraste do texto ≥ 4,5:1 e letra ≥ 34 px no 1080 (legível para baixa visão) | 2 |
| Composição diferente das vizinhas e de ontem | 1 |
| Fatos 100% de `marca.md`, sem erro de português | 2 |
| Ação clara (sticker, salvar, comentar, link) quando a peça pede | 1 |

## 5. Legendas e roteiro do dia
Escreva `<pasta>/legendas.md`: horários sugeridos (stories espalhados, 3 horários de feed), cada story (ordem, texto, nota de sticker), cada post e o carrossel com legenda, hashtags (em CamelCase: #CardapioDigital) e texto alternativo prontos para colar, e o lembrete do link na bio.
No fim, um bloco curto **"Como postar"** para quem é iniciante (só na primeira vez do projeto ou se a pessoa pedir): baixar as imagens do Design, postar o carrossel na ordem, colar a legenda, colar o texto alternativo, adicionar os stickers dos stories.

## 6. Registrar e entregar
1. Acrescente a `PROJ/historico.md`: `AAAA-MM-DD | segmento | pilar | tipo | título | composição` (uma linha por item).
2. Mensagem curta: **link do Design** (e como baixar cada peça), caminho de `legendas.md`, uma linha por story/post com o ângulo. Não despeje os textos.
3. Ofereça em uma linha os Reels do dia com `/reels-conteudo`.
4. Ajustes ("troca o story 3", "mais agressivo", "sem oferta"): edite só o item no `conteudo.json` e no Design e atualize `legendas.md` e o histórico.

## Acessibilidade (sempre)
Contraste mínimo 4,5:1 (3:1 só para títulos muito grandes), letra mínima de 34 px no 1080, nunca informação só por cor, texto alternativo em todo post e slide, hashtags em CamelCase, poucos emojis e nunca no meio das frases.

## Regras duras
- Nunca inventar fatos. Nunca citar concorrentes por nome. Nunca prometer resultado garantido.
- Nunca misturar dados de projetos diferentes: cada conteúdo usa só os arquivos do projeto escolhido.
- Não publicar nas redes: só gerar os arquivos e o link do Design.
