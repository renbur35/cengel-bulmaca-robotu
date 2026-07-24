import { Trie } from './trie';

const trie = new Trie();
let isReady = false;

// Worker mesaj tipleri
export type SolverRequest = 
  | { type: 'INIT'; dictUrl: string }
  | { type: 'FIND_PATTERN'; pattern: string; reqId?: string };

export type SolverResponse = 
  | { type: 'INIT_DONE' }
  | { type: 'PATTERN_RESULTS'; pattern: string; results: string[]; reqId?: string };

self.onmessage = async (e: MessageEvent<SolverRequest>) => {
  const req = e.data;

  if (req.type === 'INIT') {
    try {
      const response = await fetch(req.dictUrl);
      const text = await response.text();
      
      const words = text.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length > 0);
      
      for (const word of words) {
        // Türkçe karakter sorununu basitleştirmek için toUpperCase kullandık,
        // gerçeğe daha uygun olması için tr-TR locale kullanılabilir.
        trie.insert(word);
      }
      
      isReady = true;
      self.postMessage({ type: 'INIT_DONE' });
    } catch (err) {
      console.error('Dictionary load error:', err);
    }
  }

  if (req.type === 'FIND_PATTERN') {
    if (!isReady) return;
    const results = trie.findPattern(req.pattern);
    const limitedResults = results.sort(() => 0.5 - Math.random()).slice(0, 50);
    self.postMessage({
      type: 'PATTERN_RESULTS',
      pattern: req.pattern,
      results: limitedResults,
      reqId: req.reqId
    });
  }
};
