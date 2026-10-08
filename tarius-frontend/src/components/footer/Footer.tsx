// Filename: src/components/footer/Footer.tsx

"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { scrollToSection, scrollToTop } from '@/lib/scroll';
import { supabase } from '@/lib/api';

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const [footerData, setFooterData] = useState<any>(null);

  useEffect(() => {
    async function fetchFooter() {
      const { data } = await supabase.from('SiteSettings').select('value').eq('key', 'footer_settings').single();
      if (data && data.value) setFooterData(data.value);
    }
    fetchFooter();
  }, []);

  if (pathname && pathname.startsWith('/hq-8055')) return null;

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault();
      scrollToTop();
    }
  };

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    const id = href.replace(/^\/#/, "");
    if (!id) return;
    e.preventDefault();
    if (pathname !== "/") {
      router.push(href);
    }
    scrollToSection(id);
  };

  const renderLinks = (links: { label: string; href: string }[]) => {
    if (!links) return null;
    return links.map((link) => (
      <li key={link.label} className="overflow-hidden">
        <Link
          href={link.href}
          onClick={link.href.startsWith("/#") ? (e) => handleSectionClick(e, link.href) : undefined}
          className="group relative flex items-center gap-2 overflow-hidden text-stone-400 hover:text-[var(--tarius-champagne)] transition-colors duration-500 py-1"
        >
          <span className="opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] absolute left-0 text-[9px]">►</span>
          <span className="group-hover:translate-x-4 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]">{link.label}</span>
        </Link>
      </li>
    ));
  };

  return (
    <footer className="relative bg-[var(--tarius-graphite)] text-[var(--tarius-white)] border-t border-white/10 pt-20 pb-12 overflow-hidden z-0">
      {/* Ambient Animated Glow Background */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--tarius-champagne)]/5 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"></div>

      <div className="container-tarius relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 pb-16 border-b border-white/10">
          
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left w-full">
            <div className="flex justify-center lg:justify-start items-center lg:items-start w-full !ml-0 !pl-0 group">
              <Link href="/" onClick={handleLogoClick} className="inline-block hover:opacity-80 transition-opacity !m-0 !p-0" aria-label="TARIUS home">
                <Image
                  src="/TARIUS_FOOTER_LOGO.png"
                  alt="TARIUS"
                  width={1200}
                  height={400}
                  className="h-20 sm:h-28 w-auto object-contain brightness-0 invert !m-0 !p-0 block mx-auto lg:mx-0 group-hover:scale-[1.03] transition-transform duration-700"
                />
              </Link>
            </div>
            <p className="text-xs uppercase tracking-widest text-stone-400 max-w-sm leading-relaxed mb-8 mt-4 text-center lg:text-left">
              {footerData?.description || "Pure botanical extracts and micro-batch reserves cultivated for the uncompromising sanctuary."}
            </p>
            <div className="flex items-center gap-3 text-[10px] tracking-widest uppercase text-[var(--tarius-champagne)] justify-center lg:justify-start w-full hover:tracking-[0.3em] transition-all duration-700">
              <span className="w-2 h-2 rounded-full bg-[var(--tarius-champagne)] animate-pulse shadow-[0_0_10px_var(--tarius-champagne)]"></span>
              <span>Global Private Registry Active</span>
            </div>
          </div>

          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8 text-stone-300 text-xs tracking-[0.15em] uppercase font-medium text-left">
            <div className="text-left">
              <span className="text-[var(--tarius-champagne)] block mb-6 text-[10px] tracking-[0.3em] border-b border-white/10 pb-4">
                {footerData?.column1?.title || "Collection"}
              </span>
              <ul className="space-y-4 font-light text-stone-400">
                {renderLinks(footerData?.column1?.links)}
              </ul>
            </div>
            
            <div className="text-left">
              <span className="text-[var(--tarius-champagne)] block mb-6 text-[10px] tracking-[0.3em] border-b border-white/10 pb-4">
                {footerData?.column2?.title || "Concierge"}
              </span>
              <ul className="space-y-4 font-light text-stone-400">
                {renderLinks(footerData?.column2?.links)}
              </ul>
            </div>

            <div className="text-left col-span-2 md:col-span-1 mt-8 md:mt-0">
              <span className="text-[var(--tarius-champagne)] block mb-6 text-[10px] tracking-[0.3em] border-b border-white/10 pb-4">
                {footerData?.column3?.title || "Legal"}
              </span>
              <ul className="space-y-4 font-light text-stone-400">
                {renderLinks(footerData?.column3?.links)}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-[9px] tracking-[0.2em] uppercase text-stone-500 pt-8 gap-4 text-center sm:text-left">
          <p className="text-center sm:text-left w-full sm:w-auto hover:text-stone-300 transition-colors">&copy; 2026 TARIUS Botanical Reserves. All Rights Reserved.</p>
          <p className="text-[var(--tarius-champagne)]/70 text-center sm:text-right w-full sm:w-auto hover:text-[var(--tarius-champagne)] transition-colors">Designed for the Uncompromising.</p>
        </div>

      </div>
    </footer>
  );
}