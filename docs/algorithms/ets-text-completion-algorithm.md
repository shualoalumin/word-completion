# ETS TOEFL iBT Text Completion - 출제 알고리즘 분석

> **Last Updated**: 2025-12-30
> **Based on**: 6 ETS Official Samples (ETS Chosun Mock Test 포함)
> **Purpose**: AI 문제 생성 프롬프트 최적화

---

## 1. 구조적 패턴 (Passage Structure)

```
┌─────────────────────────────────────────────────────────────┐
│  PASSAGE STRUCTURE (70-100 words total)                     │
├─────────────────────────────────────────────────────────────┤
│  [도입부] 1문장 - 주제 소개, 빈칸 없음 (~15%)                 │
│  [본문] 2-3문장 - 10개 빈칸 모두 집중 (~45%)                  │
│  [마무리] 2-3문장 - 빈칸 없음, 맥락/단서 제공 (~40%)          │
└─────────────────────────────────────────────────────────────┘
```

| 구간 | 단어 비율 | 빈칸 수 | 역할 |
|------|----------|---------|------|
| 도입부 | ~15% | 0개 | 주제 명시, 배경 설명 |
| 본문 | ~45% | **10개 전부** | 문제 영역 |
| 마무리 | ~40% | 0개 | 힌트/맥락 제공 |

### 핵심 규칙
- 첫 문장에는 절대 빈칸 없음
- 모든 빈칸은 지문 전반부(50%)에 집중
- 후반부는 완전한 문장으로 단서 제공
- 한 문장에 2-3개 빈칸 배치 일반적

---

## 2. 품사 분포 (Part of Speech Distribution)

60개 빈칸 분석 결과:

| 품사 | 비율 | 설명 | 예시 |
|------|------|------|------|
| **명사 (Noun)** | 40% | 가장 많음 | field, regions, organisms, latitude |
| **동사 (Verb)** | 25% | 모든 형태 포함 | examining, evolved, influenced, driven |
| **전치사 (Prep)** | 12% | 기본 단어 | in, to, from, with |
| **접속사/한정사** | 13% | 연결어 | and, that, these, each, however |
| **형용사/부사** | 10% | 수식어 | cognitive, substantial, only, often |

### 품사별 난이도
- **Easy**: 전치사, 접속사, 기본 동사 (in, to, and, is)
- **Medium**: 일반 명사, 동사 (examining, evolved, organisms)
- **Hard**: 전문 명사, 형용사 (latitude, proximity, deforestation, substantial)

---

## 3. 접두사 길이 알고리즘 (Prefix Rules)

```javascript
function calculatePrefixLength(wordLength) {
  if (wordLength <= 3) return 1;        // i_, a_, to_
  if (wordLength <= 5) return 2;        // th__, wi__, su__
  if (wordLength <= 7) return 3;        // fi___, reg___, bod___
  if (wordLength <= 9) return 4;        // exam____, lati____
  return 5;                              // infor_____, defor_____
}
```

| 단어 길이 | 접두사 길이 | 빈칸 표시 | 예시 |
|----------|------------|----------|------|
| 2-3자 | 1자 | `i_`, `a__` | is, in, to, and |
| 4-5자 | 2자 | `th__`, `wi__` | that, with, such |
| 6-7자 | 3자 | `fi___`, `reg___` | field, regions |
| 8-9자 | 4자 | `exam____`, `lati____` | examining, latitude |
| 10자+ | 5자 | `infor_____` | information, deforestation |

---

## 4. 난이도 체계 (Difficulty System)

### Module 1 (Standard Difficulty)
| 난이도 | 비율 | 특징 |
|--------|------|------|
| Easy | 50% | 기본 단어: in, to, and, life, how, that |
| Medium | 50% | 일반 학술: examining, evolved, organisms |
| Hard | 0% | 전문 용어 없음 |

### Module 2 (Advanced Difficulty)  
| 난이도 | 비율 | 특징 |
|--------|------|------|
| Easy | 20% | 기본 단어만 유지 |
| Medium | 40% | 학술 어휘 증가 |
| Hard | **40%** | 전문 용어: latitude, proximity, deforestation, substantial |

### 난이도별 어휘 예시

**Easy Words** (Module 1 & 2 공통)
```
in, to, and, is, are, the, that, this, these, each,
how, who, what, with, from, for, only, also, such
```

**Medium Words** (일반 학술)
```
examining, evolved, organisms, influenced, regions,
activities, functions, important, recorded, various,
ancient, modern, social, natural, specific
```

**Hard Words** (Module 2 전용)
```
latitude, longitude, proximity, substantial, cognitive,
deforestation, ecosystems, paleontology, precipitation,
phenomenon, hypothesis, metabolism, photosynthesis
```

---

## 5. 토픽 분류 체계 (Topic Taxonomy)

### Natural Sciences (자연과학)
- Biology: cells, genetics, organisms, evolution
- Chemistry: compounds, reactions, elements
- Physics: forces, energy, motion, waves
- Astronomy: planets, stars, galaxies, cosmos
- Geology: rocks, minerals, fossils, tectonics

