import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Copy, ChevronRight, Share, Bookmark, ExternalLink, 
  Sun, RotateCw, Code, Sparkles, Terminal, Send
} from 'lucide-react';
import './create-modal.css';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  addComponent: (component: any) => void;
}

const generatePreviewHtml = (code: string, componentName: string) => {
  const safeName = componentName.replace(/[^a-zA-Z0-9]/g, '') || 'GeneratedComponent';
  // Strip any export/import statements that might have leaked
  const cleanCode = code
    .replace(/import\s+[\s\S]*?from\s+['"].*?['"];?/g, '')
    .replace(/export\s+default\s+/g, '')
    .replace(/export\s+/g, '');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          body { 
            font-family: 'Plus Jakarta Sans', sans-serif; 
            margin: 0; 
            padding: 20px; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            background-color: transparent;
          }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel">
          const { useState, useEffect, useRef, useMemo, useCallback } = React;
          
          ${cleanCode}

          const App = () => {
            const [err, setErr] = useState(null);
            
            try {
              // Try to find the component by the name provided or the last defined variable
              const ComponentToRender = typeof ${safeName} !== 'undefined' ? ${safeName} : null;
              
              if (!ComponentToRender) {
                return (
                  <div style={{color: '#ef4444', padding: '20px', textAlign: 'center'}}>
                    <strong>Error:</strong> Component "${safeName}" not found in code.
                  </div>
                );
              }
              return <ComponentToRender />;
            } catch (e) {
              return <div style={{color: '#ef4444'}}>{e.message}</div>;
            }
          };

          const root = ReactDOM.createRoot(document.getElementById('root'));
          root.render(<App />);
        </script>
      </body>
    </html>
  `;
};

export const CreateModal = ({ isOpen, onClose, onSuccess, addComponent }: CreateModalProps) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ai-chats');
  const [manualCode, setManualCode] = useState(`const MyComponent = () => {
  return (
    <div className="p-10 bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl shadow-indigo-500/10 border border-zinc-100 dark:border-zinc-800 max-w-md">
      <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Premium Experience
      </h1>
      <p className="mt-3 text-zinc-500 dark:text-zinc-400 leading-relaxed">
        This is a sleek, modern component. You can edit the JSX manually or ask the AI to refine it for you.
      </p>
      <button className="mt-8 w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl transition-all active:scale-[0.98]">
        Get Started
      </button>
    </div>
  );
};`);
  const [aiInstruction, setAiInstruction] = useState('');
  const [isTested, setIsTested] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingLogs, setStreamingLogs] = useState('');
  const terminalEndRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [streamingLogs]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!aiInstruction.trim()) return;
    
    setIsGenerating(true);
    setStreamingLogs('');
    setIsTested(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiInstruction,
          currentCode: manualCode,
          name: name || 'MyComponent',
          category
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedOutput = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          accumulatedOutput += chunk;
          setStreamingLogs(prev => prev + chunk);
        }
      }

      // Extraction Logic v4
      let fullGuide = accumulatedOutput.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      let previewCode = '';

      const demoMatch = fullGuide.match(/```(?:jsx|tsx|javascript|js)?\s*demo\.tsx\s*([\s\S]*?)```/i);
      if (demoMatch && demoMatch[1]) {
        previewCode = demoMatch[1].trim();
      } else {
        const allBlocks = fullGuide.match(/```(?:jsx|tsx|javascript|js)?\s*([\s\S]*?)```/g);
        if (allBlocks && allBlocks.length > 0) {
          previewCode = Array.from(allBlocks).reduce((a, b) => a.length > b.length ? a : b)
            .replace(/```(?:jsx|tsx|javascript|js)?\s*/, '')
            .replace(/```$/, '')
            .trim();
        }
      }

      if (previewCode.length > 50) {
        setManualCode(previewCode);
        setIsTested(true);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = () => {
    addComponent({
      name: name || 'MyComponent',
      category,
      prompt: aiInstruction,
      code: manualCode,
      previewUrl: 'https://cdn.21st.dev/bundled/209.html?theme=dark&dark=true',
    });
    window.dispatchEvent(new CustomEvent('refresh-marketplace'));
    onSuccess?.();
    onClose();
  };

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Modern Navbar */}
        <div className="premium-modal-nav">
          <div className="nav-left">
            <div className="brand-dot"></div>
            <span className="brand-text">COPYPEOMPTS <span className="text-zinc-400">/ EDITOR</span></span>
          </div>
          <div className="nav-right">
            <button className="nav-icon-btn"><Share size={16}/></button>
            <button className="nav-icon-btn"><Bookmark size={16}/></button>
            <button className="nav-close-btn" onClick={onClose}><X size={20}/></button>
          </div>
        </div>

        <div className="premium-modal-body">
          {/* Left: Preview Section */}
          <div className="preview-pane">
            <div className="pane-header">
              <div className="header-tabs">
                <button className="tab-btn active">Live Preview</button>
                <button className="tab-btn">Canvas</button>
              </div>
              <div className="header-actions">
                <Sun size={14} className="text-zinc-400" />
                <div className="zoom-level">100%</div>
              </div>
            </div>
            
            <div className="preview-viewport">
              <iframe 
                srcDoc={generatePreviewHtml(manualCode, name || 'MyComponent')} 
                title="Preview"
                className="preview-iframe"
              />
              
              {isGenerating && (
                <div className="terminal-overlay">
                  <div className="terminal-window">
                    <div className="terminal-header">
                      <div className="terminal-dots">
                        <span></span><span></span><span></span>
                      </div>
                      <span className="terminal-title">GEMINI ENGINE v4.0</span>
                    </div>
                    <pre ref={terminalEndRef} className="terminal-content">
                      {streamingLogs || 'Booting AI Core...'}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Editor & Control Pane */}
          <div className="control-pane">
            <div className="editor-section">
              <div className="section-header">
                <div className="flex items-center gap-2">
                  <Code size={14} className="text-indigo-500" />
                  <span className="text-xs font-bold uppercase tracking-widest">JSX Editor</span>
                </div>
                <div className="editor-status">Manual Mode</div>
              </div>
              <textarea 
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="code-editor-textarea"
                spellCheck={false}
              />
            </div>

            <div className="config-section">
              <div className="input-grid">
                <div className="input-field">
                  <label>Component Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. HeroSection"
                  />
                </div>
                <div className="input-field">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="hero">Hero Sections</option>
                    <option value="navigation">Navigation</option>
                    <option value="ai-chats">AI Chats</option>
                    <option value="cards">Cards</option>
                  </select>
                </div>
              </div>

              <div className="ai-refinement-area">
                <div className="ai-input-wrapper">
                  <Sparkles size={18} className="ai-icon" />
                  <input 
                    type="text" 
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                    placeholder="Ask AI to refine code (e.g. 'Add a hover animation')"
                  />
                  <button 
                    onClick={handleTest} 
                    disabled={isGenerating}
                    className="refine-btn"
                  >
                    {isGenerating ? <RotateCw className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </div>

              <button 
                onClick={handlePublish}
                disabled={!isTested || isGenerating}
                className="publish-action-btn"
              >
                PUBLISH TO MARKETPLACE
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
