/**
 * graph.js - Interactive SVG Directed Graph Visualizer for PageRank
 * 
 * Renders the 6-page web topology as a directed graph where:
 * - Node radius is proportional to PageRank score
 * - Node colors reflect authority tiers
 * - Directed arrows show link directions with SVG markers
 * - Curving paths cleanly separate bidirectional links
 * - Nodes can be dragged interactively
 * - Clicking a node reveals a comprehensive PageRank Inspector
 * - Supports animated link flow pulses showing PageRank propagation
 */

class PageRankGraph {
  /**
   * @param {string} containerId - DOM ID where SVG is mounted
   * @param {Array} dataset - Dataset pages
   * @param {Object} pageRankScores - { id: score }
   * @param {Function} onSelectNode - Callback when node is clicked
   */
  constructor(containerId, dataset, pageRankScores, onSelectNode) {
    this.container = document.getElementById(containerId);
    this.dataset = dataset;
    this.pageRankScores = pageRankScores;
    this.onSelectNode = onSelectNode;
    this.selectedNodeId = 2; // Default select best-pizza-pune.com
    this.hoveredNodeId = null;

    // Fixed harmonious coordinates for the 6 nodes in 760x500 viewBox
    this.nodePositions = {
      1: { x: 230, y: 190 }, // pune-food-guide.com
      2: { x: 440, y: 260 }, // best-pizza-pune.com (central authority)
      3: { x: 610, y: 160 }, // college-canteen-blog.com
      4: { x: 620, y: 380 }, // pizza-recipes-home.com
      5: { x: 330, y: 420 }, // cheap-eats-pune.com
      6: { x: 90,  y: 190 }  // pizza-pizza-pizza.com (isolated spammer)
    };

    this.dragTarget = null;
    this.dragOffset = { x: 0, y: 0 };
    this.animationTimer = null;
    this.particleOffset = 0;

    this.init();
  }

  /**
   * Update PageRank scores and refresh node radii and inspector
   */
  updateScores(newScores) {
    this.pageRankScores = newScores;
    this.render();
    if (this.selectedNodeId && this.onSelectNode) {
      this.onSelectNode(this.selectedNodeId);
    }
  }

  /**
   * Initialize SVG structure, definitions, and event listeners
   */
  init() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="graph-svg-wrapper">
        <svg id="pagerank-svg" viewBox="0 0 760 500" preserveAspectRatio="xMidYMid meet">
          <defs>
            <!-- Standard link arrowhead -->
            <marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#666" />
            </marker>
            <!-- Highlighted outgoing arrowhead (Blue) -->
            <marker id="arrow-outgoing" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1a73e8" />
            </marker>
            <!-- Highlighted incoming arrowhead (Green) -->
            <marker id="arrow-incoming" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#188038" />
            </marker>
            <!-- Subtle node shadow -->
            <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="3" stdDeviation="3" flood-opacity="0.25"/>
            </filter>
            <!-- Pulse Glow for high PageRank -->
            <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#f9ab00" flood-opacity="0.6"/>
            </filter>
          </defs>

