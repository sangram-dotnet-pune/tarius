// Filename: src/app/admin/builder/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/api';
import { createBrowserClient } from '@supabase/ssr';

// --- TYPES ---
type BlockType = 'hero' | 'story' | 'quality' | 'faq' | 'contact' | 'image_break' | 'rich_text' | 'dual_panel' | 'spacer' | 'quote' | 'mission' | 'image_collage';

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

export default function FullscreenHomeBuilder() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [templates, setTemplates] = useState<PageTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [processingMediaId, setProcessingMediaId] = useState<string | null>(null);

  // --- DEFAULT TEMPLATES ---
  const defaultHero = {
    eyebrow: 'Premium botanical nutrition',
    titleLine1: 'Organic.',
    titleLine2: 'Powerful.',
    titleHighlight: 'Natural.',
    description: 'Premium spirulina and moringa powders, carefully sourced and crafted for those who believe everyday wellness should begin with nature.',
    primaryButtonText: 'Discover TARIUS',
    primaryButtonLink: '/products',
    secondaryButtonText: 'Our Story',
    secondaryButtonLink: '#story',
    imageUrl: ''
  };

  const defaultStory = {
    eyebrow: 'The TARIUS philosophy',
    title: 'Wellness begins with what nature already knows.',
    paragraphs: [
      'TARIUS was created around a simple idea: powerful wellness does not need to be complicated.',
      'We bring together carefully selected botanical ingredients and a refined approach to everyday nutrition, creating products that fit naturally into modern life.',
      'From vibrant spirulina to nutrient-rich moringa, every TARIUS product begins with nature and stays true to it.'
    ],
    buttonText: 'Discover Our Approach',
    buttonLink: '#quality',
    imageUrl: '',
    pillars: [
      { num: '01', title: 'Pure' },
      { num: '02', title: 'Intentional' },
      { num: '03', title: 'Natural' }
    ]
  };

  const defaultQuality = {
    eyebrow: 'Traceable Lineage',
    title: 'Unrivaled',
    titleHighlight: 'Provenance.',
    description: 'Every batch of TARIUS is independently certified, serialized, and tracked from harvest to your personal sanctuary.',
    pillars: [
      { num: '01', title: 'Volcanic Aquifer Sourcing', desc: 'Cultivated in mineral-dense spring waters originating from protected volcanic rock strata.' },
      { num: '02', title: 'Low-Temperature Cryo-Milling', desc: 'Processed below 35 degrees C to preserve heat-sensitive enzymes.' },
      { num: '03', title: 'Biophotonic Violet Glass', desc: 'Packaged in ultraviolet-blocking glass jars that filter harmful visible light.' }
    ],
    buttonText: 'View Certifications',
    buttonLink: '/certifications'
  };

  const defaultFaq = {
    eyebrow: 'Knowledge Base',
    title: 'Curated',
    titleHighlight: 'Inquiries.',
    description: 'Transparency is the foundation of our sanctuary. Explore the exact sourcing, processing, and biochemical profiles of our reserves.'
  };

  const defaultContact = {
    eyebrow: 'The Concierge',
    title: 'Request Private',
    titleHighlight: 'Allocation.',
    description: 'Select your inquiry nature below to load the appropriate dossier fields. Our private advisory desk reviews all applications strictly within 24 hours.',
    emailContext: 'Direct Concierge: concierge@tarius.com',
    phoneContext: 'Advisory Hotline: +1 (800) 482-7487'
  };

  const defaultImageBreak = { imageUrl: '', height: 'h-[600px]' };
  
  const defaultRichText = {
    eyebrow: 'Aesthetic Standard',
    title: 'Brand Philosophy',
    description: 'Enter a powerful brand statement, paragraph, or laboratory insight here...',
    alignment: 'center'
  };

  const defaultDualPanel = {
    imageUrl: '',
    eyebrow: 'Deep Integration',
    title: 'Cultivated by Science',
    description: 'Our extraction process yields the highest concentration of active biochemicals.',
    buttonText: 'Read More',
    buttonLink: '#',
    imagePosition: 'left'
  };

  const defaultSpacer = { height: 'h-32' };

  const defaultQuote = {
    quote: '"The purest form of wellness is found in the untouched reserves of nature."',
    author: '— The TARIUS Team'
  };

  const defaultMission = {
    eyebrow: 'Our Mission',
    title: 'Elevating Everyday Wellness',
    description: 'We believe that the highest tier of human performance is unlocked through uncompromising botanical integrity. Every harvest is a testament to our dedication to purity and potency.'
  };

  const defaultImageCollage = {
    image1: '', image2: '', image3: ''
  };

  useEffect(() => {
    initializeBuilder();
  }, []);

  const initializeBuilder = async () => {
    setLoading(true);
    
    // 1. Fetch the list of available templates
    const { data: templateList, error: listError } = await supabase
      .from('PageTemplates')
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
      .from('PageTemplates')
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
      .from('PageTemplates')
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
    const newTemplateName = window.prompt("Enter a name for this new template (e.g., 'Winter Campaign'):");
    if (!newTemplateName) return;
    
    setIsSaving(true);
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const { data, error } = await supabaseAuth
      .from('PageTemplates')
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
      const { data: updatedList } = await supabase.from('PageTemplates').select('id, name, is_live').order('created_at', { ascending: false });
      if (updatedList) setTemplates(updatedList);
      setActiveTemplateId(data.id);
      alert("New template created and loaded into the canvas.");
    }
    setIsSaving(false);
  };

  const handlePublishLive = async () => {
    if (!activeTemplateId) return;
    
    const confirmPublish = window.confirm("Are you sure you want to push this layout to the live public storefront?");
    if (!confirmPublish) return;

    setIsSaving(true);
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    // 1. Remove the is_live flag from all templates
    await supabaseAuth.from('PageTemplates').update({ is_live: false }).neq('id', '00000000-0000-0000-0000-000000000000');

    // 2. Update blocks and set is_live = true for the active template
    const { error } = await supabaseAuth
      .from('PageTemplates')
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
      const { data: updatedList } = await supabase.from('PageTemplates').select('id, name, is_live').order('created_at', { ascending: false });
      if (updatedList) setTemplates(updatedList);
      alert("Storefront updated successfully! This template is now live.");
    }
    setIsSaving(false);
  };


  // --- BLOCK MANAGEMENT ---
  const addBlock = (type: string) => {
    let content = {};
    if (type === 'hero') content = { ...defaultHero };
    if (type === 'story') content = { ...defaultStory };
    if (type === 'quality') content = { ...defaultQuality };
    if (type === 'faq') content = { ...defaultFaq };
    if (type === 'contact') content = { ...defaultContact };
    if (type === 'image_break') content = { ...defaultImageBreak };
    if (type === 'rich_text') content = { ...defaultRichText };
    if (type === 'dual_panel') content = { ...defaultDualPanel };
    if (type === 'spacer') content = { ...defaultSpacer };
    if (type === 'quote') content = { ...defaultQuote };
    if (type === 'mission') content = { ...defaultMission };
    if (type === 'image_collage') content = { ...defaultImageCollage };

    const newBlock: Block = {
      id: "blk_" + Date.now() + Math.random().toString(36).substring(2, 6),
      type: type as BlockType,
      content: content
    };

    setBlocks(prev => [...prev, newBlock]);
  };

  const removeBlock = (id: string) => {
    if (!window.confirm("Remove this entire section from the canvas?")) return;
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

  const updateObjectArray = (blockId: string, arrayField: string, itemIndex: number, field: string, value: any) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newArray = [...b.content[arrayField]];
        newArray[itemIndex] = { ...newArray[itemIndex], [field]: value };
        return { ...b, content: { ...b.content, [arrayField]: newArray } };
      }
      return b;
    }));
  };

  const updateStringArray = (blockId: string, arrayField: string, itemIndex: number, value: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        const newArray = [...b.content[arrayField]];
        newArray[itemIndex] = value;
        return { ...b, content: { ...b.content, [arrayField]: newArray } };
      }
      return b;
    }));
  };

  const addStringArrayItem = (blockId: string, arrayField: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return { ...b, content: { ...b.content, [arrayField]: [...b.content[arrayField], "New paragraph text..."] } };
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

  // --- IMAGE UPLOAD ENGINE ---
  const handleImageUpload = async (file: File, blockId: string, specificField?: string) => {
    if (!file.type.startsWith('image/')) {
      alert('Strictly Image files are allowed here.');
      return;
    }

    const uploadId = specificField ? blockId + "_" + specificField : blockId;
    setProcessingMediaId(uploadId);

    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const ext = file.name.split('.').pop();
    const imgName = "img_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6) + "." + ext;
    
    const { error } = await supabaseAuth.storage.from('documents').upload(imgName, file);
    if (!error) {
      const finalUrl = supabaseAuth.storage.from('documents').getPublicUrl(imgName).data.publicUrl;
      updateBlockContent(blockId, specificField || 'imageUrl', finalUrl);
    } else {
      alert("Image upload failed.");
    }

    setProcessingMediaId(null);
  };

  const renderImageDropzone = (blockId: string, currentImage: string, specificField?: string, classNameOverrides?: string) => {
    const uploadId = specificField ? blockId + "_" + specificField : blockId;
    const isProcessing = processingMediaId === uploadId;

    return (
      <div className={"absolute inset-0 w-full h-full group/dropzone overflow-hidden " + (currentImage ? "" : "bg-black/5 hover:bg-black/10 transition-colors border border-dashed border-stone-300 ") + (classNameOverrides || "")}>
        {currentImage ? (
          <>
            <img src={currentImage} className="w-full h-full object-cover" alt="Block Visual" />
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/dropzone:opacity-100 flex items-center justify-center cursor-pointer transition-opacity z-20">
              <span className="bg-white text-[var(--tarius-graphite)] text-[10px] uppercase tracking-widest px-4 py-2 hover:bg-[var(--tarius-olive)] hover:text-white transition-colors">Replace Image</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                if (e.target.files?.[0]) handleImageUpload(e.target.files[0], blockId, specificField);
              }} />
            </label>
          </>
        ) : (
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-4 text-center z-20">
            {isProcessing ? (
              <div className="w-6 h-6 rounded-full border-2 border-stone-300 border-t-[var(--tarius-olive)] animate-spin"></div>
            ) : (
              <>
                <svg className="text-stone-400 mb-1 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="text-[9px] uppercase tracking-widest text-stone-500">Drop Image</span>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              if (e.target.files?.[0]) handleImageUpload(e.target.files[0], blockId, specificField);
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
  const inlineInputStyle = inputBaseStyle + "resize-none flex-shrink min-w-[50px] max-w-full ";

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
            <h1 className="font-display text-xl text-[var(--tarius-graphite)] leading-none mb-1">Storefront Engine</h1>
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
            <optgroup label="Core Foundation">
              <option value="hero">Main Hero (Top)</option>
              <option value="story">Brand Story & Philosophy</option>
              <option value="quality">Quality & Provenance</option>
              <option value="faq">Knowledge Base (FAQ)</option>
              <option value="contact">Concierge Contact</option>
            </optgroup>
            <optgroup label="Typography & Quotes">
              <option value="quote">Large Quote Block</option>
              <option value="mission">Mission Statement</option>
              <option value="rich_text">Rich Text Paragraph</option>
            </optgroup>
            <optgroup label="Aesthetic & Structure">
              <option value="image_collage">3-Image Collage</option>
              <option value="image_break">Massive Image Break</option>
              <option value="dual_panel">Dual Media/Text Panel</option>
              <option value="spacer">Whitespace Spacer</option>
            </optgroup>
          </select>

          {/* Save Draft (Saves without going live) */}
          <button 
            onClick={handleSaveDraft} 
            disabled={isSaving || processingMediaId !== null} 
            className="w-full sm:w-auto px-6 py-2 bg-transparent text-[var(--tarius-graphite)] border border-[var(--tarius-border)] text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors disabled:opacity-50 rounded-sm"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          {/* Publish to Live (Pushes current template to public) */}
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

      {/* The True 1:1 Visual Canvas */}
      <div className="w-full flex flex-col items-center pb-40">
        {blocks.map((block, index) => (
          <div key={block.id} className="w-full relative group/block border-y border-transparent hover:border-[var(--tarius-olive)] transition-colors">
            {renderBlockControls(block, index)}

            {/* BLOCK: HERO */}
            {block.type === 'hero' && (
              <section className="relative overflow-hidden bg-[var(--tarius-ivory)] w-full">
                <div className="container-tarius grid min-h-[calc(100svh-76px)] items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20 w-full">
                  <div className="relative z-10 max-w-3xl">
                    <input 
                      type="text" 
                      value={block.content.eyebrow} 
                      onChange={(e) => updateBlockContent(block.id, 'eyebrow', e.target.value)}
                      className={textareaStyle + "text-eyebrow text-[var(--tarius-olive)]"}
                    />
                    
                    <div className="text-display mt-6 text-[clamp(4rem,10vw,9rem)] leading-[0.82] text-[var(--tarius-graphite)] w-full flex flex-col items-start">
                      <input 
                        type="text" 
                        value={block.content.titleLine1} 
                        onChange={(e) => updateBlockContent(block.id, 'titleLine1', e.target.value)}
                        className={textareaStyle + "mb-2"}
                      />
                      <input 
                        type="text" 
                        value={block.content.titleLine2} 
                        onChange={(e) => updateBlockContent(block.id, 'titleLine2', e.target.value)}
                        className={textareaStyle + "mb-2"}
                      />
                      <input 
                        type="text" 
                        value={block.content.titleHighlight} 
                        onChange={(e) => updateBlockContent(block.id, 'titleHighlight', e.target.value)}
                        className={textareaStyle + "text-[var(--tarius-olive)]"}
                      />
                    </div>

                    <textarea 
                      value={block.content.description} 
                      onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                      rows={4}
                      className={textareaStyle + "mt-8 max-w-xl text-sm leading-7 text-[var(--tarius-graphite-soft)] sm:text-base sm:leading-8"}
                    />

                    <div className="mt-9 flex flex-col gap-3 sm:flex-row p-4 border border-dashed border-stone-300 bg-white/50 rounded-sm w-full max-w-md">
                      <div className="w-full">
                        <span className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Primary Button</span>
                        <input type="text" value={block.content.primaryButtonText} onChange={(e) => updateBlockContent(block.id, 'primaryButtonText', e.target.value)} className="w-full text-xs p-1 mb-1 border border-stone-200" placeholder="Label" />
                        <input type="text" value={block.content.primaryButtonLink} onChange={(e) => updateBlockContent(block.id, 'primaryButtonLink', e.target.value)} className="w-full text-xs p-1 border border-stone-200" placeholder="/link" />
                      </div>
                      <div className="w-full">
                        <span className="text-[9px] uppercase tracking-widest text-stone-500 block mb-1">Secondary Button</span>
                        <input type="text" value={block.content.secondaryButtonText} onChange={(e) => updateBlockContent(block.id, 'secondaryButtonText', e.target.value)} className="w-full text-xs p-1 mb-1 border border-stone-200" placeholder="Label" />
                        <input type="text" value={block.content.secondaryButtonLink} onChange={(e) => updateBlockContent(block.id, 'secondaryButtonLink', e.target.value)} className="w-full text-xs p-1 border border-stone-200" placeholder="/link" />
                      </div>
                    </div>
                  </div>

                  <div className="relative w-full">
                    <div className="image-tarius relative aspect-[4/5] min-h-[420px] w-full overflow-hidden bg-[var(--tarius-ivory-deep)] sm:min-h-[520px] lg:min-h-0 border border-[var(--tarius-border)]">
                      {renderImageDropzone(block.id, block.content.imageUrl)}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* BLOCK: STORY */}
            {block.type === 'story' && (
              <section className="section-tarius overflow-hidden bg-[var(--tarius-ivory-deep)] w-full">
                <div className="container-tarius w-full">
                  <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20 w-full">
                    <div className="order-2 lg:order-1 w-full">
                      <div className="image-tarius relative aspect-[4/5] overflow-hidden bg-[var(--tarius-olive)]/15 border border-[var(--tarius-border)]">
                        {renderImageDropzone(block.id, block.content.imageUrl)}
                      </div>
                    </div>

                    <div className="order-1 lg:order-2 w-full">
                      <input 
                        type="text" 
                        value={block.content.eyebrow} 
                        onChange={(e) => updateBlockContent(block.id, 'eyebrow', e.target.value)}
                        className={textareaStyle + "text-eyebrow text-[var(--tarius-olive)]"}
                      />
                      
                      <textarea 
                        value={block.content.title} 
                        onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                        rows={4}
                        className={textareaStyle + "text-display mt-5 max-w-2xl text-5xl leading-[0.95] sm:text-6xl lg:text-7xl"}
                      />

                      <div className="mt-8 max-w-xl space-y-5">
                        {block.content.paragraphs && block.content.paragraphs.map((para: string, pIdx: number) => (
                          <div key={pIdx} className="relative group/para">
                            <button onClick={() => removeArrayItem(block.id, 'paragraphs', pIdx)} className="absolute -left-6 top-2 text-red-500 opacity-0 group-hover/para:opacity-100">✕</button>
                            <textarea 
                              value={para} 
                              onChange={(e) => updateStringArray(block.id, 'paragraphs', pIdx, e.target.value)}
                              rows={3}
                              className={textareaStyle + "text-sm leading-7 text-[var(--tarius-graphite-soft)] sm:text-base sm:leading-8"}
                            />
                          </div>
                        ))}
                        <button onClick={() => addStringArrayItem(block.id, 'paragraphs')} className="text-[10px] uppercase tracking-widest text-[var(--tarius-olive)] hover:underline">+ Add Paragraph</button>
                      </div>

                      <div className="mt-12 grid grid-cols-2 border-t border-[var(--tarius-border)] pt-6 sm:grid-cols-3 w-full gap-4">
                        {block.content.pillars && block.content.pillars.map((pillar: any, pIdx: number) => (
                          <div key={pIdx} className="relative group/pillar pr-2">
                            <button onClick={() => removeArrayItem(block.id, 'pillars', pIdx)} className="absolute top-0 right-0 text-red-500 opacity-0 group-hover/pillar:opacity-100 text-[10px]">✕</button>
                            <input 
                              type="text" 
                              value={pillar.num} 
                              onChange={(e) => updateObjectArray(block.id, 'pillars', pIdx, 'num', e.target.value)}
                              className={textareaStyle + "text-display text-3xl max-w-[80px] block"}
                            />
                            <input 
                              type="text" 
                              value={pillar.title} 
                              onChange={(e) => updateObjectArray(block.id, 'pillars', pIdx, 'title', e.target.value)}
                              className={textareaStyle + "text-eyebrow mt-2 text-[var(--tarius-graphite-soft)] block w-full"}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* BLOCK: QUALITY */}
            {block.type === 'quality' && (
              <section className="section-tarius bg-[var(--tarius-graphite)] text-[var(--tarius-white)] w-full">
                <div className="container-tarius w-full">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 w-full">
                    <div className="w-full md:w-1/2 flex flex-col items-start">
                      <input 
                        type="text" 
                        value={block.content.eyebrow} 
                        onChange={(e) => updateBlockContent(block.id, 'eyebrow', e.target.value)}
                        className={textareaStyle + "text-eyebrow text-[var(--tarius-champagne)] mb-4 block"}
                      />
                      <div className="flex flex-wrap items-baseline gap-x-3 w-full">
                        <input 
                          type="text" 
                          value={block.content.title} 
                          onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                          style={{ width: (Math.max(block.content.title.length, 3)) + "ch", maxWidth: '100%' }}
                          className={inlineInputStyle + "text-display text-4xl sm:text-5xl text-[var(--tarius-white)]"}
                        />
                        <input 
                          type="text" 
                          value={block.content.titleHighlight} 
                          onChange={(e) => updateBlockContent(block.id, 'titleHighlight', e.target.value)}
                          style={{ width: (Math.max(block.content.titleHighlight.length, 3)) + "ch", maxWidth: '100%' }}
                          className={inlineInputStyle + "text-display text-4xl sm:text-5xl text-[var(--tarius-champagne)] italic"}
                        />
                      </div>
                    </div>
                    <textarea 
                      value={block.content.description} 
                      onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                      rows={4}
                      className={textareaStyle + "text-stone-300 text-sm font-light max-w-md mt-6 md:mt-0 text-left md:text-right w-full"}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 w-full">
                    {block.content.pillars && block.content.pillars.map((pillar: any, idx: number) => (
                      <div key={idx} className="border border-[var(--tarius-champagne)]/30 p-8 sm:p-10 relative">
                        <input 
                          type="text" 
                          value={pillar.num} 
                          onChange={(e) => updateObjectArray(block.id, 'pillars', idx, 'num', e.target.value)}
                          className={textareaStyle + "font-display text-3xl text-[var(--tarius-champagne)] block mb-6"}
                        />
                        <input 
                          type="text" 
                          value={pillar.title} 
                          onChange={(e) => updateObjectArray(block.id, 'pillars', idx, 'title', e.target.value)}
                          className={textareaStyle + "font-display text-2xl text-[var(--tarius-white)] mb-4"}
                        />
                        <textarea 
                          value={pillar.desc} 
                          onChange={(e) => updateObjectArray(block.id, 'pillars', idx, 'desc', e.target.value)}
                          rows={5}
                          className={textareaStyle + "text-stone-300 text-xs sm:text-sm font-light leading-relaxed"}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* BLOCK: FAQ */}
            {block.type === 'faq' && (
              <section className="section-tarius bg-[var(--tarius-ivory)] text-[var(--tarius-graphite)] relative py-24 sm:py-32 w-full">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--tarius-champagne)]/10 rounded-full blur-[150px] pointer-events-none"></div>
                <div className="container-tarius relative z-10 w-full">
                  <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-24 pb-12 border-b border-[var(--tarius-border)] flex flex-col items-center">
                    <input 
                      type="text" 
                      value={block.content.eyebrow} 
                      onChange={(e) => updateBlockContent(block.id, 'eyebrow', e.target.value)}
                      className={textareaStyle + "text-eyebrow text-[var(--tarius-olive)] mb-4 text-center"}
                    />
                    <div className="flex flex-wrap justify-center items-baseline gap-x-3 w-full mb-6">
                      <input 
                        type="text" 
                        value={block.content.title} 
                        onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                        style={{ width: (Math.max(block.content.title.length, 3)) + "ch", maxWidth: '100%' }}
                        className={inlineInputStyle + "text-display text-4xl sm:text-6xl text-[var(--tarius-graphite)] text-center sm:text-right"}
                      />
                      <input 
                        type="text" 
                        value={block.content.titleHighlight} 
                        onChange={(e) => updateBlockContent(block.id, 'titleHighlight', e.target.value)}
                        style={{ width: (Math.max(block.content.titleHighlight.length, 3)) + "ch", maxWidth: '100%' }}
                        className={inlineInputStyle + "text-display text-4xl sm:text-6xl text-[var(--tarius-olive)] italic text-center sm:text-left"}
                      />
                    </div>
                    <textarea 
                      value={block.content.description} 
                      onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                      rows={4}
                      className={textareaStyle + "text-sm font-light text-[var(--tarius-graphite-soft)] leading-relaxed text-center"}
                    />
                  </div>
                  <div className="w-full text-center py-12 border-2 border-dashed border-[var(--tarius-olive)]/30 bg-white/50 rounded-lg">
                    <p className="font-display text-xl text-[var(--tarius-olive)] mb-2">Live FAQ Questions</p>
                    <p className="text-xs font-light text-stone-500">The questions render automatically on the public site from the FAQ database.</p>
                  </div>
                </div>
              </section>
            )}

            {/* BLOCK: CONTACT */}
            {block.type === 'contact' && (
              <section className="section-tarius bg-[var(--tarius-graphite)] text-[var(--tarius-white)] relative overflow-hidden py-24 sm:py-32 w-full">
                <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-[var(--tarius-champagne)]/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="container-tarius relative z-10 w-full">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-start w-full">
                    <div className="lg:col-span-5 w-full">
                      <input 
                        type="text" 
                        value={block.content.eyebrow} 
                        onChange={(e) => updateBlockContent(block.id, 'eyebrow', e.target.value)}
                        className={textareaStyle + "text-eyebrow text-[var(--tarius-champagne)] mb-4 tracking-[0.25em] text-xs"}
                      />
                      <div className="flex flex-wrap items-baseline gap-x-3 w-full mb-6">
                        <input 
                          type="text" 
                          value={block.content.title} 
                          onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                          style={{ width: (Math.max(block.content.title.length, 3)) + "ch", maxWidth: '100%' }}
                          className={inlineInputStyle + "text-display text-4xl sm:text-5xl text-[var(--tarius-white)] font-light"}
                        />
                        <input 
                          type="text" 
                          value={block.content.titleHighlight} 
                          onChange={(e) => updateBlockContent(block.id, 'titleHighlight', e.target.value)}
                          style={{ width: (Math.max(block.content.titleHighlight.length, 3)) + "ch", maxWidth: '100%' }}
                          className={inlineInputStyle + "text-display text-4xl sm:text-5xl text-[var(--tarius-champagne)] italic font-light"}
                        />
                      </div>
                      <textarea 
                        value={block.content.description} 
                        onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                        rows={5}
                        className={textareaStyle + "text-stone-300 text-sm font-light leading-relaxed mb-10"}
                      />
                      <div className="space-y-4 text-xs tracking-[0.2em] uppercase text-[var(--tarius-champagne)] font-medium border-t border-[var(--tarius-champagne)]/20 pt-8 w-full">
                        <input 
                          type="text" 
                          value={block.content.emailContext} 
                          onChange={(e) => updateBlockContent(block.id, 'emailContext', e.target.value)}
                          className={textareaStyle}
                        />
                        <input 
                          type="text" 
                          value={block.content.phoneContext} 
                          onChange={(e) => updateBlockContent(block.id, 'phoneContext', e.target.value)}
                          className={textareaStyle}
                        />
                      </div>
                    </div>
                    <div className="lg:col-span-7 w-full">
                      <div className="w-full h-full min-h-[400px] border border-[var(--tarius-champagne)]/20 bg-white/5 flex items-center justify-center p-12 text-center rounded-lg border-dashed">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--tarius-champagne)] opacity-50">Live Form renders here</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* NEW BLOCK: QUOTE */}
            {block.type === 'quote' && (
              <section className="py-32 px-4 bg-[var(--tarius-ivory)] relative w-full">
                <div className="max-w-4xl mx-auto flex flex-col items-center text-center w-full">
                  <span className="text-[var(--tarius-champagne)] text-6xl font-display mb-6">"</span>
                  <textarea 
                    value={block.content.quote} 
                    onChange={(e) => updateBlockContent(block.id, 'quote', e.target.value)}
                    rows={4}
                    className={textareaStyle + "font-display text-4xl md:text-5xl text-[var(--tarius-graphite)] leading-tight text-center italic"}
                  />
                  <input 
                    type="text" 
                    value={block.content.author} 
                    onChange={(e) => updateBlockContent(block.id, 'author', e.target.value)}
                    className={textareaStyle + "text-xs tracking-[0.2em] uppercase text-stone-500 mt-8 text-center"}
                  />
                </div>
              </section>
            )}

            {/* NEW BLOCK: MISSION */}
            {block.type === 'mission' && (
              <section className="py-24 px-4 bg-white relative w-full">
                <div className="max-w-3xl mx-auto flex flex-col items-center text-center w-full">
                  <input 
                    type="text" 
                    value={block.content.eyebrow} 
                    onChange={(e) => updateBlockContent(block.id, 'eyebrow', e.target.value)}
                    className={textareaStyle + "text-eyebrow text-[var(--tarius-olive)] mb-6 text-center"}
                  />
                  <input 
                    type="text" 
                    value={block.content.title} 
                    onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                    className={textareaStyle + "text-display text-4xl text-[var(--tarius-graphite)] text-center mb-8"}
                  />
                  <textarea 
                    value={block.content.description} 
                    onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                    rows={5}
                    className={textareaStyle + "text-base font-light leading-relaxed text-stone-600 text-center"}
                  />
                </div>
              </section>
            )}

            {/* NEW BLOCK: IMAGE COLLAGE (3 IMAGES) */}
            {block.type === 'image_collage' && (
              <section className="w-full py-12 px-4 sm:px-8 bg-[var(--tarius-ivory)]">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  <div className="aspect-square relative border border-[var(--tarius-border)] bg-[var(--tarius-ivory-deep)] overflow-hidden w-full">
                    {renderImageDropzone(block.id, block.content.image1, 'image1')}
                  </div>
                  <div className="aspect-square relative border border-[var(--tarius-border)] bg-[var(--tarius-ivory-deep)] overflow-hidden w-full">
                    {renderImageDropzone(block.id, block.content.image2, 'image2')}
                  </div>
                  <div className="aspect-square relative border border-[var(--tarius-border)] bg-[var(--tarius-ivory-deep)] overflow-hidden w-full">
                    {renderImageDropzone(block.id, block.content.image3, 'image3')}
                  </div>
                </div>
              </section>
            )}

            {/* BLOCK: RICH TEXT */}
            {block.type === 'rich_text' && (
              <section className="py-24 px-4 bg-white border-b border-[var(--tarius-border)] w-full">
                <div className={"max-w-4xl mx-auto flex flex-col gap-6 " + (block.content.alignment === 'center' ? 'items-center text-center' : 'items-start text-left')}>
                  <input 
                    type="text" 
                    value={block.content.eyebrow} 
                    onChange={(e) => updateBlockContent(block.id, 'eyebrow', e.target.value)}
                    className={textareaStyle + "text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)] " + (block.content.alignment === 'center' ? 'text-center' : 'text-left')}
                  />
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

            {/* BLOCK: IMAGE BREAK */}
            {block.type === 'image_break' && (
              <section className="w-full border-y border-[var(--tarius-border)] relative w-full">
                <div className={"w-full relative " + block.content.height}>
                  {renderImageDropzone(block.id, block.content.imageUrl)}
                </div>
              </section>
            )}

            {/* BLOCK: DUAL PANEL */}
            {block.type === 'dual_panel' && (
              <section className="w-full py-24 px-4 sm:px-8 bg-white border-b border-[var(--tarius-border)]">
                <div className={"max-w-7xl mx-auto flex flex-col gap-12 lg:gap-24 items-center " + (block.content.imagePosition === 'right' ? "lg:flex-row-reverse" : "lg:flex-row")}>
                  <div className="w-full lg:w-1/2 flex justify-center">
                    <div className="w-full h-[500px] relative border border-[var(--tarius-border)] shadow-xl bg-[var(--tarius-ivory-deep)] overflow-hidden">
                      {renderImageDropzone(block.id, block.content.imageUrl)}
                    </div>
                  </div>
                  <div className="w-full lg:w-1/2 flex flex-col gap-6 text-left px-4">
                    <input 
                      type="text" 
                      value={block.content.eyebrow} 
                      onChange={(e) => updateBlockContent(block.id, 'eyebrow', e.target.value)}
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
                      rows={5}
                      className={textareaStyle + "text-base font-light leading-relaxed text-stone-600 mb-2"}
                    />
                  </div>
                </div>
              </section>
            )}

            {/* BLOCK: SPACER */}
            {block.type === 'spacer' && (
              <section className="w-full bg-[var(--tarius-ivory)] relative flex items-center justify-center group/spacer border-y border-dashed border-transparent hover:border-stone-300 transition-colors w-full">
                <div className={"w-full " + block.content.height}></div>
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