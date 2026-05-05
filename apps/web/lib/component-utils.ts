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

  return prefixRoot || candidates[candidates.length - 1] || null;
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

function detectNamespaceImports(code: string): { name: string; pkg: string }[] {
  const results: { name: string; pkg: string }[] = [];
  const pattern = /import\s+\*\s+as\s+([A-Za-z_][A-Za-z0-9_]*)\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(code)) !== null) {
    if (match[1] && match[2]) results.push({ name: match[1], pkg: match[2] });
  }
  return results;
}

function generateNamespaceMock(name: string, pkg: string): string {
  if (pkg.startsWith('@radix-ui/react-tooltip')) {
    return `const ${name} = {
      Provider: ({children}) => children,
      Root: ({children, open, defaultOpen, onOpenChange, delayDuration}) => React.createElement(React.Fragment, null, children),
      Trigger: forwardRef(({children, asChild, ...props}, ref) => asChild && React.isValidElement(children) ? React.cloneElement(children, {...props, ref}) : React.createElement('span', {...props, ref}, children)),
      Content: forwardRef(({children, className, sideOffset, side, align, ...props}, ref) => React.createElement('div', {ref, style:{display:'none'}, className, ...props}, children)),
      Portal: ({children}) => children,
      Arrow: () => null,
    };`;
  }
  if (pkg.startsWith('@radix-ui/react-dialog')) {
    return `const ${name} = (() => {
      const _open = new WeakMap();
      const Root = ({children, open, defaultOpen, onOpenChange, modal}) => (open !== undefined ? open : !!defaultOpen) ? React.createElement(React.Fragment, null, children) : null;
      const Portal = ({children}) => children;
      const Overlay = forwardRef(({className, ...props}, ref) => React.createElement('div', {ref, style:{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',zIndex:50}, className, ...props}));
      const Content = forwardRef(({children, className, onOpenAutoFocus, onCloseAutoFocus, onEscapeKeyDown, onInteractOutside, ...props}, ref) => React.createElement('div', {ref, style:{position:'fixed',left:'50%',top:'50%',transform:'translate(-50%,-50%)',zIndex:51}, className, ...props}, children));
      const Close = forwardRef(({children, asChild, ...props}, ref) => React.createElement('button', {...props, ref}, children));
      const Title = forwardRef(({children, className, ...props}, ref) => React.createElement('h2', {ref, className, ...props}, children));
      const Description = forwardRef(({children, className, ...props}, ref) => React.createElement('p', {ref, className, ...props}, children));
      const Trigger = forwardRef(({children, asChild, ...props}, ref) => asChild && React.isValidElement(children) ? React.cloneElement(children, {...props, ref}) : React.createElement('button', {...props, ref}, children));
      return { Root, Portal, Overlay, Content, Close, Title, Description, Trigger };
    })();`;
  }
  if (pkg.startsWith('@radix-ui/react-select')) {
    return `const ${name} = {
      Root: ({children}) => children,
      Trigger: forwardRef(({children, ...props}, ref) => React.createElement('button', {...props, ref}, children)),
      Value: ({children, placeholder}) => React.createElement('span', null, children || placeholder),
      Icon: ({children}) => children || React.createElement('span', null, '▾'),
      Portal: ({children}) => children,
      Content: forwardRef(({children, ...props}, ref) => React.createElement('div', {...props, ref}, children)),
      Item: forwardRef(({children, value, ...props}, ref) => React.createElement('div', {...props, ref}, children)),
      ItemText: ({children}) => children,
      Group: ({children}) => children,
      Label: ({children}) => React.createElement('div', {style:{fontWeight:600}}, children),
      Separator: () => React.createElement('hr', null),
      ScrollUpButton: () => null,
      ScrollDownButton: () => null,
    };`;
  }
  if (pkg.startsWith('@radix-ui/react-popover')) {
    return `const ${name} = {
      Root: ({children}) => children,
      Trigger: forwardRef(({children, asChild, ...props}, ref) => asChild && React.isValidElement(children) ? React.cloneElement(children, {...props, ref}) : React.createElement('button', {...props, ref}, children)),
      Content: forwardRef(({children, className, ...props}, ref) => React.createElement('div', {ref, style:{position:'absolute',zIndex:50,background:'#1F2023',border:'1px solid #333',borderRadius:'8px',padding:'8px'}, className, ...props}, children)),
      Portal: ({children}) => children,
      Arrow: () => null,
      Close: forwardRef(({children, ...props}, ref) => React.createElement('button', {...props, ref}, children)),
      Anchor: forwardRef(({children, ...props}, ref) => React.createElement('div', {...props, ref}, children)),
    };`;
  }
  if (pkg.startsWith('@radix-ui/react-dropdown-menu')) {
    return `const ${name} = {
      Root: ({children}) => children,
      Trigger: forwardRef(({children, asChild, ...props}, ref) => asChild && React.isValidElement(children) ? React.cloneElement(children, {...props, ref}) : React.createElement('button', {...props, ref}, children)),
      Content: forwardRef(({children, className, ...props}, ref) => React.createElement('div', {ref, style:{position:'absolute',zIndex:50,background:'#1F2023',border:'1px solid #333',borderRadius:'8px',padding:'4px'}, className, ...props}, children)),
      Portal: ({children}) => children,
      Item: forwardRef(({children, ...props}, ref) => React.createElement('div', {ref, style:{padding:'6px 10px',cursor:'pointer',borderRadius:'4px'}, ...props}, children)),
      Label: ({children}) => React.createElement('div', {style:{padding:'6px 10px',fontWeight:600,fontSize:'12px',color:'#888'}}, children),
      Separator: () => React.createElement('hr', {style:{margin:'4px 0',borderColor:'#333'}}),
      Sub: ({children}) => children,
      SubTrigger: forwardRef(({children, ...props}, ref) => React.createElement('div', {...props, ref}, children)),
      SubContent: forwardRef(({children, ...props}, ref) => React.createElement('div', {...props, ref}, children)),
      CheckboxItem: forwardRef(({children, ...props}, ref) => React.createElement('div', {...props, ref}, children)),
      RadioGroup: ({children}) => children,
      RadioItem: forwardRef(({children, ...props}, ref) => React.createElement('div', {...props, ref}, children)),
      ItemIndicator: ({children}) => children,
      Group: ({children}) => children,
      Arrow: () => null,
    };`;
  }
  // Generic Proxy fallback for unknown @radix-ui or other namespace packages
  return `const ${name} = new Proxy({}, {
    get(_, key) {
      const C = forwardRef(({children, ...props}, ref) => React.createElement('div', {...props, ref}, children));
      C.displayName = '${name}.' + String(key);
      return C;
    }
  });`;
}

