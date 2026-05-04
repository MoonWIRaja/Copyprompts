import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function POST(req: Request) {
  try {
    const { prompt, name, category } = await req.json();
    const safeName = name.replace(/\s+/g, '');

    console.log(`[Gemini CLI] Generating component with AUTO model: ${name}...`);

    const fullPrompt = `You are an expert React developer. Generate a high-quality React component.
    
    Component Name: ${name}
    Category: ${category}
    User Prompt: ${prompt}
    
    CRITICAL RULES:
    - Use plain JavaScript/JSX only. DO NOT use TypeScript, type annotations, or generics.
    - DO NOT use React.forwardRef with generic type parameters.
    - Use Tailwind CSS for all styling.
    - DO NOT import anything. All dependencies are available globally.
    - DO NOT use "export default" or "export". Define with "const ${safeName} = ..."
    - Return ONLY the raw JSX code. No markdown fences, no explanations.`;

    // Execute Gemini CLI with --model auto to avoid 404 errors
    // We also use --output-format text to get clean output
    const command = `/opt/nodejs/bin/gemini --model auto -p "${fullPrompt.replace(/"/g, '\\"')}"`;
    
    let output = '';
    try {
      // Execute with a longer timeout for complex generation
      output = execSync(command, { encoding: 'utf8', timeout: 90000 });
    } catch (execError: any) {
      console.error('[Gemini CLI] Execution failed:', execError.message);
      return NextResponse.json({ error: 'CLI Execution failed. Make sure you are logged in via "gemini hello"' }, { status: 500 });
    }

    let generatedCode = output;
    
    // Remove terminal colors/escapes
    generatedCode = generatedCode.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
    
    // Strip markdown fences if AI wraps code in them
    generatedCode = generatedCode
      .replace(/^```(?:jsx|tsx|javascript|typescript|js|ts|react)?\s*\n?/gm, '')
      .replace(/```\s*$/gm, '')
      .trim();

    // The CLI output can be messy with headers/footers. 
    // We want to extract just the component code.
    // If we see the header bars, we split by them.
    if (generatedCode.includes('▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀')) {
      const parts = generatedCode.split('▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀');
      if (parts.length > 1) {
        generatedCode = parts[1].split('▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄')[0].trim();
      }
    }

    return NextResponse.json({ code: generatedCode, method: 'cli-auto' });
  } catch (error: any) {
    console.error('Bridge Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
