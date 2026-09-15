// Filename: src/app/products/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import { supabase } from "@/lib/api";
import TrackedLink from "@/components/products/TrackedLink";

export const dynamic = 'force-dynamic';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('isPublished', true)
        .order('createdAt', { ascending: true });

      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const activeProducts = products || [];

  return (
    <div className="bg-[var(--tarius-ivory)] relative min-h-screen pt-28 pb-32">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[var(--tarius-champagne)]/10 rounded-full blur-[150px] pointer-events-none"></div>

      <div className="container-tarius max-w-7xl mx-auto px-6">
        
        {/* Editorial Minimal Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-eyebrow text-[var(--tarius-olive)] mb-4 tracking-[0.3em] uppercase block">Private Allocation Registry</span>
          <h1 className="text-display text-5xl sm:text-7xl text-[var(--tarius-graphite)] mb-6 font-light">
            The <span className="italic text-[var(--tarius-olive)]">Collection.</span>
          </h1>
          <div className="w-16 h-px bg-[var(--tarius-olive)]/30 mx-auto mb-6"></div>
          <p className="text-[var(--tarius-graphite-soft)] text-sm sm:text-base font-light leading-relaxed">
            Uncompromising botanical reserves cultivated for optimal daily wellness, housed in biophotonic violet glass.
          </p>
        </div>

        {/* Modern Clean Grid Layout */}
        {loading ? (
          <div className="py-32 text-center text-[var(--tarius-graphite-soft)] font-light tracking-widest text-xs uppercase animate-pulse">
            Loading Sovereign Reserves...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {activeProducts.map((product, index) => {
              const links = product.purchaseLinks || [];
              const isDropdownOpen = openDropdownId === product.id;
              
              // Fallback logic for old products before the column was added
              const actionType = product.actionButtonType || (links.length > 0 ? 'buy_now' : 'request_allocation');

              return (
                <div
                  key={product.id}
                  className="bg-white/80 border border-[var(--tarius-border)] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between group relative"
                >
                  {/* Top Image Frame */}
                  <div className="relative aspect-[16/10] w-full bg-[var(--tarius-ivory-deep)] overflow-hidden border-b border-[var(--tarius-border)]">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div 
                        className="absolute inset-0 opacity-15 group-hover:scale-110 transition-transform duration-700" 
                        style={{ backgroundColor: product.accentColor || 'var(--tarius-champagne)' }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
                    <div className="absolute top-4 left-4 z-10">
                      <span className="text-[10px] tracking-widest uppercase text-[var(--tarius-graphite)] bg-white/90 backdrop-blur-sm px-3 py-1 border border-[var(--tarius-border)]">
                        Lot No. {index + 1} // {product.category || 'Reserve'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-8 sm:p-10 flex flex-col flex-grow justify-between bg-white">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-eyebrow text-[var(--tarius-olive)] tracking-wider">
                          {product.subtitle}
                        </span>
                        {product.price && (
                          <span className="font-display text-2xl font-light text-[var(--tarius-graphite)]">
                            {product.price}
                          </span>
                        )}
                      </div>

                      <h2 className="font-display text-3xl sm:text-4xl text-[var(--tarius-graphite)] mb-6 leading-tight group-hover:text-[var(--tarius-olive)] transition-colors duration-300">
                        {product.name}
                      </h2>

                      {/* Action Bar */}
                      <div className="pt-2 pb-6 border-b border-[var(--tarius-border)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <span className="text-[10px] tracking-widest uppercase text-stone-500 font-medium">
                          {actionType === 'buy_now' ? 'Get Yours Now' : actionType === 'request_allocation' ? 'Direct Concierge' : 'Future Release'}
                        </span>

                        {actionType === 'buy_now' && (
                          <div className="relative w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setOpenDropdownId(isDropdownOpen ? null : product.id)}
                              className="btn-tarius w-full sm:w-auto flex items-center justify-between gap-6 bg-[var(--tarius-graphite)] text-[var(--tarius-white)] hover:bg-[var(--tarius-olive)] border border-[var(--tarius-graphite)] hover:border-[var(--tarius-olive)] transition-all duration-300 py-3 px-6 text-xs uppercase tracking-[0.15em]"
                            >
                              <span>Buy Now</span>
                              <svg 
                                className={`w-3.5 h-3.5 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && links.length > 0 && (
                              <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-full sm:w-56 bg-white border border-[var(--tarius-border)] shadow-xl z-50 overflow-hidden animate-fadeIn">
                                <div className="p-2.5 bg-[var(--tarius-ivory-deep)] border-b border-[var(--tarius-border)]">
                                  <span className="text-[9px] uppercase tracking-widest text-[var(--tarius-olive)] font-medium block">Select Stockist</span>
                                </div>
                                <div className="p-1.5 flex flex-col gap-1">
                                  {links.map((link: any, idx: number) => (
                                    <div key={idx} onClick={() => setOpenDropdownId(null)} className="w-full">
                                      <TrackedLink 
                                        productId={product.id}
                                        productName={product.name}
                                        storeName={link.storeName}
                                        url={link.url}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {actionType === 'request_allocation' && (
                          <Link 
                            href={"/?inquiry=buy&product=" + encodeURIComponent(product.id) + "#contact"} 
                            className="btn-tarius w-full sm:w-auto text-center bg-[var(--tarius-graphite)] text-[var(--tarius-white)] hover:bg-[var(--tarius-olive)] hover:border-[var(--tarius-olive)] transition-all duration-300 py-3 px-6 text-xs uppercase tracking-[0.15em]"
                          >
                            Request Allocation
                          </Link>
                        )}

                        {actionType === 'coming_soon' && (
                          <button 
                            disabled 
                            className="btn-tarius w-full sm:w-auto text-center bg-stone-200 text-stone-400 cursor-not-allowed border-stone-200 py-3 px-6 text-xs uppercase tracking-[0.15em]"
                          >
                            Coming Soon
                          </button>
                        )}

                      </div>

                      <p className="text-[var(--tarius-graphite-soft)] text-sm font-light leading-relaxed mb-6">
                        {product.description}
                      </p>

                      {product.notes && (
                        <div className="bg-[var(--tarius-ivory)] p-3.5 border-l-2 border-[var(--tarius-olive)]">
                          <p className="text-xs text-[var(--tarius-graphite)] font-light italic">
                            &ldquo;{product.notes}&rdquo;
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && activeProducts.length === 0 && (
          <div className="py-32 text-center border border-[var(--tarius-border)] bg-white/50 max-w-lg mx-auto">
            <p className="text-[var(--tarius-graphite-soft)] font-light text-sm">The collection is currently sealed between seasonal harvest intervals.</p>
          </div>
        )}

      </div>
    </div>
  );
}