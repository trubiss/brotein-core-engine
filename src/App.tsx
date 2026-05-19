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
import Paywall from "./components/Paywall";
import { useEffect } from "react";

const queryClient = new QueryClient();

function PaywallPreview({ plan }: { plan: 'annual' | 'monthly' }) {
  useEffect(() => {
    if (plan !== 'monthly') return;
    const t = setTimeout(() => {
      const btns = Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'));
      const monthly = btns.find(b => b.textContent?.includes('/ MO'));
      monthly?.click();
    }, 100);
    return () => clearTimeout(t);
  }, [plan]);
  return <Paywall onStart={() => {}} streak={0} />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/__paywall-annual" element={<PaywallPreview plan="annual" />} />
            <Route path="/__paywall-monthly" element={<PaywallPreview plan="monthly" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>

        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
