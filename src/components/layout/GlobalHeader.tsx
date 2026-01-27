/**
 * Global Header Component
 * 모든 페이지에 통일된 헤더 제공
 * GitHub-style responsive navigation with "More" menu
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DarkModeToggle } from '@/components/common';
import { useDarkMode } from '@/core/hooks';
import { cn } from '@/lib/utils';
import { useResponsiveNav } from './hooks/useResponsiveNav';

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
    { path: '/practice', label: t('practiceSelection.title', 'Practice') },
    { path: '/vocabulary', label: t('vocabulary.title') },
    { path: '/bookmarks', label: t('bookmarks.title') },
    { path: '/history', label: t('history.title') },
    { path: '/achievements', label: 'Achievements' },
    { path: '/settings', label: 'Settings' },
  ];

  const { visibleItems, hiddenItems, containerRef, moreButtonRef, setItemRef } = useResponsiveNav(navItems);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === path;
    }
    if (path === '/practice') {
      return location.pathname.startsWith('/practice');
    }
    return location.pathname.startsWith(path);
  };

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
          <div className="flex items-center gap-6 flex-1 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className={cn(
                'text-lg font-bold transition-colors shrink-0',
                darkMode ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
              )}
            >
              TOEFL Practice
            </button>

            {/* Navigation Links - GitHub Style Responsive */}
            {isAuthenticated && (
              <nav
                ref={containerRef}
                className="hidden md:flex items-center gap-1 flex-1 min-w-0 overflow-hidden"
              >
                {/* Visible Navigation Items */}
                {visibleItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Button
                      key={item.path}
                      ref={(el) => setItemRef(item.path, el)}
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'text-sm shrink-0',
                        active
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

                {/* More Menu - GitHub Style */}
                {hiddenItems.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        ref={moreButtonRef}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          'text-sm shrink-0',
                          darkMode
                            ? 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        )}
                      >
                        More
                        <svg
                          className="w-4 h-4 ml-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className={cn(
                        darkMode
                          ? 'bg-zinc-900 border-zinc-800'
                          : 'bg-white border-gray-200'
                      )}
                    >
                      {hiddenItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                          <DropdownMenuItem
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                              'cursor-pointer',
                              active
                                ? darkMode
                                  ? 'text-blue-400 bg-blue-400/10'
                                  : 'text-blue-600 bg-blue-50'
                                : darkMode
                                  ? 'text-zinc-300'
                                  : 'text-gray-900'
                            )}
                          >
                            {item.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </nav>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3 shrink-0">
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

        {/* Mobile Navigation - Also use More menu instead of scrollbar */}
        {isAuthenticated && (
          <div className="md:hidden pb-3 border-t border-zinc-800 mt-2 pt-3">
            <nav className="flex items-center gap-1 flex-wrap">
              {navItems.slice(0, 4).map((item) => {
                const active = isActive(item.path);
                return (
                  <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'text-xs whitespace-nowrap',
                      active
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
              {navItems.length > 4 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        'text-xs whitespace-nowrap',
                        darkMode
                          ? 'text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      )}
                    >
                      More
                      <svg
                        className="w-3 h-3 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={cn(
                      darkMode
                        ? 'bg-zinc-900 border-zinc-800'
                        : 'bg-white border-gray-200'
                    )}
                  >
                    {navItems.slice(4).map((item) => {
                      const active = isActive(item.path);
                      return (
                        <DropdownMenuItem
                          key={item.path}
                          onClick={() => navigate(item.path)}
                          className={cn(
                            'cursor-pointer',
                            active
                              ? darkMode
                                ? 'text-blue-400 bg-blue-400/10'
                                : 'text-blue-600 bg-blue-50'
                              : darkMode
                                ? 'text-zinc-300'
                                : 'text-gray-900'
                          )}
                        >
                          {item.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
