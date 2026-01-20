-- ============================================================================
-- RLS 정책 수정: exercises 테이블
-- 생성일: 2026-01-18
-- 목적: Security Advisor 경고 해결 - 불필요한 INSERT 정책 제거
-- ============================================================================

-- 문제: exercises 테이블에 "Service role can insert exercises" 정책이 있음
-- 이유: service_role은 RLS를 우회하므로 이 정책은 불필요하고 보안 경고 발생
-- 해결: 해당 정책 제거

-- 1. 기존 정책 확인 (수동으로 확인 후 실행)
-- SELECT * FROM pg_policies WHERE tablename = 'exercises';

-- 2. 불필요한 INSERT 정책 제거
DROP POLICY IF EXISTS "Service role can insert exercises" ON exercises;

-- 3. exercises 테이블은 Edge Function (service_role)에서만 INSERT하므로
--    일반 사용자용 INSERT 정책은 필요 없음
--    SELECT 정책만 유지 (모든 인증된 사용자가 조회 가능)

-- 참고: 현재 exercises 테이블의 SELECT 정책은 유지
-- "Authenticated users can view exercises" 정책은 그대로 유지
