import { AICompletionRequest, AIProvider } from "./types.ts";

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "gemini-2.5-flash") {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generateContent(request: AICompletionRequest): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: request.systemPrompt + "\n\n" + request.userPrompt }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: request.jsonMode ? "application/json" : "text/plain",
        temperature: 0.3, // Lower temperature for faster, more focused responses
        maxOutputTokens: 500, // Limit response length for faster generation
      }
    };

    console.log(`Calling Gemini API (${this.model})...`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
      throw new Error(`Gemini API Error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    
    // Safety check for response structure
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Gemini returned no candidates.");
    }

    const content = data.candidates[0].content;
    if (!content || !content.parts || content.parts.length === 0) {
      throw new Error("Gemini returned empty content.");
    }

    return content.parts[0].text;
  }
}

