import { useEffect } from 'react';
import { ThemeProvider } from '@/core/contexts/ThemeContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import LandingA from "./pages/LandingA";
import LandingB from "./pages/LandingB";
import LandingC from "./pages/LandingC";
import Dashboard from "./pages/Dashboard";
import Practice from './pages/Practice';
import PracticeSelection from './pages/PracticeSelection';
import BuildSentence from './pages/BuildSentence';
import Vocabulary from "./pages/Vocabulary";
import VocabularyReview from "./pages/VocabularyReview";
import History from "./pages/History";
import Bookmarks from "./pages/Bookmarks";
import Settings from "./pages/Settings";
import Achievements from "./pages/Achievements";
import Leaderboard from "./pages/Leaderboard";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// OAuth 콜백 처리�??�한 컴포?�트
const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Auth ?�태 변�?리스??(?�업???�닌 경우?�만 리디?�션)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // ?�업 창이 ?�닌 경우?�만 리디?�션 처리
        if (window.opener) {
          // ?�업 창에?�는 AuthCallback ?�이지가 처리
          return;
        }

        // ?�동 리디?�션 ?�거: ?�용?��? 명시?�으�?로그?�할 ?�만 Dashboard�??�동
        // ?��? 로그?�된 ?�용?��? ?�딩 ?�이지???�속?�도 ?�동 리디?�션?��? ?�음

        if (event === 'SIGNED_OUT') {
          // 로그?�웃 ??Dashboard?�서 Landing?�로 리디?�션
          if (location.pathname.startsWith('/dashboard')) {
            navigate('/', { replace: true });
          }
        }
        // SIGNED_IN ?�벤?�는 �??�이지?�서 처리 (Landing??handleAuthSuccess ??
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  return (
    <Routes>
      {/* ?�딩 ?�이지 - ?�더 ?�음 */}
      <Route path="/" element={<Landing />} />
      <Route path="/landing/a" element={<LandingA />} />
      <Route path="/landing/b" element={<LandingB />} />
      <Route path="/landing/c" element={<LandingC />} />

      {/* ?�증 콜백 - ?�더 ?�음 */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* AppLayout???�용?�는 모든 ?�증 ?�이지 */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/practice" element={<PracticeSelection />} />
        <Route path="/practice/text-completion" element={<Practice />} />
        <Route path="/practice/build-sentence" element={<BuildSentence />} />
        <Route path="/vocabulary" element={<Vocabulary />} />
        <Route path="/vocabulary/review" element={<VocabularyReview />} />
        <Route path="/history" element={<History />} />
        <Route path="/bookmarks" element={<Bookmarks />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Route>

      {/* 404 ?�이지 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
