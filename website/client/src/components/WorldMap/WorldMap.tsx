import { useState, useEffect } from 'react';
import './WorldMap.css';

const highlights = [
  { id: 'usa', color: '#EF4444', top: '35%', left: '18%', label: 'الولايات المتحدة الأمريكية', value: '72,000' },
  { id: 'brazil', color: '#EF4444', top: '70%', left: '33%', label: 'البرازيل', value: '15,000' },
  { id: 'nigeria', color: '#3B82F6', top: '58%', left: '50%', label: 'نيجيريا', value: '42,000' },
  { id: 'china', color: '#8B5CF6', top: '42%', left: '80%', label: 'الصين', value: '120,000' },
  { id: 'indonesia', color: '#10B981', top: '75%', left: '86%', label: 'إندونيسيا', value: '95,000' },
];

const WorldMap = () => {
  const [isReady, setIsReady] = useState(false);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`world-map-component ${isReady ? 'animate-ready' : ''}`}>
      <div className="map-outer-container">
        <div className="map-inner-wrapper">
          <img 
            src="/world_map.png" 
            alt="World Map" 
            className="map-image-main"
            onError={(e) => { e.currentTarget.src = 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/img/section/world.png'; }}
          />
          <div className="map-dots-overlay">
            {isReady && highlights.map((h, i) => (
              <div 
                key={i} 
                className={`map-dot-centerer ${hoveredDot === i ? 'is-hovered' : ''}`}
                style={{ 
                  top: h.top, 
                  left: h.left,
                  animationDelay: `${i * 0.15}s`
                }}
                onMouseEnter={() => setHoveredDot(i)}
                onMouseLeave={() => setHoveredDot(null)}
              >
                <div 
                  className="premium-map-dot" 
                  style={{ 
                    backgroundColor: h.color,
                    color: h.color
                  }}
                >
                  <div className="map-pulse-radar"></div>
                </div>
                
                {/* Interactive Tooltip */}
                <div className={`map-tooltip ${hoveredDot === i ? 'show' : ''}`}>
                  <div className="tooltip-content">
                    <span className="tooltip-label">{h.label}</span>
                    <span className="tooltip-value">{h.value} شخص</span>
                  </div>
                  <div className="tooltip-arrow"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorldMap;
