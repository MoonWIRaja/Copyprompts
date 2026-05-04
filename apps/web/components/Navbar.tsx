import React from 'react';
import './navbar.css';
import { Bell, ChevronRight, PanelLeft } from 'lucide-react';

export const Navbar = ({ isSidebarHidden, onShow }: { isSidebarHidden?: boolean, onShow?: () => void }) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        {isSidebarHidden && (
          <button className="sidebar-toggle-btn" onClick={onShow} aria-label="Show sidebar">
            <PanelLeft size={18} />
          </button>
        )}
        <div className="breadcrumb">
          <span>Copyprompts</span>
          <ChevronRight size={12} className="breadcrumb-separator" />
          <span className="breadcrumb-item">Summoner</span>
        </div>
      </div>

      <div className="navbar-right">
        <button className="nav-icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        
        <div className="nav-divider" />
        
        <button className="nav-action-btn primary">Sign In</button>
      </div>
    </nav>
  );
};
