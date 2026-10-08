// Filename: src/app/hq-8055/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    faqs: 0,
    pendingInquiries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { count: productCount } = await supabase
        .from('Product')
        .select('*', { count: 'exact', head: true });

      const { count: faqCount } = await supabase
        .from('FaqItem')
        .select('*', { count: 'exact', head: true });

      const { count: inquiryCount } = await supabase
        .from('Inquiry')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      setStats({
        products: productCount || 0,
        faqs: faqCount || 0,
        pendingInquiries: inquiryCount || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--tarius-border)] border-t-[var(--tarius-olive)] animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--tarius-graphite)]">
            Loading Sanctuary...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[var(--tarius-graphite)] pb-24">
      <div className="flex flex-col mb-16 border-b border-[var(--tarius-border)] pb-10">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)] mb-4">
          Tarius Command Center
        </p>
        <h1 className="font-display text-5xl md:text-6xl text-[var(--tarius-graphite)] mb-6">
          Welcome to the Sanctuary.
        </h1>
        <p className="text-sm text-[var(--tarius-graphite-soft)] max-w-2xl leading-relaxed">
          This secure environment allows you to manage the premium Tarius experience. 
          Monitor private allocations, update botanical formulations, and curate the knowledge base for your clientele.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white border border-[var(--tarius-border)] p-10 rounded-sm shadow-sm relative overflow-hidden group hover:border-[var(--tarius-olive)] transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-[var(--tarius-olive)] group-hover:scale-110 group-hover:opacity-10 transition-all duration-700">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
              <line x1="7" y1="7" x2="7.01" y2="7"></line>
            </svg>
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-8 relative z-10">
            Active Formulations
          </p>
          <p className="font-display text-7xl text-[var(--tarius-olive)] mb-8 relative z-10">
            {stats.products < 10 ? `0${stats.products}` : stats.products}
          </p>
          <Link
            href="/hq-8055/products"
            className="inline-flex items-center gap-3 text-xs tracking-widest uppercase text-[var(--tarius-graphite)] font-medium hover:text-[var(--tarius-olive)] transition-colors relative z-10"
          >
            Manage Matrix <span>→</span>
          </Link>
        </div>

        <div className="bg-[var(--tarius-ivory-deep)] border border-[var(--tarius-olive)] p-10 rounded-sm shadow-[0_10px_40px_rgba(31,33,28,0.06)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-[var(--tarius-olive)] group-hover:scale-110 group-hover:opacity-10 transition-all duration-700">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--tarius-olive)] mb-8 relative z-10">
            Pending Dossiers
          </p>
          <p className="font-display text-7xl text-[var(--tarius-graphite)] mb-8 relative z-10">
            {stats.pendingInquiries < 10 ? `0${stats.pendingInquiries}` : stats.pendingInquiries}
          </p>
          <Link
            href="/hq-8055/inquiries"
            className="inline-flex items-center gap-3 text-xs tracking-widest uppercase text-[var(--tarius-graphite)] font-medium hover:text-[var(--tarius-olive)] transition-colors relative z-10"
          >
            Review Requests <span>→</span>
          </Link>
        </div>

        <div className="bg-white border border-[var(--tarius-border)] p-10 rounded-sm shadow-sm relative overflow-hidden group hover:border-[var(--tarius-olive)] transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-[var(--tarius-olive)] group-hover:scale-110 group-hover:opacity-10 transition-all duration-700">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
          </div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500 mb-8 relative z-10">
            Curated Inquiries
          </p>
          <p className="font-display text-7xl text-[var(--tarius-olive)] mb-8 relative z-10">
            {stats.faqs < 10 ? `0${stats.faqs}` : stats.faqs}
          </p>
          <Link
            href="/hq-8055/faqs"
            className="inline-flex items-center gap-3 text-xs tracking-widest uppercase text-[var(--tarius-graphite)] font-medium hover:text-[var(--tarius-olive)] transition-colors relative z-10"
          >
            Update Knowledge <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}