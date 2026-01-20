/**
 * Usage Limit Banner Component
 * 사용량 제한 도달 시 표시되는 배너
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface UsageLimitBannerProps {
  remaining: number;
  limit: number;
  className?: string;
}

export const UsageLimitBanner: React.FC<UsageLimitBannerProps> = ({
  remaining,
  limit,
  className,
}) => {
  const navigate = useNavigate();

  if (remaining > 0) {
    return null; // Don't show if there's remaining usage
  }

  return (
    <div
      className={cn(
        'p-4 bg-amber-600/20 border border-amber-600/50 rounded-2xl',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-600/20 rounded-xl flex items-center justify-center">
            <svg
              className="w-5 h-5 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-amber-300">Daily Limit Reached</h3>
            <p className="text-sm text-amber-400/80">
              You've completed {limit} exercises today. Upgrade to Premium for unlimited access.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate('/settings')}
          className="bg-amber-600 hover:bg-amber-700"
        >
          Upgrade
        </Button>
      </div>
    </div>
  );
};
