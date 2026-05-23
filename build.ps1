Set-Location $PSScriptRoot

Write-Host "`n=== Images ===" -ForegroundColor Cyan
if (Test-Path compress.py) {
  python compress.py
  if ($LASTEXITCODE -ne 0) { Write-Host "compress.py failed" -ForegroundColor Red; exit 1 }
}

Write-Host "`n=== Minify JS ===" -ForegroundColor Cyan
$before = (Get-Item app.js).Length
npx terser app.js --compress --mangle --output app.min.js
if ($LASTEXITCODE -ne 0) { Write-Host "terser failed" -ForegroundColor Red; exit 1 }
$after = (Get-Item app.min.js).Length
Write-Host ("app.js {0}KB -> app.min.js {1}KB ({2}% smaller)" -f `
    [math]::Round($before/1KB,1), [math]::Round($after/1KB,1), [math]::Round((1-$after/$before)*100))

Write-Host "`n=== Validate cenote JSON ===" -ForegroundColor Cyan
python -c "import json,sys; d=json.load(open('data/cenotes.json',encoding='utf-8')); print(f'  {len(d[\"cenotes\"])} cenotes OK')"
if ($LASTEXITCODE -ne 0) { Write-Host "cenotes.json invalid" -ForegroundColor Red; exit 1 }

Write-Host "`nDone. Stage and commit as usual." -ForegroundColor Green
