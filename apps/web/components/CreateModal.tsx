import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
        <script type="text/babel" data-presets="react,typescript">
          const { useState, useEffect, useRef, useMemo, useCallback } = React;
          ${cleanCode}
          const App = () => {
            try {
              const ComponentToRender = typeof ${safeName} !== 'undefined' ? ${safeName} : null;
              if (!ComponentToRender) return <div style={{color: '#ef4444'}}>Component not found.</div>;
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
  const [manualCode, setManualCode] = useState(`interface MyComponentProps {
  title?: string;
}

const MyComponent: React.FC<MyComponentProps> = ({ title = "Modern TSX" }) => {
  return (
    <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-zinc-100 dark:border-zinc-800">
      <h1 className="text-2xl font-bold text-indigo-600">{title}</h1>
      <p className="text-zinc-500 mt-2">Edit me manually or use AI.</p>
    </div>
  );
};`);
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

      const demoMatch = accumulatedOutput.match(/```(?:jsx|tsx|javascript|js)?\s*demo\.tsx\s*([\s\S]*?)```/i);
      if (demoMatch && demoMatch[1]) {
        setManualCode(demoMatch[1].trim());
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
              <iframe srcDoc={generatePreviewHtml(manualCode, name || 'MyComponent')} className="preview-iframe" />
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
              <textarea value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="code-editor-textarea" spellCheck={false} />
            </div>

            <div className="config-section">
              <div className="input-grid">
                <div className="input-field">
                  <label>Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Component Name" />
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
                  <input type="text" value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} placeholder="AI Instruction..." />
                  <button onClick={handleTest} disabled={isGenerating} className="refine-btn">
                    {isGenerating ? <RotateCw className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </div>

              <button onClick={() => { addComponent({ name, code: manualCode }); onClose(); }} disabled={!isTested} className="publish-action-btn">
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
