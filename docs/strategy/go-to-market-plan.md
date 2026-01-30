# Go-to-Market & Monetization Strategy

> **작성일**: 2026-01-30
> **기반 자료**: `docs/Reddit-Review/strategy-analysis.md`, 코드베이스 전체 점검
> **상태**: 전략 수립 → 실행 대기

---

## 0. 현황 진단 (Honest Assessment)

### 준비된 것

| 영역 | 상태 | 근거 |
|------|------|------|
| 핵심 기능 (Complete the Words) | **100%** | 55+ 문제, AI 생성, 난이도 조절, 점수/피드백 |
| 인증 시스템 | **100%** | Google OAuth + 데모 모드 |
| 학습 기록 & 대시보드 | **100%** | 스트릭, 점수 추적, 최근 활동 |
| Vocabulary 학습 | **100%** | SM-2 간격반복, 3가지 리뷰 모드 |
| 구독 모델 아키텍처 | **코드 완료** | `subscription.ts`, 환경변수 전환 구조 |
| 배포 파이프라인 | **100%** | Cloudflare Pages 자동 배포, Edge Functions |

### 준비 안 된 것 (블로커)

| 영역 | 상태 | 마케팅 전 필요 여부 |
|------|------|---------------------|
| Google Analytics / 이벤트 추적 | **0%** | **필수** - 트래픽 측정 없으면 ROI 판단 불가 |
| 랜딩 페이지 마케팅 카피 | **기본만** | **필수** - 현재 "Master Your English Skills"는 너무 범용적 |
| SEO (meta/OG tags) | **0%** | **필수** - Reddit 링크 공유 시 프리뷰가 안 뜸 |
| Stripe 결제 | **0%** | 1차 론칭에는 불필요, 2차에서 추가 |
| 사용량 제한 적용 | **0%** | 1차에는 불필요 (testing 모드 유지) |
| AdSense | **0%** | **비추천** (아래 분석 참조) |

### 판정

**Reddit soft launch는 가능하지만, 3가지를 먼저 해야 함:**
1. 랜딩 페이지를 Reddit 인사이트 기반으로 리뉴얼
2. GA4 이벤트 트래킹 최소 설치
3. OG meta tags (Reddit/Discord 링크 프리뷰)

---

## 1. 랜딩 페이지 리뉴얼 전략

### 1-1. 현재 문제

현재 랜딩 페이지 (`src/pages/Landing.tsx`):
```
헤드라인: "Master Your English Skills"
서브라인: "Practice with AI-generated exercises tailored to your level."
```

**문제점:**
- 수백 개의 TOEFL 앱과 동일한 제네릭 메시지
- Complete the Words가 왜 중요한지 설명 없음
- 수험생의 pain point에 공감하는 내용 없음
- Reddit에서 공유할 때 "또 다른 TOEFL 앱"으로 보임

### 1-2. 리뉴얼 방향 (Reddit 전략 반영)

**핵심 포지셔닝 변경:**
```
Before: "TOEFL 전체를 위한 AI 연습 도구" (범용)
After:  "Complete the Words에서 점수 새는 거 막아주는 전문 훈련기" (특화)
```

**새 헤드라인 후보 (A/B 테스트용):**

| 옵션 | 헤드라인 | 톤 |
|------|----------|-----|
| A | **Stop Losing Points on Complete the Words** | 직접적, pain point 공략 |
| B | **The TOEFL Trap Nobody Talks About** | 호기심 유발, Reddit 친화적 |
| C | **One Blank = One Full Reading Question. Are You Ready?** | 충격 팩트 기반 |

**추천: 옵션 A** — 명확하고, 검색 친화적이며, 즉시 가치 전달

**새 서브라인:**
```
Each blank in Complete the Words counts as much as a full reading question.
Most test-takers lose points here — not because they don't know the word,
but because they lack a system.
```

### 1-3. 페이지 구조 (섹션별)

