// Filename: src/app/admin/layout.tsx

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createBrowserClient(
        process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setAdminEmail(user.email);
      }
    };
    
    if (pathname && !['/admin/login', '/admin/reset-password', '/admin/forgot-password'].includes(pathname) && !pathname.startsWith('/admin/builder') && !pathname.startsWith('/admin/certifications-builder')) {
      fetchUser();
    }
  }, [pathname]);

  // Bypass layout for the fullscreen builders and auth pages
  if (pathname && (['/admin/login', '/admin/reset-password', '/admin/forgot-password'].includes(pathname) || pathname.startsWith('/admin/builder') || pathname.startsWith('/admin/certifications-builder'))) {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Home Builder', href: '/admin/builder', isExternal: true },
    { name: 'Products', href: '/admin/products' },
    // Update Certifications to open the new fullscreen builder
    { name: 'Certifications', href: '/admin/certifications-builder', isExternal: true }, 
    { name: 'FAQs', href: '/admin/faqs' },
    { name: 'Inquiries', href: '/admin/inquiries' },
  ];

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile restriction notice */}
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

      {/* Desktop layout */}
      <div className="hidden md:flex min-h-screen bg-[var(--tarius-ivory)] font-body selection:bg-[var(--tarius-olive)] selection:text-white">
      
      <aside className="w-64 border-r border-[var(--tarius-border)] bg-[var(--tarius-ivory-deep)] flex flex-col fixed top-0 h-screen z-20 shadow-xl">
        <div className="p-8 border-b border-[var(--tarius-border)] mt-4 flex flex-col items-center gap-1 text-center">
          <Link href="/admin" className="block !m-0 !p-0">
            <Image
              src="/LOGO_TARIUS.png"
              alt="TARIUS"
              width={1200}
              height={400}
              style={{ width: '200px', height: 'auto' }}
              className="object-contain !m-0 !p-0 block mx-auto"
            />
          </Link>
          <p className="text-eyebrow text-[var(--tarius-olive)]">
            Admin Dashboard
          </p>
        </div>

        <nav className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname && pathname.startsWith(item.href + '/'));

            return (
              <Link
                key={item.name}
                href={item.href}
                target={item.isExternal ? "_blank" : "_self"}
                className={"px-4 py-3 text-xs tracking-widest uppercase rounded-md transition-all flex items-center gap-3 group border " + (isActive ? "text-[var(--tarius-graphite)] bg-white shadow-sm border-[var(--tarius-border)]" : "text-stone-500 hover:text-[var(--tarius-graphite)] hover:bg-white/50 border-transparent")}
              >
                <span
                  className={"w-1.5 h-1.5 rounded-full transition-all " + (isActive ? "bg-[var(--tarius-olive)] shadow-[0_0_8px_var(--tarius-olive)]" : "bg-stone-300 group-hover:bg-[var(--tarius-olive)]")}
                ></span>
                {item.name}
                {item.isExternal && (
                  <svg className="w-3 h-3 ml-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[var(--tarius-border)] bg-black/5 flex flex-col gap-5">
          <div className="flex flex-col gap-1 border-b border-[var(--tarius-border)] pb-4">
            <span className="text-[9px] uppercase tracking-widest text-stone-500">Active Session</span>
            <span className="text-xs text-[var(--tarius-graphite)] font-medium truncate" title={adminEmail || ''}>
              {adminEmail || 'Loading...'}
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="text-[10px] tracking-widest uppercase text-stone-500 hover:text-[var(--tarius-olive)] transition-colors flex items-center gap-2"
            >
              Return to Site
            </Link>
            
            <button
              onClick={handleSignOut}
              className="text-left text-[10px] tracking-widest uppercase text-red-700/70 hover:text-red-700 transition-colors flex items-center gap-2"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1 relative min-h-screen">
        <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-[var(--tarius-champagne)]/20 rounded-full blur-[120px] pointer-events-none z-0"></div>
        <div className="relative z-10 p-12 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-forwards">
          {children}
        </div>
      </main>
    </div>
    </>
  );
}