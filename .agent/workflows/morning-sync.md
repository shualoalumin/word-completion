---
description: Automatically triggers every morning at 7:00 AM (KST) to summarize the previous day's work, update project-status.md, and check for pending issues.
---

# 🤖 Daily Routine: Morning Synchronization (7:00 AM KST)

// turbo-all

## 1. Environment Health Check

1. Run `git pull` to ensure local repository is up to date.
2. Run `npm install` if `package.json` was modified.

## 2. Activity Summarization

1. Review the commits and development logs from the previous day.
2. Identify completed features, bug fixes, and architectural changes.

## 3. Documentation Update

1. Update `docs/project-status.md` with the latest "Change Log" entry.
2. Update `docs/architecture/schema-vs-fe-gap-analysis.md` if any new DB tables
   or FE features were implemented.
3. If necessary, update
   `docs/architecture/2026-01-18-architecture-midterm-review.md` scores.

## 4. Status Push

1. Automatically `add`, `commit`, and `push` the documentation updates to the
   repository.

## 5. Daily Goal Setting

1. Based on the current `project-status.md`, list the P0 and P1 tasks for the
   current day.
2. Present a summary of "Yesterday's Accomplishments" and "Today's Priorities"
   to the USER.
