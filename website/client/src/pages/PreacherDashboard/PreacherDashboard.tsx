import React, { useState, useRef, useEffect } from 'react';
import './PreacherDashboard.css';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TooltipState { visible: boolean; x: number; y: number; value: string; label: string; }

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, trend, icon, up }: {
  label: string; value: number; trend: string; icon: React.ReactNode; up: boolean;
}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setCount(value); clearInterval(timer); }
      else setCount(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <div className="pd-stat-card">
      <div className="pd-stat-top">
        <div className="pd-stat-info">
          <span className="pd-stat-label">{label}</span>
          <span className="pd-stat-value">{count}</span>
        </div>
        <div className="pd-stat-icon">{icon}</div>
      </div>
      <div className={`pd-stat-trend ${up ? 'up' : 'down'}`}>
        <span>{up ? '▲' : '▼'}</span>
        <span className="pd-trend-val">{trend}</span>
        <span className="pd-stat-sub">الشهر الماضي</span>
      </div>
    </div>
  );
};

// ─── Area Chart (Response Time) ───────────────────────────────────────────────
const months = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const responseData = [3, 5, 4, 6, 8, 12, 18, 10, 7, 5, 4, 3];
const YMAX = 20;

const ResponseChart = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, value: '', label: '' });
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 500, H = 180;
  const pad = { t: 16, r: 16, b: 36, l: 52 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const xp = (i: number) => pad.l + (i / (responseData.length - 1)) * iW;
  const yp = (v: number) => pad.t + iH - (v / YMAX) * iH;

  const linePath = responseData.map((v, i) => `${i === 0 ? 'M' : 'L'}${xp(i).toFixed(1)},${yp(v).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${xp(responseData.length-1).toFixed(1)},${(pad.t+iH).toFixed(1)} L${pad.l},${(pad.t+iH).toFixed(1)} Z`;
  const peakIdx = responseData.indexOf(Math.max(...responseData));

  return (
    <div className="pd-chart-svg-wrap">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="pd-svg-responsive">
        <defs>
          <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dba841" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#dba841" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Grid + Y labels */}
        {[0,5,10,15,20].map(v => (
          <g key={v}>
            <line x1={pad.l} y1={yp(v)} x2={pad.l+iW} y2={yp(v)} stroke="#edf2f7" strokeWidth="1" />
            <text x={pad.l-8} y={yp(v)+4} textAnchor="end" fontSize="10" fill="#a0aec0">{v}</text>
          </g>
        ))}
        {/* Area */}
        <path d={areaPath} fill="url(#respGrad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#dba841" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points with hover */}
        {responseData.map((v, i) => (
          <circle
            key={i} cx={xp(i)} cy={yp(v)} r="5" fill={i === peakIdx ? '#dba841' : '#fff'}
            stroke="#dba841" strokeWidth="2" className="pd-dot-hover"
            onMouseEnter={(e) => {
              const rect = svgRef.current?.getBoundingClientRect();
              if (rect) setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top - 36, value: `${v} دقيقة`, label: months[i] });
            }}
            onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
          />
        ))}
        {/* Peak badge */}
        <rect x={xp(peakIdx)-30} y={yp(responseData[peakIdx])-28} width="60" height="22" rx="6" fill="#2d3748" />
        <text x={xp(peakIdx)} y={yp(responseData[peakIdx])-13} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">
          {responseData[peakIdx]} دقيقة
        </text>
        {/* X labels */}
        {months.map((m, i) => (
          <text key={i} x={xp(i)} y={H-6} textAnchor="middle" fontSize="9" fill="#a0aec0">{m}</text>
        ))}
      </svg>
      {tooltip.visible && (
        <div className="pd-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <strong>{tooltip.label}</strong><br />{tooltip.value}
        </div>
      )}
    </div>
  );
};

// ─── Province Map + Bars ──────────────────────────────────────────────────────
const provinces = [
  { name: 'محافظة الأحمدي',      val: 72, color: '#f4a8c0' },
  { name: 'محافظة الجهراء',       val: 50, color: '#85d1e0' },
  { name: 'محافظة العاصمة',      val: 40, color: '#e8c96a' },
  { name: 'محافظة الفروانية',     val: 30, color: '#b8d98d' },
  { name: 'مبارك الكبير',         val: 20, color: '#f4a261' },
  { name: 'محافظة حولي',          val: 20, color: '#a29bfe' },
];

