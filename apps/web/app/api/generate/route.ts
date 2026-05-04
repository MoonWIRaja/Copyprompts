import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt, name, category } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const endpoint = process.env.GEMINI_API_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models';

    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json({ 
        error: 'API Key not configured. Please add your GEMINI_API_KEY to the .env file.' 
      }, { status: 500 });
    }

    const response = await fetch(`${endpoint}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
                - DO NOT use "export default" or "export". Just define the component with "const ${name.replace(/\s+/g, '')} = ..."
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
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate content');
    }

    let generatedCode = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Strip markdown fences if AI wraps code in them
    generatedCode = generatedCode
      .replace(/^```(?:jsx|tsx|javascript|typescript|js|ts|react)?\s*\n?/gm, '')
      .replace(/```\s*$/gm, '')
      .trim();

    return NextResponse.json({ code: generatedCode });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
