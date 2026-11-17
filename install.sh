#!/usr/bin/env bash
# Instala as 3 skills (instagram-conteudo, reels-conteudo, editar-video) no Claude Code - macOS/Linux.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="${CLAUDE_HOME:-$HOME/.claude}"
mkdir -p "$DEST/skills" "$DEST/commands" "$DEST/conteudo" "$DEST/editar-video"
for s in instagram-conteudo reels-conteudo editar-video; do
  T="$DEST/skills/$s"; KEEP=""
  if [ -d "$T/modelo-remotion/node_modules" ]; then KEEP="$(mktemp -d)"; mv "$T/modelo-remotion/node_modules" "$KEEP/"; fi
  rm -rf "$T"; cp -r "$DIR/skills/$s" "$T"
  if [ -n "$KEEP" ]; then mv "$KEEP/node_modules" "$T/modelo-remotion/"; rm -rf "$KEEP"; fi
  cp -f "$DIR/comandos/$s.md" "$DEST/commands/$s.md"
  echo "instalada: /$s"
done
[ -f "$DEST/editar-video/preferencias.md" ] || cp "$DIR/skills/editar-video/modelo-preferencias.md" "$DEST/editar-video/preferencias.md"
[ -f "$DEST/editar-video/glossario.json" ] || cp "$DIR/skills/editar-video/modelo-glossario.json" "$DEST/editar-video/glossario.json"
echo; echo "Verificando o computador..."
if command -v python3 >/dev/null; then python3 "$DEST/skills/editar-video/scripts/verificar.py" || true; else echo "Python não encontrado: instale em https://python.org"; fi
echo; echo "Pronto! Abra uma conversa nova no Claude Code e digite: /instagram-conteudo  /reels-conteudo  /editar-video"
echo 'Se faltar algo acima, peça ao Claude: "instala o que falta para as skills".'
