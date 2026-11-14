# Instala as skills em ~/.claude/skills e cria a pasta de projetos (Windows).
$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dest = if ($env:CLAUDE_HOME) { $env:CLAUDE_HOME } else { Join-Path $HOME '.claude' }
New-Item -ItemType Directory -Force -Path (Join-Path $dest 'skills'), (Join-Path $dest 'conteudo') | Out-Null
foreach ($s in 'instagram-conteudo', 'reels-conteudo') {
  $target = Join-Path $dest "skills\$s"
  if (Test-Path $target) { Remove-Item -Recurse -Force $target }
  Copy-Item -Recurse (Join-Path $dir "skills\$s") $target
  Write-Host "instalada: $target"
}
Write-Host "Projetos ficam em: $(Join-Path $dest 'conteudo')  (cada projeto em sua pasta)"
Write-Host 'Abra uma conversa nova no Claude Code e use /instagram-conteudo ou /reels-conteudo.'
