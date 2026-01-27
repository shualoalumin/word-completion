/**
 * Global Header Component
 * 모든 페이지에 통일된 헤더 제공
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { Button } from '@/components/ui/button';
import { DarkModeToggle } from '@/components/common';
import { useDarkMode } from '@/core/hooks';
import { cn } from '@/lib/utils';

interface GlobalHeaderProps {
  darkMode?: boolean;
  className?: string;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
  className,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, signOut } = useAuth();
  const { darkMode, toggle: toggleDarkMode } = useDarkMode();

  const navItems = [
    { path: '/dashboard', label: t('dashboard.title') },
    { path: '/practice/text-completion', label: t('practice.title') },
    { path: '/vocabulary', label: t('vocabulary.title') },
    { path: '/bookmarks', label: t('bookmarks.title') },
    { path: '/history', label: t('history.title') },
    { path: '/achievements', label: 'Achievements' },
    { path: '/settings', label: 'Settings' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b',
        darkMode
          ? 'bg-zinc-950/80 backdrop-blur-sm border-zinc-800'
          : 'bg-white/80 backdrop-blur-sm border-gray-200',
        className
      )}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Home */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/dashboard')}
              className={cn(
                'text-lg font-bold transition-colors',
                darkMode ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
              )}
            >
              TOEFL Practice
            </button>

            {/* Navigation Links */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                    (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'text-sm',
                        isActive
                          ? darkMode
                            ? 'text-blue-400 bg-blue-400/10'
                            : 'text-blue-600 bg-blue-50'
                          : darkMode
                            ? 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      {item.label}
                    </Button>
                  );
                })}
              </nav>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <DarkModeToggle darkMode={darkMode} onToggle={toggleDarkMode} />
            {isAuthenticated && user ? (
              <UserMenu user={user} onSignOut={signOut} darkMode={darkMode} />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className={darkMode ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800' : ''}
              >
                {t('common.signIn')}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <div className="md:hidden pb-3 border-t border-zinc-800 mt-2 pt-3">
            <nav className="flex items-center gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path ||
                  (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'text-xs whitespace-nowrap',
                      isActive
                        ? darkMode
                          ? 'text-blue-400 bg-blue-400/10'
                          : 'text-blue-600 bg-blue-50'
                        : darkMode
                          ? 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    )}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
