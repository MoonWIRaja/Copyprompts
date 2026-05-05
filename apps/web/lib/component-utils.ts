export type ComponentCategory = {
  id: string;
  label: string;
  count: number;
};

export const componentCategories: ComponentCategory[] = [
  { id: 'ai-chats', label: 'AI Chats', count: 12 },
  { id: 'avatar', label: 'Avatar', count: 24 },
  { id: 'backgrounds', label: 'Backgrounds', count: 33 },
  { id: 'buttons', label: 'Buttons', count: 130 },
  { id: 'calendars', label: 'Calendars', count: 18 },
  { id: 'cards', label: 'Cards', count: 79 },
  { id: 'carousels', label: 'Carousels', count: 15 },
  { id: 'checkboxes', label: 'Checkboxes', count: 42 },
  { id: 'dropdowns', label: 'Dropdowns', count: 56 },
  { id: 'drawers', label: 'Drawers', count: 21 },
  { id: 'forms', label: 'Forms', count: 88 },
  { id: 'inputs', label: 'Inputs', count: 102 },
  { id: 'loadings', label: 'Loadings', count: 34 },
  { id: 'menus', label: 'Menus', count: 47 },
  { id: 'modals', label: 'Modals', count: 45 },
  { id: 'navbars', label: 'Navbars', count: 14 },
  { id: 'notifications', label: 'Notifications', count: 29 },
  { id: 'pagination', label: 'Pagination', count: 11 },
  { id: 'popovers', label: 'Popovers', count: 31 },
  { id: 'sidebars', label: 'Sidebars', count: 10 },
  { id: 'sign-in', label: 'Sign In', count: 8 },
  { id: 'sign-up', label: 'Sign Up', count: 8 },
  { id: 'sliders', label: 'Sliders', count: 22 },
  { id: 'tables', label: 'Tables', count: 39 },
  { id: 'tabs', label: 'Tabs', count: 28 },
  { id: 'toggles', label: 'Toggles', count: 25 },
  { id: 'tooltips', label: 'Tooltips', count: 15 },
  { id: 'uploads', label: 'Uploads', count: 19 }
];

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'component';
}

export function toPascalCase(input: string): string {
  const value = input
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join('');
  return value || 'GeneratedComponent';
}

export function detectComponentName(code: string): string | null {
  const match = code.match(/(?:export\s+)?(?:function|const|class)\s+([A-Z][a-zA-Z0-9_]*)/);
  return match?.[1] || null;
}

export function detectNpmDependencies(code: string): string[] {
  const dependencies = new Set<string>();
  const importPattern = /import(?:\s+type)?(?:[\s\S]*?)from\s+['"]([^'"]+)['"]/g;
  const sideEffectPattern = /import\s+['"]([^'"]+)['"]/g;

  for (const pattern of [importPattern, sideEffectPattern]) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(code)) !== null) {
      const source = match[1];
      if (!source || source.startsWith('.') || source.startsWith('@/')) continue;
      const packageName = source.startsWith('@')
        ? source.split('/').slice(0, 2).join('/')
        : source.split('/')[0] || source;
      if (packageName) dependencies.add(packageName);
    }
  }

  return [...dependencies].sort();
}

function detectLucideIconMocks(code: string): string {
  const lucideImports = code.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/g) || [];
  const iconNames = new Set<string>();

  for (const importLine of lucideImports) {
    const names = importLine.match(/\{([^}]+)\}/)?.[1] || '';
    for (const item of names.split(',')) {
      const [original, alias] = item.trim().split(/\s+as\s+/);
      const iconName = (alias || original || '').trim();
      if (/^[A-Z][a-zA-Z0-9_]*$/.test(iconName)) {
        iconNames.add(iconName);
      }
    }
  }

  return [...iconNames]
    .map((name) => `const ${name} = (props) => <span aria-hidden="true" {...props} style={{display:'inline-flex',width:props?.size||16,height:props?.size||16,alignItems:'center',justifyContent:'center'}}>+</span>;`)
    .join('\n');
}

