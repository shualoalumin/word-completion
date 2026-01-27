import React from 'react';
import { Outlet } from 'react-router-dom';
import { GlobalHeader } from './GlobalHeader';
import { useDarkMode } from '@/core/hooks';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
    children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const { darkMode } = useDarkMode();

    return (
        <div className={cn(
            "min-h-screen transition-colors duration-300",
            darkMode ? "bg-zinc-950" : "bg-gray-50"
        )}>
            <GlobalHeader />
            <main>
                {children || <Outlet />}
            </main>
        </div>
    );
};

export default AppLayout;
