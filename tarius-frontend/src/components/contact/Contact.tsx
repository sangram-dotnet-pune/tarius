// Filename: src/components/contact/Contact.tsx

'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/api';

export default function Contact(props: { id?: string }) {
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [selectedInquiry, setSelectedInquiry] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredContact: 'email',
    message: '',
    
    giftingProducts: { spirulina: false, moringa: false },
    spirulinaQty: '1',
    moringaQty: '1',
    deliveryDate: '',
    deliveryTime: '',
    deliveryLocation: '',

    socialHandle: '',
    collaborationReason: '',
    collabProducts: '',
    eventDate: '',
    eventTime: '',

    position: '',
    expectedSalary: '',
    qualifications: '',
    tentativeJoiningDate: '',

    purchasePlatform: '',
    purchaseDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (productKey: 'spirulina' | 'moringa') => {
    setFormData(prev => ({
      ...prev,
      giftingProducts: {
        ...prev.giftingProducts,
        [productKey]: !prev.giftingProducts[productKey]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const metaData: string[] = [];

    if (selectedInquiry === 'gifting') {
      const lines: string[] = ["Gifting Requirements:"];
      lines.push("- Spirulina: " + (formData.giftingProducts.spirulina ? formData.spirulinaQty : "0"));
      lines.push("- Moringa: " + (formData.giftingProducts.moringa ? formData.moringaQty : "0"));
      if (formData.deliveryDate || formData.deliveryTime) {
        lines.push("- Delivery: " + [formData.deliveryDate, formData.deliveryTime].filter(Boolean).join(" @ "));
      }
      if (formData.deliveryLocation) {
        lines.push("- Location: " + formData.deliveryLocation);
      }
      metaData.push(...lines);
    } else if (selectedInquiry === 'collab' || selectedInquiry === 'press') {
      const lines: string[] = ["Partnership Details:"];
      if (formData.socialHandle) lines.push("- Social/URL: " + formData.socialHandle);
      if (formData.collabProducts) lines.push("- Products Requested: " + formData.collabProducts);
      metaData.push(...lines);
    } else if (selectedInquiry === 'careers') {
      const lines: string[] = ["Candidate Profile:"];
      if (formData.position) lines.push("- Position: " + formData.position);
      if (formData.expectedSalary) lines.push("- Expected Salary: " + formData.expectedSalary);
      metaData.push(...lines);
    } else if (selectedInquiry === 'feedback') {
      const lines: string[] = ["Feedback Context:"];
      if (formData.purchasePlatform) lines.push("- Purchased From: " + formData.purchasePlatform);
      if (formData.purchaseDate) lines.push("- Purchase Date: " + formData.purchaseDate);
      metaData.push(...lines);
    }

    const compiledNotes = [
      formData.phone ? "Phone: " + formData.phone : null,
      "Client Message:",
      formData.message,
      ...(metaData.length > 0 ? ['--- Additional Details ---', ...metaData] : [])
    ].filter(Boolean).join('\n');

    const { error } = await supabase.from('Inquiry').insert([
      {
        name: formData.name,
        email: formData.email,
        preferredContact: formData.preferredContact,
        tier: selectedInquiry,
        deliveryInstructions: compiledNotes,
        status: 'pending'
      }
    ]);

    if (error) {
      console.error('Error submitting inquiry:', error);
      alert('Failed to transmit dossier. Please try again.');
      setIsSubmitting(false);
      return;
    }

    // Trigger the automated emails quietly in the background
    try {
      const emailPayload = {
        ...formData,
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

    setIsSubmitting(false);
    setSubmitted(true);
    
    setTimeout(() => {
      setSubmitted(false);
      setSelectedInquiry('');
      setFormData({
        name: '', email: '', phone: '', preferredContact: 'email', message: '',
        giftingProducts: { spirulina: false, moringa: false },
        spirulinaQty: '1', moringaQty: '1', deliveryDate: '', deliveryTime: '', deliveryLocation: '',
        socialHandle: '', collaborationReason: '', collabProducts: '', eventDate: '', eventTime: '',
        position: '', expectedSalary: '', qualifications: '', tentativeJoiningDate: '',
        purchasePlatform: '', purchaseDate: ''
      });
    }, 5000);
  };

  return (
    <section id={props.id} className="section-tarius bg-[var(--tarius-graphite)] text-[var(--tarius-white)] relative overflow-hidden py-24 sm:py-32">
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[var(--tarius-champagne)]/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container-tarius relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start">
          
          <div className="lg:col-span-5 lg:sticky lg:top-12">
            <span className="text-eyebrow text-[var(--tarius-champagne)] mb-4 block tracking-[0.25em] text-xs">The Concierge</span>
            <h2 className="text-display text-4xl sm:text-5xl text-[var(--tarius-white)] mb-6 font-light leading-tight">
              Request Private <span className="italic text-[var(--tarius-champagne)]">Allocation.</span>
            </h2>
            <p className="text-stone-300 text-sm font-light leading-relaxed mb-10">
              Select your inquiry nature below to load the appropriate dossier fields. Our private advisory desk reviews all applications strictly within 24 hours.
            </p>
            <div className="space-y-4 text-xs tracking-[0.2em] uppercase text-[var(--tarius-champagne)] font-medium border-t border-[var(--tarius-champagne)]/20 pt-8">
              <p className="flex items-center gap-3">
                <span className="w-1 h-1 rounded-full bg-[var(--tarius-champagne)]"></span>
                Direct Concierge: concierge@tarius.com
              </p>
              <p className="flex items-center gap-3">
                <span className="w-1 h-1 rounded-full bg-[var(--tarius-champagne)]"></span>
                Advisory Hotline: +1 (800) 482-7487
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            {submitted ? (
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                
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
                    <option value="cert" className="bg-[var(--tarius-graphite)]">6. Certification / Documentation Request (COA, FSSAI)</option>
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
                          value={formData.name}
                          onChange={handleChange}
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
                          value={formData.email}
                          onChange={handleChange}
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
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-[var(--tarius-white)] font-sans text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors peer placeholder-transparent" 
                        placeholder="Phone Number (Optional)"
                      />
                      <label className="absolute left-0 top-3 text-stone-400 font-sans text-xs uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-champagne)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-400 pointer-events-none">Phone Number (Optional)</label>
                    </div>

                    {selectedInquiry === 'gifting' && (
                      <div className="space-y-6 bg-white/[0.02] p-6 border border-[var(--tarius-champagne)]/20">
                        <p className="text-xs uppercase tracking-widest text-[var(--tarius-champagne)]">Select Products & Quantities</p>
                        
                        <div className="flex items-center justify-between gap-4">
                          <label className="flex items-center gap-3 text-sm font-light text-stone-300 cursor-pointer">
                            <input type="checkbox" checked={formData.giftingProducts.spirulina} onChange={() => handleCheckboxChange('spirulina')} className="accent-[var(--tarius-champagne)]" />
                            Spirulina Reserve
                          </label>
                          {formData.giftingProducts.spirulina && (
                            <input type="number" name="spirulinaQty" min="1" value={formData.spirulinaQty} onChange={handleChange} className="w-20 bg-transparent border-b border-[var(--tarius-champagne)]/30 px-2 py-1 text-sm text-[var(--tarius-white)]" placeholder="Qty" />
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <label className="flex items-center gap-3 text-sm font-light text-stone-300 cursor-pointer">
                            <input type="checkbox" checked={formData.giftingProducts.moringa} onChange={() => handleCheckboxChange('moringa')} className="accent-[var(--tarius-champagne)]" />
                            Wild Botanical Moringa
                          </label>
                          {formData.giftingProducts.moringa && (
                            <input type="number" name="moringaQty" min="1" value={formData.moringaQty} onChange={handleChange} className="w-20 bg-transparent border-b border-[var(--tarius-champagne)]/30 px-2 py-1 text-sm text-[var(--tarius-white)]" placeholder="Qty" />
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Delivery Date</label>
                            <input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleChange} className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Delivery Time</label>
                            <input type="time" name="deliveryTime" value={formData.deliveryTime} onChange={handleChange} className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Location / Venue</label>
                            <input type="text" name="deliveryLocation" value={formData.deliveryLocation} onChange={handleChange} className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" placeholder="City / Address" />
                          </div>
                        </div>
                      </div>
                    )}

                    {(selectedInquiry === 'collab' || selectedInquiry === 'press') && (
                      <div className="space-y-6 bg-white/[0.02] p-6 border border-[var(--tarius-champagne)]/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Social Handle / Page Link</label>
                            <input type="text" name="socialHandle" value={formData.socialHandle} onChange={handleChange} placeholder="@instagram / portfolio URL" className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Products to Showcase</label>
                            <input type="text" name="collabProducts" value={formData.collabProducts} onChange={handleChange} placeholder="Spirulina / Moringa" className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedInquiry === 'careers' && (
                      <div className="space-y-6 bg-white/[0.02] p-6 border border-[var(--tarius-champagne)]/20">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Position Applying For</label>
                            <input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="Role title" className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase tracking-widest text-stone-400 mb-1">Expected Compensation Tier</label>
                            <input type="text" name="expectedSalary" value={formData.expectedSalary} onChange={handleChange} placeholder="e.g. Competitive / Negotiable" className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-2 text-sm text-[var(--tarius-white)]" />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="relative group mt-4">
                      <textarea 
                        name="message" 
                        rows={4} 
                        required 
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full bg-transparent border-b border-[var(--tarius-champagne)]/30 py-3 text-[var(--tarius-white)] font-sans text-sm focus:outline-none focus:border-[var(--tarius-champagne)] transition-colors peer placeholder-transparent resize-none" 
                        placeholder="Detailed Inquiry Description..."
                      ></textarea>
                      <label className="absolute left-0 top-3 text-stone-400 font-sans text-xs uppercase tracking-widest transition-all peer-focus:-top-6 peer-focus:text-[10px] peer-focus:text-[var(--tarius-champagne)] peer-valid:-top-6 peer-valid:text-[10px] peer-valid:text-stone-400 pointer-events-none">Detailed Inquiry Description</label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full border border-[var(--tarius-champagne)] text-[var(--tarius-champagne)] py-4 mt-6 font-sans text-xs tracking-[0.15em] uppercase hover:bg-[var(--tarius-champagne)] hover:text-[var(--tarius-graphite)] transition-all duration-300 cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Transmitting Dossier...' : 'Submit Application'}
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