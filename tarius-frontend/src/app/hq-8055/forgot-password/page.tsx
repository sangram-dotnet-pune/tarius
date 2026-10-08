// Filename: src/app/hq-8055/forgot-password/page.tsx

'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setStatusMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/hq-8055/reset-password',
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStatusMsg('If an account exists, a secure reset link has been dispatched to your email.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--tarius-graphite)] flex items-center justify-center relative overflow-hidden font-body selection:bg-[var(--tarius-champagne)] selection:text-[var(--tarius-graphite)]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--tarius-champagne)]/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center mb-10">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--tarius-champagne)] mb-4 block">
            Account Recovery
          </span>
          <h1 className="font-display text-4xl text-white tracking-widest mb-4">
            Reset Access
          </h1>
          <p className="text-stone-400 text-xs leading-relaxed font-light">
            Enter your authorized email address. We will send you a secure link to generate a new passphrase.
          </p>
        </div>

        <form onSubmit={handleReset} className="flex flex-col gap-8">
          <div className="relative group">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-white text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors peer placeholder-transparent"
              placeholder="Email Address"
            />
            <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-champagne)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
              Email Address
            </label>
          </div>

          {errorMsg && (
            <div className="bg-red-950/30 border border-red-500/30 p-4 text-center rounded-sm">
              <p className="text-xs text-red-400 tracking-wide">{errorMsg}</p>
            </div>
          )}

          {statusMsg && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 text-center rounded-sm">
              <p className="text-xs text-emerald-400 tracking-wide">{statusMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full border border-[var(--tarius-champagne)] text-[var(--tarius-champagne)] py-4 mt-4 text-xs tracking-[0.2em] uppercase hover:bg-[var(--tarius-champagne)] hover:text-[var(--tarius-graphite)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Transmitting...' : 'Send Recovery Link'}
          </button>

          <div className="text-center mt-4">
            <Link href="/hq-8055/login" className="text-[10px] tracking-widest uppercase text-stone-500 hover:text-white transition-colors">
              Return to Sign In
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}