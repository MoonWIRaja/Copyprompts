import React from 'react';
import { Bookmark, Heart, Copy } from 'lucide-react';
import styles from '../app/page.module.css';
import { ComponentData } from '../lib/data';

interface ComponentCardProps {
  component: ComponentData;
}

export const ComponentCard = ({ component }: ComponentCardProps) => {
  return (
    <li className={styles.componentCard}>
      <div className={styles.previewContainer}>
        <a href="#" aria-label={component.name}>
          <img 
            alt={component.name} 
            src={component.previewUrl}
            className={styles.previewImage}
          />
        </a>
      </div>
      <div className={styles.cardFooter}>
        <div className={styles.authorAvatar}>
          <img alt={component.author.name} src={component.author.avatar} />
        </div>
        <p className={styles.cardTitle}>{component.name}</p>
        
        <div className={styles.stats}>
          <button className={styles.statBtn}>
            <Heart size={14} />
            <span>{component.stats.likes}</span>
          </button>
          <button className={styles.statBtn}>
            <Bookmark size={14} />
            <span>{component.stats.bookmarks}</span>
          </button>
          <button className={styles.statBtn}>
            <Copy size={14} />
            <span>{component.stats.copies}</span>
          </button>
        </div>
      </div>
    </li>
  );
};
