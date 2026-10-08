// Filename: src/app/hq-8055/theme/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/api';
import { createBrowserClient } from '@supabase/ssr';

// --- CURATED PREMIUM LIGHT/MID-TONE PALETTES ---
const PRESETS: Record<string, Record<string, string>> = {
  classic: {
    ivory: "#f7f5ef", ivoryDeep: "#eeece4", graphite: "#1f211c", graphiteSoft: "#3b3d36",
    olive: "#6f7757", oliveDark: "#555c43", champagne: "#c8b99a", white: "#ffffff",
    border: "rgba(31, 33, 28, 0.14)"
  },
  terracotta: {
    ivory: "#f4ece6", ivoryDeep: "#e8dcd3", graphite: "#4a3c31", graphiteSoft: "#6b574a",
    olive: "#a86a51", oliveDark: "#8a533e", champagne: "#d4a373", white: "#ffffff",
    border: "rgba(74, 60, 49, 0.15)"
  },
  botanical: {
    ivory: "#eef2ed", ivoryDeep: "#e1e8df", graphite: "#1a2b22", graphiteSoft: "#2d4a3a",
    olive: "#4a6b57", oliveDark: "#365241", champagne: "#b8a379", white: "#ffffff",
    border: "rgba(26, 43, 34, 0.12)"
  },
  dune: {
    ivory: "#e8e5df", ivoryDeep: "#dbd7ce", graphite: "#0a0a0a", graphiteSoft: "#222222",
    olive: "#c25e29", oliveDark: "#9c481d", champagne: "#9e9a93", white: "#f5f4f0",
    border: "rgba(10, 10, 10, 0.15)"
  },
  solstice: {
    ivory: "#fcf8eb", ivoryDeep: "#f2ebd5", graphite: "#2b2718", graphiteSoft: "#4a442e",
    olive: "#d6942b", oliveDark: "#b57a1f", champagne: "#e06c3a", white: "#ffffff",
    border: "rgba(43, 39, 24, 0.15)"
  },
  alabaster: {
    ivory: "#fbfbfb", ivoryDeep: "#f0f0f0", graphite: "#111111", graphiteSoft: "#333333",
    olive: "#7a7a7a", oliveDark: "#4a4a4a", champagne: "#b3b3b3", white: "#ffffff",
    border: "rgba(17, 17, 17, 0.1)"
  },
  azure_mist: {
    ivory: "#f0f4f8", ivoryDeep: "#e1e8ed", graphite: "#15202b", graphiteSoft: "#253341",
    olive: "#5c7c8a", oliveDark: "#3d545e", champagne: "#b0c4de", white: "#ffffff",
    border: "rgba(21, 32, 43, 0.12)"
  },
  amethyst_haze: {
    ivory: "#f8f6f9", ivoryDeep: "#eeeaf1", graphite: "#2d1e2f", graphiteSoft: "#4a354d",
    olive: "#8a6a8c", oliveDark: "#5c435d", champagne: "#cbaacb", white: "#ffffff",
    border: "rgba(45, 30, 47, 0.12)"
  },
  verdant_glow: {
    ivory: "#f3f6f1", ivoryDeep: "#e4ece0", graphite: "#1e2e1e", graphiteSoft: "#364d36",
    olive: "#5c8a5c", oliveDark: "#3b5c3b", champagne: "#a3c2a3", white: "#ffffff",
    border: "rgba(30, 46, 30, 0.15)"
  }
};

const DISPLAY_FONTS = ["Cormorant Garamond", "Playfair Display", "Cinzel", "Lora", "Bodoni Moda"];
const BODY_FONTS = ["Montserrat", "Inter", "Lato", "Roboto", "Open Sans"];

