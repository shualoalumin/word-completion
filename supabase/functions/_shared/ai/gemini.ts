import { AICompletionRequest, AIProvider } from "./types.ts";

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-2.0-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateContent(request: AICompletionRequest): Promise<string> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Models like 2.0-flash are v1beta only. 1.5-flash-8b works better on v1 in some regions.
        // We will try v1beta first as it's the most common for these models, and fallback to v1 on 404.
        let apiVersion = "v1beta";
        
        // standard prefix check
        const modelPath = this.model.startsWith("models/") ? this.model : `models/${this.model}`;
        
        const fetchWithVersion = async (v: string) => {
          const url = `https://generativelanguage.googleapis.com/${v}/${modelPath}:generateContent?key=${this.apiKey}`;
          return await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                role: "user",
                parts: [{ text: request.systemPrompt + "\n\n" + request.userPrompt }]
              }],
              generationConfig: {
                temperature: 0.1, 
                maxOutputTokens: 1000,
              }
            }),
          });
        };

        console.log(`Calling Gemini API (${this.model}), Attempt ${attempt + 1}...`);
        let response = await fetchWithVersion(apiVersion);

        // Handle 404 by trying v1
        if (response.status === 404 && apiVersion === "v1beta") {
          console.warn(`Model ${this.model} not found in v1beta. Trying v1...`);
          apiVersion = "v1";
          response = await fetchWithVersion(apiVersion);
        }

        if (response.status === 429) {
          const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
          console.warn(`Rate limit hit (429). Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempt++;
          continue;
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API Error (HTTP ${response.status}):`, errorText);
          
          if (response.status >= 500) {
             const delay = 1000 * (attempt + 1);
             console.warn(`Server error (${response.status}). Retrying in ${delay}ms...`);
             await new Promise(resolve => setTimeout(resolve, delay));
             attempt++;
             continue;
          }
          
          throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error("Gemini returned no candidates.");
        }

        return data.candidates[0].content.parts[0].text;
      } catch (err: any) {
        lastError = err as Error;
        console.error(`Attempt ${attempt + 1} failed:`, err?.message || 'Unknown error');
        attempt++;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    throw lastError || new Error("Failed after maximum retries");
  }
}

