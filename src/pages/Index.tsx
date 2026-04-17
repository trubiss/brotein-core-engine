import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import SignInScreen from '@/components/SignInScreen';
import OnboardingFlow from '@/components/OnboardingFlow';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="label-spaced mb-0">LOADING…</p>
      </div>
    );
  }

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
