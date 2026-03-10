
import { GoogleGenAI, Type } from "@google/genai";
import { Platform, Lead, PainPointCategory, Persona, LeadAnalysis, BrandContext, ReplyStyle } from "../types";

const API_KEY = process.env.API_KEY || "";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  async discoverLeads(niche: string, platform: Platform): Promise<Lead[]> {
    const prompt = `Find 3 recent, high-intent ${platform} posts from real users discussing problems, frustrations, or needs related to: ${niche}. 
    Focus on active problem states like "How do I...", "Frustrated with...", or "Alternative to...".
    Return the results in the specific format required.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                author: { type: Type.STRING },
                content: { type: Type.STRING },
                url: { type: Type.STRING },
                timestamp: { type: Type.STRING }
              },
              required: ["author", "content", "url", "timestamp"]
            }
          }
        }
      });

      const rawText = response.text;
      const parsedLeads = JSON.parse(rawText) as any[];

      return parsedLeads.map((l, index) => ({
        id: `lead-${Date.now()}-${index}`,
        platform,
        author: l.author,
        content: l.content,
        url: l.url,
        timestamp: l.timestamp || new Date().toISOString()
      }));
    } catch (error) {
      console.error("Error discovering leads:", error);
      return this.getFallbackLeads(niche, platform);
    }
  }

  async analyzeLead(lead: Lead, businessValueProp: string): Promise<LeadAnalysis> {
    const systemInstruction = `
      You are the Core Intelligence Engine for an elite Social Media Lead Generation Platform.
      Analyze the provided social media post and generate a structured analysis.
      
      Operational Guardrails:
      - Determine 'Pain Point Category': Efficiency, Cost, Technical Debt, or Scaling.
      - Extract User Persona: Technical Stakeholder, Decision Maker, or End User.
      - Sentiment Mapping: Detect urgency levels and emotional drivers.
      - Execute Lead Scoring (0-100): Intent Signal (40%), Authority Proxy (20%), Urgency (20%), Problem Clarity (20%).
      - Generate Outreach: Zero-pitch start, Anti-AI filter (no "hope this finds you well"), Brefity rule (X/LinkedIn < 3 sentences, Reddit < 5), Soft-CTA.
    `;

    const prompt = `
      POST CONTENT: "${lead.content}"
      PLATFORM: ${lead.platform}
      OUR VALUE PROPOSITION: "${businessValueProp}"
      
      Generate a detailed analysis of this lead.
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING, enum: Object.values(PainPointCategory) },
            persona: { type: Type.STRING, enum: Object.values(Persona) },
            sentiment: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            urgency: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            summary: { type: Type.STRING },
            score: {
              type: Type.OBJECT,
              properties: {
                intentSignal: { type: Type.NUMBER },
                authorityProxy: { type: Type.NUMBER },
                urgencyKeyword: { type: Type.NUMBER },
                problemClarity: { type: Type.NUMBER },
                total: { type: Type.NUMBER }
              },
              required: ["intentSignal", "authorityProxy", "urgencyKeyword", "problemClarity", "total"]
            },
            suggestedOutreach: { type: Type.STRING }
          },
          required: ["category", "persona", "sentiment", "urgency", "summary", "score", "suggestedOutreach"]
        }
      }
    });

    return JSON.parse(response.text) as LeadAnalysis;
  }

  async generateReply(lead: Lead, style: ReplyStyle, brandContext: BrandContext): Promise<string> {
    const prompt = `
      As a social media engagement expert for ${brandContext.productName}, generate a reply to the following post.
      
      POST CONTENT: "${lead.content}"
      PLATFORM: ${lead.platform}
      
      REPLY STYLE:
      - Tone: ${style.tone}
      - Approach: ${style.medium}
      - Length: ${style.length}
      - Include Link: ${style.includeLink ? 'Yes (use ' + brandContext.websiteUrl + ')' : 'No'}
      
      OUR PRODUCT: ${brandContext.productDescription}
      
      GUIDELINES:
      - Be human, not robotic.
      - Avoid common AI phrases.
      - If subtle, don't mention the product directly, just offer value.
      - If direct, explain how we solve their specific problem.
      - Return ONLY the reply text.
    `;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Failed to generate reply.";
  }

  async analyzeWebsite(url: string): Promise<Partial<BrandContext>> {
    const prompt = `Search for and analyze the website: ${url}. 
    Provide a professional product name, a concise business description (max 2 sentences), and 3-4 target audience segments.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
              productDescription: { type: Type.STRING },
              audienceSegments: { 
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["productName", "productDescription", "audienceSegments"]
          }
        }
      });
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Error analyzing website:", error);
      return {
        productName: url.replace('https://', '').replace('www.', '').split('.')[0],
        productDescription: "Custom business context analyzed from provided URL.",
        audienceSegments: ["Target Segment 1", "Target Segment 2"]
      };
    }
  }

  private getFallbackLeads(niche: string, platform: Platform): Lead[] {
    const now = new Date().toISOString();
    if (platform === Platform.REDDIT) {
      return [
        {
          id: 'mock-1',
          platform: Platform.REDDIT,
          author: 'dev_guy_99',
          content: `I'm honestly so tired of our current CRM. It takes forever to load customer profiles and the UI is from 2005. Anyone found a lightweight alternative that actually works for small teams? Specifically looking for something with good API documentation.`,
          url: 'https://reddit.com/r/saas/comments/example1',
          timestamp: now
        },
        {
          id: 'mock-2',
          platform: Platform.REDDIT,
          author: 'marketing_queen',
          content: `Does anyone else struggle with lead attribution? We are spending $10k/mo on ads but have no idea which LinkedIn posts are actually driving conversions. Is there a tool that maps social engagement to CRM leads automatically?`,
          url: 'https://reddit.com/r/marketing/comments/example2',
          timestamp: now
        }
      ];
    }
    return [];
  }
}

export const gemini = new GeminiService();
