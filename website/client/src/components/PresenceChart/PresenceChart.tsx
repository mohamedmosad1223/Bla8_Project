import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import './PresenceChart.css';

interface PresenceChartProps {
  data: {
    online: number;
    busy: number;
    offline: number;
  };
}

const PresenceChart = ({ data }: PresenceChartProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const chartData = [
    { name: 'متصل الآن', value: data.online || 20, color: '#10B981', gradientId: 'grad-online' },
    { name: 'مشغول', value: data.busy || 10, color: '#FBBF24', gradientId: 'grad-busy' },
    { name: 'غير متصل', value: data.offline || 5, color: '#EF4444', gradientId: 'grad-offline' },
  ];

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className={`presence-premium-container ${show ? 'animate-ready' : 'initial-opacity'}`}>
      <div className="presence-chart-stage">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <defs>
              <linearGradient id="grad-online" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
              <linearGradient id="grad-busy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="grad-offline" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#B91C1C" />
              </linearGradient>
              <filter id="premium-shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
                <feOffset dx="0" dy="4" result="offsetblur" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.3" />
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={show ? chartData : []}
              cx="50%"
              cy="50%"
              innerRadius={90}
              outerRadius={120}
              startAngle={225}
              endAngle={-45}
              paddingAngle={12}
              dataKey="value"
              stroke="none"
              cornerRadius={20}
              animationBegin={0}
              animationDuration={1200}
              animationEasing="ease-out"
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={`url(#${entry.gradientId})`} 
                  filter="url(#premium-shadow)"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        
        <div className="gauge-premium-center">
          <div className="live-pill-badge">
            <span className="live-dot-pulse"></span>
            <span className="live-pill-text">مباشر</span>
          </div>
          <div className="gauge-stats-group">
            <span className="gauge-big-number">{total}</span>
            <span className="gauge-subtitle">داعية مسجل</span>
          </div>
        </div>
      </div>
      
      <div className="presence-grid-legend">
        {chartData.map((item, index) => (
          <div 
            key={index} 
            className="premium-legend-card" 
            style={{ animationDelay: `${index * 0.15 + 0.6}s` }}
          >
            <div className="card-top-section">
              <div className="card-color-indicator" style={{ backgroundColor: item.color }}></div>
              <span className="card-title-text">{item.name}</span>
            </div>
            <div className="card-data-row">
              <span className="card-main-val">{item.value}</span>
              <span className="card-percent-chip">{Math.round((item.value / (total || 1)) * 100)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PresenceChart;
