import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import ResetPasswordScreen from '@/components/ResetPasswordScreen';

const NewOnboarding = lazy(() => import('@/components/onboarding/NewOnboarding'));
const Dashboard = lazy(() => import('@/components/Dashboard'));
const HistoryScreen = lazy(() => import('@/components/HistoryScreen'));
const ProfileScreen = lazy(() => import('@/components/ProfileScreen'));
const InsightsScreen = lazy(() => import('@/components/InsightsScreen'));



type Page = 'dashboard' | 'history' | 'profile' | 'insights';

const getResetCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  if (params.get('mode') === 'resetPassword') return params.get('oobCode');
  return null;
};

const storySeenKey = (uid: string) => `brotein_story_seen:${uid}`;
const paywallSeenKey = (uid: string) => `brotein_paywall_seen:${uid}`;
const ONBOARDING_AUTH_RESUME_KEY = 'brotein_onboarding_auth_resume';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [resetCode, setResetCode] = useState<string | null>(() => getResetCode());
  const [storySeen, setStorySeen] = useState(false);
  const [paywallSeen, setPaywallSeen] = useState(false);
  const [resumePaywall, setResumePaywall] = useState(false);

  // Recompute per-user when auth state changes — prevents User A's "seen"
  // state from suppressing the story for User B on the same device.
  useEffect(() => {
    if (!user) { setStorySeen(false); setPaywallSeen(false); setResumePaywall(false); return; }
    const shouldResumePaywall = sessionStorage.getItem(ONBOARDING_AUTH_RESUME_KEY) === 'paywall';
    setResumePaywall(shouldResumePaywall);
    if (shouldResumePaywall) {
      setStorySeen(true);
      setPaywallSeen(false);
      return;
    }
    setStorySeen(localStorage.getItem(storySeenKey(user.uid)) === '1');
    setPaywallSeen(localStorage.getItem(paywallSeenKey(user.uid)) === '1');
  }, [user]);

  const prevProfileRef = useRef(profile);
  useEffect(() => {
    if (!prevProfileRef.current && profile) setPage('dashboard');
    prevProfileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    const reset = () => {
      try { window.scrollTo(0, 0); } catch { /* noop */ }
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;
      const root = document.getElementById('root');
      if (root) root.scrollTop = 0;
    };
    reset();
    const raf = requestAnimationFrame(reset);
    const t = window.setTimeout(reset, 60);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [page, profile]);

  const completeOnboarding = () => {
    if (user) {
      localStorage.setItem(storySeenKey(user.uid), '1');
      localStorage.setItem(paywallSeenKey(user.uid), '1');
    }
    setStorySeen(true);
    setPaywallSeen(true);
  };

  const clearResetCode = () => {
    setResetCode(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="text-[32px] font-black tracking-tight leading-none mb-4" style={{ fontFamily: '"SF Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' }}>BROTEIN</h1>
        <p className="label-spaced mb-0 opacity-50">LOADING…</p>
      </div>
    );
  }

  if (resetCode) return <ResetPasswordScreen oobCode={resetCode} onDone={clearResetCode} />;

  if (!user || !storySeen || !profile || !paywallSeen) {
    return (
      <Suspense fallback={null}>
        <NewOnboarding onDone={completeOnboarding} initialStep={resumePaywall ? 26 : 1} />
      </Suspense>
    );
  }



  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={page}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <Suspense fallback={null}>
          {page === 'history' && <HistoryScreen onBack={() => setPage('dashboard')} />}
          {page === 'profile' && <ProfileScreen onBack={() => setPage('dashboard')} />}
          {page === 'insights' && <InsightsScreen onBack={() => setPage('dashboard')} />}
          
          
          {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
};

export default Index;