import { buildIntegrationPrompt, detectNpmDependencies } from './component-utils';

export interface ComponentData {
  id: string;
  name: string;
  category: string;
  author: {
    name: string;
    avatar: string;
  };
  stats: {
    likes: number;
    bookmarks: number;
    copies: number;
  };
  previewUrl: string;
  prompt: string;
  code?: string;
  dependencies?: string[];
  isUserCreated?: boolean;
  createdAt: string;
}

export const initialComponents: ComponentData[] = [
  {
    id: '1',
    name: 'Sidebar Layout',
    category: 'sidebars',
    author: {
      name: 'shadcn',
      avatar: 'https://avatars.githubusercontent.com/u/124599?v=4',
    },
    stats: {
      likes: 14,
      bookmarks: 45,
      copies: 10,
    },
    previewUrl: 'https://cdn.21st.dev/bundled/209.html?theme=dark&dark=true',
    prompt: '',
    createdAt: new Date().toISOString(),
  },
  // Add more initial items if needed
];

export type CreateComponentInput = {
  name: string;
  category: string;
  code: string;
  prompt?: string;
  previewUrl?: string;
  dependencies?: string[];
};

const STORAGE_KEY = 'copyprompts.components.v1';
let userComponents: ComponentData[] = [];
let hasLoadedUserComponents = false;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function loadUserComponents(): void {
  if (hasLoadedUserComponents || !canUseStorage()) return;
  hasLoadedUserComponents = true;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    userComponents = raw ? JSON.parse(raw) as ComponentData[] : [];
  } catch (error) {
    console.warn('Failed to load saved components:', error);
    userComponents = [];
  }
}

function persistUserComponents(): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userComponents));
  } catch (error) {
    console.warn('Failed to persist saved components:', error);
  }
}

export const getComponents = () => {
  loadUserComponents();
  return [...userComponents, ...initialComponents];
};

export const addComponent = (data: CreateComponentInput) => {
  loadUserComponents();
  const code = data.code.trim();
  const name = data.name.trim() || 'Untitled Component';
  const category = data.category || 'ai-chats';
  const newComponent: ComponentData = {
    name,
    category,
    code,
    dependencies: data.dependencies || detectNpmDependencies(code),
    previewUrl: data.previewUrl || '',
    prompt: data.prompt || buildIntegrationPrompt({ displayName: name, category, code }),
    isUserCreated: true,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString(),
    author: {
      name: 'User',
      avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    },
    stats: {
      likes: 0,
      bookmarks: 0,
      copies: 0,
    },
  };
  userComponents = [newComponent, ...userComponents];
  persistUserComponents();
  return newComponent;
};
