import { PuzzleGrid, CellData } from '../types';

export interface QualityMetrics {
  fillPercentage: number;
  intersectionScore: number;
  deadEnds: number;
  isFullyConnected: boolean;
}

export function calculateQuality(grid: PuzzleGrid): QualityMetrics {
  const cells = Object.values(grid.cells);
  
  // Sadece harf olan veya boş harf olabilecek hücreler
  const letterCells = cells.filter(c => c.type === 'LETTER' || c.type === 'EMPTY');
  const filledCells = letterCells.filter(c => c.value && c.value.trim().length > 0);
  
  const fillPercentage = letterCells.length > 0 
    ? Math.round((filledCells.length / letterCells.length) * 100) 
    : 0;

  let deadEnds = 0;
  let intersections = 0;

  // Tüm dolu hücreler için komşuları kontrol et
  filledCells.forEach(cell => {
    let horizontalNeighbors = 0;
    let verticalNeighbors = 0;

    // Yatay komşular (Sol ve Sağ)
    if (grid.cells[`${cell.x - 1}-${cell.y}`]?.value) horizontalNeighbors++;
    if (grid.cells[`${cell.x + 1}-${cell.y}`]?.value) horizontalNeighbors++;

    // Dikey komşular (Üst ve Alt)
    if (grid.cells[`${cell.x}-${cell.y - 1}`]?.value) verticalNeighbors++;
    if (grid.cells[`${cell.x}-${cell.y + 1}`]?.value) verticalNeighbors++;

    // Çıkmaz sokak: Sadece 1 tarafı açık (yani sadece 1 komşusu var, kelime oluşturmuyor)
    // Ama tam bir kelime ucu da olabilir. Gerçek "dead end" 3 tarafı siyah/kapalı olan hücredir.
    let blockedSides = 0;
    if (cell.x === 0 || grid.cells[`${cell.x - 1}-${cell.y}`]?.type === 'CLUE' || grid.cells[`${cell.x - 1}-${cell.y}`]?.type === 'PHOTO') blockedSides++;
    if (cell.x === grid.width - 1 || grid.cells[`${cell.x + 1}-${cell.y}`]?.type === 'CLUE' || grid.cells[`${cell.x + 1}-${cell.y}`]?.type === 'PHOTO') blockedSides++;
    if (cell.y === 0 || grid.cells[`${cell.x}-${cell.y - 1}`]?.type === 'CLUE' || grid.cells[`${cell.x}-${cell.y - 1}`]?.type === 'PHOTO') blockedSides++;
    if (cell.y === grid.height - 1 || grid.cells[`${cell.x}-${cell.y + 1}`]?.type === 'CLUE' || grid.cells[`${cell.x}-${cell.y + 1}`]?.type === 'PHOTO') blockedSides++;

    if (blockedSides >= 3) {
      deadEnds++;
    }

    // Kesişim: Hücre hem yatay hem dikey bir kelimeye dahilse (komşuları varsa)
    if ((horizontalNeighbors > 0 || (grid.cells[`${cell.x - 1}-${cell.y}`]?.type === 'CLUE' && horizontalNeighbors===0 && grid.cells[`${cell.x + 1}-${cell.y}`]?.value)) && 
        (verticalNeighbors > 0 || (grid.cells[`${cell.x}-${cell.y - 1}`]?.type === 'CLUE' && verticalNeighbors===0 && grid.cells[`${cell.x}-${cell.y + 1}`]?.value))) {
      // Bu çok kaba bir yaklaşım, ancak sağ/sol ve üst/alt yönlerinde bir hareketlilik varsa kesişim sayılır.
      intersections++;
    }
  });

  const intersectionScore = filledCells.length > 0 
    ? Math.round((intersections / filledCells.length) * 100) 
    : 0;

  // Flood-fill for connectivity
  let isFullyConnected = true;
  if (filledCells.length > 0) {
    const visited = new Set<string>();
    const stack = [filledCells[0]];
    visited.add(filledCells[0].id);

    while(stack.length > 0) {
      const curr = stack.pop()!;
      
      const neighbors = [
        grid.cells[`${curr.x - 1}-${curr.y}`],
        grid.cells[`${curr.x + 1}-${curr.y}`],
        grid.cells[`${curr.x}-${curr.y - 1}`],
        grid.cells[`${curr.x}-${curr.y + 1}`],
      ];

      for (const n of neighbors) {
        if (n && n.value && !visited.has(n.id)) {
          visited.add(n.id);
          stack.push(n);
        }
      }
    }

    isFullyConnected = visited.size === filledCells.length;
  }

  return {
    fillPercentage,
    intersectionScore,
    deadEnds,
    isFullyConnected
  };
}
