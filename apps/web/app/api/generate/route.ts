import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt, name, category } = await req.json();
    const safeName = name.replace(/\s+/g, '');

    const fullPrompt = `You are a Senior React Developer.
    TASK: Generate a single-file React component named "${safeName}" for category "${category}".
    REQUIREMENT: ${prompt}
    
    STRICT SYNTAX RULES:
    1. Language: Plain JavaScript/JSX only.
    2. Styling: Use Tailwind CSS.
    3. Syntax: Ensure every ternary operator (condition ? a : b) is complete with both parts.
    4. Safety: No TypeScript annotations, no imports, no exports.
    5. Structure: Define only "const ${safeName} = () => { ... };".
    6. Quality: Generate high-end, premium UI components.
    
    OUTPUT: Return ONLY the code block. NO explanations.`;

    const binPath = '/opt/nodejs/bin/gemini';
    // Using 'auto' as requested by the user.
    const args = ['--model', 'auto', '-p', fullPrompt];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        console.log(`[Gemini CLI v2.1] Requesting AUTO generation for: ${name}...`);
        
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
          console.log(`[Gemini CLI v2.1] Finished with code ${code}`);
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
