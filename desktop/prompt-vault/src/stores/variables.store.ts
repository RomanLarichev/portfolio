// src/stores/variables.store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VariablesState {
  // Значения переменных для текущего промпта
  currentValues: Record<string, string>;
  
  // История последних использованных значений (по имени переменной)
  history: Record<string, string[]>;

  // Actions
  setValue: (name: string, value: string) => void;
  setValues: (values: Record<string, string>) => void;
  clearValues: () => void;
  
  // История
  addToHistory: (name: string, value: string) => void;
  getHistory: (name: string) => string[];
}

export const useVariablesStore = create<VariablesState>()(
  persist(
    (set, get) => ({
      currentValues: {},
      history: {},

      setValue: (name, value) => {
        set((state) => ({
          currentValues: { ...state.currentValues, [name]: value },
        }));
      },

      setValues: (values) => {
        set((state) => ({
          currentValues: { ...state.currentValues, ...values },
        }));
      },

      clearValues: () => {
        set({ currentValues: {} });
      },

      addToHistory: (name, value) => {
        if (!value.trim()) return;
        
        set((state) => {
          const currentHistory = state.history[name] || [];
          // Удаляем дубликаты и добавляем в начало
          const newHistory = [value, ...currentHistory.filter((v) => v !== value)].slice(0, 10);
          return {
            history: { ...state.history, [name]: newHistory },
          };
        });
      },

      getHistory: (name) => {
        return get().history[name] || [];
      },
    }),
    {
      name: 'prompt-vault-variables', // Ключ в localStorage
    }
  )
);