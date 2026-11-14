#!/usr/bin/env bash
# Instala as skills em ~/.claude/skills e cria a pasta de projetos.
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
DEST="${CLAUDE_HOME:-$HOME/.claude}"
mkdir -p "$DEST/skills" "$DEST/conteudo"
for s in instagram-conteudo reels-conteudo; do
  rm -rf "$DEST/skills/$s"
  cp -r "$DIR/skills/$s" "$DEST/skills/$s"
  echo "instalada: $DEST/skills/$s"
done
echo "Projetos ficam em: $DEST/conteudo  (cada projeto em sua pasta)"
echo "Abra uma conversa nova no Claude Code e use /instagram-conteudo ou /reels-conteudo."
