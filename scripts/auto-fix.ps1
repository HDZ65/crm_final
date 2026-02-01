# auto-fix.ps1 - Lance le build et appelle Claude Code si erreur
param(
    [int]$MaxAttempts = 3,
    [string]$BuildCommand = "npm run build"
)

$ProjectPath = "C:\Users\kille\Desktop\app\crm_final"
$Attempt = 0

Set-Location $ProjectPath

while ($Attempt -lt $MaxAttempts) {
    $Attempt++
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  Tentative $Attempt / $MaxAttempts" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    # Lance le build et capture la sortie
    $ErrorLog = "$env:TEMP\build-error-$([guid]::NewGuid().ToString().Substring(0,8)).log"
    
    Write-Host "Running: $BuildCommand" -ForegroundColor Yellow
    $process = Start-Process -FilePath "cmd.exe" -ArgumentList "/c $BuildCommand 2>&1" -WorkingDirectory $ProjectPath -NoNewWindow -Wait -PassThru -RedirectStandardOutput $ErrorLog
    
    $BuildOutput = Get-Content $ErrorLog -Raw -ErrorAction SilentlyContinue
    $ExitCode = $process.ExitCode
    
    if ($ExitCode -eq 0) {
        Write-Host "`n✅ BUILD REUSSI!" -ForegroundColor Green
        Remove-Item $ErrorLog -ErrorAction SilentlyContinue
        exit 0
    }
    
    Write-Host "`n❌ Build échoué (code $ExitCode)" -ForegroundColor Red
    Write-Host "Erreur capturée, envoi à Claude Code...`n" -ForegroundColor Yellow
    
    # Extrait les dernières lignes d'erreur (les plus pertinentes)
    $ErrorLines = if ($BuildOutput) { 
        $lines = $BuildOutput -split "`n" | Select-Object -Last 100
        $lines -join "`n"
    } else { 
        "Build failed with exit code $ExitCode" 
    }
    
    # Prépare le prompt pour Claude Code
    $Prompt = @"
Le build a échoué. Voici l'erreur:

``````
$ErrorLines
``````

Analyse l'erreur et corrige le code. Une fois corrigé, dis "DONE".
"@

    # Lance Claude Code
    Write-Host "Lancement de Claude Code..." -ForegroundColor Magenta
    $env:CLAUDE_SKIP_PROJECT_INIT = "true"
    
    # Écrit le prompt dans un fichier temporaire pour éviter les problèmes d'échappement
    $PromptFile = "$env:TEMP\claude-prompt-$([guid]::NewGuid().ToString().Substring(0,8)).txt"
    $Prompt | Out-File -FilePath $PromptFile -Encoding UTF8
    
    # Lance Claude Code avec le prompt
    Get-Content $PromptFile | claude --dangerously-skip-permissions
    
    # Nettoyage
    Remove-Item $PromptFile -ErrorAction SilentlyContinue
    Remove-Item $ErrorLog -ErrorAction SilentlyContinue
    
    Write-Host "`nClaude Code terminé. Relance du build..." -ForegroundColor Cyan
}

Write-Host "`n❌ Échec après $MaxAttempts tentatives." -ForegroundColor Red
exit 1
