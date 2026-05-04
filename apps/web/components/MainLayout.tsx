"use client";

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar isHidden={!isSidebarVisible} onHide={() => setIsSidebarVisible(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Navbar 
          isSidebarHidden={!isSidebarVisible} 
          onShow={() => setIsSidebarVisible(true)} 
        />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--background)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};
