import React, { useRef, useState, useEffect } from 'react';
import { ReactSketchCanvas, ReactSketchCanvasRef } from 'react-sketch-canvas';
import { motion, AnimatePresence } from 'motion/react';
import { Palette, Eraser, Trash2, Wand2, Sparkles, X, ShoppingBag, Plus, Search, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface ShoppingItem {
  store: string;
  name: string;
  price: string;
  url: string;
  score: string;
}

export function DrawingBoard({ userItems, onAddItem }: { userItems: any[], onAddItem?: (item: any) => void; key?: string }) {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [color, setColor] = useState('#a855f7');
  const [eraserMode, setEraserMode] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<{ 
    match: any, 
    shopping: ShoppingItem[],
    description: string,
    vibe: string
  } | null>(null);

  const colors = ['#ffffff', '#000000', '#f43f5e', '#a855f7', '#3b82f6', '#10b981', '#f59e0b'];

  const handleClear = () => {
    canvasRef.current?.clearCanvas();
    setAiResult(null);
  };

  const handleDecipher = async () => {
    if (!canvasRef.current) return;
    setAiAnalyzing(true);
    setAiResult(null);
    try {
      const dataUrl = await canvasRef.current.exportImage('png');
      const base64Data = dataUrl.split(',')[1];
      
      const prompt = `
        Analyze this fashion sketch with extreme precision. 
        Your goal is to be a master fashion curator identifying the EXACT pieces implied by the drawing.
        
        1. Description: Provide a detailed, poetic description of the cut, material, and visual weight.
        2. Vibe: Identify the specific sub-culture aesthetic (e.g., Avant-garde Minimalist, Neo-Y2K, Quiet Luxury).
        3. Local Match: Find the closest match in: ${JSON.stringify(userItems.map(i => ({ id: i.id, name: i.name, category: i.category }))) }.
        4. Global Marketplace: Find 30 actual, accurate clothing items from major shopping sites (Amazon, ASOS, Zara, Nordstrom, H&M) that perfectly match the visual characteristics of the sketch. 

        CRITICAL FOR IMAGES:
        - Use high-resolution Unsplash fashion ID URLs that match the sketch's aesthetic perfectly.
        - Format: https://images.unsplash.com/photo-[ID]?auto=format&fit=crop&q=80&w=600
        
        CRITICAL FOR LINKS:
        - Provide actual direct shopping links or specific Google Shopping search strings for the products identified.

        Return ONLY valid JSON:
        {
          "description": "...",
          "vibe": "...",
          "matchedItemId": "...",
          "shoppingSuggestions": [
            { 
              "store": "Exact Retailer", 
              "name": "Full Product Name", 
              "price": "₹ Price", 
              "url": "High-res Unsplash Image URL", 
              "shopLink": "Direct Shopping Link",
              "score": "Match %" 
            }
          ]
        }
      `;
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      
      const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: "image/png" } }
          ]
        },
        config: { responseMimeType: "application/json" }
      });
      
      const res = JSON.parse(response.text || '{}');
      let match = userItems.find(i => i.id === res.matchedItemId);
      
      setAiResult({
        match: match || null,
        shopping: res.shoppingSuggestions || [],
        description: res.description,
        vibe: res.vibe
      });
    } catch (e) {
      console.error(e);
      setAiResult({
          match: userItems[0],
          shopping: [],
          description: "A mysterious thread waiting to be woven.",
          vibe: "Unknown Essence"
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-end mb-4 px-2">
          <div>
            <h3 className="font-serif text-3xl font-black text-white drop-shadow-md italic">Curation Studio</h3>
            <p className="text-[10px] text-fuchsia-300 uppercase tracking-widest font-black mt-1">Transmute Sketches to Outfits</p>
          </div>
      </div>

      <div className="bg-white/5 p-4 rounded-[40px] border border-lavender-400/20 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent pointer-events-none" />
        
        <div className="h-[45vh] w-full rounded-[2.5rem] overflow-hidden shadow-inner bg-[#0a0410] mb-6 border border-white/5 relative">
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={4}
            eraserWidth={25}
            strokeColor={eraserMode ? '#0a0410' : color}
            canvasColor="transparent"
            style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
          />
          {!eraserMode && <div className="absolute top-4 right-4 w-4 h-4 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" style={{ backgroundColor: color }} />}
        </div>

        <div className="flex items-center justify-between gap-4 px-2">
            <div className="flex gap-2 p-1.5 bg-black/40 rounded-3xl overflow-x-auto scrollbar-none border border-white/5">
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setEraserMode(false); }}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${!eraserMode && color === c ? 'scale-110 border-white shadow-[0_0_10px_white]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex gap-2">
                <button 
                  onClick={() => setEraserMode(!eraserMode)}
                  className={`p-3.5 rounded-2xl transition-all shadow-lg ${eraserMode ? 'bg-fuchsia-500 text-white shadow-fuchsia-500/20' : 'bg-white/5 text-white/50 hover:bg-white/10'}`}
                >
                  <Eraser size={20} />
                </button>
                <button 
                  onClick={handleClear}
                  className="p-3.5 rounded-2xl bg-white/5 text-white/50 hover:text-rose-400 hover:bg-rose-500/10 transition-all shadow-lg"
                >
                  <Trash2 size={20} />
                </button>
            </div>
        </div>

        <button 
          onClick={handleDecipher}
          disabled={aiAnalyzing}
          className="w-full mt-8 bg-gradient-to-r from-fuchsia-600 to-lavender-600 text-white font-black uppercase tracking-[0.3em] text-[10px] py-5 rounded-[2rem] shadow-2xl hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] flex items-center justify-center gap-3 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          {aiAnalyzing ? (
            <div className="animate-spin w-5 h-5 border-2 border-white/20 border-t-white rounded-full" />
          ) : (
            <><Wand2 size={20} /> Consult The Oracle</>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {aiAnalyzing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-6 p-8 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-3xl relative overflow-hidden text-center flex flex-col items-center justify-center space-y-6"
          >
            <motion.div
              className="absolute inset-0 z-0"
              animate={{
                background: [
                  'radial-gradient(circle at 30% 30%, rgba(168,85,247,0.2) 0%, transparent 70%)',
                  'radial-gradient(circle at 70% 70%, rgba(217,70,239,0.2) 0%, transparent 70%)',
                  'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.3) 0%, transparent 70%)',
                ]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />
            
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                rotate: { repeat: Infinity, duration: 4, ease: "linear" },
                scale: { repeat: Infinity, duration: 2, ease: "easeInOut" }
              }}
              className="relative z-10"
            >
              <div className="absolute inset-0 blur-2xl bg-lavender-500 rounded-full opacity-30 animate-pulse" />
              <Sparkles size={48} className="text-white relative z-10 shadow-2xl" />
            </motion.div>

            <div className="relative z-10 text-center">
              <h4 className="text-2xl font-serif italic text-white font-black mb-1">Synthesizing Essence</h4>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-fuchsia-400 animate-pulse">Consulting the Loom...</p>
            </div>
          </motion.div>
        ) : aiResult ? (
          <motion.div 
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6"
          >
            <div className="bg-white/5 p-8 rounded-[3rem] border border-white/10 backdrop-blur-2xl shadow-3xl text-center relative overflow-hidden">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-fuchsia-500/10 blur-[50px] -translate-y-16" />
               <Sparkles className="mx-auto mb-4 text-fuchsia-400" size={32} />
               <p className="text-[10px] font-black uppercase tracking-[0.5em] text-lavender-400 mb-2">{aiResult.vibe}</p>
               <h4 className="font-serif text-2xl text-white italic mb-4 leading-tight">"{aiResult.description}"</h4>
               
               {aiResult.match ? (
                  <div className="mt-8 flex flex-col items-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4">Aligned Wardrobe Artifact</p>
                    <div className="flex items-center gap-6 bg-white/5 p-4 pr-8 rounded-[2rem] border border-lavender-500/20 shadow-xl group hover:border-lavender-500 transition-all cursor-pointer">
                        <div className="w-20 h-24 rounded-2xl overflow-hidden shadow-lg">
                           <img 
                             src={aiResult.match.imageUrl} 
                             className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                             referrerPolicy="no-referrer"
                             onError={(e) => {
                               e.currentTarget.src = 'https://images.unsplash.com/photo-1594932224011-042041c65451?auto=format&fit=crop&q=80&w=400';
                             }}
                           />
                        </div>
                        <div className="text-left">
                            <p className="font-serif text-xl text-white italic">{aiResult.match.name}</p>
                            <p className="text-[9px] uppercase font-black tracking-[0.2em] text-fuchsia-400 mt-1">{aiResult.match.category}</p>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 py-4 opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-widest">No matching threads in your loom.</p>
                  </div>
                )}
            </div>

            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <h4 className="font-black text-[10px] uppercase tracking-[0.3em] text-white/40">Marketplace Echoes</h4>
                   <Search size={14} className="text-white/20" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 pb-12">
                    {aiResult.shopping.map((item, i) => (
                        <div key={i} className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-fuchsia-500/50 shadow-2xl transition-all duration-500 relative">
                            <a 
                                href={item.shopLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block"
                            >
                                <div className="relative aspect-[3/4] overflow-hidden bg-slate-900">
                                    <img 
                                      src={item.url} 
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                                      referrerPolicy="no-referrer"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1445205170230-053b830c6050?auto=format&fit=crop&q=80&w=400';
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0410] via-transparent to-transparent opacity-60" />
                                    <div className="absolute top-3 left-3 bg-fuchsia-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">
                                        {item.score}
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 backdrop-blur-sm">
                                    <p className="text-[8px] text-fuchsia-300 font-black uppercase tracking-widest mb-1">{item.store}</p>
                                    <p className="text-[11px] font-bold text-white truncate mb-2">{item.name}</p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[#34d399] font-black text-xs">{item.price}</span>
                                      <div className="bg-white/10 p-1.5 rounded-lg border border-white/10 group-hover:bg-fuchsia-500 group-hover:border-fuchsia-400 transition-all">
                                        <ExternalLink size={10} className="text-white" />
                                      </div>
                                    </div>
                                </div>
                            </a>
                            <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  onAddItem?.({
                                    name: item.name,
                                    category: 'Top',
                                    imageUrl: item.url,
                                    weatherTags: ['Sunny']
                                  });
                                }}
                                className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 backdrop-blur-md p-2.5 rounded-xl border border-white/20 opacity-0 group-hover:opacity-100 transition-all text-white z-20 shadow-xl"
                                title="Add to Closet"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
