// Filename: src/app/hq-8055/certifications/page.tsx

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

export default function AdminVisualCertifications() {
  const [blocks, setBlocks] = useState<Block[]>([]);
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
    mediaPosition: 'left' // NEW: controls left or right alignment
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
    fetchPageLayout();
  }, []);

  const fetchPageLayout = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('SiteSettings')
      .select('value')
      .eq('key', 'certifications_page_blocks')
      .single();

    if (data && data.value && Array.isArray(data.value)) {
      setBlocks(data.value);
    } else {
      setBlocks([
        { id: "blk_" + Date.now() + "1", type: 'hero', content: defaultHero },
        { id: "blk_" + Date.now() + "2", type: 'spotlight', content: defaultSpotlight }
      ]);
    }
    setLoading(false);
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const { error } = await supabaseAuth
      .from('SiteSettings')
      .upsert({ 
        key: 'certifications_page_blocks', 
        value: blocks,
        updatedAt: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) {
      alert("Failed to save layout. " + error.message);
    } else {
      alert("Page layout published successfully!");
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
          <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-black/5 transition-colors p-4 text-center">
            {isProcessing ? (
              <div className="w-6 h-6 rounded-full border-2 border-[var(--tarius-border)] border-t-[var(--tarius-olive)] animate-spin"></div>
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
              <div className="w-6 h-6 rounded-full border-2 border-[var(--tarius-border)] border-t-[var(--tarius-olive)] animate-spin"></div>
            ) : (
              <>
                <svg className="text-stone-400 mb-1 w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="text-[10px] uppercase tracking-widest text-stone-500">Drop Banner Image</span>
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-stone-500 text-xs uppercase tracking-widest">
          <div className="w-4 h-4 rounded-full border border-stone-300 border-t-stone-600 animate-spin"></div>
          Loading Visual Canvas...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--tarius-ivory)] min-h-screen pb-40">
      
      {/* Sticky Top Toolbar with Dropdown */}
      <div className="sticky top-0 z-50 bg-white border-b border-[var(--tarius-border)] shadow-sm px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[var(--tarius-graphite)]">Visual Page Builder</h1>
          <p className="text-[10px] uppercase tracking-widest text-stone-500">Live Editing: /certifications</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          
          <select 
            className="w-full sm:w-auto bg-stone-50 border border-[var(--tarius-border)] px-4 py-2 text-[10px] uppercase tracking-widest text-[var(--tarius-graphite)] focus:outline-none focus:border-[var(--tarius-olive)] cursor-pointer"
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

          <button 
            onClick={handleSaveLayout} 
            disabled={isSaving || processingMediaId !== null} 
            className="w-full sm:w-auto px-8 py-2 bg-[var(--tarius-olive)] text-white text-[10px] uppercase tracking-widest hover:bg-[var(--tarius-graphite)] transition-colors disabled:opacity-50 rounded-sm"
          >
            {isSaving ? 'Publishing...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* The Visual Canvas */}
      <div className="w-full flex flex-col items-center">
        {blocks.map((block, index) => (
          <div key={block.id} className="w-full relative group/block border-y border-transparent hover:border-[var(--tarius-olive)] transition-colors">
            {renderBlockControls(block, index)}

            {/* BLOCK: HERO */}
            {block.type === 'hero' && (
              <section className="pt-24 pb-16 flex flex-col items-center justify-center text-center px-4 bg-white border-b border-[var(--tarius-border)] w-full">
                <div className="max-w-2xl mx-auto w-full flex flex-col items-center">
                  <input 
                    type="text" 
                    value={block.content.eyebrow} 
                    onChange={(e) => updateBlockContent(block.id, 'eyebrow', e.target.value)}
                    className="text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)] mb-6 block text-center bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full"
                    placeholder="Eyebrow Text..."
                  />
                  
                  <div className="relative w-full mb-6 group/select">
                    <input 
                      type="text" 
                      value={block.content.title} 
                      onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                      className={"font-display text-[var(--tarius-graphite)] text-center bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full " + block.content.titleSize}
                      placeholder="Hero Title..."
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
                    className="text-stone-500 font-light leading-relaxed text-center bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full resize-none"
                    placeholder="Description paragraph..."
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
                    className={"font-display text-4xl text-[var(--tarius-graphite)] bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full " + (block.content.alignment === 'center' ? 'text-center' : 'text-left')}
                    placeholder="Section Title"
                  />
                  <textarea 
                    value={block.content.description} 
                    onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                    rows={4}
                    className={"text-stone-500 font-light leading-relaxed bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full resize-none " + (block.content.alignment === 'center' ? 'text-center' : 'text-left')}
                    placeholder="Write your paragraph here..."
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
                      className="font-display text-4xl lg:text-6xl text-white bg-transparent border-b border-transparent hover:border-white/30 focus:outline-none focus:border-white w-full text-center mb-4 placeholder-white/50"
                      placeholder="Overlay Title"
                    />
                    <textarea 
                      value={block.content.description} 
                      onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                      rows={3}
                      className="text-white/80 font-light leading-relaxed bg-transparent border-b border-transparent hover:border-white/30 focus:outline-none focus:border-white w-full resize-none text-center placeholder-white/50"
                      placeholder="Overlay description text..."
                    />
                  </div>
                </div>
              </section>
            )}

            {/* BLOCK: SPOTLIGHT */}
            {block.type === 'spotlight' && (
              <section className={"w-full py-24 px-4 sm:px-8 border-b border-[var(--tarius-border)] " + (index % 2 === 0 ? "bg-[var(--tarius-ivory)]" : "bg-white")}>
                
                {/* NEW: Left/Right Swap Toggle */}
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
                      className="text-[10px] uppercase tracking-[0.3em] text-[var(--tarius-olive)] bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full"
                      placeholder="Tagline (e.g. Official Filing)"
                    />
                    <input 
                      type="text" 
                      value={block.content.title} 
                      onChange={(e) => updateBlockContent(block.id, 'title', e.target.value)}
                      className="font-display text-4xl lg:text-5xl text-[var(--tarius-graphite)] leading-tight bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full"
                      placeholder="Spotlight Title"
                    />
                    <textarea 
                      value={block.content.description} 
                      onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                      rows={4}
                      className="text-sm font-light leading-relaxed text-stone-600 bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full resize-none mt-2"
                      placeholder="Detailed description..."
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
                          className="font-display text-2xl text-[var(--tarius-graphite)] bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full"
                          placeholder="Document Title"
                        />
                        <textarea 
                          value={item.description} 
                          onChange={(e) => updateBlockArrayItem(block.id, 'items', i, 'description', e.target.value)}
                          rows={3}
                          className="text-sm font-light leading-relaxed text-stone-500 bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full resize-none"
                          placeholder="Document description..."
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
                      className="font-display text-3xl text-[var(--tarius-graphite)] leading-tight bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full text-center"
                      placeholder="Featured Document Title"
                    />
                    <textarea 
                      value={block.content.description} 
                      onChange={(e) => updateBlockContent(block.id, 'description', e.target.value)}
                      rows={2}
                      className="text-sm font-light leading-relaxed text-stone-500 bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full resize-none text-center"
                      placeholder="Short description..."
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
                    className="font-display text-3xl text-[var(--tarius-graphite)] mb-2 text-center bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)]"
                    placeholder="Section Title"
                  />
                  <input 
                    type="text" 
                    value={block.content.sectionSubtitle} 
                    onChange={(e) => updateBlockContent(block.id, 'sectionSubtitle', e.target.value)}
                    className="text-[10px] uppercase tracking-[0.2em] text-stone-500 text-center bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-[300px]"
                    placeholder="Section Subtitle"
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
                          className="font-display text-xl text-[var(--tarius-graphite)] mb-2 bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full"
                          placeholder="Card Title"
                        />
                        <textarea 
                          value={card.description} 
                          onChange={(e) => updateBlockArrayItem(block.id, 'cards', cardIndex, 'description', e.target.value)}
                          rows={2}
                          className="text-xs font-light text-stone-500 bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full resize-none"
                          placeholder="Card description..."
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
                    className="font-display text-2xl text-[var(--tarius-graphite)] mb-2 text-center bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)]"
                    placeholder="Ledger Title"
                  />
                  <input 
                    type="text" 
                    value={block.content.sectionSubtitle} 
                    onChange={(e) => updateBlockContent(block.id, 'sectionSubtitle', e.target.value)}
                    className="text-[10px] uppercase tracking-[0.2em] text-stone-500 text-center bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-[300px]"
                    placeholder="Ledger Subtitle"
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
                          className="text-sm font-medium text-[var(--tarius-graphite)] bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full"
                          placeholder="Item Title"
                        />
                        <input 
                          type="text" 
                          value={item.description} 
                          onChange={(e) => updateBlockArrayItem(block.id, 'items', itemIndex, 'description', e.target.value)}
                          className="text-xs text-stone-500 bg-transparent border-b border-transparent hover:border-stone-300 focus:outline-none focus:border-[var(--tarius-olive)] w-full"
                          placeholder="Description or Date"
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