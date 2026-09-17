// Filename: src/app/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/api';
import Navbar from '@/components/navbar/Navbar';
import Footer from '@/components/footer/Footer';
import { scrollToSection } from '@/lib/scroll';

// --- TYPES ---
type BlockType = 'hero' | 'story' | 'quality' | 'faq' | 'contact' | 'image_break' | 'rich_text' | 'dual_panel' | 'spacer' | 'quote' | 'mission' | 'image_collage';

interface Block {
  id: string;
  type: BlockType;
  content: any;
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  category: string | null;
}

export default function Home() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);

  // --- FAQ STATE ---
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number>(0);
  const [isFaqFading, setIsFaqFading] = useState(false);

  // --- CONTACT STATE ---
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);
  const [selectedInquiry, setSelectedInquiry] = useState<string>('');
  const [isContactSubmitting, setIsContactSubmitting] = useState<boolean>(false);
  const [products, setProducts] = useState<any[]>([]);
  const [contactData, setContactData] = useState({
    name: '', email: '', phone: '', preferredContact: 'email', message: '',
    product: '',
    giftingProducts: {} as Record<string, boolean>,
    giftingQtys: {} as Record<string, string>,
    deliveryDate: '', deliveryTime: '', deliveryLocation: '',
    socialHandle: '', collaborationReason: '', collabProducts: '', eventDate: '', eventTime: '',
    position: '', expectedSalary: '', qualifications: '', tentativeJoiningDate: '',
    purchasePlatform: '', purchaseDate: '',
  });

  useEffect(() => {
    async function fetchPageData() {
      setLoading(true);

      // 1. Fetch the ACTIVE Homepage Template from Version Control
      const { data: activeTemplate } = await supabase
        .from('PageTemplates')
        .select('blocks')
        .eq('is_live', true)
        .single();

      if (activeTemplate && activeTemplate.blocks && Array.isArray(activeTemplate.blocks)) {
        setBlocks(activeTemplate.blocks);
      }

      // 2. Fetch the Live FAQs
      const { data: faqData } = await supabase
        .from('FaqItem')
        .select('*')
        .eq('isPublished', true)
        .order('order', { ascending: true });

      if (faqData && faqData.length > 0) {
        setFaqs(faqData);
      }

   //Fetch products for the "Where to Buy" dropdown in the contact form
      const { data: productData } = await supabase
        .from('Product')
        .select('*')
        .eq('isPublished', true)
        .order('createdAt', { ascending: true });

      if (productData && productData.length > 0) {
        setProducts(productData);

   
        const productParam = new URLSearchParams(window.location.search).get('product');
        if (productParam) {
          const match = productData.find((p) => String(p.id) === String(productParam));
          if (match) {
            setContactData(prev => ({ ...prev, product: match.name }));
          }
        }
      }

      setLoading(false);
    }
    
    fetchPageData();
  }, []);

  // When arriving from a product's "Request Allocation" button, pre-select the
  // "Where to Buy" inquiry option in the contact form.
  useEffect(() => {
    if (window.location.search.includes('inquiry=buy')) {
      setSelectedInquiry('buy');
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (window.location.hash === '#contact') {
      scrollToSection('contact');
    }
  }, [loading]);

  // --- FAQ LOGIC ---
  const handleFaqSelect = (idx: number) => {
    if (idx === activeFaqIndex) return;
    setIsFaqFading(true);
    setTimeout(() => {
      setActiveFaqIndex(idx);
      setIsFaqFading(false);
    }, 300);
  };

  // --- CONTACT LOGIC ---
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (productId: string) => {
    setContactData(prev => {
      const checked = !prev.giftingProducts[productId];
      return {
        ...prev,
        giftingProducts: {
          ...prev.giftingProducts,
          [productId]: checked
        },
        giftingQtys: checked && !prev.giftingQtys[productId]
          ? { ...prev.giftingQtys, [productId]: '1' }
          : prev.giftingQtys
      };
    });
  };

  const handleGiftingQtyChange = (productId: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setContactData(prev => ({
      ...prev,
      giftingQtys: { ...prev.giftingQtys, [productId]: e.target.value }
    }));
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsContactSubmitting(true);

    const metaData: string[] = [];

    if (selectedInquiry === 'gifting') {
      const lines: string[] = ["Gifting Requirements:"];
      for (const product of products) {
        lines.push("- " + product.name + ": " + (contactData.giftingProducts[product.id] ? contactData.giftingQtys[product.id] || '0' : "0"));
      }
      if (contactData.deliveryDate || contactData.deliveryTime) {
        lines.push("- Delivery: " + [contactData.deliveryDate, contactData.deliveryTime].filter(Boolean).join(" @ "));
      }
      if (contactData.deliveryLocation) {
        lines.push("- Location: " + contactData.deliveryLocation);
      }
      metaData.push(...lines);
    } else if (selectedInquiry === 'collab' || selectedInquiry === 'press') {
      const lines: string[] = ["Partnership Details:"];
      if (contactData.socialHandle) lines.push("- Social/URL: " + contactData.socialHandle);
      if (contactData.collabProducts) lines.push("- Products Requested: " + contactData.collabProducts);
      metaData.push(...lines);
    } else if (selectedInquiry === 'careers') {
      const lines: string[] = ["Candidate Profile:"];
      if (contactData.position) lines.push("- Position: " + contactData.position);
      if (contactData.expectedSalary) lines.push("- Expected Salary: " + contactData.expectedSalary);
      metaData.push(...lines);
    } else if (selectedInquiry === 'feedback') {
      const lines: string[] = ["Feedback Context:"];
      if (contactData.purchasePlatform) lines.push("- Purchased From: " + contactData.purchasePlatform);
      if (contactData.purchaseDate) lines.push("- Purchase Date: " + contactData.purchaseDate);
      metaData.push(...lines);
    } else if (selectedInquiry === 'buy') {
      const lines: string[] = ["Product Selection:"];
      if (contactData.product) lines.push("- Product: " + contactData.product);
      metaData.push(...lines);
    }

    const compiledNotes = [
      contactData.phone ? "Phone: " + contactData.phone : null,
      "Client Message:",
      contactData.message,
      ...(metaData.length > 0 ? ['--- Additional Details ---', ...metaData] : [])
    ].filter(Boolean).join('\n');

    const { error } = await supabase.from('Inquiry').insert([
      {
        name: contactData.name,
        email: contactData.email,
        preferredContact: contactData.preferredContact,
        tier: selectedInquiry,
        deliveryInstructions: compiledNotes,
        status: 'pending'
      }
    ]);

    if (error) {
      console.error('Error submitting inquiry:', error);
      alert('Failed to transmit dossier. Please try again.');
      setIsContactSubmitting(false);
      return;
    }

    try {
      const emailPayload = {
        ...contactData,
        tier: selectedInquiry
      };
      
      await fetch('/api/contact-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });
    } catch (emailError) {
      console.error("Email trigger failed, but data was saved.", emailError);
    }

    setIsContactSubmitting(false);
    setContactSubmitted(true);
    
    setTimeout(() => {
      setContactSubmitted(false);
      setSelectedInquiry('');
      setContactData({
        name: '', email: '', phone: '', preferredContact: 'email', message: '',
        product: '',
        giftingProducts: {} as Record<string, boolean>,
        giftingQtys: {} as Record<string, string>,
        deliveryDate: '', deliveryTime: '', deliveryLocation: '',
        socialHandle: '', collaborationReason: '', collabProducts: '', eventDate: '', eventTime: '',
        position: '', expectedSalary: '', qualifications: '', tentativeJoiningDate: '',
        purchasePlatform: '', purchaseDate: ''
      });
    }, 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--tarius-ivory)] flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--tarius-border)] border-t-[var(--tarius-olive)] animate-spin mb-4"></div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Loading Tarius Protocol...</p>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <main className="bg-[var(--tarius-ivory)] min-h-screen font-body">
        {blocks.map((block) => {
          
          // --- BLOCK: HERO ---
          if (block.type === 'hero') {
            return (
              <section key={block.id} id="home" className="relative overflow-hidden bg-[var(--tarius-ivory)]">
                <div className="container-tarius grid min-h-[calc(100svh-76px)] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
                  <div className="relative z-10 max-w-3xl">
                    <p className="text-eyebrow text-[var(--tarius-olive)]">
                      {block.content.eyebrow}
                    </p>
                    <h1 className={"text-display mt-6 leading-[0.82] text-[var(--tarius-graphite)] " + (block.content.titleSize || "text-[clamp(4rem,10vw,9rem)]")}>
                      {block.content.titleLine1}
                      <br />
                      {block.content.titleLine2}
                      <br />
                      <span className="text-[var(--tarius-olive)]">
                        {block.content.titleHighlight}
                      </span>
                    </h1>
                    <p className="mt-8 max-w-xl text-sm leading-7 text-[var(--tarius-graphite-soft)] sm:text-base sm:leading-8 whitespace-pre-line">
                      {block.content.description}
                    </p>
                    <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                      {block.content.primaryButtonText && (
                        <Link href={block.content.primaryButtonLink || '#'} className="btn-tarius w-full sm:w-auto">
                          {block.content.primaryButtonText}
                        </Link>
                      )}
                      {block.content.secondaryButtonText && (
                        <Link href={block.content.secondaryButtonLink || '#'} className="btn-tarius btn-tarius-outline w-full sm:w-auto">
                          {block.content.secondaryButtonText}
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <div className="image-tarius relative aspect-[4/5] min-h-[420px] w-full overflow-hidden bg-[var(--tarius-ivory-deep)] sm:min-h-[520px] lg:min-h-0">
                      {block.content.imageUrl && (
                        <img src={block.content.imageUrl} alt="Hero" className="w-full h-full object-cover absolute inset-0" />
                      )}
                    </div>
                    <div className="pointer-events-none absolute -bottom-5 -left-5 hidden h-24 w-24 border-l border-b border-[var(--tarius-champagne)] lg:block" />
                    <div className="pointer-events-none absolute -right-5 -top-5 hidden h-24 w-24 border-r border-t border-[var(--tarius-champagne)] lg:block" />
                  </div>
                </div>

                <div className="container-tarius hidden pb-8 lg:block">
                  <div className="flex items-center gap-4">
                    <span className="h-px w-10 bg-[var(--tarius-graphite)]/30" />
                    <span className="text-eyebrow text-[var(--tarius-graphite-soft)]/60">Scroll to explore</span>
                  </div>
                </div>
              </section>
            );
          }

          // --- BLOCK: STORY ---
          if (block.type === 'story') {
            return (
              <section key={block.id} id="story" className="section-tarius overflow-hidden bg-[var(--tarius-ivory-deep)]">
                <div className="container-tarius">
                  <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
                    <div className="order-2 lg:order-1">
                      <div className="image-tarius relative aspect-[4/5] overflow-hidden bg-[var(--tarius-olive)]/15">
                        {block.content.imageUrl && (
                          <img src={block.content.imageUrl} alt="Story" className="w-full h-full object-cover absolute inset-0" />
                        )}
                        <div className="absolute left-6 top-6 z-10 h-16 w-16 border-l border-t border-[var(--tarius-champagne)] pointer-events-none" />
                        <div className="absolute bottom-6 right-6 z-10 h-16 w-16 border-b border-r border-[var(--tarius-champagne)] pointer-events-none" />
                      </div>
                    </div>

                    <div className="order-1 lg:order-2">
                      <p className="text-eyebrow text-[var(--tarius-olive)]">
                        {block.content.eyebrow}
                      </p>
                      <h2 className="text-display mt-5 max-w-2xl text-5xl leading-[0.95] sm:text-6xl lg:text-7xl text-[var(--tarius-graphite)]">
                        {block.content.title}
                      </h2>
                      <div className="mt-8 max-w-xl space-y-5 text-sm leading-7 text-[var(--tarius-graphite-soft)] sm:text-base sm:leading-8 whitespace-pre-line">
                        {block.content.paragraphs && block.content.paragraphs.map((p: string, idx: number) => (
                          <p key={idx}>{p}</p>
                        ))}
                      </div>
                      {block.content.buttonText && (
                        <div className="mt-9">
                          <Link href={block.content.buttonLink || '#'} className="btn-tarius btn-tarius-outline">
                            {block.content.buttonText}
                          </Link>
                        </div>
                      )}
                      
                      {block.content.pillars && block.content.pillars.length > 0 && (
                        <div className="mt-12 grid grid-cols-2 border-t border-[var(--tarius-border)] pt-6 sm:grid-cols-3 gap-6">
                          {block.content.pillars.map((pillar: any, idx: number) => (
                            <div key={idx}>
                              <p className="text-display text-3xl text-[var(--tarius-graphite)]">{pillar.num}</p>
                              <p className="text-eyebrow mt-2 text-[var(--tarius-graphite-soft)]">{pillar.title}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          // --- BLOCK: QUALITY ---
          if (block.type === 'quality') {
            return (
              <section key={block.id} id="quality" className="section-tarius bg-[var(--tarius-graphite)] text-[var(--tarius-white)]">
                <div className="container-tarius">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20">
                    <div>
                      <span className="text-eyebrow text-[var(--tarius-champagne)] mb-4 block">{block.content.eyebrow}</span>
                      <h2 className="text-display text-4xl sm:text-5xl text-[var(--tarius-white)]">
                        {block.content.title} <span className="italic text-[var(--tarius-champagne)]">{block.content.titleHighlight}</span>
                      </h2>
                    </div>
                    <p className="text-stone-300 text-sm font-light max-w-md mt-6 md:mt-0 text-left md:text-right whitespace-pre-line">
                      {block.content.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {block.content.pillars && block.content.pillars.map((pillar: any, idx: number) => (
                      <div key={idx} className="border border-[var(--tarius-champagne)]/30 p-8 sm:p-10 hover:bg-[var(--tarius-white)]/5 transition-colors duration-500 group">
                        <span className="font-display text-3xl text-[var(--tarius-champagne)] block mb-6 group-hover:translate-x-1 transition-transform">
                          {pillar.num}
                        </span>
                        <h3 className="font-display text-2xl text-[var(--tarius-white)] mb-4">{pillar.title}</h3>
                        <p className="text-stone-300 text-xs sm:text-sm font-light leading-relaxed whitespace-pre-line">{pillar.desc}</p>
                      </div>
                    ))}
                  </div>

                  {block.content.buttonText && (
                    <div className="flex justify-center">
                      <Link
                        href={block.content.buttonLink || '#'}
                        className="inline-flex items-center justify-center min-h-[3rem] px-8 py-3 bg-transparent border border-[var(--tarius-champagne)] text-[var(--tarius-champagne)] font-semibold text-[0.68rem] tracking-[0.16em] uppercase transition-all duration-300 hover:bg-[var(--tarius-champagne)] hover:text-[var(--tarius-graphite)] shadow-[0_0_15px_rgba(238,226,204,0.1)]"
                      >
                        {block.content.buttonText}
                      </Link>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // --- BLOCK: FAQ ---
          if (block.type === 'faq') {
            return (
              <section key={block.id} id="faq" className="section-tarius bg-[var(--tarius-ivory)] text-[var(--tarius-graphite)] relative py-24 sm:py-32">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--tarius-champagne)]/10 rounded-full blur-[150px] pointer-events-none"></div>

                <div className="container-tarius relative z-10">
                  <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-24 pb-12 border-b border-[var(--tarius-border)]">
                    <span className="text-eyebrow text-[var(--tarius-olive)] mb-4 block">{block.content.eyebrow}</span>
                    <h2 className="text-display text-4xl sm:text-6xl text-[var(--tarius-graphite)] mb-6">
                      {block.content.title} <span className="italic text-[var(--tarius-olive)]">{block.content.titleHighlight}</span>
                    </h2>
                    <p className="text-sm font-light text-[var(--tarius-graphite-soft)] leading-relaxed mx-auto whitespace-pre-line">
                      {block.content.description}
                    </p>
                  </div>

                  {faqs.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 relative">
                      <div className="lg:col-span-5 flex flex-col gap-6 relative z-20">
                        {faqs.map((faq, idx) => (
                          <button
                            key={faq.id}
                            onClick={() => handleFaqSelect(idx)}
                            className={"text-left group flex items-start gap-6 pb-6 border-b transition-all duration-500 " + (activeFaqIndex === idx ? "border-[var(--tarius-olive)] opacity-100" : "border-[var(--tarius-border)] opacity-40 hover:opacity-100 hover:border-[var(--tarius-graphite)]/30")}
                          >
                            <span className={"font-display text-xl transition-colors duration-500 " + (activeFaqIndex === idx ? "text-[var(--tarius-olive)]" : "text-stone-400")}>
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            <span className="font-display text-xl sm:text-2xl text-[var(--tarius-graphite)] leading-snug">
                              {faq.question}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="lg:col-span-7 lg:sticky lg:top-32 h-fit">
                        <div className="bg-[var(--tarius-ivory-deep)]/40 border border-[var(--tarius-border)] backdrop-blur-sm p-8 sm:p-14 min-h-[400px] flex flex-col justify-center relative overflow-hidden shadow-sm">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--tarius-champagne)]/20 blur-[50px] rounded-full"></div>
                          
                          <div className={"transition-opacity duration-300 " + (isFaqFading ? "opacity-0" : "opacity-100")}>
                            {faqs[activeFaqIndex].category && (
                              <span className="inline-block px-3 py-1 bg-[var(--tarius-olive)]/10 text-[var(--tarius-olive)] text-[10px] uppercase tracking-widest border border-[var(--tarius-olive)]/20 mb-6">
                                {faqs[activeFaqIndex].category}
                              </span>
                            )}
                            
                            <h3 className="font-display text-3xl sm:text-4xl text-[var(--tarius-graphite)] mb-8 leading-tight">
                              {faqs[activeFaqIndex].question}
                            </h3>
                            
                            <div className="w-12 h-px bg-[var(--tarius-olive)]/40 mb-8"></div>
                            
                            <p className="text-[var(--tarius-graphite-soft)] text-sm sm:text-base font-light leading-relaxed max-w-2xl whitespace-pre-line">
                              {faqs[activeFaqIndex].answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          // --- BLOCK: CONTACT ---
          if (block.type === 'contact') {
            return (
              <section key={block.id} id="contact" className="section-tarius bg-[var(--tarius-graphite)] text-[var(--tarius-white)] relative overflow-hidden py-24 sm:py-32">
                <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[var(--tarius-champagne)]/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="container-tarius relative z-10">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
                    
                    <div className="lg:col-span-5 lg:sticky lg:top-12">
                      <span className="text-eyebrow text-[var(--tarius-champagne)] mb-4 block tracking-[0.25em] text-xs">{block.content.eyebrow}</span>
                      <h2 className="text-display text-4xl sm:text-5xl text-[var(--tarius-white)] mb-6 font-light leading-tight">
                        {block.content.title} <span className="italic text-[var(--tarius-champagne)]">{block.content.titleHighlight}</span>
                      </h2>
                      <p className="text-stone-300 text-sm font-light leading-relaxed mb-10 whitespace-pre-line">
                        {block.content.description}
                      </p>
                      <div className="space-y-4 text-xs tracking-[0.2em] uppercase text-[var(--tarius-champagne)] font-medium border-t border-[var(--tarius-champagne)]/20 pt-8">
                        <p className="flex items-center gap-3">
                          <span className="w-1 h-1 rounded-full bg-[var(--tarius-champagne)]"></span>
                          {block.content.emailContext}
                        </p>
                        <p className="flex items-center gap-3">
                          <span className="w-1 h-1 rounded-full bg-[var(--tarius-champagne)]"></span>
                          {block.content.phoneContext}
                        </p>
                      </div>
                    </div>

                    <div className="lg:col-span-7">
                      {contactSubmitted ? (
                        <div className="py-24">
                          <div className="w-12 h-12 rounded-full border border-[var(--tarius-champagne)] flex items-center justify-center mb-6">
                            <svg className="w-6 h-6 text-[var(--tarius-champagne)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>
                          <span className="font-display text-3xl text-[var(--tarius-champagne)] block mb-3 font-light">Application Received</span>
                          <p className="text-stone-300 text-sm font-light leading-relaxed">
                            Your dossier has been securely routed. Our team will review your requirements and revert back to you within 24 hours.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleContactSubmit} className="flex flex-col gap-8">
                          
                          <div className="relative">
                            <label className="block text-[var(--tarius-champagne)] font-sans text-[10px] uppercase tracking-widest mb-2">Nature of Inquiry</label>
                            <select 
                              name="tier"
                              value={selectedInquiry}
                              onChange={(e) => setSelectedInquiry(e.target.value)}
                              required
                              className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-[var(--tarius-white)] font-sans text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors appearance-none cursor-pointer"
                            >
                              <option value="" className="bg-[var(--tarius-graphite)] text-stone-400">[Select Inquiry Type...]</option>
                              <option value="product" className="bg-[var(--tarius-graphite)]">1. Product Inquiry (Ingredients, Sourcing, Dosage)</option>
                              <option value="buy" className="bg-[var(--tarius-graphite)]">2. Where to Buy (Stockist / Platform Stock)</option>
                              <option value="bulk" className="bg-[var(--tarius-graphite)]">3. Bulk / Wholesale Inquiry</option>
                              <option value="retail" className="bg-[var(--tarius-graphite)]">4. Retail / Stockist Partnership</option>
                              <option value="quality" className="bg-[var(--tarius-graphite)]">5. Quality Complaint (Defect, Seal, Batch Issue)</option>
                              <option value="cert" className="bg-[var(--tarius-graphite)]">6. Certification / Documentation Request</option>
                              <option value="gifting" className="bg-[var(--tarius-graphite)]">7. Corporate / Custom Gifting</option>
                              <option value="collab" className="bg-[var(--tarius-graphite)]">8. Collaboration / Influencer Partnership</option>
                              <option value="press" className="bg-[var(--tarius-graphite)]">9. Press & Media Inquiry</option>
                              <option value="careers" className="bg-[var(--tarius-graphite)]">10. Careers</option>
                              <option value="feedback" className="bg-[var(--tarius-graphite)]">11. General Feedback</option>
                              <option value="other" className="bg-[var(--tarius-graphite)]">12. Other</option>
                            </select>
                            <div className="absolute right-0 top-8 pointer-events-none text-stone-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                          </div>

                          {selectedInquiry && (
                            <div className="space-y-6 pt-4 border-t border-[var(--tarius-champagne)]/10">
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="relative group">
                                  <input 
                                    type="text" 
                                    name="name"
                                    required 
                                    value={contactData.name}
                                    onChange={handleContactChange}
                                    className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-[var(--tarius-white)] font-sans text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors peer placeholder-transparent" 
                                    placeholder="Full Name"
                                  />
                                  <label className="absolute left-0 top-3 text-stone-400 font-sans text-xs uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-champagne)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-400 pointer-events-none">Full Name</label>
                                </div>

                                <div className="relative group">
                                  <input 
                                    type="email" 
                                    name="email"
                                    required 
                                    value={contactData.email}
                                    onChange={handleContactChange}
                                    className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-[var(--tarius-white)] font-sans text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors peer placeholder-transparent" 
                                    placeholder="Email Address"
                                  />
                                  <label className="absolute left-0 top-3 text-stone-400 font-sans text-xs uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-champagne)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-400 pointer-events-none">Email Address</label>
                                </div>
                              </div>

                              <div className="relative group">
                                <input 
                                  type="tel" 
                                  name="phone"
                                  value={contactData.phone}
                                  onChange={handleContactChange}
                                  className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-[var(--tarius-white)] font-sans text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors peer placeholder-transparent" 
                                  placeholder="Phone Number (Optional)"
                                />
                                <label className="absolute left-0 top-3 text-stone-400 font-sans text-xs uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-champagne)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-400 pointer-events-none">Phone Number (Optional)</label>
                              </div>

                              {selectedInquiry === 'buy' && (
                                <div className="space-y-6 bg-white/[0.02] p-6 border border-[var(--tarius-champagne)]/20">
                                  <p className="text-xs uppercase tracking-widest text-[var(--tarius-champagne)]">Select a product</p>
                                  <div>
                                    <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Product</label>
                                    <select
                                      name="product"
                                      value={contactData.product}
                                      onChange={handleContactChange}
                                      required
                                      className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)] focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors appearance-none cursor-pointer"
                                    >
                                      <option value="" className="bg-[var(--tarius-graphite)] text-stone-400">Select a product</option>
                                      {products.map((p) => (
                                        <option key={p.id} value={p.name} className="bg-[var(--tarius-graphite)] text-[var(--tarius-white)]">{p.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              )}

                              {selectedInquiry === 'gifting' && (
                                <div className="space-y-6 bg-white/[0.02] p-6 border border-[var(--tarius-champagne)]/20">
                                  <p className="text-xs uppercase tracking-widest text-[var(--tarius-champagne)]">Select Products & Quantities</p>

                                  {products.map((product) => (
                                    <div key={product.id} className="flex items-center justify-between gap-4">
                                      <label className="flex items-center gap-3 text-sm font-light text-stone-300 cursor-pointer">
                                        <input type="checkbox" checked={!!contactData.giftingProducts[product.id]} onChange={() => handleCheckboxChange(product.id)} className="accent-[var(--tarius-champagne)]" />
                                        {product.name}
                                      </label>
                                      {contactData.giftingProducts[product.id] && (
                                        <input type="number" name="qty" min="1" value={contactData.giftingQtys[product.id] || '1'} onChange={handleGiftingQtyChange(product.id)} className="w-20 bg-transparent border-b border-[var(--tarius-champagne)]/30 px-2 py-1 text-sm text-[var(--tarius-white)]" placeholder="Qty" />
                                      )}
                                    </div>
                                  ))}

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                                    <div>
                                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Delivery Date</label>
                                      <input type="date" name="deliveryDate" value={contactData.deliveryDate} onChange={handleContactChange} className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Delivery Time</label>
                                      <input type="time" name="deliveryTime" value={contactData.deliveryTime} onChange={handleContactChange} className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Location / Venue</label>
                                      <input type="text" name="deliveryLocation" value={contactData.deliveryLocation} onChange={handleContactChange} className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" placeholder="City / Address" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {(selectedInquiry === 'collab' || selectedInquiry === 'press') && (
                                <div className="space-y-6 bg-white/[0.02] p-6 border border-[var(--tarius-champagne)]/20">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Social Handle / Page Link</label>
                                      <input type="text" name="socialHandle" value={contactData.socialHandle} onChange={handleContactChange} placeholder="@instagram / portfolio URL" className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Products to Showcase</label>
                                      <input type="text" name="collabProducts" value={contactData.collabProducts} onChange={handleContactChange} placeholder="Spirulina / Moringa" className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {selectedInquiry === 'careers' && (
                                <div className="space-y-6 bg-white/[0.02] p-6 border border-[var(--tarius-champagne)]/20">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Position Applying For</label>
                                      <input type="text" name="position" value={contactData.position} onChange={handleContactChange} placeholder="Role title" className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Expected Compensation Tier</label>
                                      <input type="text" name="expectedSalary" value={contactData.expectedSalary} onChange={handleContactChange} placeholder="e.g. Competitive / Negotiable" className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="relative group mt-4">
                                <textarea 
                                  name="message" 
                                  rows={4} 
                                  required 
                                  value={contactData.message}
                                  onChange={handleContactChange}
                                  className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-[var(--tarius-white)] font-sans text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors peer placeholder-transparent resize-none" 
                                  placeholder="Detailed Inquiry Description..."
                                />
                                <label className="absolute left-0 top-3 text-stone-400 font-sans text-xs uppercase tracking-widest transition-all peer-focus:-top-6 peer-focus:text-[10px] peer-focus:text-[var(--tarius-champagne)] peer-valid:-top-6 peer-valid:text-[10px] peer-valid:text-stone-400 pointer-events-none">Detailed Inquiry Description</label>
                              </div>

                              <button 
                                type="submit" 
                                disabled={isContactSubmitting}
                                className="w-full border border-[var(--tarius-champagne)] text-[var(--tarius-champagne)] py-4 mt-6 font-sans text-xs tracking-[0.15em] uppercase hover:bg-[var(--tarius-champagne)] hover:text-[var(--tarius-graphite)] transition-all duration-300 cursor-pointer shadow-lg disabled:opacity-50"
                              >
                                {isContactSubmitting ? 'Transmitting Dossier...' : 'Submit Application'}
                              </button>

                            </div>
                          )}
                        </form>
                      )}
                    </div>

                  </div>
                </div>
              </section>
            );
          }

          // --- NEW BLOCK: QUOTE ---
          if (block.type === 'quote') {
            return (
              <section key={block.id} className="py-32 px-4 bg-[var(--tarius-ivory)] relative">
                <div className="max-w-4xl mx-auto flex flex-col items-center text-center">
                  <span className="text-[var(--tarius-champagne)] text-6xl font-display mb-6">"</span>
                  <p className="font-display text-4xl md:text-5xl text-[var(--tarius-graphite)] leading-tight text-center italic whitespace-pre-line">
                    {block.content.quote}
                  </p>
                  <p className="text-xs tracking-[0.2em] uppercase text-stone-500 mt-8 text-center w-full">
                    {block.content.author}
                  </p>
                </div>
              </section>
            );
          }

          // --- NEW BLOCK: MISSION ---
          if (block.type === 'mission') {
            return (
              <section key={block.id} className="py-24 px-4 bg-white relative">
                <div className="max-w-3xl mx-auto flex flex-col items-center text-center">
                  <span className="text-eyebrow text-[var(--tarius-olive)] mb-6 text-center block">
                    {block.content.eyebrow}
                  </span>
                  <h2 className="text-display text-4xl text-[var(--tarius-graphite)] text-center mb-8">
                    {block.content.title}
                  </h2>
                  <p className="text-base font-light leading-relaxed text-stone-600 text-center whitespace-pre-line">
                    {block.content.description}
                  </p>
                </div>
              </section>
            );
          }

          // --- NEW BLOCK: IMAGE COLLAGE ---
          if (block.type === 'image_collage') {
            return (
              <section key={block.id} className="w-full py-12 px-4 sm:px-8 bg-[var(--tarius-ivory)]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="aspect-square relative border border-[var(--tarius-border)] bg-[var(--tarius-ivory-deep)] overflow-hidden">
                    {block.content.image1 && <img src={block.content.image1} alt="Collage 1" className="w-full h-full object-cover" />}
                  </div>
                  <div className="aspect-square relative border border-[var(--tarius-border)] bg-[var(--tarius-ivory-deep)] overflow-hidden">
                    {block.content.image2 && <img src={block.content.image2} alt="Collage 2" className="w-full h-full object-cover" />}
                  </div>
                  <div className="aspect-square relative border border-[var(--tarius-border)] bg-[var(--tarius-ivory-deep)] overflow-hidden">
                    {block.content.image3 && <img src={block.content.image3} alt="Collage 3" className="w-full h-full object-cover" />}
                  </div>
                </div>
              </section>
            );
          }

          // --- BLOCK: RICH TEXT ---
          if (block.type === 'rich_text') {
            return (
              <section key={block.id} className="py-24 px-4 bg-white border-b border-[var(--tarius-border)] w-full">
                <div className={"max-w-4xl mx-auto flex flex-col gap-6 " + (block.content.alignment === 'center' ? 'items-center text-center' : 'items-start text-left')}>
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)]">
                    {block.content.eyebrow}
                  </span>
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

          // --- BLOCK: IMAGE BREAK ---
          if (block.type === 'image_break') {
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

          // --- BLOCK: DUAL PANEL ---
          if (block.type === 'dual_panel') {
            return (
              <section key={block.id} className="w-full py-24 px-4 sm:px-8 bg-white border-b border-[var(--tarius-border)]">
                <div className={"max-w-7xl mx-auto flex flex-col gap-12 lg:gap-24 items-center " + (block.content.imagePosition === 'right' ? "lg:flex-row-reverse" : "lg:flex-row")}>
                  <div className="w-full lg:w-1/2 flex justify-center">
                    <div className="w-full h-[500px] relative border border-[var(--tarius-border)] shadow-xl bg-[var(--tarius-ivory-deep)] overflow-hidden">
                      {block.content.imageUrl && (
                        <img src={block.content.imageUrl} alt={block.content.title} className="w-full h-full object-cover mix-blend-multiply opacity-90" />
                      )}
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 flex flex-col gap-6 text-left px-4">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)]">
                      {block.content.eyebrow}
                    </span>
                    <h2 className="font-display text-4xl lg:text-5xl text-[var(--tarius-graphite)] leading-tight">
                      {block.content.title}
                    </h2>
                    <p className="text-base font-light leading-relaxed text-stone-600 mb-2 whitespace-pre-line">
                      {block.content.description}
                    </p>
                    {block.content.buttonText && (
                      <Link href={block.content.buttonLink || '#'} className="btn-tarius w-max hover:bg-[var(--tarius-olive)] hover:border-[var(--tarius-olive)] hover:text-white">
                        {block.content.buttonText}
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          // --- BLOCK: SPACER ---
          if (block.type === 'spacer') {
            return (
              <section key={block.id} className="w-full bg-[var(--tarius-ivory)] flex items-center justify-center">
                <div className={"w-full " + block.content.height}></div>
              </section>
            );
          }

          return null;
        })}
      </main>


    </>
  );
}