const ProvinceSection = () => (
  <div className="pd-province-wrap">
    {/* Kuwait map image */}
    <img src="/image 1.png" alt="خريطة محافظات الكويت" className="pd-map-svg" />

    {/* Province bar list — below map */}
    <div className="pd-prov-bars">
      {provinces.map((p, i) => (
        <div key={i} className="pd-prov-row">
          <span className="pd-prov-dot" style={{ background: p.color }} />
          <span className="pd-prov-name">{p.name}</span>
          <div className="pd-prov-track">
            <div className="pd-prov-fill" style={{ width: `${(p.val / 72) * 100}%`, background: p.color }} />
          </div>
          <span className="pd-prov-val">{p.val} ألف شخص</span>
        </div>
      ))}
    </div>
  </div>
);

// ─── Donut Chart ──────────────────────────────────────────────────────────────
const segments = [
  { label: 'تم تنفيذه',   val: 20, color: '#51cf66' },
  { label: 'قيد التنفيذ', val: 10, color: '#dba841' },
  { label: 'تم الإلغاء',  val: 5,  color: '#ff6b6b' },
];
const total = segments.reduce((s, x) => s + x.val, 0);

const DonutChart = () => {
  const [hovered, setHovered] = useState<number | null>(null);
  const r = 58, cx = 80, cy = 80, sw = 22;
  const circ = 2 * Math.PI * r;
  let offset = circ * 0.25;
  return (
    <div className="pd-donut-wrap">
      <svg viewBox="0 0 160 160" className="pd-donut-svg">
        {segments.map((s, i) => {
          const len = (s.val / total) * circ;
          const seg = (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={s.color} strokeWidth={hovered === i ? sw + 4 : sw}
              strokeDasharray={`${len} ${circ - len}`} strokeDashoffset={offset}
              strokeLinecap="butt" className="pd-donut-seg"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
          );
          offset -= len;
          return seg;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="800" fill="#2d3748">
          {hovered !== null ? segments[hovered].val : total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#718096">
          {hovered !== null ? segments[hovered].label : 'موعد'}
        </text>
      </svg>
      <div className="pd-donut-legend">
        {segments.map((s, i) => (
          <div key={i} className={`pd-legend-row ${hovered === i ? 'hovered' : ''}`}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <span className="pd-dot" style={{ background: s.color }} />
            <span className="pd-legend-text">{s.label}</span>
            <strong>{s.val}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Follow-up Line Chart ─────────────────────────────────────────────────────
const todayPts = [30, 35, 42, 38, 50, 55, 62, 68, 72, 75];
const prevPts  = [20, 25, 28, 32, 38, 40, 45, 48, 50, 50];

const FollowUpChart = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, value: '', label: '' });
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 300, H = 130, pad = { t: 10, r: 10, b: 20, l: 28 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (i / (todayPts.length - 1)) * iW;
  const y = (v: number) => pad.t + iH - (v / 100) * iH;
  const line = (pts: number[]) => pts.map((v, i) => `${i===0?'M':'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = (pts: number[]) => `${line(pts)} L${x(pts.length-1).toFixed(1)},${(pad.t+iH).toFixed(1)} L${pad.l},${(pad.t+iH).toFixed(1)} Z`;
  return (
    <div className="pd-chart-svg-wrap">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="pd-svg-responsive">
        <defs>
          <linearGradient id="todayG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#74b9ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#74b9ff" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="prevG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a29bfe" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a29bfe" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0,25,50,75,100].map(v => (
          <g key={v}>
            <line x1={pad.l} y1={y(v)} x2={pad.l+iW} y2={y(v)} stroke="#edf2f7" strokeWidth="1" />
            <text x={pad.l-4} y={y(v)+4} textAnchor="end" fontSize="8" fill="#a0aec0">{v}%</text>
          </g>
        ))}
        <path d={area(prevPts)} fill="url(#prevG)" />
        <path d={area(todayPts)} fill="url(#todayG)" />
        <path d={line(prevPts)} fill="none" stroke="#a29bfe" strokeWidth="2" strokeLinecap="round" />
        <path d={line(todayPts)} fill="none" stroke="#74b9ff" strokeWidth="2.5" strokeLinecap="round" />
        {todayPts.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r="4" fill="#74b9ff" stroke="#fff" strokeWidth="1.5" className="pd-dot-hover"
            onMouseEnter={(e) => {
              const rect = svgRef.current?.getBoundingClientRect();
              if (rect) setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top - 36, value: `${v}%`, label: `اليوم الحالي` });
            }}
            onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))} />
        ))}
      </svg>
      {tooltip.visible && (
        <div className="pd-tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
          <strong>{tooltip.label}</strong><br />{tooltip.value}
        </div>
      )}
      <div className="pd-followup-legend">
        <span><span className="pd-dot" style={{background:'#a29bfe'}}/>اليوم السابق <strong>50%</strong></span>
        <span><span className="pd-dot" style={{background:'#74b9ff'}}/>اليوم الحالي <strong>75%</strong></span>
      </div>
    </div>
  );
};

// ─── AI Progress Card ─────────────────────────────────────────────────────────
const AICard = () => {
  const [pct, setPct] = useState(0);
  const target = 50, r = 38, circ = 2 * Math.PI * r;
  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v += 2;
      if (v >= target) { setPct(target); clearInterval(t); }
      else setPct(v);
    }, 20);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="pd-ai-card">
      <svg viewBox="0 0 100 100" className="pd-ai-svg">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#edf2f7" strokeWidth="10" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="#dba841" strokeWidth="10"
          strokeDasharray={`${circ * pct / 100} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.05s' }} />
        <text x="50" y="46" textAnchor="middle" fontSize="11" fill="#718096">⚙️</text>
        <text x="50" y="62" textAnchor="middle" fontSize="15" fontWeight="800" fill="#2d3748">{pct}%</text>
      </svg>
      <p className="pd-ai-note">"تم استخدام المقترحات في 13 من أصل 20 محادثة"</p>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const PreacherDashboard: React.FC = () => {
  const stats = [
    { label: 'إجمالي عدد الطلبات', value: 100, trend: '+10.5%', up: true,
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dba841" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
    { label: 'عدد من أسلموا', value: 100, trend: '+10.5%', up: true,
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#51cf66" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
    { label: 'إجمالي قيد الاقناع', value: 100, trend: '+10.5%', up: true,
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#74b9ff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    { label: 'عدد من رفضوا', value: 100, trend: '-10.5%', up: false,
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> },
  ];

  return (
    <div className="pd-page" dir="rtl">
      <h1 className="pd-title">الداشبورد</h1>

      {/* Stat Cards */}
      <div className="pd-stats-grid">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Row 1: Area Chart + Map */}
      <div className="pd-row-charts">
        <div className="pd-chart-card pd-chart-flex">
          <div className="pd-card-header">
            <h2 className="pd-chart-title">سرعة الاستجابة الاولي</h2>
            <select className="pd-select"><option>الشهر</option><option>الأسبوع</option></select>
          </div>
          <ResponseChart />
        </div>
        <div className="pd-chart-card pd-chart-map">
          <h2 className="pd-chart-title">المحافظات</h2>
          <ProvinceSection />
        </div>
      </div>

      {/* Row 2: Follow-up + Donut + AI */}
      <div className="pd-row-bottom">
        <div className="pd-chart-card pd-bottom-card">
          <h2 className="pd-chart-title">نسبة المتابعة خلال آخر ٢٤ ساعة</h2>
          <FollowUpChart />
        </div>
        <div className="pd-chart-card pd-bottom-card">
          <h2 className="pd-chart-title">عدد الطلبات</h2>
          <DonutChart />
        </div>
        <div className="pd-chart-card pd-bottom-card">
          <h2 className="pd-chart-title">نسبة مقترحات الذكاء الاصطناعي</h2>
          <AICard />
        </div>
      </div>
    </div>
  );
};

export default PreacherDashboard;
