import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const { prompt, name, category } = await req.json();
  const safeName = name.replace(/\s+/g, '');

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
  const args = ['--model', 'gemini-1.5-flash', '-p', fullPrompt];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      console.log(`[Gemini CLI] Starting streaming generation for: ${name}...`);
      
      const child = spawn(binPath, args, {
        env: { ...process.env, TERM: 'xterm-256color' }
      });

      child.stdout.on('data', (data) => {
        // Send raw CLI output to the client
        controller.enqueue(encoder.encode(data.toString()));
      });

      child.stderr.on('data', (data) => {
        // Also send errors/progress from stderr
        controller.enqueue(encoder.encode(`\n[ERROR/PROGRESS]: ${data.toString()}`));
      });

      child.on('close', (code) => {
        console.log(`[Gemini CLI] Process finished with code ${code}`);
        controller.close();
      });

      child.on('error', (err) => {
        controller.enqueue(encoder.encode(`\n[CRITICAL ERROR]: ${err.message}`));
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
}
