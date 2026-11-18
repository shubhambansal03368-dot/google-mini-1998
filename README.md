# Google 1998 – The Search Revolution: Recreating the Birth of PageRank

An authentic interactive recreation of the early 1998 Google search engine, built to demonstrate how web search evolved from naive keyword-frequency ranking to Larry Page and Sergey Brin's revolutionary PageRank algorithm.

---

## 🌟 Overview & Concept

In 1997, early search engines like AltaVista, Lycos, and Excite ranked pages based on how often a search term appeared in a webpage's text. This created an immediate incentive for webmasters to game the system through **keyword stuffing**—repeating popular keywords hundreds of times in hidden text or meta tags.

In 1998, Stanford University Ph.D. students Larry Page and Sergey Brin developed **PageRank**, treating the World Wide Web as a **directed citation graph**. By viewing hyperlinks as votes of confidence (weighted by the authority of the linking page), Google broke the keyword-stuffing incentive and founded modern search technology.

This project accurately recreates both ranking paradigms using the exact six-page historical dataset, an authentic 1998 aesthetic, and real-time interactive mathematics.

---

## 🚀 Live Demo & How to Run

The application is completely self-contained (HTML, CSS, JavaScript) with zero external dependencies.

To launch locally:

```bash
# Option A: Simple Python HTTP Server
python3 -m http.server 8000

# Option B: Any static file server or simply open index.html in any modern browser
open http://localhost:8000/
```

To run the automated verification test suite from the terminal:

```bash
node test_runner.js
```

---

## 📊 The Exact 6-Page Dataset

| ID | URL | Text Content | Outgoing Links | Inbound Links |
|:--:|:---|:---|:---:|:---:|
| **1** | `pune-food-guide.com` | Where to eat in Pune - vada pav and biryani and pizza | [2] | [2, 6] |
| **2** | `best-pizza-pune.com` | Fresh wood-fired pizza made daily - try our cheese pizza | [1, 3] | [1, 3, 4, 5] |
| **3** | `college-canteen-blog.com` | Student reviews of canteen food and chai and Friday pizza | [2, 4] | [2] |
| **4** | `pizza-recipes-home.com` | Make pizza at home - pizza dough and pizza sauce | [2, 5] | [3] |
| **5** | `cheap-eats-pune.com` | Good food under 100 rupees - misal and dosa and pizza slices | [2] | [4] |
| **6** | `pizza-pizza-pizza.com` | pizza pizza pizza pizza pizza pizza pizza pizza pizza pizza | [1] | *(None)* |

---

## 🧮 The PageRank Mathematics

The core algorithm is implemented according to Larry Page and Sergey Brin's original 1998 formulation:

$$PR(A) = (1 - d) + d \sum_{T_i \in In(A)} \frac{PR(T_i)}{C(T_i)}$$

Where:
- **$PR(A)$**: The PageRank score of page $A$.
- **$d$**: Damping factor ($d = 0.85$ default), representing the probability that a random surfer continues clicking links rather than jumping to a random URL ($1 - d = 0.15$).
- **$T_i$**: The set of pages linking into page $A$.
- **$C(T_i)$**: The number of outbound links from page $T_i$ (dilution protection).

### Exact Analytical & Numerical Convergence ($d = 0.85$):

All scores start at $PR_0 = 1.0$ (average score in an unnormalized graph). Over power iterations until $\Delta < 10^{-6}$:

| Page ID | Domain | Keyword Count ("pizza") | Inbound Links | Final PageRank |
|:--:|:---|:---:|:---:|:---:|
| **#2** | `best-pizza-pune.com` | 2 | 4 (from #1, #3, #4, #5) | **2.3574** |
| **#1** | `pune-food-guide.com` | 1 | 2 (from #2, #6) | **1.2794** |
| **#3** | `college-canteen-blog.com` | 1 | 1 (from #2) | **1.1519** |
| **#4** | `pizza-recipes-home.com` | 3 | 1 (from #3) | **0.6396** |
| **#5** | `cheap-eats-pune.com` | 1 | 1 (from #4) | **0.4218** |
| **#6** | `pizza-pizza-pizza.com` | **10** (Spam) | **0** | **0.1500** |

---

## ⚖️ The Key Comparison: "pizza" Query

When searching for the keyword **"pizza"**:

