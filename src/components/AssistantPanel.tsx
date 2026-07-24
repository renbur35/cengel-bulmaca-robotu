'use client';

import React, { useEffect, useState } from 'react';
import { usePuzzleStore } from '../store/usePuzzleStore';
import { SolverRequest, SolverResponse } from '../workers/solver.worker';
import { findSlotsForCell, SlotInfo } from '../utils/slotUtils';

export default function AssistantPanel() {
  const { grid, selectedCellId, updateCell, selectionBounds, isDragging } = usePuzzleStore();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [activeSlots, setActiveSlots] = useState<{ horizontal: SlotInfo | null, vertical: SlotInfo | null }>({ horizontal: null, vertical: null });
  const [hSuggestions, setHSuggestions] = useState<string[]>([]);
  const [vSuggestions, setVSuggestions] = useState<string[]>([]);
  const [clues, setClues] = useState<Record<string, string>>({});

  useEffect(() => {
    const w = new Worker(new URL('../workers/solver.worker', import.meta.url));
    setWorker(w);

    w.onmessage = (e: MessageEvent<SolverResponse>) => {
      if (e.data.type === 'INIT_DONE') {
        setIsLoading(false);
      } else if (e.data.type === 'PATTERN_RESULTS') {
        if (e.data.reqId === 'H') setHSuggestions(e.data.results);
        if (e.data.reqId === 'V') setVSuggestions(e.data.results);
      }
    };

    w.postMessage({ type: 'INIT', dictUrl: '/turkce_kelime_listesi.txt' } as SolverRequest);

    return () => {
      w.terminate();
    };
  }, []);

  // Seçili hücre değiştiğinde veya grid güncellendiğinde slotları bul ve Worker'dan kelime iste
  useEffect(() => {
    if (!selectedCellId || !worker || isLoading || isDragging) {
      if (isDragging) return; // Sürükleme bitene kadar bekle
      setActiveSlots({ horizontal: null, vertical: null });
      setHSuggestions([]);
      setVSuggestions([]);
      return;
    }

    const [sx, sy] = selectedCellId.split('-');
    const x = parseInt(sx);
    const y = parseInt(sy);
    
    const slots = findSlotsForCell(grid.cells, grid.width, grid.height, x, y, selectionBounds);
    setActiveSlots(slots);

    if (slots.horizontal) {
      worker.postMessage({ type: 'FIND_PATTERN', pattern: slots.horizontal.pattern, reqId: 'H' } as SolverRequest);
    } else {
      setHSuggestions([]);
    }

    if (slots.vertical) {
      worker.postMessage({ type: 'FIND_PATTERN', pattern: slots.vertical.pattern, reqId: 'V' } as SolverRequest);
    } else {
      setVSuggestions([]);
    }
  }, [selectedCellId, selectionBounds, isDragging, grid.cells, grid.width, grid.height, worker, isLoading]);

  // Yeni kelimeler listelendiğinde anlamlarını (ipuçlarını) TDK'dan çek
  useEffect(() => {
    const fetchClues = async (words: string[]) => {
      // Sadece ilk 15 kelime için anlam çek (performans ve API limiti)
      const toFetch = words.slice(0, 15).filter(w => !clues[w]);
      if (toFetch.length === 0) return;
      
      const newClues = { ...clues };
      let updated = false;

      // İstekleri aynı anda yığıp TDK'yı kilitlememek için sırayla (sequential) gönderiyoruz
      for (const word of toFetch) {
        try {
          const res = await fetch(`/api/tdk?word=${encodeURIComponent(word.toLocaleLowerCase('tr-TR'))}`);
          const data = await res.json();
          if (data.meaning) {
            newClues[word] = data.meaning;
            updated = true;
            // Her başarılı/başarısız istekten sonra state'i güncelleyelim ki arayüz anında tepki versin
            setClues(prev => ({ ...prev, [word]: data.meaning }));
          } else {
            // Bulunamayanları da kaydedelim ki tekrar tekrar aramasın
            newClues[word] = '';
            setClues(prev => ({ ...prev, [word]: '' }));
          }
          // Sunucuyu yormamak için kısa bir bekleme (throttle) eklenebilir
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error("TDK fetch error for", word, error);
        }
      }
    };

    if (hSuggestions.length > 0) fetchClues(hSuggestions);
    if (vSuggestions.length > 0) fetchClues(vSuggestions);
  }, [hSuggestions, vSuggestions, clues]);

  const handleApplyWord = (word: string, slot: SlotInfo) => {
    // Kelimeyi ızgaraya yerleştir
    for (let i = 0; i < slot.length; i++) {
      const x = slot.direction === 'HORIZONTAL' ? slot.startX + i : slot.startX;
      const y = slot.direction === 'VERTICAL' ? slot.startY + i : slot.startY;
      updateCell(`${x}-${y}`, { type: 'LETTER', value: word[i] });
    }

    // Varsa ipucu kutusuna kelimeyi yaz (veya hücreyi ipucu kutusuna dönüştür)
    if (slot.clueCellId && slot.clueDirection) {
      const clueCell = grid.cells[slot.clueCellId];
      if (clueCell) {
        // Eğer TDK'dan anlam bulunmuşsa onu yaz, yoksa kelimenin kendisini (büyük harfle)
        const clueText = (clues[word] && clues[word] !== '') ? clues[word] : word.toLocaleUpperCase('tr-TR');
        
        const newClues = clueCell.clues ? [...clueCell.clues] : [];
        const clueIndex = newClues.findIndex(c => c.direction === slot.clueDirection);
        if (clueIndex !== -1) {
          newClues[clueIndex] = { ...newClues[clueIndex], text: clueText };
        } else {
          newClues.push({ text: clueText, direction: slot.clueDirection as any, targetCoord: [slot.startX, slot.startY] });
        }
        updateCell(slot.clueCellId, { type: 'CLUE', clues: newClues, value: undefined });
      }
    }
  };

  const renderSuggestions = (title: string, slot: SlotInfo | null, suggestions: string[]) => {
    if (!slot) return null;
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-bold text-slate-700">
            {title} <span className="text-blue-600">({slot.length} Harf)</span>
          </h3>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {suggestions.length} sonuç
          </span>
        </div>
        <div className="text-xs font-mono bg-slate-800 text-white p-2 rounded mb-3 tracking-[0.2em] text-center shadow-inner">
          {slot.pattern}
        </div>
        
        <div className="max-h-[300px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar">
          {suggestions.length === 0 ? (
            <div className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded border border-dashed border-slate-200">
              Uygun kelime bulunamadı
            </div>
          ) : (
            suggestions.map((word, idx) => (
              <div
                key={idx}
                className="group p-2.5 bg-white border border-slate-200 rounded hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer relative"
                onClick={() => handleApplyWord(word, slot)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-700 tracking-widest text-sm">
                    {word}
                  </span>
                  <button className="opacity-0 group-hover:opacity-100 text-blue-600 text-[10px] uppercase font-bold bg-blue-50 px-2 py-1 rounded shadow-sm border border-blue-200 hover:bg-blue-600 hover:text-white transition-colors">
                    Seç
                  </button>
                </div>
                
                {/* TDK Anlamı */}
                <div className="text-[10px] text-slate-500 leading-tight">
                  {idx < 15 ? (clues[word] || <span className="animate-pulse opacity-50">İpucu aranıyor...</span>) : (
                    <span className="opacity-40 italic">...</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-slate-50 border-l border-slate-200 p-5 flex flex-col h-full shadow-xl z-10 overflow-hidden">
      <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
        <span className="bg-blue-600 text-white w-7 h-7 rounded-md flex justify-center items-center mr-3 shadow-sm text-sm">
          ✨
        </span>
        Kelime Önerileri
      </h2>

      {isLoading ? (
        <div className="flex items-center space-x-2 text-sm text-slate-500 animate-pulse mb-4 p-3 bg-white rounded-lg border border-slate-200">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin"></div>
          <span>Sözlük yükleniyor...</span>
        </div>
      ) : (
        <div className="text-xs text-emerald-600 font-medium mb-4 p-2 bg-emerald-50 rounded border border-emerald-100 flex items-center">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Sözlük hazır (76.000 Kelime)
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1">
        {!selectedCellId ? (
          <div className="flex flex-col items-center justify-center h-40 text-center p-4 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="text-3xl mb-2 opacity-50">👆</div>
            <p className="text-sm font-medium text-slate-500">
              Öneri almak için ızgarada bir harf veya ipucu kutusu seçin.
            </p>
          </div>
        ) : (!activeSlots.horizontal && !activeSlots.vertical) ? (
          <div className="text-sm text-amber-600 font-medium p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
            Seçili alanda geçerli bir kelime boşluğu (en az 2 harfli) bulunamadı.
          </div>
        ) : (
          <>
            {renderSuggestions("Yatay", activeSlots.horizontal, hSuggestions)}
            {activeSlots.horizontal && activeSlots.vertical && (
              <div className="h-px bg-slate-200 w-full my-4"></div>
            )}
            {renderSuggestions("Dikey", activeSlots.vertical, vSuggestions)}
          </>
        )}
      </div>
    </div>
  );
}
