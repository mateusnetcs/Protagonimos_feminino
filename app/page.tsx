'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import LandingPage from '../components/LandingPage';
import LoginView from '../components/LoginView';
import ManagementView from '../components/ManagementView';
import SurveyApp from '../components/SurveyApp';

export default function Page() {
  const { data: session, status } = useSession();
  const [view, setView] = useState<'landing' | 'survey' | 'login' | 'management'>('landing');

  // Após login, o cookie NextAuth persiste; sem isso o estado React voltava sempre à landing no F5
  useEffect(() => {
    if (status !== 'authenticated') return;
    if (session?.user) {
      setView('management');
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" aria-label="Carregando sessão" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `,
        }}
      />
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LandingPage
              onStart={() => setView('survey')}
              onGoToManagement={() => setView('login')}
            />
          </motion.div>
        )}
        {view === 'survey' && (
          <motion.div
            key="survey"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SurveyApp onBackToLanding={() => setView('landing')} />
          </motion.div>
        )}
        {view === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <LoginView
              onLoginSuccess={() => setView('management')}
              onBack={() => setView('landing')}
            />
          </motion.div>
        )}
        {view === 'management' && (
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          }>
            <motion.div
              key="management"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <ManagementView onBack={() => setView('landing')} />
            </motion.div>
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}