```
[1] Hero Section
    - 배지: "TOEFL iBT 2026 New Format"
    - 헤드라인: "Stop Losing Points on Complete the Words"
    - 서브라인: pain point 설명
    - CTA: "Practice Free — No Sign-up Required" / "Sign In to Track Progress"

[2] Problem Section ("Why This Matters")
    - Reddit 후기에서 추출한 3가지 실패 원인:
      ① "한 블랭크가 풀 문제급 비중" — 시각적 비교 (1 blank = 1 reading question)
      ② "전략 없이 감으로 풀면 실력자도 틀림" — 품사 결정 → 알파벳 스캔 순서
      ③ "타이포 한 글자 = 0점" — 철자 실수의 치명성

[3] Solution Section ("How GlobalPrep Helps")
    - AI가 ETS 스타일로 생성한 문제 (55+ 즉시 사용 가능)
    - 난이도별 훈련 (Easy/Medium/Hard)
    - 문맥 기반 힌트 & 어휘 설명
    - 스펠링 오답 패턴 추적 (대시보드)
    - 간격반복 기반 Vocabulary 복습

[4] Social Proof / Credibility
    - "Based on strategies shared by 6+ band scorers on r/ToesfliBT"
    - 수험생이 실제로 틀리는 포인트를 반영한 콘텐츠

[5] Feature Cards (3개 → 4개로 확장)
    ① Complete the Words — 핵심 훈련
    ② Smart Vocabulary — 문맥 기반 단어 학습
    ③ Progress Tracking — 오답 패턴, 시간 분석
    ④ Build a Sentence — Coming Soon

[6] CTA Section (반복)
    - "Try a free session now — see why this section matters"

[7] Footer
    - © 2026 GlobalPrep
    - Links: About, Privacy, Terms
```

---

## 2. 마케팅 메시지 & 워딩 전략

### 2-1. 핵심 메시지 프레임워크

**Target Audience**: TOEFL iBT 준비생 (C1 목표, 주로 비영어권)
**Primary Pain Point**: Complete the Words에서 예상치 못한 점수 손실
**Value Proposition**: 전략 + 반복 훈련 + 오답 분석으로 이 섹션을 확실히 잡아주는 도구

### 2-2. 채널별 메시지 톤

| 채널 | 톤 | 예시 메시지 |
|------|-----|------------|
| **Reddit** | 겸손한 빌더, 후기 기반 | "I kept seeing posts about people losing points on Complete the Words, so I built a free practice tool" |
| **Landing Page** | 신뢰감, 구체적 | "Each blank counts as one full reading question. Practice with 55+ AI-generated exercises." |
| **App 내부** | 코치, 격려 | "You got 8/10! You tend to miss double consonant words — let's work on that." |
| **이메일 (미래)** | 개인화, 데이터 기반 | "Last week you practiced 12 sessions. Your spelling accuracy improved from 72% to 85%." |

### 2-3. 키워드 & 카피 라이브러리

**Pain Point 카피 (공감 유발):**
- "One typo. Zero points. That's how Complete the Words works."
- "You know the word. You just can't spell it under pressure."
- "High scorers fail here too — it's not about vocabulary size."

**Solution 카피 (기능 설명):**
- "AI generates ETS-style passages with 10 blanks each"
- "Practice with context clues, part-of-speech hints, and instant feedback"
- "Track which spelling patterns trip you up most"

**CTA 카피:**
- "Try Free — No account needed"
- "Practice one session right now"
- "See your spelling weak spots"

**Reddit 게시물 제목 후보:**
- "I built a free tool to practice Complete the Words (TOEFL iBT 2026)"
- "Complete the Words cost me 2 points on my TOEFL — so I built a practice tool"
- "Free practice tool for the most underrated TOEFL section"

---

## 3. Reddit 론칭 전략

### 3-1. 타겟 서브레딧