          <!-- Graph layers -->
          <g id="edges-layer"></g>
          <g id="flow-particles-layer"></g>
          <g id="nodes-layer"></g>
        </svg>
      </div>
    `;

    this.svg = document.getElementById("pagerank-svg");
    this.edgesLayer = document.getElementById("edges-layer");
    this.particlesLayer = document.getElementById("flow-particles-layer");
    this.nodesLayer = document.getElementById("nodes-layer");

    this.attachDragListeners();
    this.startFlowAnimation();
    this.render();

    // Trigger initial node selection
    if (this.onSelectNode) {
      this.onSelectNode(this.selectedNodeId);
    }
  }

  /**
   * Calculate node radius proportional to PageRank
   * Base radius 24px, expands up to 54px for high PageRank
   */
  getNodeRadius(pageId) {
    const pr = this.pageRankScores[pageId] !== undefined ? this.pageRankScores[pageId] : 0.15;
    // Map PR [0.15 ... 2.5] to radius [22 ... 52]
    const clampedPR = Math.max(0.15, Math.min(pr, 3.0));
    return 20 + (clampedPR * 12.5);
  }

  /**
   * Main render loop for edges, particles, and nodes
   */
  render() {
    this.renderEdges();
    this.renderNodes();
  }

  /**
   * Render all directed link edges with proper curvature and markers
   */
  renderEdges() {
    let edgesHtml = "";

    this.dataset.forEach(source => {
      source.linksTo.forEach(targetId => {
        const target = this.dataset.find(p => p.id === targetId);
        if (!target) return;

        const p1 = this.nodePositions[source.id];
        const p2 = this.nodePositions[target.id];

        // Check if bidirectional link exists (e.g. between 1 and 2, or 2 and 3)
        const isBidirectional = target.linksTo.includes(source.id);
        const edgeId = `edge-${source.id}-${target.id}`;

        // Compute curved control point for aesthetic pathing
        const pathData = this.calculateCurvedPath(p1, p2, isBidirectional, source.id > target.id);

        // Determine edge highlight state
        let edgeClass = "graph-edge";
        let marker = "url(#arrow)";

        const activeNode = this.hoveredNodeId || this.selectedNodeId;
        if (activeNode) {
          if (source.id === activeNode) {
            edgeClass += " edge-outgoing";
            marker = "url(#arrow-outgoing)";
          } else if (target.id === activeNode) {
            edgeClass += " edge-incoming";
            marker = "url(#arrow-incoming)";
          } else {
            edgeClass += " edge-dimmed";
          }
        }

        edgesHtml += `
          <path id="${edgeId}" 
                d="${pathData}" 
                class="${edgeClass}" 
                marker-end="${marker}"
                data-source="${source.id}"
                data-target="${target.id}" />
        `;
      });
    });

    this.edgesLayer.innerHTML = edgesHtml;
  }

  /**
   * Calculate a smooth SVG quadratic curve path between two points
   */
  calculateCurvedPath(p1, p2, isBidirectional, flipCurve) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Normal vector perpendicular to the line
    const nx = -dy / dist;
    const ny = dx / dist;

    // Curvature amount
    let curveAmount = 0;
    if (isBidirectional) {
      curveAmount = flipCurve ? 38 : -38;
    } else {
      // Gentle curve to make parallel lines and angles look organic
      curveAmount = 14;
    }

    const midX = (p1.x + p2.x) / 2 + nx * curveAmount;
    const midY = (p1.y + p2.y) / 2 + ny * curveAmount;

    return `M ${p1.x} ${p1.y} Q ${midX} ${midY} ${p2.x} ${p2.y}`;
  }

  /**
   * Render SVG node circles, domain labels, and PageRank badges
   */
  renderNodes() {
    let nodesHtml = "";

    this.dataset.forEach(page => {
      const pos = this.nodePositions[page.id];
      const radius = this.getNodeRadius(page.id);
      const pr = this.pageRankScores[page.id] !== undefined ? this.pageRankScores[page.id] : 0.15;
      const isSelected = page.id === this.selectedNodeId;
      const isHovered = page.id === this.hoveredNodeId;
      const isTopRanked = pr >= 2.0;

      let nodeClass = "graph-node";
      if (isSelected) nodeClass += " node-selected";
      if (isHovered) nodeClass += " node-hovered";
      if (isTopRanked) nodeClass += " node-top-authority";
      if (pr <= 0.2) nodeClass += " node-low-authority";

      // Color scheme:
      // High PR: Gold / Royal Google Blue
      // Mid PR: Warm blue / cyan
      // Spam / Low PR: Muted grey-red
      let fillColor = "#e8f0fe";
      let strokeColor = "#1a73e8";

      if (pr >= 2.0) {
        fillColor = "#fef7e0"; // Soft gold
        strokeColor = "#f29900"; // Rich amber
      } else if (pr >= 1.0) {
        fillColor = "#e6f4ea"; // Google green
        strokeColor = "#137333";
      } else if (pr <= 0.2) {
        fillColor = "#fce8e6"; // Soft pink
        strokeColor = "#c5221f"; // Google red
      }

      nodesHtml += `
        <g class="${nodeClass}" 
           id="node-group-${page.id}" 
           transform="translate(${pos.x}, ${pos.y})"
           data-id="${page.id}"
           style="cursor: grab;">
          
