/**
 * comparison.js - Side-by-Side Comparison Engine
 * 
 * Compares Keyword Frequency Ranking vs Google PageRank Ranking side-by-side
 * for any search query, generating position shifts, delta badges, and dynamic
 * pedagogical explanations derived strictly from actual calculated scores.
 */

class ComparisonEngine {
  /**
   * @param {SearchEngine} searchEngine 
   */
  constructor(searchEngine) {
    this.searchEngine = searchEngine;
  }

  /**
   * Generate full comparative analysis for a given query.
   * 
   * @param {string} query 
   * @returns {Object} { keywordResults, pageRankResults, shifts, insights }
   */
  compare(query) {
    const keywordResults = this.searchEngine.search(query, "keyword");
    const pageRankResults = this.searchEngine.search(query, "pagerank");

    // Map each page ID to its position in both modes
    const keywordPosMap = {};
    keywordResults.results.forEach(r => {
      keywordPosMap[r.id] = r.position;
    });

    const pageRankPosMap = {};
    pageRankResults.results.forEach(r => {
      pageRankPosMap[r.id] = r.position;
    });

    // Compute rank shifts (PageRank position vs Keyword position)
    // Positive shift means PageRank ranked it higher (better position number, e.g. from 3 to 1 is +2 improvement)
    const shifts = pageRankResults.results.map(prItem => {
      const kwPos = keywordPosMap[prItem.id];
      const prPos = prItem.position;
      const delta = kwPos !== undefined ? (kwPos - prPos) : 0; // if kwPos=3 and prPos=1, delta = +2 (rose 2 spots)

      let direction = "same";
      if (delta > 0) direction = "up";
      else if (delta < 0) direction = "down";

      return {
        id: prItem.id,
        url: prItem.url,
        keywordPos: kwPos,
        pageRankPos: prPos,
        delta: delta,
        direction: direction,
        keywordCount: prItem.keywordCount,
        pageRank: prItem.pageRank,
        incomingLinksCount: prItem.incomingLinks.length,
        outgoingLinksCount: prItem.linksTo.length
      };
    });

    // Generate dynamic educational insights based on the calculated data
    const insights = this.generatePedagogicalInsights(query, keywordResults.results, pageRankResults.results, shifts);

    return {
      query,
      keywordResults: keywordResults.results,
      pageRankResults: pageRankResults.results,
      shifts,
      insights
    };
  }

  /**
   * Generate deep, dynamic educational insights without hardcoding.
   */
  generatePedagogicalInsights(query, kwList, prList, shifts) {
    const insights = [];

    if (!kwList.length || !prList.length) {
      return [{
        type: "info",
        title: "No Results",
        message: `No pages in the dataset matched "${query}". Try searching for "pizza", "pune", or "food".`
      }];
    }

    const topKeyword = kwList[0];
    const topPageRank = prList[0];
    const bottomPageRank = prList[prList.length - 1];

    // Check if the top result changed
    if (topKeyword.id !== topPageRank.id) {
      insights.push({
        type: "revolution",
        title: `🏆 The Winner Inversion: ${topPageRank.url} vs ${topKeyword.url}`,
        message: `In Keyword Frequency mode, <strong>${topKeyword.url}</strong> ranks #1 because the term "${query}" appears ${topKeyword.keywordCount} times in its text. However, in PageRank mode, <strong>${topPageRank.url}</strong> claims #1 (PageRank: ${topPageRank.pageRank.toFixed(4)}) because it is cited by ${topPageRank.incomingLinks.length} other independent websites, even though it mentions "${query}" only ${topPageRank.keywordCount} time(s)!`
      });
    } else {
      insights.push({
        type: "neutral",
        title: `Both Algorithms Agree on #1: ${topPageRank.url}`,
        message: `<strong>${topPageRank.url}</strong> tops both rankings for "${query}" with ${topPageRank.keywordCount} keyword mentions and a leading PageRank of ${topPageRank.pageRank.toFixed(4)}.`
      });
    }

    // Identify biggest drop (e.g., spam pages exposed)
    const biggestDrop = [...shifts].sort((a, b) => a.delta - b.delta)[0];
    if (biggestDrop && biggestDrop.delta < 0) {
      insights.push({
        type: "spam_exposed",
        title: `🚨 Spam Neutralized: ${biggestDrop.url} Plummets ${Math.abs(biggestDrop.delta)} Spot(s)`,
        message: `<strong>${biggestDrop.url}</strong> ranked #${biggestDrop.keywordPos} in traditional search purely by repeating keywords (${biggestDrop.keywordCount} matches). Under Google's PageRank, it collapsed to #${biggestDrop.pageRankPos} because it receives only ${biggestDrop.incomingLinksCount} inbound link(s), yielding an abysmal PageRank of ${biggestDrop.pageRank.toFixed(4)}. PageRank makes keyword-stuffing completely ineffective.`
      });
    }

    // Identify biggest rise (authoritative page elevated)
    const biggestRise = [...shifts].sort((a, b) => b.delta - a.delta)[0];
    if (biggestRise && biggestRise.delta > 0) {
      insights.push({
        type: "authority_elevated",
        title: `📈 Authority Surfaced: ${biggestRise.url} Climbs ${biggestRise.delta} Spot(s)`,
        message: `<strong>${biggestRise.url}</strong> rose from #${biggestRise.keywordPos} to #${biggestRise.pageRankPos}. While early search engines overlooked it due to fewer keyword repetitions (${biggestRise.keywordCount}), PageRank identified its high inbound endorsement (${biggestRise.incomingLinksCount} incoming citations) to award it a top PageRank score of ${biggestRise.pageRank.toFixed(4)}.`
      });
    }

    // Core algorithmic principle
    insights.push({
      type: "takeaway",
      title: "💡 The Core PageRank Principle",
      message: `Traditional 1997 search engines evaluated <em>what a page says about itself</em> (internal content). Google's 1998 PageRank evaluated <em>what the rest of the web says about that page</em> (external hyperlinks). A link is a vote of confidence that cannot be easily spoofed by the author.`
    });

    return insights;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ComparisonEngine };
}
