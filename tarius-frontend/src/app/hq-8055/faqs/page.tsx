// Filename: src/app/hq-8055/faqs/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/api';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  order: number;
  isPublished: boolean;
  category: string | null;
  createdAt: string;
}

export default function AdminFaqs() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<FaqItem>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('order-asc');

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('FaqItem')
      .select('*')
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs:', error);
    } else {
      setFaqs(data || []);
    }
    setLoading(false);
  };

  const handleEditClick = (faq: FaqItem) => {
    setIsAdding(false);
    setEditingId(faq.id);
    setFormData(faq);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setIsAdding(true);
    setFormData({
      id: "faq_" + Math.random().toString(36).substr(2, 9),
      question: '',
      answer: '',
      order: faqs.length + 1,
      isPublished: true,
      category: '',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  const handleTogglePublish = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      isPublished: e.target.checked,
    }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    if (isAdding) {
      const { error } = await supabase
        .from('FaqItem')
        .insert([formData]);
      
      if (error) {
        console.error('Error creating FAQ:', error);
        alert('Failed to create FAQ.');
      }
    } else if (editingId) {
      const { error } = await supabase
        .from('FaqItem')
        .update(formData)
        .eq('id', editingId);

      if (error) {
        console.error('Error updating FAQ:', error);
        alert('Failed to update FAQ.');
      }
    }

    setIsSaving(false);
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
    await fetchFaqs();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this inquiry? This cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    const { error } = await supabase.from('FaqItem').delete().eq('id', id);
    setIsDeleting(false);

    if (error) {
      console.error('Error deleting FAQ:', error);
      alert('Failed to delete FAQ.');
    } else {
      setEditingId(null);
      await fetchFaqs();
    }
  };

  const processedFaqs = faqs
    .filter((faq) => {
      if (filterStatus === 'published') return faq.isPublished;
      if (filterStatus === 'draft') return !faq.isPublished;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'order-asc') return a.order - b.order;
      if (sortOption === 'order-desc') return b.order - a.order;
      if (sortOption === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--tarius-border)] border-t-[var(--tarius-olive)] animate-spin" />
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--tarius-graphite)]">
            Loading Knowledge Base...
          </p>
        </div>
      </div>
    );
  }

  const renderForm = () => (
    <form onSubmit={handleSave} className="p-8 md:p-10 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-10 border-b border-[var(--tarius-border)] pb-6">
        <div>
          <h3 className="font-display text-3xl text-[var(--tarius-olive)]">
            {isAdding ? 'Create New Inquiry' : 'Edit Inquiry'}
          </h3>
          {!isAdding && formData.id && (
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-2">
              ID: {formData.id}
            </p>
          )}
        </div>

        <label className="flex items-center gap-4 cursor-pointer group">
          <span className="text-[10px] uppercase tracking-widest text-stone-500 group-hover:text-[var(--tarius-graphite)] transition-colors">
            Published Status
          </span>
          <div className="relative">
            <input
              type="checkbox"
              checked={formData.isPublished || false}
              onChange={handleTogglePublish}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-stone-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--tarius-olive)] border border-[var(--tarius-border)]" />
          </div>
        </label>
      </div>

      <div className="space-y-8 mb-10">
        <div className="relative group">
          <input
            type="text"
            name="question"
            required
            value={formData.question || ''}
            onChange={handleInputChange}
            className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-lg focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent font-display"
            placeholder="Question"
          />
          <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
            Question
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="relative group">
            <input
              type="text"
              name="category"
              value={formData.category || ''}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent"
              placeholder="Category (Optional)"
            />
            <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
              Category (Optional)
            </label>
          </div>

          <div className="relative group">
            <input
              type="number"
              name="order"
              required
              value={formData.order === undefined ? '' : formData.order}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent"
              placeholder="Display Order"
            />
            <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
              Display Order (Priority)
            </label>
          </div>
        </div>

        <div className="relative group">
          <textarea
            name="answer"
            rows={5}
            required
            value={formData.answer || ''}
            onChange={handleInputChange}
            className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent resize-none leading-relaxed"
            placeholder="Detailed Answer"
          />
          <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-6 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-6 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
            Detailed Answer
          </label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-[var(--tarius-border)]">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-4 bg-white border border-[var(--tarius-olive)] text-[var(--tarius-olive)] text-[10px] uppercase tracking-widest hover:bg-[var(--tarius-olive)] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm rounded-sm"
          >
            {isSaving ? 'Committing...' : (isAdding ? 'Publish Inquiry' : 'Save Inquiry')}
          </button>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="px-8 py-4 text-stone-500 text-[10px] uppercase tracking-widest hover:text-[var(--tarius-graphite)] transition-colors"
          >
            Cancel
          </button>
        </div>

        {!isAdding && formData.id && (
          <button
            type="button"
            onClick={() => handleDelete(formData.id as string)}
            disabled={isDeleting}
            className="w-full sm:w-auto px-6 py-4 text-red-600/70 text-[10px] uppercase tracking-widest hover:text-red-600 transition-colors"
          >
            {isDeleting ? 'Removing...' : 'Delete Inquiry'}
          </button>
        )}
      </div>
    </form>
  );

  return (
    <div className="text-[var(--tarius-graphite)] pb-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)] mb-3">
            Knowledge Base
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-[var(--tarius-graphite)]">
            Curated Inquiries
          </h1>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={handleAddClick}
            className="px-6 py-3 border border-[var(--tarius-olive)] bg-[var(--tarius-olive)] text-[10px] uppercase tracking-widest text-white hover:bg-transparent hover:text-[var(--tarius-olive)] transition-all rounded-sm shadow-sm"
          >
            + Add New Inquiry
          </button>
        )}
      </div>

      {!isAdding && (
        <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-8 pb-6 border-b border-[var(--tarius-border)]">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-stone-500">Filter By Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border border-[var(--tarius-border)] px-4 py-2 text-xs text-[var(--tarius-graphite)] focus:outline-none focus:border-[var(--tarius-olive)] rounded-sm appearance-none min-w-[150px]"
            >
              <option value="all">All Inquiries</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-stone-500">Sort By Priority</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent border border-[var(--tarius-border)] px-4 py-2 text-xs text-[var(--tarius-graphite)] focus:outline-none focus:border-[var(--tarius-olive)] rounded-sm appearance-none min-w-[150px]"
            >
              <option value="order-asc">Display Order (Asc)</option>
              <option value="order-desc">Display Order (Desc)</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {isAdding && (
          <div className="border border-[var(--tarius-olive)] bg-[var(--tarius-ivory-deep)] shadow-[0_10px_40px_rgba(31,33,28,0.08)] rounded-sm mb-8">
            {renderForm()}
          </div>
        )}

        {!isAdding && processedFaqs.length === 0 ? (
          <div className="border border-[var(--tarius-border)] bg-white p-12 text-center rounded-sm">
            <p className="text-sm text-stone-500">
              No inquiries match the current criteria.
            </p>
          </div>
        ) : (
          processedFaqs.map((faq) => (
            <div
              key={faq.id}
              className={"border transition-all duration-700 overflow-hidden relative rounded-sm " + (editingId === faq.id ? "border-[var(--tarius-olive)] bg-[var(--tarius-ivory-deep)] shadow-[0_10px_40px_rgba(31,33,28,0.08)]" : "border-[var(--tarius-border)] bg-white hover:border-[var(--tarius-olive)]/40 shadow-sm")}
            >
              {editingId !== faq.id && (
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6 max-w-3xl">
                    <div className="w-12 h-12 shrink-0 flex items-center justify-center bg-[var(--tarius-ivory)] border border-[var(--tarius-border)] rounded-full">
                      <span className="font-display text-lg text-[var(--tarius-olive)]">
                        {faq.order}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-xl md:text-2xl text-[var(--tarius-graphite)] line-clamp-1">
                        {faq.question}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-[var(--tarius-graphite-soft)] font-light tracking-wide line-clamp-1">
                          {faq.answer}
                        </p>
                        {faq.category && (
                          <>
                            <span className="text-[var(--tarius-border)] hidden sm:inline">•</span>
                            <p className="text-[10px] font-medium text-[var(--tarius-olive)] hidden sm:inline">{faq.category}</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 self-start md:self-auto shrink-0">
                    <div className="flex items-center gap-3 bg-[var(--tarius-ivory)] px-4 py-2 rounded-full border border-[var(--tarius-border)]">
                      <span
                        className={"w-2 h-2 rounded-full shadow-sm " + (faq.isPublished ? "bg-emerald-500 shadow-emerald-500/40" : "bg-stone-300")}
                      />
                      <span className="text-[10px] uppercase tracking-widest text-[var(--tarius-graphite)] font-medium">
                        {faq.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleEditClick(faq)}
                      className="px-5 py-2 border border-[var(--tarius-olive)] text-[var(--tarius-olive)] text-[10px] uppercase tracking-widest rounded-sm hover:bg-[var(--tarius-olive)] hover:text-white transition-colors"
                    >
                      Edit Inquiry
                    </button>
                  </div>
                </div>
              )}

              {editingId === faq.id && renderForm()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}