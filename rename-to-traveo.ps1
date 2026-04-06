# PowerShell Script to rename DITMATE to Traveo throughout the project

Write-Host "🔄 Renaming DITMATE to Traveo..." -ForegroundColor Cyan

function Replace-InFile {
    param($FilePath)
    
    if (Test-Path $FilePath) {
        $content = Get-Content $FilePath -Raw
        $content = $content -replace 'DITMATE\+', 'Traveo+'
        $content = $content -replace 'DITMATE', 'Traveo'
        $content = $content -replace 'ditmate', 'traveo'
        $content = $content -replace 'DitMate', 'Traveo'
        Set-Content $FilePath $content -NoNewline
        Write-Host "✓ Updated: $FilePath" -ForegroundColor Green
    }
}

# Update main files
Replace-InFile "README.md"
Replace-InFile "package.json"
Replace-InFile "client\package.json"
Replace-InFile "server\package.json"

# Update client source files
Get-ChildItem -Path "client\src" -Recurse -Include *.js,*.jsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace 'DITMATE\+', 'Traveo+'
    $content = $content -replace 'DITMATE', 'Traveo'
    $content = $content -replace 'ditmate', 'traveo'
    $content = $content -replace 'DitMate', 'Traveo'
    Set-Content $_.FullName $content -NoNewline
}

# Update server files
Get-ChildItem -Path "server" -Recurse -Include *.js,*.json -Exclude node_modules | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace 'DITMATE\+', 'Traveo+'
    $content = $content -replace 'DITMATE', 'Traveo'
    $content = $content -replace 'ditmate', 'traveo'
    $content = $content -replace 'DitMate', 'Traveo'
    Set-Content $_.FullName $content -NoNewline
}

# Update documentation files
Get-ChildItem -Path "." -Filter *.md | ForEach-Object {
    Replace-InFile $_.FullName
}

# Update start scripts
Replace-InFile "start.bat"
Replace-InFile "start.ps1"

Write-Host "`n✅ Renaming complete! DITMATE → Traveo" -ForegroundColor Green
Write-Host "⚠️  Note: You may need to restart your dev servers for changes to take effect" -ForegroundColor Yellow
