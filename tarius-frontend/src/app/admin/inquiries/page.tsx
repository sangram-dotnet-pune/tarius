'use client';

import React, { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { supabase } from '@/lib/api';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  preferredContact: string;
  tier: string;
  deliveryInstructions: string | null;
  status: string;
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

const inquiryLabels: Record<string, string> = {
  product: 'Product Inquiry',
  buy: 'Where to Buy',
  bulk: 'Bulk / Wholesale Inquiry',
  retail: 'Retail / Stockist Partnership',
  quality: 'Quality Complaint',
  cert: 'Certification / Documentation',
  gifting: 'Corporate / Custom Gifting',
  collab: 'Collaboration / Influencer',
  press: 'Press & Media Inquiry',
  careers: 'Careers',
  feedback: 'General Feedback',
  other: 'Other'
};

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Inquiry>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>('System Admin');

  // Filters & Sorting
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('newest');

  // Bulk Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  useEffect(() => {
    fetchInquiries();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const supabaseAuth = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user && user.email) {
      setAdminEmail(user.email);
    }
  };

  // Global Escape Key Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingId) handleCloseView();
        if (isSelectionMode) {
          setIsSelectionMode(false);
          setSelectedIds([]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingId, isSelectionMode]);

  const fetchInquiries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Inquiry')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching inquiries:', error);
    } else {
      setInquiries(data || []);
    }
    setLoading(false);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  // --- Single Dossier Actions ---
  const handleViewClick = (inquiry: Inquiry) => {
    setViewingId(inquiry.id);
    setFormData(inquiry);
  };

  const handleCloseView = () => {
    setViewingId(null);
    setFormData({});
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      status: e.target.value,
    }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!viewingId) return;

    setIsSaving(true);
    const original = inquiries.find((i) => i.id === viewingId);
    const previousStatus = formData.status === 'archived' ? original?.status : null;

    const { error } = await supabase
      .from('Inquiry')
      .update({ 
        status: formData.status,
        updatedAt: new Date().toISOString(),
        updatedBy: buildUpdatedBy(previousStatus)
      })
      .eq('id', viewingId);

    setIsSaving(false);

    if (error) {
      console.error('Error updating inquiry status:', error);
      alert('Failed to update status.');
    } else {
      setViewingId(null);
      setFormData({});
      await fetchInquiries();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this dossier? This cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    const { error } = await supabase.from('Inquiry').delete().eq('id', id);
    setIsDeleting(false);

    if (error) {
      alert('Failed to delete inquiry.');
    } else {
      setViewingId(null);
      await fetchInquiries();
    }
  };

  // --- Auto-Draft Email ---
  const handleDraftEmail = () => {
    if (!formData.email) return;
    
    const subject = encodeURIComponent(`Regarding your TARIUS Inquiry: ${inquiryLabels[formData.tier || 'other'] || 'Allocation Request'}`);
    const body = encodeURIComponent(`Hello ${formData.name},\n\nThank you for reaching out to the Tarius Concierge desk.\n\n[Type your response here]\n\nWarm regards,\nThe Tarius Team`);
    
    // Open default mail client
    window.location.href = `mailto:${formData.email}?subject=${subject}&body=${body}`;

    // Quality of life: Prompt to auto-update status
    if (formData.status === 'pending') {
      if (window.confirm("You initiated an email reply. Would you like to automatically update this dossier's status to 'Client Contacted'?")) {
        setFormData(prev => ({ ...prev, status: 'contacted' }));
      }
    }
  };

  // --- Bulk Actions ---
  const toggleSelectAll = () => {
    if (selectedIds.length === processedInquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(processedInquiries.map(i => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (!newStatus || selectedIds.length === 0) return;
    
    setIsBulkUpdating(true);

    if (newStatus === 'archived') {
      // Per-inquiry updates so each archived row records its own previous status.
      for (const id of selectedIds) {
        const original = inquiries.find((i) => i.id === id);
        const { error } = await supabase
          .from('Inquiry')
          .update({
            status: 'archived',
            updatedAt: new Date().toISOString(),
            updatedBy: buildUpdatedBy(original?.status),
          })
          .eq('id', id);
        if (error) {
          setIsBulkUpdating(false);
          alert('Failed to update multiple inquiries.');
          return;
        }
      }
      setSelectedIds([]);
      setIsSelectionMode(false);
      setIsBulkUpdating(false);
      await fetchInquiries();
      return;
    }

    const { error } = await supabase
      .from('Inquiry')
      .update({ 
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: adminEmail 
      })
      .in('id', selectedIds);
      
    setIsBulkUpdating(false);

    if (error) {
      alert('Failed to update multiple inquiries.');
    } else {
      setSelectedIds([]);
      setIsSelectionMode(false);
      await fetchInquiries();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} dossiers?`)) {
      return;
    }

    setIsBulkUpdating(true);
    const { error } = await supabase
      .from('Inquiry')
      .delete()
      .in('id', selectedIds);
      
    setIsBulkUpdating(false);

    if (error) {
      alert('Failed to delete inquiries.');
    } else {
      setSelectedIds([]);
      setIsSelectionMode(false);
      await fetchInquiries();
    }
  };

  // --- UI Helpers ---
  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'contacted':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'allocated':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'archived':
        return 'bg-stone-100 text-stone-600 border-stone-200';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  // Persisted as `<email>|<previousStatus>` inside the existing updatedBy text column
  // so no DB schema change is required.
  const parseUpdatedBy = (updatedBy?: string) => {
    if (!updatedBy) return { email: '', previousStatus: null as string | null };
    const idx = updatedBy.indexOf('|');
    if (idx === -1) return { email: updatedBy, previousStatus: null as string | null };
    return {
      email: updatedBy.slice(0, idx),
      previousStatus: updatedBy.slice(idx + 1).trim() || null,
    };
  };

  const getStatusDisplayLabel = (inquiry: Inquiry) => {
    const { previousStatus } = parseUpdatedBy(inquiry.updatedBy);
    if (inquiry.status === 'archived' && previousStatus && previousStatus !== 'archived') {
      return `${previousStatus} → archived`;
    }
    return inquiry.status;
  };

  const buildUpdatedBy = (previousStatus: string | undefined | null): string => {
    if (previousStatus && previousStatus !== 'archived') {
      return `${adminEmail}|${previousStatus}`;
    }
    return adminEmail;
  };

  const renderDossierNotes = (notes: string | null) => {
    if (!notes) return <span className="text-stone-400 italic">No additional notes provided.</span>;
    const isFeedback = formData.tier === 'feedback';
    const lines = notes.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed !== ''
        && !line.includes('Phone: Not Provided')
        && !/^- .*: (N\/A|TBD)( @ (N\/A|TBD))?$/.test(trimmed)
        && !(isFeedback && (trimmed === '--- Additional Details ---' || trimmed === 'Feedback Context:'));
    });

    return (
      <div className="flex flex-col gap-4">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (trimmed === 'Client Message:' || trimmed.includes('--- Additional Details ---') || trimmed.endsWith('Context:') || trimmed.endsWith('Profile:') || trimmed.endsWith('Details:') || trimmed.endsWith('Requirements:')) {
            return (
              <div key={idx} className="mt-2 mb-1 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-[var(--tarius-olive)] rounded-full"></span>
                 <span className="text-[10px] uppercase tracking-widest text-[var(--tarius-olive)] font-bold">{trimmed.replace(/---/g, '').trim()}</span>
              </div>
            );
          }
          if (trimmed.startsWith('Phone:')) {
            return (
              <div key={idx} className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-sm border border-[var(--tarius-border)] shadow-sm w-fit">
                 <svg className="text-[var(--tarius-olive)]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                 <span className="text-xs font-medium text-[var(--tarius-graphite)]">{trimmed.replace('Phone:', '').trim()}</span>
              </div>
            );
          }
          if (trimmed.startsWith('- ')) {
            const parts = trimmed.substring(2).split(':');
            const key = parts[0];
            const val = parts.slice(1).join(':').trim();
            return (
              <div key={idx} className="ml-2 pl-4 border-l border-[var(--tarius-border)] text-sm py-1">
                <span className="font-medium text-[var(--tarius-graphite)]">{key}:</span>
                <span className="text-[var(--tarius-graphite-soft)] font-light ml-2">{val}</span>
              </div>
            );
          }
          return (
            <p key={idx} className="text-sm text-[var(--tarius-graphite)] font-light leading-relaxed bg-[var(--tarius-ivory)] p-4 border border-[var(--tarius-border)] rounded-sm italic shadow-inner">
              "{trimmed}"
            </p>
          );
        })}
      </div>
    );
  };

  const processedInquiries = inquiries
    .filter((inquiry) => {
      if (filterStatus !== 'all' && inquiry.status !== filterStatus) return false;
      if (filterTier !== 'all' && inquiry.tier !== filterTier) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOption === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
      return 0;
    });

  const uniqueTiers = Array.from(new Set(inquiries.map(i => i.tier))).filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--tarius-border)] border-t-[var(--tarius-olive)] animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--tarius-graphite)]">
            Retrieving Dossiers...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-[var(--tarius-graphite)] pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)] mb-3">
            Concierge Management
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-[var(--tarius-graphite)]">
            Client Dossiers
          </h1>
        </div>
      </div>

      {!viewingId && (
        <div className="mb-8 border-b border-[var(--tarius-border)] pb-6">
          
          {/* Row 1: Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-500">Filter By Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border border-[var(--tarius-border)] px-4 py-2 text-xs text-[var(--tarius-graphite)] focus:outline-none focus:border-[var(--tarius-olive)] rounded-sm appearance-none min-w-[150px]"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="contacted">Client Contacted</option>
                <option value="allocated">Allocation Secured</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-500">Filter By Nature</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="bg-transparent border border-[var(--tarius-border)] px-4 py-2 text-xs text-[var(--tarius-graphite)] focus:outline-none focus:border-[var(--tarius-olive)] rounded-sm appearance-none min-w-[150px]"
              >
                <option value="all">All Inquiries</option>
                {uniqueTiers.map(tier => (
                  <option key={tier} value={tier}>{inquiryLabels[tier] || tier}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase tracking-widest text-stone-500">Sort Dossiers</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-transparent border border-[var(--tarius-border)] px-4 py-2 text-xs text-[var(--tarius-graphite)] focus:outline-none focus:border-[var(--tarius-olive)] rounded-sm appearance-none min-w-[150px]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Bulk Actions */}
          <div className="mt-6 pt-6 border-t border-[var(--tarius-border)] min-h-[44px] flex items-center">
            {!isSelectionMode ? (
              <button
                onClick={() => setIsSelectionMode(true)}
                className="px-5 py-2 bg-white border border-[var(--tarius-border)] text-stone-600 text-[10px] uppercase tracking-widest hover:border-[var(--tarius-olive)] hover:text-[var(--tarius-olive)] transition-colors shadow-sm rounded-sm"
              >
                Select Multiple
              </button>
            ) : (
              <div className="flex items-center gap-4 animate-in fade-in zoom-in-95 duration-200 w-full">
                
                <label className="flex items-center gap-2 cursor-pointer bg-white border border-[var(--tarius-border)] px-3 py-2 rounded-sm shadow-sm">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === processedInquiries.length && processedInquiries.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-[var(--tarius-olive)] border-stone-300 rounded focus:ring-[var(--tarius-olive)] accent-[var(--tarius-olive)]"
                  />
                  <span className="text-[10px] uppercase font-bold text-[var(--tarius-olive)] whitespace-nowrap">
                    All ({selectedIds.length})
                  </span>
                </label>
                
                <select
                  onChange={(e) => handleBulkStatusChange(e.target.value)}
                  value=""
                  disabled={selectedIds.length === 0 || isBulkUpdating}
                  className="bg-white border border-[var(--tarius-border)] px-4 py-2 text-[10px] uppercase tracking-widest text-stone-600 focus:outline-none focus:border-[var(--tarius-olive)] rounded-sm disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  <option value="" disabled>Move Selected To...</option>
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="allocated">Allocated</option>
                  <option value="archived">Archived</option>
                </select>
                
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedIds.length === 0 || isBulkUpdating}
                  className="px-4 py-2 bg-white border border-red-200 text-red-600 text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors rounded-sm shadow-sm disabled:opacity-50"
                >
                  Delete Selected
                </button>
                
                <button
                  onClick={() => setIsSelectionMode(false)}
                  className="px-4 py-2 text-stone-500 text-[10px] uppercase tracking-widest hover:text-[var(--tarius-graphite)] transition-colors ml-auto"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      <div className="grid gap-4">
        {!viewingId && processedInquiries.length === 0 ? (
          <div className="border border-[var(--tarius-border)] bg-white p-12 text-center rounded-sm">
            <p className="text-sm text-stone-500">
              No dossiers match the current criteria.
            </p>
          </div>
        ) : (
          processedInquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className={`border transition-all duration-300 relative rounded-sm ${viewingId === inquiry.id ? "border-[var(--tarius-olive)] bg-[var(--tarius-ivory-deep)] shadow-[0_10px_40px_rgba(31,33,28,0.08)]" : (selectedIds.includes(inquiry.id) ? "border-[var(--tarius-olive)]/40 bg-[var(--tarius-olive)]/5 shadow-sm" : "border-[var(--tarius-border)] bg-white hover:border-[var(--tarius-olive)]/40 shadow-sm")}`}
            >
              {viewingId !== inquiry.id && (
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  
                  <div className="flex items-center gap-5 flex-1 min-w-0">
                    {/* Checkbox (Only visible in selection mode) */}
                    {isSelectionMode && (
                      <div className="animate-in fade-in slide-in-from-left-2 duration-300 shrink-0">
                        <input 
                          type="checkbox"
                          checked={selectedIds.includes(inquiry.id)}
                          onChange={() => toggleSelect(inquiry.id)}
                          className="w-4 h-4 cursor-pointer text-[var(--tarius-olive)] border-stone-300 rounded focus:ring-[var(--tarius-olive)] accent-[var(--tarius-olive)]"
                        />
                      </div>
                    )}

                    <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-[var(--tarius-ivory)] border border-[var(--tarius-border)] rounded-full">
                      <span className="font-display text-base text-[var(--tarius-olive)] uppercase">
                        {inquiry.name.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 cursor-pointer" onClick={() => { if(isSelectionMode) toggleSelect(inquiry.id); }}>
                      <h3 className="font-display text-xl text-[var(--tarius-graphite)] truncate">
                        {inquiry.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <p className="text-xs text-[var(--tarius-graphite-soft)] font-medium tracking-wide">
                          {inquiryLabels[inquiry.tier] || inquiry.tier}
                        </p>
                        <span className="text-[var(--tarius-border)]">•</span>
                        <p className="text-[10px] font-medium text-[var(--tarius-olive)]">
                          {new Date(inquiry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 shrink-0 pl-9 md:pl-0">
                    <div className={`px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-medium ${getStatusStyle(inquiry.status)}`}>
                      {getStatusDisplayLabel(inquiry)}
                    </div>

                    {!isSelectionMode && (
                      <button
                        onClick={() => handleViewClick(inquiry)}
                        className="px-4 py-1.5 border border-[var(--tarius-olive)] text-[var(--tarius-olive)] text-[10px] uppercase tracking-widest rounded-sm hover:bg-[var(--tarius-olive)] hover:text-white transition-colors"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Opened Dossier View */}
              {viewingId === inquiry.id && (
                <form
                  onSubmit={handleSave}
                  className="p-8 md:p-10 animate-in fade-in slide-in-from-top-4 duration-500"
                >
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-10 border-b border-[var(--tarius-border)] pb-6">
                    <div>
                      <h3 className="font-display text-3xl text-[var(--tarius-olive)]">
                        Client Dossier
                      </h3>
                      <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-2">
                        Received: {new Date(formData.createdAt as string).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex flex-col relative group min-w-[200px]">
                      <label className="text-[10px] uppercase tracking-widest text-stone-500 mb-2">
                        Current Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleStatusChange}
                        className="w-full bg-transparent border-b border-[var(--tarius-border)] py-2 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors appearance-none cursor-pointer font-medium"
                      >
                        <option value="pending">Pending Review</option>
                        <option value="contacted">Client Contacted</option>
                        <option value="allocated">Completed / Allocated</option>
                        <option value="archived">Archived</option>
                      </select>
                      {formData.status === 'archived' && (() => {
                        const { previousStatus } = parseUpdatedBy(formData.updatedBy);
                        if (!previousStatus || previousStatus === 'archived') return null;
                        return (
                          <p className="mt-2 text-[9px] uppercase tracking-widest text-stone-500">
                            Previous status: <span className="font-semibold text-[var(--tarius-olive)]">{previousStatus} → archived</span>
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 mb-10">
                    <div className="space-y-6">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--tarius-olive)] border-b border-[var(--tarius-border)] pb-2">Client Details</p>
                      
                      <div>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Full Name</p>
                        <p className="text-sm font-medium">{formData.name}</p>
                      </div>
                      
                      <div>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                          Email Address
                        </p>
                        <div className="flex items-center gap-3">
                          <p 
                            className="text-sm font-medium text-stone-700 w-fit"
                          >
                            {formData.email}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              if (formData.email) {
                                navigator.clipboard.writeText(formData.email);
                                alert("Email copied to clipboard!");
                              }
                            }}
                            className="text-[8px] uppercase tracking-widest bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded text-stone-500 border border-stone-200 transition-colors"
                          >
                            Copy
                          </button>
                          <button
                            type="button"
                            onClick={handleDraftEmail}
                            className="text-[8px] uppercase tracking-widest bg-[var(--tarius-olive)] hover:bg-emerald-700 text-white px-2 py-1 rounded border border-[var(--tarius-olive)] transition-colors flex items-center gap-1"
                          >
                            Draft Reply ↗
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Preferred Contact</p>
                        <p className="text-sm font-medium capitalize">{formData.preferredContact}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-stone-500 uppercase tracking-widest mb-1">Category</p>
                        <p className="text-sm font-medium">{formData.tier ? inquiryLabels[formData.tier] || formData.tier : ''}</p>
                      </div>
                    </div>

                    <div className="space-y-6 flex flex-col h-full">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--tarius-olive)] border-b border-[var(--tarius-border)] pb-2">Provided Information</p>
                      
                      <div className="p-2 text-sm leading-relaxed min-h-[150px] font-sans flex-grow">
                        {renderDossierNotes(formData.deliveryInstructions || null)}
                      </div>

                      {/* Display Audit Trail */}
                      {formData.updatedAt && (() => {
                        const { email: updatedByEmail, previousStatus } = parseUpdatedBy(formData.updatedBy);
                        return (
                          <div className="mt-auto border-t border-[var(--tarius-border)] pt-4 space-y-1.5">
                            <p className="text-[9px] uppercase tracking-widest text-stone-400">
                              Last updated on {new Date(formData.updatedAt).toLocaleDateString()} by <span className="font-medium text-[var(--tarius-olive)]">{updatedByEmail}</span>
                            </p>
                            {previousStatus && previousStatus !== 'archived' && (
                              <p className="text-[9px] uppercase tracking-widest text-stone-500">
                                Status transition: <span className="font-semibold text-[var(--tarius-graphite)]">{previousStatus} → archived</span>
                              </p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-[var(--tarius-border)]">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-8 py-3 bg-white border border-[var(--tarius-olive)] text-[var(--tarius-olive)] text-[10px] uppercase tracking-widest hover:bg-[var(--tarius-olive)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm rounded-sm"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseView}
                        className="px-8 py-3 text-stone-500 text-[10px] uppercase tracking-widest hover:text-[var(--tarius-graphite)] transition-colors"
                      >
                        Close (Esc)
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDelete(formData.id as string)}
                      disabled={isDeleting}
                      className="w-full sm:w-auto px-6 py-3 text-red-600/70 text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete Inquiry'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}