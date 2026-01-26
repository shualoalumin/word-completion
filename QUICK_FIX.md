# 빠른 실행 가이드

## Git Bash에서 한 줄로 실행

```bash
export FILTER_BRANCH_SQUELCH_WARNING=1 && git filter-branch -f --msg-filter 'sh commit-message-filter.sh' -- --all
```

## 또는 스크립트 실행

```bash
bash fix-commit-messages.sh
```

## 완료 후

```bash
# 결과 확인
git log --oneline -30

# Force push
git push --force-with-lease origin main
```

## 문제 해결

만약 "sh: commit-message-filter.sh: No such file or directory" 오류가 나면:

```bash
# 현재 디렉토리 확인
pwd

# 파일 존재 확인
ls -la commit-message-filter.sh

# 절대 경로로 실행
git filter-branch -f --msg-filter "sh $(pwd)/commit-message-filter.sh" -- --all
```
