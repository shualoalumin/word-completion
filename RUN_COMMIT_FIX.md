# 커밋 메시지 수정 실행 가이드

## 현재 상태
- ✅ 백업 브랜치 생성 완료: `backup-before-rebase`
- ✅ Git 인코딩 설정 완료: UTF-8
- ✅ 커밋 메시지 매핑 준비: `FIX_COMMIT_MESSAGES.md`
- ✅ 중요 버그 수정 커밋 완료: useQueryClient import 추가
- ✅ 변경사항 stash 완료

## 실행 방법

### 방법 1: Git Bash에서 스크립트 실행 (권장)

1. **Git Bash 열기**
   - Windows 시작 메뉴에서 "Git Bash" 검색 후 실행
   - 또는 프로젝트 폴더에서 우클릭 → "Git Bash Here"

2. **스크립트 실행**
   ```bash
   bash fix-commit-messages.sh
   ```

3. **확인 후 Enter 입력**
   - 경고 메시지가 나오면 Enter를 눌러 계속

4. **완료 후 확인**
   ```bash
   git log --oneline -30
   ```
   - 깨진 한글 메시지가 영어로 변경되었는지 확인

5. **Force Push**
   ```bash
   git push --force-with-lease origin main
   ```

### 방법 2: Git Bash에서 직접 filter-branch 실행

```bash
export FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch -f --msg-filter 'sh commit-message-filter.sh' -- --all
```

### 방법 3: Interactive Rebase (수동)

```bash
git rebase -i 922861d
```

에디터에서 각 깨진 커밋의 `pick`을 `reword`로 변경하고, `FIX_COMMIT_MESSAGES.md`의 매핑 테이블을 참조하여 영어 메시지 입력.

## 주의사항

⚠️ **중요**: 
- 히스토리가 재작성되므로 force push가 필요합니다
- 1인 개발 환경이므로 안전하지만, 백업 브랜치가 있는지 확인하세요
- 작업 중 다른 Git 작업을 하지 마세요

## 완료 후

1. Stash 복원 (필요시):
   ```bash
   git stash pop
   ```

2. 임시 파일 정리:
   - `.gitignore`에 이미 추가되어 있으므로 자동으로 무시됨

3. 결과 확인:
   ```bash
   git log --oneline --all | grep -E "(feat|fix|docs|refactor)" | head -30
   ```
