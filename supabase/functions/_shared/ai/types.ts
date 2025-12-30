export interface AICompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  jsonMode?: boolean;
}

export interface AIProvider {
  generateContent(request: AICompletionRequest): Promise<string>;
}

export type AIProviderName = 'lovable' | 'openai' | 'gemini';





