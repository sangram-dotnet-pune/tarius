// Filename: src/app/certifications/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/api';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';

// --- TYPES ---
type BlockType = 'hero' | 'spotlight' | 'grid' | 'ledger' | 'text' | 'single_pdf' | 'image_banner' | 'overlay_banner' | 'dual_media' | 'divider';

interface Block {
  id: string;
  type: BlockType;
  content: any;
}

export default function CertificationsPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePdf, setActivePdf] = useState<string | null>(null);

  useEffect(() => {
    fetchPageLayout();
  }, []);

  const fetchPageLayout = async () => {
    setLoading(true);
    
    // Fetch the ACTIVE Certifications Template from Version Control
    const { data: activeTemplate, error } = await supabase
      .from('CertificationsTemplates')
      .select('blocks')
      .eq('is_live', true)
      .single();

    if (!error && activeTemplate && activeTemplate.blocks && Array.isArray(activeTemplate.blocks)) {
      setBlocks(activeTemplate.blocks);
    }
    
    setLoading(false);
  };

  const openLightbox = (pdfUrl: string | null) => {
    if (pdfUrl) {
      setActivePdf(pdfUrl);
      document.body.style.overflow = 'hidden';
    }
  };

  const closeLightbox = () => {
    setActivePdf(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <>
      <Navbar />

      <main className="bg-[var(--tarius-ivory)] min-h-screen relative pb-32">
        
        {loading ? (
          <div className="pt-40 pb-32 flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-[var(--tarius-border)] border-t-[var(--tarius-olive)] animate-spin mb-4"></div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Retrieving Dossiers...</p>
          </div>
        ) : blocks.length === 0 ? (
          <div className="pt-40 pb-32 max-w-2xl mx-auto text-center border border-[var(--tarius-border)] bg-white p-12">
            <p className="text-sm font-light text-stone-500">The document registry is currently undergoing updates. Please contact the concierge for direct requests.</p>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            {blocks.map((block, index) => {
              
              // --- HERO BLOCK ---
              if (block.type === 'hero') {
                return (
                  <section key={block.id} className="pt-32 pb-20 flex flex-col items-center justify-center text-center px-4 relative overflow-hidden z-0 border-b border-[var(--tarius-border)] bg-white w-full">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--tarius-champagne)]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
                    <div className="relative z-10 max-w-2xl mx-auto w-full flex flex-col items-center">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)] mb-6 block text-center">
                        {block.content.eyebrow}
                      </span>
                      <h1 className={"font-display text-[var(--tarius-graphite)] text-center mb-6 " + (block.content.titleSize || "text-6xl")}>
                        {block.content.title}
                      </h1>
                      <p className="text-stone-500 font-light leading-relaxed text-center w-full">
                        {block.content.description}
                      </p>
                    </div>
                  </section>
                );
              }

              // --- TEXT BLOCK ---
              if (block.type === 'text') {
                return (
                  <section key={block.id} className="py-24 px-4 bg-white border-b border-[var(--tarius-border)] w-full">
                    <div className={"max-w-4xl mx-auto flex flex-col gap-6 " + (block.content.alignment === 'center' ? 'items-center text-center' : 'items-start text-left')}>
                      <h2 className="font-display text-4xl text-[var(--tarius-graphite)] w-full">
                        {block.content.title}
                      </h2>
                      <p className="text-stone-500 font-light leading-relaxed w-full whitespace-pre-line">
                        {block.content.description}
                      </p>
                    </div>
                  </section>
                );
              }

              // --- OVERLAY BANNER BLOCK ---
              if (block.type === 'overlay_banner') {
                return (
                  <section key={block.id} className="w-full border-y border-[var(--tarius-border)] relative">
                    <div className={"w-full relative flex items-center justify-center bg-[var(--tarius-ivory-deep)] " + (block.content.height || "h-[500px]")}>
                      {block.content.imageUrl && (
                        <img src={block.content.imageUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className="absolute inset-0 bg-black/40 z-10"></div>
                      <div className="relative z-20 w-full max-w-4xl mx-auto flex flex-col items-center text-center p-8">
                        <h2 className="font-display text-4xl lg:text-6xl text-white w-full text-center mb-4">
                          {block.content.title}
                        </h2>
                        <p className="text-white/80 font-light leading-relaxed w-full text-center whitespace-pre-line">
                          {block.content.description}
                        </p>
                      </div>
                    </div>
                  </section>
                );
              }

              // --- SINGLE PDF BLOCK ---
              if (block.type === 'single_pdf') {
                return (
                  <section key={block.id} className="py-24 px-4 bg-white border-b border-[var(--tarius-border)] w-full">
                    <div className="max-w-3xl mx-auto flex flex-col items-center gap-8">
                      <div 
                        onClick={() => openLightbox(block.content.pdfUrl)}
                        className="w-full h-[500px] relative border border-[var(--tarius-border)] shadow-xl bg-[var(--tarius-ivory-deep)] cursor-pointer group overflow-hidden"
                      >
                        {block.content.thumbnailUrl ? (
                          <img src={block.content.thumbnailUrl} alt={block.content.title} className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-300">PDF</div>
                        )}
                        <div className="absolute inset-0 bg-[var(--tarius-olive)]/0 group-hover:bg-[var(--tarius-olive)]/10 transition-colors duration-300 flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 bg-[var(--tarius-graphite)] text-white text-[10px] uppercase tracking-widest px-6 py-3 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                            View Original PDF
                          </span>
                        </div>
                      </div>
                      <div className="w-full flex flex-col items-center text-center gap-4 px-4">
                        <h3 className="font-display text-3xl text-[var(--tarius-graphite)] leading-tight">
                          {block.content.title}
                        </h3>
                        <p className="text-sm font-light leading-relaxed text-stone-500 max-w-xl whitespace-pre-line">
                          {block.content.description}
                        </p>
                      </div>
                    </div>
                  </section>
                );
              }

              // --- IMAGE BANNER BLOCK ---
              if (block.type === 'image_banner') {
                return (
                  <section key={block.id} className="w-full border-y border-[var(--tarius-border)] bg-[var(--tarius-ivory-deep)]">
                    <div className={"w-full relative " + (block.content.height || "h-[400px]")}>
                      {block.content.imageUrl && (
                        <img src={block.content.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                      )}
                    </div>
                  </section>
                );
              }

              // --- DIVIDER BLOCK ---
              if (block.type === 'divider') {
                return (
                  <section key={block.id} className="w-full py-16 flex items-center justify-center bg-[var(--tarius-ivory)]">
                    {block.content.style === 'line' ? (
                      <div className="w-full max-w-4xl border-t border-[var(--tarius-border)]"></div>
                    ) : (
                      <div className="h-8"></div>
                    )}
                  </section>
                );
              }

              // --- SPOTLIGHT BLOCK ---
              if (block.type === 'spotlight') {
                return (
                  <section key={block.id} className={"w-full py-24 px-4 sm:px-8 border-b border-[var(--tarius-border)] " + (index % 2 === 0 ? "bg-[var(--tarius-ivory)]" : "bg-white")}>
                    <div className={"max-w-6xl mx-auto flex flex-col gap-12 items-center " + (block.content.mediaPosition === 'right' ? "md:flex-row-reverse" : "md:flex-row")}>
                      
                      <div className="w-full md:w-1/2 flex justify-center">
                        <div 
                          onClick={() => openLightbox(block.content.pdfUrl)}
                          className="relative w-full max-w-md bg-white p-4 border border-[var(--tarius-border)] shadow-2xl cursor-pointer group transform transition-transform duration-500 hover:scale-[1.02]"
                        >
                          <div className="w-full h-[500px] bg-[var(--tarius-ivory-deep)] overflow-hidden relative">
                            {block.content.thumbnailUrl ? (
                              <img src={block.content.thumbnailUrl} alt={block.content.title} className="w-full h-full object-cover opacity-90 mix-blend-multiply group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300">PDF</div>
                            )}
                            <div className="absolute inset-0 bg-[var(--tarius-olive)]/0 group-hover:bg-[var(--tarius-olive)]/10 transition-colors duration-300 flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 bg-[var(--tarius-graphite)] text-white text-[10px] uppercase tracking-widest px-6 py-3 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                                View Original PDF
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-1/2 flex flex-col gap-6 text-center md:text-left px-4">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)]">
                          {block.content.label}
                        </span>
                        <h2 className="font-display text-4xl lg:text-5xl text-[var(--tarius-graphite)] leading-tight">
                          {block.content.title}
                        </h2>
                        <p className="text-sm font-light leading-relaxed text-stone-600 mb-4 whitespace-pre-line">
                          {block.content.description}
                        </p>
                        {block.content.pdfUrl && (
                          <button 
                            onClick={() => openLightbox(block.content.pdfUrl)}
                            className="btn-tarius w-max mx-auto md:mx-0 hover:bg-[var(--tarius-olive)] hover:border-[var(--tarius-olive)] hover:text-white"
                          >
                            Inspect Dossier
                          </button>
                        )}
                      </div>

                    </div>
                  </section>
                );
              }

              // --- DUAL MEDIA BLOCK ---
              if (block.type === 'dual_media') {
                return (
                  <section key={block.id} className="w-full py-24 px-4 sm:px-8 bg-white border-b border-[var(--tarius-border)]">
                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
                      {block.content.items && block.content.items.map((item: any, i: number) => (
                        <div key={i} className="w-full md:w-1/2 flex flex-col gap-6">
                          <div 
                            onClick={() => openLightbox(item.pdfUrl)}
                            className="w-full h-[500px] relative border border-[var(--tarius-border)] bg-[var(--tarius-ivory-deep)] shadow-lg cursor-pointer group overflow-hidden"
                          >
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300">PDF</div>
                            )}
                            <div className="absolute inset-0 bg-[var(--tarius-olive)]/0 group-hover:bg-[var(--tarius-olive)]/10 transition-colors duration-300 flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 bg-[var(--tarius-graphite)] text-white text-[10px] uppercase tracking-widest px-6 py-3 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                                View Original PDF
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 text-center md:text-left px-2">
                            <h3 className="font-display text-2xl text-[var(--tarius-graphite)] w-full">
                              {item.title}
                            </h3>
                            <p className="text-sm font-light leading-relaxed text-stone-500 w-full whitespace-pre-line">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              // --- GRID BLOCK ---
              if (block.type === 'grid') {
                return (
                  <section key={block.id} className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-24">
                    <div className="text-center mb-16">
                      <h3 className="font-display text-3xl text-[var(--tarius-graphite)] mb-4">{block.content.sectionTitle}</h3>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">{block.content.sectionSubtitle}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {block.content.cards && block.content.cards.map((card: any, cardIndex: number) => (
                        <div key={cardIndex} className="bg-white border border-[var(--tarius-border)] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col group">
                          <div 
                            className="h-[300px] bg-[var(--tarius-ivory-deep)] relative border-b border-[var(--tarius-border)] overflow-hidden cursor-pointer" 
                            onClick={() => openLightbox(card.pdfUrl)}
                          >
                            {card.thumbnailUrl ? (
                              <img src={card.thumbnailUrl} alt={card.title} className="w-full h-full object-cover mix-blend-multiply opacity-90 group-hover:scale-105 transition-transform duration-700" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-300">PDF</div>
                            )}
                            <div className="absolute inset-0 bg-[var(--tarius-olive)]/0 group-hover:bg-[var(--tarius-olive)]/5 transition-colors"></div>
                          </div>
                          <div className="p-8 flex flex-col flex-1">
                            <h4 className="font-display text-2xl text-[var(--tarius-graphite)] mb-3 group-hover:text-[var(--tarius-olive)] transition-colors">
                              {card.title}
                            </h4>
                            <p className="text-xs font-light leading-relaxed text-stone-500 mb-8 flex-1 whitespace-pre-line">
                              {card.description}
                            </p>
                            {card.pdfUrl && (
                              <button 
                                onClick={() => openLightbox(card.pdfUrl)}
                                className="text-[10px] uppercase tracking-widest text-[var(--tarius-graphite)] border-b border-[var(--tarius-border)] pb-1 w-max group-hover:border-[var(--tarius-olive)] group-hover:text-[var(--tarius-olive)] transition-all"
                              >
                                View Full Document
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              // --- LEDGER BLOCK ---
              if (block.type === 'ledger') {
                return (
                  <section key={block.id} className="w-full max-w-4xl mx-auto px-4 sm:px-8 py-24 border-t border-[var(--tarius-border)]">
                    <div className="text-center mb-12">
                      <h3 className="font-display text-2xl text-[var(--tarius-graphite)] mb-3">{block.content.sectionTitle}</h3>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">{block.content.sectionSubtitle}</p>
                    </div>

                    <div className="flex flex-col border-t border-[var(--tarius-border)] bg-white">
                      {block.content.items && block.content.items.map((item: any, itemIndex: number) => (
                        <div 
                          key={itemIndex} 
                          className="w-full border-b border-[var(--tarius-border)] p-6 flex flex-col sm:flex-row sm:items-center gap-6 hover:bg-[var(--tarius-ivory-deep)] transition-colors group cursor-pointer" 
                          onClick={() => openLightbox(item.pdfUrl)}
                        >
                          <div className="w-16 h-16 shrink-0 bg-white border border-[var(--tarius-border)] flex items-center justify-center overflow-hidden">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt="thumb" className="w-full h-full object-cover opacity-50 mix-blend-multiply group-hover:opacity-80 transition-opacity" />
                            ) : (
                              <span className="text-[10px] text-stone-300 font-medium">PDF</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-[var(--tarius-graphite)] group-hover:text-[var(--tarius-olive)] transition-colors">{item.title}</h4>
                            <p className="text-xs text-stone-500 mt-1">{item.description}</p>
                          </div>
                          {item.pdfUrl && (
                            <div className="shrink-0 w-10 h-10 rounded-full border border-[var(--tarius-border)] flex items-center justify-center text-stone-400 group-hover:border-[var(--tarius-olive)] group-hover:text-[var(--tarius-olive)] transition-colors bg-white">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              }

              return null;
            })}
          </div>
        )}

        {/* IMMERSIVE PDF LIGHTBOX VIEWER */}
        {activePdf && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-black/95 animate-in fade-in duration-300 backdrop-blur-sm">
            <div className="w-full flex items-center justify-between p-6 border-b border-white/10 bg-black">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-champagne)] mb-1">Tarius Secure Viewer</span>
                <span className="text-xs text-stone-400 font-light">End-to-End Encrypted Document</span>
              </div>
              <div className="flex items-center gap-6">
                <a 
                  href={activePdf} 
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] uppercase tracking-widest text-[var(--tarius-champagne)] hover:text-white transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                  Download PDF
                </a>
                <button 
                  onClick={closeLightbox}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 h-full">
              <div className="w-full h-full bg-white rounded-sm overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10">
                <iframe 
                  src={activePdf + "#toolbar=0&navpanes=0&scrollbar=0"} 
                  className="w-full h-full border-none"
                  title="Secure Document Viewer"
                />
              </div>
            </div>
          </div>
        )}

      </main>
      

    </>
  );
}