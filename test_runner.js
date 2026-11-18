/**
 * test_runner.js - CLI Test Suite for Node.js
 */

const { RAW_DATASET, getDataset } = require('./js/dataset');
const { PageRankCalculator } = require('./js/pagerank');
const { SearchEngine } = require('./js/search');
const { ComparisonEngine } = require('./js/comparison');

console.log("=== RUNNING MINI GOOGLE 1998 VERIFICATION TESTS ===");

const dataset = getDataset();
console.log(`Loaded dataset with ${dataset.length} pages.`);

// Verify topology
console.log("\n1. Verifying Graph Topology:");
dataset.forEach(p => {
  console.log(`Page #${p.id} (${p.url}): LinksTo: [${p.linksTo.join(", ")}], Incoming: [${p.incomingLinks.join(", ")}]`);
});

const calc = new PageRankCalculator(dataset, 0.85);
const prResult = calc.compute();

console.log("\n2. PageRank Convergence:");
console.log(`Converged in ${prResult.iterations} iterations. Converged: ${prResult.converged}, Max diff: ${prResult.maxDiff}`);
for (let id = 1; id <= 6; id++) {
  console.log(`Page #${id} (${dataset.find(p => p.id === id).url}): PR = ${prResult.scores[id].toFixed(6)}`);
}

// Check search engine
const searchEngine = new SearchEngine(dataset, prResult.scores);

console.log('\n3. Keyword Frequency Search for "pizza":');
const kwPizza = searchEngine.search("pizza", "keyword");
kwPizza.results.forEach(r => {
  console.log(`  Rank #${r.position}: #${r.id} ${r.url} - ${r.keywordCount} matches`);
});

console.log('\n4. PageRank Search for "pizza":');
const prPizza = searchEngine.search("pizza", "pagerank");
prPizza.results.forEach(r => {
  console.log(`  Rank #${r.position}: #${r.id} ${r.url} - PR: ${r.pageRank.toFixed(4)}, matches: ${r.keywordCount}`);
});

console.log('\n5. Side-by-Side Comparison for "pizza":');
const compEngine = new ComparisonEngine(searchEngine);
const comparison = compEngine.compare("pizza");
comparison.shifts.forEach(s => {
  console.log(`  ${s.url}: KW Rank #${s.keywordPos} -> PR Rank #${s.pageRankPos} (Shift: ${s.delta >= 0 ? '+' + s.delta : s.delta})`);
});

console.log('\n6. Checking Test Assertions:');
let passed = 0;
let total = 8;

// Test 1: kw pizza top is 6 with 10 matches
if (kwPizza.results[0].id === 6 && kwPizza.results[0].keywordCount === 10) {
  console.log("  [PASS] Test 1: Keyword Frequency ranks #6 at #1 with 10 matches.");
  passed++;
} else {
  console.log("  [FAIL] Test 1");
}

// Test 2: pr pizza top is 2, bottom is 6
if (prPizza.results[0].id === 2 && prPizza.results[prPizza.results.length - 1].id === 6) {
  console.log("  [PASS] Test 2: PageRank ranks #2 at #1 and #6 at #6.");
  passed++;
} else {
  console.log("  [FAIL] Test 2");
}

// Test 3: ranking systems produce different results
if (kwPizza.results[0].id !== prPizza.results[0].id) {
  console.log("  [PASS] Test 3: Ranking systems produce different results.");
  passed++;
} else {
  console.log("  [FAIL] Test 3");
}

// Test 4: graph topology matches
const expIn = { 1: [2, 6], 2: [1, 3, 4, 5], 3: [2], 4: [3], 5: [4], 6: [] };
let topoOk = true;
for (let id = 1; id <= 6; id++) {
  const p = dataset.find(x => x.id === id);
  if (JSON.stringify(p.incomingLinks.sort()) !== JSON.stringify(expIn[id].sort())) {
    topoOk = false;
  }
}
if (topoOk) {
  console.log("  [PASS] Test 4: Incoming and outgoing links match specifications.");
  passed++;
} else {
  console.log("  [FAIL] Test 4");
}

// Test 5: iterative calculation
if (prResult.iterations > 10 && prResult.converged) {
  console.log(`  [PASS] Test 5: PageRank converged iteratively in ${prResult.iterations} iterations.`);
  passed++;
} else {
  console.log("  [FAIL] Test 5");
}

// Test 6: query-independence
const q1 = searchEngine.search("pizza", "pagerank").results.find(r => r.id === 2).pageRank;
const q2 = searchEngine.search("pune", "pagerank").results.find(r => r.id === 2).pageRank;
if (Math.abs(q1 - q2) < 1e-9) {
  console.log("  [PASS] Test 6: PageRank values are independent of search queries.");
  passed++;
} else {
  console.log("  [FAIL] Test 6");
}

// Test 7: damping factor change
const d0 = new PageRankCalculator(dataset, 0.0).compute();
const d50 = new PageRankCalculator(dataset, 0.50).compute();
if (Math.abs(d0.scores[2] - 1.0) < 1e-6 && Math.abs(d50.scores[2] - prResult.scores[2]) > 0.1) {
  console.log("  [PASS] Test 7: Damping factor change dynamically recalculates scores.");
  passed++;
} else {
  console.log("  [FAIL] Test 7");
}

// Test 8: no visit counts used
let noVisits = true;
dataset.forEach(p => {
  if ('visits' in p || 'clicks' in p || 'views' in p) noVisits = false;
});
if (noVisits) {
  console.log("  [PASS] Test 8: No visit counts or click traffic metrics used.");
  passed++;
} else {
  console.log("  [FAIL] Test 8");
}

console.log(`\n=== SUMMARY: ${passed}/${total} TESTS PASSED ===\n`);
