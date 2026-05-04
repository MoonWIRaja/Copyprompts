import React from 'react';
import { X, ChevronLeft, ChevronRight, RotateCw, Bookmark, Share, Moon, Sun, Copy, ExternalLink, Check } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!name || !category || !prompt) {
      alert('Please fill in all fields before testing.');
      return;
    }
    setIsTesting(true);
    setIsTested(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate component');
      }

      setIsTested(true);
      alert('AI Generation Successful! Preview updated.');
    } catch (error: any) {
      console.error('Test Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handlePublish = () => {
    if (!isTested) return;
    
    addComponent({
      name,
      category,
      prompt,
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
              <div className="modal-dotted-bg" />
              <iframe 
                src="https://cdn.21st.dev/bundled/209.html?theme=dark&dark=true" 
                title="Component Preview"
              />
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
