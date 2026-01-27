import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserProfile, useUpdateProfile } from '@/features/settings';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const updateProfileMutation = useUpdateProfile();

  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal || 5);
  const [preferredDifficulty, setPreferredDifficulty] = useState(profile?.preferred_difficulty || '');
  const [locale, setLocale] = useState(profile?.locale || 'en');

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setDailyGoal(profile.daily_goal || 5);
      setPreferredDifficulty(profile.preferred_difficulty || '');
      setLocale(profile.locale || 'en');
    }
  }, [profile]);

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    navigate('/');
    return null;
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">{t('common.loading')}</div>
      </div>
    );
  }

  const handleSave = async () => {
    await updateProfileMutation.mutateAsync({
      display_name: displayName || null,
      daily_goal: dailyGoal,
      preferred_difficulty: preferredDifficulty || null,
      locale,
    });
  };

  const handleLanguageChange = (newLocale: string) => {
    setLocale(newLocale);
    i18n.changeLanguage(newLocale);
  };

  return (
    <div className="text-white">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Settings Content */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Settings</h1>

          {/* Profile Section */}
          <section className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Display Name
                </label>
                <Input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-zinc-800/50 border-zinc-700 text-zinc-500"
                />
                <p className="text-xs text-zinc-500 mt-1">Email cannot be changed</p>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="p-6 bg-zinc-900/60 border border-zinc-800 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Preferences</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Language
                </label>
                <select
                  value={locale}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="ko">한국어</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Daily Goal
                </label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value) || 5)}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <p className="text-xs text-zinc-500 mt-1">Number of exercises to complete per day</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Preferred Difficulty
                </label>
                <select
                  value={preferredDifficulty}
                  onChange={(e) => setPreferredDifficulty(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  <option value="easy">Easy</option>
                  <option value="intermediate">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateProfileMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateProfileMutation.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
