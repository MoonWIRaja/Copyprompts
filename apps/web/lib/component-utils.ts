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

export type ComponentAnalysis = {
  primaryName: string | null;
  renderableNames: string[];
  exportedNames: string[];
  dependencies: string[];
  previewStrategy: 'explicit-demo' | 'compound-input' | 'auto-wrapper' | 'waiting';
  warnings: string[];
};

function uniqueOrdered(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function collectRenderableNames(code: string): string[] {
  const names: string[] = [];
  const patterns = [
    /(?:export\s+)?function\s+([A-Z][a-zA-Z0-9_]*)\s*\(/g,
    /(?:export\s+)?class\s+([A-Z][a-zA-Z0-9_]*)\s+extends/g,
    /(?:export\s+)?const\s+([A-Z][a-zA-Z0-9_]*)\s*=\s*(?:React\.)?(?:forwardRef|memo)\b/g,
    /(?:export\s+)?const\s+([A-Z][a-zA-Z0-9_]*)\s*=\s*(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>/g
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(code)) !== null) {
      const name = match[1];
      if (!name || /Context$|Provider$|Consumer$/.test(name)) continue;
      names.push(name);
    }
  }

  return uniqueOrdered(names);
}

function collectExportedNames(code: string): string[] {
  const names: string[] = [];
  const namedExportPattern = /export\s+\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = namedExportPattern.exec(code)) !== null) {
    const exportBody = match[1] || '';
    for (const item of exportBody.split(',')) {
      const localName = item.trim().split(/\s+as\s+/)[0]?.trim();
      if (localName && /^[A-Z][a-zA-Z0-9_]*$/.test(localName)) {
        names.push(localName);
      }
    }
  }

  const directExportPattern = /export\s+(?:default\s+)?(?:function|class|const)\s+([A-Z][a-zA-Z0-9_]*)/g;
  while ((match = directExportPattern.exec(code)) !== null) {
    if (match[1]) names.push(match[1]);
  }

  return uniqueOrdered(names);
}

function pickPrimaryComponentName(renderableNames: string[], exportedNames: string[]): string | null {
  const nonDemoNames = renderableNames.filter((name) => !/Demo$|Example$/.test(name));
  const exportedRenderableNames = exportedNames.filter((name) => nonDemoNames.includes(name));
  const candidates = exportedRenderableNames.length > 0 ? exportedRenderableNames : nonDemoNames;

  if (candidates.length === 0) return null;

  const prefixRoot = candidates
    .filter((name) => candidates.some((other) => other !== name && other.startsWith(name)))
    .sort((a, b) => a.length - b.length)[0];

  return prefixRoot || candidates[0] || null;
}

function findNameByPattern(names: string[], pattern: RegExp): string | null {
  return names.find((name) => pattern.test(name)) || null;
}

