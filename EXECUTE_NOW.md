# 🚀 커밋 메시지 수정 - 지금 실행하세요!

## 준비 완료 ✅
- 백업 브랜치: `backup-before-rebase` ✅
- Git 인코딩: UTF-8 설정 완료 ✅
- 스크립트 파일: `commit-message-filter.sh` ✅
- 중요 버그 수정: useQueryClient import 커밋 완료 ✅

## 실행 방법 (Git Bash)

### 옵션 1: 스크립트 사용 (권장)
```bash
bash fix-commit-messages.sh
```

### 옵션 2: 직접 filter-branch 실행
```bash
export FILTER_BRANCH_SQUELCH_WARNING=1
git filter-branch -f --msg-filter 'sh commit-message-filter.sh' -- --all
```

## 실행 후 확인

```bash
# 결과 확인 (깨진 메시지가 영어로 변경되었는지)
git log --oneline -30

# Force push
git push --force-with-lease origin main
```

## 문제 발생 시

만약 오류가 발생하면:
1. `git filter-branch --abort` 로 중단
2. `git reset --hard backup-before-rebase` 로 복구
3. 다시 시도

## 참고 파일
- 커밋 매핑: `FIX_COMMIT_MESSAGES.md`
- 상세 가이드: `RUN_COMMIT_FIX.md`
