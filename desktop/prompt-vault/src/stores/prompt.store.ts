// src/stores/prompt.store.ts
import { create } from 'zustand';
import type { PromptDTO, CreatePromptInput, UpdatePromptInput } from '../shared/types/ipc';

type Filter = 'active' | 'archived' | 'favorites';

export interface RecentPromptItem {
  promptId: string;
  title: string;
  type?: string;
  openedAt: string;
}

interface PromptState {
  // Основные поля
  prompts: PromptDTO[];
  filter: Filter;
  selectedId: string | null;
  selectedIds: string[];
  isLoading: boolean;
  error: string | null;
  
  // Фильтры и поиск (Stage 3)
  searchQuery: string;
  sortBy: 'title' | 'createdAt' | 'updatedAt' | 'usageCount';
  sortOrder: 'asc' | 'desc';
  activeProjectId: string | 'none' | null;
  activeCategoryId: string | 'none' | null;
  projects: any[];
  categories: any[];
  tags: any[];

  // 🔧 STAGE 8: новые поля
  isDirty: boolean;
  recentPrompts: RecentPromptItem[];
  draftContent: string | null;
  autosaveEnabled: boolean;

  // Actions
  setFilter: (filter: Filter) => void;
  loadPrompts: () => Promise<void>;
  selectPrompt: (id: string | null) => void;
  toggleSelectPrompt: (id: string) => void;
  clearSelection: () => void;
  createPrompt: (input: CreatePromptInput) => Promise<PromptDTO>;
  updatePrompt: (input: UpdatePromptInput) => Promise<PromptDTO>;
  archivePrompt: (id: string) => Promise<void>;
  restorePrompt: (id: string) => Promise<void>;
  deletePermanently: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  clearError: () => void;
  setSearchQuery: (q: string) => void;
  setSort: (by: 'title' | 'createdAt' | 'updatedAt' | 'usageCount', order: 'asc' | 'desc') => void;
  setProjectFilter: (id: string | 'none' | null) => void;
  setCategoryFilter: (id: string | 'none' | null) => void;
  loadReferences: () => Promise<void>;

  // 🔧 STAGE 8: новые actions
  setDirty: (dirty: boolean) => void;
  setDraftContent: (content: string | null) => void;
  setAutosaveEnabled: (enabled: boolean) => void;
  loadRecentPrompts: () => Promise<void>;
  addRecentPrompt: (promptId: string) => Promise<void>;
  clearRecentPrompts: () => Promise<void>;
}

function ensureAPI() {
  if (typeof window === 'undefined' || !window.promptAPI) {
    throw new Error('IPC API недоступно. Проверьте, что приложение запущено через Electron (npm run dev).');
  }
  return window.promptAPI;
}

export const usePromptStore = create<PromptState>((set, get) => ({
  prompts: [],
  filter: 'active',
  selectedId: null,
  selectedIds: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  activeProjectId: null,
  activeCategoryId: null,
  projects: [],
  categories: [],
  tags: [],
  
  // 🔧 STAGE 8: initial state
  isDirty: false,
  recentPrompts: [],
  draftContent: null,
  autosaveEnabled: true,

  setFilter: (filter) => {
    set({ filter, selectedId: null, selectedIds: [] });
    get().loadPrompts();
  },

  setSearchQuery: (q) => {
    set({ searchQuery: q, selectedIds: [] });
    get().loadPrompts();
  },

  setSort: (by, order) => {
    set({ sortBy: by, sortOrder: order, selectedIds: [] });
    get().loadPrompts();
  },

  setProjectFilter: (id) => {
    set({ activeProjectId: id, selectedIds: [] });
    get().loadPrompts();
  },

  setCategoryFilter: (id) => {
    set({ activeCategoryId: id, selectedIds: [] });
    get().loadPrompts();
  },

  loadReferences: async () => {
    try {
      const [projects, categories, tags] = await Promise.all([
        window.referenceAPI.listProjects(),
        window.referenceAPI.listCategories(),
        window.referenceAPI.listTags(),
      ]);
      set({ projects, categories, tags });
    } catch (e) {
      console.error('Failed to load references', e);
    }
  },

  loadPrompts: async () => {
    set({ isLoading: true, error: null });
    try {
      const api = ensureAPI();
      const state = get();
      const prompts = await api.list({
        query: state.searchQuery,
        projectId: state.activeProjectId,
        categoryId: state.activeCategoryId,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
        isArchived: state.filter === 'archived',
        isFavorite: state.filter === 'favorites',
      });
      set({ prompts, isLoading: false });
    } catch (e: any) {
      console.error('[Store] loadPrompts error:', e);
      set({ error: e.message ?? 'Ошибка загрузки', isLoading: false });
    }
  },

  // 🔧 STAGE 8: сбрасываем dirty/draft и пишем в recent
  selectPrompt: (id) => {
    set({ selectedId: id, isDirty: false, draftContent: null });
    if (id) {
      get().addRecentPrompt(id);
    }
  },

  toggleSelectPrompt: (id) => {
    set((state) => {
      const exists = state.selectedIds.includes(id);
      return {
        selectedIds: exists
          ? state.selectedIds.filter((x) => x !== id)
          : [...state.selectedIds, id],
      };
    });
  },

  clearSelection: () => set({ selectedIds: [] }),

  createPrompt: async (input) => {
    const api = ensureAPI();
    const created = await api.create(input);
    await get().loadPrompts();
    get().clearSelection();
    return created;
  },

  updatePrompt: async (input) => {
    const api = ensureAPI();
    const updated = await api.update(input);
    // 🔧 STAGE 8: сбрасываем флаг "несохранено" после успешного сохранения
    set({ isDirty: false, draftContent: null });
    await get().loadPrompts();
    return updated;
  },

  archivePrompt: async (id) => {
    const api = ensureAPI();
    await api.archive(id);
    if (get().selectedId === id) set({ selectedId: null, isDirty: false });
    await get().loadPrompts();
    get().clearSelection();
  },

  restorePrompt: async (id) => {
    const api = ensureAPI();
    await api.restore(id);
    await get().loadPrompts();
    get().clearSelection();
  },

  deletePermanently: async (id) => {
    const api = ensureAPI();
    await api.deletePermanently(id);
    if (get().selectedId === id) set({ selectedId: null, isDirty: false });
    await get().loadPrompts();
    get().clearSelection();
  },

  toggleFavorite: async (id) => {
    const api = ensureAPI();
    await api.toggleFavorite(id);
    await get().loadPrompts();
  },

  clearError: () => set({ error: null }),

  // 🔧 STAGE 8: новые методы
  setDirty: (dirty) => set({ isDirty: dirty }),
  
  setDraftContent: (content) => {
    set({ draftContent: content, isDirty: true });
  },
  
  setAutosaveEnabled: (enabled) => set({ autosaveEnabled: enabled }),
  
  loadRecentPrompts: async () => {
    try {
      if (!window.recentAPI) return;
      const recent = await window.recentAPI.list();
      set({ recentPrompts: recent });
    } catch (e) {
      console.error('Failed to load recent prompts', e);
    }
  },
  
  addRecentPrompt: async (promptId) => {
    try {
      if (!window.recentAPI) return;
      await window.recentAPI.add(promptId);
      await get().loadRecentPrompts();
    } catch (e) {
      console.error('Failed to add recent prompt', e);
    }
  },
  
  clearRecentPrompts: async () => {
    try {
      if (!window.recentAPI) return;
      await window.recentAPI.clear();
      set({ recentPrompts: [] });
    } catch (e) {
      console.error('Failed to clear recent prompts', e);
    }
  },
}));