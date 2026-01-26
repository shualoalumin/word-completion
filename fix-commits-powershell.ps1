# PowerShell 버전 - 커밋 메시지 자동 수정
# 주의: 이 스크립트는 Git Bash의 filter-branch를 사용합니다

Write-Host "========================================="
Write-Host "커밋 메시지 자동 수정 스크립트"
Write-Host "========================================="
Write-Host ""
Write-Host "주의: 이 작업은 히스토리를 재작성합니다."
Write-Host "백업 브랜치 'backup-before-rebase'가 생성되어 있는지 확인하세요."
Write-Host ""
$confirm = Read-Host "계속하려면 'yes'를 입력하세요"

if ($confirm -ne "yes") {
    Write-Host "작업이 취소되었습니다."
    exit
}

# Git Bash 경로
$gitBashPath = "C:\Program Files\Git\bin\bash.exe"
$scriptPath = Join-Path $PWD "fix-commit-messages.sh"

if (-not (Test-Path $gitBashPath)) {
    Write-Host "오류: Git Bash를 찾을 수 없습니다."
    Write-Host "Git Bash에서 직접 실행하세요: bash fix-commit-messages.sh"
    exit 1
}

Write-Host ""
Write-Host "Git Bash에서 스크립트를 실행합니다..."
Write-Host ""

# Git Bash 실행
& $gitBashPath $scriptPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================="
    Write-Host "커밋 메시지 수정 완료!"
    Write-Host "========================================="
    Write-Host ""
    Write-Host "다음 단계:"
    Write-Host "1. 결과 확인: git log --oneline -30"
    Write-Host "2. Force push: git push --force-with-lease origin main"
} else {
    Write-Host ""
    Write-Host "오류가 발생했습니다. Git Bash에서 직접 실행해보세요:"
    Write-Host "  bash fix-commit-messages.sh"
}
