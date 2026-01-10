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
    const handleAuthCallback = async () => {
      try {
        // URL hash에서 토큰 확인
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const error = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (error) {
          // 에러 발생 시 부모 창에 에러 메시지 전송
          if (window.opener) {
            window.opener.postMessage(
              {
                type: 'OAUTH_ERROR',
                error: errorDescription || error,
              },
              window.location.origin
            );
          }
          // 팝업 창 닫기
          window.close();
          return;
        }

        if (accessToken) {
          // 세션 확인
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            throw sessionError;
          }

          if (session) {
            // 성공 시 부모 창에 성공 메시지 전송
            if (window.opener) {
              window.opener.postMessage(
                {
                  type: 'OAUTH_SUCCESS',
                  session,
                },
                window.location.origin
              );
            }
            // 팝업 창 닫기 (약간의 지연을 두어 메시지 전송 보장)
            setTimeout(() => {
              window.close();
            }, 100);
          } else {
            throw new Error('Failed to get session');
          }
        } else {
          // 토큰이 없는 경우 (일반 페이지 접근)
          // 일반 페이지로 접근한 경우 대시보드로 리디렉션
          if (!window.opener) {
            navigate('/dashboard', { replace: true });
          } else {
            // 팝업인데 토큰이 없으면 에러
            window.opener.postMessage(
              {
                type: 'OAUTH_ERROR',
                error: 'No access token found',
              },
              window.location.origin
            );
            window.close();
          }
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        // 에러 발생 시 부모 창에 에러 메시지 전송
        if (window.opener) {
          window.opener.postMessage(
            {
              type: 'OAUTH_ERROR',
              error: error.message || 'Authentication failed',
            },
            window.location.origin
          );
        }
        // 팝업 창 닫기
        setTimeout(() => {
          window.close();
        }, 100);
      }
    };

    handleAuthCallback();
  }, [navigate, location]);

  // 로딩 화면 (팝업에서 빠르게 처리되므로 거의 보이지 않음)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}
