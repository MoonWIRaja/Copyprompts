import { NextResponse } from 'next/server';
import { spawnSync } from 'child_process';

const MAX_RETRIES = 2;
const RETRY_DELAY = 3000; // 3 seconds

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  try {
    const { prompt, name, category } = await req.json();
    const safeName = name.replace(/\s+/g, '');

    console.log(`[Gemini CLI] Generating component: ${name}...`);

    const fullPrompt = `You are an expert React developer. Generate a high-quality React component.
    
    Component Name: ${name}
    Category: ${category}
    User Prompt: ${prompt}
    
    CRITICAL RULES:
    - Use plain JavaScript/JSX only. No TypeScript.
    - No imports.
    - No exports. Define with "const ${safeName} = ..."
    - Return ONLY raw code.`;

    const binPath = '/opt/nodejs/bin/gemini';
    const args = ['--model', 'auto', '-p', fullPrompt];
    
    let output = '';
    let lastError = '';
    let success = false;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const result = spawnSync(binPath, args, { 
        encoding: 'utf8', 
        timeout: 120000, // 2 minutes for heavy generation
        env: { ...process.env, TERM: 'xterm-256color' }
      });

      output = result.stdout || result.stderr || '';
      
      if (result.status === 0) {
        success = true;
        break;
      }

      lastError = output;
      console.warn(`[Gemini CLI] Attempt ${attempt + 1} failed. Error: ${lastError.substring(0, 100)}`);

      if (lastError.includes('429') || lastError.includes('Too Many Requests')) {
        if (attempt < MAX_RETRIES) {
          console.log(`[Gemini CLI] Rate limited. Sleeping for ${RETRY_DELAY}ms before retry...`);
          await sleep(RETRY_DELAY * (attempt + 1));
          continue;
        }
        return NextResponse.json({ 
          error: 'Google Gemini is still throttled. Please wait a minute before trying again.' 
        }, { status: 429 });
      }

      // If it's not a 429, don't bother retrying unless you want to try npx fallback
      break;
    }

    if (!success) {
      return NextResponse.json({ error: `CLI Error: ${lastError.substring(0, 200)}` }, { status: 500 });
    }

    let generatedCode = output;
    generatedCode = generatedCode.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    
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

    generatedCode = generatedCode
      .replace(/^```(?:jsx|tsx|javascript|js|react)?\s*\n?/gm, '')
      .replace(/```\s*$/gm, '')
      .trim();

    return NextResponse.json({ code: generatedCode, method: 'cli-retry' });
  } catch (error: any) {
    console.error('Bridge Critical Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
