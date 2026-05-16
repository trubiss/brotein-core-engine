import { lazy, Suspense, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import SignInScreen from '@/components/SignInScreen';
import OnboardingFlow from '@/components/OnboardingFlow';
import OnboardingStoryFlow from '@/components/OnboardingStoryFlow';

import Dashboard from '@/components/Dashboard';
import ResetPasswordScreen from '@/components/ResetPasswordScreen';

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

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [resetCode, setResetCode] = useState<string | null>(() => getResetCode());
  const [storySeen, setStorySeen] = useState<boolean>(() =>
    typeof window !== 'undefined' && localStorage.getItem('brotein_story_seen') === '1'
  );

  const completeStory = () => {
    localStorage.setItem('brotein_story_seen', '1');
    setStorySeen(true);
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
        <h1 className="font-mono text-4xl tracking-tighter mb-4">BROTEIN</h1>
        <p className="label-spaced mb-0 opacity-50">LOADING…</p>
      </div>
    );
  }

  if (resetCode) return <ResetPasswordScreen oobCode={resetCode} onDone={clearResetCode} />;
  if (!user) return <SignInScreen />;
  if (!storySeen) return <OnboardingStoryFlow onComplete={completeStory} />;
  if (!profile) return <OnboardingFlow />;

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
