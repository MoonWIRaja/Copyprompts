import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, RotateCw, Send, Copy, Check
} from 'lucide-react';
import type { CreateComponentInput } from '../lib/data';
import {
  analyzeComponentCode,
  buildIntegrationPrompt,
  componentCategories,
  detectComponentName
} from '../lib/component-utils';
import { createPreviewDocument } from '../lib/preview-compiler';
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
  const [previewCode, setPreviewCode] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isTypingCode, setIsTypingCode] = useState(false);
  const terminalEndRef = useRef<HTMLPreElement>(null);
  const previewTimerRef = useRef<number>(0);
  const previewFailSafeRef = useRef<number>(0);
  const typingTimerRef = useRef<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handlePreviewReady = (event: MessageEvent) => {
      if (event.data?.type !== 'copyprompts-preview-ready') return;
      window.clearTimeout(previewFailSafeRef.current);
      setIsPreviewLoading(false);
    };

    window.addEventListener('message', handlePreviewReady);
    return () => {
      window.removeEventListener('message', handlePreviewReady);
      window.clearTimeout(previewTimerRef.current);
      window.clearTimeout(previewFailSafeRef.current);
      window.clearTimeout(typingTimerRef.current);
      setMounted(false);
    };
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

  useEffect(() => {
    window.clearTimeout(previewTimerRef.current);
    window.clearTimeout(previewFailSafeRef.current);
    if (!manualCode.trim()) {
      setPreviewCode('');
      setIsPreviewLoading(false);
      return;
    }
    setIsPreviewLoading(true);
    previewTimerRef.current = window.setTimeout(() => {
      setPreviewCode(manualCode);
      previewFailSafeRef.current = window.setTimeout(() => {
        setIsPreviewLoading(false);
      }, 8000);
    }, 800);
  }, [manualCode]);

  const componentAnalysis = useMemo(() => analyzeComponentCode(manualCode), [manualCode]);
  const displayName = name.trim() || componentAnalysis.primaryName || detectComponentName(manualCode) || 'MyComponent';
  const detectedDependencies = componentAnalysis.dependencies;
  const generatedPrompt = useMemo(() => buildIntegrationPrompt({
    displayName,
    category,
    code: manualCode
  }), [category, displayName, manualCode]);
  const previewDocument = useMemo(() => (
    previewCode.trim() ? createPreviewDocument(previewCode, displayName) : ''
  ), [displayName, previewCode]);
  const isReadyToPublish = Boolean(name.trim() && manualCode.trim());

  if (!isOpen || !mounted) return null;

  const handleNameChange = (value: string) => {
    setHasCustomName(true);
    setName(value);
  };

  const handleCodeChange = (value: string) => {
    setManualCode(value);
    setIsTypingCode(true);
    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => setIsTypingCode(false), 1200);
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
                  srcDoc={previewDocument}
                  className="preview-iframe"
                  sandbox="allow-scripts allow-same-origin"
                  title="Component preview"
                  onLoad={() => {
                    if (!previewCode.trim()) setIsPreviewLoading(false);
                  }}
                />

                {!manualCode.trim() && (
                  <div className="preview-empty-state">
                    <div className="preview-empty-loader">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <div className="preview-empty-title">Waiting for code</div>
                    <div className="preview-empty-copy">Paste TSX to start rendering a live preview.</div>
                  </div>
                )}

                {isPreviewLoading && !isGenerating && (
                  <div className="preview-loading-overlay">
                    <div className="preview-loading-spinner" />
                    <div className="preview-loading-text">Rendering...</div>
                  </div>
                )}

                {isGenerating && (
                  <div className="summoning-overlay">
                    <div className="summoning-circle">
                      <div className="summoning-spinner"></div>
                    </div>
                    <div className="summoning-text">Summoning Component...</div>
                    <div className="terminal-window" style={{ width: '80%', marginTop: '20px' }}>
                       <div className="terminal-header">
                        <div className="terminal-dots">
                          <span></span><span></span><span></span>
                        </div>
                        <div className="terminal-title">GEMINI_BRIDGE_LOGS</div>
                      </div>
                      <pre ref={terminalEndRef} className="terminal-content" style={{ height: '120px' }}>{streamingLogs}</pre>
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
              <textarea value={manualCode} onChange={(e) => handleCodeChange(e.target.value)} className={`code-editor-textarea${isTypingCode ? ' is-typing' : ''}`} spellCheck={false} placeholder="Paste or generate code..." />
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

              {manualCode.trim() && (
                <div className="analysis-panel">
                  <div className="analysis-row">
                    <span>Detected</span>
                    <strong>{componentAnalysis.primaryName || 'No component yet'}</strong>
                  </div>
                  <div className="analysis-row">
                    <span>Preview mode</span>
                    <strong>{componentAnalysis.previewStrategy.replace('-', ' ')}</strong>
                  </div>
                  {componentAnalysis.warnings.map((warning) => (
                    <p className="analysis-warning" key={warning}>{warning}</p>
                  ))}
                </div>
              )}

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