### Life Sciences (생명과학)
- Zoology: animals, behavior, migration, habitats
- Botany: plants, photosynthesis, ecosystems
- Marine Biology: ocean life, coral reefs
- Neuroscience: brain, cognition, memory
- Ecology: ecosystems, food chains, biodiversity

### Social Sciences (사회과학)
- Psychology: behavior, development, cognition
- Sociology: society, culture, groups
- Anthropology: human history, cultures, rituals
- Economics: markets, trade, resources
- Archaeology: artifacts, civilizations, excavations

### Earth & Environment (지구환경)
- Geography: maps, regions, cartography, landscapes
- Meteorology: weather, climate, atmosphere
- Oceanography: currents, tides, marine systems
- Environmental Science: pollution, conservation, climate change

### History (역사)
- Ancient History: Egypt, Rome, Greece, Mesopotamia
- Medieval History: feudalism, kingdoms, crusades
- Modern History: industrial revolution, colonialism
- American History: revolution, civil war, expansion

### Arts & Humanities (예술인문)
- Art History: movements, artists, techniques
- Music: composition, instruments, genres
- Literature: authors, genres, literary devices
- Architecture: structures, design, styles
- Philosophy: ethics, logic, epistemology

---

## 6. 단서 유형 (Clue Types)

| 유형 | 비율 | 설명 | 예시 |
|------|------|------|------|
| **Grammar** | 35% | 문법적 필연성 | "Verb form required after 'can'" |
| **Context** | 30% | 문맥상 의미 | "Describes the result of..." |
| **Collocation** | 20% | 연어/관용구 | "Common phrase: 'in ___'" |
| **Reference** | 15% | 앞 내용 참조 | "Refers to 'maps' mentioned earlier" |

### 단서 작성 가이드

**Grammar Clues**
```
- "Plural noun needed after 'many'"
- "Past tense for completed action"
- "Infinitive form after 'to'"
- "Verb agrees with singular subject"
- "Adjective needed before noun"
```

**Context Clues**
```
- "Describes the characteristic of..."
- "Indicates the result/cause of..."
- "Contrasts with the previous idea"
- "Elaborates on the main topic"
```

**Collocation Clues**
```
- "Common phrase: 'make a ___'"
- "Fixed expression: 'in ___ of'"
- "Academic collocation: '___ analysis'"
```

**Reference Clues**
```
- "Refers back to 'scientists' mentioned earlier"
- "Connects to the main subject of the passage"
- "Pronoun reference to previous noun"
```

---

## 7. 출제 알고리즘 수도코드

```
FUNCTION generateTextCompletion(difficulty):
    
    # Step 1: 토픽 선택
    topic = selectRandomTopic(TOPIC_TAXONOMY)
    
    # Step 2: 지문 구조 생성
    passage = {
        intro: generateIntro(topic),           # 빈칸 없음, 1문장
        body: generateBody(topic, 10),         # 10개 빈칸
        conclusion: generateConclusion(topic)  # 빈칸 없음, 2-3문장
    }
    
    # Step 3: 빈칸 선택
    blanks = selectBlanks(passage.body, {
        count: 10,
        distribution: {
            nouns: 40%,
            verbs: 25%,
            prepositions: 12%,
            conjunctions: 13%,
            adjectives: 10%
        }
    })
    
    # Step 4: 난이도 조정
    IF difficulty == "module1":
        blanks = adjustDifficulty(blanks, easy: 50%, medium: 50%)
    ELSE IF difficulty == "module2":
        blanks = adjustDifficulty(blanks, easy: 20%, medium: 40%, hard: 40%)
    
    # Step 5: 접두사 계산
    FOR each blank IN blanks:
        blank.prefix = calculatePrefix(blank.word)
        blank.clue = assignClue(blank)
    
    RETURN {topic, passage, blanks}
```

---

## 8. 수집된 샘플 목록

| # | Topic | Category | Module | Source |
|---|-------|----------|--------|--------|
| 1 | Prehistoric Dance | Anthropology | M1 | ETS Official |
| 2 | Maps & Cartography | Geography | M1 | ETS Official |
| 3 | Human Brain | Neuroscience | M2 | ETS Official |
| 4 | Elephants | Zoology | M2 | ETS Official |
| 5 | Paleontology | Earth Science | M1 | ETS Chosun Mock |
| 6 | Climate | Environmental | M2 | ETS Chosun Mock |

---

## 9. 구현 체크리스트

- [x] 구조적 패턴 분석
- [x] 품사 분포 분석
- [x] 접두사 규칙 정립
- [x] 난이도 체계 정의
- [x] 토픽 분류 체계
- [x] 단서 유형 정리
- [ ] Edge Function 프롬프트 개선
- [ ] 토픽 풀 확장 (50개+)
- [ ] Module 1/2 분리 생성

---

*이 문서는 ETS 공식 샘플 분석을 기반으로 작성되었습니다.*

