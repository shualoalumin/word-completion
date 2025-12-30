# 📚 Documentation

> TOEFL iBT 학습 앱 개발 문서

---

## 📁 Folder Structure

```
docs/
├── architecture/        # 시스템 설계
├── algorithms/          # 알고리즘 & 로직
├── guides/              # 설정 가이드
├── troubleshooting/     # 문제 해결
└── development-summary.md
```

---

## 🏗️ Architecture (시스템 설계)

| 문서 | 설명 |
|------|------|
| [Database Schema](architecture/database-schema.md) | 41개 테이블, Phase 1-5 설계 |

---

## 🧮 Algorithms (알고리즘)

| 문서 | 설명 |
|------|------|
| [ETS Text Completion](algorithms/ets-text-completion-algorithm.md) | ETS 출제 알고리즘 분석, 56개 토픽 풀 |

---

## 📖 Guides (설정 가이드)

| 문서 | 설명 |
|------|------|
| [Supabase Setup](guides/supabase-setup.md) | Auth, DB, Edge Functions 설정 |

---

## 🔧 Troubleshooting (문제 해결)

| 문서 | 상태 | 설명 |
|------|------|------|
| [Spacing Issues](troubleshooting/spacing-issues.md) | ✅ Fixed | AI 생성 공백 누락 문제 |

---

## 📋 Main Documents

| 문서 | 설명 |
|------|------|
| [Development Summary](development-summary.md) | 전체 프로젝트 진행 상황 요약 |

---

## 🔍 Quick Reference

```
DB 설계 문제?      → architecture/database-schema.md
AI 문제 생성?      → algorithms/ets-text-completion-algorithm.md
Supabase 설정?    → guides/supabase-setup.md
버그/에러?        → troubleshooting/
전체 현황?        → development-summary.md
```

---

## 📝 Adding New Documents

### Naming Convention

```
kebab-case.md

✅ spacing-issues.md
✅ database-schema.md
❌ SpacingIssues.md
❌ database_schema.md
```

### Document Template

```markdown
# Title

> **Date**: YYYY-MM-DD  
> **Status**: 🚧 WIP | ✅ Complete  

---

## Overview

...

## Details

...

## Related

- [Related Doc](path/to/doc.md)
```

