import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import TextCompletionExercise from '@/features/reading/text-completion';
import { Button } from '@/components/ui/button';

export default function Practice() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="">
      {/* Demo banner for non-authenticated users - at the top */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border-b border-zinc-800">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-zinc-300">
              🎮 <span className="font-medium">Demo Mode</span> — {t('auth.signIn')} to save your progress
            </p>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate('/')}
            >
              {t('auth.signIn')}
            </Button>
          </div>
        </div>
      )}

      {/* Exercise component - Dashboard navigation is now inside ExerciseLayout */}
      <TextCompletionExercise />
    </div>
  );
}

