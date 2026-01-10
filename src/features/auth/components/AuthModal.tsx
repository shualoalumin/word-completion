import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  darkMode?: boolean;
}

type AuthMode = 'signin' | 'signup';

export function AuthModal({ isOpen, onClose, onSuccess, darkMode = false }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const popupRef = useRef<Window | null>(null);
  const popupCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // ref로 최신 콜백 유지 (의존성 없이 최신 값 유지)
  const onSuccessRef = useRef(onSuccess);
  
  // onSuccess가 변경될 때마다 ref 업데이트 (안정적인 참조 유지)
  // 하지만 이 useEffect 자체는 리렌더링을 유발하지 않음
  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  // isOpen이 false일 때는 아무것도 렌더링하지 않음 (hooks는 항상 호출됨)
  if (!isOpen) {
    return null;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Check your email for verification link!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Signed in successfully!');
        // ref를 통해 콜백 호출 (무한 루프 방지)
        setTimeout(() => {
          onSuccessRef.current();
        }, 0);
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  // 팝업 감시 및 정리
  useEffect(() => {
    return () => {
      // 컴포넌트 언마운트 시 팝업 닫기 및 인터벌 정리
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
      }
      if (popupCheckIntervalRef.current) {
        clearInterval(popupCheckIntervalRef.current);
      }
    };
  }, []);

  // 팝업에서 메시지 리스닝 (무한 루프 방지: 빈 의존성 배열)
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // 보안: 같은 origin에서만 메시지 수신
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'OAUTH_SUCCESS') {
        // 성공 메시지 수신
        if (popupCheckIntervalRef.current) {
          clearInterval(popupCheckIntervalRef.current);
          popupCheckIntervalRef.current = null;
        }
        if (popupRef.current) {
          popupRef.current.close();
          popupRef.current = null;
        }
        setGoogleLoading(false);
        toast.success('Signed in successfully!');
        
        // ref를 통해 최신 콜백 호출 (무한 루프 방지)
        setTimeout(() => {
          onSuccessRef.current();
        }, 0);
      } else if (event.data.type === 'OAUTH_ERROR') {
        // 에러 메시지 수신
        if (popupCheckIntervalRef.current) {
          clearInterval(popupCheckIntervalRef.current);
          popupCheckIntervalRef.current = null;
        }
        if (popupRef.current) {
          popupRef.current.close();
          popupRef.current = null;
        }
        setGoogleLoading(false);
        toast.error(event.data.error || 'Google sign-in failed');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []); // 빈 배열: 컴포넌트 마운트 시 한 번만 등록

  const handleGoogleSignIn = async () => {
    if (googleLoading) return; // 중복 클릭 방지

    setGoogleLoading(true);

    try {
      // Supabase OAuth URL 생성
      const redirectTo = `${window.location.origin}/auth/callback`;
      
      // Supabase Auth 엔드포인트 URL 구성
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qnqfarulquicshnwfaxi.supabase.co';
      const authUrl = `${supabaseUrl}/auth/v1/authorize`;
      
      // OAuth 파라미터 구성 (Supabase Auth API 형식)
      const params = new URLSearchParams({
        provider: 'google',
        redirect_to: redirectTo,
      });

      const oauthUrl = `${authUrl}?${params.toString()}`;

      // 팝업 창 열기 (Claude 스타일: 중앙 정렬, 적당한 크기)
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        oauthUrl,
        'google-oauth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes,location=yes,directories=no,status=no`
      );

      if (!popup) {
        setGoogleLoading(false);
        toast.error('Popup blocked. Please allow popups for this site.');
        return;
      }

      popupRef.current = popup;

      // 팝업이 닫혔는지 감시 (500ms 간격)
      popupCheckIntervalRef.current = setInterval(() => {
        if (popup.closed) {
          // 팝업이 닫힘 (사용자가 취소하거나 완료)
          if (popupCheckIntervalRef.current) {
            clearInterval(popupCheckIntervalRef.current);
            popupCheckIntervalRef.current = null;
          }
          popupRef.current = null;
          
          // 세션 확인: 메시지 핸들러가 처리하지 않은 경우에만 (취소된 경우)
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
              // 세션이 없으면 취소된 것으로 간주
              // (성공한 경우는 이미 메시지 핸들러에서 처리됨)
              setGoogleLoading(false);
            }
            // 세션이 있으면 메시지 핸들러가 이미 처리했을 것이므로
            // 여기서는 아무것도 하지 않음
          });
        }
      }, 500);

      // 타임아웃 설정 (5분 후 자동 정리)
      setTimeout(() => {
        if (popupCheckIntervalRef.current && popupRef.current && !popupRef.current.closed) {
          clearInterval(popupCheckIntervalRef.current);
          popupCheckIntervalRef.current = null;
          if (popupRef.current) {
            popupRef.current.close();
            popupRef.current = null;
          }
          setGoogleLoading(false);
          toast.error('Sign-in timeout. Please try again.');
        }
      }, 5 * 60 * 1000); // 5분
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      toast.error(error.message || 'Google sign-in failed');
      setGoogleLoading(false);
      if (popupRef.current && !popupRef.current.closed) {
        popupRef.current.close();
        popupRef.current = null;
      }
      if (popupCheckIntervalRef.current) {
        clearInterval(popupCheckIntervalRef.current);
        popupCheckIntervalRef.current = null;
      }
    }
  };


  const bgColor = darkMode ? 'bg-zinc-900' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const mutedColor = darkMode ? 'text-zinc-400' : 'text-gray-500';
  const borderColor = darkMode ? 'border-zinc-700' : 'border-gray-200';
  const inputBg = darkMode ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-gray-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal - 더 작고 단아한 사이즈 */}
      <div className={`relative w-full max-w-[360px] p-5 rounded-xl shadow-xl border ${bgColor} ${textColor} ${borderColor} transition-all`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-3 right-3 p-1.5 rounded-md transition-colors ${darkMode ? 'hover:bg-zinc-700 text-zinc-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header - 더 컴팩트 */}
        <div className="text-center mb-5">
          <h2 className="text-xl font-semibold mb-1">
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h2>
          <p className={`text-sm ${mutedColor}`}>
            {mode === 'signin' 
              ? 'Continue to GlobalPrep' 
              : 'Start your TOEFL journey'}
          </p>
        </div>

        {/* Google Sign In Button - 팝업 방식, hover 개선 */}
        <div className="mb-4">
          <button
            className={`w-full h-11 px-4 flex items-center justify-center font-medium rounded-lg border transition-all duration-200 ${
              darkMode
                ? googleLoading
                  ? 'border-zinc-700 bg-zinc-800/30 text-zinc-500 cursor-not-allowed'
                  : 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-500 hover:bg-zinc-800/50 text-white active:bg-zinc-800/70 active:scale-[0.98] cursor-pointer shadow-sm hover:shadow-md'
                : googleLoading
                ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 hover:shadow-md text-gray-900 active:bg-gray-100 active:scale-[0.98] cursor-pointer shadow-sm'
            }`}
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            type="button"
            aria-label="Sign in with Google"
          >
            {googleLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2.5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-4">
          <div className={`absolute inset-0 flex items-center`}>
            <div className={`w-full border-t ${borderColor}`}></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className={`px-3 ${bgColor} ${mutedColor}`}>or</span>
          </div>
        </div>

        {/* Email Form - 더 컴팩트 */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`h-10 text-sm ${inputBg} ${textColor}`}
            required
            disabled={loading || googleLoading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`h-10 text-sm ${inputBg} ${textColor}`}
            required
            minLength={6}
            disabled={loading || googleLoading}
          />
          <Button
            type="submit"
            className={`w-full h-10 text-sm font-medium ${darkMode ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
            disabled={loading || googleLoading}
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Sign in' : 'Sign up'}
          </Button>
        </form>

        {/* Toggle Mode - 더 작게 */}
        <p className={`text-center mt-4 text-xs ${mutedColor}`}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className={`font-medium hover:underline ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            disabled={loading || googleLoading}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}





