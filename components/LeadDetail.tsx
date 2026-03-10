
import React, { useState, useEffect } from 'react';
import { Lead, ReplyStyle, BrandContext, Platform } from '../types';
import { Loader2, Copy, Send, ExternalLink, RefreshCcw, Image as ImageIcon, Calendar, Eye, MessageSquare, Twitter, Linkedin } from 'lucide-react';
import { gemini } from '../services/geminiService';

interface Props {
  lead: Lead;
  isAnalyzing: boolean;
  brandContext: BrandContext;
}

const LeadDetail: React.FC<Props> = ({ lead, isAnalyzing, brandContext }) => {
  const [style, setStyle] = useState<ReplyStyle>({
    tone: 'Casual',
    medium: 'Subtle',
    length: 'Medium',
    includeLink: true
  });
  const [reply, setReply] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await gemini.generateReply(lead, style, brandContext);
      setReply(result);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (lead && !isAnalyzing) {
      handleGenerate();
    }
  }, [lead, isAnalyzing]);

  const getPlatformIcon = () => {
    switch (lead.platform) {
      case Platform.REDDIT: return <MessageSquare className="w-4 h-4 text-orange-500" />;
      case Platform.X: return <Twitter className="w-4 h-4 text-sky-400" />;
      case Platform.LINKEDIN: return <Linkedin className="w-4 h-4 text-blue-600" />;
    }
  };

  if (isAnalyzing) {
    return (
      <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl p-12 flex flex-col items-center justify-center min-h-[600px]">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse"></div>
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative" />
        </div>
        <h3 className="text-xl font-semibold mb-4 text-white">Neural Processing Initiated</h3>
        <p className="text-gray-400 text-sm text-center max-w-xs">Deconstructing intent signals and sentiment vectors for @{lead.author}.</p>
      </div>
    );
  }

  return (
    <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1 bg-gray-900 rounded">
            {getPlatformIcon()}
          </div>
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{lead.platform} • Comment</span>
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2 leading-tight">{lead.content}</h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          {lead.analysis?.summary || "Analyzing post context to provide the best engagement strategy..."}
        </p>
      </div>

      <div className="p-6 space-y-6 overflow-y-auto">
        {/* Reply Style Controls */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-indigo-400" />
              <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Reply Style</h4>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCcw className="w-3 h-3" />}
              Regenerate
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Tone</label>
              <select 
                value={style.tone}
                onChange={(e) => setStyle({...style, tone: e.target.value as any})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-indigo-500"
              >
                <option>Casual</option>
                <option>Professional</option>
                <option>Witty</option>
                <option>Helpful</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Medium</label>
              <select 
                value={style.medium}
                onChange={(e) => setStyle({...style, medium: e.target.value as any})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-indigo-500"
              >
                <option>Subtle</option>
                <option>Direct</option>
                <option>Educational</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Length</label>
              <select 
                value={style.length}
                onChange={(e) => setStyle({...style, length: e.target.value as any})}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-300 outline-none focus:border-indigo-500"
              >
                <option>Short</option>
                <option>Medium</option>
                <option>Long</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Link</label>
              <div className="flex items-center h-[30px]">
                <button 
                  onClick={() => setStyle({...style, includeLink: !style.includeLink})}
                  className={`w-10 h-5 rounded-full transition-colors relative ${style.includeLink ? 'bg-indigo-600' : 'bg-gray-800'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${style.includeLink ? 'left-6' : 'left-1'}`} />
                </button>
                <span className="ml-2 text-[10px] font-bold text-gray-400 uppercase">{style.includeLink ? 'Include' : 'Exclude'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Content Preview</h4>
          <div className="bg-gray-900/30 border border-gray-800 rounded-xl p-5 relative min-h-[150px]">
            {isGenerating ? (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-xl">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-bold">S</div>
                  <span className="text-xs font-bold text-gray-300">@{brandContext.productName.toLowerCase()}</span>
                  <span className="text-[10px] text-gray-500">• Just now</span>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{reply}</p>
                <button className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors">
                  <ImageIcon className="w-4 h-4" /> Add Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-bold text-gray-200 transition-all border border-gray-700">
            <Eye className="w-4 h-4" /> View Post
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-bold text-gray-200 transition-all border border-gray-700">
            <Calendar className="w-4 h-4" /> Schedule
          </button>
          <button className="flex-[2] flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold text-white transition-all shadow-lg shadow-indigo-600/20">
            <Send className="w-4 h-4" /> Post Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
