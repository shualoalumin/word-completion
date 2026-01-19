-- ============================================================================
-- 북마크 기능 스키마 마이그레이션
-- 생성일: 2026-01-18
-- 목적: user_bookmarks 테이블 생성 및 RLS 정책 설정
-- ============================================================================

-- 1. user_bookmarks 테이블 생성
CREATE TABLE IF NOT EXISTS user_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  note TEXT,                          -- 개인 메모
  folder TEXT DEFAULT 'default',      -- 폴더 분류
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, exercise_id)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON user_bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_exercise ON user_bookmarks (exercise_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON user_bookmarks (user_id, folder);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created ON user_bookmarks (user_id, created_at DESC);

-- 2. RLS (Row Level Security) 활성화
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 생성
-- 사용자는 자신의 북마크만 조회 가능
CREATE POLICY "Users can view own bookmarks"
  ON user_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 북마크만 추가 가능
CREATE POLICY "Users can insert own bookmarks"
  ON user_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 북마크만 수정 가능
CREATE POLICY "Users can update own bookmarks"
  ON user_bookmarks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 북마크만 삭제 가능
CREATE POLICY "Users can delete own bookmarks"
  ON user_bookmarks FOR DELETE
  USING (auth.uid() = user_id);
