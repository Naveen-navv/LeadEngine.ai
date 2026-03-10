
export enum Platform {
  REDDIT = 'Reddit',
  X = 'X (Twitter)',
  LINKEDIN = 'LinkedIn'
}

export enum PainPointCategory {
  EFFICIENCY = 'Efficiency',
  COST = 'Cost',
  TECHNICAL_DEBT = 'Technical Debt',
  SCALING = 'Scaling'
}

export enum Persona {
  TECHNICAL = 'Technical Stakeholder',
  DECISION_MAKER = 'Decision Maker',
  END_USER = 'End User'
}

export interface LeadScore {
  intentSignal: number;
  authorityProxy: number;
  urgencyKeyword: number;
  problemClarity: number;
  total: number;
}

export interface Lead {
  id: string;
  platform: Platform;
  author: string;
  content: string;
  url: string;
  timestamp: string;
  analysis?: LeadAnalysis;
}

export interface LeadAnalysis {
  category: PainPointCategory;
  persona: Persona;
  sentiment: 'Low' | 'Medium' | 'High';
  urgency: 'Low' | 'Medium' | 'High';
  summary: string;
  score: LeadScore;
  suggestedOutreach: string;
}

export interface BrandContext {
  websiteUrl: string;
  productName: string;
  productDescription: string;
  audienceSegments: string[];
}

export interface User {
  id: string;
  googleId: string;
  displayName: string;
  email: string;
  avatar: string;
}

export type ViewState = 'DASHBOARD' | 'CONTEXT' | 'LEADS' | 'STRATEGY';

export interface ReplyStyle {
  tone: 'Casual' | 'Professional' | 'Witty' | 'Helpful';
  medium: 'Subtle' | 'Direct' | 'Educational';
  length: 'Short' | 'Medium' | 'Long';
  includeLink: boolean;
}

export interface GeneratedReply {
  content: string;
  timestamp: string;
}
