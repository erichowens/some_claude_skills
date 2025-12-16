import React, { useEffect, useRef, useState, useCallback } from 'react';
import styles from './styles.module.css';

interface GraphNode {
  id: string;
  type: string;
  label: string;
  role?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
}

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
}

export default function KnowledgeGraph({ nodes, edges, onNodeClick }: KnowledgeGraphProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);

  // Bipartite layout: agents on left, skills on right
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    const agentNodes = nodes.filter(n => n.type === 'agent');
    const skillNodes = nodes.filter(n => n.type === 'skill');

    const agentColumnX = width * 0.15;
    const skillColumnX = width * 0.75;

    const agentSpacing = (height - 100) / Math.max(agentNodes.length, 1);
    const skillSpacing = (height - 100) / Math.max(skillNodes.length, 1);

    const positioned: LayoutNode[] = [];

    // Position agents in left column
    agentNodes.forEach((node, i) => {
      positioned.push({
        ...node,
        x: agentColumnX,
        y: 50 + (i + 0.5) * agentSpacing,
      });
    });

    // Position skills in right column
    skillNodes.forEach((node, i) => {
      positioned.push({
        ...node,
        x: skillColumnX,
        y: 50 + (i + 0.5) * skillSpacing,
      });
    });

    setLayoutNodes(positioned);
  }, [nodes]);

  // Get connected nodes for highlighting
  const getConnectedNodes = useCallback((nodeId: string): Set<string> => {
    const connected = new Set<string>();
    edges.forEach(edge => {
      if (edge.from === nodeId) connected.add(edge.to);
      if (edge.to === nodeId) connected.add(edge.from);
    });
    return connected;
  }, [edges]);

  // Render graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || layoutNodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const connectedToHovered = hoveredNode ? getConnectedNodes(hoveredNode) : new Set<string>();

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw column labels
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 14px var(--font-system)';
    ctx.textAlign = 'center';
    ctx.fillText('AGENTS (9)', canvas.width * 0.15, 30);
    ctx.fillText('SKILLS (51)', canvas.width * 0.75, 30);

    // Draw edges
    edges.forEach(edge => {
      const source = layoutNodes.find(n => n.id === edge.from);
      const target = layoutNodes.find(n => n.id === edge.to);
      if (!source || !target) return;

      const isHighlighted = hoveredNode &&
        (edge.from === hoveredNode || edge.to === hoveredNode);
      const isDimmed = hoveredNode && !isHighlighted;

      if (isDimmed) {
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.1)';
        ctx.lineWidth = 1;
      } else if (isHighlighted) {
        ctx.strokeStyle = '#f59e0b'; // Amber for highlighted edges
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.lineWidth = 1.5;
      }

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);

      // Bezier curve for smoother edges
      const cpX = (source.x + target.x) / 2;
      ctx.quadraticCurveTo(cpX, source.y, cpX, (source.y + target.y) / 2);
      ctx.quadraticCurveTo(cpX, target.y, target.x, target.y);

      ctx.stroke();
    });

    // Draw nodes
    layoutNodes.forEach(node => {
      const isAgent = node.type === 'agent';
      const isHovered = hoveredNode === node.id;
      const isConnected = connectedToHovered.has(node.id);
      const isDimmed = hoveredNode && !isHovered && !isConnected;

      // Node colors
      let fillColor: string;
      let strokeColor: string;
      let radius: number;

      if (isAgent) {
        fillColor = isHovered ? '#818cf8' : '#6366f1';
        strokeColor = isHovered ? '#c7d2fe' : '#4f46e5';
        radius = isHovered ? 16 : 12;
      } else {
        fillColor = isHovered ? '#34d399' : '#10b981';
        strokeColor = isHovered ? '#a7f3d0' : '#059669';
        radius = isHovered ? 10 : 6;
      }

      if (isDimmed) {
        fillColor = isAgent ? 'rgba(99, 102, 241, 0.3)' : 'rgba(16, 185, 129, 0.3)';
        strokeColor = 'transparent';
      } else if (isConnected && !isHovered) {
        // Highlight connected nodes
        fillColor = isAgent ? '#818cf8' : '#34d399';
        strokeColor = '#f59e0b';
        radius = isAgent ? 14 : 8;
      }

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();

      if (strokeColor !== 'transparent') {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw label
      const showLabel = isAgent || isHovered || isConnected;
      if (showLabel) {
        ctx.fillStyle = isDimmed ? 'rgba(255, 255, 255, 0.3)' : '#fff';
        ctx.font = isHovered ? 'bold 13px var(--font-code)' : '11px var(--font-code)';
        ctx.textAlign = isAgent ? 'right' : 'left';
        const labelX = isAgent ? node.x - radius - 8 : node.x + radius + 8;
        ctx.fillText(node.label, labelX, node.y + 4);
      }
    });

    // Draw hover tooltip with more info
    if (hoveredNode) {
      const node = layoutNodes.find(n => n.id === hoveredNode);
      if (node) {
        const connectionCount = connectedToHovered.size;
        const tooltipText = node.type === 'agent'
          ? `${node.label} (${connectionCount} connections)`
          : node.label;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = node.type === 'agent' ? '#6366f1' : '#10b981';
        ctx.lineWidth = 2;

        const padding = 12;
        ctx.font = 'bold 12px var(--font-system)';
        const textWidth = ctx.measureText(tooltipText).width;

        const tooltipX = node.x + (node.type === 'agent' ? -textWidth - 50 : 30);
        const tooltipY = node.y - 35;

        // Tooltip background
        ctx.beginPath();
        ctx.roundRect(tooltipX - padding, tooltipY - 16, textWidth + padding * 2, 28, 4);
        ctx.fill();
        ctx.stroke();

        // Tooltip text
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText(tooltipText, tooltipX, tooltipY);
      }
    }

  }, [layoutNodes, hoveredNode, edges, getConnectedNodes]);

  // Handle mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const node = layoutNodes.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      const hitRadius = n.type === 'agent' ? 16 : 10;
      return Math.sqrt(dx * dx + dy * dy) < hitRadius;
    });

    setHoveredNode(node ? node.id : null);
    canvas.style.cursor = node ? 'pointer' : 'default';
  };

  const handleClick = () => {
    if (hoveredNode && onNodeClick) {
      onNodeClick(hoveredNode);
    }
  };

  return (
    <div className="win31-window">
      <div className="win31-titlebar">
        <div className="win31-titlebar__left">
          <div className="win31-btn-3d win31-btn-3d--small">─</div>
        </div>
        <span className="win31-title-text">GRAPH.VIZ - Bipartite Capability Network</span>
        <div className="win31-titlebar__right">
          <div className="win31-btn-3d win31-btn-3d--small">□</div>
        </div>
      </div>

      <div className={styles.graphContainer}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={700}
          className={styles.graphCanvas}
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          onMouseLeave={() => setHoveredNode(null)}
        />

        <div className={styles.graphLegend}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#6366f1' }} />
            <span>Agents</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#10b981' }} />
            <span>Skills</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#f59e0b' }} />
            <span>Connections (hover)</span>
          </div>
        </div>

        <div className={styles.graphInstructions}>
          <span>Hover over a node to see its connections • Click to view details</span>
        </div>
      </div>
    </div>
  );
}
