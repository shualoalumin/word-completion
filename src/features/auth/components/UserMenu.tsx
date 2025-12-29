import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface UserMenuProps {
  user: User;
  onSignOut: () => void;
  darkMode?: boolean;
}

export function UserMenu({ user, onSignOut, darkMode = false }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
      onSignOut();
    } catch (error: any) {
      toast.error(error.message || 'Sign out failed');
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const avatarUrl = user.user_metadata?.avatar_url;
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.substring(0, 2).toUpperCase();

  const bgColor = darkMode ? 'bg-zinc-800' : 'bg-white';
  const textColor = darkMode ? 'text-white' : 'text-gray-900';
  const mutedColor = darkMode ? 'text-zinc-400' : 'text-gray-500';
  const borderColor = darkMode ? 'border-zinc-700' : 'border-gray-200';

  return (
    <div className="relative">
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className={`w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium`}>
            {initials}
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-lg z-50 ${bgColor} ${textColor} border ${borderColor}`}>
            <div className="p-4 border-b ${borderColor}">
              <p className="font-medium truncate">{displayName}</p>
              <p className={`text-sm ${mutedColor} truncate`}>{user.email}</p>
            </div>
            
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={handleSignOut}
                disabled={loading}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {loading ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

