'use client';

import React, { useMemo, useState } from 'react';
import { usePuzzleStore } from '../store/usePuzzleStore';
import { calculateQuality } from '../utils/qualityEngine';

export default function QualityPanel() {
  const { grid, initializeGrid } = usePuzzleStore();
  const [newWidth, setNewWidth] = useState(grid.width.toString());
  const [newHeight, setNewHeight] = useState(grid.height.toString());

  const metrics = useMemo(() => calculateQuality(grid), [grid]);

  const handleResize = () => {
    const w = parseInt(newWidth, 10);
    const h = parseInt(newHeight, 10);
    if (!isNaN(w) && !isNaN(h) && w > 2 && h > 2 && w <= 30 && h <= 30) {
      if(confirm('Grid boyutu değiştiğinde mevcut bulmaca silinir. Onaylıyor musunuz?')) {
        initializeGrid(w, h);
      }
    } else {
      alert('Lütfen 3 ile 30 arasında geçerli boyutlar girin.');
    }
  };

  return (
    <div className="h-16 bg-slate-800 text-white flex items-center px-6 justify-between shadow-lg relative z-20 shrink-0">
      <div className="flex items-center space-x-6 pl-12">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">Grid Boyutu</span>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-slate-400" title="Genişlik">Sütun:</span>
              <input 
                type="number" 
                value={newWidth} 
                onChange={e => setNewWidth(e.target.value)}
                className="w-10 bg-slate-700 text-white text-xs px-1 py-0.5 rounded border border-slate-600 focus:outline-none focus:border-blue-400 text-center" 
              />
            </div>
            <span className="text-slate-500 text-xs font-bold">x</span>
            <div className="flex items-center space-x-1">
              <span className="text-[10px] text-slate-400" title="Yükseklik">Satır:</span>
              <input 
                type="number" 
                value={newHeight} 
                onChange={e => setNewHeight(e.target.value)}
                className="w-10 bg-slate-700 text-white text-xs px-1 py-0.5 rounded border border-slate-600 focus:outline-none focus:border-blue-400 text-center" 
              />
            </div>
            <button 
              onClick={handleResize}
              className="ml-2 px-2 py-0.5 bg-blue-600 hover:bg-blue-500 rounded text-[10px] font-bold transition-colors"
            >
              Uygula
            </button>
          </div>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Doluluk</span>
          <div className="flex items-center">
            <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden mr-3">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${metrics.fillPercentage}%` }}
              />
            </div>
            <span className="text-sm font-bold w-9">{metrics.fillPercentage}%</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Kesişim Skoru</span>
          <span className={`text-sm font-bold ${metrics.intersectionScore >= 70 ? 'text-emerald-400' : 'text-amber-400'}`}>
            %{metrics.intersectionScore}
            {metrics.intersectionScore < 70 && metrics.fillPercentage > 10 && ' (Hedef %70+)'}
          </span>
        </div>
        
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Uyarılar</span>
          <span className="text-sm font-bold flex items-center space-x-3">
            {metrics.deadEnds > 0 && (
              <span className="text-red-400 flex items-center">
                <span className="mr-1">🚨</span> {metrics.deadEnds} Çıkmaz Sokak
              </span>
            )}
            {!metrics.isFullyConnected && metrics.fillPercentage > 0 && (
              <span className="text-red-400 flex items-center">
                <span className="mr-1">⚠️</span> Kopuk Adacıklar
              </span>
            )}
            {metrics.deadEnds === 0 && metrics.isFullyConnected && (
              <span className="text-emerald-400">✅ Sorun Yok</span>
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button 
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm font-medium transition-colors border border-slate-600"
        >
          PDF Çıktısı Al
        </button>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors shadow-md shadow-blue-900/20">
          Çözümü Doğrula
        </button>
      </div>
    </div>
  );
}
