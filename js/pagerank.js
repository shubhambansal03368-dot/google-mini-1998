/**
 * pagerank.js - PageRank Algorithm Implementation (1998)
 * 
 * Implements the original PageRank algorithm described by Larry Page and Sergey Brin
 * in their seminal 1998 Stanford University paper:
 * "The Anatomy of a Large-Scale Hypertextual Web Search Engine"
 * 
 * Formula:
 * PR(A) = (1 - d) + d * Σ(PR(Ti) / C(Ti))
 * 
 * Where:
 * - PR(A)  : PageRank score of page A
 * - d      : Damping factor (default 0.85; probability a random surfer continues clicking links)
 * - 1 - d  : Random teleportation probability (surfer randomly types a new URL)
 * - Ti     : Set of pages linking into page A
 * - C(Ti)  : Number of outbound links on page Ti
 * 
 * Crucial Properties:
 * 1. Query-Independent: Calculated across the whole web graph regardless of search queries.
 * 2. Iterative: Converges to a stationary probability distribution.
 * 3. Democratic: Links are endorsements, weighted by the endorser's authority.
 * 4. Anti-Spam: Keyword repetition cannot boost PageRank because inbound links are required.
 */

class PageRankCalculator {
  /**
   * @param {Array} dataset - Array of page objects with { id, url, linksTo }
   * @param {number} dampingFactor - Teleportation damping factor d (default: 0.85)
   * @param {number} maxIterations - Maximum iterations to prevent infinite loops (default: 100)
   * @param {number} epsilon - Convergence threshold (default: 1e-6)
   */
  constructor(dataset, dampingFactor = 0.85, maxIterations = 100, epsilon = 1e-6) {
    this.dataset = dataset;
    this.dampingFactor = dampingFactor;
    this.maxIterations = maxIterations;
    this.epsilon = epsilon;

    // Build incoming and outgoing adjacency maps
    this.inLinks = {};  // Target ID -> Array of Source IDs
    this.outLinks = {}; // Source ID -> Array of Target IDs

    this.dataset.forEach(page => {
      this.inLinks[page.id] = [];
      this.outLinks[page.id] = [...page.linksTo];
    });

    this.dataset.forEach(page => {
      page.linksTo.forEach(targetId => {
        if (this.inLinks[targetId] && !this.inLinks[targetId].includes(page.id)) {
          this.inLinks[targetId].push(page.id);
        }
      });
    });
  }

  /**
   * Run the iterative calculation and return detailed convergence results.
   * @returns {Object} { scores, history, iterations, converged, maxDiff }
   */
  compute() {
    const n = this.dataset.length;
    // Initial PageRank: 1.0 for all nodes (natural state where average PR is 1.0)
    let currentScores = {};
    this.dataset.forEach(page => {
      currentScores[page.id] = 1.0;
    });

    const history = [];
    // Record step 0
    history.push({
      iteration: 0,
      scores: { ...currentScores },
      maxDiff: 0
    });

    let converged = false;
    let iteration = 0;
    let maxDiff = 0;

    while (iteration < this.maxIterations && !converged) {
      iteration++;
      const nextScores = {};
      maxDiff = 0;

      for (let i = 0; i < n; i++) {
        const page = this.dataset[i];
        const pageId = page.id;

        // Σ ( PR(Ti) / C(Ti) ) for all pages Ti that link to pageId
        let incomingSum = 0.0;
        const incomingPages = this.inLinks[pageId] || [];

        for (let j = 0; j < incomingPages.length; j++) {
          const sourceId = incomingPages[j];
          const sourcePR = currentScores[sourceId];
          const outDegree = this.outLinks[sourceId].length;

          if (outDegree > 0) {
            incomingSum += sourcePR / outDegree;
          }
        }

        // Apply formula: PR(A) = (1 - d) + d * incomingSum
        const newScore = (1.0 - this.dampingFactor) + (this.dampingFactor * incomingSum);
        nextScores[pageId] = newScore;

        const diff = Math.abs(newScore - currentScores[pageId]);
        if (diff > maxDiff) {
          maxDiff = diff;
        }
      }

      currentScores = nextScores;

      history.push({
        iteration,
        scores: { ...currentScores },
        maxDiff
      });

      if (maxDiff < this.epsilon) {
        converged = true;
      }
    }

    return {
      scores: currentScores,
      history,
      iterations: iteration,
      converged,
      maxDiff,
      dampingFactor: this.dampingFactor
    };
  }

  /**
   * Generates a step-by-step mathematical explanation for a specific page.
   * Useful for educational modals and node inspector.
   * 
   * @param {number} pageId - Target page ID
   * @param {Object} scores - Converged or current PageRank scores
   * @returns {Object} Detailed breakdown of incoming contributions
   */
  getEquationBreakdown(pageId, scores) {
    const page = this.dataset.find(p => p.id === pageId);
    if (!page) return null;

    const incomingIds = this.inLinks[pageId] || [];
    const baseScore = 1.0 - this.dampingFactor;

    const contributions = incomingIds.map(srcId => {
      const srcPage = this.dataset.find(p => p.id === srcId);
      const srcPR = scores[srcId];
      const outCount = this.outLinks[srcId].length;
      const share = srcPR / outCount;
      return {
        sourceId: srcId,
        sourceUrl: srcPage.url,
        sourcePR: srcPR,
        outDegree: outCount,
        share: share,
        weightedContribution: this.dampingFactor * share
      };
    });

    const sumShares = contributions.reduce((acc, c) => acc + c.share, 0);
    const finalCalculated = baseScore + (this.dampingFactor * sumShares);

    return {
      pageId,
      url: page.url,
      dampingFactor: this.dampingFactor,
      baseScore,
      contributions,
      sumShares,
      finalCalculated,
      convergedScore: scores[pageId]
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PageRankCalculator };
}