export default function AdminThemeSettings() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [activePreset, setActivePreset] = useState('classic');
  
  const [colors, setColors] = useState<Record<string, string>>(PRESETS.classic);
  
  const [typography, setTypography] = useState({
    display: "Cormorant Garamond",
    body: "Montserrat"
  });
  
  const [geometry, setGeometry] = useState({
    radius: "0px"
  });

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    setLoading(true);
    const { data } = await supabase.from('SiteSettings').select('value').eq('key', 'theme_settings').single();
    if (data && data.value) {
      setMode(data.value.mode || 'preset');
      setActivePreset(data.value.activePreset || 'classic');
      setColors(data.value.colors || PRESETS.classic);
      if (data.value.typography) setTypography(data.value.typography);
      if (data.value.geometry) setGeometry(data.value.geometry);
    }
    setLoading(false);
  };

  const handlePresetSelect = (presetKey: string) => {
    setMode('preset');
    setActivePreset(presetKey);
    setColors(PRESETS[presetKey]);
  };

  const handleColorChange = (key: string, value: string) => {
    setMode('custom');
    setColors((prev: Record<string, string>) => ({ ...prev, [key]: value }));
  };

  const handleReset = async () => {
    if (!window.confirm("Are you sure you want to completely reset the theme to defaults? All custom changes will be lost.")) return;
    
    setIsSaving(true);
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const defaultPayload = {
      mode: 'preset',
      activePreset: 'classic',
      typography: {
        display: "Cormorant Garamond",
        body: "Montserrat"
      },
      geometry: {
        radius: "0px"
      },
      colors: PRESETS.classic
    };

    const { error } = await supabaseAuth.from('SiteSettings').update({ value: defaultPayload }).eq('key', 'theme_settings');
    setIsSaving(false);
    
    if (error) {
      alert('Failed to reset theme settings.');
    } else {
      alert('Theme reset successfully. Reloading interface...');
      window.location.reload(); 
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const supabaseAuth = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] as string,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] as string
    );

    const payload = {
      mode,
      activePreset: mode === 'preset' ? activePreset : 'custom',
      typography,
      geometry,
      colors
    };

    const { error } = await supabaseAuth.from('SiteSettings').update({ value: payload }).eq('key', 'theme_settings');
    setIsSaving(false);
    
    if (error) {
      alert('Failed to save theme settings.');
    } else {
      alert('Global Theme updated successfully! Refresh your public storefront to see the changes.');
      window.location.reload(); 
    }
  };

  const ColorInput = ({ label, colorKey }: { label: string, colorKey: string }) => (
    <div className="flex items-center justify-between p-3 bg-[var(--tarius-ivory-deep)] border border-[var(--tarius-border)] group">
      <span className="text-[10px] uppercase tracking-widest text-[var(--tarius-graphite)]">{label}</span>
      <div className="flex items-center gap-3">
        <input 
          type="text" 
          value={colors[colorKey]} 
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="bg-transparent border-b border-[var(--tarius-border)] text-xs focus:outline-none w-24 uppercase"
        />
        <input 
          type="color" 
          value={colors[colorKey].startsWith('rgba') ? '#000000' : colors[colorKey]} 
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="w-8 h-8 rounded-sm cursor-pointer border-0 p-0 shrink-0 bg-transparent"
        />
      </div>
    </div>
  );

  const PresetCard = ({ presetKey, title }: { presetKey: string, title: string }) => {
    const isSelected = mode === 'preset' && activePreset === presetKey;
    const pColors = PRESETS[presetKey];
    
    return (
      <button 
        onClick={() => handlePresetSelect(presetKey)}
        className={"flex flex-col items-center p-6 border transition-all text-left w-full " + (isSelected ? "border-[var(--tarius-olive)] bg-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] scale-[1.02]" : "border-[var(--tarius-border)] hover:border-[var(--tarius-olive)]/50 bg-[var(--tarius-ivory-deep)]")}
      >
        <div className="w-full flex h-16 rounded-sm overflow-hidden mb-4 border border-[var(--tarius-border)] shadow-inner">
          <div className="w-1/4 h-full" style={{backgroundColor: pColors.ivory}}></div>
          <div className="w-1/4 h-full" style={{backgroundColor: pColors.graphite}}></div>
          <div className="w-1/4 h-full" style={{backgroundColor: pColors.olive}}></div>
          <div className="w-1/4 h-full" style={{backgroundColor: pColors.champagne}}></div>
        </div>
        <span className="font-display text-xl text-[var(--tarius-graphite)] block w-full text-center">{title}</span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--tarius-ivory)]">
        <div className="flex items-center gap-3 text-stone-500 text-xs uppercase tracking-widest">
          <div className="w-4 h-4 rounded-full border border-stone-300 border-t-[var(--tarius-olive)] animate-spin"></div>
          Loading Framework...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--tarius-ivory)] font-body pb-32">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-[100] bg-white border-b border-[var(--tarius-border)] shadow-sm px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[var(--tarius-graphite)] leading-none mb-1">Aesthetic Engine</h1>
          <p className="text-[9px] uppercase tracking-widest text-stone-400">Global Theming & Typography</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={handleReset} 
            disabled={isSaving} 
            className="w-full sm:w-auto px-6 py-3 bg-transparent border border-red-500 text-red-500 text-[10px] uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50 rounded-sm"
          >
            Reset to Defaults
          </button>

          <button 
            onClick={handleSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto px-8 py-3 bg-[var(--tarius-olive)] text-white text-[10px] uppercase tracking-widest hover:bg-[var(--tarius-graphite)] transition-colors disabled:opacity-50 rounded-sm shadow-md"
          >
            {isSaving ? 'Compiling CSS...' : 'Inject Global Theme'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 space-y-12">
        
        {/* Curated Presets */}
        <div className="bg-white border border-[var(--tarius-border)] shadow-sm p-8 sm:p-10">
          <div className="flex items-center justify-between border-b border-[var(--tarius-border)] pb-4 mb-8">
            <h2 className="font-display text-3xl text-[var(--tarius-graphite)]">Curated Palettes</h2>
            {mode === 'custom' && <span className="text-[9px] uppercase tracking-[0.2em] bg-[var(--tarius-ivory-deep)] px-3 py-1 text-[var(--tarius-olive)] font-bold">Custom Mode Active</span>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PresetCard presetKey="classic" title="Classic Ivory" />
            <PresetCard presetKey="alabaster" title="Alabaster Monochrome" />
            <PresetCard presetKey="dune" title="High-Fashion Dune" />
            
            <PresetCard presetKey="botanical" title="Botanical Sage" />
            <PresetCard presetKey="verdant_glow" title="Verdant Glow" />
            <PresetCard presetKey="terracotta" title="Terracotta Earth" />
            
            <PresetCard presetKey="azure_mist" title="Azure Mist" />
            <PresetCard presetKey="amethyst_haze" title="Amethyst Haze" />
            <PresetCard presetKey="solstice" title="Summer Solstice" />
          </div>
        </div>

        {/* Structural Geometry & Typography */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          <div className="bg-white border border-[var(--tarius-border)] shadow-sm p-8">
            <h2 className="font-display text-2xl text-[var(--tarius-graphite)] mb-6 border-b border-[var(--tarius-border)] pb-4">Global Typography</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-2">Display Font (Headers)</label>
                <select 
                  value={typography.display} 
                  onChange={(e) => setTypography({...typography, display: e.target.value})}
                  className="w-full bg-transparent border border-[var(--tarius-border)] py-3 px-4 text-sm focus:outline-none focus:border-[var(--tarius-olive)]"
                >
                  {DISPLAY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-2">Body Font (Paragraphs)</label>
                <select 
                  value={typography.body} 
                  onChange={(e) => setTypography({...typography, body: e.target.value})}
                  className="w-full bg-transparent border border-[var(--tarius-border)] py-3 px-4 text-sm focus:outline-none focus:border-[var(--tarius-olive)]"
                >
                  {BODY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[var(--tarius-border)] shadow-sm p-8">
            <h2 className="font-display text-2xl text-[var(--tarius-graphite)] mb-6 border-b border-[var(--tarius-border)] pb-4">Aesthetic Geometry</h2>
            <div className="space-y-6">
              <div>
                <label className="text-[9px] uppercase tracking-widest text-stone-500 block mb-2">Global Border Radius</label>
                <select 
                  value={geometry.radius} 
                  onChange={(e) => setGeometry({radius: e.target.value})}
                  className="w-full bg-transparent border border-[var(--tarius-border)] py-3 px-4 text-sm focus:outline-none focus:border-[var(--tarius-olive)]"
                >
                  <option value="0px">Editorial Sharp (0px)</option>
                  <option value="4px">Modern Soft (4px)</option>
                  <option value="8px">Rounded Friendly (8px)</option>
                  <option value="16px">Pill / Bubble (16px)</option>
                </select>
              </div>
              <div className="pt-4 flex flex-col items-center justify-center border-t border-dashed border-[var(--tarius-border)] mt-4">
                 <p className="text-xs text-stone-400 mb-4 font-light">Interactive Geometry Test</p>
                 <button 
                  type="button"
                  onClick={() => alert("Geometry applies flawlessly. Active Radius: " + geometry.radius)}
                  className="px-10 py-4 bg-[var(--tarius-graphite)] text-[var(--tarius-white)] text-[10px] uppercase tracking-widest hover:bg-[var(--tarius-olive)] transition-colors duration-300 shadow-lg"
                  style={{ borderRadius: geometry.radius }}
                 >
                   Test Interactive Button
                 </button>
              </div>
            </div>
          </div>

        </div>

        {/* Granular Color Engine */}
        <div className="bg-white border border-[var(--tarius-border)] shadow-sm p-8 sm:p-10">
          <div className="flex items-center justify-between border-b border-[var(--tarius-border)] pb-4 mb-8">
            <h2 className="font-display text-2xl text-[var(--tarius-graphite)]">Granular Color Override</h2>
            <p className="text-[9px] uppercase tracking-widest text-stone-500">Edit any color to unlock custom mode</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ColorInput label="Background Base" colorKey="ivory" />
            <ColorInput label="Background Deep" colorKey="ivoryDeep" />
            <ColorInput label="Primary Dark" colorKey="graphite" />
            <ColorInput label="Secondary Dark" colorKey="graphiteSoft" />
            <ColorInput label="Accent Primary" colorKey="olive" />
            <ColorInput label="Accent Dark" colorKey="oliveDark" />
            <ColorInput label="Highlight (Gold)" colorKey="champagne" />
            <ColorInput label="Card Base (White)" colorKey="white" />
            <ColorInput label="Lines / Borders" colorKey="border" />
          </div>
        </div>

      </div>
    </div>
  );
}