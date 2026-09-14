// Filename: src/components/Footer.tsx

"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { scrollToSection, scrollToTop } from '@/lib/scroll';

const collectionLinks = [
  { label: "Genesis", href: "/#story" },
  { label: "Provenance", href: "/#quality" },
  { label: "Inquiries", href: "/#faq" },
];

const conciergeLinks = [
  { label: "Private Allocation", href: "/#contact" },
  { label: "Advisory Desk", href: "/#contact" },
  { label: "Secure Dispatch", href: "/#contact" },
];

const legalLinks = [
  { label: "Privacy", href: "/#contact" },
  { label: "Terms", href: "/#contact" },
  { label: "Assay Reports", href: "/certifications" },
];

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

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

  const renderLinks = (links: { label: string; href: string }[]) =>
    links.map((link) => (
      <li key={link.label}>
        <Link
          href={link.href}
          onClick={link.href.startsWith("/#") ? (e) => handleSectionClick(e, link.href) : undefined}
          className="hover:text-[var(--tarius-champagne)] transition-colors"
        >
          {link.label}
        </Link>
      </li>
    ));

  return (
    <footer className="bg-[var(--tarius-graphite)] text-[var(--tarius-white)] border-t border-white/10 pt-20 pb-12">
      <div className="container-tarius">
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 pb-16 border-b border-white/10">
          <div className="md:col-span-6 flex flex-col items-center md:items-start text-center md:text-left w-full">
            <div className="flex justify-center md:justify-start items-center md:items-start w-full !ml-0 !pl-0">
              <Link href="/" onClick={handleLogoClick} className="inline-block hover:opacity-80 transition-opacity !m-0 !p-0 text-center md:text-left" aria-label="TARIUS home">
                <Image
                  src="/TARIUS_FOOTER_LOGO.png"
                  alt="TARIUS"
                  width={1200}
                  height={400}
                  className="h-20 md:h-32 w-auto object-contain brightness-0 invert !m-0 !p-0 block mx-auto md:mx-0"
                />
              </Link>
            </div>
            <p className="text-xs uppercase tracking-widest text-stone-400 max-w-sm leading-relaxed mb-8 text-center md:text-left">
              Pure botanical extracts and micro-batch reserves cultivated for the uncompromising sanctuary.
            </p>
            <div className="flex items-center gap-3 text-[10px] tracking-widest uppercase text-[var(--tarius-champagne)] justify-center md:justify-start w-full">
              <span className="w-2 h-2 rounded-full bg-[var(--tarius-champagne)] animate-pulse"></span>
              <span>Global Private Registry Active</span>
            </div>
          </div>

          <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8 text-stone-300 text-xs tracking-[0.15em] uppercase font-semibold text-left">
            <div className="text-left">
              <span className="text-[var(--tarius-champagne)] block mb-4 text-[10px]">Collection</span>
              <ul className="space-y-3 font-light text-stone-400">
                {renderLinks(collectionLinks)}
              </ul>
            </div>
            <div className="text-left">
              <span className="text-[var(--tarius-champagne)] block mb-4 text-[10px]">Concierge</span>
              <ul className="space-y-3 font-light text-stone-400">
                {renderLinks(conciergeLinks)}
              </ul>
            </div>
            <div className="text-left">
              <span className="text-[var(--tarius-champagne)] block mb-4 text-[10px]">Legal</span>
              <ul className="space-y-3 font-light text-stone-400">
                {renderLinks(legalLinks)}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] tracking-widest uppercase text-stone-500 pt-8 gap-4 text-center sm:text-left">
          <p className="text-center sm:text-left w-full sm:w-auto">&copy; 2026 TARIUS Botanical Reserves. All Rights Reserved.</p>
          <p className="text-[var(--tarius-champagne)]/70 text-center sm:text-right w-full sm:w-auto">Designed for the Uncompromising.</p>
        </div>

      </div>
    </footer>
  );
}