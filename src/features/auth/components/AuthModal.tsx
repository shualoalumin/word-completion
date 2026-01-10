import { useState } from 'react';
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

  if (!isOpen) return null;

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
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
      // OAuth는 리디렉션이므로 여기서는 loading을 false로 하지 않음
      // (페이지가 리디렉션되므로)
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed');
      setLoading(false);
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

        {/* Google Sign In Button - 클릭 가능하고 hover 명확 */}
        <div className="mb-4">
          <button
            className={`w-full h-11 px-4 flex items-center justify-center font-medium rounded-lg border transition-all ${darkMode ? 'border-zinc-700 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/60 text-white active:bg-zinc-800/80' : 'border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50 text-gray-900 active:bg-gray-100'} ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={handleGoogleSignIn}
            disabled={loading}
            type="button"
            aria-label="Sign in with Google"
          >
            <svg className="w-4 h-4 mr-2.5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
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
            disabled={loading}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`h-10 text-sm ${inputBg} ${textColor}`}
            required
            minLength={6}
            disabled={loading}
          />
          <Button
            type="submit"
            className={`w-full h-10 text-sm font-medium ${darkMode ? 'bg-zinc-700 hover:bg-zinc-600 text-white' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
            disabled={loading}
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
            disabled={loading}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}





