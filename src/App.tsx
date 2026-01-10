import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// OAuth 콜백 처리를 위한 컴포넌트
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Auth 상태 변경 리스너 (팝업이 아닌 경우에만 리디렉션)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // 팝업 창이 아닌 경우에만 리디렉션 처리
        if (window.opener) {
          // 팝업 창에서는 AuthCallback 페이지가 처리
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          // 일반 OAuth 로그인 성공 시 Dashboard로 리디렉션
          if (location.pathname === '/' || location.pathname === '/auth/callback') {
            navigate('/dashboard', { replace: true });
          }
        } else if (event === 'SIGNED_OUT') {
          // 로그아웃 시 Landing으로 리디렉션
          if (location.pathname.startsWith('/dashboard')) {
            navigate('/', { replace: true });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/practice/text-completion" element={<Practice />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
