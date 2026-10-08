// Filename: src/app/hq-8055/login/page.tsx

'use client';

import React, { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setIsLoading(false);
    } else {
      router.push('/hq-8055');
      router.refresh();
    }
  };

  return (
    <>
      {/* Mobile restriction notice - visible only on screens smaller than md */}
      <div className="flex md:hidden min-h-screen bg-[var(--tarius-graphite)] items-center justify-center p-8 text-center font-body selection:bg-[var(--tarius-champagne)] selection:text-[var(--tarius-graphite)]">
        <div className="max-w-xs flex flex-col items-center gap-6">
          <Image
            src="/TARIUS_FOOTER_LOGO.png"
            alt="TARIUS"
            width={1200}
            height={400}
            className="h-16 w-auto object-contain brightness-0 invert !m-0 !p-0 block mx-auto"
          />
          <div className="flex flex-col gap-2">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--tarius-champagne)] block">
              Desktop Access Only
            </span>
            <p className="text-stone-400 text-xs leading-relaxed tracking-wide">
              The Tarius Admin Portal is optimized exclusively for desktop and laptop environments. Please access via a desktop device.
            </p>
          </div>
        </div>
      </div>

      {/* Desktop layout - hidden on mobile, visible on md screens and up */}
      <div className="hidden md:flex min-h-screen bg-[var(--tarius-graphite)] items-center justify-center relative overflow-hidden font-body selection:bg-[var(--tarius-champagne)] selection:text-[var(--tarius-graphite)]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--tarius-champagne)]/5 rounded-full blur-[150px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-md p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="text-center mb-12 flex flex-col items-center">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[var(--tarius-champagne)] mb-4 block">
              Admin Portal
            </span>
            <Image
              src="/TARIUS_FOOTER_LOGO.png"
              alt="TARIUS"
              width={1200}
              height={400}
              className="h-20 md:h-32 w-auto object-contain brightness-0 invert !m-0 !p-0 block mx-auto md:mx-0"
            />
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-8">
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

            <div className="flex flex-col gap-2">
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-white text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors peer placeholder-transparent"
                  placeholder="Password"
                />
                <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-champagne)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
                  Password
                </label>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-950/30 border border-red-500/30 p-4 text-center">
                <p className="text-xs text-red-400 tracking-wide">{errorMsg}</p>
              </div>
            )}

            <div className="flex flex-col gap-5 mt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full border border-[var(--tarius-champagne)] text-[var(--tarius-champagne)] py-4 text-xs tracking-[0.2em] uppercase hover:bg-[var(--tarius-champagne)] hover:text-[var(--tarius-graphite)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </button>

            </div>
          </form>
        </div>
      </div>
    </>
  );
}