| 서브레딧 | 구독자 규모 | 게시 전략 | 우선순위 |
|----------|------------|-----------|----------|
| r/ToesfliBT | 중간 | 메인 타겟, 직접 경험담 + 도구 공유 | **1순위** |
| r/TOEFL | 큰 | 가치 제공형 글 (전략 요약 + 도구 언급) | **1순위** |
| r/EnglishLearning | 큰 | 간접적, 학습 팁 + 도구 참조 | 2순위 |
| r/languagelearning | 매우 큰 | 간접적, TOEFL 특화 콘텐츠로 눈길 | 3순위 |
| r/SideProject | 중간 | 빌더 스토리, 기술적 관점 | 3순위 |

### 3-2. Reddit 게시물 템플릿

**1차 게시물 (r/ToefliBT, r/TOEFL):**

```markdown
Title: I built a free practice tool for Complete the Words
       (TOEFL iBT 2026 new format)

---

I've been reading a lot of posts here about people losing points
on Complete the Words — the fill-in-the-blank section in Reading.

A few things stood out to me:

1. **Each blank counts as much as a full reading question**
   in scoring
2. **Even strong test-takers lose points** because they don't
   have a systematic approach
3. **Typos are brutal** — you know the word, but one letter
   wrong = zero

So I built a small practice tool specifically for this section:
[link]

What it does:
- AI-generated passages (ETS-style, academic topics)
- 10 blanks per exercise, 3 difficulty levels
- Instant scoring with vocabulary explanations
- Tracks your history and spelling patterns
- Free, no sign-up required to try

It's still early and I'm actively building it,
so feedback is very welcome.

If you've taken the new format, I'd love to hear:
- What made Complete the Words hard for you?
- What kind of practice would help most?
```

**핵심 원칙:**
- 절대 광고처럼 보이면 안 됨
- "I built" / "I'm building" — 인디 빌더 톤
- 커뮤니티 피드백 요청으로 마무리
- 무료라는 점 강조
- 링크는 본문 중간에 자연스럽게 삽입

### 3-3. 론칭 타이밍

- **최적 시기**: 토요일~일요일 오전 (EST 기준) — Reddit 트래픽 피크
- **게시 간격**: 서브레딧별 최소 1주 간격 (스팸 방지)
- **팔로업**: 첫 게시물에 댓글이 달리면 적극 응답, 업데이트 약속

### 3-4. Reddit 론칭 전 체크리스트

- [ ] 랜딩 페이지 리뉴얼 완료
- [ ] GA4 설치 (최소 pageview + CTA click 이벤트)
- [ ] OG meta tags 설정 (Reddit 링크 프리뷰)
- [ ] Reddit 계정 karma 확인 (일부 서브레딧은 최소 karma 필요)
- [ ] 모바일에서 앱 동작 확인 (Reddit 유저의 60%+ 모바일)
- [ ] 데모 모드 (비로그인) 매끄럽게 작동 확인
- [ ] 초기 문제 로딩 속도 확인 (3초 이내)

---

## 4. 수익화 전략 (AdSense vs. Subscription)

### 4-1. AdSense — 왜 지금은 아닌가

| 항목 | 분석 |
|------|------|
| **트래픽 요건** | AdSense 승인에 월 수천 PV 필요 → 현재 0 |
| **RPM 예상** | 교육 니치: $3-8/1000 PV → 월 1만 PV여도 $30-80 |
| **UX 영향** | 학습 앱에 광고는 집중도 저하, 이탈률 증가 |
| **브랜드 영향** | "무료 + 광고" = 저품질 인식 → 프리미엄 전환 어려움 |
| **결론** | **비추천. 구독 모델이 이 제품에 적합.** |

**단, AdSense를 쓸 수 있는 경우:**
- 블로그/콘텐츠 마케팅 페이지 (학습 팁, 전략 가이드)에만 광고 배치
- 앱 자체에는 절대 광고 넣지 않음
- 콘텐츠 마케팅 페이지를 만들면 SEO + AdSense 동시에 가능

### 4-2. 구독 모델 — 이미 설계된 구조 활용

