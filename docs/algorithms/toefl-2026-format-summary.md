# 🎓 Early 2026 TOEFL iBT Test Overview Summary

> **Source**: ETS Official Overview (docs/ETS-official/toefl-ibt-test-overview.pdf)  
> **Topic**: Key changes and new task types for the January 2026 update  
> **Status**: ✅ Learned and Documented

---

## 🚀 1. Key Changes Overview

- **Shorter Test Duration**: Total time reduced to approximately **1.5 hours** (previously 2 hours).
- **Modern Content**: Questions now include real-world digital contexts like emails, discussion forums, and simulated interviews.
- **Adaptive Questioning**: Reading and Listening sections are now adaptive (difficulty adjusts based on performance).
- **New Scoring System (CEFR Alignment)**:
    - Introduction of **CEFR Band Scores (1–6)**.
    - Traditional **0-120 scores** will be provided concurrently during the 2026-2028 transition period.

---

## 📖 2. New Reading Task: "Complete the Words" (Text Completion)

This is the central task currently implemented in our app.

- **Objective**: Complete words in a paragraph where some letters are missing.
- **Skill Evaluated**: Vocabulary knowledge and contextual understanding at the sentence and paragraph levels.
- **Current Algorithm Check**: Our existing [ETS Text Completion Algorithm](../algorithms/ets-text-completion-algorithm.md) aligns with these official requirements (missing letters based on word length).

---

## ✍️ 3. New Writing Task: "Build a Sentence"

This is a major new addition for the 2026 format and represents our next development target.

- **Task Type**: Writing Task 1 (approximately 10 questions).
- **Total Time**: ~23 minutes for the entire Writing section.
- **Mechanism**:
    - A prompt is provided (e.g., a question or situation).
    - A **Word Bank** containing **5-7 word chunks** (not individual words, but meaningful phrases) is provided.
    - Test-takers must drag/arrange chunks in the correct grammatical order.
- **Evaluation**: Mastery of sentence structure, grammar, and appropriate response logic.

---

## 🎯 4. Implications for Our App

1.  **Text Completion**: We should ensure our difficulty levels (Easy/Medium/Hard) eventually map to the new **CEFR 1-6 bands** to provide more accurate feedback for 2026 test-takers.
2.  **Build a Sentence**: We need to implement this new Writing Task type as part of Phase 3. 
    - *Idea*: Use AI to generate sentence prompts and split the solution into "chunks" for the user to arrange.
3.  **Score Prediction**: Update our [Score Scale Guide](../guides/toefl-score-scale.md) to include the CEFR band mapping once we have more sample data.

---

## 📈 Roadmap Update

- [ ] **Phase 2.6**: Update Score Scale guide with CEFR 1-6 mapping.
- [ ] **Phase 3.0**: Developer "Build a Sentence" prototype (Writing section).
- [ ] **Phase 3.1**: Implement adaptive difficulty logic based on those 2026 guidelines.

---

*This summary was compiled based on the ETS Official 2026 Format Overview.*
