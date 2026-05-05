import React, { useState } from 'react';
import './sidebar.css';
import { CreateModal } from './CreateModal';
import { addComponent } from '../lib/data';
import { componentCategories } from '../lib/component-utils';
import { 
  Search, 
  Moon, 
  PlusCircle, 
  ChevronDown,
  ChevronRight,
  PanelLeft,
  Clock,
  Flame,
  Bookmark,
  Palette
} from 'lucide-react';

export const Sidebar = ({ isHidden, onHide }: { isHidden?: boolean, onHide?: () => void }) => {
  const [isUIComponentsOpen, setIsUIComponentsOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const handleAddComponent = (component: Parameters<typeof addComponent>[0]) => {
    addComponent(component);
    window.dispatchEvent(new Event('refresh-marketplace'));
  };

  return (
    <>
    <aside className={`sidebar ${isHidden ? 'hidden' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <svg width="18" height="18" viewBox="0 0 400 400" fill="currentColor">
            <path d="M358.333 0C381.345 0 400 18.6548 400 41.6667V295.833C400 298.135 398.134 300 395.833 300H270.833C268.532 300 266.667 301.865 266.667 304.167V395.833C266.667 398.134 264.801 400 262.5 400H41.6667C18.6548 400 0 381.345 0 358.333V304.72C0 301.793 1.54269 299.081 4.05273 297.575L153.76 207.747C157.159 205.708 156.02 200.679 152.376 200.065L151.628 200H4.16667C1.86548 200 6.71103e-08 198.135 0 195.833V104.167C1.07376e-06 101.865 1.86548 100 4.16667 100H162.5C164.801 100 166.667 98.1345 166.667 95.8333V4.16667C166.667 1.86548 168.532 1.00666e-07 170.833 0H358.333ZM170.833 100C168.532 100 166.667 101.865 166.667 104.167V295.833C166.667 298.135 168.532 300 170.833 300H262.5C264.801 300 266.667 298.135 266.667 295.833V104.167C266.667 101.865 264.801 100 262.5 100H170.833Z" />
          </svg>
          <span>21st</span>
        </div>
        <button className="sidebar-hide-btn" onClick={onHide} aria-label="Hide sidebar">
          <PanelLeft size={18} />
        </button>
      </div>

      <div className="search-container">
        <Search size={14} className="search-icon" />
        <input type="text" placeholder="Search" className="search-input" readOnly />
        <span className="kbd">⌘K</span>
      </div>

      <div className="nav-section" style={{ marginBottom: '12px' }}>
        <div className="flex flex-col gap-1">
          <a href="#" className="nav-item">
            <div className="nav-item-content">
              <Clock size={16} />
              <span>New</span>
            </div>
          </a>
          <a href="#" className="nav-item">
            <div className="nav-item-content">
              <Flame size={16} />
              <span>Popular</span>
            </div>
          </a>
          <a href="#" className="nav-item">
            <div className="nav-item-content">
              <Bookmark size={16} />
              <span>Your Save</span>
            </div>
          </a>
          <a href="#" className="nav-item">
            <div className="nav-item-content">
              <Palette size={16} />
              <span>Color Picker</span>
            </div>
          </a>
        </div>
      </div>

      <div className="sidebar-nav-container">
        <div className="nav-section">
          <div 
            className="nav-title" 
            onClick={() => setIsUIComponentsOpen(!isUIComponentsOpen)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <span>UI Components</span>
            {isUIComponentsOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </div>
          
          {isUIComponentsOpen && (
            <div className="flex flex-col gap-1">
              {componentCategories.map((category) => (
                <div className={`nav-item ${category.id === 'sidebars' ? 'active' : ''}`} key={category.id}>
                  <span>{category.label}</span>
                  <span className="count">{category.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="footer-btn">
          <Moon size={16} />
        </div>
        <button className="publish-btn" onClick={() => setIsCreateModalOpen(true)}>
          <PlusCircle size={16} />
          Create
        </button>
      </div>

    </aside>
    <CreateModal 
      isOpen={isCreateModalOpen} 
      onClose={() => setIsCreateModalOpen(false)} 
      addComponent={handleAddComponent}
    />
    </>
  );
};
