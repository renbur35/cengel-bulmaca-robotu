export class TrieNode {
  children: Map<string, TrieNode>;
  isEndOfWord: boolean;

  constructor() {
    this.children = new Map();
    this.isEndOfWord = false;
  }
}

export class Trie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(word: string) {
    let current = this.root;
    for (const char of word) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
    }
    current.isEndOfWord = true;
  }

  // Örneğin: "A_K_R_" şeklinde verilen kalıpla eşleşen kelimeleri bulur
  // '_' wildcard karakteridir
  findPattern(pattern: string): string[] {
    const results: string[] = [];
    this.searchNode(this.root, pattern.toUpperCase(), 0, '', results);
    return results;
  }

  private searchNode(
    node: TrieNode,
    pattern: string,
    index: number,
    currentWord: string,
    results: string[]
  ) {
    if (index === pattern.length) {
      if (node.isEndOfWord) {
        results.push(currentWord);
      }
      return;
    }

    const char = pattern[index];
    if (char === '_' || char === ' ' || char === '?') {
      // Wildcard: tüm çocukları dolaş
      for (const [childChar, childNode] of node.children.entries()) {
        this.searchNode(
          childNode,
          pattern,
          index + 1,
          currentWord + childChar,
          results
        );
      }
    } else {
      // Spesifik harf
      if (node.children.has(char)) {
        this.searchNode(
          node.children.get(char)!,
          pattern,
          index + 1,
          currentWord + char,
          results
        );
      }
    }
  }
}
