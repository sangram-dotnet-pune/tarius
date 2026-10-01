// Filename: src/components/navbar/Navbar.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { scrollToSection, scrollToTop } from "@/lib/scroll";
import { useScrollSpy } from "@/lib/useScrollSpy";
import { requestContactIntent } from "@/lib/contactIntent";
import { supabase } from "@/lib/api";

export interface NavData {
  links: { label: string; href: string }[];
  ctaText: string;
  ctaLink: string;
}

//changes roshan

const DEFAULT_NAV: NavData = {
  links: [
    { label: "Shop", href: "/products" },
    { label: "Our Story", href: "/#story" },
    { label: "Quality", href: "/#quality" },
    { label: "Certifications", href: "/certifications" },
    { label: "FAQ", href: "/#faq" },
  ],
  ctaText: "Explore TARIUS",
  ctaLink: "/#contact",
};

export default function Navbar({ initialNavData }: { initialNavData?: NavData }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Seeded from the server so the CTA label is correct on the very first paint
  // instead of flashing the fallback before the client fetch resolves.
  const [navData, setNavData] = useState<NavData>(initialNavData ?? DEFAULT_NAV);
  
  const pathname = usePathname();
  const router = useRouter();
  const activeSection = useScrollSpy();

  useEffect(() => {
    async function fetchNav() {
      const { data } = await supabase.from('SiteSettings').select('value').eq('key', 'navbar_settings').single();
      if (data && data.value) setNavData(data.value);
    }
    fetchNav();
  }, []);

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    closeMenu();
    if (pathname === "/") {
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


  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    requestContactIntent("interested");

    const href = navData.ctaLink || "/#contact";
    const isExternal = /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
    if (isExternal) return;

    e.preventDefault();
    if (pathname !== "/") {
      router.push("/");
    }
    scrollToSection("contact");
  };

  // Do not render the public navbar on any admin route
  if (pathname && pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--tarius-border)] bg-[var(--tarius-ivory)]/95 backdrop-blur-md">
      <nav
        className="container-tarius flex h-[96px] items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center hover:opacity-80 transition-opacity"
          aria-label="TARIUS home"
        >
          <Image
            src="/LOGO_TARIUS.png"
            alt="TARIUS"
            width={660}
            height={200}
            priority
            className="h-[114px] w-auto max-w-[400px] object-contain sm:max-w-none"
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 lg:flex">
          {navData.links && navData.links.map((item: any) => {
            const sectionId = item.href.startsWith("/#")
              ? item.href.replace(/^\/#/, "")
              : null;
            const isActive = sectionId !== null && activeSection === sectionId;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.href.startsWith("/#") ? (e) => handleSectionClick(e, item.href) : undefined}
                aria-current={isActive ? "true" : undefined}
                className={"text-eyebrow relative py-2 transition-opacity duration-200 hover:opacity-60 " + (isActive ? "text-[var(--tarius-olive)]" : "text-[var(--tarius-graphite)]")}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href={navData.ctaLink || "/#contact"}
            onClick={handleCtaClick}
            className="btn-tarius ml-2"
          >
            {navData.ctaText}
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          className="relative z-[60] flex h-11 w-11 items-center justify-center lg:hidden"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
        >
          <span className="flex w-6 flex-col gap-[6px]">
            <span
              className={"block h-px w-full bg-[var(--tarius-graphite)] transition-transform duration-300 " + (isMenuOpen ? "translate-y-[3.5px] rotate-45" : "")}
            />
            <span
              className={"block h-px w-full bg-[var(--tarius-graphite)] transition-opacity duration-300 " + (isMenuOpen ? "opacity-0" : "")}
            />
            <span
              className={"block h-px w-full bg-[var(--tarius-graphite)] transition-transform duration-300 " + (isMenuOpen ? "-translate-y-[3.5px] -rotate-45" : "")}
            />
          </span>
        </button>
      </nav>

      {/* Mobile Navigation */}
      <div
        className={"overflow-hidden border-t border-[var(--tarius-border)] bg-[var(--tarius-ivory)] transition-[max-height,opacity] duration-300 lg:hidden " + (isMenuOpen ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0")}
      >
        <div className="container-tarius flex flex-col py-5">
          {navData.links && navData.links.map((item: any) => {
            const sectionId = item.href.startsWith("/#")
              ? item.href.replace(/^\/#/, "")
              : null;
            const isActive = sectionId !== null && activeSection === sectionId;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => { closeMenu(); if (item.href.startsWith("/#")) handleSectionClick(e, item.href); }}
                aria-current={isActive ? "true" : undefined}
                className={"border-b border-[var(--tarius-border)] py-4 text-sm font-medium uppercase tracking-[0.14em] " + (isActive ? "text-[var(--tarius-olive)]" : "")}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href={navData.ctaLink || "/#contact"}
            onClick={(e) => { closeMenu(); handleCtaClick(e); }}
            className="btn-tarius mt-5 w-full text-center"
          >
            {navData.ctaText}
          </Link>
        </div>
      </div>
    </header>
  );
}