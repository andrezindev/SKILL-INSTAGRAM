# SKILL-INSTAGRAM · Conteúdo de Instagram com o Claude Code

Três skills para o [Claude Code](https://claude.com/claude-code) que fazem o trabalho pesado do Instagram para **qualquer projeto ou marca** (negócio ou marca pessoal), em português do Brasil:

| Comando | O que você recebe |
|---|---|
| `/instagram-conteudo` | **6 stories + 3 posts de feed** (e **carrossel**) desenhados no /design com a identidade do seu projeto, legendas, hashtags, texto alternativo e horários sugeridos. Também planeja a **semana inteira**. |
| `/reels-conteudo` | **3 roteiros de Reels** com gancho testado e nota de retenção, storyboard, fala pronta, **teleprompter** para gravar e, se quiser, o **vídeo pronto** (animação, locução, trilha e efeitos). |
| `/editar-video` | Pega o **vídeo que você gravou** e devolve editado: corta pausas e erros, limpa a voz, legenda palavra por palavra, coloca motion (títulos, terminal, antes x depois, emojis, zooms), música, efeitos e tela final. Entrega Reels, capa, versão 4:5 e corte curto. |

Você não precisa saber programar: é só conversar. As skills fazem perguntas curtas quando precisam e **lembram do que você gostou** para as próximas vezes.
Nada é publicado nas suas redes: as skills só geram os arquivos. Quem posta é você.

---

## Instalação (5 minutos)

### 1. O que você precisa
- **Claude Code** instalado (app ou terminal).
- **Node.js 18+**: https://nodejs.org (versão LTS).
- **Python 3.9+**: https://python.org (no Windows, marque "Add Python to PATH").
- **ffmpeg** (só para vídeo e áudio):
  - Windows: `winget install Gyan.FFmpeg`
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`

Não sabe se tem? Instale as skills primeiro: o instalador verifica tudo e diz o que falta. Você também pode pedir ao Claude: *"instala o que falta para as skills"*.

### 2. Baixar e instalar
**Windows (PowerShell):**
```powershell
git clone https://github.com/andrezindev/SKILL-INSTAGRAM.git
cd SKILL-INSTAGRAM
powershell -ExecutionPolicy Bypass -File install.ps1
```
**macOS / Linux:**
```bash
git clone https://github.com/andrezindev/SKILL-INSTAGRAM.git
cd SKILL-INSTAGRAM
bash install.sh
```
Sem git? Clique em **Code → Download ZIP** aqui no GitHub, extraia e rode o instalador de dentro da pasta.

### 3. Abrir uma conversa nova
Feche e abra o Claude Code (ou comece uma conversa nova) e digite `/instagram-conteudo`. Na primeira vez ele faz 6 perguntas rápidas sobre o seu projeto (nome, o que vende, tom de voz, cores, @ e link) e cria a pasta dele sozinho.

O instalador termina com uma lista assim:
```
 ✓ Node.js 18+     OK   v22
 ✓ ffmpeg          OK
 ✗ OpenCV          FALTA
                   → resolver: python -m pip install --user opencv-python-headless
```
Para verificar de novo a qualquer momento: `/editar-video verificar`.

---

## Como usar

### /instagram-conteudo
```
/instagram-conteudo                       conteúdo de hoje (escolhe o projeto ou cadastra o primeiro)
/instagram-conteudo minha-loja carrossel  com carrossel
/instagram-conteudo semana                planeja os 7 dias (depois é só chamar todo dia)
/instagram-conteudo foco em oferta
/instagram-conteudo rápido                imagens simples, sem o /design
/instagram-conteudo novo projeto          cadastra outro projeto
```
O que ela faz por você:
- Varia o assunto e o visual todo dia (guarda um histórico para não repetir).
- Usa **só fatos que você informou**: nada de número, depoimento ou promessa inventada.
- Dá uma **nota de 0 a 10** a cada peça e refaz as fracas antes de te mostrar.
- Escreve a legenda, as hashtags e o **texto alternativo** (para quem usa leitor de tela) prontos para colar.

### /reels-conteudo
```
/reels-conteudo                3 roteiros novos
/reels-conteudo humor 15 segundos
/reels-conteudo produzir 2     transforma o reel 2 em vídeo
```
- Ganchos a partir de um banco de moldes testados, 2 opções por reel para você testar.
- Cada roteiro recebe uma **nota de retenção** e é reescrito se ficar abaixo de 8.
- Gera um **teleprompter** (`teleprompter.html`): abre no navegador do PC ou do celular, rola sozinho, com letra e velocidade ajustáveis.
- Depois de gravar, mande o vídeo para o `/editar-video`: o roteiro vira os títulos e o CTA da edição.
- Se você não quer aparecer: ela produz o reel em animação, com locução (você gera a voz no ElevenLabs com o texto que ela entrega), trilha e efeitos.

### /editar-video
Arraste o vídeo para a conversa (ou cole o caminho) e digite:
```
/editar-video meu-video.mp4            com algumas perguntas rápidas
/editar-video meu-video.mp4 rápido     sem perguntas: usa o seu estilo salvo
/editar-video meu-video.mp4 viral      edição bem agitada
/editar-video verificar                confere se o computador tem tudo
```
O que acontece:
1. Transcreve a fala (no seu computador, sem enviar o vídeo para lugar nenhum).
2. Corta pausas, "ãh", "hum" e **recomeços** (se você errou e repetiu a frase, fica a última).
3. Limpa a voz (tira ruído e graves, deixa com som de microfone bom).
4. Acha o seu rosto para **nunca cobrir** você com texto.
5. Monta a edição: legenda palavra por palavra, títulos animados, palavras gigantes, terminal digitando, card do GitHub, **antes x depois**, barra de progresso, **emojis**, jump cuts, socos de zoom, transições e tela final de "comente a palavra".
6. Confere sozinho (texto sobre o rosto, tempo de leitura, ritmo, sons altos, piscadas fortes) e te mostra uma **folha de quadros** para aprovar.
7. Só depois do seu ok renderiza e entrega: **Reels** (volume certo), **capa**, **versão 4:5** para o feed, **corte curto** e a legenda do post.

Estilos: `limpo`, `dinamico` (padrão), `viral`, `tutorial`, `historia`. Legenda: pílula (padrão), **caixa** (a mais fácil de ler) ou karaokê.

**Dicas para gravar:** celular em pé, na altura dos olhos, de frente para uma janela, em lugar silencioso. Comece já com a frase mais forte. Errou? Pare 2 segundos e repita a frase inteira.

---

## Ela aprende com você
Diga o que achou ("achei simples", "o som da transição incomoda", "gostei dessa cor") e a skill anota e aplica dali em diante:
- Edição de vídeo: `~/.claude/editar-video/preferencias.md` e `glossario.json` (palavras que a transcrição erra, como "Cloud" → "Claude").
- Cada projeto: `~/.claude/conteudo/<projeto>/preferencias.md` (vale para posts, stories e Reels).

Esses arquivos são seus: atualizar as skills **não apaga** nada.

## Acessibilidade
- Legenda sempre ligada (muita gente assiste sem som), com contraste alto e no máximo 3 palavras por vez; opção de legenda em caixa preta.
- Texto alternativo em todo post, slide e vídeo; hashtags em CamelCase (#CardapioDigital), que leitores de tela leem melhor.
- Contraste mínimo 4,5:1 e letra grande nas imagens; nunca informação só por cor.
- O conferidor do vídeo bloqueia piscadas fortes seguidas (flash/glitch a menos de 3 s).

## Onde ficam as coisas
```
~/.claude/skills/          as 3 skills (o método)
~/.claude/commands/        atalhos /instagram-conteudo, /reels-conteudo, /editar-video
~/.claude/conteudo/<proj>/ dados de cada projeto: marca, temas, cores, histórico, preferências
~/.claude/editar-video/    suas preferências de edição e o glossário
```
Os arquivos gerados (imagens, roteiros, vídeos) vão para a pasta de saída do projeto (perguntada no cadastro) ou para uma pasta ao lado do vídeo original. **O vídeo original nunca é alterado.**

## Problemas comuns
| Problema | Solução |
|---|---|
| O comando `/...` não aparece | Abra uma conversa **nova** (ou feche e abra o app). Se usa sessão remota, rode o instalador na máquina remota. |
| "ffmpeg não encontrado" | Instale (veja acima) e abra o Claude Code de novo. |
| "OpenCV não instalado" | `python -m pip install --user opencv-python-headless` |
| A transcrição pede para baixar um modelo | É o modelo local de fala (~640 MB, uma vez só). A skill pede licença antes. |
| O primeiro vídeo demora | Na 1ª vez ela instala o Remotion (1 a 3 min). Depois é rápido. |
| Vídeo do WhatsApp deitado ou travando | A skill corrige sozinha (normaliza rotação e quadros por segundo). |
| /design indisponível | Use `rápido`: as imagens saem como PNG. O /design exige uma conta com Claude Design. |

## Estrutura do repositório
```
skills/instagram-conteudo/  SKILL.md · guia-design.md · modelo/ · scripts/ (render, novo-projeto)
skills/reels-conteudo/      SKILL.md · formatos.md · ganchos.md · producao.md · scripts/ (mixar-audio, teleprompter) · assets/sfx
skills/editar-video/        SKILL.md · brainstorm.md · estilos-edicao.md · modelo-remotion/ · scripts/ · assets/ (sons, modelo de rosto)
comandos/                   atalhos dos comandos
exemplos/cafeteria-exemplo/ projeto fictício de exemplo
```

## Regras que as skills seguem
- Nunca inventam fatos, números, depoimentos ou resultados; nunca citam concorrentes.
- Nunca publicam nas redes.
- Nunca imitam a voz de uma pessoa real sem autorização.
- Nunca misturam dados de projetos diferentes.

## Créditos
- Sons e trilha em `assets/sfx`: sintetizados, sem direitos de terceiros.
- Detecção de rosto: modelo YuNet do [OpenCV Zoo](https://github.com/opencv/opencv_zoo) (licença MIT), em `skills/editar-video/assets/modelos`.
- Edição renderizada com [Remotion](https://www.remotion.dev): uso grátis para pessoas e empresas pequenas; confira a [licença do Remotion](https://www.remotion.dev/license) se a sua empresa for maior.

## Licença
MIT © André Azevedo (veja `LICENSE`).
