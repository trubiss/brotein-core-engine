import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isOnboarded } from '@/lib/store';
import OnboardingFlow from '@/components/OnboardingFlow';
import Dashboard from '@/components/Dashboard';
import HistoryScreen from '@/components/HistoryScreen';
import ProfileScreen from '@/components/ProfileScreen';

type Page = 'dashboard' | 'history' | 'profile';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const Index = () => {
  const [onboarded, setOnboarded] = useState(isOnboarded());
  const [page, setPage] = useState<Page>('dashboard');

  if (!onboarded) {
    return <OnboardingFlow onComplete={() => setOnboarded(true)} />;
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
        {page === 'history' && <HistoryScreen onBack={() => setPage('dashboard')} />}
        {page === 'profile' && <ProfileScreen onBack={() => setPage('dashboard')} />}
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
      </motion.div>
    </AnimatePresence>
  );
};

export default Index;
