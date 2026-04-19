import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import SignInScreen from '@/components/SignInScreen';
import OnboardingFlow from '@/components/OnboardingFlow';
import WelcomeCarousel from '@/components/WelcomeCarousel';
import Dashboard from '@/components/Dashboard';
import HistoryScreen from '@/components/HistoryScreen';
import ProfileScreen from '@/components/ProfileScreen';
import InsightsScreen from '@/components/InsightsScreen';

type Page = 'dashboard' | 'history' | 'profile' | 'insights';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const Index = () => {
  const { user, profile, loading } = useAuth();
  const [page, setPage] = useState<Page>('dashboard');
  const [welcomeSeen, setWelcomeSeen] = useState<boolean>(() =>
    typeof window !== 'undefined' && localStorage.getItem('brotein_welcome_seen') === '1'
  );

  const completeWelcome = () => {
    localStorage.setItem('brotein_welcome_seen', '1');
    setWelcomeSeen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <h1 className="font-mono text-4xl tracking-tighter mb-4">BROTEIN</h1>
        <p className="label-spaced mb-0 opacity-50">LOADING…</p>
      </div>
    );
  }

  if (!welcomeSeen) return <WelcomeCarousel onComplete={completeWelcome} />;
  if (!user) return <SignInScreen />;
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
        {page === 'history' && <HistoryScreen onBack={() => setPage('dashboard')} />}
        {page === 'profile' && <ProfileScreen onBack={() => setPage('dashboard')} />}
        {page === 'insights' && <InsightsScreen onBack={() => setPage('dashboard')} />}
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      </motion.div>
    </AnimatePresence>
  );
};

export default Index;