function detectUserDefinedNames(code: string): Set<string> {
  const defined = new Set<string>();
  const patterns = [
    /(?:const|let|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[=:]/g,
    /function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*[(<]/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(code)) !== null) {
      if (match[1]) defined.add(match[1]);
    }
  }
  return defined;
}

function buildExternalMocks(code: string): string {
  const mocks: string[] = [];

  // 1. Namespace imports: import * as X from 'pkg'
  for (const { name, pkg } of detectNamespaceImports(code)) {
    mocks.push(generateNamespaceMock(name, pkg));
  }

  // 2. framer-motion named imports
  const fmMatch = code.match(/import\s+\{([^}]+)\}\s+from\s+['"]framer-motion['"]/);
  if (fmMatch) {
    const names = (fmMatch[1] || '').split(',').map(s => {
      const parts = s.trim().split(/\s+as\s+/);
      return ((parts.length > 1 ? parts[1] : parts[0]) || '').trim();
    }).filter(Boolean);

    if (names.includes('motion') || names.some(n => n === 'motion')) {
      mocks.push(`const motion = new Proxy({}, {
        get(_, tag) {
          return forwardRef(function MotionEl({children, animate, initial, exit, transition, whileHover, whileTap, whileInView, variants, layout, layoutId, style, ...props}, ref) {
            return React.createElement(typeof tag === 'string' ? tag : 'div', {...props, style, ref}, children);
          });
        }
      });`);
    }
    if (names.includes('AnimatePresence')) {
      mocks.push(`const AnimatePresence = function({children, mode, initial, onExitComplete}) { return React.createElement(React.Fragment, null, children || null); };`);
    }
    for (const n of names.filter(n => n !== 'motion' && n !== 'AnimatePresence')) {
      mocks.push(`const ${n} = ({children, ...props}) => React.createElement(React.Fragment, null, children || null);`);
    }
  }

  // 3. zustand, jotai, other common state libs
  const zustandMatch = code.match(/import\s+\{([^}]+)\}\s+from\s+['"]zustand['"]/);
  if (zustandMatch) {
    const names = (zustandMatch[1] || '').split(',').map(s => s.trim().split(/\s+as\s+/).pop()!.trim()).filter(Boolean);
    if (names.includes('create')) {
      mocks.push(`const create = (fn) => { const [getState, setState] = (() => { let state = {}; const listeners = new Set(); const get = () => state; const set = (partial) => { state = {...state, ...(typeof partial === 'function' ? partial(state) : partial)}; listeners.forEach(l => l()); }; return [get, set]; })(); const store = fn(setState, getState); state = store; return (selector = s => s) => { const [, force] = React.useReducer(x => x+1, 0); React.useEffect(() => { return () => {}; }, []); return selector(state); }; };`);
    }
  }

  return mocks.filter(Boolean).join('\n\n');
}

export function createPreviewShell(): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></` + `script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></` + `script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></` + `script>
    <script src="https://cdn.tailwindcss.com"></` + `script>
    <style>
      html, body { margin: 0; min-height: 100%; background: #000; color: #f4f4f5; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
      body { min-height: 100vh; padding: 24px; display: flex; align-items: center; justify-content: center; overflow-x: hidden; }
      #root { width: 100%; display: flex; align-items: center; justify-content: center; }
      button, textarea, input, select { font: inherit; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
      window.__reactRoot = null;
      window.__run = function(src) {
        try {
          if (window.__reactRoot) { try { window.__reactRoot.unmount(); } catch(_) {} window.__reactRoot = null; }
          document.getElementById('root').innerHTML = '';
          var compiled = Babel.transform(src, { presets: ['typescript', 'react'], filename: 'preview.tsx' }).code;
          (new Function('React', 'ReactDOM', compiled))(React, ReactDOM);
        } catch(e) {
          document.getElementById('root').innerHTML = '<div style="padding:16px;color:#ef4444;font-size:12px;font-family:monospace;white-space:pre-wrap">Error: ' + e.message + '</div>';
        }
        requestAnimationFrame(function() { parent.postMessage({ t: 'pd' }, '*'); });
      };
      window.addEventListener('message', function(e) {
        if (e.data && e.data.t === 'run') window.__run(e.data.src);
      });
    </` + `script>
  </body>
</html>`;
}

export function buildPreviewSource(code: string, displayName: string): string {
  const analysis = analyzeComponentCode(code);
  const detectedName = analysis.primaryName;
  const safeName = (detectedName || toPascalCase(displayName)).replace(/[^a-zA-Z0-9_]/g, '') || 'GeneratedComponent';
  const iconMocks = detectLucideIconMocks(code);
  const externalMocks = buildExternalMocks(code);
  const cleanCode = stripModuleSyntax(code);
  const autoDemoSource = buildAutoDemoSource(analysis);
  const allExportedComponentNames = [...new Set([
    ...analysis.exportedNames
      .filter(n => analysis.renderableNames.includes(n))
      .reverse()
      .map(n => n.replace(/[^a-zA-Z0-9_]/g, '')),
    safeName
  ])];
  const exportedNamesJs = allExportedComponentNames.map(n => `'${n}'`).join(', ');

  const ud = detectUserDefinedNames(cleanCode);
  const skip = (name: string) => ud.has(name);
  const builtins = [
    !skip('cn') && "const cn = (...classes) => classes.flat(Infinity).filter(Boolean).join(' ');",
    !skip('toast') && "const toast = (message) => console.log('Toast:', message);",
    !skip('cva') && `const cva = (base, cfg = {}) => { const { variants = {}, defaultVariants = {} } = cfg; return (props = {}) => { const av = { ...defaultVariants, ...props }; const cls = [base]; for (const [k, v] of Object.entries(av)) { if (variants[k] && variants[k][v]) cls.push(variants[k][v]); } return cls.join(' '); }; };`,
    !skip('Slot') && `const Slot = forwardRef(({ children, ...props }, ref) => { if (React.isValidElement(children)) return React.cloneElement(children, { ...props, ref }); return children || null; });`,
    !skip('Button') && "const Button = forwardRef(({ className = '', children, ...props }, ref) => <button ref={ref} className={cn('inline-flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm font-medium shadow-sm disabled:opacity-50 text-white', className)} {...props}>{children}</button>);",
    !skip('Textarea') && "const Textarea = forwardRef(({ className = '', ...props }, ref) => <textarea ref={ref} className={cn('min-h-20 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm shadow-sm', className)} {...props} />);",
    !skip('useTextareaResize') && `const useTextareaResize = (value, rows = 1) => { const r = useRef(null); useLayoutEffect(() => { const t = r.current; if (!t) return; t.style.height = '0px'; t.style.height = Math.max(t.scrollHeight, rows * 24) + 2 + 'px'; }, [value, rows]); return r; };`,
  ].filter(Boolean).join('\n');

  return `const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, createContext, useContext, forwardRef } = React;
${builtins}
${iconMocks}

${externalMocks}

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
    const searchOrder = ['${safeName}Demo', 'ChatInputDemo', 'Demo', 'Example', '__CopypromptsAutoGeneratedDemo', ${exportedNamesJs}, 'App'];
    for (const name of searchOrder) {
      const component = safeEvalComponent(name);
      if (component) {
        ComponentToRender = component;
        break;
      }
    }
    if (!ComponentToRender) return <div style={{padding:'16px',color:'#a16207',fontSize:'13px',fontFamily:'monospace'}}>Waiting for a React component...</div>;
    return <ComponentToRender />;
  } catch (error) {
    return <div style={{padding:'16px',color:'#ef4444',fontSize:'13px',fontFamily:'monospace'}}>Render Error: {error.message}</div>;
  }
};

window.__reactRoot = ReactDOM.createRoot(document.getElementById('root'));
window.__reactRoot.render(<App />);`;
}

export function createPreviewDocument(code: string, displayName: string): string {
  const previewSource = buildPreviewSource(code, displayName);
  const serializedSource = JSON.stringify(previewSource).replace(/</g, '\\u003c');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          html, body { margin: 0; min-height: 100%; background: #000; color: #f4f4f5; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
          body { min-height: 100vh; padding: 24px; display: flex; align-items: center; justify-content: center; overflow-x: hidden; }
          #root { width: 100%; display: flex; align-items: center; justify-content: center; }
          button, textarea, input, select { font: inherit; }
          /* Reset for dark preview */
          .dark { color-scheme: dark; }
          .boot-state,
          .preview-error {
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 12px;
            background: #09090b;
            color: #f4f4f5;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 12px;
            line-height: 1.55;
            max-width: 520px;
            padding: 16px;
            white-space: pre-wrap;
          }
          .boot-state {
            color: rgba(255,255,255,0.55);
          }
          .preview-error strong {
            color: #f87171;
            display: block;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body class="dark">
        <div id="root"><div class="boot-state">Compiling preview...</div></div>
        <script>
          const previewSource = ${serializedSource};
          const rootElement = document.getElementById('root');
          let readyPosted = false;

          const postReady = () => {
            if (readyPosted) return;
            readyPosted = true;
            parent.postMessage({ type: 'copyprompts-preview-ready' }, '*');
          };

          const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
          })[char]);

          const showPreviewError = (label, error) => {
            const message = error?.stack || error?.message || error || 'Unknown preview error';
            rootElement.innerHTML = '<div class="preview-error"><strong>' + escapeHtml(label) + '</strong>' + escapeHtml(message) + '</div>';
            console.error(label, error);
            requestAnimationFrame(postReady);
          };

          window.addEventListener('error', (event) => {
            showPreviewError('Runtime Error', event.error || event.message);
          });
          window.addEventListener('unhandledrejection', (event) => {
            showPreviewError('Runtime Error', event.reason || 'Unhandled promise rejection');
          });

          try {
            const compiled = Babel.transform(previewSource, {
              presets: ['typescript', 'react'],
              filename: 'preview.tsx'
            }).code;
            new Function('React', 'ReactDOM', compiled)(React, ReactDOM);
            requestAnimationFrame(() => requestAnimationFrame(postReady));
          } catch (error) {
            showPreviewError('Compile Error', error);
          }
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
