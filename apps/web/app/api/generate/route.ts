import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';

export async function POST(req: Request) {
  try {
    const { prompt, name, category } = await req.json();
    const safeName = name.replace(/\s+/g, '');

    console.log(`[Gemini CLI] Attempting generation for: ${name}...`);

    const fullPrompt = `You are an expert React developer. Generate a high-quality React component.
    
    Component Name: ${name}
    Category: ${category}
    User Prompt: ${prompt}
    
    CRITICAL RULES:
    - Use plain JavaScript/JSX only. No TypeScript.
    - No imports.
    - No exports. Define with "const ${safeName} = ..."
    - Return ONLY raw code.`;

    // Use spawnSync with arguments array to avoid shell syntax errors
    const binPath = '/opt/nodejs/bin/gemini';
    const args = ['--model', 'auto', '-p', fullPrompt];
    
    const result = spawnSync(binPath, args, { 
      encoding: 'utf8', 
      timeout: 90000,
      env: { ...process.env, TERM: 'xterm-256color' } // Ensure colors are handled
    });

    let output = result.stdout || result.stderr || '';
    
    if (result.status !== 0) {
      console.error('[Gemini CLI] Failed:', output);
      
      if (output.includes('429') || output.includes('Too Many Requests')) {
        return NextResponse.json({ 
          error: 'Google Gemini is temporarily throttled (Rate Limit 429). Please wait 5 minutes.' 
        }, { status: 429 });
      }
      
      return NextResponse.json({ error: `CLI Error: ${output.substring(0, 200)}` }, { status: 500 });
    }

    let generatedCode = output;
    
    // Cleanup ANSI and boxes
    generatedCode = generatedCode.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    
    // Extraction logic for component code
    if (generatedCode.includes('▀▀▀▀▀▀▀▀')) {
      const parts = generatedCode.split('▀▀▀▀▀▀▀▀');
      for (const part of parts) {
        if (part.includes('const ') || part.includes('React.')) {
          const splitPart = part.split('▄▄▄▄▄▄▄▄');
          generatedCode = splitPart[0]?.trim() || '';
          break;
        }
      }
    }

    // Final safety strip for markdown fences
    generatedCode = generatedCode
      .replace(/^```(?:jsx|tsx|javascript|js|react)?\s*\n?/gm, '')
      .replace(/```\s*$/gm, '')
      .trim();

    return NextResponse.json({ code: generatedCode, method: 'cli-spawn' });
  } catch (error: any) {
    console.error('Bridge Critical Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
