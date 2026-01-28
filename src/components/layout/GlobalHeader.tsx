/**
 * Global Header Component
 * 모든 페이지에 통일된 헤더 제공
 * GitHub-style responsive navigation with "More" menu
 * Prevents header from wrapping to two lines
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
import {
  LayoutDashboard,
  PencilLine,
  Book,
  Bookmark,
  History,
  Trophy,
  Settings,
  ChevronDown,
  MoreHorizontal,
  MoreVertical
} from 'lucide-react';

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
    { path: '/dashboard', label: t('dashboard.title'), icon: LayoutDashboard },
    { path: '/practice', label: 'Practice', icon: PencilLine },
    { path: '/vocabulary', label: 'My Vocab', icon: Book },
    { path: '/bookmarks', label: t('bookmarks.title'), icon: Bookmark },
    { path: '/history', label: t('history.title'), icon: History },
    { path: '/achievements', label: 'Achievements', icon: Trophy },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const { visibleItems, hiddenItems, containerRef, moreButtonRef, rightSideRef, logoRef, setItemRef } = useResponsiveNav(navItems);

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
        <div className="flex flex-col">
          {/* Main Header Row */}
          <div className="flex items-center justify-between h-16 flex-nowrap">
            {/* Logo / Home */}
            <div className="flex items-center gap-4 flex-1 min-w-0 flex-nowrap h-full">
              <button
                ref={logoRef}
                onClick={() => navigate('/dashboard')}
                className={cn(
                  'flex items-center gap-2 px-2 h-full transition-colors shrink-0',
                  darkMode ? 'text-white hover:text-blue-400' : 'text-gray-900 hover:text-blue-600'
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg",
                  darkMode ? "bg-zinc-800 text-white" : "bg-zinc-900 text-white"
                )}>
                  T
                </div>
                <span className="font-bold hidden sm:inline-block">TOEFL Prep</span>
              </button>

              {/* Navigation Links - GitHub Style Responsive */}
              {isAuthenticated && (
                <nav
                  ref={containerRef}
                  className="hidden md:flex items-center h-full flex-1 min-w-0 overflow-hidden flex-nowrap"
                >
                  {/* Visible Navigation Items */}
                  {visibleItems.map((item) => {
                    const active = isActive(item.path);
                    const Icon = (item as any).icon;
                    return (
                      <button
                        key={item.path}
                        ref={(el) => setItemRef(item.path, el)}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'relative h-full px-3 flex items-center gap-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap group',
                          active
                            ? darkMode
                              ? 'text-white border-orange-500'
                              : 'text-gray-900 border-orange-500'
                            : 'border-transparent',
                          !active && (darkMode
                            ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80')
                        )}
                      >
                        {Icon && <Icon className={cn("w-4 h-4", active ? "text-orange-500" : "text-zinc-400 group-hover:text-zinc-300")} />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}

                  {/* More Menu Item Inside Nav */}
                  {hiddenItems.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          ref={moreButtonRef}
                          className={cn(
                            'relative h-full px-3 flex items-center gap-1 text-sm font-medium transition-colors border-b-2 border-transparent whitespace-nowrap',
                            darkMode
                              ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80'
                          )}
                        >
                          <MoreHorizontal className="w-4 h-4 mr-1" />
                          More
                          <ChevronDown className="w-3 h-3 opacity-50" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className={cn(
                          'w-48',
                          darkMode
                            ? 'bg-zinc-900 border-zinc-800'
                            : 'bg-white border-gray-200 shadow-lg'
                        )}
                      >
                        {hiddenItems.map((item) => {
                          const active = isActive(item.path);
                          const Icon = (item as any).icon;
                          return (
                            <DropdownMenuItem
                              key={item.path}
                              onClick={() => navigate(item.path)}
                              className={cn(
                                'flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors',
                                active
                                  ? darkMode
                                    ? 'text-white bg-zinc-800'
                                    : 'text-gray-900 bg-gray-100'
                                  : darkMode
                                    ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                              )}
                            >
                              {Icon && <Icon className="w-4 h-4" />}
                              <span className="flex-1">{item.label}</span>
                              {active && <div className="w-1 h-1 rounded-full bg-orange-500" />}
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
            <div ref={rightSideRef} className="flex items-center gap-3 shrink-0 flex-nowrap pl-4">
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
        </div>

        {/* Mobile Navigation - Also use More menu instead of scrollbar */}
        {isAuthenticated && (
          <div className="md:hidden py-1 border-t border-zinc-200 dark:border-zinc-800 mt-0">
            <nav className="flex items-center justify-between px-2 h-10 overflow-hidden">
              <div className="flex items-center gap-1 flex-1 min-w-0 h-full overflow-x-auto no-scrollbar">
                {navItems.slice(0, 3).map((item) => {
                  const active = isActive(item.path);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={cn(
                        'flex items-center gap-1 px-1.5 min-[380px]:px-2 h-full text-[11px] min-[380px]:text-xs font-medium transition-colors border-b-2 whitespace-nowrap',
                        active
                          ? darkMode
                            ? 'text-white border-orange-500'
                            : 'text-gray-900 border-orange-500'
                          : 'border-transparent text-zinc-500'
                      )}
                    >
                      {Icon && <Icon className={cn("w-3.5 h-3.5 min-[380px]:w-4 min-[380px]:h-4", active ? "text-orange-500" : "text-zinc-400")} />}
                      {item.label}
                    </button>
                  );
                })}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'flex items-center justify-center gap-1 px-1.5 min-[380px]:px-2 h-full text-[11px] min-[380px]:text-xs font-medium transition-colors border-b-2 border-transparent text-zinc-500 whitespace-nowrap ml-1',
                    )}
                  >
                    <MoreVertical className="w-4 h-4 min-[380px]:hidden" />
                    <MoreHorizontal className="w-4 h-4 hidden min-[380px]:block" />
                    <span className="hidden min-[380px]:inline">More</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className={cn(
                    'w-48',
                    darkMode
                      ? 'bg-zinc-900 border-zinc-800'
                      : 'bg-white border-gray-200 shadow-lg px-1 py-1'
                  )}
                >
                  {navItems.slice(3).map((item) => {
                    const active = isActive(item.path);
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 cursor-pointer rounded-md transition-colors mb-0.5 last:mb-0',
                          active
                            ? darkMode
                              ? 'text-white bg-zinc-800'
                              : 'text-gray-900 bg-gray-100'
                            : darkMode
                              ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        )}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
