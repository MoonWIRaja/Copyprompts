import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

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

    // Try multiple ways to call the CLI
    const commands = [
      `/opt/nodejs/bin/gemini --model auto -p "${fullPrompt.replace(/"/g, '\\"')}"`,
      `npx @google/gemini-cli --model auto -p "${fullPrompt.replace(/"/g, '\\"')}"`
    ];
    
    let output = '';
    let lastError = '';

    for (const cmd of commands) {
      try {
        output = execSync(cmd, { encoding: 'utf8', timeout: 90000 });
        if (output) break; 
      } catch (execError: any) {
        lastError = execError.stdout || execError.stderr || execError.message;
        console.warn(`[Gemini CLI] Command failed: ${cmd.substring(0, 20)}... Error: ${lastError.substring(0, 100)}`);
        
        // If it's a 429 Rate Limit error, we should inform the user specifically
        if (lastError.includes('429') || lastError.includes('Too Many Requests')) {
          return NextResponse.json({ 
            error: 'Google Gemini is temporarily throttled (Rate Limit 429). Please wait 5 minutes and try again.' 
          }, { status: 429 });
        }
      }
    }

    if (!output) {
      return NextResponse.json({ error: `CLI failed: ${lastError.substring(0, 200)}` }, { status: 500 });
    }

    let generatedCode = output;
    
    // Cleanup ANSI and boxes
    generatedCode = generatedCode.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    
    if (generatedCode.includes('▀▀▀▀▀▀▀▀')) {
      const parts = generatedCode.split('▀▀▀▀▀▀▀▀');
      for (const part of parts) {
        if (part.includes('const ') || part.includes('React.')) {
          generatedCode = part.split('▄▄▄▄▄▄▄▄')[0].trim();
          break;
        }
      }
    }

    // Final safety strip for markdown fences
    generatedCode = generatedCode
      .replace(/^```(?:jsx|tsx|javascript|js|react)?\s*\n?/gm, '')
      .replace(/```\s*$/gm, '')
      .trim();

    return NextResponse.json({ code: generatedCode, method: 'cli-bridge' });
  } catch (error: any) {
    console.error('Bridge Critical Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
