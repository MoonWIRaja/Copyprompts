import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt, currentCode, name, category } = await req.json();
    const safeName = name.replace(/\s+/g, '');

    // If currentCode exists, we ask AI to REFINe it. If not, generate new.
    const mode = currentCode ? "REFINE the existing code" : "GENERATE a new component";
    const context = currentCode ? `EXISTING CODE:\n${currentCode}` : "";

    const fullPrompt = `You are a Senior React Developer.
    TASK: ${mode} named "${safeName}" for category "${category}".
    INSTRUCTION: ${prompt}
    
    ${context}
    
    STRICT RULES:
    1. Language: Plain JavaScript/JSX only.
    2. Styling: Use Tailwind CSS.
    3. Syntax: Ensure every ternary operator (condition ? a : b) is complete.
    4. Safety: No TypeScript, no imports, no exports.
    5. Structure: Define only "const ${safeName} = () => { ... };".
    
    OUTPUT: Return ONLY the code block. NO explanations.`;

    const binPath = '/opt/nodejs/bin/gemini';
    const args = ['--model', 'auto', '-p', fullPrompt];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const child = spawn(binPath, args, {
          env: { ...process.env, TERM: 'xterm-256color' }
        });

        child.stdout.on('data', (data) => {
          controller.enqueue(encoder.encode(data.toString()));
        });

        child.stderr.on('data', (data) => {
          controller.enqueue(encoder.encode(data.toString()));
        });

        child.on('close', (code) => {
          controller.close();
        });

        child.on('error', (err) => {
          controller.enqueue(encoder.encode(`\n[SYSTEM ERROR]: ${err.message}`));
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}