export function detectComponentName(code: string): string | null {
  const analysis = analyzeComponentCode(code);
  return analysis.primaryName;
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

export function analyzeComponentCode(code: string): ComponentAnalysis {
  const renderableNames = collectRenderableNames(code);
  const exportedNames = collectExportedNames(code);
  const primaryName = pickPrimaryComponentName(renderableNames, exportedNames);
  const dependencies = detectNpmDependencies(code);
  const hasExplicitDemo = renderableNames.some((name) => /Demo$|Example$/.test(name));
  const hasCompoundInputParts = Boolean(
    primaryName &&
    findNameByPattern(renderableNames, /(?:TextArea|Textarea)$/) &&
    findNameByPattern(renderableNames, /(?:Submit|Send|Button)$/)
  );
  const localImports = code.match(/from\s+['"]@\/[^'"]+['"]/g) || [];
  const warnings: string[] = [];

  if (!code.trim()) {
    return {
      primaryName: null,
      renderableNames: [],
      exportedNames: [],
      dependencies: [],
      previewStrategy: 'waiting',
      warnings: []
    };
  }

  if (!primaryName) {
    warnings.push('No renderable React component detected yet.');
  }

  if (!hasExplicitDemo && primaryName) {
    warnings.push('No demo component found. Preview will auto-generate a visible demo.');
  }

  if (localImports.length > 0) {
    warnings.push('Local shadcn/hooks imports are mocked in preview and kept in the final prompt.');
  }

  return {
    primaryName,
    renderableNames,
    exportedNames,
    dependencies,
    previewStrategy: hasExplicitDemo
      ? 'explicit-demo'
      : hasCompoundInputParts
        ? 'compound-input'
        : primaryName
          ? 'auto-wrapper'
          : 'waiting',
    warnings
  };
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

function stripPreviewOnlyTypeSyntax(code: string): string {
  return code
    .replace(/interface\s+[A-Z][a-zA-Z0-9_]*(?:\s+extends[^{]+)?\s*\{[\s\S]*?\n\}/g, '')
    .replace(/type\s+[A-Z][a-zA-Z0-9_]*\s*=\s*[\s\S]*?;/g, '')
    .replace(/([a-zA-Z0-9_.$]+)<[^<>\n]+>\s*\(/g, '$1(');
}

function buildAutoDemoSource(analysis: ComponentAnalysis): string {
  const rootName = analysis.primaryName;
  if (!rootName) return '';

  const textAreaName = findNameByPattern(analysis.renderableNames, /(?:TextArea|Textarea)$/);
  const submitName = findNameByPattern(analysis.renderableNames, /(?:Submit|Send|Button)$/);
  const hasCompoundInputParts = Boolean(textAreaName && submitName);

  return `
          const __CopypromptsAutoGeneratedDemo = () => {
            const RootComponent = safeEvalComponent(${JSON.stringify(rootName)});
            if (!RootComponent) return null;

            if (${JSON.stringify(hasCompoundInputParts)}) {
              const TextAreaComponent = safeEvalComponent(${JSON.stringify(textAreaName)});
              const SubmitComponent = safeEvalComponent(${JSON.stringify(submitName)});
              const [value, setValue] = useState('Preview message');
              const [loading, setLoading] = useState(false);
              const handleSubmit = () => {
                setLoading(true);
                window.setTimeout(() => setLoading(false), 800);
              };

              if (TextAreaComponent && SubmitComponent) {
                return (
                  <div className="w-full max-w-[420px]">
                    <RootComponent
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      onSubmit={handleSubmit}
                      loading={loading}
                      onStop={() => setLoading(false)}
                    >
                      <TextAreaComponent placeholder="Type a message..." />
                      <SubmitComponent />
                    </RootComponent>
                  </div>
                );
              }
            }

            return (
              <div className="w-full max-w-[420px]">
                <RootComponent>
                  <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-center text-sm text-zinc-500">
                    Auto preview content
                  </div>
                </RootComponent>
              </div>
            );
          };
`;
}

export function createPreviewDocument(code: string, displayName: string): string {
  const analysis = analyzeComponentCode(code);
  const detectedName = analysis.primaryName;
  const safeName = (detectedName || toPascalCase(displayName)).replace(/[^a-zA-Z0-9_]/g, '') || 'GeneratedComponent';
  const iconMocks = detectLucideIconMocks(code);
  const cleanCode = stripPreviewOnlyTypeSyntax(stripModuleSyntax(code));
  const autoDemoSource = buildAutoDemoSource(analysis);

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
        <script type="text/babel" data-presets="typescript,react">
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

          ${cleanCode}

          const safeEvalComponent = (name) => {
            try {
              const component = eval(name);
              return typeof component === 'function' ? component : null;
            } catch (error) {
              return null;
            }
          };

          ${autoDemoSource}

          const App = () => {
            try {
              let ComponentToRender = null;
              const searchOrder = ['${safeName}Demo', 'ChatInputDemo', 'Demo', 'Example', '__CopypromptsAutoGeneratedDemo', '${safeName}', 'App'];
              for (const name of searchOrder) {
                const component = safeEvalComponent(name);
                if (component) {
                  ComponentToRender = component;
                  break;
                }
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
