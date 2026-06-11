import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import PrivacyPolicy from "./components/legal/PrivacyPolicy";
import TermsOfService from "./components/legal/TermsOfService";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const BuildStamp = () => (
  <div
    aria-label="Build version stamp"
    style={{
      position: 'fixed',
      top: 'max(10px, env(safe-area-inset-top))',
      left: 10,
      zIndex: 2147483647,
      background: '#000',
      color: '#fff',
      fontFamily: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: 11,
      fontWeight: 900,
      lineHeight: 1.25,
      padding: '5px 7px',
      letterSpacing: 0,
      pointerEvents: 'none',
    }}
  >
    V2 · {typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__.slice(5, 19).replace('T', ' ') : 'DEV'}
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BuildStamp />
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="*" element={<NotFound />} />
          </Routes>


        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
