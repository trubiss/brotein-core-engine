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

const BuildStamp = () => {
  const ts = typeof __BUILD_TIMESTAMP__ !== 'undefined' ? __BUILD_TIMESTAMP__ : 'DEV';
  const label = ts === 'DEV' ? 'DEV' : `V2 · ${ts}`;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 2147483647,
      pointerEvents: 'none',
      padding: '4px 8px',
      fontFamily: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.05em',
      color: '#fff',
      background: '#000',
    }}>
      {label}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BuildStamp />
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
