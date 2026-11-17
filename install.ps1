# Instala as 3 skills (instagram-conteudo, reels-conteudo, editar-video) no Claude Code - Windows.
# Uso: powershell -ExecutionPolicy Bypass -File install.ps1
$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dest = if ($env:CLAUDE_HOME) { $env:CLAUDE_HOME } else { Join-Path $HOME '.claude' }
New-Item -ItemType Directory -Force -Path (Join-Path $dest 'skills'), (Join-Path $dest 'commands'), (Join-Path $dest 'conteudo'), (Join-Path $dest 'editar-video') | Out-Null
foreach ($s in 'instagram-conteudo', 'reels-conteudo', 'editar-video') {
  $target = Join-Path $dest "skills\$s"
  $deps = Join-Path $target 'modelo-remotion\node_modules'
  $guardar = $null
  if (Test-Path $deps) { $guardar = Join-Path $env:TEMP "deps-editar-video"; if (Test-Path $guardar) { Remove-Item -Recurse -Force $guardar }; Move-Item $deps $guardar }
  if (Test-Path $target) { Remove-Item -Recurse -Force $target }
  Copy-Item -Recurse (Join-Path $dir "skills\$s") $target
  if ($guardar) { Move-Item $guardar $deps }
  Copy-Item -Force (Join-Path $dir "comandos\$s.md") (Join-Path $dest "commands\$s.md")
  Write-Host "instalada: /$s"
}
# memoria do editar-video (so cria se nao existir: suas preferencias nunca sao apagadas)
$pref = Join-Path $dest 'editar-video\preferencias.md'
if (-not (Test-Path $pref)) { Copy-Item (Join-Path $dir 'skills\editar-video\modelo-preferencias.md') $pref }
$glos = Join-Path $dest 'editar-video\glossario.json'
if (-not (Test-Path $glos)) { Copy-Item (Join-Path $dir 'skills\editar-video\modelo-glossario.json') $glos }
Write-Host ''
Write-Host 'Verificando o computador...'
$py = Get-Command python -ErrorAction SilentlyContinue
if ($py) { & python (Join-Path $dest 'skills\editar-video\scripts\verificar.py') } else { Write-Host 'Python nao encontrado: instale em https://python.org (necessario para editar video e audio).' }
Write-Host ''
Write-Host 'Pronto! Feche e abra o Claude Code (ou abra uma conversa nova) e digite:'
Write-Host '  /instagram-conteudo   /reels-conteudo   /editar-video'
Write-Host 'Se faltar algo acima, peca ao Claude: "instala o que falta para as skills".'
