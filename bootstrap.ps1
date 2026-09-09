Set-StrictMode -Version 1
$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot
Set-Location -LiteralPath $Root

$utf8 = New-Object System.Text.UTF8Encoding $false
$reqFile = Join-Path $Root 'requirements.txt'
$reqLines = 'fastapi>=0.115.0', 'uvicorn[standard]>=0.32.0', 'python-dotenv>=1.0.1', 'pydantic>=2.9.0', 'google-adk>=1.15.0', 'google-genai>=1.0.0', 'parallel-web>=0.3.0'
[System.IO.File]::WriteAllLines($reqFile, $reqLines, $utf8)
Write-Host 'wrote utf-8 requirements.txt'

function Convert-WideFile($file) {
  $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
  if ($bytes.Length -lt 4) { return }
  $wide = ($bytes[0] -eq 255 -and $bytes[1] -eq 254) -or ($bytes[1] -eq 0 -and $bytes[3] -eq 0)
  if (-not $wide) { return }
  $text = [System.Text.Encoding]::Unicode.GetString($bytes)
  if ($text.StartsWith([char]0xFEFF)) { $text = $text.Substring(1) }
  [System.IO.File]::WriteAllText($file.FullName, $text, $utf8)
  Write-Host ('utf-8 ' + $file.FullName)
}

Get-ChildItem -LiteralPath $Root -Recurse -File | Where-Object {
  $n = $_.FullName
  $okExt = $_.Extension -in '.py', '.ts', '.tsx', '.js', '.json', '.css', '.html', '.md', '.yml', '.yaml', '.txt', '.example'
  $skip = $n.Contains('\.venv\') -or $n.Contains('\node_modules\') -or $n.Contains('\dist\')
  $okExt -and -not $skip
} | ForEach-Object { Convert-WideFile $_ }

$venvPy = Join-Path $Root '.venv\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $venvPy)) {
  python -m venv .venv
}

Start-Process -FilePath $venvPy -ArgumentList '-m','pip','install','--upgrade','pip' -Wait -NoNewWindow
Start-Process -FilePath $venvPy -ArgumentList '-m','pip','install','-r','requirements.txt' -Wait -NoNewWindow -WorkingDirectory $Root

$fe = Join-Path $Root 'frontend'
Set-Location -LiteralPath $fe
npm install

Write-Host 'Open this in the browser: http://127.0.0.1:5173'

Start-Process -FilePath $venvPy -ArgumentList '-m','uvicorn','app.main:app','--reload','--port','8080' -WorkingDirectory $Root
npm run dev
