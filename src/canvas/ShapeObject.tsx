import type { ShapeObjectData } from '../types';

interface ShapeObjectProps {
  data: ShapeObjectData;
  width: number;
  height: number;
}

export function ShapeObject({ data, width, height }: ShapeObjectProps) {
  const {
    shapeType,
    fill = '#D78C9F',
    strokeColor = 'transparent',
    strokeWidth = 2,
    opacity = 1,
    shadow = false,
    rounded = 12,
    starPoints = 5,
  } = data;

  const shadowFilter = shadow ? 'drop-shadow(0 6px 16px rgba(50, 40, 45, 0.15))' : undefined;

  const renderShape = () => {
    const sw = Math.max(0, strokeWidth);
    const halfSw = sw / 2;
    const w = Math.max(1, width);
    const h = Math.max(1, height);

    switch (shapeType) {
      case 'rect':
        return (
          <rect
            x={halfSw}
            y={halfSw}
            width={Math.max(1, w - sw)}
            height={Math.max(1, h - sw)}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={sw}
          />
        );

      case 'rounded-rect':
        return (
          <rect
            x={halfSw}
            y={halfSw}
            width={Math.max(1, w - sw)}
            height={Math.max(1, h - sw)}
            rx={Math.min(rounded, Math.min(w, h) / 2)}
            ry={Math.min(rounded, Math.min(w, h) / 2)}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={sw}
          />
        );

      case 'circle':
        return (
          <ellipse
            cx={w / 2}
            cy={h / 2}
            rx={Math.max(1, w / 2 - halfSw)}
            ry={Math.max(1, h / 2 - halfSw)}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={sw}
          />
        );

      case 'triangle': {
        const p1 = `${w / 2},${halfSw}`;
        const p2 = `${w - halfSw},${h - halfSw}`;
        const p3 = `${halfSw},${h - halfSw}`;
        return (
          <polygon
            points={`${p1} ${p2} ${p3}`}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        );
      }

      case 'star': {
        const cx = w / 2;
        const cy = h / 2;
        const outerR = Math.min(w, h) / 2 - halfSw;
        const innerR = outerR * 0.42;
        const numPoints = starPoints || 5;
        const points: string[] = [];

        for (let i = 0; i < numPoints * 2; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / numPoints - Math.PI / 2;
          const px = cx + r * Math.cos(angle);
          const py = cy + r * Math.sin(angle);
          points.push(`${px.toFixed(1)},${py.toFixed(1)}`);
        }

        return (
          <polygon
            points={points.join(' ')}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        );
      }

      case 'line':
        return (
          <line
            x1={halfSw}
            y1={h / 2}
            x2={w - halfSw}
            y2={h / 2}
            stroke={strokeColor !== 'transparent' ? strokeColor : fill}
            strokeWidth={Math.max(2, sw || 2)}
            strokeLinecap="round"
          />
        );

      case 'divider': {
        const lineY = h / 2;
        return (
          <g>
            <line
              x1={0}
              y1={lineY}
              x2={w}
              y2={lineY}
              stroke={strokeColor !== 'transparent' ? strokeColor : fill}
              strokeWidth={Math.max(1.5, sw || 2)}
              strokeDasharray="6 4"
              strokeLinecap="round"
            />
          </g>
        );
      }

      case 'arrow': {
        const arrowHeadSize = Math.min(24, Math.min(w, h) * 0.35);
        const startX = halfSw;
        const endX = w - halfSw;
        const midY = h / 2;
        const arrowColor = strokeColor !== 'transparent' ? strokeColor : fill;
        const lineStrokeW = Math.max(2, sw || 3);

        return (
          <g>
            <line
              x1={startX}
              y1={midY}
              x2={endX - arrowHeadSize * 0.8}
              y2={midY}
              stroke={arrowColor}
              strokeWidth={lineStrokeW}
              strokeLinecap="round"
            />
            <polygon
              points={`${endX},${midY} ${endX - arrowHeadSize},${midY - arrowHeadSize * 0.55} ${endX - arrowHeadSize * 0.7},${midY} ${endX - arrowHeadSize},${midY + arrowHeadSize * 0.55}`}
              fill={arrowColor}
            />
          </g>
        );
      }

      case 'speech-bubble': {
        const tailH = Math.min(20, h * 0.25);
        const bodyH = h - tailH;
        const r = Math.min(rounded, Math.min(w, bodyH) / 4);

        const d = `
          M ${r + halfSw},${halfSw}
          H ${w - r - halfSw}
          A ${r},${r} 0 0 1 ${w - halfSw},${r + halfSw}
          V ${bodyH - r}
          A ${r},${r} 0 0 1 ${w - r - halfSw},${bodyH}
          H ${Math.min(w * 0.45, w - r)}
          L ${Math.max(w * 0.2, r)},${h - halfSw}
          L ${Math.max(w * 0.25, r + 10)},${bodyH}
          H ${r + halfSw}
          A ${r},${r} 0 0 1 ${halfSw},${bodyH - r}
          V ${r + halfSw}
          A ${r},${r} 0 0 1 ${r + halfSw},${halfSw}
          Z
        `;

        return (
          <path
            d={d}
            fill={fill}
            stroke={strokeColor}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
        );
      }

      default:
        return null;
    }
  };

  return (
    <svg
      className="shape-object-svg"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        opacity,
        filter: shadowFilter,
        overflow: 'visible',
      }}
      aria-hidden="true"
    >
      {renderShape()}
    </svg>
  );
}
