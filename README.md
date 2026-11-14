# Skills de conteúdo para Instagram (Claude Code)

Duas skills para o [Claude Code](https://claude.com/claude-code) que geram **conteúdo de Instagram para qualquer projeto ou marca** (negócios e marcas pessoais), com a identidade visual de cada um:

| Comando | O que faz |
|---|---|
| `/instagram-conteudo [projeto]` | Gera **6 stories + 3 posts de feed** (e **carrossel** quando pedido), desenhados no **/design** (Claude Design), com legendas, hashtags, horários sugeridos e histórico para não repetir. |
| `/reels-conteudo [projeto]` | Cria **3 roteiros de Reels** (gancho, cenas, fala, texto de tela, legenda) com storyboard no Design e depois **transforma o reel escolhido em vídeo pronto**: animação (`/claude-video` ou Remotion), locução (texto para ElevenLabs), trilha e efeitos sonoros, ou kit de gravação. |

Tudo em português do Brasil. Nada é publicado nas redes: as skills só geram os arquivos e o link do Design.

## Como funciona
- As **skills** guardam só o método. Os **dados de cada projeto** ficam em `~/.claude/conteudo/<nome-do-projeto>/` (marca, temas, visual, histórico, logo), separados das skills. Assim você pode atualizar as skills sem perder nada e publicar as skills sem expor seus projetos.
- Cada projeto tem: `projeto.json`, `marca.md` (fatos e tom de voz: a única fonte de verdade), `temas.md`, `visual.json` (cores e fontes), `design.md` (personalidade visual), `historico.md` e `historico-reels.md`.
- A skill **nunca usa um fato que não esteja em `marca.md`** (nada de números, depoimentos ou resultados inventados) e varia a composição visual todo dia.
- O primeiro uso de `/instagram-conteudo` (ou `/reels-conteudo`) sem projetos cadastrados faz uma rodada curta de perguntas e cria a pasta do projeto sozinho.

## Instalação
Requisitos: Claude Code, Node 18+, Google Chrome (modo rápido de imagens). Para a parte de vídeo e áudio: Python 3 com `numpy` e `ffmpeg` no PATH. Para animações, as skills `claude-video` e/ou `remotion-*` instaladas.

**Windows (PowerShell):**
```powershell
git clone https://github.com/andrezindev/SKILL-INSTAGRAM.git SKILL-INSTAGRAM
cd SKILL-INSTAGRAM
powershell -ExecutionPolicy Bypass -File install.ps1
```
**macOS / Linux:**
```bash
git clone https://github.com/andrezindev/SKILL-INSTAGRAM.git SKILL-INSTAGRAM
cd SKILL-INSTAGRAM
bash install.sh
```
O instalador copia as duas skills para `~/.claude/skills/` e cria `~/.claude/conteudo/`. Abra uma **conversa nova** no Claude Code para os comandos aparecerem.

## Uso
```
/instagram-conteudo                      # escolhe o projeto (ou cadastra o primeiro)
/instagram-conteudo meu-projeto carrossel
/instagram-conteudo foco em oferta
/instagram-conteudo rápido               # PNGs simples, sem o Design
/reels-conteudo meu-projeto
/reels-conteudo produzir 2               # vai direto para a produção do reel 2
```

## Estrutura
```
skills/
  instagram-conteudo/   SKILL.md · guia-design.md · modelo/ (arquivos do projeto) · scripts/ (render.mjs, novo-projeto.mjs)
  reels-conteudo/       SKILL.md · formatos.md · producao.md · scripts/mixar-audio.py · assets/sfx (efeitos e trilha sintéticos)
exemplos/cafeteria-exemplo/   projeto de exemplo (fictício)
```

## Observações
- O **/design** usa o Claude Design (artifacts); precisa de uma conta com esse recurso. Sem ele, use o modo `rápido`.
- Os efeitos sonoros e a trilha em `assets/sfx` são sintetizados (sem direitos de terceiros).
- Para usar **voz de locução**, gere o áudio com uma voz sua, uma voz padrão de TTS ou uma voz que você criou. Não use voz de pessoa real sem autorização.
- Os exemplos de marca são fictícios.

## Licença
MIT (veja `LICENSE`).
