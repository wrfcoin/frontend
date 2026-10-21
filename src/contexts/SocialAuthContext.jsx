import { createContext, useContext, useState, useCallback } from 'react';
import { useSocialAuth } from '../hooks/useSocialAuth';
import { SocialOnboardingModal } from '../components/auth/SocialOnboardingModal';

export const SocialAuthContext = createContext();

export function SocialAuthProvider({ children }) {
  const auth = useSocialAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const openSocialOnboarding = useCallback(() => setModalOpen(true), []);
  return (
    <SocialAuthContext.Provider value={{ ...auth, openSocialOnboarding }}>
      {children}
      <SocialOnboardingModal open={modalOpen} onClose={() => setModalOpen(false)}
        onSuccess={(addr) => { auth.loginSucceeded(addr); setModalOpen(false); }} />
    </SocialAuthContext.Provider>
  );
}

export const useSocialAuthContext = () => useContext(SocialAuthContext);
