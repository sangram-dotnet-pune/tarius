// Filename: src/app/hq-8055/reset-password/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email || '');
      setUserId(user.id);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passphrases do not match.');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Passphrase must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      setErrorMsg(updateError.message);
      setIsLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('AdminProfile')
      .update({ needs_password_reset: false })
      .eq('id', userId);

    if (profileError) {
      setErrorMsg('Security profile update failed. Please contact support.');
      setIsLoading(false);
      return;
    }

    router.push('/hq-8055');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--tarius-graphite)] flex items-center justify-center relative overflow-hidden font-body selection:bg-[var(--tarius-champagne)] selection:text-[var(--tarius-graphite)]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--tarius-champagne)]/5 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 bg-white/5 border border-white/10 backdrop-blur-md rounded-sm">
        <div className="text-center mb-10">
          <span className="text-[10px] tracking-[0.3em] uppercase text-amber-500 mb-4 block">
            Action Required
          </span>
          <h1 className="font-display text-3xl text-white tracking-widest mb-4">
            Rotate Passphrase
          </h1>
          <p className="text-stone-400 text-xs leading-relaxed font-light">
            Welcome, {userEmail}. For security purposes, you must configure a private passphrase before accessing the dashboard.
          </p>
        </div>

        <form onSubmit={handleReset} className="flex flex-col gap-8">
          <div className="relative group">
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-white text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors peer placeholder-transparent"
              placeholder="New Passphrase"
            />
            <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-champagne)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
              New Passphrase
            </label>
          </div>

          <div className="relative group">
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-white text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors peer placeholder-transparent"
              placeholder="Confirm Passphrase"
            />
            <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-champagne)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
              Confirm Passphrase
            </label>
          </div>

          {errorMsg && (
            <div className="bg-red-950/30 border border-red-500/30 p-4 text-center rounded-sm">
              <p className="text-xs text-red-400 tracking-wide">{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-white text-[var(--tarius-graphite)] py-4 mt-4 text-xs tracking-[0.2em] uppercase font-bold hover:bg-[var(--tarius-champagne)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-sm"
          >
            {isLoading ? 'Committing...' : 'Secure Account'}
          </button>
        </form>
      </div>
    </div>
  );
}