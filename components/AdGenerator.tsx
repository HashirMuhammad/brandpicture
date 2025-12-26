
import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { AdParameters, GeneratedAd, AspectRatio, ImageSize } from '../types';

const AdGenerator: React.FC = () => {
  const [params, setParams] = useState<AdParameters>({
    brandName: 'swaggers',
    slogan: 'STYLE THAT SPEAKS FOR ITSELF',
    actualPrice: '5000',
    salePrice: '3500',
    currency: 'Rupees',
    imageSize: '1K',
    aspectRatio: '1:1',
    productImage: null,
    conceptImage: null,
    logoImage: null,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [ad, setAd] = useState<GeneratedAd | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const productInputRef = useRef<HTMLInputElement>(null);
  const conceptInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'product' | 'concept' | 'logo') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setParams(prev => ({
          ...prev,
          [`${type}Image`]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAd = async () => {
    if (!params.productImage) {
      setError('Please upload your Product Picture first.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setLoadingStep('Crafting your ad creative...');

    try {
      // Determine model based on requested quality
      // gemini-3-pro-image-preview supports high-quality 2K/4K resolution
      const usePro = params.imageSize !== '1K';
      const modelName = usePro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

      // Handle mandatory API key selection for Pro model or if explicitly required
      if (usePro) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          await window.aistudio.openSelectKey();
          // After openSelectKey, proceed assuming selection was successful to avoid race conditions.
        }
      }

      // Initialize AI instance right before call to use current API key from process.env.API_KEY
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Create a high-impact Meta Ad for the brand "${params.brandName}".
      
      IMPORTANT BRANDING & LOGO:
      - BRAND NAME: The brand is named "${params.brandName}".
      ${params.logoImage ? '- LOGO PROVIDED: Use the provided Logo Image. Place it professionally in a corner or alongside the brand name.' : '- BRAND TEXT: Place the brand name "'+params.brandName+'" elegantly in a premium font.'}
      
      CRITICAL SALE DETAILS:
      - The product is ON SALE.
      - Regular Price: ${params.actualPrice} ${params.currency}
      - Sale Price: ${params.salePrice} ${params.currency}
      - The price drop from ${params.actualPrice} to ${params.salePrice} must be the primary visual highlight.
      
      COMPOSITION:
      - HERO: Use the provided Product Image as the central focus. Ensure the product looks high-end.
      - STYLE REFERENCE: Incorporate the aesthetic, lighting, and premium layout vibes from the Concept Image.
      - TEXT OVERLAYS:
        1. "${params.slogan}" in a bold, professional font.
        2. "HUGE SALE" or "SPECIAL OFFER" badge.
        3. "NOW ONLY ${params.salePrice}" (make this the biggest text).
        4. "WAS ${params.actualPrice}" (crossed out or smaller).
      - ATMOSPHERE: High-end, clean studio lighting with a complementary lifestyle background.
      
      Ensure the final image looks like a professional social media advertisement ready for Meta platforms. The brand logo/name must be integrated seamlessly.`;

      const parts: any[] = [
        { text: prompt },
        {
          inlineData: {
            data: params.productImage.split(',')[1],
            mimeType: 'image/jpeg'
          }
        }
      ];

      if (params.conceptImage) {
        parts.push({
          inlineData: {
            data: params.conceptImage.split(',')[1],
            mimeType: 'image/jpeg'
          }
        });
      }

      if (params.logoImage) {
        parts.push({
          inlineData: {
            data: params.logoImage.split(',')[1],
            mimeType: 'image/jpeg'
          }
        });
      }

      setLoadingStep(`Generating ad visuals with ${usePro ? 'Gemini 3 Pro' : 'Gemini 2.5 Flash'}...`);
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: params.aspectRatio,
            ...(usePro && { imageSize: params.imageSize })
          }
        }
      });

      let imageUrl = '';
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        if (candidate.content && candidate.content.parts) {
          // Iterate through parts to find the image part
          for (const part of candidate.content.parts) {
            if (part.inlineData) {
              const base64EncodeString: string = part.inlineData.data;
              imageUrl = `data:image/png;base64,${base64EncodeString}`;
              break;
            }
          }
        }
      }

      if (imageUrl) {
        setAd({
          url: imageUrl,
          timestamp: Date.now(),
          prompt: prompt
        });
      } else {
        throw new Error('No image was returned. Try adjusting your prompt or images.');
      }
    } catch (err: any) {
      console.error(err);
      // Handle key selection error and prompt user to select a key again
      if (err.message?.includes('Requested entity was not found.')) {
        setError('API Key error. Please re-select your API key.');
        await window.aistudio.openSelectKey();
      } else {
        setError(err.message || 'Ad generation failed. Please check your internet connection and try again.');
      }
    } finally {
      setIsGenerating(false);
      setLoadingStep('');
    }
  };

  const downloadImage = () => {
    if (!ad) return;
    const link = document.createElement('a');
    link.href = ad.url;
    link.download = `${params.brandName}-Meta-Ad.png`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Configuration Panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
              <div className="bg-orange-600 p-2 rounded-xl">
                <i className="fas fa-magic text-white text-sm"></i>
              </div>
              Build Ad
            </h2>
            <div className="px-3 py-1 bg-green-50 rounded-full flex items-center gap-2 border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Active</span>
            </div>
          </div>

          <div className="space-y-8">
            {/* Step 1: Uploads */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">1. Visual Assets</label>
                {(params.productImage || params.conceptImage || params.logoImage) && (
                  <button 
                    onClick={() => setParams(p => ({ ...p, productImage: null, conceptImage: null, logoImage: null }))}
                    className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase transition-colors"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-500 text-center uppercase">Product*</p>
                  <div 
                    onClick={() => productInputRef.current?.click()}
                    className={`group relative aspect-square rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all overflow-hidden ${params.productImage ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-400 bg-gray-50 hover:bg-white'}`}
                  >
                    {params.productImage ? (
                      <img src={params.productImage} className="absolute inset-0 w-full h-full object-cover" alt="Product" />
                    ) : (
                      <div className="text-center p-2">
                        <i className="fas fa-camera text-xl text-gray-200 group-hover:text-orange-400 mb-1 transition-colors"></i>
                        <p className="text-[7px] font-black text-gray-400 uppercase leading-none">Photo</p>
                      </div>
                    )}
                    <input type="file" ref={productInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'product')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-500 text-center uppercase">Concept</p>
                  <div 
                    onClick={() => conceptInputRef.current?.click()}
                    className={`group relative aspect-square rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all overflow-hidden ${params.conceptImage ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-white'}`}
                  >
                    {params.conceptImage ? (
                      <img src={params.conceptImage} className="absolute inset-0 w-full h-full object-cover" alt="Concept" />
                    ) : (
                      <div className="text-center p-2">
                        <i className="fas fa-lightbulb text-xl text-gray-200 group-hover:text-blue-400 mb-1 transition-colors"></i>
                        <p className="text-[7px] font-black text-gray-400 uppercase leading-none">Style</p>
                      </div>
                    )}
                    <input type="file" ref={conceptInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'concept')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-gray-500 text-center uppercase">Logo</p>
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className={`group relative aspect-square rounded-2xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center transition-all overflow-hidden ${params.logoImage ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-400 bg-gray-50 hover:bg-white'}`}
                  >
                    {params.logoImage ? (
                      <img src={params.logoImage} className="absolute inset-0 w-full h-full object-contain p-2" alt="Logo" />
                    ) : (
                      <div className="text-center p-2">
                        <i className="fas fa-signature text-xl text-gray-200 group-hover:text-purple-400 mb-1 transition-colors"></i>
                        <p className="text-[7px] font-black text-gray-400 uppercase leading-none">Brand</p>
                      </div>
                    )}
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'logo')} />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Details */}
            <div className="space-y-5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">2. Sale Information</label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={params.brandName}
                    onChange={e => setParams(p => ({ ...p, brandName: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300"
                    placeholder="Brand Name"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={params.slogan}
                    onChange={e => setParams(p => ({ ...p, slogan: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all text-sm font-bold placeholder:text-gray-300"
                    placeholder="Headline / Slogan"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute -top-2 left-4 px-2 bg-white text-[8px] font-black text-gray-400 uppercase tracking-widest z-10">Regular Price</div>
                  <input
                    type="text"
                    value={params.actualPrice}
                    onChange={e => setParams(p => ({ ...p, actualPrice: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 outline-none text-sm font-bold text-gray-400 line-through decoration-red-500 decoration-2"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute -top-2 left-4 px-2 bg-white text-[8px] font-black text-orange-500 uppercase tracking-widest z-10">Sale Price</div>
                  <input
                    type="text"
                    value={params.salePrice}
                    onChange={e => setParams(p => ({ ...p, salePrice: e.target.value }))}
                    className="w-full px-5 py-4 rounded-2xl border border-orange-200 bg-orange-50 font-black text-orange-700 focus:ring-4 focus:ring-orange-100 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
               <div>
                 <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-2">Aspect Ratio</label>
                 <select
                  value={params.aspectRatio}
                  onChange={e => setParams(p => ({ ...p, aspectRatio: e.target.value as AspectRatio }))}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none text-[9px] font-black uppercase tracking-widest appearance-none cursor-pointer hover:bg-white transition-colors"
                >
                  <option value="1:1">Square (Post)</option>
                  <option value="9:16">Portrait (Story)</option>
                  <option value="16:9">Landscape (Banner)</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1 ml-2">Resolution</label>
                <select
                  value={params.imageSize}
                  onChange={e => setParams(p => ({ ...p, imageSize: e.target.value as ImageSize }))}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-100 bg-gray-50 outline-none text-[9px] font-black uppercase tracking-widest appearance-none cursor-pointer hover:bg-white transition-colors"
                >
                  <option value="1K">1K (Standard)</option>
                  <option value="2K">2K (High Res)</option>
                  <option value="4K">4K (Premium)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            onClick={generateAd}
            disabled={isGenerating}
            className={`w-full mt-12 py-5 rounded-3xl font-black text-white transition-all shadow-2xl tracking-[0.3em] uppercase text-xs ${isGenerating ? 'bg-gray-300 cursor-not-allowed shadow-none' : 'bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-orange-200 transform active:scale-95'}`}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-4">
                <i className="fas fa-spinner animate-spin"></i>
                Processing
              </span>
            ) : (
              'Create My Ad'
            )}
          </button>

          {params.imageSize !== '1K' && (
            <div className="mt-4 text-center">
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="text-[8px] font-black text-blue-500 hover:underline uppercase tracking-widest"
              >
                Billing Info for High-Res
              </a>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] border border-red-100 flex items-start gap-3">
              <i className="fas fa-exclamation-circle mt-0.5"></i>
              <span className="font-black uppercase tracking-tight">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Preview Section */}
      <div className="lg:col-span-7">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4">
              <div className="bg-blue-600 p-2.5 rounded-2xl">
                <i className="fas fa-sparkles text-white text-sm"></i>
              </div>
              Creative
            </h2>
            {ad && (
              <button
                onClick={downloadImage}
                className="bg-gray-900 text-white font-black text-[10px] tracking-[0.2em] flex items-center gap-3 px-8 py-4 rounded-full hover:bg-black transition-all shadow-xl uppercase"
              >
                <i className="fas fa-download"></i>
                Save Final
              </button>
            )}
          </div>

          <div className="flex-1 bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-100 flex items-center justify-center relative overflow-hidden min-h-[600px]">
            {isGenerating ? (
              <div className="text-center p-12">
                <div className="relative w-40 h-40 mx-auto mb-12">
                  <div className="absolute inset-0 border-[8px] border-orange-100 rounded-full"></div>
                  <div className="absolute inset-0 border-[8px] border-orange-600 rounded-full border-t-transparent animate-spin"></div>
                  <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center shadow-2xl">
                    <i className="fas fa-magic text-4xl text-orange-600 animate-pulse"></i>
                  </div>
                </div>
                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter uppercase italic">
                  {params.imageSize === '1K' ? 'Gemini Flash AI' : 'Gemini Pro AI'}
                </h3>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.4em]">{loadingStep}</p>
              </div>
            ) : ad ? (
              <div className="relative group p-6 bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] rounded-[3rem] border border-gray-100">
                <img 
                  src={ad.url} 
                  className="max-h-[650px] max-w-full object-contain rounded-[2rem] transition-transform duration-1000 group-hover:scale-[1.03]"
                  alt="Generated Ad" 
                />
                <div className="absolute -top-4 -right-4 bg-black px-6 py-2.5 rounded-full text-[10px] font-black text-white shadow-2xl uppercase tracking-[0.2em] border-2 border-white">
                  Design Complete
                </div>
              </div>
            ) : (
              <div className="text-center p-20">
                <div className="bg-white w-32 h-32 rounded-[3.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl border border-gray-50 transform -rotate-12">
                  <i className="fas fa-images text-6xl text-gray-100"></i>
                </div>
                <h3 className="text-3xl font-black text-gray-200 uppercase tracking-tighter mb-4">Empty Canvas</h3>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] max-w-[280px] mx-auto leading-relaxed">
                  Upload <span className="text-orange-500">Product</span>, <span className="text-blue-500">Style</span> & <span className="text-purple-500">Logo</span>
                </p>
              </div>
            )}
          </div>

          {/* Ad Optimization Tags */}
          <div className="mt-12 flex flex-wrap justify-center gap-4">
             <div className="px-6 py-3 bg-white rounded-full border border-gray-100 shadow-sm flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">35% Saving Highlighted</span>
             </div>
             <div className="px-6 py-3 bg-white rounded-full border border-gray-100 shadow-sm flex items-center gap-3">
                <i className="fas fa-bolt text-[10px] text-yellow-500"></i>
                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Urgency Badge Applied</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdGenerator;
