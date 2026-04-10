'use client';

import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'motion/react';
import { Eye, EyeOff, RefreshCw, Sparkles, ArrowLeft } from 'lucide-react';

type LoginViewProps = {
  onLoginSuccess: () => void;
  onBack: () => void;
};

export default function LoginView({ onLoginSuccess, onBack }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('E-mail ou senha incorretos. Tente novamente.');
        return;
      }

      if (result?.ok) {
        onLoginSuccess();
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError('Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] flex flex-col lg:flex-row overflow-x-hidden">
      {/* Painel esquerdo - Brand & Visual */}
      <div className="relative w-full lg:w-1/2 lg:max-w-[50%] min-h-[220px] lg:min-h-screen shrink-0 bg-gradient-to-br from-primary via-primary to-amber-600 overflow-hidden flex items-center justify-center p-8 lg:p-16">
        {/* Formas decorativas */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-32 w-80 h-80 rounded-full bg-amber-400/20 blur-2xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl" />
          {/* Grid sutil */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(to right, white 1px, transparent 1px),
                linear-gradient(to bottom, white 1px, transparent 1px)`,
              backgroundSize: '40px 40px',
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 text-center lg:text-left max-w-md"
        >
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold mb-6">
            <Sparkles size={18} />
            Inovação Imperatriz
          </div>
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
            Sua Jornada
            <br />
            <span className="text-amber-100">continua aqui</span>
          </h1>
          <p className="mt-6 text-lg text-white/90 font-medium">
            Acesse o painel de gestão e siga transformando o protagonismo feminino
            na produção sustentável.
          </p>
          <div className="hidden lg:flex mt-12 gap-3">
            <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-white/40 animate-pulse" style={{ animationDelay: '200ms' }} />
            <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse" style={{ animationDelay: '400ms' }} />
          </div>
        </motion.div>
      </div>

      {/* Painel direito - Formulário */}
      <div className="relative w-full lg:w-1/2 lg:max-w-[50%] min-w-0 flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-background-light">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md mx-auto"
        >
          {/* Card mobile: mostra branding compacto */}
          <div className="lg:hidden text-center mb-8">
            <h2 className="text-xl font-black text-slate-900">Sua Jornada Continua</h2>
            <p className="text-slate-500 text-sm mt-1">Inovação Imperatriz</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 p-8 lg:p-10">
            <div className="space-y-2 mb-8">
              <h2 className="text-2xl font-black text-slate-900">
                Bem-vinda ao painel
              </h2>
              <p className="text-slate-500">
                Use seu e-mail e senha para acessar
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all placeholder:text-slate-400"
                    placeholder="seu@email.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/25 focus:border-primary outline-none transition-all placeholder:text-slate-400 pr-12"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {error && (
                  <p className="text-red-500 text-sm font-medium bg-red-50 px-3 py-2 rounded-xl">
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <RefreshCw size={20} className="animate-spin" />
                ) : (
                  <>Continuar para o painel</>
                )}
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 text-slate-500 text-sm font-medium hover:text-primary transition-colors py-2"
              >
                <ArrowLeft size={16} />
                Voltar ao início
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
