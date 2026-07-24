import { create } from 'zustand';
import { CellData, CellType, Direction, ClueData, PuzzleGrid } from '../types';

export type EditorMode = 'LETTER' | 'CLUE' | 'PHOTO';

interface PuzzleState {
  grid: PuzzleGrid;
  editorMode: EditorMode;
  // Seçim / Sürükleme
  selectedCellId: string | null;
  selectionBounds: { startX: number; startY: number; endX: number; endY: number } | null;
  isDragging: boolean;

  // Actions
  initializeGrid: (width: number, height: number) => void;
  updateCell: (id: string, partial: Partial<CellData>) => void;
  setSelectedCellId: (id: string | null) => void;
  startSelection: (x: number, y: number) => void;
  updateSelection: (x: number, y: number) => void;
  endSelection: () => void;
  
  setEditorMode: (mode: EditorMode) => void;
  addPhoto: (x: number, y: number, width: number, height: number, url?: string) => void;
  removePhoto: (x: number, y: number, width: number, height: number) => void;
  setGridCells: (cells: Record<string, CellData>) => void;
  clearGrid: () => void;
  
  // Asistan
  isAssistantOpen: boolean;
  toggleAssistant: () => void;
  suggestedWords?: string[];
  setSuggestedWords?: (words: string[]) => void;
}

export const usePuzzleStore = create<PuzzleState>((set) => ({
  grid: {
    width: 15,
    height: 15,
    cells: {},
  },
  selectedCellId: null,
  selectionBounds: null,
  isDragging: false,
  editorMode: 'LETTER',
  isAssistantOpen: true,

  toggleAssistant: () => set((state) => ({ isAssistantOpen: !state.isAssistantOpen })),

  initializeGrid: (width: number, height: number) => {
    const cells: Record<string, CellData> = {};
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const id = `${x}-${y}`;
        cells[id] = { id, x, y, type: 'EMPTY' };
      }
    }
    set({ grid: { width, height, cells } });
  },

  updateCell: (id: string, partial: Partial<CellData>) => {
    set((state) => ({
      grid: {
        ...state.grid,
        cells: {
          ...state.grid.cells,
          [id]: {
            ...state.grid.cells[id],
            ...partial,
          },
        },
      },
    }));
  },

  setSelectedCellId: (id: string | null) => {
    if (!id) {
      set({ selectedCellId: null, selectionBounds: null });
    } else {
      const [x, y] = id.split('-').map(Number);
      set({ selectedCellId: id, selectionBounds: { startX: x, startY: y, endX: x, endY: y } });
    }
  },

  startSelection: (x: number, y: number) => {
    set({
      selectedCellId: `${x}-${y}`,
      isDragging: true,
      selectionBounds: { startX: x, startY: y, endX: x, endY: y }
    });
  },

  updateSelection: (x: number, y: number) => {
    set((state) => {
      if (!state.isDragging || !state.selectionBounds) return state;
      const { startX, startY } = state.selectionBounds;
      
      // Hangi eksende daha çok ilerlemişse o ekseni kilitliyoruz (yatay veya dikey)
      const dx = Math.abs(x - startX);
      const dy = Math.abs(y - startY);
      
      let endX = startX;
      let endY = startY;
      
      if (dx > dy) {
        endX = x;
        endY = startY;
      } else {
        endX = startX;
        endY = y;
      }
      
      return { selectionBounds: { startX, startY, endX, endY } };
    });
  },

  endSelection: () => {
    set({ isDragging: false });
  },

  setEditorMode: (mode: EditorMode) => {
    set({ editorMode: mode });
  },

  addPhoto: (x: number, y: number, width: number, height: number, url?: string) => {
    set((state) => {
      const newCells = { ...state.grid.cells };
      
      // Mark the main cell
      const mainId = `${x}-${y}`;
      if (!newCells[mainId]) return state;
      
      newCells[mainId] = {
        ...newCells[mainId],
        type: 'PHOTO',
        photoWidth: width,
        photoHeight: height,
        photoUrl: url,
        value: undefined,
        clues: undefined
      };

      // Hide the other cells that fall under the photo
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          if (i === 0 && j === 0) continue; // Skip main cell
          const hideId = `${x + i}-${y + j}`;
          if (newCells[hideId]) {
            newCells[hideId] = {
              ...newCells[hideId],
              isHiddenByPhoto: true,
              type: 'EMPTY',
              value: undefined,
              clues: undefined
            };
          }
        }
      }

      return { grid: { ...state.grid, cells: newCells } };
    });
  },

  removePhoto: (x: number, y: number, width: number, height: number) => {
    set((state) => {
      const newCells = { ...state.grid.cells };
      
      for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
          const id = `${x + i}-${y + j}`;
          if (newCells[id]) {
            newCells[id] = {
              ...newCells[id],
              type: 'EMPTY',
              photoWidth: undefined,
              photoHeight: undefined,
              photoUrl: undefined,
              isHiddenByPhoto: false,
              value: undefined,
              clues: undefined
            };
          }
        }
      }
      return { grid: { ...state.grid, cells: newCells } };
    });
  },

  setGridCells: (cells: Record<string, CellData>) => {
    set((state) => ({ grid: { ...state.grid, cells } }));
  },

  clearGrid: () => {
    set((state) => {
      const newCells = { ...state.grid.cells };
      for (const id in newCells) {
        newCells[id] = { ...newCells[id], type: 'EMPTY', value: undefined, clues: undefined, photoUrl: undefined, isMetaHighlight: false };
      }
      return { grid: { ...state.grid, cells: newCells } };
    });
  },
  
  setSuggestedWords: (words: string[]) => {
    set({ suggestedWords: words });
  }
}));