현재 코드에 이미 존재하는 것:
- `src/core/constants/subscription.ts` — 가격 정의 ($4.99/$9.99)
- `src/core/utils/subscription.ts` — tier별 기능 접근 제어
- `VITE_BIZ_MODE` 환경변수로 testing/production 전환
- `subscription-model-ready.md` — 마이그레이션 SQL 준비 완료

**부족한 것:**
- Stripe 연동 (결제 처리)
- `/pricing` 페이지 (가격표 UI)
- Stripe Webhook → Supabase `subscriptions` 테이블 연동
- 결제 실패/환불 처리 로직

### 4-3. 수익화 단계별 전략

```
Phase 1: "Free & Open" (지금 ~ Reddit 론칭 후 2-4주)
├── 모든 기능 무료 (VITE_BIZ_MODE=testing)
├── 사용자 확보 & 피드백 수집
├── GA4로 행동 데이터 수집
└── 목표: 100+ 회원가입, 핵심 지표 확인

Phase 2: "Soft Paywall" (사용자 100+ 달성 후)
├── 가입 없이 3회 무료 체험 유지
├── 기록 저장/통계는 로그인 필요
├── 로그인 유저에게 "Premium Coming Soon" 배너
├── 이메일 수집 시작 (waitlist)
└── 목표: 이메일 리스트 200+, retention 확인

Phase 3: "Premium Launch" (retention 확인 후)
├── VITE_BIZ_MODE=production 전환
├── Stripe 결제 연동
├── Basic $4.99 / Premium $9.99
├── 기존 유저 30일 무료 체험 (그랜드파더링)
├── Pricing 페이지 + 업그레이드 프롬프트
└── 목표: 전환율 5-10%, MRR $50+
```

---

## 5. 구독자 전환 퍼널 설계

### 5-1. 전환 퍼널 구조

```
[방문자] Reddit/검색으로 유입
    │
    ▼
[랜딩 페이지] pain point 공감 → "Try Free" CTA
    │
    ▼
[데모 세션] 로그인 없이 1회 풀기 → 점수 확인
    │
    ├── 잘 했으면: "Want to track your progress? Sign in free."
    └── 못 했으면: "Most people miss these patterns. Sign in to train."
    │
    ▼
[회원가입] Google OAuth (1-click)
    │
    ▼
[무료 사용] 기록 저장, 스트릭, 통계 확인
    │
    ├── 3일 연속 사용: "You're building a streak!"
    ├── 7일 연속 사용: "Unlock AI analysis — upgrade to Premium"
    └── 사용량 한도 도달: "You've used 5 today. Upgrade for unlimited."
    │
    ▼
[구독 전환] Basic $4.99 / Premium $9.99
```

### 5-2. 전환 트리거 포인트

| 트리거 | 메시지 | 타이밍 |
|--------|--------|--------|
| 데모 후 | "Sign in to save your progress" | 첫 세션 완료 직후 |
| 사용량 한도 | "You've practiced 5 times today. Upgrade for unlimited." | 일일 한도 도달 |
| 오답 패턴 발견 | "We found your top spelling weakness. Upgrade to see full analysis." | 5+ 세션 이후 |
| 스트릭 위험 | "Don't break your 7-day streak! Continue with Premium." | 스트릭 끊기기 직전 |
| AI 기능 접근 | "Get AI-powered explanations. Available in Premium." | 문제 리뷰 화면 |

### 5-3. 가격 전략 재검토

현재 설계: Basic $4.99 / Premium $9.99

**제안: 2-tier로 단순화**

| | Free | Pro ($6.99/월) |
|---|---|---|
| 문제 풀기 | 5회/일 | 무제한 |
| 기록 저장 | X | O |
| 통계 & 분석 | X | O |
| 어휘 학습 | 제한적 | 전체 |
| AI 해설 | X | O |
| 스펠링 오답 분석 | X | O |

