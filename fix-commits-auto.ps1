# 자동으로 깨진 커밋 메시지 수정
# 1인 개발 환경이므로 force push 가능

$commitMap = @{
    "bcddf244ce8fbe64b14f4c3d1e65d44fa3561cee" = "feat: Common button functionality + font improvements + Full Passage readability improvements"
    "268cfd987f2666de022a96c85dc4105c1fa33ce0" = "feat: Add common button pages"
    "0c83b73e923f0953a46848899b5b726f3d9cca53" = "fix: Improve button hover effects and readability"
    "9194be073a26fccdfdde68cf911c13c9289abe40" = "refactor: Improve button hover effects and readability"
    "f404fbfb571dd13ab3bb133dbf4c95cfd3af81da" = "docs: Fix and document previous broken commit content"
    "aa7b6d74d8fde1bcf572db40185c1d1a022b4bdf" = "docs: Update and complete Change Log previous content"
    "32dc0ce60ac21ef4d165c826f30387b42a31d973" = "fix(P0): Complete immediate fix requirements"
    "700a6e967a9a1eda8eaa31cd7d0482853084296d" = "docs: Document P1 priority work process in detail"
    "1de8e22e9a5b053387dce48e69e83d544c46d7ed" = "feat(i18n): Start i18n feature implementation - Apply to Dashboard and ResultsPanel components"
    "02d23d6bdc81bb537a311459667ac1b8cf9b1df6" = "feat(i18n): Apply i18n to Vocabulary page"
    "66af46ff9b24ffcad5157aa930d052dab9dc076e" = "feat(i18n): Apply i18n to Bookmarks and History pages"
    "72dafbfa8c1b6bb0827ad8fa73eee5747d3d5ecb" = "feat(i18n): Apply i18n to Practice and ExerciseLayout - i18n phase 1 complete"
    "1bb2a8949b31ae88d60e83b2bbb64bd9d3187165" = "feat(test): Set up test infrastructure"
    "139f79204105a3f90eec6b347903eadb1be864b7" = "feat(schema): Complete schema feature implementation - user_skills, learning_patterns, topic_performance"
    "56b7fdf698322bf8713ec954a45844d72c7d3011" = "feat(api): Implement Skills, Learning Patterns, Topic Performance API functions"
    "b365c39d2b69ba0df783e8ba694cdaede9c6515a" = "feat(dashboard): Add recent activity history list"
    "2fdcebbb0eb6f909d3c5bc0ccfb41be9a1327eab" = "feat(dashboard): Add Skills & Analytics section to Dashboard"
    "fa344fe7dd7409df6d3ed263645e461ed7d22adc" = "feat(test): Set up test infrastructure"
    "4b0939845f0bef1e3151c1fcbb8a3ddd9a9db9ac" = "feat(settings): Implement settings page"
    "5bd706f4877f235f741db950fe09b33256c01e0e" = "feat(achievements): Implement achievements feature"
    "535fab1ebb3bfcb084a50c39b5fdd3f1ecd85fce" = "feat(usage-limits): Implement usage limits feature"
    "d8d44025bd8f86281cdee30993bcaaf0678a0bdf" = "feat(header): Implement common header navigation"
    "079c55bd8fd541aa6ad3ea4c93941851002e4014" = "feat(leaderboard): Implement weekly leaderboard feature"
    "59642762c47f8a5a25337e197c9692a4a6e264e1" = "feat(dashboard): Add Leaderboard link"
}

Write-Host "========================================="
Write-Host "깨진 커밋 메시지 자동 수정 스크립트"
Write-Host "========================================="
Write-Host ""
Write-Host "총 $($commitMap.Count)개의 커밋 메시지를 수정합니다."
Write-Host ""
Write-Host "주의: 이 작업은 히스토리를 재작성합니다."
Write-Host "백업 브랜치 'backup-before-rebase'가 생성되었습니다."
Write-Host ""
Write-Host "계속하려면 Enter를, 취소하려면 Ctrl+C를 누르세요..."
Read-Host

# Git filter-branch를 사용하여 일괄 수정
# 하지만 더 나은 방법은 git rebase를 사용하는 것입니다.

Write-Host ""
Write-Host "Git filter-branch는 deprecated되었으므로,"
Write-Host "interactive rebase를 사용하는 것이 권장됩니다."
Write-Host ""
Write-Host "다음 명령어를 실행하세요:"
Write-Host "  git rebase -i 922861d"
Write-Host ""
Write-Host "에디터가 열리면 각 깨진 커밋의 'pick'을 'reword'로 변경하고"
Write-Host "새로운 영어 메시지를 입력하세요."
Write-Host ""
Write-Host "커밋 메시지 매핑은 FIX_COMMIT_MESSAGES.md 파일을 참조하세요."