          <!-- Outer halo for top authority -->
          ${isTopRanked ? `<circle r="${radius + 7}" class="node-halo" fill="none" stroke="#f9ab00" stroke-width="2" stroke-dasharray="4 3" opacity="0.8" />` : ''}

          <!-- Main circle -->
          <circle r="${radius}" 
                  fill="${fillColor}" 
                  stroke="${strokeColor}" 
                  stroke-width="${isSelected ? 3.5 : 2.5}" 
                  filter="url(#node-shadow)" />

          <!-- Node ID & PR Score -->
          <text y="-4" class="node-text-id" text-anchor="middle" font-weight="bold" font-size="${radius > 32 ? '14' : '12'}">
            #${page.id}
          </text>
          <text y="14" class="node-text-pr" text-anchor="middle" font-size="11" font-weight="600" fill="#333">
            PR: ${pr.toFixed(2)}
          </text>

          <!-- Domain URL label placed beneath circle -->
          <text y="${radius + 17}" class="node-label-url" text-anchor="middle" font-size="11">
            ${page.url.replace('.com', '')}
          </text>

          <!-- Inbound count badge -->
          <g transform="translate(${radius * 0.7}, ${-radius * 0.7})">
            <circle r="10" fill="#188038" stroke="#fff" stroke-width="1.5" />
            <text text-anchor="middle" y="3.5" font-size="9" font-weight="bold" fill="#fff">
              ${page.incomingLinks.length}
            </text>
          </g>
        </g>
      `;
    });

    this.nodesLayer.innerHTML = nodesHtml;
    this.attachNodeInteractionListeners();
  }

  /**
   * Attach hover and click listeners to node groups
   */
  attachNodeInteractionListeners() {
    const nodeGroups = this.nodesLayer.querySelectorAll(".graph-node");

    nodeGroups.forEach(group => {
      const pageId = parseInt(group.getAttribute("data-id"), 10);

      group.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectedNodeId = pageId;
        this.render();
        if (this.onSelectNode) {
          this.onSelectNode(pageId);
        }
      });

      group.addEventListener("mouseenter", () => {
        this.hoveredNodeId = pageId;
        this.renderEdges();
      });

      group.addEventListener("mouseleave", () => {
        this.hoveredNodeId = null;
        this.renderEdges();
      });
    });
  }

  /**
   * Enable dragging of nodes to rearrange graph dynamically
   */
  attachDragListeners() {
    this.svg.addEventListener("mousedown", (e) => {
      const group = e.target.closest(".graph-node");
      if (!group) return;

      const pageId = parseInt(group.getAttribute("data-id"), 10);
      this.dragTarget = pageId;
      group.style.cursor = "grabbing";

      const pt = this.getSvgCoordinates(e);
      const pos = this.nodePositions[pageId];
      this.dragOffset = {
        x: pt.x - pos.x,
        y: pt.y - pos.y
      };
    });

    window.addEventListener("mousemove", (e) => {
      if (!this.dragTarget) return;

      const pt = this.getSvgCoordinates(e);
      // Constrain inside bounds [40, 720] x [40, 460]
      const newX = Math.max(50, Math.min(710, pt.x - this.dragOffset.x));
      const newY = Math.max(50, Math.min(450, pt.y - this.dragOffset.y));

      this.nodePositions[this.dragTarget] = { x: newX, y: newY };
      this.render();
    });

    window.addEventListener("mouseup", () => {
      if (this.dragTarget) {
        const group = document.getElementById(`node-group-${this.dragTarget}`);
        if (group) group.style.cursor = "grab";
        this.dragTarget = null;
      }
    });

    // Touch support for mobile devices
    this.svg.addEventListener("touchstart", (e) => {
      const touch = e.touches[0];
      const group = document.elementFromPoint(touch.clientX, touch.clientY)?.closest(".graph-node");
      if (!group) return;

      const pageId = parseInt(group.getAttribute("data-id"), 10);
      this.dragTarget = pageId;

      const pt = this.getSvgCoordinates(touch);
      const pos = this.nodePositions[pageId];
      this.dragOffset = {
        x: pt.x - pos.x,
        y: pt.y - pos.y
      };
      e.preventDefault();
    }, { passive: false });

    window.addEventListener("touchmove", (e) => {
      if (!this.dragTarget) return;
      const touch = e.touches[0];
      const pt = this.getSvgCoordinates(touch);

      const newX = Math.max(50, Math.min(710, pt.x - this.dragOffset.x));
      const newY = Math.max(50, Math.min(450, pt.y - this.dragOffset.y));

      this.nodePositions[this.dragTarget] = { x: newX, y: newY };
      this.render();
      e.preventDefault();
    }, { passive: false });

    window.addEventListener("touchend", () => {
      this.dragTarget = null;
    });
  }

  /**
   * Convert client viewport coordinates to SVG coordinate system
   */
  getSvgCoordinates(e) {
    const CTM = this.svg.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (e.clientX - CTM.e) / CTM.a,
      y: (e.clientY - CTM.f) / CTM.d
    };
  }

  /**
   * Animate flow particles moving along links to represent PageRank transmission
   */
  startFlowAnimation() {
    const animate = () => {
      this.particleOffset = (this.particleOffset + 0.007) % 1.0;
      this.renderFlowParticles();
      this.animationTimer = requestAnimationFrame(animate);
    };
    this.animationTimer = requestAnimationFrame(animate);
  }

  /**
   * Render moving dot along each active edge path
   */
  renderFlowParticles() {
    if (!this.particlesLayer) return;

    let particlesHtml = "";
    const activeNode = this.hoveredNodeId || this.selectedNodeId;

    this.dataset.forEach(source => {
      source.linksTo.forEach(targetId => {
        const edgeId = `edge-${source.id}-${targetId}`;
        const pathEl = document.getElementById(edgeId);
        if (!pathEl) return;

        try {
          if (!pathEl.getTotalLength || typeof pathEl.getTotalLength !== "function") return;
          const totalLength = pathEl.getTotalLength();
          if (!totalLength || totalLength <= 0) return;

          // Calculate current point along the curve
          // Stagger particles per source
          const staggeredOffset = (this.particleOffset + (source.id * 0.16)) % 1.0;
          const pt = pathEl.getPointAtLength(totalLength * staggeredOffset);
          if (!pt) return;

          // Highlight particle if connected to selected/hovered node
          let particleFill = "#1a73e8";
          let particleRadius = 3.5;
          let opacity = 0.75;

          if (activeNode) {
            if (source.id === activeNode || targetId === activeNode) {
              particleFill = source.id === activeNode ? "#1a73e8" : "#188038";
              particleRadius = 4.5;
              opacity = 1.0;
            } else {
              opacity = 0.2;
            }
          }

          particlesHtml += `
            <circle cx="${pt.x}" cy="${pt.y}" r="${particleRadius}" fill="${particleFill}" opacity="${opacity}" />
          `;
        } catch (err) {
          // Gracefully ignore measurement errors when tab is hidden
        }
      });
    });

    this.particlesLayer.innerHTML = particlesHtml;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PageRankGraph };
}
