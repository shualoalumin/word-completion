/**
 * App Layout Component
 * 인증된 사용자를 위한 공통 레이아웃 (GlobalHeader 포함)
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { GlobalHeader } from './GlobalHeader';

interface AppLayoutProps {
    children?: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-zinc-950">
            <GlobalHeader darkMode={true} />
            <main>
                {children || <Outlet />}
            </main>
        </div>
    );
};

export default AppLayout;
