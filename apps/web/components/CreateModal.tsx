import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, RotateCw, Send, Copy, Check
} from 'lucide-react';
import type { CreateComponentInput } from '../lib/data';
import {
  buildIntegrationPrompt,
  componentCategories,
  createPreviewDocument,
  detectComponentName,
  detectNpmDependencies
} from '../lib/component-utils';
import './create-modal.css';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  addComponent: (component: CreateComponentInput) => void;
}

export const CreateModal = ({ isOpen, onClose, onSuccess, addComponent }: CreateModalProps) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ai-chats');
  const [manualCode, setManualCode] = useState('');
  const [aiInstruction, setAiInstruction] = useState('');
  const [activePane, setActivePane] = useState<'preview' | 'prompt'>('preview');
  const [hasCustomName, setHasCustomName] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
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
    if (!manualCode || hasCustomName) return;
    const match = manualCode.match(/(?:const|function)\s+([A-Z][a-zA-Z0-9]+)/);
    if (match && match[1] && match[1] !== name) setName(match[1]);
  }, [manualCode, hasCustomName, name]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollTop = terminalEndRef.current.scrollHeight;
    }
  }, [streamingLogs]);

  const displayName = name.trim() || detectComponentName(manualCode) || 'MyComponent';
  const detectedDependencies = useMemo(() => detectNpmDependencies(manualCode), [manualCode]);
  const generatedPrompt = useMemo(() => buildIntegrationPrompt({
    displayName,
    category,
    code: manualCode
  }), [category, displayName, manualCode]);
  const isReadyToPublish = Boolean(name.trim() && manualCode.trim());

  if (!isOpen || !mounted) return null;

  const handleNameChange = (value: string) => {
    setHasCustomName(true);
    setName(value);
  };

  const handleCopyPrompt = async () => {
    if (!manualCode.trim()) return;
    await navigator.clipboard?.writeText(generatedPrompt);
    setCopiedPrompt(true);
    window.setTimeout(() => setCopiedPrompt(false), 1200);
  };

  const resetPublishedDraft = () => {
    setName('');
    setManualCode('');
    setAiInstruction('');
    setStreamingLogs('');
    setIsTested(false);
    setHasCustomName(false);
    setActivePane('preview');
  };

  const handlePublish = () => {
    if (!isReadyToPublish) return;
    addComponent({
      name: name.trim(),
      category,
      code: manualCode,
      prompt: generatedPrompt,
      dependencies: detectedDependencies
    });
    onSuccess?.();
    resetPublishedDraft();
    onClose();
  };

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

      // Extraction v8: Support quoted filenames and all extensions
      const blocks = accumulatedOutput.match(/```(?:jsx|tsx|javascript|js|typescript|ts)?\s*["']?[\w.-]+\.(?:tsx|ts|jsx|js)["']?\s*([\s\S]*?)```/gi) || [];
      const mergedCode = blocks.map(block => {
        return block.replace(/```(?:jsx|tsx|javascript|js|typescript|ts)?\s*["']?[\w.-]+\.(?:tsx|ts|jsx|js)["']?\s*/i, '').replace(/```$/, '').trim();
      }).join('\n\n');
      
      if (mergedCode) {
        setManualCode(mergedCode);
        setIsTested(true);
      } else {
        const simpleBlocks = accumulatedOutput.match(/```(?:jsx|tsx|javascript|js|typescript|ts)?\s*([\s\S]*?)```/g);
        if (simpleBlocks) {
          setManualCode(simpleBlocks.map(b => b.replace(/```[\s\S]*?\n/, '').replace(/```$/, '')).join('\n\n'));
          setIsTested(true);
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      alert(`Error: ${message}`);
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
            <div className="pane-header">
              <div className="header-tabs">
                <button className={`tab-btn ${activePane === 'preview' ? 'active' : ''}`} onClick={() => setActivePane('preview')}>
                  Preview
                </button>
                <button className={`tab-btn ${activePane === 'prompt' ? 'active' : ''}`} onClick={() => setActivePane('prompt')}>
                  Prompt
                </button>
              </div>
              <button className="copy-prompt-btn" onClick={handleCopyPrompt} disabled={!manualCode.trim()}>
                {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                {copiedPrompt ? 'Copied' : 'Copy Prompt'}
              </button>
            </div>

            {activePane === 'preview' ? (
              <div className="preview-viewport">
                <iframe
                  srcDoc={createPreviewDocument(manualCode, displayName)}
                  className="preview-iframe"
                  sandbox="allow-scripts"
                  title="Component preview"
                />
                {isGenerating && (
                  <div className="terminal-overlay">
                    <div className="terminal-window">
                      <pre ref={terminalEndRef} className="terminal-content">{streamingLogs}</pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="prompt-viewport">
                <textarea className="generated-prompt-textarea" readOnly value={generatedPrompt} />
              </div>
            )}
          </div>

          <div className="control-pane">
            <div className="editor-section">
              <div className="section-header">
                <span className="editor-status">{isTested ? 'PROMPT READY' : 'TSX BULLETPROOF v8'}</span>
                <span className="dependency-status">
                  {detectedDependencies.length > 0 ? detectedDependencies.join(', ') : 'No npm deps detected'}
                </span>
              </div>
              <textarea value={manualCode} onChange={(e) => setManualCode(e.target.value)} className="code-editor-textarea" spellCheck={false} placeholder="Paste or generate code..." />
            </div>

            <div className="config-section">
              <div className="input-grid">
                <div className="input-field">
                  <label>Name</label>
                  <input type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Display name" />
                </div>
                <div className="input-field">
                  <label>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {componentCategories.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ai-refinement-area">
                <div className="ai-input-wrapper">
                  <input type="text" value={aiInstruction} onChange={(e) => setAiInstruction(e.target.value)} placeholder="Refine TSX guide..." />
                  <button onClick={handleTest} disabled={isGenerating} className="refine-btn">
                    {isGenerating ? <RotateCw className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </div>

              <button onClick={handlePublish} disabled={!isReadyToPublish} className="publish-action-btn">
                PUBLISH TO LIBRARY
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
