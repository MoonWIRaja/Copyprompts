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

// In-memory store (Reset on refresh for now, or use localStorage)
let components = [...initialComponents];

export const getComponents = () => components;

export const addComponent = (data: Omit<ComponentData, 'id' | 'createdAt' | 'author' | 'stats'>) => {
  const newComponent: ComponentData = {
    ...data,
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
  components = [newComponent, ...components];
  return newComponent;
};
