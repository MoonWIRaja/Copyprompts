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
                
                The component should be built with:
                - Tailwind CSS
                - Lucide React icons
                - Modern, premium aesthetics
                
                Return ONLY the TSX code for the component. No markdown, no explanations.`
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

    const generatedCode = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ code: generatedCode });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
