/// <reference types="vite/client" />

interface Window {
  promptAPI: {
    list: (filter?: 'active' | 'archived' | 'favorites') => Promise<any[]>;
    get: (id: string) => Promise<any | null>;
    create: (input: any) => Promise<any>;
    update: (input: any) => Promise<any>;
    archive: (id: string) => Promise<boolean>;
    restore: (id: string) => Promise<boolean>;
    deletePermanently: (id: string) => Promise<boolean>;
    toggleFavorite: (id: string) => Promise<boolean>;
    bumpUsage: (id: string) => Promise<boolean>;
  };
}