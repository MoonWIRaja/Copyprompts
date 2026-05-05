import { transform } from '@babel/standalone';
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { buildPreviewSource } from './component-utils';

declare global {
  interface Window {
    __COPYPROMPTS_PREVIEW_RUNTIME__?: {
      React: typeof React;
      ReactDOM: typeof ReactDOM;
    };
  }
}

if (typeof window !== 'undefined') {
  window.__COPYPROMPTS_PREVIEW_RUNTIME__ = { React, ReactDOM };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.stack || error.message;
  return String(error);
}

function toScriptLiteral(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function createPreviewRuntimeDocument(compiledCode: string, compileError: string | null): string {
  const compiledLiteral = toScriptLiteral(compiledCode);
  const errorLiteral = compileError ? toScriptLiteral(compileError) : 'null';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          html, body { margin: 0; min-height: 100%; background: #000; color: #f4f4f5; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
          body { min-height: 100vh; padding: 24px; display: flex; align-items: center; justify-content: center; overflow-x: hidden; color-scheme: dark; }
          #root { width: 100%; display: flex; align-items: center; justify-content: center; }
          button, textarea, input, select { font: inherit; }
          .boot-state,
          .preview-error {
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 12px;
            background: #09090b;
            color: #f4f4f5;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 12px;
            line-height: 1.55;
            max-width: 560px;
            padding: 16px;
            white-space: pre-wrap;
          }
          .boot-state { color: rgba(255,255,255,0.58); }
          .preview-error strong {
            color: #f87171;
            display: block;
            margin-bottom: 8px;
          }
        </style>
      </head>
      <body>
        <div id="root"><div class="boot-state">Compiling preview...</div></div>
        <script>
          const compiledCode = ${compiledLiteral};
          const compileError = ${errorLiteral};
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

          const loadScript = (src, timeoutMs = 6000) => new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const timeout = window.setTimeout(() => {
              script.remove();
              reject(new Error('Timed out loading ' + src));
            }, timeoutMs);
            script.src = src;
            script.onload = () => {
              window.clearTimeout(timeout);
              resolve(null);
            };
            script.onerror = () => {
              window.clearTimeout(timeout);
              reject(new Error('Failed to load ' + src));
            };
            document.head.appendChild(script);
          });

          window.addEventListener('error', (event) => {
            showPreviewError('Runtime Error', event.error || event.message);
          });
          window.addEventListener('unhandledrejection', (event) => {
            showPreviewError('Runtime Error', event.reason || 'Unhandled promise rejection');
          });

          (async () => {
            if (compileError) {
              showPreviewError('Compile Error', compileError);
              return;
            }

            try {
              const runtime = parent.__COPYPROMPTS_PREVIEW_RUNTIME__;
              if (!runtime?.React || !runtime?.ReactDOM) {
                throw new Error('Preview runtime is not available yet.');
              }
              new Function('React', 'ReactDOM', compiledCode)(runtime.React, runtime.ReactDOM);
              requestAnimationFrame(() => {
                postReady();
                window.setTimeout(() => {
                  loadScript('https://cdn.tailwindcss.com', 3000).catch(() => undefined);
                }, 1000);
              });
            } catch (error) {
              showPreviewError('Runtime Error', error);
            }
          })();
        </script>
      </body>
    </html>
  `;
}

export function createPreviewDocument(code: string, displayName: string): string {
  try {
    const previewSource = buildPreviewSource(code, displayName);
    const compiled = transform(previewSource, {
      presets: ['typescript', 'react'],
      filename: 'preview.tsx',
    }).code || '';

    return createPreviewRuntimeDocument(compiled, null);
  } catch (error) {
    return createPreviewRuntimeDocument('', toErrorMessage(error));
  }
}
