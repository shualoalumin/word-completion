/**
 * OAuth Callback Page
 * 
 * 팝업 창에서 OAuth 콜백을 처리하고 부모 창에 메시지를 전송
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 팝업 창인지 확인
    const isPopup = !!window.opener;
    let subscription: { unsubscribe: () => void } | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let processed = false; // 중복 처리 방지

    const cleanup = () => {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const handleAuthCallback = async () => {
      try {
        // URL hash에서 에러 확인 (에러는 즉시 처리)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          // 에러 발생 시 부모 창에 에러 메시지 전송
          if (isPopup) {
            window.opener?.postMessage(
              {
                type: 'OAUTH_ERROR',
                error: errorDescription || error,
              },
              window.location.origin
            );
            setTimeout(() => {
              window.close();
            }, 200);
          } else {
            navigate('/', { replace: true });
          }
          return;
        }

        // Supabase가 자동으로 URL hash를 처리하도록 기다림
        // onAuthStateChange 이벤트 리스너로 세션 확인
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (processed) return; // 이미 처리됨
            processed = true;

            if (event === 'SIGNED_IN' && session) {
              // 로그인 성공
              if (isPopup) {
                // 팝업 창: 부모 창에 성공 메시지 전송
                window.opener?.postMessage(
                  {
                    type: 'OAUTH_SUCCESS',
                    session,
                  },
                  window.location.origin
                );
                // 약간의 지연을 두어 메시지 전송 보장
                setTimeout(() => {
                  window.close();
                }, 200);
              } else {
                // 일반 페이지: Dashboard로 리디렉션
                navigate('/dashboard', { replace: true });
              }
              cleanup();
            } else if (event === 'SIGNED_OUT') {
              // 로그아웃 (예상치 못한 경우)
              if (isPopup) {
                window.opener?.postMessage(
                  {
                    type: 'OAUTH_ERROR',
                    error: 'Authentication failed',
                  },
                  window.location.origin
                );
                setTimeout(() => {
                  window.close();
                }, 200);
              } else {
                navigate('/', { replace: true });
              }
              cleanup();
            }
          }
        );

        subscription = authSubscription;

        // Supabase가 자동으로 세션을 처리하도록 약간의 시간 대기
        // (URL hash가 있으면 Supabase가 자동으로 처리함)
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 세션 확인 (Supabase가 이미 처리했는지 확인)
        // onAuthStateChange가 아직 트리거되지 않은 경우를 대비
        if (!processed) {
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (session && !processed) {
            processed = true;
            // 세션이 있으면 성공
            if (isPopup && !sessionError) {
              window.opener?.postMessage(
                {
                  type: 'OAUTH_SUCCESS',
                  session,
                },
                window.location.origin
              );
              setTimeout(() => {
                window.close();
              }, 200);
            } else if (!isPopup && !sessionError) {
              // 일반 페이지: Dashboard로 리디렉션
              navigate('/dashboard', { replace: true });
            }
            cleanup();
          } else if (!processed && !session) {
            // 세션이 없고 URL hash도 없으면 (일반 페이지 접근 또는 타임아웃)
            if (isPopup) {
              // 팝업인데 세션이 없으면 (사용자가 취소했거나 타임아웃)
              // 에러 메시지를 보내지 않고 조용히 닫기 (사용자가 취소한 경우일 수 있음)
              timeoutId = setTimeout(() => {
                if (!processed) {
                  processed = true;
                  window.close();
                  cleanup();
                }
              }, 1000);
            } else {
              // 일반 페이지 접근: 세션 없으면 랜딩 페이지로 리디렉션
              navigate('/', { replace: true });
              cleanup();
            }
          }
        }

        // 타임아웃 설정 (10초 후 정리)
        timeoutId = setTimeout(() => {
          if (!processed) {
            processed = true;
            if (isPopup && !window.closed) {
              window.close();
            }
          }
          cleanup();
        }, 10000);
      } catch (error: any) {
        if (processed) return; // 이미 처리됨
        processed = true;

        console.error('Auth callback error:', error);
        // 에러 발생 시 부모 창에 에러 메시지 전송
        if (isPopup) {
          window.opener?.postMessage(
            {
              type: 'OAUTH_ERROR',
              error: error.message || 'Authentication failed',
            },
            window.location.origin
          );
          setTimeout(() => {
            window.close();
          }, 200);
        } else {
          navigate('/', { replace: true });
        }
        cleanup();
      }
    };

    handleAuthCallback();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [navigate]);

  // 로딩 화면 (팝업에서 빠르게 처리되므로 거의 보이지 않음)
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
        <p className="text-zinc-400">Completing sign in...</p>
      </div>
    </div>
  );
}
