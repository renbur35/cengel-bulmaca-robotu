export type Direction = 'RIGHT' | 'DOWN' | 'RIGHT_DOWN' | 'DOWN_RIGHT';

export type CellType = 'LETTER' | 'CLUE' | 'PHOTO' | 'EMPTY';

export interface ClueData {
  text: string;             // Kısa ve öz ipucu metni
  direction: Direction;     // Ok yönü
  targetCoord: [number, number]; // Cevabın başladığı hücre koordinatı
}

export interface CellData {
  id: string;               // Eşsiz ID, genelde `${x}-${y}`
  x: number;
  y: number;
  type: CellType;
  value?: string;           // Harf hücresi ise (Örn: "A")
  clues?: ClueData[];       // İpucu hücresi ise (Bir hücrede max 2 ipucu: biri sağa, biri aşağı)
  photoUrl?: string;        // 'PHOTO' (Kesme/Fotoğraf) hücresi ise
  photoWidth?: number;      // Fotoğrafın grid üzerinde kapladığı genişlik (Örn: 3)
  photoHeight?: number;     // Fotoğrafın grid üzerinde kapladığı yükseklik (Örn: 3)
  isHiddenByPhoto?: boolean;// Başka bir fotoğrafın altında kaldığı için render edilmemesi gereken hücre
  isMetaHighlight?: boolean;// Gizli çözüm (Meta-Puzzle) parçası mı?
}

// Bulmaca veri modeli
export interface PuzzleGrid {
  width: number;
  height: number;
  cells: Record<string, CellData>; // Anahtar: `x-y`
}
