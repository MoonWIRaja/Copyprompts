import { NextResponse } from 'next/server';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function callGemini(endpoint: string, model: string, apiKey: string, body: object): Promise<Response> {
  return fetch(`${endpoint}/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const { prompt, name, category } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const fallbackModel = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.0-flash';
    const endpoint = process.env.GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models';

    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json({ 
        error: 'API Key not configured. Please add your GEMINI_API_KEY to the .env file.' 
      }, { status: 500 });
    }

    const safeName = name.replace(/\s+/g, '');

    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `You are an expert React developer. Generate a high-quality React component based on this request.
                
                Component Name: ${name}
                Category: ${category}
                User Prompt: ${prompt}
                
                CRITICAL RULES:
                - Use plain JavaScript/JSX only. DO NOT use TypeScript, type annotations, interfaces, generics, or "as" casts.
                - DO NOT use React.forwardRef with generic type parameters.
                - Use Tailwind CSS for all styling.
                - You may use Lucide React icons (assume they are globally available, do not import them).
                - DO NOT import anything. All dependencies (React, lucide icons) are already available globally.
                - DO NOT use "export default" or "export". Just define the component with "const ${safeName} = ..."
                - Modern, premium aesthetics with dark theme support.
                - The component must be self-contained and render something visible.
                
                Return ONLY the raw JSX code. No markdown fences, no backticks, no explanations, no imports.`
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    // Try primary model with retries, then fallback
    const modelsToTry = [primaryModel, fallbackModel];
    let lastError = '';

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const response = await callGemini(endpoint, model, apiKey, requestBody);
          const data = await response.json();

          if (response.ok) {
            let generatedCode = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Strip markdown fences if AI wraps code in them
            generatedCode = generatedCode
              .replace(/^```(?:jsx|tsx|javascript|typescript|js|ts|react)?\s*\n?/gm, '')
              .replace(/```\s*$/gm, '')
              .trim();

            return NextResponse.json({ code: generatedCode, model });
          }

          lastError = data.error?.message || 'Unknown error';
          
          // If overloaded, wait and retry
          if (response.status === 429 || response.status === 503 || lastError.includes('high demand')) {
            console.log(`[Gemini] ${model} attempt ${attempt + 1}/${MAX_RETRIES} failed: ${lastError}. Retrying...`);
            await sleep(RETRY_DELAY_MS * (attempt + 1));
            continue;
          }

          // Other errors — skip to fallback immediately
          break;
        } catch (fetchError: any) {
          lastError = fetchError.message;
          await sleep(RETRY_DELAY_MS);
        }
      }
      console.log(`[Gemini] ${model} exhausted. Trying fallback...`);
    }

    throw new Error(`All models failed. Last error: ${lastError}`);
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
