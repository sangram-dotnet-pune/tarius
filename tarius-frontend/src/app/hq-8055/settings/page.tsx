// Filename: src/app/hq-8055/settings/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/api';
import { createBrowserClient } from '@supabase/ssr';

interface NavLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: NavLink[];
}

// --- DEFAULTS ---
const defaultNavLinks = [
  { label: "Shop", href: "/products" },
  { label: "Our Story", href: "/#story" },
  { label: "Quality", href: "/#quality" },
  { label: "Certifications", href: "/certifications" },
  { label: "FAQ", href: "/#faq" },
];
const defaultNavCtaText = "Explore TARIUS";
const defaultNavCtaLink = "/?inquiry=interest#contact";

const defaultFooterDesc = "Pure botanical extracts and micro-batch reserves cultivated for the uncompromising sanctuary.";
const defaultFooterCol1 = { title: "Collection", links: [{ label: "Genesis", href: "/#story" }, { label: "Provenance", href: "/#quality" }, { label: "Inquiries", href: "/#faq" }] };
const defaultFooterCol2 = { title: "Concierge", links: [{ label: "Private Allocation", href: "/#contact" }, { label: "Advisory Desk", href: "/#contact" }, { label: "Secure Dispatch", href: "/#contact" }] };
const defaultFooterCol3 = { title: "Legal", links: [{ label: "Privacy", href: "/#contact" }, { label: "Terms", href: "/#contact" }, { label: "Assay Reports", href: "/certifications" }] };

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- NAVBAR STATE ---
  const [navLinks, setNavLinks] = useState<NavLink[]>([]);
  const [navCtaText, setNavCtaText] = useState('');
  const [navCtaLink, setNavCtaLink] = useState('');

  // --- FOOTER STATE ---
  const [footerDesc, setFooterDesc] = useState('');
  const [footerCol1, setFooterCol1] = useState<FooterColumn>({ title: '', links: [] });
  const [footerCol2, setFooterCol2] = useState<FooterColumn>({ title: '', links: [] });
  const [footerCol3, setFooterCol3] = useState<FooterColumn>({ title: '', links: [] });

  const [activeTab, setActiveTab] = useState<'navbar' | 'footer'>('navbar');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    
    // Fetch Navbar
    const { data: navData } = await supabase.from('SiteSettings').select('value').eq('key', 'navbar_settings').single();
    if (navData && navData.value) {
      setNavLinks(navData.value.links || []);
      setNavCtaText(navData.value.ctaText || '');
      setNavCtaLink(navData.value.ctaLink || '');
    } else {
      setNavLinks(defaultNavLinks);
      setNavCtaText(defaultNavCtaText);
      setNavCtaLink(defaultNavCtaLink);
    }

    // Fetch Footer
    const { data: footData } = await supabase.from('SiteSettings').select('value').eq('key', 'footer_settings').single();
    if (footData && footData.value) {
      setFooterDesc(footData.value.description || '');
      if (footData.value.column1) setFooterCol1(footData.value.column1);
      if (footData.value.column2) setFooterCol2(footData.value.column2);
      if (footData.value.column3) setFooterCol3(footData.value.column3);
    } else {
      setFooterDesc(defaultFooterDesc);
      setFooterCol1(defaultFooterCol1);
      setFooterCol2(defaultFooterCol2);
      setFooterCol3(defaultFooterCol3);
    }

    setLoading(false);
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to completely reset the Navigation and Footer to default settings? All custom links and text will be lost.")) return;
    
    setIsSaving(true);
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const defaultNavPayload = {
      links: defaultNavLinks,
      ctaText: defaultNavCtaText,
      ctaLink: defaultNavCtaLink
    };

    const defaultFooterPayload = {
      description: defaultFooterDesc,
      column1: defaultFooterCol1,
      column2: defaultFooterCol2,
      column3: defaultFooterCol3
    };

    // Save Defaults to Database
    await supabaseAuth.from('SiteSettings').update({ value: defaultNavPayload }).eq('key', 'navbar_settings');
    await supabaseAuth.from('SiteSettings').update({ value: defaultFooterPayload }).eq('key', 'footer_settings');

    setIsSaving(false);
    alert('Navigation and Footer reset successfully. Reloading interface...');
    window.location.reload();
  };

  const handleSave = async () => {
    setIsSaving(true);
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const navPayload = {
      links: navLinks,
      ctaText: navCtaText,
      ctaLink: navCtaLink
    };

    const footerPayload = {
      description: footerDesc,
      column1: footerCol1,
      column2: footerCol2,
      column3: footerCol3
    };

    // Save Navbar
    await supabaseAuth.from('SiteSettings').update({ value: navPayload }).eq('key', 'navbar_settings');
    
    // Save Footer
    await supabaseAuth.from('SiteSettings').update({ value: footerPayload }).eq('key', 'footer_settings');

    setIsSaving(false);
    alert('Global settings updated successfully! Changes are live immediately.');
  };

  // --- HELPER FUNCTIONS: NAVBAR ---
  const handleNavLinkChange = (index: number, field: keyof NavLink, value: string) => {
    const newLinks = [...navLinks];
    newLinks[index][field] = value;
    setNavLinks(newLinks);
  };

  const addNavLink = () => setNavLinks([...navLinks, { label: 'New Link', href: '/' }]);
  
  const removeNavLink = (index: number) => {
    const newLinks = [...navLinks];
    newLinks.splice(index, 1);
    setNavLinks(newLinks);
  };

  // --- HELPER FUNCTIONS: FOOTER ---
  const handleFooterTitleChange = (colNum: 1 | 2 | 3, value: string) => {
    if (colNum === 1) setFooterCol1({ ...footerCol1, title: value });
    if (colNum === 2) setFooterCol2({ ...footerCol2, title: value });
    if (colNum === 3) setFooterCol3({ ...footerCol3, title: value });
  };

  const handleFooterLinkChange = (colNum: 1 | 2 | 3, index: number, field: keyof NavLink, value: string) => {
    if (colNum === 1) {
      const newLinks = [...footerCol1.links];
      newLinks[index][field] = value;
      setFooterCol1({ ...footerCol1, links: newLinks });
    }
    if (colNum === 2) {
      const newLinks = [...footerCol2.links];
      newLinks[index][field] = value;
      setFooterCol2({ ...footerCol2, links: newLinks });
    }
    if (colNum === 3) {
      const newLinks = [...footerCol3.links];
      newLinks[index][field] = value;
      setFooterCol3({ ...footerCol3, links: newLinks });
    }
  };

  const addFooterLink = (colNum: 1 | 2 | 3) => {
    if (colNum === 1) setFooterCol1({ ...footerCol1, links: [...footerCol1.links, { label: 'New Link', href: '/' }] });
    if (colNum === 2) setFooterCol2({ ...footerCol2, links: [...footerCol2.links, { label: 'New Link', href: '/' }] });
    if (colNum === 3) setFooterCol3({ ...footerCol3, links: [...footerCol3.links, { label: 'New Link', href: '/' }] });
  };

  const removeFooterLink = (colNum: 1 | 2 | 3, index: number) => {
    if (colNum === 1) {
      const newLinks = [...footerCol1.links];
      newLinks.splice(index, 1);
      setFooterCol1({ ...footerCol1, links: newLinks });
    }
    if (colNum === 2) {
      const newLinks = [...footerCol2.links];
      newLinks.splice(index, 1);
      setFooterCol2({ ...footerCol2, links: newLinks });
    }
    if (colNum === 3) {
      const newLinks = [...footerCol3.links];
      newLinks.splice(index, 1);
      setFooterCol3({ ...footerCol3, links: newLinks });
    }
  };

  const inputBaseStyle = "bg-transparent border-b border-[var(--tarius-border)] outline-none focus:border-[var(--tarius-olive)] transition-colors py-3 text-sm text-[var(--tarius-graphite)] w-full ";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--tarius-ivory)]">
        <div className="flex items-center gap-3 text-stone-500 text-xs uppercase tracking-widest">
          <div className="w-4 h-4 rounded-full border border-stone-300 border-t-[var(--tarius-olive)] animate-spin"></div>
          Loading Framework...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--tarius-ivory)] font-body pb-32">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-[100] bg-white border-b border-[var(--tarius-border)] shadow-sm px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[var(--tarius-graphite)] leading-none mb-1">Global Configuration</h1>
          <p className="text-[9px] uppercase tracking-widest text-stone-400">Navigation & Footer Registry</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex bg-stone-100 p-1 border border-[var(--tarius-border)] rounded-sm w-full sm:w-auto mb-2 sm:mb-0">
            <button 
              onClick={() => setActiveTab('navbar')}
              className={"flex-1 px-6 py-2 text-[10px] uppercase tracking-widest transition-colors " + (activeTab === 'navbar' ? "bg-white text-[var(--tarius-graphite)] shadow-sm border border-[var(--tarius-border)]" : "text-stone-500 hover:text-[var(--tarius-graphite)]")}
            >
              Navbar
            </button>
            <button 
              onClick={() => setActiveTab('footer')}
              className={"flex-1 px-6 py-2 text-[10px] uppercase tracking-widest transition-colors " + (activeTab === 'footer' ? "bg-white text-[var(--tarius-graphite)] shadow-sm border border-[var(--tarius-border)]" : "text-stone-500 hover:text-[var(--tarius-graphite)]")}
            >
              Footer
            </button>
          </div>

          <button 
            onClick={handleReset} 
            disabled={isSaving} 
            className="w-full sm:w-auto px-6 py-2.5 bg-transparent border border-red-500 text-red-500 text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50 rounded-sm"
          >
            Reset
          </button>

          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto px-8 py-3 bg-[var(--tarius-olive)] text-white text-[10px] uppercase tracking-widest hover:bg-[var(--tarius-graphite)] transition-colors disabled:opacity-50 rounded-sm"
          >
            {isSaving ? 'Committing...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
        
        {/* ================================= */}
        {/* NAVBAR CONFIGURATION              */}
        {/* ================================= */}
        {activeTab === 'navbar' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
            
            <div className="bg-white border border-[var(--tarius-border)] shadow-sm p-8 sm:p-10">
              <h2 className="font-display text-2xl text-[var(--tarius-graphite)] mb-6 border-b border-[var(--tarius-border)] pb-4">Main Navigation Links</h2>
              
              <div className="space-y-4">
                {navLinks.map((link, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-[var(--tarius-ivory-deep)] border border-[var(--tarius-border)] p-4 relative group">
                    <button onClick={() => removeNavLink(idx)} className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs flex items-center justify-center shadow-md">✕</button>
                    <div className="w-full sm:w-1/2">
                      <span className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Display Label</span>
                      <input 
                        type="text" 
                        value={link.label} 
                        onChange={(e) => handleNavLinkChange(idx, 'label', e.target.value)}
                        className={inputBaseStyle}
                        placeholder="e.g. Shop"
                      />
                    </div>
                    <div className="w-full sm:w-1/2">
                      <span className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Destination URL / Anchor</span>
                      <input 
                        type="text" 
                        value={link.href} 
                        onChange={(e) => handleNavLinkChange(idx, 'href', e.target.value)}
                        className={inputBaseStyle}
                        placeholder="e.g. /products or /#story"
                      />
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={addNavLink}
                  className="w-full py-4 border-2 border-dashed border-[var(--tarius-border)] text-[10px] uppercase tracking-widest text-[var(--tarius-olive)] hover:border-[var(--tarius-olive)] hover:bg-[var(--tarius-olive)]/5 transition-all"
                >
                  + Add Menu Item
                </button>
              </div>
            </div>

            <div className="bg-white border border-[var(--tarius-border)] shadow-sm p-8 sm:p-10">
              <h2 className="font-display text-2xl text-[var(--tarius-graphite)] mb-6 border-b border-[var(--tarius-border)] pb-4">Call To Action (CTA) Button</h2>
              <div className="flex flex-col sm:flex-row gap-8">
                <div className="w-full sm:w-1/2">
                  <span className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Button Label</span>
                  <input 
                    type="text" 
                    value={navCtaText} 
                    onChange={(e) => setNavCtaText(e.target.value)}
                    className={inputBaseStyle}
                  />
                </div>
                <div className="w-full sm:w-1/2">
                  <span className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Button Destination</span>
                  <input 
                    type="text" 
                    value={navCtaLink} 
                    onChange={(e) => setNavCtaLink(e.target.value)}
                    className={inputBaseStyle}
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================================= */}
        {/* FOOTER CONFIGURATION              */}
        {/* ================================= */}
        {activeTab === 'footer' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
            
            <div className="bg-white border border-[var(--tarius-border)] shadow-sm p-8 sm:p-10">
              <h2 className="font-display text-2xl text-[var(--tarius-graphite)] mb-6 border-b border-[var(--tarius-border)] pb-4">Brand Description</h2>
              <span className="text-[9px] uppercase tracking-widest text-stone-500 block mb-2">Displays under the large footer logo</span>
              <textarea 
                value={footerDesc} 
                onChange={(e) => setFooterDesc(e.target.value)}
                rows={3}
                className={"resize-none " + inputBaseStyle}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Footer Column 1 */}
              <div className="bg-white border border-[var(--tarius-border)] shadow-sm p-6">
                <input 
                  type="text" 
                  value={footerCol1.title} 
                  onChange={(e) => handleFooterTitleChange(1, e.target.value)}
                  className="font-display text-xl text-[var(--tarius-graphite)] w-full border-b border-[var(--tarius-border)] pb-2 outline-none focus:border-[var(--tarius-olive)] transition-colors mb-6"
                  placeholder="Column 1 Title"
                />
                <div className="space-y-4">
                  {footerCol1.links.map((link, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 bg-[var(--tarius-ivory-deep)] border border-[var(--tarius-border)] relative group">
                      <button onClick={() => removeFooterLink(1, idx)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      <input type="text" value={link.label} onChange={(e) => handleFooterLinkChange(1, idx, 'label', e.target.value)} className="bg-transparent border-b border-stone-200 text-xs focus:outline-none focus:border-stone-400 py-1" placeholder="Label" />
                      <input type="text" value={link.href} onChange={(e) => handleFooterLinkChange(1, idx, 'href', e.target.value)} className="bg-transparent border-b border-stone-200 text-xs focus:outline-none focus:border-stone-400 py-1" placeholder="/url" />
                    </div>
                  ))}
                  <button onClick={() => addFooterLink(1)} className="w-full py-3 border border-dashed border-stone-300 text-[9px] uppercase tracking-widest text-stone-500 hover:text-[var(--tarius-olive)] transition-colors">
                    + Add Link
                  </button>
                </div>
              </div>

              {/* Footer Column 2 */}
              <div className="bg-white border border-[var(--tarius-border)] shadow-sm p-6">
                <input 
                  type="text" 
                  value={footerCol2.title} 
                  onChange={(e) => handleFooterTitleChange(2, e.target.value)}
                  className="font-display text-xl text-[var(--tarius-graphite)] w-full border-b border-[var(--tarius-border)] pb-2 outline-none focus:border-[var(--tarius-olive)] transition-colors mb-6"
                  placeholder="Column 2 Title"
                />
                <div className="space-y-4">
                  {footerCol2.links.map((link, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 bg-[var(--tarius-ivory-deep)] border border-[var(--tarius-border)] relative group">
                      <button onClick={() => removeFooterLink(2, idx)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      <input type="text" value={link.label} onChange={(e) => handleFooterLinkChange(2, idx, 'label', e.target.value)} className="bg-transparent border-b border-stone-200 text-xs focus:outline-none focus:border-stone-400 py-1" placeholder="Label" />
                      <input type="text" value={link.href} onChange={(e) => handleFooterLinkChange(2, idx, 'href', e.target.value)} className="bg-transparent border-b border-stone-200 text-xs focus:outline-none focus:border-stone-400 py-1" placeholder="/url" />
                    </div>
                  ))}
                  <button onClick={() => addFooterLink(2)} className="w-full py-3 border border-dashed border-stone-300 text-[9px] uppercase tracking-widest text-stone-500 hover:text-[var(--tarius-olive)] transition-colors">
                    + Add Link
                  </button>
                </div>
              </div>

              {/* Footer Column 3 */}
              <div className="bg-white border border-[var(--tarius-border)] shadow-sm p-6">
                <input 
                  type="text" 
                  value={footerCol3.title} 
                  onChange={(e) => handleFooterTitleChange(3, e.target.value)}
                  className="font-display text-xl text-[var(--tarius-graphite)] w-full border-b border-[var(--tarius-border)] pb-2 outline-none focus:border-[var(--tarius-olive)] transition-colors mb-6"
                  placeholder="Column 3 Title"
                />
                <div className="space-y-4">
                  {footerCol3.links.map((link, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 bg-[var(--tarius-ivory-deep)] border border-[var(--tarius-border)] relative group">
                      <button onClick={() => removeFooterLink(3, idx)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      <input type="text" value={link.label} onChange={(e) => handleFooterLinkChange(3, idx, 'label', e.target.value)} className="bg-transparent border-b border-stone-200 text-xs focus:outline-none focus:border-stone-400 py-1" placeholder="Label" />
                      <input type="text" value={link.href} onChange={(e) => handleFooterLinkChange(3, idx, 'href', e.target.value)} className="bg-transparent border-b border-stone-200 text-xs focus:outline-none focus:border-stone-400 py-1" placeholder="/url" />
                    </div>
                  ))}
                  <button onClick={() => addFooterLink(3)} className="w-full py-3 border border-dashed border-stone-300 text-[9px] uppercase tracking-widest text-stone-500 hover:text-[var(--tarius-olive)] transition-colors">
                    + Add Link
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}