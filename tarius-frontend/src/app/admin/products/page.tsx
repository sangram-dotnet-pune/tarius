// Filename: src/app/admin/products/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/api';
import { createBrowserClient } from '@supabase/ssr';

interface PurchaseLink {
  storeName: string;
  url: string;
}

interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  price: string | null;
  description: string;
  notes: string | null;
  image: string | null;
  accentColor: string | null;
  isPublished: boolean;
  category: string | null;
  inventory: number | null;
  weight: string | null;
  purchaseLinks: PurchaseLink[];
  actionButtonType?: 'buy_now' | 'request_allocation' | 'coming_soon';
  createdAt: string;
  updatedAt?: string;
  updatedBy?: string;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('newest');

  useEffect(() => {
    fetchProducts();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user && user.email) {
      setAdminEmail(user.email);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('Product')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleEditClick = (product: Product) => {
    setIsAdding(false);
    setEditingId(product.id);
    setImageFile(null);
    
    const productData = { ...product };
    if (!productData.purchaseLinks) {
      productData.purchaseLinks = [];
    }
    if (!productData.actionButtonType) {
      productData.actionButtonType = productData.purchaseLinks.length > 0 ? 'buy_now' : 'request_allocation';
    }
    
    setFormData(productData);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setIsAdding(true);
    setImageFile(null);
    
    setFormData({
      id: "prod_" + Math.random().toString(36).substr(2, 9),
      name: '',
      subtitle: '',
      price: '',
      description: '',
      notes: '',
      image: '',
      accentColor: '#c8b99a',
      isPublished: false,
      category: '',
      inventory: 0,
      weight: '',
      purchaseLinks: [],
      actionButtonType: 'request_allocation',
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
    setImageFile(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? null : Number(value)) : value,
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

  const handleAddLink = () => {
    setFormData((prev) => ({
      ...prev,
      purchaseLinks: [...(prev.purchaseLinks || []), { storeName: '', url: '' }]
    }));
  };

  const handleLinkChange = (index: number, field: keyof PurchaseLink, value: string) => {
    setFormData((prev) => {
      const updatedLinks = [...(prev.purchaseLinks || [])];
      updatedLinks[index] = { ...updatedLinks[index], [field]: value };
      return { ...prev, purchaseLinks: updatedLinks };
    });
  };

  const handleRemoveLink = (index: number) => {
    setFormData((prev) => {
      const updatedLinks = [...(prev.purchaseLinks || [])];
      updatedLinks.splice(index, 1);
      return { ...prev, purchaseLinks: updatedLinks };
    });
  };

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please drop a valid image file.');
      return;
    }
    
    setImageFile(file);
    setFormData((prev) => ({
      ...prev,
      image: URL.createObjectURL(file),
    }));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);

    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );
    
    const { data: { user } } = await supabaseAuth.auth.getUser();
    const currentEmail = user?.email || 'System Admin';

    let finalImageUrl = formData.image;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = "prod_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9) + "." + fileExt;
      
      const { error: uploadError } = await supabaseAuth.storage
        .from('products')
        .upload(fileName, imageFile);
        
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        alert('Failed to upload image securely.');
        setIsSaving(false);
        return;
      }
      
      const { data: publicUrlData } = supabaseAuth.storage
        .from('products')
        .getPublicUrl(fileName);
        
      finalImageUrl = publicUrlData.publicUrl;
    }

    const payload = {
      ...formData,
      image: finalImageUrl,
      slug: formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-') : '',
      updatedAt: new Date().toISOString(),
      updatedBy: currentEmail
    };

    if (isAdding) {
      const { error } = await supabaseAuth.from('Product').insert([payload]);
      if (error) {
        console.error('Error creating product:', error);
        alert('Failed to create product.');
      }
    } else if (editingId) {
      const { error } = await supabaseAuth.from('Product').update(payload).eq('id', editingId);
      if (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product.');
      }
    }

    setIsSaving(false);
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
    setImageFile(null); 
    await fetchProducts();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this formulation? This cannot be undone.')) {
      return;
    }
    
    setIsDeleting(true);
    const { error } = await supabase.from('Product').delete().eq('id', id);
    setIsDeleting(false);

    if (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product.');
    } else {
      setEditingId(null);
      await fetchProducts();
    }
  };

  const processedProducts = products
    .filter((product) => {
      if (filterStatus === 'published') return product.isPublished;
      if (filterStatus === 'draft') return !product.isPublished;
      return true;
    })
    .sort((a, b) => {
      if (sortOption === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortOption === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name);
      if (sortOption === 'name-desc') return b.name.localeCompare(a.name);
      return 0;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--tarius-border)] border-t-[var(--tarius-olive)] animate-spin"></div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--tarius-graphite)]">Loading Inventory...</p>
        </div>
      </div>
    );
  }

  const renderForm = () => (
    <form onSubmit={handleSave} className="p-8 md:p-10 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-10 border-b border-[var(--tarius-border)] pb-6">
        <div>
          <h3 className="font-display text-3xl text-[var(--tarius-olive)]">
            {isAdding ? 'Create New Formulation' : 'Edit Formulation'}
          </h3>
          {!isAdding && formData.id && (
            <p className="text-[10px] text-stone-500 uppercase tracking-widest mt-2">ID: {formData.id}</p>
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
            <div className="w-11 h-6 bg-stone-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--tarius-olive)] border border-[var(--tarius-border)]"></div>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-8 mb-10">
        <div className="space-y-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--tarius-olive)] border-b border-[var(--tarius-border)] pb-2">General Specifications</p>
          
          <div className="relative group">
            <input
              type="text"
              name="name"
              required
              value={formData.name || ''}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent"
              placeholder="Formulation Name"
            />
            <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
              Formulation Name
            </label>
          </div>

          <div className="relative group">
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle || ''}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent"
              placeholder="Subtitle"
            />
            <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
              Subtitle
            </label>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="relative group">
              <input
                type="text"
                name="category"
                value={formData.category || ''}
                onChange={handleInputChange}
                className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent"
                placeholder="Category"
              />
              <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
                Category
              </label>
            </div>
            
            <div className="relative group">
              <div className="flex items-center gap-3 bg-white border border-[var(--tarius-border)] rounded-sm p-1.5 shadow-sm">
                <input
                  type="color"
                  name="accentColor"
                  value={formData.accentColor || '#c8b99a'}
                  onChange={handleInputChange}
                  className="w-8 h-8 rounded-sm cursor-pointer border-0 p-0 shrink-0 bg-transparent"
                  title="Choose Accent Color"
                />
                <input
                  type="text"
                  name="accentColor"
                  value={formData.accentColor || '#c8b99a'}
                  onChange={handleInputChange}
                  className="flex-1 bg-transparent border-none text-[var(--tarius-graphite)] text-xs focus:outline-none uppercase tracking-wider"
                  placeholder="HEX Color"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--tarius-olive)] border-b border-[var(--tarius-border)] pb-2">Media</p>
            
            <div
              className={"relative border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center text-center gap-4 " + (isDragging ? "border-[var(--tarius-olive)] bg-[var(--tarius-olive)]/5" : "border-[var(--tarius-border)] hover:border-[var(--tarius-olive)]/50")}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileUpload(file);
              }}
            >
              {formData.image ? (
                <div className="relative w-full h-40 overflow-hidden bg-black/5 flex items-center justify-center border border-[var(--tarius-border)]">
                  <img src={formData.image} alt="Preview" className="max-h-full object-contain" />
                  <button type="button" onClick={() => {
                    setFormData(prev => ({...prev, image: ''}));
                    setImageFile(null);
                  }} className="absolute top-2 right-2 bg-white text-red-500 text-[10px] uppercase tracking-widest px-3 py-1 shadow-md border border-[var(--tarius-border)]">Remove</button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-white border border-[var(--tarius-border)] flex items-center justify-center text-[var(--tarius-olive)] shadow-sm">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--tarius-graphite)] font-medium">Drag & Drop product image</p>
                    <p className="text-xs text-stone-500 mt-1">or click to browse local files</p>
                  </div>
                  <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }} />
                </div>
              )}
            </div>

            <div className="relative group">
              <input
                type="url"
                name="image"
                value={formData.image || ''}
                onChange={(e) => {
                  handleInputChange(e);
                  setImageFile(null);
                }}
                className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent"
                placeholder="Or Paste Image Link"
              />
              <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
                Or Paste Image Link
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-8 flex flex-col h-full">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--tarius-olive)] border-b border-[var(--tarius-border)] pb-2">Logistics & E-Commerce</p>
          
          <div className="relative group">
            <input
              type="text"
              name="price"
              value={formData.price || ''}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent"
              placeholder="Price Display String"
            />
            <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-4 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-4 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
              Price Display String
            </label>
          </div>

          <div className="relative group pt-2">
            <label className="block text-[10px] uppercase tracking-widest text-stone-500 mb-2">Primary Action Button</label>
            <select
              name="actionButtonType"
              value={formData.actionButtonType || 'request_allocation'}
              onChange={handleInputChange}
              className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors cursor-pointer"
            >
              <option value="buy_now">1. Buy Now (Dropdown with Partner Links)</option>
              <option value="request_allocation">2. Request Allocation (Redirects to Form)</option>
              <option value="coming_soon">3. Coming Soon (Disabled Button)</option>
            </select>
          </div>

          <div className={"space-y-4 transition-opacity duration-300 " + (formData.actionButtonType !== 'buy_now' ? 'opacity-30 pointer-events-none' : 'opacity-100')}>
            <div className="flex items-center justify-between border-b border-[var(--tarius-border)] pb-2">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--tarius-graphite)]">E-Commerce Partners</p>
              <button
                type="button"
                onClick={handleAddLink}
                className="text-[10px] uppercase tracking-widest text-[var(--tarius-olive)] hover:underline"
              >
                + Add Partner Link
              </button>
            </div>

            {(!formData.purchaseLinks || formData.purchaseLinks.length === 0) && (
              <div className="bg-stone-50 border border-stone-200 border-dashed p-4 text-center">
                <p className="text-xs text-stone-500">No partner links added.</p>
              </div>
            )}

            {formData.purchaseLinks && formData.purchaseLinks.map((link, index) => (
              <div key={index} className="flex items-center gap-3 bg-white p-3 border border-[var(--tarius-border)] rounded-sm shadow-sm animate-in fade-in slide-in-from-top-2">
                <input
                  type="text"
                  placeholder="Platform (e.g. Amazon)"
                  value={link.storeName}
                  onChange={(e) => handleLinkChange(index, 'storeName', e.target.value)}
                  className="w-1/3 bg-transparent border-b border-stone-200 py-2 text-[var(--tarius-graphite)] text-xs focus:outline-none focus:border-[var(--tarius-olive)]"
                  required
                />
                <input
                  type="url"
                  placeholder="https://..."
                  value={link.url}
                  onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                  className="w-full bg-transparent border-b border-stone-200 py-2 text-[var(--tarius-graphite)] text-xs focus:outline-none focus:border-[var(--tarius-olive)]"
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors shrink-0"
                  title="Remove Link"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {!isAdding && formData.updatedAt && (
            <div className="mt-auto border-t border-[var(--tarius-border)] pt-4">
               <p className="text-[9px] uppercase tracking-widest text-stone-400">
                 Last updated on {new Date(formData.updatedAt).toLocaleDateString()} by <span className="font-medium text-[var(--tarius-olive)]">{formData.updatedBy}</span>
               </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8 mb-10">
        <div className="relative group">
          <textarea
            name="description"
            rows={4}
            required
            value={formData.description || ''}
            onChange={handleInputChange}
            className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent resize-none leading-relaxed"
            placeholder="Detailed Description"
          />
          <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-6 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-6 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
            Detailed Description
          </label>
        </div>
        
        <div className="relative group">
          <textarea
            name="notes"
            rows={2}
            value={formData.notes || ''}
            onChange={handleInputChange}
            className="w-full bg-transparent border-b border-[var(--tarius-border)] py-3 text-[var(--tarius-graphite)] text-sm focus:outline-none focus:border-[var(--tarius-olive)] transition-colors peer placeholder-transparent resize-none leading-relaxed"
            placeholder="Internal / Additional Notes"
          />
          <label className="absolute left-0 top-3 text-stone-500 text-[10px] uppercase tracking-widest transition-all peer-focus:-top-6 peer-focus:text-[10px] peer-focus:text-[var(--tarius-olive)] peer-valid:-top-6 peer-valid:text-[10px] peer-valid:text-stone-500 pointer-events-none">
            Internal / Additional Notes
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
            {isSaving ? 'Committing...' : (isAdding ? 'Publish Formulation' : 'Save Details')}
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
            {isDeleting ? 'Removing...' : 'Delete Formulation'}
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
            Inventory Management
          </p>
          <h1 className="font-display text-4xl md:text-5xl text-[var(--tarius-graphite)]">
            Product Matrix
          </h1>
        </div>

        {!isAdding && (
          <button
            type="button"
            onClick={handleAddClick}
            className="px-6 py-3 border border-[var(--tarius-olive)] bg-[var(--tarius-olive)] text-[10px] uppercase tracking-widest text-white hover:bg-transparent hover:text-[var(--tarius-olive)] transition-all rounded-sm shadow-sm"
          >
            + Add New Formulation
          </button>
        )}
      </div>

      {!isAdding && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8 pb-6 border-b border-[var(--tarius-border)]">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-stone-500">Filter By Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border border-[var(--tarius-border)] px-4 py-2 text-xs text-[var(--tarius-graphite)] focus:outline-none focus:border-[var(--tarius-olive)] rounded-sm appearance-none min-w-[150px]"
            >
              <option value="all">All Formulations</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-[10px] uppercase tracking-widest text-stone-500">Sort Matrix</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="bg-transparent border border-[var(--tarius-border)] px-4 py-2 text-xs text-[var(--tarius-graphite)] focus:outline-none focus:border-[var(--tarius-olive)] rounded-sm appearance-none min-w-[150px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
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

        {!isAdding && processedProducts.length === 0 ? (
          <div className="border border-[var(--tarius-border)] bg-white p-12 text-center rounded-sm">
            <p className="text-sm text-stone-500">
              No formulations match the current criteria.
            </p>
          </div>
        ) : (
          processedProducts.map((product) => (
            <div
              key={product.id}
              className={"border transition-all duration-700 overflow-hidden relative rounded-sm " + (editingId === product.id ? "border-[var(--tarius-olive)] bg-[var(--tarius-ivory-deep)] shadow-[0_10px_40px_rgba(31,33,28,0.08)]" : "border-[var(--tarius-border)] bg-white hover:border-[var(--tarius-olive)]/40 shadow-sm")}
            >
              {editingId !== product.id && (
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div
                      className="w-14 h-14 shrink-0 rounded-full shadow-md border border-[var(--tarius-border)] overflow-hidden flex items-center justify-center bg-black/5"
                      style={{
                        backgroundColor: product.accentColor || 'var(--tarius-champagne)',
                      }}
                    >
                      {product.image && <img src={product.image} className="w-full h-full object-cover" alt="thumbnail" />}
                    </div>
                    <div>
                      <h3 className="font-display text-2xl text-[var(--tarius-graphite)]">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-xs text-[var(--tarius-graphite-soft)] font-light tracking-wide">
                          {product.subtitle}
                        </p>
                        {product.price && (
                          <>
                            <span className="text-[var(--tarius-border)]">•</span>
                            <p className="text-[10px] font-medium text-[var(--tarius-olive)]">{product.price}</p>
                          </>
                        )}
                        <span className="text-[var(--tarius-border)]">•</span>
                        <p className="text-[10px] text-stone-500 capitalize">{product.actionButtonType ? product.actionButtonType.replace('_', ' ') : 'request allocation'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 self-start md:self-auto">
                    <div className="flex items-center gap-3 bg-[var(--tarius-ivory)] px-4 py-2 rounded-full border border-[var(--tarius-border)]">
                      <span
                        className={"w-2 h-2 rounded-full shadow-sm " + (product.isPublished ? "bg-emerald-500 shadow-emerald-500/40" : "bg-stone-300")}
                      />
                      <span className="text-[10px] uppercase tracking-widest text-[var(--tarius-graphite)] font-medium">
                        {product.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleEditClick(product)}
                      className="px-5 py-2 border border-[var(--tarius-olive)] text-[var(--tarius-olive)] text-[10px] uppercase tracking-widest rounded-sm hover:bg-[var(--tarius-olive)] hover:text-white transition-colors"
                    >
                      Edit Product
                    </button>
                  </div>
                </div>
              )}

              {editingId === product.id && renderForm()}
            </div>
          ))
        )}
      </div>
    </div>
  );
}