### Mode A: Traditional Keyword Frequency (Pre-Google 1997)
1. 🥇 **#6 `pizza-pizza-pizza.com`** (10 matches) &larr; *Pure spam wins!*
2. 🥈 **#4 `pizza-recipes-home.com`** (3 matches)
3. 🥉 **#2 `best-pizza-pune.com`** (2 matches)
4. **#1 `pune-food-guide.com`** (1 match)
5. **#3 `college-canteen-blog.com`** (1 match)
6. **#5 `cheap-eats-pune.com`** (1 match)

### Mode B: Google PageRank (1998)
1. 🥇 **#2 `best-pizza-pune.com`** (PR: 2.3574) &larr; *Quality hub wins with 4 incoming links!*
2. 🥈 **#1 `pune-food-guide.com`** (PR: 1.2794)
3. 🥉 **#3 `college-canteen-blog.com`** (PR: 1.1519)
4. **#4 `pizza-recipes-home.com`** (PR: 0.6396)
5. **#5 `cheap-eats-pune.com`** (PR: 0.4218)
6. **#6 `pizza-pizza-pizza.com`** (PR: 0.1500) &larr; *Demoted to last place!*

---

## 🎨 Interactive Features

1. **Authentic 1998 Homepage & SERP**:
   - Classic serif Google! logo with 1998 color scheme and drop shadow.
   - Traditional beveled inputs and buttons (`Google Search`, `I'm feeling lucky`).
   - Early Google SERP layout: `#0000cc` titles, green URLs, `<mark>` snippets, cached links.
   - 1-click algorithm switching directly on the search results page.

2. **Interactive SVG Directed Graph ("How PageRank Works")**:
   - Node radii scale proportionally to PageRank score.
   - Directed link arrows with SVG markers; curved paths prevent bidirectional link overlap.
   - Animated flow pulses show PageRank flowing along edges.
   - Draggable nodes with automatic coordinate constraints.
   - Real-time Damping Factor slider ($d \in [0.00, 1.00]$).
   - Step-by-Step Iteration Stepper: Reset (Iter 0), Step Forward (+1), and Auto-Play.
   - Live Node Inspector showing exact mathematical formula substitutions.

3. **Side-by-Side Comparison**:
   - Split columns comparing Keyword vs PageRank rankings simultaneously.
   - Dynamic shift badges showing rank movements (&uarr; +2, &darr; -5).
   - Automatically generated educational insights explaining why rankings inverted.

4. **"Why Google Changed Search Forever"**:
   - In-depth pedagogical essay explaining the history of web search from 1994 to 1998.
   - The Random Surfer Model and damping factor intuition.
   - The Water Flow in Pipes analogy.

5. **Algorithm Lab & Convergence**:
   - Full convergence log table across all power iterations.
   - Complete 6-page raw dataset table.

6. **In-Browser Automated Verification Suite**:
   - Live regression test runner validating all 8 engineering and mathematical specifications.

---

## 📁 File Structure

```text
google-mini-1998/
├── index.html           # Main semantic single-page web app
├── css/
│   └── style.css        # Authentic 1998 styling & modern responsive layout
├── js/
│   ├── dataset.js       # Exact 6-page dataset and graph topology
│   ├── pagerank.js      # Iterative PageRank engine with step history
│   ├── search.js        # Search engine: Keyword Frequency vs PageRank
│   ├── graph.js         # Interactive SVG directed graph visualizer
│   ├── comparison.js    # Side-by-side comparison & pedagogical insights
│   └── app.js           # UI controller, event listeners, state management
├── test_runner.js       # CLI test script (runs with Node.js)
└── README.md            # Project documentation & educational guide
```

---

## 📜 Verification Tests

Run `node test_runner.js` to verify:
1. `pizza` in Keyword Frequency mode ranks `#6` at #1 with 10 matches.
2. `pizza` in PageRank mode ranks `#2` at #1 (PR ~2.357) and `#6` at #6 (PR = 0.150).
3. The two ranking systems produce different results where appropriate.
4. All incoming and outgoing links match the dataset topology.
5. PageRank scores are computed iteratively until convergence.
6. PageRank scores are independent of search queries.
7. Modifying the damping factor dynamically recalculates PageRank scores.
8. Zero click counts or visit logs are used in ranking.
