import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, RotateCw, Bookmark, Share, Moon, Sun, Copy, ExternalLink, Check, Code } from 'lucide-react';
import { getComponents, addComponent } from '../lib/data';
import './create-modal.css';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateModal = ({ isOpen, onClose, onSuccess }: CreateModalProps) => {
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [prompt, setPrompt] = React.useState('');
  const [isTested, setIsTested] = React.useState(false);
  const [isTesting, setIsTesting] = React.useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [streamingLogs, setStreamingLogs] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const terminalEndRef = React.useRef<HTMLPreElement>(null);

  // Auto-scroll terminal to bottom
  React.useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [streamingLogs]);
  const [previewUrl, setPreviewUrl] = React.useState('');

  if (!isOpen) return null;

  const generatePreviewHtml = (code: string, componentName: string = 'GeneratedComponent') => {
    const safeName = componentName.replace(/\s+/g, '');
    
    // Aggressively clean code for browser-safe JSX
    const cleanedCode = code
      // Remove all import statements
      .replace(/import\s+[\s\S]*?\s+from\s+['"].*?['"];?/g, '')
      .replace(/import\s+['"].*?['"];?/g, '')
      // Remove export statements
      .replace(/export\s+default\s+/, `const GeneratedComponent = `)
      .replace(/export\s+(?:const|function|class)\s+/g, 'const ')
      .replace(/export\s+/g, '')
      // Strip TypeScript: interfaces, types, enums
      .replace(/\b(interface|type|enum)\s+\w+[\s\S]*?\{[\s\S]*?\}/g, '')
      // Strip generic type params from function calls like React.forwardRef<Type, Type>
      .replace(/React\.forwardRef\s*<[^>]*>/g, 'React.forwardRef')
      .replace(/React\.FC\s*<[^>]*>/g, '')
      .replace(/React\.ComponentProps\s*<[^>]*>/g, 'any')
      // Strip type annotations ": Type" from params and variables
      .replace(/:\s*React\.\w+(?:<[^>]*>)?/g, '')
      .replace(/:\s*\w+(?:\[\])?\s*(?=[,\)\}=;])/g, '')
      // Strip "as Type" assertions
      .replace(/\s+as\s+\w+(?:<[^>]*>)?/g, '')
      // Strip markdown bullet prefix (* or -) from every line
      // Gemma wraps entire code responses in "* " bullet formatting
      .split('\n').map(l => l.replace(/^\s*[*\-]\s+/, '')).join('\n')
      // Strip block comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Collapse multiline regular-quoted strings (e.g. long Tailwind classNames)
      .replace(/"[^"\\]*(?:\\.[^"\\]*)*"/gs, m => m.replace(/\n\s*/g, ' '))
      .replace(/'[^'\\]*(?:\\.[^'\\]*)*'/gs, m => m.replace(/\n\s*/g, ' '))
      .trim();

    // Strip preamble and trailing thinking text
    const codeLines = cleanedCode.split('\n');
    const firstCodeLine = codeLines.findIndex(l =>
      /^(?:const|function|class|var|let)\s+\w/.test(l.trim())
    );
    const startIdx = firstCodeLine > 0 ? firstCodeLine : 0;

    let lastCloseIdx = codeLines.length - 1;
    for (let i = codeLines.length - 1; i >= startIdx; i--) {
      const t = (codeLines[i] ?? '').trim();
      if (t === '};' || t === '}' || t === '});' || t === ');' || t === ')') {
        lastCloseIdx = i;
        break;
      }
    }

    const safeCode = codeLines.slice(startIdx, lastCloseIdx + 1).join('\n');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <script src="https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js"><\/script>
  <style>
    * { box-sizing: border-box; }
    body { background: #09090b; color: #fafafa; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; padding: 24px; }
    #root { width: 100%; max-width: 800px; }
  </style>
</head>
<body>
  <div id="root"><div style="color:#666;text-align:center">Loading preview...</div></div>
  <script type="text/babel" data-presets="react">
    // Make all Lucide icons available
    try { Object.assign(window, LucideReact); } catch(e) {}
    
    // Helper: cn utility
    const cn = (...classes) => classes.filter(Boolean).join(' ');

    try {
      ${safeCode}
      
      const _Comp = typeof GeneratedComponent !== 'undefined' ? GeneratedComponent
                   : typeof ${safeName} !== 'undefined' ? ${safeName}
                   : null;
      
      if (_Comp) {
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(_Comp));
      } else {
        document.getElementById('root').innerHTML = '<div style="color:#ef4444;padding:16px;border:1px solid #ef4444;border-radius:8px">Component not found. Try a different name.</div>';
      }
    } catch(err) {
      document.getElementById('root').innerHTML = '<div style="color:#ef4444;padding:16px;border:1px solid #ef4444;border-radius:8px">Render error: ' + err.message + '</div>';
    }
  <\/script>
</body>
</html>`;
  };

  const handleTest = async () => {
    if (!name || !category || !prompt) {
      alert('Please fill in all fields before testing.');
      return;
    }
    setIsTesting(true);
    setIsTested(false);
    try {
      setIsGenerating(true);
      setGeneratedCode('');
      setStreamingLogs('');
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          name: name,
          category: category
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate component');
      }

      // Read the stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedOutput = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          accumulatedOutput += chunk;
          
          // Update logs for the user to see "CLI running"
          setStreamingLogs(prev => prev + chunk);
        }
      }

      // Extraction logic v2 (Heuristic & Regex based)
      let finalCode = accumulatedOutput;
      
      // 1. Remove all ANSI escape codes (colors, etc)
      finalCode = finalCode.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');

      // 2. Try to find code between markdown fences first (most reliable)
      const markdownMatch = finalCode.match(/```(?:jsx|tsx|javascript|js)?\s*([\s\S]*?)```/);
      if (markdownMatch) {
        finalCode = markdownMatch[1].trim();
      } else {
        // 3. Fallback: Look for the component definition if bars are present
        if (finalCode.includes('▀▀▀▀▀▀▀▀')) {
          const parts = finalCode.split('▀▀▀▀▀▀▀▀');
          for (const part of parts) {
            if (part.includes('const ') && (part.includes('=>') || part.includes('return'))) {
              finalCode = part.split('▄▄▄▄▄▄▄▄')[0].trim();
              break;
            }
          }
        }
      }

      // 4. Final safety strip for remaining markers
      finalCode = finalCode
        .replace(/^```(?:jsx|tsx|javascript|js|react)?\s*\n?/gm, '')
        .replace(/```\s*$/gm, '')
        .trim();

      if (finalCode.length > 50) {
        setGeneratedCode(finalCode);
        setIsTested(true);
      } else {
        throw new Error('AI failed to generate a valid component. Please try again.');
      }
    } catch (err: any) {
      console.error('Test Error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setIsTesting(false);
    }
  };

  const handlePublish = () => {
    if (!isTested) return;
    
    addComponent({
      name,
      category,
      prompt,
      code: generatedCode,
      previewUrl: 'https://cdn.21st.dev/bundled/209.html?theme=dark&dark=true', // Mock preview
    });

    // Notify page to refresh
    window.dispatchEvent(new CustomEvent('refresh-marketplace'));

    onSuccess?.();
    onClose();
    // Reset form
    setName('');
    setCategory('');
    setPrompt('');
    setIsTested(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <div className="modal-author-avatar">
              <img src="https://avatars.githubusercontent.com/u/185059885?s=200&v=4" alt="Origin UI" />
            </div>
            <h2 className="modal-title">Tooltip</h2>
          </div>
          
          <div className="modal-header-actions">
            <button className="modal-icon-btn"><Sun size={14} /></button>
            <button className="modal-icon-btn"><RotateCw size={14} /></button>
            <button className="modal-icon-btn"><Share size={14} /></button>
            <button className="modal-icon-btn"><Bookmark size={14} /></button>
            <button className="modal-icon-btn"><ExternalLink size={14} /></button>
            <div className="modal-copy-group">
              <button className="modal-copy-btn">
                <Copy size={14} />
                <span>Copy prompt</span>
              </button>
              <button className="modal-copy-dropdown-btn">
                <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} />
              </button>
            </div>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="modal-content">
          <div className="modal-body-split">
            <div className="modal-left-pane">
                <div className="preview-content">
                  {isGenerating && (
                    <div className="streaming-logs">
                      <div className="terminal-header">
                        <span className="dot red"></span>
                        <span className="dot yellow"></span>
                        <span className="dot green"></span>
                        <span className="terminal-title">Gemini CLI Output</span>
                      </div>
                      <pre className="terminal-body" ref={terminalEndRef}>
                        {streamingLogs || 'Establishing connection to Gemini CLI...'}
                      </pre>
                    </div>
                  )}
                  {generatedCode ? (
                    <iframe
                      srcDoc={generatePreviewHtml(generatedCode, name)}
                      className="visual-preview-iframe"
                      title="Component Preview"
                    />
                  ) : !isGenerating && (
                    <div className="preview-placeholder">
                      <div className="placeholder-icon">
                        <Code size={48} />
                      </div>
                      <h3>No Preview Yet</h3>
                      <p>Enter a prompt and click "Test" to generate and preview your component.</p>
                    </div>
                  )}
                </div>
            </div>
            <div className="modal-right-pane">
              <div className="modal-form">
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    placeholder="Component Name" 
                    className="form-input" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    <option value="ai-chats">AI Chats</option>
                    <option value="avatar">Avatar</option>
                    <option value="backgrounds">Backgrounds</option>
                    <option value="buttons">Buttons</option>
                    <option value="calendars">Calendars</option>
                    <option value="cards">Cards</option>
                    <option value="carousels">Carousels</option>
                    <option value="checkboxes">Checkboxes</option>
                    <option value="dropdowns">Dropdowns</option>
                    <option value="drawers">Drawers</option>
                    <option value="forms">Forms</option>
                    <option value="inputs">Inputs</option>
                    <option value="loadings">Loadings</option>
                    <option value="menus">Menus</option>
                    <option value="modals">Modals</option>
                    <option value="navbars">Navbars</option>
                    <option value="notifications">Notifications</option>
                    <option value="pagination">Pagination</option>
                    <option value="popovers">Popovers</option>
                    <option value="sidebars">Sidebars</option>
                    <option value="sign-in">Sign In</option>
                    <option value="sign-up">Sign Up</option>
                    <option value="sliders">Sliders</option>
                    <option value="tables">Tables</option>
                    <option value="tabs">Tabs</option>
                    <option value="toggles">Toggles</option>
                    <option value="tooltips">Tooltips</option>
                    <option value="uploads">Uploads</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Prompts</label>
                  <textarea 
                    placeholder="Paste your prompts here..." 
                    className="form-textarea" 
                    rows={10}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button className="form-btn draft" onClick={onClose}>Draft</button>
                  <button className="form-btn test" onClick={handleTest} disabled={isTesting}>
                    {isTesting ? 'Testing...' : 'Test'}
                  </button>
                  <button 
                    className="form-btn publish" 
                    disabled={!isTested}
                    onClick={handlePublish}
                  >
                    Publish
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
