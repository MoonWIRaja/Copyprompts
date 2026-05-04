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
  
  // Hardened Code Cleaner: Strips imports but leaves the component logic
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
          body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #fff; font-family: sans-serif; }
          #root { width: 100%; display: flex; justify-content: center; }
        </style>
      </head>
      <body>
        <div id="root"></div>
        <script type="text/babel" data-presets="react,typescript">
          const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;
          
          // --- AUTO-MOCKING LAYER ---
          // Mocking common libraries to prevent "is not defined" errors
          const toast = (msg) => alert("Toast: " + msg);
          toast.success = (msg) => alert("Success: " + msg);
          toast.error = (msg) => alert("Error: " + msg);
          
          const Lucide = { ArrowUpIcon: () => <span>↑</span>, RotateCw: () => <span>↻</span> };
          
          // Mocking missing UI components (Shadcn style)
          const Button = ({ children, className, ...props }) => <button className={"px-4 py-2 bg-black text-white rounded " + className} {...props}>{children}</button>;
          const Textarea = (props) => <textarea className="border p-2 w-full rounded" {...props} />;
          
          // --- USER CODE ---
          ${cleanCode}

          // --- SMART RENDERER ---
          const App = () => {
            try {
              // Try explicit name first, then look for common exports, then find any defined function
              let ComponentToRender = null;
              try { ComponentToRender = eval('${safeName}'); } catch(e) {}
              
              if (!ComponentToRender) {
                // Heuristic: Find the last defined function/const in the code
                const matches = \`${cleanCode}\`.match(/const\s+([A-Z][a-zA-Z0-9]+)|function\s+([A-Z][a-zA-Z0-9]+)/g);
                if (matches) {
                  const lastMatch = matches[matches.length - 1].split(' ').pop();
                  try { ComponentToRender = eval(lastMatch); } catch(e) {}
                }
              }

              if (!ComponentToRender) return <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded">Component not found. Ensure your component name matches the "Name" field or is defined as a const/function.</div>;
              
              return <ComponentToRender />;
            } catch (e) {
              return <div className="text-red-500 p-4 bg-red-50 rounded">Runtime Error: {e.message}</div>;
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

      // Extraction v5
      const demoMatch = accumulatedOutput.match(/```(?:jsx|tsx|javascript|js)?\s*demo\.tsx\s*([\s\S]*?)```/i);
      const componentMatch = accumulatedOutput.match(/```(?:jsx|tsx|javascript|js)?\s*[a-z-]+\.tsx\s*([\s\S]*?)```/i);
      
      const finalCode = (demoMatch ? demoMatch[1] : (componentMatch ? componentMatch[1] : null))?.trim();
      
      if (finalCode) {
        setManualCode(finalCode);
        setIsTested(true);
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
                <span className="editor-status">TSX EDITOR</span>
              </div>
              <textarea value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="code-editor-textarea" spellCheck={false} placeholder="Paste or write TSX here..." />
            </div>

            <div className="config-section">
              <div className="input-grid">
                <div className="input-field">
                  <label>Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. ChatInputDemo" />
                </div>
                <div className="input-field">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="hero">Hero</option>
                    <option value="navigation">Navigation</option>
                    <option value="ai-chats">AI Chats</option>
                  </select>
                </div>
              </div>

              <div className="ai-refinement-area">
                <div className="ai-input-wrapper">
                  <input type="text" value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} placeholder="Ask AI to refine or generate..." />
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
