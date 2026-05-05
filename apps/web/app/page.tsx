'use client';
import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { ComponentCard } from '../components/ComponentCard';
import { getComponents, initialComponents } from '../lib/data';

export default function Page() {
  const [components, setComponents] = useState(initialComponents);

  // In a real app, you'd use a more robust state sync, 
  // but for a mock, we can listen for a custom event or just poll.
  useEffect(() => {
    const handleRefresh = () => setComponents([...getComponents()]);
    handleRefresh();
    window.addEventListener('refresh-marketplace', handleRefresh);
    return () => window.removeEventListener('refresh-marketplace', handleRefresh);
  }, []);

  return (
    <div className={styles.container}>
      <section className={styles.leftContent}>
        <ul className={styles.grid}>
          {components.map((comp) => (
            <ComponentCard key={comp.id} component={comp} />
          ))}
        </ul>
      </section>
      
      <aside className={styles.rightContent}>
        {/* Sidebar content cleared */}
      </aside>
    </div>
  );
}