**이유:**
- 3-tier (anonymous/basic/premium)는 초기 사용자에게 복잡
- $6.99는 $4.99보다 높지만 "하나만 고르면 됨"이라는 단순함이 전환율을 높임
- 경쟁 서비스 (PrepEx, Radius English)도 $5-15 범위
- 연간 결제: $59.99/년 ($5.00/월, 29% 할인)

---

## 6. SEO & 콘텐츠 마케팅 (AdSense 대안)

### 6-1. AdSense 대신 콘텐츠 마케팅으로 트래픽 & 간접 수익

**전략: 블로그 콘텐츠로 SEO 트래픽 → 앱 전환**

계획할 블로그 글 (향후):

| 제목 | 타겟 키워드 | 목적 |
|------|------------|------|
| "TOEFL 2026 Complete the Words: Strategy Guide" | toefl complete the words | SEO 유입 → 앱 CTA |
| "3 Reasons High Scorers Fail Complete the Words" | toefl reading tips | Reddit 전략을 SEO 글로 |
| "How to Stop Losing Points to Typos on TOEFL" | toefl spelling mistakes | pain point SEO |
| "TOEFL 2026 New Format: What Changed" | toefl 2026 new format | 포맷 변경 관심 유입 |

**AdSense 적용 위치:**
- 앱 내부: 절대 X
- 블로그 글: 향후 트래픽 월 5,000+ PV 달성 후 검토 가능
- 현시점: AdSense 보다 구독 전환에 100% 집중이 효율적

### 6-2. OG Meta Tags (Reddit 공유용 — 즉시 필요)

```html
<meta property="og:title" content="GlobalPrep — TOEFL Complete the Words Practice" />
<meta property="og:description" content="Stop losing points on Complete the Words. Practice with AI-generated exercises, track your spelling patterns, and master the most underrated TOEFL section." />
<meta property="og:image" content="https://word-completion.pages.dev/og-image.png" />
<meta property="og:url" content="https://word-completion.pages.dev" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```

**OG Image 필요:** 1200x630px, 앱 스크린샷 + 핵심 카피

---

## 7. 실행 로드맵

### Sprint 1: "Launch Ready" (즉시 실행)

**목표: Reddit에 공유할 수 있는 최소 상태 달성**

```
[ ] 1-1. GA4 설치 (gtag.js)
    - pageview 자동 추적
    - 이벤트: cta_click, demo_start, exercise_complete, sign_up
    - 파일: index.html + 이벤트 훅 추가

[ ] 1-2. OG meta tags 추가
    - index.html에 meta tags
    - OG image 제작 (1200x630)

[ ] 1-3. 랜딩 페이지 리뉴얼
    - Hero: 새 헤드라인/서브라인
    - Problem section 추가
    - Solution section 추가
    - Feature cards 업데이트
    - CTA 워딩 변경
    - Footer 2026 업데이트

[ ] 1-4. 모바일 QA
    - Reddit 유입의 60%+ 모바일
    - 핵심 플로우 모바일 테스트
```

### Sprint 2: "Reddit Launch" (Sprint 1 완료 후)

```
[ ] 2-1. Reddit 게시물 작성 & 게시
    - r/ToefliBT 1차
    - r/TOEFL 1주 후

[ ] 2-2. 댓글 응대 & 피드백 수집
    - 모든 댓글에 24시간 내 응답
    - 피드백을 GitHub Issues로 정리

[ ] 2-3. GA4 데이터 확인
    - 유입량, 이탈률, 전환율 확인
    - 첫 주 목표: 방문 500+, 가입 50+
```

### Sprint 3: "Conversion Infrastructure" (데이터 확인 후)

```
[ ] 3-1. 이메일 수집 (Supabase에 이미 이메일 있음)
    - "Premium Coming Soon" 배너
    - 업그레이드 알림 동의 체크박스

[ ] 3-2. 사용량 제한 적용 (VITE_BIZ_MODE=production)
    - user_usage_limits 테이블 생성
    - 일일 5회 제한 (비로그인) / 20회 (로그인)
    - 한도 도달 시 업그레이드 프롬프트

[ ] 3-3. Stripe 연동
    - Stripe 계정 설정
    - Checkout Session API
    - Webhook → subscriptions 테이블
    - /pricing 페이지

[ ] 3-4. 구독 전환 프롬프트 UI
    - 한도 도달 모달
    - 프리미엄 기능 잠금 UI (lock icon + blur)
    - 업그레이드 성공/실패 처리
```

