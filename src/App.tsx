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
import Vocabulary from "./pages/Vocabulary";
import VocabularyReview from "./pages/VocabularyReview";
import History from "./pages/History";
import Bookmarks from "./pages/Bookmarks";
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

        // 자동 리디렉션 제거: 사용자가 명시적으로 로그인할 때만 Dashboard로 이동
        // 이미 로그인된 사용자가 랜딩 페이지에 접속해도 자동 리디렉션하지 않음
        
        if (event === 'SIGNED_OUT') {
          // 로그아웃 시 Dashboard에서 Landing으로 리디렉션
          if (location.pathname.startsWith('/dashboard')) {
            navigate('/', { replace: true });
          }
        }
        // SIGNED_IN 이벤트는 각 페이지에서 처리 (Landing의 handleAuthSuccess 등)
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
      <Route path="/vocabulary" element={<Vocabulary />} />
      <Route path="/vocabulary/review" element={<VocabularyReview />} />
      <Route path="/history" element={<History />} />
      <Route path="/bookmarks" element={<Bookmarks />} />
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
