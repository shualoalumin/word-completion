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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// OAuth 콜백 처리를 위한 컴포넌트
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // OAuth 콜백 처리
    const handleAuthCallback = async () => {
      // URL hash에서 access_token 확인 (OAuth 콜백)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const error = hashParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        return;
      }

      if (accessToken) {
        // Supabase가 자동으로 세션을 처리하지만, 명시적으로 확인
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // Dashboard로 리디렉션
          navigate('/dashboard', { replace: true });
        }
      }
    };

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // OAuth 로그인 성공 시 Dashboard로 리디렉션
          if (location.pathname === '/' || location.pathname === '/dashboard') {
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

    // 초기 콜백 처리
    handleAuthCallback();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/practice/text-completion" element={<Practice />} />
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
