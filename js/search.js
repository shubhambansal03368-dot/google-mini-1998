/**
 * search.js - Search Engine & Ranking Core
 * 
 * Supports both:
 * 1. Traditional Keyword Frequency Ranking (Pre-Google 1997 / AltaVista style)
 * 2. Google PageRank Ranking (1998 / Page & Brin Stanford breakthrough)
 */

class SearchEngine {
  /**
   * @param {Array} dataset - Dataset from dataset.js
   * @param {Object} pageRankScores - Computed PageRank scores dictionary { id: score }
   */
  constructor(dataset, pageRankScores) {
    this.dataset = dataset;
    this.pageRankScores = pageRankScores;
  }

  /**
   * Update the PageRank scores used for ranking
   * @param {Object} newScores 
   */
  updatePageRankScores(newScores) {
    this.pageRankScores = newScores;
  }

  /**
   * Count occurrences of search query words in text.
   * Case-insensitive. Accurately handles single keywords and multi-word phrases.
   * 
   * @param {string} text - The page text
   * @param {string} query - The search query
   * @returns {number} Number of keyword occurrences
   */
  countKeywordFrequency(text, query) {
    if (!query || !text) return 0;

    const trimmedQuery = query.trim().toLowerCase();
    const cleanText = text.toLowerCase();

    // Check for exact phrase first
    if (trimmedQuery.length === 0) return 0;

    // Split query into terms to support multi-word queries
    const terms = trimmedQuery.split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) return 0;

    let totalCount = 0;

    terms.forEach(term => {
      // Escape special regex characters
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use regex to match occurrences with word or sub-word sensitivity
      const regex = new RegExp(`\\b${escapedTerm}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        totalCount += matches.length;
      } else {
        // Fallback for compound or hyphenated words (e.g., wood-fired, pizza-dough)
        const fallbackRegex = new RegExp(escapedTerm, 'gi');
        const fallbackMatches = text.match(fallbackRegex);
        if (fallbackMatches) {
          totalCount += fallbackMatches.length;
        }
      }
    });

    return totalCount;
  }

  /**
   * Highlight query terms in snippet text for authentic SERP display.
   * 
   * @param {string} text 
   * @param {string} query 
   * @returns {string} HTML string with <mark> tags
   */
  highlightSnippet(text, query) {
    if (!query || !text) return text;
    const terms = query.trim().split(/\s+/).filter(t => t.length > 0);
    if (terms.length === 0) return text;

    let highlighted = text;
    terms.forEach(term => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedTerm})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="retro-mark">$1</mark>');
    });
    return highlighted;
  }

  /**
   * Execute search in either "keyword" or "pagerank" mode.
   * 
   * @param {string} query - Search query
   * @param {string} mode - "keyword" | "pagerank"
   * @returns {Object} Search results metadata and ranked items
   */
  search(query, mode = "pagerank") {
    const trimmed = (query || "").trim();

    if (!trimmed) {
      return {
        query: "",
        mode,
        totalFound: 0,
        results: [],
        isEmpty: true
      };
    }

    // Filter relevant pages that contain the searched keyword(s)
    const matchingPages = [];

    this.dataset.forEach(page => {
      // Check in page text, plus title and url as well for full relevance
      const textFreq = this.countKeywordFrequency(page.text, trimmed);
      const titleFreq = this.countKeywordFrequency(page.title, trimmed);
      const urlFreq = this.countKeywordFrequency(page.url, trimmed);

      // A page matches if the keyword appears in its text or URL or title
      // Requirement specifically states: "Count how many times it appears in each page's text"
      // and "Only display relevant search results containing the searched keyword"
      if (textFreq > 0 || titleFreq > 0 || urlFreq > 0) {
        const pr = this.pageRankScores[page.id] !== undefined ? this.pageRankScores[page.id] : 0.15;
        
        matchingPages.push({
          id: page.id,
          url: page.url,
          title: page.title,
          text: page.text,
          description: page.description,
          linksTo: [...page.linksTo],
          incomingLinks: [...(page.incomingLinks || [])],
          keywordCount: textFreq, // Text frequency as required
          titleAndUrlMatch: (titleFreq > 0 || urlFreq > 0),
          pageRank: pr,
          highlightedText: this.highlightSnippet(page.text, trimmed),
          highlightedTitle: this.highlightSnippet(page.title, trimmed)
        });
      }
    });

    // Rank matching pages based on selected mode
    if (mode === "keyword") {
      // Mode A: Traditional Keyword Ranking
      // Rank pages by keyword frequency in descending order
      matchingPages.sort((a, b) => {
        if (b.keywordCount !== a.keywordCount) {
          return b.keywordCount - a.keywordCount;
        }
        // Stable secondary tie-breaker by ID
        return a.id - b.id;
      });
    } else {
      // Mode B: Google PageRank (1998)
      // Rank pages by PageRank score in descending order
      matchingPages.sort((a, b) => {
        if (b.pageRank !== a.pageRank) {
          return b.pageRank - a.pageRank;
        }
        // Secondary tie-breaker by keyword count, then ID
        if (b.keywordCount !== a.keywordCount) {
          return b.keywordCount - a.keywordCount;
        }
        return a.id - b.id;
      });
    }

    // Add 1-based position numbers
    const rankedResults = matchingPages.map((page, index) => ({
      ...page,
      position: index + 1
    }));

    return {
      query: trimmed,
      mode,
      totalFound: rankedResults.length,
      results: rankedResults,
      isEmpty: false
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SearchEngine };
}
