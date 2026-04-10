import { useState } from 'react';
import { isOnboarded } from '@/lib/store';
import OnboardingFlow from '@/components/OnboardingFlow';
import Dashboard from '@/components/Dashboard';
import HistoryScreen from '@/components/HistoryScreen';
import ProfileScreen from '@/components/ProfileScreen';

type Page = 'dashboard' | 'history' | 'profile';

const Index = () => {
  const [onboarded, setOnboarded] = useState(isOnboarded());
  const [page, setPage] = useState<Page>('dashboard');

  if (!onboarded) {
    return <OnboardingFlow onComplete={() => setOnboarded(true)} />;
  }

  switch (page) {
    case 'history':
      return <HistoryScreen onBack={() => setPage('dashboard')} />;
    case 'profile':
      return <ProfileScreen onBack={() => setPage('dashboard')} />;
    default:
      return <Dashboard onNavigate={setPage} />;
  }
};

export default Index;
