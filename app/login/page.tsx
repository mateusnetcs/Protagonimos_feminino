'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import LoginView from '@/components/LoginView';

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.replace('/');
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (status === 'authenticated') {
    return null;
  }

  return (
    <LoginView
      onLoginSuccess={() => router.push('/')}
      onBack={() => router.push('/')}
    />
  );
}