function stripModuleSyntax(code: string): string {
  return code
    .replace(/^\s*['"]use client['"];?\s*/gm, '')
    .replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '')
    .replace(/import\s+['"].*?['"];?/g, '')
    .replace(/export\s+default\s+/g, '')
    .replace(/export\s+\{[^}]+\};?/g, '')
    .replace(/export\s+/g, '');
}

export function createPreviewDocument(code: string, displayName: string): string {
  const detectedName = detectComponentName(code);
  const safeName = (detectedName || toPascalCase(displayName)).replace(/[^a-zA-Z0-9_]/g, '') || 'GeneratedComponent';
  const detectedTypes = (code.match(/(?:interface|type)\s+([A-Z][a-zA-Z0-9]+)/g) || [])
    .map((typeName) => typeName.split(/\s+/)[1]);
  const typeMocks = detectedTypes.map((typeName) => `const ${typeName} = {};`).join('\n');
  const iconMocks = detectLucideIconMocks(code);
  const cleanCode = stripModuleSyntax(code);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          html, body { margin: 0; min-height: 100%; background: #fff; color: #111827; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
          body { min-height: 100vh; padding: 24px; display: flex; align-items: center; justify-content: center; }
          #root { width: 100%; display: flex; align-items: center; justify-content: center; }
          button, textarea, input, select { font: inherit; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel" data-presets="react,typescript">
          const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, createContext, useContext, forwardRef } = React;
          const cn = (...classes) => classes.flat(Infinity).filter(Boolean).join(' ');
          const toast = (message) => console.log('Toast:', message);
          const Button = forwardRef(({ className = '', children, ...props }, ref) => <button ref={ref} className={cn('inline-flex items-center justify-center rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium shadow-sm disabled:opacity-50', className)} {...props}>{children}</button>);
          const Textarea = forwardRef(({ className = '', ...props }, ref) => <textarea ref={ref} className={cn('min-h-20 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm shadow-sm', className)} {...props} />);
          const useTextareaResize = (value, rows = 1) => {
            const textareaRef = useRef(null);
            useLayoutEffect(() => {
              const textarea = textareaRef.current;
              if (!textarea) return;
              textarea.style.height = '0px';
              textarea.style.height = Math.max(textarea.scrollHeight, rows * 24) + 2 + 'px';
            }, [value, rows]);
            return textareaRef;
          };
          ${iconMocks}
          ${typeMocks}

          ${cleanCode}

          const App = () => {
            try {
              let ComponentToRender = null;
              const searchOrder = ['ChatInputDemo', 'Demo', 'Example', '${safeName}', 'App'];
              for (const name of searchOrder) {
                try {
                  const component = eval(name);
                  if (typeof component === 'function') {
                    ComponentToRender = component;
                    break;
                  }
                } catch (error) {}
              }
              if (!ComponentToRender) return <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-700">Waiting for a React component...</div>;
              return <ComponentToRender />;
            } catch (error) {
              return <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">Render Error: {error.message}</div>;
            }
          };

          ReactDOM.createRoot(document.getElementById('root')).render(<App />);
        </script>
      </body>
    </html>
  `;
}

export function buildIntegrationPrompt(input: {
  displayName: string;
  category: string;
  code: string;
}): string {
  const componentName = detectComponentName(input.code) || toPascalCase(input.displayName);
  const fileName = `${slugify(componentName)}.tsx`;
  const dependencies = detectNpmDependencies(input.code);
  const installCommand = dependencies.length > 0
    ? `npm install ${dependencies.join(' ')}`
    : '# No external npm dependencies detected';

  return `You are given a task to integrate an existing React component in the codebase

The codebase should support:
- shadcn project structure
- Tailwind CSS
- Typescript

If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.

Determine the default path for components and styles.
If default path for components is not /components/ui, provide instructions on why it's important to create this folder.

Component display name: ${input.displayName || componentName}
Component category: ${input.category}

Copy-paste this component to /components/ui folder:
\`\`\`tsx
${fileName}
${input.code.trim()}
\`\`\`

Install NPM dependencies:
\`\`\`bash
${installCommand}
\`\`\`
`;
}
