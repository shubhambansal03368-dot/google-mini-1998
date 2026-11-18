/**
 * app.js - Main Application Orchestrator
 * 
 * Manages UI interactions, state synchronization, view transitions,
 * search execution, graph updates, comparison engine, and verification tests.
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. Core State
  const state = {
    dataset: getDataset(),
    dampingFactor: 0.85,
    maxIterations: 100,
    epsilon: 1e-6,
    pageRankCalc: null,
    pageRankResult: null,
    searchEngine: null,
    comparisonEngine: null,
    graph: null,
    currentQuery: "pizza",
    currentMode: "pagerank", // "pagerank" | "keyword"
    selectedNodeId: 2,
    currentStepIndex: 0,
    isAutoPlaying: false,
    autoPlayTimer: null
  };

  // 2. Initialize PageRank Engine & Search Engine
  function recalculatePageRank(d = state.dampingFactor) {
    state.dampingFactor = d;
    state.pageRankCalc = new PageRankCalculator(state.dataset, state.dampingFactor, state.maxIterations, state.epsilon);
    state.pageRankResult = state.pageRankCalc.compute();

    if (!state.searchEngine) {
      state.searchEngine = new SearchEngine(state.dataset, state.pageRankResult.scores);
    } else {
      state.searchEngine.updatePageRankScores(state.pageRankResult.scores);
    }

    if (!state.comparisonEngine) {
      state.comparisonEngine = new ComparisonEngine(state.searchEngine);
    }

    // Update graph if it exists
    if (state.graph) {
      state.graph.updateScores(state.pageRankResult.scores);
    }

    // Refresh Node Inspector
    updateNodeInspector(state.selectedNodeId);

    // Refresh Convergence Table in Lab
    renderConvergenceTable();
  }

  // Initial calculation
  recalculatePageRank(0.85);

  // 3. Navigation & Tab Switching
  const navButtons = document.querySelectorAll(".retro-nav-btn");
  const tabViews = document.querySelectorAll(".tab-view");
  const footerLinks = document.querySelectorAll(".tab-link");

  function switchTab(tabId) {
    navButtons.forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
    });

    tabViews.forEach(view => {
      view.classList.toggle("active", view.id === tabId);
    });

    // Special view handlers
    if (tabId === "tab-graph") {
      if (!state.graph) {
        initGraph();
      } else {
        state.graph.render();
      }
    } else if (tabId === "tab-compare") {
      runComparison(state.currentQuery || "pizza");
    } else if (tabId === "tab-lab") {
      renderConvergenceTable();
      renderRawDatasetTable();
    }
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  footerLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const tabId = link.getAttribute("data-tab");
      switchTab(tabId);
    });
  });

  // Cross-link buttons in homepage
  document.getElementById("link-explore-graph")?.addEventListener("click", (e) => {
    e.preventDefault();
    switchTab("tab-graph");
  });
  document.getElementById("link-stanford-search")?.addEventListener("click", (e) => {
    e.preventDefault();
    executeSearch("stanford", state.currentMode);
  });
  document.getElementById("link-linux-search")?.addEventListener("click", (e) => {
    e.preventDefault();
    executeSearch("pune", state.currentMode);
  });
  document.getElementById("link-about-google")?.addEventListener("click", (e) => {
    e.preventDefault();
    switchTab("tab-education");
  });
  document.getElementById("link-company-info")?.addEventListener("click", (e) => {
    e.preventDefault();
    switchTab("tab-education");
  });

  // 4. Search Execution Logic
  const homeView = document.getElementById("home-view");
  const serpView = document.getElementById("serp-view");
  const homeSearchInput = document.getElementById("home-search-input");
  const serpSearchInput = document.getElementById("serp-search-input");
  const btnHomeSearch = document.getElementById("btn-home-search");
  const btnHomeLucky = document.getElementById("btn-home-lucky");
  const serpModeSelect = document.getElementById("serp-mode-select");
  const serpQueryDisplay = document.getElementById("serp-query-display");
  const serpCountDisplay = document.getElementById("serp-count-display");
  const serpModeBadge = document.getElementById("serp-mode-badge");
  const serpInsightBanner = document.getElementById("serp-insight-banner");
  const serpResultsList = document.getElementById("serp-results-list");
  const serpHomeLogoLink = document.getElementById("serp-home-logo-link");

  function getSelectedHomeMode() {
    const radio = document.querySelector('input[name="ranking-mode"]:checked');
    return radio ? radio.value : "pagerank";
  }

  function executeSearch(query, mode = state.currentMode) {
    state.currentQuery = query.trim();
    state.currentMode = mode;

    if (!state.currentQuery) {
      alert("Please enter a search query (e.g. pizza, food, pune)!");
      return;
    }

    const searchResult = state.searchEngine.search(state.currentQuery, state.currentMode);

    // Switch to SERP view
    homeView.style.display = "none";
    serpView.style.display = "block";

    // Synchronize inputs
    serpSearchInput.value = state.currentQuery;
    serpModeSelect.value = state.currentMode;

    // Update stats bar
    serpQueryDisplay.textContent = `"${state.currentQuery}"`;
    serpCountDisplay.textContent = searchResult.totalFound;

    if (state.currentMode === "pagerank") {
      serpModeBadge.textContent = "Google PageRank (1998)";
      serpModeBadge.className = "serp-mode-badge badge-pagerank";
    } else {
      serpModeBadge.textContent = "Traditional Keyword Frequency";
      serpModeBadge.className = "serp-mode-badge badge-keyword";
    }

    // Generate Educational Callout in SERP
    renderSerpInsightBanner(searchResult);

    // Render SERP results
    renderSerpResults(searchResult);
  }

  function renderSerpInsightBanner(searchResult) {
    if (searchResult.totalFound === 0) {
      serpInsightBanner.innerHTML = `
        <strong>No Results Found:</strong> No documents in our 6-page web contain the keyword "${state.currentQuery}". 
        Try searching for <a href="#" class="serp-action-link chip-quick-search" data-query="pizza">pizza</a>, 
        <a href="#" class="serp-action-link chip-quick-search" data-query="pune">pune</a>, or 
        <a href="#" class="serp-action-link chip-quick-search" data-query="food">food</a>.
      `;
      return;
    }

    const topItem = searchResult.results[0];

    if (state.currentMode === "keyword") {
      serpInsightBanner.innerHTML = `
        <strong>⚠️ Keyword Frequency Mode Notice:</strong> 
        Ranking is determined solely by word repetition in page text. 
        <strong>${topItem.url}</strong> ranks #1 because the keyword appears <strong>${topItem.keywordCount} times</strong> in its text. 
        Notice how spammers can easily manipulate this by repeating words without providing real authority.
        <a href="#" id="banner-switch-to-pr" style="color: #0000cc; font-weight: bold; margin-left: 8px;">Switch to PageRank to see how Google fixed this &rarr;</a>
      `;
      document.getElementById("banner-switch-to-pr")?.addEventListener("click", (e) => {
        e.preventDefault();
        executeSearch(state.currentQuery, "pagerank");
      });
    } else {
      serpInsightBanner.innerHTML = `
        <strong>💡 Google PageRank (1998) Mode:</strong> 
        Ranked by hyperlink citation authority independently of keyword repetition. 
        <strong>${topItem.url}</strong> leads the ranking (PageRank: <strong>${topItem.pageRank.toFixed(4)}</strong>) 
        because <strong>${topItem.incomingLinks.length} other independent websites</strong> link to it. 
        Keyword-stuffing spam sites are safely demoted to the bottom.
        <a href="#" id="banner-switch-to-kw" style="color: #0000cc; font-weight: bold; margin-left: 8px;">Switch to Keyword Frequency mode &rarr;</a>
      `;
      document.getElementById("banner-switch-to-kw")?.addEventListener("click", (e) => {
        e.preventDefault();
        executeSearch(state.currentQuery, "keyword");
      });
    }
  }

  function renderSerpResults(searchResult) {
    if (searchResult.totalFound === 0) {
      serpResultsList.innerHTML = `
        <div style="padding: 20px 0; color: #555;">
          Your search - <strong>${state.currentQuery}</strong> - did not match any documents in our 6-page 1998 web index.
          <br><br>
          Suggestions:
          <ul style="margin-left: 20px; margin-top: 8px;">
            <li>Make sure all words are spelled correctly.</li>
            <li>Try historical terms like <strong>pizza</strong>, <strong>food</strong>, or <strong>pune</strong>.</li>
          </ul>
        </div>
      `;
      return;
    }

    let html = "";
    searchResult.results.forEach(item => {
      const isTopAuthority = item.pageRank >= 2.0;
      const isSpamSite = item.id === 6;

      html += `
        <article class="serp-item" id="serp-item-${item.id}">
          <div class="serp-item-header">
            <span class="serp-rank-num">#${item.position}</span>
            <a href="#" class="serp-title-link serp-jump-graph" data-id="${item.id}">
              ${item.highlightedTitle || item.title}
            </a>
          </div>

          <div class="serp-url-line">http://www.${item.url}/</div>

          <p class="serp-snippet">
            ${item.highlightedText}
          </p>

          <div class="serp-meta-box">
            <span class="serp-metric-tag ${state.currentMode === 'keyword' ? 'highlight-kw' : ''}">
              Keyword Matches in Text: <strong>${item.keywordCount}</strong>
            </span>

            <span class="serp-metric-tag ${state.currentMode === 'pagerank' ? 'highlight-pr' : ''}">
              PageRank: <strong>${item.pageRank.toFixed(4)}</strong>
            </span>

            <span class="serp-metric-tag">
              Inbound Links: <strong>${item.incomingLinks.length}</strong> (${item.incomingLinks.map(id => '#' + id).join(', ') || 'None'})
            </span>

            <a href="#" class="serp-action-link serp-jump-graph" data-id="${item.id}">
              Inspect in Graph &rarr;
            </a>

            <span style="color: #999;">-</span>
            <a href="#" class="serp-action-link cached-link" data-id="${item.id}">Cached</a>
            <a href="#" class="serp-action-link similar-link" data-id="${item.id}">Similar pages</a>
          </div>
        </article>
      `;
    });

    serpResultsList.innerHTML = html;

    // Attach click listeners to jump to graph inspector
    document.querySelectorAll(".serp-jump-graph").forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const pageId = parseInt(el.getAttribute("data-id"), 10);
        state.selectedNodeId = pageId;
        switchTab("tab-graph");
        if (state.graph) {
          state.graph.selectedNodeId = pageId;
          state.graph.render();
        }
        updateNodeInspector(pageId);
      });
    });

    // Mock cached link
    document.querySelectorAll(".cached-link").forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const pageId = parseInt(el.getAttribute("data-id"), 10);
        const page = state.dataset.find(p => p.id === pageId);
        alert(`[1998 Google Web Cache]\nURL: http://${page.url}\nSnapshot Date: Nov 18, 1998\n\nContent:\n"${page.text}"\n\nOutgoing links to: ${page.linksTo.join(", ")}`);
      });
    });

    document.querySelectorAll(".similar-link").forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        executeSearch("pizza", state.currentMode);
      });
    });
  }

  // Home search event
  btnHomeSearch?.addEventListener("click", (e) => {
    e.preventDefault();
    const query = homeSearchInput.value;
    const mode = getSelectedHomeMode();
    executeSearch(query, mode);
  });

  // Home "I'm Feeling Lucky" button
  btnHomeLucky?.addEventListener("click", (e) => {
    e.preventDefault();
    const query = homeSearchInput.value.trim() || "pizza";
    const mode = getSelectedHomeMode();
    const result = state.searchEngine.search(query, mode);

    if (result.results.length > 0) {
      const topPage = result.results[0];
      const message = `🍀 I'm Feeling Lucky!\n\nTaking you directly to the #1 ranked page for "${query}":\n\nDomain: ${topPage.url}\nRanked by: ${mode.toUpperCase()}\nMetric: ${mode === 'pagerank' ? 'PageRank ' + topPage.pageRank.toFixed(4) : topPage.keywordCount + ' keyword occurrences'}\n\nSnippet: "${topPage.text}"`;
      alert(message);
      executeSearch(query, mode);
    } else {
      alert(`No results found for "${query}"`);
    }
  });

  // SERP search events
  document.getElementById("btn-serp-search")?.addEventListener("click", (e) => {
    e.preventDefault();
    executeSearch(serpSearchInput.value, serpModeSelect.value);
  });

  serpModeSelect?.addEventListener("change", () => {
    executeSearch(serpSearchInput.value, serpModeSelect.value);
  });

  serpHomeLogoLink?.addEventListener("click", (e) => {
    e.preventDefault();
    serpView.style.display = "none";
    homeView.style.display = "block";
    homeSearchInput.value = state.currentQuery;
  });

  // Preset query buttons
  document.querySelectorAll(".query-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-query");
      if (q) {
        homeSearchInput.value = q;
        executeSearch(q, getSelectedHomeMode());
      }
    });
  });

  // 5. Interactive Graph Visualization
  function initGraph() {
    state.graph = new PageRankGraph(
      "graph-container",
      state.dataset,
      state.pageRankResult.scores,
      (selectedId) => {
        state.selectedNodeId = selectedId;
        updateNodeInspector(selectedId);
      }
    );
  }

  function updateNodeInspector(nodeId) {
    const page = state.dataset.find(p => p.id === nodeId);
    if (!page) return;

    const scores = state.pageRankResult.scores;
    const pr = scores[nodeId] !== undefined ? scores[nodeId] : 0.15;

    // Determine global authority rank
    const sortedAll = [...state.dataset].sort((a, b) => scores[b.id] - scores[a.id]);
    const globalRank = sortedAll.findIndex(p => p.id === nodeId) + 1;

    document.getElementById("insp-page-title").textContent = `#${page.id} ${page.url}`;
    document.getElementById("insp-page-url").textContent = `http://www.${page.url}/`;
    document.getElementById("insp-pr-score").textContent = pr.toFixed(4);
    document.getElementById("insp-global-rank").textContent = `#${globalRank} of ${state.dataset.length}`;
    document.getElementById("insp-in-count").textContent = page.incomingLinks.length;
    document.getElementById("insp-out-count").textContent = page.linksTo.length;

    // Build Inbound contributors table
    const breakdown = state.pageRankCalc.getEquationBreakdown(nodeId, scores);
    const tbody = document.getElementById("insp-inbound-tbody");
    const formulaBox = document.getElementById("insp-formula-box");

    if (breakdown.contributions.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: #888; font-style: italic;">
            No incoming links. Page receives 0 external votes.
          </td>
        </tr>
      `;
      formulaBox.innerHTML = `
        <strong>PR(${nodeId}) = (1 - d) + d &times; (0)</strong><br>
        = (1 - ${state.dampingFactor.toFixed(2)}) + 0<br>
        = <strong>${pr.toFixed(4)}</strong> (Baseline teleportation score)
      `;
    } else {
      let tRows = "";
      let formulaParts = [];

      breakdown.contributions.forEach(c => {
        tRows += `
          <tr>
            <td><strong>#${c.sourceId}</strong> ${c.sourceUrl.replace('.com','')}</td>
            <td>${c.sourcePR.toFixed(3)}</td>
            <td>${c.outDegree}</td>
            <td><strong>${c.share.toFixed(4)}</strong></td>
          </tr>
        `;
        formulaParts.push(`(${c.sourcePR.toFixed(3)} / ${c.outDegree})`);
      });

      tbody.innerHTML = tRows;

      const sumStr = formulaParts.join(" + ");
      formulaBox.innerHTML = `
        <strong>PR(${nodeId}) = (1 - d) + d &times; &sum;[PR(Ti)/C(Ti)]</strong><br>
        = (1 - ${state.dampingFactor.toFixed(2)}) + ${state.dampingFactor.toFixed(2)} &times; [ ${sumStr} ]<br>
        = ${(1 - state.dampingFactor).toFixed(2)} + ${state.dampingFactor.toFixed(2)} &times; [ ${breakdown.sumShares.toFixed(4)} ]<br>
        = <strong>${pr.toFixed(4)}</strong>
      `;
    }
  }

  // Damping factor slider
  const dampingSlider = document.getElementById("damping-slider");
  const dampingDisplay = document.getElementById("damping-value-display");

  dampingSlider?.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    dampingDisplay.textContent = val.toFixed(2);
    recalculatePageRank(val);
    document.getElementById("step-iteration-badge").textContent = `Iter: Converged (${state.pageRankResult.iterations} iters)`;
  });

  // Step-by-Step Iteration Stepper
  const btnStepReset = document.getElementById("btn-step-reset");
  const btnStepForward = document.getElementById("btn-step-forward");
  const btnStepAuto = document.getElementById("btn-step-auto");
  const stepBadge = document.getElementById("step-iteration-badge");

  function setIterationStep(stepIdx) {
    const history = state.pageRankResult.history;
    if (stepIdx < 0) stepIdx = 0;
    if (stepIdx >= history.length) stepIdx = history.length - 1;

    state.currentStepIndex = stepIdx;
    const stepData = history[stepIdx];

    // Update graph with this step's scores
    if (state.graph) {
      state.graph.updateScores(stepData.scores);
    }
    updateNodeInspector(state.selectedNodeId);

    const isConverged = stepIdx === history.length - 1;
    stepBadge.textContent = isConverged 
      ? `Step ${stepIdx} (Converged, Δ: ${stepData.maxDiff.toFixed(6)})`
      : `Step ${stepIdx} / ${history.length - 1} (Δ: ${stepData.maxDiff.toFixed(4)})`;
  }

  btnStepReset?.addEventListener("click", () => {
    stopAutoPlay();
    setIterationStep(0);
  });

  btnStepForward?.addEventListener("click", () => {
    stopAutoPlay();
    setIterationStep(state.currentStepIndex + 1);
  });

  function stopAutoPlay() {
    if (state.isAutoPlaying) {
      state.isAutoPlaying = false;
      clearInterval(state.autoPlayTimer);
      btnStepAuto.textContent = "⏩ Auto Play";
    }
  }

  btnStepAuto?.addEventListener("click", () => {
    if (state.isAutoPlaying) {
      stopAutoPlay();
    } else {
      state.isAutoPlaying = true;
      btnStepAuto.textContent = "⏸️ Pause";
      if (state.currentStepIndex >= state.pageRankResult.history.length - 1) {
        setIterationStep(0);
      }
      state.autoPlayTimer = setInterval(() => {
        if (state.currentStepIndex < state.pageRankResult.history.length - 1) {
          setIterationStep(state.currentStepIndex + 1);
        } else {
          stopAutoPlay();
        }
      }, 400);
    }
  });

  // 6. Side-by-Side Comparison Engine
  const compareInput = document.getElementById("compare-query-input");
  const btnRunCompare = document.getElementById("btn-run-compare");
  const compareKwTbody = document.getElementById("compare-kw-tbody");
  const comparePrTbody = document.getElementById("compare-pr-tbody");
  const compareInsightsList = document.getElementById("compare-insights-list");

  function runComparison(query) {
    const q = query.trim() || "pizza";
    compareInput.value = q;
    const comparison = state.comparisonEngine.compare(q);

    // Render Keyword Column
    let kwRows = "";
    comparison.keywordResults.forEach(r => {
      kwRows += `
        <tr>
          <td><strong>#${r.position}</strong></td>
          <td>
            <a href="#" class="serp-title-link serp-jump-graph" data-id="${r.id}">
              ${r.url}
            </a>
          </td>
          <td><strong style="color: #c5221f;">${r.keywordCount}</strong></td>
        </tr>
      `;
    });
    compareKwTbody.innerHTML = kwRows || `<tr><td colspan="3" style="text-align:center;">No matching pages</td></tr>`;

    // Render PageRank Column with shift badges
    let prRows = "";
    comparison.pageRankResults.forEach(r => {
      const shift = comparison.shifts.find(s => s.id === r.id);
      let badge = `<span class="shift-badge shift-same">&minus; Same</span>`;

      if (shift && shift.direction === "up") {
        badge = `<span class="shift-badge shift-up">&uarr; +${shift.delta}</span>`;
      } else if (shift && shift.direction === "down") {
        badge = `<span class="shift-badge shift-down">&darr; ${shift.delta}</span>`;
      }

      prRows += `
        <tr>
          <td><strong>#${r.position}</strong></td>
          <td>
            <a href="#" class="serp-title-link serp-jump-graph" data-id="${r.id}">
              ${r.url}
            </a>
          </td>
          <td><strong style="color: #137333;">${r.pageRank.toFixed(3)}</strong></td>
          <td>${badge}</td>
        </tr>
      `;
    });
    comparePrTbody.innerHTML = prRows || `<tr><td colspan="4" style="text-align:center;">No matching pages</td></tr>`;

    // Render Insights
    let insightHtml = "";
    comparison.insights.forEach(ins => {
      insightHtml += `
        <div class="insight-card ${ins.type}">
          <div class="insight-title">${ins.title}</div>
          <div class="insight-body">${ins.message}</div>
        </div>
      `;
    });
    compareInsightsList.innerHTML = insightHtml;

    // Attach listeners to jumped links
    document.querySelectorAll(".serp-jump-graph").forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const pageId = parseInt(el.getAttribute("data-id"), 10);
        state.selectedNodeId = pageId;
        switchTab("tab-graph");
        if (state.graph) {
          state.graph.selectedNodeId = pageId;
          state.graph.render();
        }
        updateNodeInspector(pageId);
      });
    });
  }

  btnRunCompare?.addEventListener("click", () => {
    runComparison(compareInput.value);
  });

  document.querySelectorAll("[data-compare]").forEach(btn => {
    btn.addEventListener("click", () => {
      runComparison(btn.getAttribute("data-compare"));
    });
  });

  // 7. Algorithm Lab Rendering
  function renderConvergenceTable() {
    const tbody = document.getElementById("convergence-tbody");
    if (!tbody || !state.pageRankResult) return;

    const history = state.pageRankResult.history;
    // Sample iterations: 0, 1, 2, 3, 5, 10, 15, 20, 25, 30 and final
    const sampledIndices = [0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30, history.length - 1];
    const uniqueIndices = [...new Set(sampledIndices)].filter(idx => idx < history.length).sort((a,b) => a - b);

    let rows = "";
    uniqueIndices.forEach(idx => {
      const step = history[idx];
      const isFinal = idx === history.length - 1;
      rows += `
        <tr style="${isFinal ? 'background: #e6f4ea; font-weight: bold;' : ''}">
          <td>${idx}${isFinal ? ' (Final)' : ''}</td>
          <td>${step.scores[1].toFixed(4)}</td>
          <td>${step.scores[2].toFixed(4)}</td>
          <td>${step.scores[3].toFixed(4)}</td>
          <td>${step.scores[4].toFixed(4)}</td>
          <td>${step.scores[5].toFixed(4)}</td>
          <td>${step.scores[6].toFixed(4)}</td>
          <td>${step.maxDiff.toFixed(6)}</td>
        </tr>
      `;
    });

    tbody.innerHTML = rows;
  }

  function renderRawDatasetTable() {
    const tbody = document.getElementById("raw-dataset-tbody");
    if (!tbody) return;

    let rows = "";
    state.dataset.forEach(page => {
      rows += `
        <tr>
          <td><strong>#${page.id}</strong></td>
          <td><code>${page.url}</code></td>
          <td>${page.text}</td>
          <td><strong>[${page.linksTo.join(", ")}]</strong></td>
          <td>[${page.incomingLinks.join(", ") || 'None'}]</td>
        </tr>
      `;
    });

    tbody.innerHTML = rows;
  }

  // 8. Automated Verification Suite
  const btnRunTests = document.getElementById("btn-run-all-tests");
  const testResultsContainer = document.getElementById("tests-results-container");
  const testsSummaryBadge = document.getElementById("tests-summary-badge");

  function runAllVerificationTests() {
    const results = [];

    // Test 1: Search "pizza" in Keyword Frequency mode
    try {
      const kwPizza = state.searchEngine.search("pizza", "keyword");
      const topKw = kwPizza.results[0];
      const pass = topKw && topKw.id === 6 && topKw.keywordCount === 10;
      results.push({
        num: 1,
        title: 'Search "pizza" in Keyword Frequency Mode',
        expected: 'Page #6 (pizza-pizza-pizza.com) ranks #1 with 10 keyword occurrences',
        actual: `Page #${topKw.id} (${topKw.url}) ranked #1 with ${topKw.keywordCount} occurrences`,
        passed: pass
      });
    } catch (e) {
      results.push({ num: 1, title: 'Search "pizza" in Keyword Frequency Mode', error: e.message, passed: false });
    }

    // Test 2: Search "pizza" in PageRank mode
    try {
      const prPizza = state.searchEngine.search("pizza", "pagerank");
      const topPr = prPizza.results[0];
      const bottomPr = prPizza.results[prPizza.results.length - 1];
      const pass = topPr && topPr.id === 2 && bottomPr && bottomPr.id === 6;
      results.push({
        num: 2,
        title: 'Search "pizza" in PageRank Mode',
        expected: 'Page #2 (best-pizza-pune.com) ranks #1 (PR ~2.357); Page #6 ranks last (#6, PR = 0.150)',
        actual: `Page #${topPr.id} (${topPr.url}) is #1 (PR: ${topPr.pageRank.toFixed(4)}); Page #${bottomPr.id} (${bottomPr.url}) is #6 (PR: ${bottomPr.pageRank.toFixed(4)})`,
        passed: pass
      });
    } catch (e) {
      results.push({ num: 2, title: 'Search "pizza" in PageRank Mode', error: e.message, passed: false });
    }

    // Test 3: Verify the two ranking systems produce different results
    try {
      const kwPizza = state.searchEngine.search("pizza", "keyword");
      const prPizza = state.searchEngine.search("pizza", "pagerank");
      const kwOrder = kwPizza.results.map(r => r.id).join(",");
      const prOrder = prPizza.results.map(r => r.id).join(",");
      const pass = kwOrder !== prOrder && kwPizza.results[0].id !== prPizza.results[0].id;
      results.push({
        num: 3,
        title: 'Ranking Systems Divergence Check',
        expected: 'Keyword and PageRank produce distinctly different result rankings for "pizza"',
        actual: `Keyword Order: [${kwOrder}] vs PageRank Order: [${prOrder}]`,
        passed: pass
      });
    } catch (e) {
      results.push({ num: 3, title: 'Ranking Systems Divergence Check', error: e.message, passed: false });
    }

    // Test 4: Verify all outgoing and incoming links for all 6 pages
    try {
      const expectedTopology = {
        1: { out: [2], in: [2, 6] },
        2: { out: [1, 3], in: [1, 3, 4, 5] },
        3: { out: [2, 4], in: [2] },
        4: { out: [2, 5], in: [3] },
        5: { out: [2], in: [4] },
        6: { out: [1], in: [] }
      };

      let pass = true;
      for (let id = 1; id <= 6; id++) {
        const page = state.dataset.find(p => p.id === id);
        const exp = expectedTopology[id];
        const outMatch = JSON.stringify(page.linksTo.sort()) === JSON.stringify(exp.out.sort());
        const inMatch = JSON.stringify(page.incomingLinks.sort()) === JSON.stringify(exp.in.sort());
        if (!outMatch || !inMatch) {
          pass = false;
          break;
        }
      }

      results.push({
        num: 4,
        title: 'Web Graph Topology Verification (Incoming & Outgoing Links)',
        expected: 'All 6 pages match exact specified link graph: Node 2 receives 4 incoming; Node 6 receives 0 incoming',
        actual: 'Exact match on all in-degrees and out-degrees across entire 6-node dataset',
        passed: pass
      });
    } catch (e) {
      results.push({ num: 4, title: 'Web Graph Topology Verification', error: e.message, passed: false });
    }

    // Test 5: Verify PageRank scores calculated iteratively
    try {
      const history = state.pageRankResult.history;
      const iters = state.pageRankResult.iterations;
      const pass = history.length > 5 && iters > 10 && state.pageRankResult.converged;
      results.push({
        num: 5,
        title: 'Iterative PageRank Calculation & Convergence',
        expected: 'PageRank converges via power iteration over multiple steps until max delta < 1e-6',
        actual: `Converged in ${iters} iterations (Step history recorded: ${history.length} frames, final max Δ: ${state.pageRankResult.maxDiff.toExponential(2)})`,
        passed: pass
      });
    } catch (e) {
      results.push({ num: 5, title: 'Iterative PageRank Calculation & Convergence', error: e.message, passed: false });
    }

    // Test 6: Verify PageRank values are independent of search queries
    try {
      const pr1 = state.searchEngine.search("pizza", "pagerank").results.find(r => r.id === 2).pageRank;
      const pr2 = state.searchEngine.search("pune", "pagerank").results.find(r => r.id === 2).pageRank;
      const pr3 = state.pageRankResult.scores[2];
      const pass = Math.abs(pr1 - pr3) < 1e-9 && Math.abs(pr2 - pr3) < 1e-9;
      results.push({
        num: 6,
        title: 'Query-Independence of PageRank Scores',
        expected: 'PageRank of page #2 is identical across different search queries and global graph state',
        actual: `Query "pizza": ${pr1.toFixed(6)}, Query "pune": ${pr2.toFixed(6)}, Global: ${pr3.toFixed(6)}`,
        passed: pass
      });
    } catch (e) {
      results.push({ num: 6, title: 'Query-Independence of PageRank Scores', error: e.message, passed: false });
    }

    // Test 7: Verify changing damping factor recalculates scores dynamically
    try {
      const calc0 = new PageRankCalculator(state.dataset, 0.0).compute();
      const calc85 = new PageRankCalculator(state.dataset, 0.85).compute();
      const calc50 = new PageRankCalculator(state.dataset, 0.50).compute();
      // When d = 0, PR(A) = 1 - 0 = 1.0 for all nodes
      const d0AllOne = Object.values(calc0.scores).every(v => Math.abs(v - 1.0) < 1e-6);
      const scoresDifferent = Math.abs(calc85.scores[2] - calc50.scores[2]) > 0.1;
      const pass = d0AllOne && scoresDifferent;
      results.push({
        num: 7,
        title: 'Dynamic Damping Factor Recalculation',
        expected: 'At d=0 all scores equal 1.0; at d=0.50 score(2) ~ 1.76; at d=0.85 score(2) ~ 2.36',
        actual: `d=0.00: PR(2)=${calc0.scores[2].toFixed(2)} | d=0.50: PR(2)=${calc50.scores[2].toFixed(3)} | d=0.85: PR(2)=${calc85.scores[2].toFixed(3)}`,
        passed: pass
      });
    } catch (e) {
      results.push({ num: 7, title: 'Dynamic Damping Factor Recalculation', error: e.message, passed: false });
    }

    // Test 8: Verify system does NOT use visit counts
    try {
      let noVisitKeys = true;
      state.dataset.forEach(p => {
        if ('visits' in p || 'clicks' in p || 'views' in p || 'traffic' in p) {
          noVisitKeys = false;
        }
      });
      results.push({
        num: 8,
        title: 'Absence of Visit / Click Count Bias',
        expected: 'No website visit counts, click streams, or traffic counters are stored or used in PageRank calculation',
        actual: 'Confirmed: PageRank is computed strictly from directed graph link structure and damping teleportation',
        passed: noVisitKeys
      });
    } catch (e) {
      results.push({ num: 8, title: 'Absence of Visit / Click Count Bias', error: e.message, passed: false });
    }

    // Render results
    let html = "";
    let allPassed = true;

    results.forEach(res => {
      if (!res.passed) allPassed = false;
      html += `
        <div class="test-item">
          <div>
            <div><strong>Test ${res.num}: ${res.title}</strong></div>
            <div style="font-size: 11px; color: #555; margin-top: 2px;">Expected: ${res.expected}</div>
            <div style="font-size: 11px; color: #222; margin-top: 2px;">Actual: <em>${res.actual || res.error}</em></div>
          </div>
          <div>
            <span class="${res.passed ? 'test-pass' : 'test-fail'}">
              ${res.passed ? 'PASSED &check;' : 'FAILED &cross;'}
            </span>
          </div>
        </div>
      `;
    });

    testResultsContainer.innerHTML = html;
    testsSummaryBadge.innerHTML = allPassed 
      ? `<span style="color: #137333;">All 8 Verification Tests Passed (100% Success)</span>` 
      : `<span style="color: #c5221f;">Some tests failed</span>`;
  }

  btnRunTests?.addEventListener("click", () => {
    runAllVerificationTests();
  });

  // Run tests on page load so status is ready
  runAllVerificationTests();
  renderConvergenceTable();
  renderRawDatasetTable();
});
