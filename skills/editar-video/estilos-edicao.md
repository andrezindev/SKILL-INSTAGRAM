# Estilos de edição (presets)

| Estilo | Cortes | Legendas | Zooms | Overlays | Áudio |
|---|---|---|---|---|---|
| **Viral** | bem agressivos (respiro 0,08 s) | palavra a palavra, emojis nas palavras comuns | jump cut a cada 2 a 3,5 s + punch a cada ~3 s | algo novo a cada 2 a 3 s: emoji, comparativo, palavra gigante, callout | música 13%, pop/ding automáticos |
| **Limpo** | silêncios e erros | frase por vez, discretas | 1 a cada 12 s, leves (1,10) | só título inicial e CTA | voz; música 8% |
| **Dinâmico** | agressivos (respiro 0,1 s) | palavra a palavra, destaque nas palavras-chave | 1 a cada 5 a 8 s (1,15 a 1,22) | algo novo a cada 3 a 4 s: título, número, callout, lista | música 12%, SFX leves a cada entrada |
| **Tutorial com tela** | médios | palavra a palavra | poucos | `terminal` / `imagem` / `lista` com `pip` nos passos; título por passo | música 8%, `tick` na digitação, `ding` no sucesso |
| **História** | suaves (respiro 0,25 s) | frase por vez | zoom lento nos momentos emotivos | poucos: título e frase de impacto | música 14% |

## Recursos novos
- `punch: [tempos]` soco de zoom curto nas palavras fortes (o planejador sugere).
- Transições: `flash`, `wipe`, `zoom` (empurra a câmera), `glitch` (só tema tech, com moderação).
- Legenda: `estilo` `pilula` | `caixa` | `karaoke`; `emojis: {"palavra": "🎬"}` acrescenta a figurinha ao lado da frase.
- Overlays: `emoji` `{ "tipo": "emoji", "t": 9.3, "d": 1.2, "emoji": "🎬", "x": 0.8, "y": 0.62 }` · `comparativo` `{ "tipo": "comparativo", "t": 5.7, "d": 2.6, "titulo": "Editar *vídeo*", "antes": { "rotulo": "Na mão", "itens": ["Horas cortando", "Legenda manual"] }, "depois": { "rotulo": "Com a skill", "itens": ["Um comando", "Motion pronto"] } }` (até 3 itens por lado) · `progresso` `{ "tipo": "progresso", "t": 21.5, "d": 2.0, "texto": "Instalando a skill" }`.

## Ritmo
- Gancho nos 2 primeiros segundos: o título ou a frase mais forte logo no início.
- No dinâmico: nunca mais de 3 s sem mudança visual. No limpo: nunca mais de 8 s.
- O CTA aparece nos últimos 3 a 4 s e fica legível por no mínimo 2 s.
- Uma cor de destaque só; fundo e cartões do tema.

## Exemplo de `edit.json` (vídeo mostrando as skills no Claude Code)
```json
{
  "duracao": 38.4,
  "video": "video.mp4",
  "tema": { "bg": "#14100D", "fg": "#FFF7EE", "acc": "#FF6B1A", "acc2": "#FFC83D", "card": "#241C17", "muted": "#B8A99B" },
  "legendas": { "ativo": true, "posicao": "baixo", "destaques": ["Claude", "skills", "grátis"], "palavras": [ { "w": "Olha", "t": 0.2, "f": 0.5 } ] },
  "zooms": [ { "t": 3.0, "d": 1.4, "escala": 1.18, "x": 0.5, "y": 0.4 } ],
  "overlays": [
    { "tipo": "titulo", "t": 0.5, "d": 2.5, "texto": "Conteúdo do dia em 1 comando", "sub": "Skills para o Claude Code" },
    { "tipo": "terminal", "t": 8.0, "d": 7.0, "pip": true, "titulo": "Claude Code",
      "linhas": [ { "tipo": "cmd", "texto": "/instagram-conteudo" }, { "tipo": "out", "texto": "Planejando 6 stories e 3 posts..." }, { "tipo": "ok", "texto": "Design publicado" } ] },
    { "tipo": "lista", "t": 16.0, "d": 4.5, "pip": true, "titulo": "O que ela entrega", "itens": ["6 stories", "3 posts", "Carrossel"] },
    { "tipo": "imagem", "t": 22.0, "d": 4.0, "arquivo": "print-design.png", "legenda": "Tudo desenhado no /design", "pip": true },
    { "tipo": "numero", "t": 28.0, "d": 2.5, "numero": "9", "rotulo": "peças por dia" },
    { "tipo": "cta", "t": 34.0, "d": 4.0, "texto": "Baixe grátis no GitHub", "url": "github.com/andrezindev/SKILL-INSTAGRAM" }
  ],
  "musica": { "arquivo": "music.wav", "volume": 0.12, "abaixa": true },
  "sfx": [ { "t": 0.5, "nome": "whoosh" }, { "t": 8.0, "nome": "pop" }, { "t": 14.2, "nome": "ding" } ]
}
```
Campos de overlay: `t` (início, s), `d` (duração, s), e os específicos de cada `tipo` (veja `modelo-remotion/src/tipos.ts`). `callout` aceita `x` e `y` (0 a 1) para posicionar. Arquivos de imagem ficam ao lado do `edit.json`; `montar.mjs` copia.
