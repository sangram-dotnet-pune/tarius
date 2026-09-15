// Filename: src/app/admin/certifications-builder/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/api';
import { createBrowserClient } from '@supabase/ssr';
import { generatePDFThumbnail } from '@/lib/pdfHelper';

// --- TYPES ---
type BlockType = 'hero' | 'spotlight' | 'grid' | 'ledger' | 'text' | 'single_pdf' | 'image_banner' | 'overlay_banner' | 'dual_media' | 'divider';

interface Block {
  id: string;
  type: BlockType;
  content: any;
}

interface PageTemplate {
  id: string;
  name: string;
  is_live: boolean;
}

export default function AdminFullscreenCertifications() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingMediaId, setProcessingMediaId] = useState<string | null>(null);

  // --- DEFAULT TEMPLATES ---
  const defaultHero = {
    eyebrow: 'Absolute Transparency',
    title: 'Certifications & Labs.',
    description: 'We believe uncompromising quality requires irrefutable proof. Explore our official regulatory filings below.',
    titleSize: 'text-6xl'
  };

  const defaultText = {
    title: 'Brand Philosophy',
    description: 'Enter a powerful brand statement, paragraph, or laboratory insight here...',
    alignment: 'center'
  };

  const defaultSpotlight = {
    label: 'Official Filing',
    title: 'New Spotlight Document',
    description: 'Enter detailed laboratory or regulatory notes here...',
    pdfUrl: '',
    thumbnailUrl: '',
    mediaPosition: 'left'
  };

  const defaultDualMedia = {
    items: [
      { title: 'Document One', description: 'Description for the first document...', pdfUrl: '', thumbnailUrl: '' },
      { title: 'Document Two', description: 'Description for the second document...', pdfUrl: '', thumbnailUrl: '' }
    ]
  };

  const defaultSinglePdf = {
    title: 'Featured Document',
    description: 'Description of this important document.',
    pdfUrl: '',
    thumbnailUrl: ''
  };

  const defaultGrid = {
    sectionTitle: 'Laboratory Analysis',
    sectionSubtitle: 'Product-Specific Documentation',
    cards: [
      { title: 'Document 1', description: 'Notes...', pdfUrl: '', thumbnailUrl: '' },
      { title: 'Document 2', description: 'Notes...', pdfUrl: '', thumbnailUrl: '' },
      { title: 'Document 3', description: 'Notes...', pdfUrl: '', thumbnailUrl: '' }
    ]
  };

  const defaultLedger = {
    sectionTitle: 'Supplementary Ledger',
    sectionSubtitle: 'Historical & Supporting Filings',
    items: [
      { title: 'Regulatory Filing 1', description: 'Reference ID...', pdfUrl: '', thumbnailUrl: '' }
    ]
  };

  const defaultImageBanner = {
    imageUrl: '',
    height: 'h-[400px]'
  };

  const defaultOverlayBanner = {
    title: 'Uncompromising Quality',
    description: 'A deeply integrated supply chain from the botanical source to the final formulation.',
    imageUrl: '',
    height: 'h-[500px]'
  };

  const defaultDivider = {
    style: 'line'
  };

  useEffect(() => {
    initializeBuilder();
  }, []);

  const initializeBuilder = async () => {
    setLoading(true);
    
    // 1. Fetch the list of available templates
    const { data: templateList, error: listError } = await supabase
      .from('CertificationsTemplates')
      .select('id, name, is_live')
      .order('created_at', { ascending: false });

    if (templateList && templateList.length > 0) {
      setTemplates(templateList);
      
      // 2. Find the live template (or default to the first one) to load initially
      const liveTemplate = templateList.find(t => t.is_live) || templateList[0];
      await loadTemplateBlocks(liveTemplate.id);
    }
    
    setLoading(false);
  };

  const loadTemplateBlocks = async (templateId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('CertificationsTemplates')
      .select('blocks')
      .eq('id', templateId)
      .single();

    if (data && data.blocks) {
      setBlocks(data.blocks);
      setActiveTemplateId(templateId);
    }
    setLoading(false);
  };

  // --- VERSION CONTROL ENGINES ---

  const handleSaveDraft = async () => {
    if (!activeTemplateId) return;
    setIsSaving(true);
    
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const { error } = await supabaseAuth
      .from('CertificationsTemplates')
      .update({ 
        blocks: blocks,
        updated_at: new Date().toISOString()
      })
      .eq('id', activeTemplateId);

    if (error) {
      alert("Failed to save draft.");
    } else {
      alert("Draft saved successfully! (Not visible to public)");
    }
    setIsSaving(false);
  };

  const handleSaveAsNew = async () => {
    const newTemplateName = window.prompt("Enter a name for this new template (e.g., '2026 Audit Layout'):");
    if (!newTemplateName) return;
    
    setIsSaving(true);
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const { data, error } = await supabaseAuth
      .from('CertificationsTemplates')
      .insert([
        {
          name: newTemplateName,
          blocks: blocks,
          is_live: false
        }
      ])
      .select()
      .single();

    if (error || !data) {
      alert("Failed to create new template.");
    } else {
      // Refresh the template list and switch to the newly created one
      const { data: updatedList } = await supabase.from('CertificationsTemplates').select('id, name, is_live').order('created_at', { ascending: false });
      if (updatedList) setTemplates(updatedList);
      setActiveTemplateId(data.id);
      alert("New template created and loaded into the canvas.");
    }
    setIsSaving(false);
  };

  const handlePublishLive = async () => {
    if (!activeTemplateId) return;
    
    const confirmPublish = window.confirm("Are you sure you want to push this layout to the live certifications page?");
    if (!confirmPublish) return;

    setIsSaving(true);
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    // 1. Remove the is_live flag from all templates
    await supabaseAuth.from('CertificationsTemplates').update({ is_live: false }).neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Update blocks and set is_live = true for the active template
    const { error } = await supabaseAuth
      .from('CertificationsTemplates')
      .update({ 
        blocks: blocks,
        is_live: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', activeTemplateId);

    if (error) {
      alert("Failed to publish layout.");
    } else {
      // Refresh template list to update the (LIVE) badge visually
      const { data: updatedList } = await supabase.from('CertificationsTemplates').select('id, name, is_live').order('created_at', { ascending: false });
      if (updatedList) setTemplates(updatedList);
      alert("Page updated successfully! This template is now live.");
    }
    setIsSaving(false);
  };


  // --- BLOCK MANAGEMENT ---
  const addBlock = (type: string) => {
    let content = {};
    if (type === 'hero') content = { ...defaultHero };
    if (type === 'text') content = { ...defaultText };
    if (type === 'spotlight') content = { ...defaultSpotlight };
    if (type === 'dual_media') content = { ...defaultDualMedia };
    if (type === 'single_pdf') content = { ...defaultSinglePdf };
    if (type === 'grid') content = { ...defaultGrid };
    if (type === 'ledger') content = { ...defaultLedger };
    if (type === 'image_banner') content = { ...defaultImageBanner };
    if (type === 'overlay_banner') content = { ...defaultOverlayBanner };
    if (type === 'divider') content = { ...defaultDivider };

    const newBlock: Block = {
      id: "blk_" + Date.now() + Math.random().toString(36).substring(2, 6),
      type: type as BlockType,
      content: content
    };

    setBlocks(prev => [...prev, newBlock]);
  };

  const removeBlock = (id: string) => {
    if (!window.confirm("Remove this entire section?")) return;
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const newBlocks = [...blocks];
    if (index + direction < 0 || index + direction >= newBlocks.length) return;
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + direction];
    newBlocks[index + direction] = temp;
    setBlocks(newBlocks);
  };

  const updateBlockContent = (blockId: string, field: string, value: any) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return { ...b, content: { ...b.content, [field]: value } };
      }
      return b;
    }));
  };

  const updateBlockArrayItem = (blockId: string, arrayField: string, itemIndex: number, field: string, value: any) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newArray = [...b.content[arrayField]];
        newArray[itemIndex] = { ...newArray[itemIndex], [field]: value };
        return { ...b, content: { ...b.content, [arrayField]: newArray } };
      }
      return b;
    }));
  };

  const addArrayItem = (blockId: string, arrayField: string, type: 'grid' | 'ledger') => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newItem = type === 'grid' 
          ? { title: 'New Document', description: 'Notes...', pdfUrl: '', thumbnailUrl: '' }
          : { title: 'New Ledger Item', description: 'Details...', pdfUrl: '', thumbnailUrl: '' };
        return { ...b, content: { ...b.content, [arrayField]: [...b.content[arrayField], newItem] } };
      }
      return b;
    }));
  };

  const removeArrayItem = (blockId: string, arrayField: string, itemIndex: number) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newArray = [...b.content[arrayField]];
        newArray.splice(itemIndex, 1);
        return { ...b, content: { ...b.content, [arrayField]: newArray } };
      }
      return b;
    }));
  };

  // --- UPLOAD ENGINES ---
  const handlePdfUpload = async (file: File, blockId: string, arrayField?: string, itemIndex?: number) => {
    if (file.type !== 'application/pdf') {
      alert('Strictly PDF files are allowed here.');
      return;
    }

    const uploadId = arrayField ? blockId + "_" + itemIndex : blockId;
    setProcessingMediaId(uploadId);

    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    let finalPdfUrl = '';
    let finalThumbnailUrl = '';

    const pdfName = "doc_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6) + ".pdf";
    const { error: pdfError } = await supabaseAuth.storage.from('documents').upload(pdfName, file);
    if (!pdfError) {
      finalPdfUrl = supabaseAuth.storage.from('documents').getPublicUrl(pdfName).data.publicUrl;
    }

    const generatedImageBlob = await generatePDFThumbnail(file);
    if (generatedImageBlob) {
      const thumbName = "thumb_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6) + ".jpg";
      const { error: thumbError } = await supabaseAuth.storage.from('documents').upload(thumbName, generatedImageBlob);
      if (!thumbError) {
        finalThumbnailUrl = supabaseAuth.storage.from('documents').getPublicUrl(thumbName).data.publicUrl;
      }
    }

    if (arrayField !== undefined && itemIndex !== undefined) {
      updateBlockArrayItem(blockId, arrayField, itemIndex, 'pdfUrl', finalPdfUrl);
      updateBlockArrayItem(blockId, arrayField, itemIndex, 'thumbnailUrl', finalThumbnailUrl);
    } else {
      updateBlockContent(blockId, 'pdfUrl', finalPdfUrl);
      updateBlockContent(blockId, 'thumbnailUrl', finalThumbnailUrl);
    }

    setProcessingMediaId(null);
  };

  const handleImageUpload = async (file: File, blockId: string) => {
    if (!file.type.startsWith('image/')) {
      alert('Strictly Image files are allowed here.');
      return;
    }

    setProcessingMediaId(blockId);

    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const ext = file.name.split('.').pop();
    const imgName = "img_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6) + "." + ext;
    
    const { error } = await supabaseAuth.storage.from('documents').upload(imgName, file);
    if (!error) {
      const finalUrl = supabaseAuth.storage.from('documents').getPublicUrl(imgName).data.publicUrl;
      updateBlockContent(blockId, 'imageUrl', finalUrl);
    } else {
      alert("Image upload failed.");
    }

    setProcessingMediaId(null);
  };

  // --- VISUAL RENDERERS ---
  const renderPdfDropzone = (blockId: string, currentThumb: string, arrayField?: string, itemIndex?: number, isMini = false) => {
    const uploadId = arrayField ? blockId + "_" + itemIndex : blockId;
    const isProcessing = processingMediaId === uploadId;

    return (
      <div className="absolute inset-0 w-full h-full group/dropzone bg-[var(--tarius-ivory-deep)] flex items-center justify-center border border-[var(--tarius-border)] overflow-hidden">
        {currentThumb ? (
          <>
            <img src={currentThumb} className="w-full h-full object-cover mix-blend-multiply opacity-90" alt="PDF Preview" />
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/dropzone:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <span className="bg-white text-[var(--tarius-graphite)] text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-[var(--tarius-olive)] hover:text-white transition-colors">Replace PDF</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) handlePdfUpload(e.target.files[0], blockId, arrayField, itemIndex);
              }} />
            </label>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center hover:bg-black/5 transition-colors">
            {isProcessing ? (
              <div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-[var(--tarius-olive)] animate-spin"></div>
            ) : (
              <>
                <svg className={"text-stone-400 mb-1 " + (isMini ? "w-4 h-4" : "w-8 h-8")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                {!isMini && <span className="text-[10px] uppercase tracking-widest text-stone-500">Drop PDF</span>}
              </>
            )}
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => {
              if (e.target.files?.[0]) handlePdfUpload(e.target.files[0], blockId, arrayField, itemIndex);
            }} />
          </label>
        )}
      </div>
    );
  };

  const renderImageDropzone = (blockId: string, currentImage: string) => {
    const isProcessing = processingMediaId === blockId;

    return (
      <div className="absolute inset-0 w-full h-full group/dropzone bg-[var(--tarius-ivory-deep)] flex items-center justify-center border border-[var(--tarius-border)] overflow-hidden">
        {currentImage ? (
          <>
            <img src={currentImage} className="w-full h-full object-cover opacity-90" alt="Banner Preview" />
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/dropzone:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-20">
              <span className="bg-white text-[var(--tarius-graphite)] text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-[var(--tarius-olive)] hover:text-white transition-colors">Replace Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) handleImageUpload(e.target.files[0], blockId);
              }} />
            </label>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-colors p-4 text-center z-20">
            {isProcessing ? (
              <div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-[var(--tarius-olive)] animate-spin"></div>
            ) : (
              <>
                <svg className="text-stone-400 mb-1 w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="text-[10px] uppercase tracking-widest text-stone-500">Drop Image</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              if (e.target.files?.[0]) handleImageUpload(e.target.files[0], blockId);
            }} />
          </label>
        )}
      </div>
    );
  };

  const renderBlockControls = (block: Block, index: number) => (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white border border-[var(--tarius-border)] shadow-md p-1 opacity-0 group-hover/block:opacity-100 transition-opacity rounded-sm">
      <span className="text-[9px] uppercase tracking-widest text-stone-400 px-2 border-r border-[var(--tarius-border)]">{block.type}</span>
      <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="w-6 h-6 flex items-center justify-center text-stone-500 hover:bg-stone-100 disabled:opacity-30">↑</button>
      <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="w-6 h-6 flex items-center justify-center text-stone-500 hover:bg-stone-100 disabled:opacity-30">↓</button>
      <button onClick={() => removeBlock(block.id)} className="w-6 h-6 flex items-center justify-center text-red-500 hover:bg-red-50 ml-1">✕</button>
    </div>
  );

  const inputBaseStyle = "bg-transparent border-b border-transparent outline-none focus:border-current hover:border-current/30 transition-colors cursor-text ";
  const textareaStyle = inputBaseStyle + "w-full resize-none overflow-hidden ";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--tarius-ivory)]">
        <div className="flex items-center gap-3 text-stone-500 text-xs uppercase tracking-widest">
          <div className="w-4 h-4 rounded-full border border-stone-300 border-t-stone-600 animate-spin"></div>
          Loading Framework...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--tarius-ivory)] min-h-screen font-body flex flex-col w-full absolute top-0 left-0 right-0 z-50">
      
      {/* 
        ========================================
        NEW MINIMALIST VERSION CONTROL TOOLBAR 
        ========================================
      */}
      <div className="sticky top-0 z-[100] bg-white border-b border-[var(--tarius-border)] shadow-sm px-4 sm:px-8 py-3 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 w-full">
        
        {/* Left: Branding & Current Template Select */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full xl:w-auto">
          <div>
            <h1 className="font-display text-xl text-[var(--tarius-graphite)] leading-none mb-1">Certifications Engine</h1>
            <p className="text-[9px] uppercase tracking-widest text-stone-400">Version Control</p>
          </div>
          
          <div className="hidden sm:block w-px h-8 bg-[var(--tarius-border)]"></div>
          
          {/* Template Switcher */}
          <div className="flex items-center border border-[var(--tarius-border)] bg-stone-50 rounded-sm overflow-hidden flex-1 sm:flex-none">
            <select 
              value={activeTemplateId} 
              onChange={(e) => loadTemplateBlocks(e.target.value)}
              className="bg-transparent px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--tarius-graphite)] outline-none cursor-pointer border-r border-[var(--tarius-border)] max-w-[200px] truncate"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.is_live ? " (LIVE)" : ""}
                </option>
              ))}
            </select>
            <button 
              onClick={handleSaveAsNew} 
              className="px-3 py-2 text-[10px] uppercase tracking-widest text-stone-500 hover:bg-stone-200 transition-colors" 
              title="Clone as New Template"
            >
              + Clone
            </button>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto">
          
          <select 
            className="w-full sm:w-auto bg-white border border-[var(--tarius-border)] px-4 py-2 text-[10px] uppercase tracking-widest text-[var(--tarius-graphite)] focus:outline-none focus:border-[var(--tarius-olive)] cursor-pointer rounded-sm"
            onChange={(e) => {
              if (e.target.value) {
                addBlock(e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="">+ Insert Template Block...</option>
            <optgroup label="Typography">
              <option value="hero">Hero Header</option>
              <option value="text">Rich Text Statement</option>
            </optgroup>
            <optgroup label="PDF Displays">
              <option value="spotlight">Spotlight (Split Layout)</option>
              <option value="dual_media">Dual Media (Side-by-Side PDFs)</option>
              <option value="grid">Dossier Grid (3-Column Cards)</option>
              <option value="single_pdf">Featured PDF (Large Card)</option>
              <option value="ledger">Ledger List (Rows)</option>
            </optgroup>
            <optgroup label="Aesthetic & Structure">
              <option value="overlay_banner">Text Overlay Banner</option>
              <option value="image_banner">Standard Image Banner</option>
              <option value="divider">Spacing Divider</option>
            </optgroup>
          </select>

          {/* Save Draft */}
          <button 
            onClick={handleSaveDraft} 
            disabled={isSaving || processingMediaId !== null} 
            className="w-full sm:w-auto px-6 py-2 bg-transparent text-[var(--tarius-graphite)] border border-[var(--tarius-border)] text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors disabled:opacity-50 rounded-sm"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          {/* Publish to Live */}
          <button 
            onClick={handlePublishLive} 
            disabled={isSaving || processingMediaId !== null} 
            className="w-full sm:w-auto px-6 py-2 bg-[var(--tarius-olive)] text-white text-[10px] uppercase tracking-widest hover:bg-[var(--tarius-graphite)] transition-colors disabled:opacity-50 rounded-sm"
          >
            Publish to Live
          </button>
          
          <button 
            onClick={() => window.close()} 
            className="w-full sm:w-auto px-4 py-2 bg-transparent text-stone-400 hover:text-red-500 transition-colors rounded-sm ml-0 sm:ml-2"
            title="Close Editor"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      {/* The Visual Canvas */}
      <div className="w-full flex flex-col items-center pb-40">
        {blocks.map((block, index) => (
          <div key={block.id} className="w-full relative group/block border-y border-transparent hover:border-[var(--tarius-olive)] transition-colors">
            {renderBlockControls(block, index)}

            {/* BLOCK: HERO */}
            {block.type === 'hero' && (
              <section className="pt-32 pb-20 flex flex-col items-center justify-center text-center px-4 bg-white border-b border-[var(--tarius-border)] w-full relative z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--tarius-champagne)]/10 rounded-full blur-[100px] pointer-events-none z-0"></div>
                <div className="max-w-2xl mx-auto w-full flex flex-col items-center relative z-10">
                  <input 
                    type="text" 
                    value={block.content.eyebrow} 
                    onChange={(e) => updateBlockContent(block.id, 'eyebrow', e.target.value)}
                    className={textareaStyle + "text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)] mb-6 text-center"}
                  />
                  
                  <div className="relative w-full mb-6 group/select">
                    <input 
                      type="text" 
                      value={block.content.title} 
                      onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                      className={textareaStyle + "font-display text-[var(--tarius-graphite)] text-center " + block.content.titleSize}
                    />
                    <select 
                      value={block.content.titleSize} 
                      onChange={(e) => updateBlockContent(block.id, 'titleSize', e.target.value)}
                      className="absolute -right-24 top-1/2 -translate-y-1/2 text-[10px] border border-stone-200 bg-white p-1 opacity-0 group-hover/select:opacity-100 transition-opacity"
                    >
                      <option value="text-5xl">5XL</option>
                      <option value="text-6xl">6XL</option>
                      <option value="text-7xl">7XL</option>
                      <option value="text-8xl">8XL</option>
                    </select>
                  </div>

                  <textarea 
                    value={block.content.description} 
                    onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                    rows={3}
                    className={textareaStyle + "text-stone-500 font-light leading-relaxed text-center"}
                  />
                </div>
              </section>
            )}

            {/* BLOCK: TEXT */}
            {block.type === 'text' && (
              <section className="py-24 px-4 bg-white border-b border-[var(--tarius-border)] w-full relative">
                <select 
                  value={block.content.alignment} 
                  onChange={(e) => updateBlockContent(block.id, 'alignment', e.target.value)}
                  className="absolute top-4 left-4 text-[10px] border border-stone-200 bg-white p-1 opacity-0 group-hover/block:opacity-100 z-10 transition-opacity"
                >
                  <option value="left">Align Left</option>
                  <option value="center">Align Center</option>
                </select>
                <div className={"max-w-4xl mx-auto flex flex-col gap-6 " + (block.content.alignment === 'center' ? 'items-center text-center' : 'items-start text-left')}>
                  <input 
                    type="text" 
                    value={block.content.title} 
                    onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                    className={textareaStyle + "font-display text-4xl text-[var(--tarius-graphite)] " + (block.content.alignment === 'center' ? 'text-center' : 'text-left')}
                  />
                  <textarea 
                    value={block.content.description} 
                    onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                    rows={4}
                    className={textareaStyle + "text-stone-500 font-light leading-relaxed " + (block.content.alignment === 'center' ? 'text-center' : 'text-left')}
                  />
                </div>
              </section>
            )}

            {/* BLOCK: OVERLAY BANNER */}
            {block.type === 'overlay_banner' && (
              <section className="w-full border-y border-[var(--tarius-border)] relative">
                <div className="absolute top-4 left-4 z-50 flex items-center gap-2 opacity-0 group-hover/block:opacity-100 transition-opacity">
                  <select 
                    value={block.content.height} 
                    onChange={(e) => updateBlockContent(block.id, 'height', e.target.value)}
                    className="text-[10px] border border-[var(--tarius-border)] bg-white p-1.5"
                  >
                    <option value="h-[400px]">Height: 400px</option>
                    <option value="h-[500px]">Height: 500px</option>
                    <option value="h-[700px]">Height: 700px</option>
                  </select>
                </div>
                
                <div className={"w-full relative flex items-center justify-center " + block.content.height}>
                  {renderImageDropzone(block.id, block.content.imageUrl)}
                  
                  <div className="absolute inset-0 bg-black/40 pointer-events-none z-10"></div>
                  
                  <div className="relative z-20 w-full max-w-4xl mx-auto flex flex-col items-center text-center p-8 pointer-events-auto">
                    <input 
                      type="text" 
                      value={block.content.title} 
                      onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                      className={textareaStyle + "font-display text-4xl lg:text-6xl text-white text-center mb-4"}
                    />
                    <textarea 
                      value={block.content.description} 
                      onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                      rows={3}
                      className={textareaStyle + "text-white/80 font-light leading-relaxed text-center"}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* BLOCK: SPOTLIGHT */}
            {block.type === 'spotlight' && (
              <section className={"w-full py-24 px-4 sm:px-8 border-b border-[var(--tarius-border)] " + (index % 2 === 0 ? "bg-[var(--tarius-ivory)]" : "bg-white")}>
                
                <div className="absolute top-4 left-4 z-50 flex items-center bg-white border border-[var(--tarius-border)] p-1 opacity-0 group-hover/block:opacity-100 transition-opacity rounded-sm">
                  <button onClick={() => updateBlockContent(block.id, 'mediaPosition', 'left')} className={"px-3 py-1 text-[9px] uppercase tracking-widest transition-colors " + (block.content.mediaPosition !== 'right' ? 'bg-[var(--tarius-olive)] text-white' : 'text-stone-500 hover:bg-stone-100')}>PDF Left</button>
                  <button onClick={() => updateBlockContent(block.id, 'mediaPosition', 'right')} className={"px-3 py-1 text-[9px] uppercase tracking-widest transition-colors " + (block.content.mediaPosition === 'right' ? 'bg-[var(--tarius-olive)] text-white' : 'text-stone-500 hover:bg-stone-100')}>PDF Right</button>
                </div>

                <div className={"max-w-6xl mx-auto flex flex-col gap-12 items-center " + (block.content.mediaPosition === 'right' ? "md:flex-row-reverse" : "md:flex-row")}>
                  <div className="w-full md:w-1/2 flex justify-center">
                    <div className="relative w-full max-w-md bg-white p-4 border border-[var(--tarius-border)] shadow-2xl">
                      <div className="w-full h-[500px] relative">
                        {renderPdfDropzone(block.id, block.content.thumbnailUrl)}
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2 flex flex-col gap-4 text-left px-4">
                    <input 
                      type="text" 
                      value={block.content.label} 
                      onChange={(e) => updateBlockContent(block.id, 'label', e.target.value)}
                      className={textareaStyle + "text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)]"}
                    />
                    <input 
                      type="text" 
                      value={block.content.title} 
                      onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                      className={textareaStyle + "font-display text-4xl lg:text-5xl text-[var(--tarius-graphite)] leading-tight"}
                    />
                    <textarea 
                      value={block.content.description} 
                      onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                      rows={4}
                      className={textareaStyle + "text-sm font-light leading-relaxed text-stone-600 mt-2"}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* BLOCK: DUAL MEDIA (Side-By-Side) */}
            {block.type === 'dual_media' && (
              <section className="w-full py-24 px-4 sm:px-8 bg-white border-b border-[var(--tarius-border)]">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-12">
                  {block.content.items && block.content.items.map((item: any, i: number) => (
                    <div key={i} className="w-full md:w-1/2 flex flex-col gap-6">
                      <div className="w-full h-[500px] relative border border-[var(--tarius-border)] bg-[var(--tarius-ivory-deep)] shadow-lg">
                        {renderPdfDropzone(block.id, item.thumbnailUrl, 'items', i)}
                      </div>
                      <div className="flex flex-col gap-2 text-center md:text-left px-2">
                        <input 
                          type="text" 
                          value={item.title} 
                          onChange={(e) => updateBlockArrayItem(block.id, 'items', i, 'title', e.target.value)}
                          className={textareaStyle + "font-display text-2xl text-[var(--tarius-graphite)]"}
                        />
                        <textarea 
                          value={item.description} 
                          onChange={(e) => updateBlockArrayItem(block.id, 'items', i, 'description', e.target.value)}
                          rows={3}
                          className={textareaStyle + "text-sm font-light leading-relaxed text-stone-500"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* BLOCK: SINGLE PDF */}
            {block.type === 'single_pdf' && (
              <section className="py-24 px-4 bg-white border-b border-[var(--tarius-border)] w-full">
                <div className="max-w-3xl mx-auto flex flex-col items-center gap-8">
                  <div className="w-full h-[500px] relative border border-[var(--tarius-border)] shadow-xl">
                    {renderPdfDropzone(block.id, block.content.thumbnailUrl)}
                  </div>
                  <div className="w-full flex flex-col items-center text-center gap-4">
                    <input 
                      type="text" 
                      value={block.content.title} 
                      onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                      className={textareaStyle + "font-display text-3xl text-[var(--tarius-graphite)] leading-tight text-center"}
                    />
                    <textarea 
                      value={block.content.description} 
                      onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                      rows={3}
                      className={textareaStyle + "text-sm font-light leading-relaxed text-stone-500 text-center"}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* BLOCK: GRID */}
            {block.type === 'grid' && (
              <section className="max-w-7xl mx-auto px-4 sm:px-8 py-24">
                <div className="text-center mb-12 flex flex-col items-center">
                  <input 
                    type="text" 
                    value={block.content.sectionTitle} 
                    onChange={(e) => updateBlockContent(block.id, 'sectionTitle', e.target.value)}
                    className={textareaStyle + "font-display text-3xl text-[var(--tarius-graphite)] mb-2 text-center"}
                  />
                  <input 
                    type="text" 
                    value={block.content.sectionSubtitle} 
                    onChange={(e) => updateBlockContent(block.id, 'sectionSubtitle', e.target.value)}
                    className={textareaStyle + "text-[10px] uppercase tracking-[0.2em] text-stone-500 text-center"}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {block.content.cards.map((card: any, cardIndex: number) => (
                    <div key={cardIndex} className="bg-white border border-[var(--tarius-border)] shadow-sm flex flex-col relative group/card">
                      <button onClick={() => removeArrayItem(block.id, 'cards', cardIndex)} className="absolute top-2 right-2 z-30 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover/card:opacity-100 text-xs flex items-center justify-center">✕</button>
                      <div className="h-[250px] relative border-b border-[var(--tarius-border)]">
                        {renderPdfDropzone(block.id, card.thumbnailUrl, 'cards', cardIndex)}
                      </div>
                      <div className="p-6 flex flex-col flex-1">
                        <input 
                          type="text" 
                          value={card.title} 
                          onChange={(e) => updateBlockArrayItem(block.id, 'cards', cardIndex, 'title', e.target.value)}
                          className={textareaStyle + "font-display text-xl text-[var(--tarius-graphite)] mb-2"}
                        />
                        <textarea 
                          value={card.description} 
                          onChange={(e) => updateBlockArrayItem(block.id, 'cards', cardIndex, 'description', e.target.value)}
                          rows={3}
                          className={textareaStyle + "text-xs font-light text-stone-500"}
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addArrayItem(block.id, 'cards', 'grid')} className="h-full min-h-[300px] border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 hover:border-[var(--tarius-olive)] hover:text-[var(--tarius-olive)] transition-colors bg-white/50">
                    + Add Card
                  </button>
                </div>
              </section>
            )}

            {/* BLOCK: LEDGER */}
            {block.type === 'ledger' && (
              <section className="max-w-4xl mx-auto px-4 sm:px-8 py-24 border-t border-[var(--tarius-border)]">
                <div className="text-center mb-8 flex flex-col items-center">
                  <input 
                    type="text" 
                    value={block.content.sectionTitle} 
                    onChange={(e) => updateBlockContent(block.id, 'sectionTitle', e.target.value)}
                    className={textareaStyle + "font-display text-2xl text-[var(--tarius-graphite)] mb-2 text-center"}
                  />
                  <input 
                    type="text" 
                    value={block.content.sectionSubtitle} 
                    onChange={(e) => updateBlockContent(block.id, 'sectionSubtitle', e.target.value)}
                    className={textareaStyle + "text-[10px] uppercase tracking-[0.2em] text-stone-500 text-center"}
                  />
                </div>

                <div className="flex flex-col border-t border-[var(--tarius-border)]">
                  {block.content.items.map((item: any, itemIndex: number) => (
                    <div key={itemIndex} className="w-full bg-white border-b border-[var(--tarius-border)] p-4 flex items-center gap-6 relative group/item">
                      <button onClick={() => removeArrayItem(block.id, 'items', itemIndex)} className="absolute -left-10 top-1/2 -translate-y-1/2 text-red-500 opacity-0 group-hover/item:opacity-100">✕</button>
                      <div className="w-16 h-16 shrink-0 relative">
                         {renderPdfDropzone(block.id, item.thumbnailUrl, 'items', itemIndex, true)}
                      </div>
                      <div className="flex-1 flex flex-col gap-1">
                        <input 
                          type="text" 
                          value={item.title} 
                          onChange={(e) => updateBlockArrayItem(block.id, 'items', itemIndex, 'title', e.target.value)}
                          className={textareaStyle + "text-sm font-medium text-[var(--tarius-graphite)]"}
                        />
                        <input 
                          type="text" 
                          value={item.description} 
                          onChange={(e) => updateBlockArrayItem(block.id, 'items', itemIndex, 'description', e.target.value)}
                          className={textareaStyle + "text-xs text-stone-500"}
                        />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addArrayItem(block.id, 'items', 'ledger')} className="w-full p-4 border-b border-[var(--tarius-border)] text-[10px] uppercase tracking-widest text-[var(--tarius-olive)] hover:bg-stone-50 transition-colors text-center">
                    + Add Ledger Row
                  </button>
                </div>
              </section>
            )}

            {/* BLOCK: IMAGE BANNER */}
            {block.type === 'image_banner' && (
              <section className="w-full border-y border-[var(--tarius-border)] relative group/banner">
                <select 
                  value={block.content.height} 
                  onChange={(e) => updateBlockContent(block.id, 'height', e.target.value)}
                  className="absolute top-4 left-4 text-[10px] border border-stone-200 bg-white p-1 opacity-0 group-hover/banner:opacity-100 z-30"
                >
                  <option value="h-[300px]">Height: Small (300px)</option>
                  <option value="h-[400px]">Height: Medium (400px)</option>
                  <option value="h-[600px]">Height: Large (600px)</option>
                  <option value="min-h-screen">Height: Full Screen</option>
                </select>
                <div className={"w-full relative " + block.content.height}>
                  {renderImageDropzone(block.id, block.content.imageUrl)}
                </div>
              </section>
            )}

            {/* BLOCK: DIVIDER */}
            {block.type === 'divider' && (
              <section className="w-full py-16 flex items-center justify-center relative group/divider bg-[var(--tarius-ivory)]">
                <select 
                  value={block.content.style} 
                  onChange={(e) => updateBlockContent(block.id, 'style', e.target.value)}
                  className="absolute top-2 left-4 text-[10px] border border-stone-200 bg-white p-1 opacity-0 group-hover/divider:opacity-100 z-10"
                >
                  <option value="line">Solid Line</option>
                  <option value="whitespace">Empty Whitespace</option>
                </select>
                {block.content.style === 'line' ? (
                  <div className="w-full max-w-4xl border-t border-[var(--tarius-border)]"></div>
                ) : (
                  <div className="h-8"></div>
                )}
              </section>
            )}

          </div>
        ))}

        {blocks.length === 0 && (
          <div className="mt-32 p-16 text-center border-2 border-dashed border-stone-300 rounded-sm">
            <p className="text-stone-500 font-light">The canvas is completely empty.</p>
            <p className="text-[10px] uppercase tracking-widest text-[var(--tarius-olive)] mt-2">Use the top toolbar to insert a block.</p>
          </div>
        )}
      </div>
    </div>
  );
}