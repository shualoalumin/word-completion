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
        // Use gemini-2.0-flash (1.5-flash deprecated in v1beta)
        const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";
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
    const models = [
      Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];
    
    let lastError: any = null;
    const apiKey = Deno.env.get("GEMINI_API_KEY") || Deno.env.get("GOOGLE_API_KEY");

    for (const model of models) {
      try {
        console.log(`AIClient: Trying model ${model}...`);
        const provider = new GeminiProvider(apiKey || "", model);
        const resultText = await provider.generateContent({
          systemPrompt,
          userPrompt,
          jsonMode
        });

        if (jsonMode) {
          try {
            const cleanedText = resultText.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleanedText);
          } catch (parseError) {
            console.error(`AIClient: JSON parse error for model ${model}:`, parseError);
            console.error("Raw response:", resultText);
            throw new Error("AI returned invalid JSON structure");
          }
        }

        return resultText;
      } catch (error: any) {
        lastError = error;
        console.warn(`AIClient: Model ${model} failed. Error:`, error.message);
        
        // If this wasn't the last model, try the next one
        if (model !== models[models.length - 1]) {
           console.log("AIClient: Attempting fallback to next model...");
           continue;
        }
      }
    }

    throw lastError || new Error("AI Generation failed with all available models");
  }
}
