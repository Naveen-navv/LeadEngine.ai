
import React, { useState } from 'react';
import { BrandContext } from '../types';
import { gemini } from '../services/geminiService';
import { Globe, Plus, Edit3, Trash2, Check, Loader2, Globe2, Sparkles, Target, Cpu, X } from 'lucide-react';

interface Props {
  context: BrandContext;
  onUpdateContext: (context: BrandContext) => void;
}

const ContextView: React.FC<Props> = ({ context, onUpdateContext }) => {
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState(context.websiteUrl);
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'loading' | 'ready'>('idle');
  const [tempProduct, setTempProduct] = useState({ name: context.productName, description: context.productDescription });

  const steps = [
    "Scanning Website Content",
    "Extracting Brand Voice",
    "Identifying Target Audience",
    "Generating Content Strategy",
    "Building Insights Dashboard"
  ];
  
  const [currentStep, setCurrentStep] = useState(0);

  const handleConnectWebsite = async () => {
    setIsWebsiteModalOpen(false);
    setIsReprocessing(true);
    setCurrentStep(0);

    // Start Gemini Analysis in parallel with visual steps
    const analysisPromise = gemini.analyzeWebsite(websiteUrl);

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const brandData = await analysisPromise;

    onUpdateContext({
      websiteUrl: websiteUrl,
      productName: brandData.productName || tempProduct.name,
      productDescription: brandData.productDescription || tempProduct.description,
      audienceSegments: brandData.audienceSegments || context.audienceSegments
    });
    
    setTempProduct({
      name: brandData.productName || tempProduct.name,
      description: brandData.productDescription || tempProduct.description
    });
    
    setIsReprocessing(false);
  };

  const startPreview = () => {
    setPreviewStatus('loading');
    setTimeout(() => {
      setPreviewStatus('ready');
    }, 1000);
  };

  const handleSaveProduct = () => {
    onUpdateContext({
      ...context,
      productName: tempProduct.name,
      productDescription: tempProduct.description
    });
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = () => {
    if (confirm("Are you sure you want to delete this product profile?")) {
      onUpdateContext({
        ...context,
        productName: "Generic AI Agent",
        productDescription: "Add a product description to personalize outreach."
      });
      setTempProduct({ name: "Generic AI Agent", description: "Add a product description to personalize outreach." });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Context Settings</h1>
          <p className="text-gray-400">This data influences your AI inspirations and engagement generation.</p>
        </div>
        <button 
          onClick={() => { setWebsiteUrl(context.websiteUrl); setIsWebsiteModalOpen(true); }}
          className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-600/20 transition-all"
        >
           <Loader2 className="w-4 h-4" /> Re-analyze
        </button>
      </div>

      <div className="space-y-8">
        {/* Your Products */}
        <section className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Your Products</h2>
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mt-1">Personalize how the AI speaks about your offer</p>
            </div>
            <button 
              onClick={() => { setTempProduct({ name: '', description: '' }); setIsProductModalOpen(true); }}
              className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add Product
            </button>
          </div>

          <div className="p-4 bg-indigo-600/5 border border-indigo-500/20 rounded-xl relative group">
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white flex items-center gap-2">
                    {context.productName}
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold">ACTIVE</span>
                  </h3>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    {context.productDescription}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setTempProduct({ name: context.productName, description: context.productDescription }); setIsProductModalOpen(true); }}
                  className="p-2 hover:bg-gray-800 rounded-lg text-gray-500"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleDeleteProduct}
                  className="p-2 hover:bg-gray-800 rounded-lg text-red-500/60"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Website Connection */}
        <section className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Website Connection</h2>
              <p className="text-sm text-gray-400">Linked to <span className="text-emerald-400 font-mono text-xs">{context.websiteUrl}</span></p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-xl border border-gray-800">
            <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
               </div>
               <div>
                  <p className="text-sm font-semibold text-gray-200">{context.websiteUrl}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Website connected and analyzed</p>
               </div>
            </div>
            <button 
              onClick={() => { setWebsiteUrl(context.websiteUrl); setIsWebsiteModalOpen(true); }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded-lg border border-gray-700 flex items-center gap-2"
            >
              <Edit3 className="w-3.5 h-3.5" /> Change
            </button>
          </div>
        </section>

        {/* Audience Insights */}
        <section className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Audience Insights</h2>
                <p className="text-sm text-gray-400">Target segments analyzed from your brand data.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {context.audienceSegments.map((segment, i) => (
               <div key={i} className="p-3 bg-gray-900/30 border border-gray-800 rounded-xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                  <span className="text-sm font-medium text-gray-300">{segment}</span>
                  <span className="text-[10px] text-gray-600 font-bold uppercase tracking-tight">Active Pattern</span>
               </div>
             ))}
          </div>
        </section>
      </div>

      {/* Website Modal */}
      {isWebsiteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsWebsiteModalOpen(false)}></div>
          <div className="relative w-full max-w-md bg-[#0b0f1a] border border-gray-800 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-2">Connect Your Website</h2>
            <p className="text-gray-400 text-sm mb-6">Enter your website URL to enable AI analysis and content generation.</p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Website URL</label>
                <input 
                  autoFocus
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white transition-all"
                  placeholder="https://yourwebsite.com"
                />
              </div>

              {previewStatus === 'idle' && (
                <button 
                  onClick={startPreview}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold py-3 rounded-xl border border-gray-700 transition-all flex items-center justify-center gap-2"
                >
                  <Globe2 className="w-4 h-4" /> Preview Website
                </button>
              )}

              {previewStatus === 'loading' && (
                <div className="py-4 text-center">
                  <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading preview...
                  </p>
                </div>
              )}

              {previewStatus === 'ready' && (
                <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl space-y-2 mb-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm font-bold text-white">Website Found</p>
                  <p className="text-xs text-gray-500">{websiteUrl}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={handleConnectWebsite}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Connect Website
                </button>
                <button 
                  onClick={() => setIsWebsiteModalOpen(false)}
                  className="flex-1 bg-gray-900 hover:bg-gray-800 text-gray-400 font-bold py-3 rounded-xl border border-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)}></div>
          <div className="relative w-full max-w-lg bg-[#0b0f1a] border border-gray-800 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Product Profile</h2>
              <button onClick={() => setIsProductModalOpen(false)} className="text-gray-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Product Name</label>
                <input 
                  value={tempProduct.name}
                  onChange={(e) => setTempProduct({...tempProduct, name: e.target.value})}
                  className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                  placeholder="e.g. LeadEngine AI"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Value Proposition / Description</label>
                <textarea 
                  value={tempProduct.description}
                  onChange={(e) => setTempProduct({...tempProduct, description: e.target.value})}
                  rows={4}
                  className="w-full bg-[#030712] border border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white resize-none"
                  placeholder="Describe your product value prop..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  onClick={handleSaveProduct}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all"
                >
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reprocessing Modal */}
      {isReprocessing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md"></div>
          <div className="relative w-full max-w-lg bg-[#0b0f1a] border border-gray-800 rounded-3xl p-10 shadow-2xl text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-indigo-600/40 relative">
               <div className="absolute inset-0 rounded-full animate-ping bg-indigo-600 opacity-20"></div>
               <Cpu className="w-10 h-10 text-white animate-pulse" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">AI is Reprocessing Your Brand</h2>
            <p className="text-gray-400 text-sm mb-10">Extracting intelligence from <span className="text-indigo-400 font-mono">{websiteUrl}</span></p>

            <div className="space-y-6 text-left max-w-xs mx-auto">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-4 transition-all duration-300">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                    index < currentStep ? 'bg-indigo-600 border-indigo-600' : 
                    index === currentStep ? 'border-indigo-400 bg-indigo-400/10' : 'border-gray-800'
                  }`}>
                    {index < currentStep ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : index === currentStep ? (
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                    ) : null}
                  </div>
                  <span className={`text-sm font-medium ${index <= currentStep ? 'text-gray-200' : 'text-gray-600'}`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-gray-800">
               <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest animate-pulse">Almost Done!</p>
               <p className="text-[10px] text-gray-500 mt-2">Updating your intelligence dashboard with new context...</p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ContextView;
