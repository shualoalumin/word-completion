import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import TextCompletionExercise from '@/features/reading/text-completion';
import { Button } from '@/components/ui/button';

export default function Practice() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Back to Dashboard button for authenticated users */}
      {isAuthenticated && (
        <div className="fixed top-4 left-4 z-50">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            onClick={() => navigate('/dashboard')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Button>
        </div>
      )}

      {/* Demo banner for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border-b border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-zinc-300">
              🎮 <span className="font-medium">Demo Mode</span> — Sign in to save your progress
            </p>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/')}
            >
              Sign In
            </Button>
          </div>
        </div>
      )}

      <TextCompletionExercise />
    </div>
  );
}

