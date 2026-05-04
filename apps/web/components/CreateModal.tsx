import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, RotateCw, Code, Sparkles, Send
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
        <style>
          body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; }
          #root { width: 100%; display: flex; justify-content: center; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel" data-presets="react,typescript">
          const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;
          
          // --- BULLETPROOF MOCKING ---
          const toast = (msg) => console.log("Toast:", msg);
          const LucideIcons = new Proxy({}, { get: () => () => <span>Icon</span> });
          
          // Provide basic UI mocks if missing
          const Button = window.Button || (({children, ...p}) => <button className="px-3 py-1 bg-black text-white rounded" {...p}>{children}</button>);
          const Textarea = window.Textarea || ((p) => <textarea className="border rounded p-2" {...p} />);
          
          // --- MERGED CODE ---
          ${cleanCode}

          // --- SMART RENDERER ---
          const App = () => {
            try {
              // Priority 1: Use the name in the input field
              let ComponentToRender = null;
              try { ComponentToRender = eval('${safeName}'); } catch(e) {}
              
              // Priority 2: Look for anything ending in "Demo"
              if (!ComponentToRender) {
                const demoKey = Object.keys(window).find(k => k.endsWith('Demo') && typeof window[k] === 'function');
                if (demoKey) ComponentToRender = window[demoKey];
              }

              // Priority 3: Last defined uppercase component
              if (!ComponentToRender) {
                const keys = Object.keys(window).filter(k => /^[A-Z]/.test(k) && typeof window[k] === 'function' && k !== 'App');
                if (keys.length > 0) ComponentToRender = window[keys[keys.length - 1]];
              }

              if (!ComponentToRender) return <div className="p-4 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded">No component detected. Ensure your code defines a React component.</div>;
              
              return <ComponentToRender />;
            } catch (e) {
              return <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded">Runtime Error: {e.message}</div>;
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
  const [manualCode, setManualCode] = useState('');
  const [aiInstruction, setAiInstruction] = useState('');
  const [isTested, setIsTested] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingLogs, setStreamingLogs] = useState('');
  const terminalEndRef = useRef<HTMLPreElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Auto-Sync Name
  useEffect(() => {
    if (!manualCode) return;
    const match = manualCode.match(/(?:const|function)\s+([A-Z][a-zA-Z0-9]+)/);
    if (match && match[1] && match[1] !== name) setName(match[1]);
  }, [manualCode]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [streamingLogs]);

  if (!isOpen || !mounted) return null;

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

      // Extraction v6: JOIN ALL TSX BLOCKS
      const blocks = accumulatedOutput.match(/```(?:jsx|tsx|javascript|js)?\s*[\w.-]+\.tsx\s*([\s\S]*?)```/gi) || [];
      const mergedCode = blocks.map(block => {
        return block.replace(/```(?:jsx|tsx|javascript|js)?\s*[\w.-]+\.tsx\s*/i, '').replace(/```$/, '').trim();
      }).join('\n\n');
      
      if (mergedCode) {
        setManualCode(mergedCode);
        setIsTested(true);
      } else {
        // Fallback to simple extraction if named blocks aren't found
        const simpleBlocks = accumulatedOutput.match(/```(?:jsx|tsx|javascript|js)?\s*([\s\S]*?)```/g);
        if (simpleBlocks) {
          setManualCode(simpleBlocks.map(b => b.replace(/```[\s\S]*?\n/, '').replace(/```$/, '')).join('\n\n'));
          setIsTested(true);
        }
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const modalContent = (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="premium-modal-nav">
          <div className="nav-left">
            <div className="brand-dot"></div>
            <span className="brand-text">COPYPEOMPTS EDITOR</span>
          </div>
          <button className="nav-close-btn" onClick={onClose}><X size={20}/></button>
        </div>

        <div className="premium-modal-body">
          <div className="preview-pane">
            <div className="preview-viewport">
              <iframe srcDoc={generatePreviewHtml(manualCode, name)} className="preview-iframe" />
              {isGenerating && (
                <div className="terminal-overlay">
                  <div className="terminal-window">
                    <pre ref={terminalEndRef} className="terminal-content">{streamingLogs}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="control-pane">
            <div className="editor-section">
              <div className="section-header">
                <span className="editor-status">TSX MULTI-BLOCK</span>
              </div>
              <textarea value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="code-editor-textarea" spellCheck={false} placeholder="Paste your code here..." />
            </div>

            <div className="config-section">
              <div className="input-grid">
                <div className="input-field">
                  <label>Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Detected..." />
                </div>
                <div className="input-field">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="hero">Hero</option>
                    <option value="ai-chats">AI Chats</option>
                  </select>
                </div>
              </div>

              <div className="ai-refinement-area">
                <div className="ai-input-wrapper">
                  <input type="text" value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} placeholder="Refine code..." />
                  <button onClick={handleTest} disabled={isGenerating} className="refine-btn">
                    {isGenerating ? <RotateCw className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </div>

              <button onClick={() => { addComponent({ name, code: manualCode }); onClose(); }} className="publish-action-btn">
                PUBLISH
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
