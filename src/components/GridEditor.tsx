'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePuzzleStore } from '../store/usePuzzleStore';
import { CellData, ClueData } from '../types';

const CELL_SIZE = 60; // Hücre boyutunu büyüttük ki ipucu sığsın

export default function GridEditor() {
  const { grid, initializeGrid, selectedCellId, setSelectedCellId, updateCell, editorMode, setEditorMode, addPhoto, removePhoto, startSelection, updateSelection, endSelection, selectionBounds, isDragging } = usePuzzleStore();
  const svgRef = useRef<SVGSVGElement>(null);
  
  // İpucu ekleme popup state'i
  const [showClueDialog, setShowClueDialog] = useState(false);
  const [clueText, setClueText] = useState('');
  const [clueDirection, setClueDirection] = useState<'RIGHT'|'DOWN'|'RIGHT_DOWN'|'DOWN_RIGHT'>('RIGHT');

  useEffect(() => {
    // 15x15 default grid
    initializeGrid(15, 15);
  }, [initializeGrid]);

  if (!grid.cells || Object.keys(grid.cells).length === 0) {
    return <div>Yükleniyor...</div>;
  }

  const handleCellClick = (id: string, x: number, y: number) => {
    setSelectedCellId(id);
    if (editorMode === 'PHOTO') {
      const cell = grid.cells[id];
      if (cell) {
        // Default 3x3 photo
        addPhoto(cell.x, cell.y, 3, 3);
        setEditorMode('LETTER'); // Geri dön
      }
    } else if (editorMode === 'CLUE') {
      setShowClueDialog(true);
    }
  };

  const handleSaveClue = () => {
    if (selectedCellId && clueText) {
      const cell = grid.cells[selectedCellId];
      // Mevcut ipuçlarını al veya yeni dizi oluştur
      const newClues: ClueData[] = cell.clues ? [...cell.clues] : [];
      newClues.push({
        text: clueText,
        direction: clueDirection,
        targetCoord: [cell.x, cell.y] // Şimdilik basitleştirilmiş hedef
      });
      
      updateCell(selectedCellId, { type: 'CLUE', clues: newClues, value: undefined });
    }
    setShowClueDialog(false);
    setClueText('');
    setEditorMode('LETTER');
  };
  const handleMouseDown = (x: number, y: number, id: string) => {
    if (editorMode !== 'LETTER') {
      handleCellClick(id, x, y);
      return;
    }
    startSelection(x, y);
  };

  const handleMouseEnter = (x: number, y: number) => {
    if (isDragging && editorMode === 'LETTER') {
      updateSelection(x, y);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      endSelection();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (!selectedCellId || editorMode !== 'LETTER') return;

    const cell = grid.cells[selectedCellId];
    if (!cell) return;

    // Harf girişi (A-Z, Türkçe karakterler dahil - Unicode destekli)
    if (/^\p{L}$/u.test(e.key)) {
      updateCell(selectedCellId, { type: 'LETTER', value: e.key.toLocaleUpperCase('tr-TR') });
      // Otomatik olarak sağa veya aşağıya geçme mantığı eklenebilir
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (cell.type === 'PHOTO') {
        removePhoto(cell.x, cell.y, cell.photoWidth || 3, cell.photoHeight || 3);
      } else {
        updateCell(selectedCellId, { type: 'EMPTY', value: undefined });
      }
    } else if (e.key === 'ArrowRight' && cell.x < grid.width - 1) {
      setSelectedCellId(`${cell.x + 1}-${cell.y}`);
    } else if (e.key === 'ArrowLeft' && cell.x > 0) {
      setSelectedCellId(`${cell.x - 1}-${cell.y}`);
    } else if (e.key === 'ArrowDown' && cell.y < grid.height - 1) {
      setSelectedCellId(`${cell.x}-${cell.y + 1}`);
    } else if (e.key === 'ArrowUp' && cell.y > 0) {
      setSelectedCellId(`${cell.x}-${cell.y - 1}`);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100 overflow-hidden print-area relative">
      
      {/* TOOLBAR */}
      <div className="h-14 bg-white border-b border-slate-200 flex items-center px-4 space-x-2 shrink-0">
        <span className="text-xs font-bold text-slate-500 uppercase mr-2">Mod:</span>
        <button 
          onClick={() => setEditorMode('LETTER')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editorMode === 'LETTER' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}
        >
          Harf/Seçim
        </button>
        <button 
          onClick={() => setEditorMode('CLUE')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editorMode === 'CLUE' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}
        >
          İpucu Ekle
        </button>
        <button 
          onClick={() => setEditorMode('PHOTO')}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editorMode === 'PHOTO' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100 text-slate-600'}`}
        >
          Fotoğraf Alanı Ekle (3x3)
        </button>
      </div>

      {/* CLUE DIALOG */}
      {showClueDialog && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-white p-4 rounded-lg shadow-2xl border border-slate-200 z-50 flex flex-col space-y-3 w-72">
          <h3 className="font-bold text-sm">İpucu Ekle</h3>
          <textarea 
            className="w-full border rounded p-2 text-sm h-16 focus:outline-blue-500"
            placeholder="Bir ilimiz..."
            value={clueText}
            onChange={(e) => setClueText(e.target.value)}
          />
          <select 
            className="border rounded p-2 text-sm"
            value={clueDirection}
            onChange={(e) => setClueDirection(e.target.value as any)}
          >
            <option value="RIGHT">Sağa Doğru (→)</option>
            <option value="DOWN">Aşağı Doğru (↓)</option>
            <option value="RIGHT_DOWN">Sağa ve Aşağı (↳)</option>
            <option value="DOWN_RIGHT">Aşağı ve Sağa (↲)</option>
          </select>
          <div className="flex justify-end space-x-2">
            <button className="px-3 py-1 text-sm text-slate-500 hover:bg-slate-100 rounded" onClick={() => setShowClueDialog(false)}>İptal</button>
            <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleSaveClue}>Kaydet</button>
          </div>
        </div>
      )}

      {/* CANVAS */}
      <div className="flex-1 overflow-auto p-8 flex items-start justify-center">
        <svg
          ref={svgRef}
          width={grid.width * CELL_SIZE}
          height={grid.height * CELL_SIZE}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="bg-white shadow-lg focus:outline-none select-none"
          style={{ cursor: 'crosshair' }}
        >
          {Object.values(grid.cells).map((cell: CellData) => {
            if (cell.isHiddenByPhoto) return null;

            // Seçim (drag) alanında mı kontrolü
            let isSelected = false;
            if (selectionBounds) {
              const minX = Math.min(selectionBounds.startX, selectionBounds.endX);
              const maxX = Math.max(selectionBounds.startX, selectionBounds.endX);
              const minY = Math.min(selectionBounds.startY, selectionBounds.endY);
              const maxY = Math.max(selectionBounds.startY, selectionBounds.endY);
              if (cell.x >= minX && cell.x <= maxX && cell.y >= minY && cell.y <= maxY) {
                isSelected = true;
              }
            } else if (selectedCellId === cell.id) {
              isSelected = true;
            }

            const xPos = cell.x * CELL_SIZE;
          const yPos = cell.y * CELL_SIZE;
          const width = cell.type === 'PHOTO' && cell.photoWidth ? cell.photoWidth * CELL_SIZE : CELL_SIZE;
          const height = cell.type === 'PHOTO' && cell.photoHeight ? cell.photoHeight * CELL_SIZE : CELL_SIZE;

          return (
            <g
              key={cell.id}
              onMouseDown={() => handleMouseDown(cell.x, cell.y, cell.id)}
              onMouseEnter={() => handleMouseEnter(cell.x, cell.y)}
              className="transition-colors duration-200"
            >
              <rect
                x={xPos}
                y={yPos}
                width={width}
                height={height}
                fill={
                  isSelected && editorMode === 'LETTER'
                    ? '#bfdbfe'
                    : cell.type === 'CLUE'
                    ? '#f8fafc' // Açık gri/beyaz ipucu kutusu
                    : cell.type === 'PHOTO'
                    ? '#334155' // Fotoğraf placeholder rengi (koyu gri)
                    : 'white'
                }
                stroke="#94a3b8" // Daha belirgin ızgara çizgileri
                strokeWidth="1.5"
              />
              
              {cell.type === 'LETTER' && cell.value && (
                <text
                  x={xPos + CELL_SIZE / 2}
                  y={yPos + CELL_SIZE / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="font-bold text-[34px] text-slate-800 uppercase"
                  style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
                >
                  {cell.value}
                </text>
              )}

              {cell.type === 'PHOTO' && (
                <text
                  x={xPos + width / 2}
                  y={yPos + height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="font-bold text-xl text-slate-400"
                >
                  [ FOTOĞRAF ]
                </text>
              )}

              {cell.type === 'CLUE' && cell.clues && (
                <foreignObject x={xPos + 2} y={yPos + 2} width={CELL_SIZE - 4} height={CELL_SIZE - 4}>
                  <div className="w-full h-full flex flex-col justify-start items-start text-[8px] leading-tight text-slate-800 overflow-hidden" xmlns="http://www.w3.org/1999/xhtml">
                    {cell.clues.map((clue, idx) => (
                      <div key={idx} className="mb-1 w-full border-b border-slate-200 pb-0.5 last:border-0 relative pr-3">
                        <span className="font-semibold">{clue.text}</span>
                        {/* Ok İkonları */}
                        <div className="absolute right-0 top-0 text-[10px] font-black text-blue-600">
                          {clue.direction === 'RIGHT' && '→'}
                          {clue.direction === 'DOWN' && '↓'}
                          {clue.direction === 'RIGHT_DOWN' && '↳'}
                          {clue.direction === 'DOWN_RIGHT' && '↲'}
                        </div>
                      </div>
                    ))}
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
    </div>
  );
}
