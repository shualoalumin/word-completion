import { AIProvider, AIProviderName } from "./types.ts";
import { GeminiProvider } from "./gemini.ts";

export class AIClient {
  private provider: AIProvider;

  constructor() {
    // Default to Gemini if not specified
    const providerName = (Deno.env.get("AI_PROVIDER") as AIProviderName) || "gemini";

    switch (providerName) {
      case "gemini": {
        const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY is not configured");
        }
        // Force gemini-1.5-flash for maximum reliability
        const model = Deno.env.get("GEMINI_MODEL") || "gemini-1.5-flash";
        this.provider = new GeminiProvider(apiKey, model);
        break;
      }

      case "openai": {
        throw new Error("OpenAI provider not yet implemented");
      }

      case "lovable": {
        throw new Error("Lovable provider is deprecated. Please migrate to Gemini or OpenAI.");
      }

      default: {
        throw new Error(`Unsupported AI provider: ${providerName}`);
      }
    }
  }

  async generate(systemPrompt: string, userPrompt: string, jsonMode: boolean = true): Promise<any> {
    try {
      const resultText = await this.provider.generateContent({
        systemPrompt,
        userPrompt,
        jsonMode
      });

      if (jsonMode) {
        try {
          // Clean up markdown code blocks if AI included them
          const cleanedText = resultText.replace(/```json\n?|\n?```/g, '').trim();
          return JSON.parse(cleanedText);
        } catch (_e) {
          console.error("Failed to parse AI JSON. Raw response:", resultText);
          throw new Error("AI returned invalid JSON structure");
        }
      }

      return resultText;
    } catch (error) {
      console.error("AI Generation Error:", error);
      throw error;
    }
  }
}

