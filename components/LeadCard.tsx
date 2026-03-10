
import React from 'react';
import { Lead, Platform } from '../types';
import { MessageSquare, Twitter, Linkedin, Copy, Eye, Calendar, Send, Zap } from 'lucide-react';

interface Props {
  lead: Lead;
  isSelected: boolean;
  onClick: () => void;
}

const LeadCard: React.FC<Props> = ({ lead, isSelected, onClick }) => {
  const getPlatformIcon = () => {
    switch (lead.platform) {
      case Platform.REDDIT: return <MessageSquare className="w-4 h-4 text-orange-500" />;
      case Platform.X: return <Twitter className="w-4 h-4 text-sky-400" />;
      case Platform.LINKEDIN: return <Linkedin className="w-4 h-4 text-blue-600" />;
    }
  };

  const isHighImpact = lead.analysis?.score.total && lead.analysis.score.total > 85;

  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer p-4 rounded-xl border transition-all duration-200 bg-[#0b0f1a] ${
        isSelected 
        ? 'border-indigo-500 ring-1 ring-indigo-500/50 shadow-indigo-500/10' 
        : 'border-gray-800 hover:border-gray-700'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-gray-900 rounded">
            {getPlatformIcon()}
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{lead.platform}</span>
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">• Comment</span>
        </div>
        {isHighImpact && (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] font-bold text-emerald-400 uppercase">
            <Zap className="w-2.5 h-2.5" /> High Impact
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-gray-200 mb-4 line-clamp-2 leading-snug">
        {lead.content}
      </h3>

      <div className="flex items-center gap-2 mt-auto">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gray-900 hover:bg-gray-800 rounded text-[10px] font-bold text-gray-400 transition-colors border border-gray-800">
          <Copy className="w-3 h-3" /> Copy
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gray-900 hover:bg-gray-800 rounded text-[10px] font-bold text-gray-400 transition-colors border border-gray-800">
          <Eye className="w-3 h-3" /> View
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gray-900 hover:bg-gray-800 rounded text-[10px] font-bold text-gray-400 transition-colors border border-gray-800">
          <Calendar className="w-3 h-3" /> Schedule
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gray-900 hover:bg-gray-800 rounded text-[10px] font-bold text-gray-400 transition-colors border border-gray-800">
          <Send className="w-3 h-3" /> Post Now
        </button>
      </div>
    </div>
  );
};

export default LeadCard;
