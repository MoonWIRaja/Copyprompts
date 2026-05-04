import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt, name, category } = await req.json();
    const safeName = name.replace(/\s+/g, '');

    const fullPrompt = `TASK: Generate a React component named "${safeName}" for category "${category}".
    DESCRIPTION: ${prompt}
    
    STRICT RULES:
    - Use plain JavaScript/JSX ONLY (NO TypeScript).
    - Use Tailwind CSS.
    - DO NOT use React.forwardRef with types.
    - DO NOT import anything.
    - DO NOT explain anything.
    - OUTPUT ONLY THE CODE.`;

    const binPath = '/opt/nodejs/bin/gemini';
    // Using --model auto as requested for best intelligence
    const args = ['--model', 'auto', '-p', fullPrompt];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        console.log(`[Gemini CLI v2] Requesting AUTO generation for: ${name}...`);
        
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
          console.log(`[Gemini CLI v2] Closed with code ${code}`);
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
