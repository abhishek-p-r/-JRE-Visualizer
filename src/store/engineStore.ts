import { create } from 'zustand';
import { produce } from 'immer';
import { parseAndGenerateHistory, defaultCode } from '../parser/javaEngine';

// --- Type Definitions ---
export interface JvmVariable {
  name: string;
  type: string;
  value: any; // primitives or reference id
  isReference: boolean;
}

export interface StackFrame {
  id: string;
  methodName: string;
  variables: JvmVariable[];
  isActive: boolean;
}

export interface Thread {
  id: string;
  name: string;
  frames: StackFrame[];
}

export interface HeapObject {
  id: string;
  className: string;
  fields: Record<string, any>;
  isGarbage: boolean;
  markedForDeletion: boolean;
}

export interface LoadedClass {
  name: string;
  staticFields: Record<string, any>;
}

export interface Metaspace {
  classes: Record<string, LoadedClass>;
}

export interface MemoryState {
  step: number;
  description: string;
  bytecode?: string;
  currentLine: number | null;
  metaspace: Metaspace;
  threads: Thread[];
  heap: Record<string, HeapObject>;
  stringPool: Record<string, string>;
}

// --- Store Definition ---
export interface EngineState {
  history: MemoryState[];
  currentIndex: number;
  isPlaying: boolean;
  speed: number;
  theme: 'dark' | 'light';
  viewMode: '3d' | '2d';
  explanation: { title: string; content: string; type: string } | null;
  
  // Actions
  setHistory: (history: MemoryState[]) => void;
  stepForward: () => void;
  stepBack: () => void;
  setIndex: (index: number) => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  toggleTheme: () => void;
  toggleViewMode: () => void;
  setViewMode: (mode: '3d' | '2d') => void;
  setExplanation: (explanation: { title: string; content: string; type: string } | null) => void;
  reset: () => void;
}

export const useEngineStore = create<EngineState>((set) => ({
  history: parseAndGenerateHistory(defaultCode),
  currentIndex: 0,
  isPlaying: false,
  speed: 1,
  theme: 'dark',
  viewMode: '3d',
  explanation: null,

  setHistory: (history) => set({ history, currentIndex: 0, isPlaying: false }),
  
  stepForward: () => set(produce((state: EngineState) => {
    if (state.currentIndex < state.history.length - 1) {
      state.currentIndex += 1;
    } else {
      state.isPlaying = false; // Stop playing if reached end
    }
  })),

  stepBack: () => set(produce((state: EngineState) => {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
    }
  })),

  setIndex: (index) => set({ currentIndex: index }),
  
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setSpeed: (speed) => set({ speed }),
  
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  toggleViewMode: () => set((state) => {
    if (state.viewMode === '3d') return { viewMode: '2d' };
    return { viewMode: '3d' };
  }),

  setExplanation: (explanation) => set({ explanation }),
  
  reset: () => set({ currentIndex: 0, isPlaying: false, explanation: null })
}));

export const selectCurrentState = (state: EngineState): MemoryState | null => {
  if (state.history.length === 0) return null;
  return state.history[state.currentIndex];
};
