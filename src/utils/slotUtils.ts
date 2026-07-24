import { CellData } from '../types';

export interface SlotInfo {
  startX: number;
  startY: number;
  length: number;
  direction: 'HORIZONTAL' | 'VERTICAL';
  pattern: string;
  clueCellId: string | null;
  clueDirection: 'RIGHT' | 'DOWN' | 'RIGHT_DOWN' | 'DOWN_RIGHT' | null;
}

export function findSlotsForCell(
  cells: Record<string, CellData>,
  width: number,
  height: number,
  x: number,
  y: number,
  selectionBounds: { startX: number; startY: number; endX: number; endY: number } | null = null
): { horizontal: SlotInfo | null; vertical: SlotInfo | null } {
  const result = { horizontal: null as SlotInfo | null, vertical: null as SlotInfo | null };
  
  if (selectionBounds) {
    const minX = Math.min(selectionBounds.startX, selectionBounds.endX);
    const maxX = Math.max(selectionBounds.startX, selectionBounds.endX);
    const minY = Math.min(selectionBounds.startY, selectionBounds.endY);
    const maxY = Math.max(selectionBounds.startY, selectionBounds.endY);
    
    // Eğer sadece tek bir hücre seçildiyse (sürüklenmediyse) eski "implicit" taramaya devam et
    if (minX !== maxX || minY !== maxY) {
      if (minX !== maxX) {
        // Yatay sürükleme yapılmış
        // İlk hücre (minX, minY) İpucu (CLUE) olacak. Geri kalanı kelime.
        let hPattern = '';
        for (let i = minX + 1; i <= maxX; i++) {
          const c = cells[`${i}-${minY}`];
          hPattern += (c && (c.type === 'LETTER' || c.type === 'EMPTY') && c.value) ? c.value : '_';
        }
        result.horizontal = {
          startX: minX + 1,
          startY: minY,
          length: maxX - minX,
          direction: 'HORIZONTAL',
          pattern: hPattern,
          clueCellId: `${minX}-${minY}`,
          clueDirection: 'RIGHT'
        };
      } else if (minY !== maxY) {
        // Dikey sürükleme yapılmış
        // İlk hücre (minX, minY) İpucu (CLUE) olacak. Geri kalanı kelime.
        let vPattern = '';
        for (let j = minY + 1; j <= maxY; j++) {
          const c = cells[`${minX}-${j}`];
          vPattern += (c && (c.type === 'LETTER' || c.type === 'EMPTY') && c.value) ? c.value : '_';
        }
        result.vertical = {
          startX: minX,
          startY: minY + 1,
          length: maxY - minY,
          direction: 'VERTICAL',
          pattern: vPattern,
          clueCellId: `${minX}-${minY}`,
          clueDirection: 'DOWN'
        };
      }
      return result;
    }
  }

  const target = cells[`${x}-${y}`];
  
  if (!target || target.type === 'PHOTO' || target.isHiddenByPhoto) {
    return result;
  }

  // --- YATAY (HORIZONTAL) ---
  let hStartX = target.type === 'CLUE' ? x + 1 : x;
  let hClueId = null;
  let hClueDir = null;
  while (hStartX >= 0) {
    const c = cells[`${hStartX}-${y}`];
    if (!c || c.type === 'PHOTO' || c.isHiddenByPhoto) {
      hStartX++;
      break;
    }
    if (c.type === 'CLUE') {
      hClueId = c.id;
      if (c.clues) {
        const d = c.clues.find(cl => cl.direction.includes('RIGHT'));
        if (d) hClueDir = d.direction;
      }
      hStartX++;
      break;
    }
    hStartX--;
  }
  if (hStartX < 0) hStartX = 0;
  
  let hLength = 0;
  let hPattern = '';
  for (let i = hStartX; i < width; i++) {
    const c = cells[`${i}-${y}`];
    if (!c || c.type === 'CLUE' || c.type === 'PHOTO' || c.isHiddenByPhoto) break;
    if (c.type === 'LETTER' || c.type === 'EMPTY') {
      hLength++;
      hPattern += c.value || '_';
    } else {
      break;
    }
  }
  if (hLength >= 2) {
    result.horizontal = {
      startX: hStartX,
      startY: y,
      length: hLength,
      direction: 'HORIZONTAL',
      pattern: hPattern,
      clueCellId: hClueId,
      clueDirection: hClueDir as any
    };
  }

  // --- DİKEY (VERTICAL) ---
  let vStartY = target.type === 'CLUE' ? y + 1 : y;
  let vClueId = null;
  let vClueDir = null;
  while (vStartY >= 0) {
    const c = cells[`${x}-${vStartY}`];
    if (!c || c.type === 'PHOTO' || c.isHiddenByPhoto) {
      vStartY++;
      break;
    }
    if (c.type === 'CLUE') {
      vClueId = c.id;
      if (c.clues) {
        const d = c.clues.find(cl => cl.direction.includes('DOWN'));
        if (d) vClueDir = d.direction;
      }
      vStartY++;
      break;
    }
    vStartY--;
  }
  if (vStartY < 0) vStartY = 0;

  let vLength = 0;
  let vPattern = '';
  for (let j = vStartY; j < height; j++) {
    const c = cells[`${x}-${j}`];
    if (!c || c.type === 'CLUE' || c.type === 'PHOTO' || c.isHiddenByPhoto) break;
    if (c.type === 'LETTER' || c.type === 'EMPTY') {
      vLength++;
      vPattern += c.value || '_';
    } else {
      break;
    }
  }
  if (vLength >= 2) {
    result.vertical = {
      startX: x,
      startY: vStartY,
      length: vLength,
      direction: 'VERTICAL',
      pattern: vPattern,
      clueCellId: vClueId,
      clueDirection: vClueDir as any
    };
  }

  return result;
}
