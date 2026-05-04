import { spawn } from 'child_process';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { prompt, currentCode, name, category } = await req.json();
    const safeName = name.replace(/\s+/g, '');

    const fullPrompt = `You are an Expert UI Architect specializing in Shadcn/UI and Tailwind CSS.
    TASK: Generate a complete integration guide for a React component named "${safeName}" for "${category}".
    
    USER INSTRUCTION: ${prompt}
    ${currentCode ? `EXISTING CONTEXT:\n${currentCode}` : ""}

    OUTPUT STRUCTURE (Strictly follow this format in a single response):
    
    1. Introduction: "You are given a task to integrate an existing React component in the codebase..."
    2. Support List: Mention Shadcn, Tailwind, and Typescript.
    3. Setup Instructions: Brief setup guide.
    4. Component Code: 
       \`\`\`tsx
       ${safeName.toLowerCase()}.tsx
       [COMPREHENSIVE COMPONENT CODE HERE]
       \`\`\`
    
    5. Demo Code:
       \`\`\`tsx
       demo.tsx
       [WORKING DEMO CODE HERE]
       \`\`\`
    
    6. Dependencies Code:
       \`\`\`tsx
       [NAME/PATH]
       [DEPENDENCY CODE (e.g. Button, Textarea, Hooks)]
       \`\`\`
    
    7. Install Command:
       \`\`\`bash
       [NPM INSTALL COMMAND]
       \`\`\`

    STRICT RULES:
    - Use plain JavaScript/JSX for all components.
    - Use Tailwind CSS.
    - Ensure all dependencies are self-contained or provided in the guide.
    - DO NOT use TypeScript types in the actual code (use JS), but the guide should say it supports TS.`;

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

        child.on('close', () => controller.close());
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
