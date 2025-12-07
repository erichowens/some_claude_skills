import React, { useEffect, useRef, useState } from 'react';
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
  vx: number;
  vy: number;
}

export default function KnowledgeGraph({ nodes, edges, onNodeClick }: KnowledgeGraphProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [layoutNodes, setLayoutNodes] = useState<LayoutNode[]>([]);
  const animationRef = useRef<number>();

  // Force-directed layout simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = canvas.width;
    const height = canvas.height;

    // Initialize node positions
    const agentNodes = nodes.filter(n => n.type === 'agent');
    const skillNodes = nodes.filter(n => n.type === 'skill');

    const initialNodes: LayoutNode[] = nodes.map((node, i) => {
      const isAgent = node.type === 'agent';

      // Agents in center ring, skills in outer ring
      if (isAgent) {
        const angle = (i / agentNodes.length) * Math.PI * 2;
        const radius = Math.min(width, height) * 0.25;
        return {
          ...node,
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0
        };
      } else {
        const skillIndex = skillNodes.findIndex(s => s.id === node.id);
        const angle = (skillIndex / skillNodes.length) * Math.PI * 2;
        const radius = Math.min(width, height) * 0.4;
        return {
          ...node,
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0
        };
      }
    });

    setLayoutNodes(initialNodes);

    // Simple force simulation
    const simulate = () => {
      setLayoutNodes(prevNodes => {
        const newNodes = prevNodes.map(node => ({ ...node }));

        // Apply forces
        newNodes.forEach((node, i) => {
          let fx = 0;
          let fy = 0;

          // Repulsion between all nodes
          newNodes.forEach((other, j) => {
            if (i === j) return;
            const dx = node.x - other.x;
            const dy = node.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 100 / (dist * dist);
            fx += (dx / dist) * force;
            fy += (dy / dist) * force;
          });

          // Attraction along edges
          edges.forEach(edge => {
            const isSource = edge.from === node.id;
            const isTarget = edge.to === node.id;

            if (isSource || isTarget) {
              const other = newNodes.find(n =>
                n.id === (isSource ? edge.to : edge.from)
              );
              if (other) {
                const dx = other.x - node.x;
                const dy = other.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = dist * 0.01;
                fx += (dx / dist) * force;
                fy += (dy / dist) * force;
              }
            }
          });

          // Center gravity
          const centerX = width / 2;
          const centerY = height / 2;
          const dx = centerX - node.x;
          const dy = centerY - node.y;
          fx += dx * 0.001;
          fy += dy * 0.001;

          // Update velocity and position
          node.vx = (node.vx + fx) * 0.9;
          node.vy = (node.vy + fy) * 0.9;
          node.x += node.vx;
          node.y += node.vy;

          // Keep in bounds
          const margin = 40;
          node.x = Math.max(margin, Math.min(width - margin, node.x));
          node.y = Math.max(margin, Math.min(height - margin, node.y));
        });

        return newNodes;
      });

      animationRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, edges]);

  // Render graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || layoutNodes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    edges.forEach(edge => {
      const source = layoutNodes.find(n => n.id === edge.from);
      const target = layoutNodes.find(n => n.id === edge.to);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

    // Draw nodes
    layoutNodes.forEach(node => {
      const isAgent = node.type === 'agent';
      const isHovered = hoveredNode === node.id;

      ctx.fillStyle = isAgent ? '#6366f1' : '#10b981';
      ctx.beginPath();
      ctx.arc(node.x, node.y, isHovered ? 12 : 8, 0, Math.PI * 2);
      ctx.fill();

      if (isHovered || isAgent) {
        ctx.fillStyle = '#fff';
        ctx.font = '11px var(--font-code)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y - 15);
      }
    });

  }, [layoutNodes, hoveredNode, edges]);

  // Handle mouse events
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const node = layoutNodes.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 12;
    });

    setHoveredNode(node ? node.id : null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
        <span className="win31-title-text">GRAPH.VIZ - Capability Network</span>
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
        </div>
      </div>
    </div>
  );
}