### Sprint 4: "Growth" (결제 인프라 완료 후)

```
[ ] 4-1. 콘텐츠 마케팅 블로그 (선택)
[ ] 4-2. YouTube shorts (전략 가이드)
[ ] 4-3. 추가 서브레딧 게시
[ ] 4-4. A/B 테스트 (랜딩 카피, CTA)
[ ] 4-5. Referral 시스템 (추천인 보상)
```

---

## 8. KPI & 성공 지표

### Phase 1 (Reddit 론칭 후 첫 2주)
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 랜딩 페이지 방문 | 500+ | GA4 |
| 데모 세션 시작 | 200+ | GA4 event |
| 회원가입 | 50+ | Supabase user_profiles count |
| Reddit 게시물 upvotes | 20+ | Reddit |
| Reddit 댓글 | 10+ | Reddit |

### Phase 2 (론칭 후 1-2개월)
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| WAU (주간 활성 유저) | 100+ | Supabase query |
| 7-day retention | 30%+ | GA4 cohort |
| 평균 세션 수/유저 | 5+ | user_exercise_history |
| 이메일 수집 (waitlist) | 200+ | DB |

### Phase 3 (결제 도입 후)
| 지표 | 목표 | 측정 방법 |
|------|------|-----------|
| 무료→유료 전환율 | 5-10% | Stripe + DB |
| MRR (월간 반복 수익) | $50+ | Stripe Dashboard |
| 구독 유지율 (월간) | 80%+ | Stripe |
| CAC (고객 획득 비용) | $0 (오가닉) | GA4 |

---

## 9. 리스크 & 대응

| 리스크 | 확률 | 영향 | 대응 |
|--------|------|------|------|
| Reddit 게시물이 무시됨 | 중간 | 낮음 | 다른 서브레딧에서 재시도, 톤/타이밍 조정 |
| Reddit에서 "광고"로 인식 | 낮음 | 높음 | 빌더 스토리 톤 유지, 피드백 적극 요청 |
| 트래픽 급증으로 서버 다운 | 낮음 | 높음 | Cloudflare + Supabase는 자동 확장, 캐시된 문제 55개로 DB 부하 최소 |
| 초기 유저가 결제 거부 | 중간 | 중간 | 프리미엄 가치를 체험하게 한 후 paywall (30일 무료 체험) |
| 경쟁 서비스 대응 | 낮음 | 낮음 | Complete the Words "만" 깊게 파는 경쟁자는 현재 없음 |

---

## 10. 의사결정 기록

| 결정 | 선택 | 이유 |
|------|------|------|
| AdSense vs. Subscription | **Subscription** | 학습 앱에 광고는 UX 저하, 구독이 LTV 높음 |
| 3-tier vs. 2-tier | **2-tier (Free/Pro)** 검토 중 | 초기에는 단순할수록 전환율 높음 |
| Reddit 먼저 vs. 결제 먼저 | **Reddit 먼저** | 트래픽/피드백 없이 결제 구축은 과잉 투자 |
| 블로그 vs. 앱만 | **앱 우선, 블로그 나중** | 블로그 없이도 Reddit으로 초기 유입 가능 |
| OG image | **필요** | Reddit/Discord 공유 시 프리뷰 없으면 클릭률 급감 |

---

## 관련 문서

- [Reddit Review 전략 분석](../Reddit-Review/strategy-analysis.md)
- [구독 모델 아키텍처](../migrations/subscription-model-ready.md)
- [프로젝트 현황](../project-status.md)
- [데이터베이스 스키마](../architecture/database-schema.md)
