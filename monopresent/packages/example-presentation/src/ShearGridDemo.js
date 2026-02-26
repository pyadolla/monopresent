import React, { useEffect, useRef } from "react";

export default function ShearGridDemo() {
  const svgRef = useRef(null);
  const gridRef = useRef(null);
  const handleRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    const grid = gridRef.current;
    const handle = handleRef.current;
    if (!svg || !grid || !handle) return;

    const N = 6;
    const spacing = 18;
    let k = 0.0;
    let dragging = false;

    const map = (u, v) => ({
      x: spacing * (u + k * v),
      y: spacing * v
    });

    const hLines = [];
    const vLines = [];

    for (let i = -N; i <= N; i++) {
      const h = document.createElementNS("http://www.w3.org/2000/svg", "line");
      const v = document.createElementNS("http://www.w3.org/2000/svg", "line");
      h.setAttribute("stroke", "#666");
      h.setAttribute("stroke-width", "1");
      v.setAttribute("stroke", "#666");
      v.setAttribute("stroke-width", "1");
      grid.appendChild(h);
      grid.appendChild(v);
      hLines.push({ line: h, v: i });
      vLines.push({ line: v, u: i });
    }

    const updateGrid = () => {
      hLines.forEach(({ line, v }) => {
        const y = spacing * v;
        line.setAttribute("x1", -150);
        line.setAttribute("y1", y);
        line.setAttribute("x2", 150);
        line.setAttribute("y2", y);
      });

      vLines.forEach(({ line, u }) => {
        const p1 = map(u, -N);
        const p2 = map(u, N);
        line.setAttribute("x1", p1.x);
        line.setAttribute("y1", p1.y);
        line.setAttribute("x2", p2.x);
        line.setAttribute("y2", p2.y);
      });

      const h = map(3, 3);
      handle.setAttribute("cx", h.x);
      handle.setAttribute("cy", h.y);
    };

    updateGrid();

    const onMouseDown = (e) => {
      dragging = true;
      e.stopPropagation();
    };
    const onMouseUp = () => {
      dragging = false;
    };
    const onMouseMove = (e) => {
      if (!dragging) return;

      const rect = svg.getBoundingClientRect();
        const x = (e.clientX - rect.left) * 300 / rect.width - 150;
        const y = (e.clientY - rect.top) * 300 / rect.height - 150;

      k = (x / spacing - 3) / 3;

      updateGrid();
    };

    handle.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    svg.addEventListener("mousemove", onMouseMove);

    return () => {
      handle.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      svg.removeEventListener("mousemove", onMouseMove);
      grid.innerHTML = "";
    };
  }, []);

  return (
    <div style={{ width: "50%", height: "50%", background: "#111" }}>
      <svg
        ref={svgRef}
        viewBox="-150 -150 300 300"
        style={{ width: "100%", height: "100%" }}
      >
        <line className="axis" x1="-150" y1="0" x2="150" y2="0" stroke="#aaa" strokeWidth="2" />
        <line className="axis" x1="0" y1="-150" x2="0" y2="150" stroke="#aaa" strokeWidth="2" />
        <g ref={gridRef} />
        <circle ref={handleRef} r="6" fill="orange" style={{ cursor: "pointer" }} />
      </svg>
    </div>
  );
}
