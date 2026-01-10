-- ============================================================================
-- user_streaks 테이블 생성 및 스트릭 계산 로직
-- 생성일: 2026-01-11
-- 목적: flow-6 Dashboard 통계 연결 (스트릭 시스템)
-- ============================================================================

-- 1. user_streaks 테이블 생성
CREATE TABLE IF NOT EXISTS user_streaks (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT DEFAULT 0,              -- 현재 연속 학습 일수
  longest_streak INT DEFAULT 0,              -- 최장 연속 학습 일수
  last_activity_date DATE,                   -- 마지막 활동 일자
  streak_freeze_count INT DEFAULT 0,         -- 스트릭 보호권 (사용 가능한 개수)
  total_days_active INT DEFAULT 0,           -- 총 활성 일수
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_streaks_last_activity ON user_streaks (last_activity_date);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  USING (auth.uid() = user_id);

-- 2. 스트릭 계산 함수 (PostgreSQL Function)
-- 문제 완료 시 자동으로 스트릭을 업데이트하는 함수
CREATE OR REPLACE FUNCTION update_user_streak(user_id_param UUID, activity_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(current_streak INT, longest_streak INT, total_days_active INT) AS $$
DECLARE
  existing_streak RECORD;
  new_streak INT;
  new_longest_streak INT;
  new_total_days INT;
BEGIN
  -- 기존 스트릭 정보 조회
  SELECT * INTO existing_streak
  FROM user_streaks
  WHERE user_id = user_id_param;

  -- 기존 스트릭이 없으면 초기화
  IF NOT FOUND THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, total_days_active)
    VALUES (user_id_param, 1, 1, activity_date, 1)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN QUERY SELECT 1::INT, 1::INT, 1::INT;
    RETURN;
  END IF;

  -- 오늘 이미 활동했는지 확인 (같은 날 중복 카운트 방지)
  IF existing_streak.last_activity_date = activity_date THEN
    -- 오늘 이미 활동함: 스트릭 증가 없음
    RETURN QUERY 
    SELECT existing_streak.current_streak, existing_streak.longest_streak, existing_streak.total_days_active;
    RETURN;
  END IF;

  -- 어제 활동했는지 확인 (연속 스트릭)
  IF existing_streak.last_activity_date = activity_date - INTERVAL '1 day' THEN
    -- 연속 스트릭: +1
    new_streak := existing_streak.current_streak + 1;
  ELSIF existing_streak.last_activity_date IS NULL OR existing_streak.last_activity_date < activity_date - INTERVAL '1 day' THEN
    -- 스트릭 끊김: 1부터 다시 시작
    new_streak := 1;
  ELSE
    -- 같은 날: 변화 없음 (위에서 이미 처리됨)
    new_streak := existing_streak.current_streak;
  END IF;

  -- 최장 스트릭 업데이트
  new_longest_streak := GREATEST(existing_streak.longest_streak, new_streak);

  -- 총 활성 일수 계산 (중복 제거)
  -- 같은 날 여러 번 활동해도 1일로 카운트
  IF existing_streak.last_activity_date != activity_date THEN
    new_total_days := existing_streak.total_days_active + 1;
  ELSE
    new_total_days := existing_streak.total_days_active;
  END IF;

  -- 스트릭 정보 업데이트
  UPDATE user_streaks
  SET 
    current_streak = new_streak,
    longest_streak = new_longest_streak,
    last_activity_date = activity_date,
    total_days_active = new_total_days,
    updated_at = NOW()
  WHERE user_id = user_id_param;

  RETURN QUERY SELECT new_streak, new_longest_streak, new_total_days;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거: user_exercise_history INSERT 시 자동으로 스트릭 업데이트
-- (문제 완료 시 자동으로 스트릭 계산)
CREATE OR REPLACE FUNCTION trigger_update_streak_on_exercise_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- 문제 완료 시 해당 사용자의 스트릭 업데이트
  PERFORM update_user_streak(NEW.user_id, DATE(NEW.completed_at));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성 (이미 있으면 제거 후 재생성)
DROP TRIGGER IF EXISTS trigger_update_streak_on_exercise_history_insert ON user_exercise_history;

CREATE TRIGGER trigger_update_streak_on_exercise_history_insert
  AFTER INSERT ON user_exercise_history
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION trigger_update_streak_on_exercise_complete();

-- 4. 기존 데이터에 대한 스트릭 초기화 함수 (선택적)
-- 이미 문제를 완료한 사용자들의 스트릭을 계산하는 함수
CREATE OR REPLACE FUNCTION initialize_existing_user_streaks()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  activity_date DATE;
BEGIN
  -- 각 사용자별로 가장 최근 활동 일자 기준으로 스트릭 계산
  FOR user_record IN
    SELECT DISTINCT user_id
    FROM user_exercise_history
    WHERE user_id NOT IN (SELECT user_id FROM user_streaks)
  LOOP
    -- 각 사용자의 활동 일자별로 스트릭 계산
    FOR activity_date IN
      SELECT DISTINCT DATE(completed_at) as activity_date
      FROM user_exercise_history
      WHERE user_id = user_record.user_id
      ORDER BY activity_date
    LOOP
      PERFORM update_user_streak(user_record.user_id, activity_date);
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 주석 추가
COMMENT ON TABLE user_streaks IS '사용자 연속 학습 스트릭 정보';
COMMENT ON FUNCTION update_user_streak IS '사용자 스트릭을 업데이트하는 함수. 문제 완료 시 자동으로 호출됨.';
COMMENT ON FUNCTION trigger_update_streak_on_exercise_complete IS 'user_exercise_history INSERT 시 자동으로 스트릭을 업데이트하는 트리거 함수.';
