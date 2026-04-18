import React, { useState, useRef, useEffect } from 'react';
import './PreacherDashboard.css';
import { preacherService, PreacherDashboardData, ChartDataPoint } from '../../services/preacherService';
import RejectedPreacherView from './RejectedPreacherView';

// ─── Types ────────────────────────────────────────────────────────────────────
interface TooltipState { visible: boolean; x: number; y: number; value: string; label: string; }

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, trend, icon, up }: {
  label: string; value: number; trend: string; icon: React.ReactNode; up: boolean;
}) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 40) || 1;
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

// ─── Area Chart (Response Speed) ─────────────────────────────────────────────
const ResponseChart = ({ data }: { data: ChartDataPoint[] }) => {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, value: '', label: '' });
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) {
    return <div className="pd-chart-svg-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, color: '#a0aec0' }}>لا توجد بيانات بعد</div>;
  }

  const W = 500, H = 180;
  const pad = { t: 16, r: 16, b: 36, l: 52 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const values = data.map(d => d.value);
  const YMAX = Math.max(...values, 1);
  const xp = (i: number) => pad.l + (i / Math.max(data.length - 1, 1)) * iW;
  const yp = (v: number) => pad.t + iH - (v / YMAX) * iH;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xp(i).toFixed(1)},${yp(d.value).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${xp(data.length - 1).toFixed(1)},${(pad.t + iH).toFixed(1)} L${pad.l},${(pad.t + iH).toFixed(1)} Z`;
  const peakIdx = values.indexOf(Math.max(...values));

  return (
    <div className="pd-chart-svg-wrap">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="pd-svg-responsive">
        <defs>
          <linearGradient id="respGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dba841" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#dba841" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, YMAX * 0.25, YMAX * 0.5, YMAX * 0.75, YMAX].map((v, idx) => (
          <g key={idx}>
            <line x1={pad.l} y1={yp(v)} x2={pad.l + iW} y2={yp(v)} stroke="#edf2f7" strokeWidth="1" />
            <text x={pad.l - 8} y={yp(v) + 4} textAnchor="end" fontSize="10" fill="#a0aec0">{Math.round(v)}</text>
          </g>
        ))}
        <path d={areaPath} fill="url(#respGrad)" />
        <path d={linePath} fill="none" stroke="#dba841" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => (
          <circle
            key={i} cx={xp(i)} cy={yp(d.value)} r="5"
            fill={i === peakIdx ? '#dba841' : '#fff'}
            stroke="#dba841" strokeWidth="2" className="pd-dot-hover"
            onMouseEnter={(e) => {
              const rect = svgRef.current?.getBoundingClientRect();
              if (rect) setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top - 36, value: `${d.value} دقيقة`, label: d.label });
            }}
            onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))}
          />
        ))}
        {data.length > 0 && (
          <>
            <rect x={xp(peakIdx) - 30} y={yp(values[peakIdx]) - 20} width="60" height="22" rx="6" fill="#2d3748" />
            <text x={xp(peakIdx)} y={yp(values[peakIdx]) - 5} textAnchor="middle" fontSize="11" fill="white" fontWeight="bold">
              {values[peakIdx]} دقيقة
            </text>
          </>
        )}
        {data.map((d, i) => (
          <text key={i} x={xp(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#a0aec0">{d.label}</text>
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

// ─── Province / Governorates Bar List ────────────────────────────────────────
const COLORS = ['#f4a8c0', '#85d1e0', '#e8c96a', '#b8d98d', '#f4a261', '#a29bfe', '#74b9ff', '#fd79a8'];

const GovernoratesSection = ({ data }: { data: ChartDataPoint[] }) => {
  const maxVal = data && data.length > 0 ? Math.max(...data.map(d => d.value), 1) : 1;
  return (
    <div className="pd-province-wrap">
      {/* خريطة محافظات الكويت — تظهر دائماً */}
      <img src="/image 1.png" alt="خريطة محافظات الكويت" className="pd-map-svg" />

      {/* قائمة المحافظات أو رسالة فارغة */}
      {(!data || data.length === 0) ? (
        <div style={{ textAlign: 'center', color: '#a0aec0', padding: '1rem', fontSize: '0.9rem' }}>
          لا توجد بيانات داخل تلك المحافظات الآن
        </div>
      ) : (
        <div className="pd-prov-bars">
          {data.map((d, i) => (
            <div key={i} className="pd-prov-row">
              <span className="pd-prov-dot" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="pd-prov-name">{d.label}</span>
              <div className="pd-prov-track">
                <div className="pd-prov-fill" style={{ width: `${(d.value / maxVal) * 100}%`, background: COLORS[i % COLORS.length] }} />
              </div>
              <span className="pd-prov-val">{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Donut Chart (Requests by Status) ────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  converted:         { label: 'تم إسلامه',    color: '#10B981' },
  rejected:          { label: 'مرفوض',        color: '#EF4444' },
  under_persuasion:  { label: 'قيد الإقناع',  color: '#F59E0B' },
  in_progress:       { label: 'قيد الإقناع',  color: '#F59E0B' },
  pending:           { label: 'قيد الإقناع',  color: '#F59E0B' },
  assigned:          { label: 'قيد الإقناع',  color: '#F59E0B' },
  cancelled:         { label: 'ملغي',          color: '#9CA3AF' },
  closed:            { label: 'مغلق',          color: '#9CA3AF' },
};

const DonutChart = ({ data }: { data: ChartDataPoint[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);
  
  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', color: '#a0aec0', padding: '2rem' }}>لا توجد بيانات بعد</div>;
  }

  // Aggregate data based on standard config
  const aggregated = data.reduce((acc: Record<string, { label: string; value: number; color: string }>, cur) => {
    const config = STATUS_CONFIG[cur.label] || { label: cur.label, color: '#CBD5E1' };
    const key = config.label;
    if (!acc[key]) {
      acc[key] = { label: key, value: 0, color: config.color };
    }
    acc[key].value += Number(cur.value) || 0;
    return acc;
  }, {});

  const mergedData = Object.values(aggregated).filter(item => item.value > 0);
  const total = mergedData.reduce((s, x) => s + x.value, 0);

  const r = 58, cx = 80, cy = 80, sw = 22;
  const circ = 2 * Math.PI * r;
  let offset = circ * 0.25;

  return (
    <div className="pd-donut-wrap">
      <svg viewBox="0 0 160 160" className="pd-donut-svg">
        {mergedData.map((s, i) => {
          const len = (s.value / (total || 1)) * circ;
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
          {hovered !== null ? mergedData[hovered].value : total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="11" fill="#718096">
          {hovered !== null ? mergedData[hovered].label : 'طلب'}
        </text>
      </svg>
      <div className="pd-donut-legend">
        {mergedData.map((s, i) => (
          <div key={i} className={`pd-legend-row ${hovered === i ? 'hovered' : ''}`}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
            <span className="pd-dot" style={{ background: s.color }} />
            <span className="pd-legend-text">{s.label}</span>
            <strong>{s.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Activity Line Chart (messages over last 30 days) ─────────────────────────
const ActivityChart = ({ data }: { data: ChartDataPoint[] }) => {
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, x: 0, y: 0, value: '', label: '' });
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) {
    return <div className="pd-chart-svg-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 130, color: '#a0aec0' }}>لا توجد بيانات بعد</div>;
  }

  const W = 300, H = 130, pad = { t: 10, r: 10, b: 20, l: 28 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const values = data.map(d => d.value);
  const YMAX = Math.max(...values, 1);
  const x = (i: number) => pad.l + (i / Math.max(data.length - 1, 1)) * iW;
  const y = (v: number) => pad.t + iH - (v / YMAX) * iH;
  const line = (pts: number[]) => pts.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = (pts: number[]) => `${line(pts)} L${x(pts.length - 1).toFixed(1)},${(pad.t + iH).toFixed(1)} L${pad.l},${(pad.t + iH).toFixed(1)} Z`;

  return (
    <div className="pd-chart-svg-wrap">
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="pd-svg-responsive">
        <defs>
          <linearGradient id="actG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#74b9ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#74b9ff" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, YMAX * 0.5, YMAX].map((v, idx) => (
          <g key={idx}>
            <line x1={pad.l} y1={y(v)} x2={pad.l + iW} y2={y(v)} stroke="#edf2f7" strokeWidth="1" />
            <text x={pad.l - 4} y={y(v) + 4} textAnchor="end" fontSize="8" fill="#a0aec0">{Math.round(v)}</text>
          </g>
        ))}
        <path d={area(values)} fill="url(#actG)" />
        <path d={line(values)} fill="none" stroke="#74b9ff" strokeWidth="2.5" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.value)} r="4" fill="#74b9ff" stroke="#fff" strokeWidth="1.5" className="pd-dot-hover"
            onMouseEnter={(e) => {
              const rect = svgRef.current?.getBoundingClientRect();
              if (rect) setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top - 36, value: `${d.value} رسالة`, label: d.label });
            }}
            onMouseLeave={() => setTooltip(t => ({ ...t, visible: false }))} />
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

// ─── Follow-up Rate Card ───────────────────────────────────────────────────────
const FollowUpCard = ({ rate }: { rate: number }) => {
  const [pct, setPct] = useState(0);
  const target = Math.round(rate);
  useEffect(() => {
    let v = 0;
    const t = setInterval(() => {
      v += 2;
      if (v >= target) { setPct(target); clearInterval(t); }
      else setPct(v);
    }, 20);
    return () => clearInterval(t);
  }, [target]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.5rem' }}>
      <span style={{ fontSize: '3rem', fontWeight: 800, color: '#74b9ff' }}>{pct}%</span>
      <span style={{ fontSize: '0.85rem', color: '#718096' }}>من الطلبات تمت متابعتها خلال 24 ساعة</span>
    </div>
  );
};

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <div className="pd-page" dir="rtl">
    <h1 className="pd-title">الداشبورد</h1>
    <div className="pd-stats-grid">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="pd-stat-card" style={{ background: '#f7fafc', animation: 'pulse 1.5s infinite' }}>
          <div style={{ height: 80 }} />
        </div>
      ))}
    </div>
    <div style={{ textAlign: 'center', padding: '4rem', color: '#a0aec0' }}>جارٍ تحميل البيانات...</div>
  </div>
);

const PreacherDashboard: React.FC = () => {
  const [data, setData] = useState<PreacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [preacherProfile, setPreacherProfile] = useState<any>(null);
  const [interval, setIntervalVal] = useState<'month' | 'day'>('month');

  const fetchDashboardData = async (selectedInterval: 'month' | 'day') => {
    try {
      setLoading(true);
      // Always fetch fresh profile from server to get latest approval_status
      const profileRes = await import('../../services/authService').then(m => m.authService.getMe());
      const approvalStatus = profileRes?.extra_data?.approval_status;

      if (approvalStatus === 'pending') {
        setIsPending(true);
        setLoading(false);
        return;
      }
      
      if (approvalStatus === 'rejected') {
        setIsRejected(true);
        const preacherId = profileRes?.extra_data?.preacher_id || JSON.parse(localStorage.getItem('userData') || '{}')?.extra_data?.preacher_id;
        if (preacherId) {
            const fullProfile = await preacherService.getById(preacherId);
            setPreacherProfile(fullProfile.data?.data || fullProfile.data || fullProfile);
        }
        setLoading(false);
        return;
      }

      // Approved: load dashboard
      const dashData = await preacherService.getDashboard(selectedInterval);
      setData(dashData);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('تعذّر تحميل بيانات الداشبورد. تأكد من تشغيل الخادم وصحة تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(interval);
  }, [interval]);

  if (loading) return <LoadingSkeleton />;

  if (isRejected && preacherProfile) {
    return <RejectedPreacherView profile={preacherProfile} />;
  }
  if (isPending) {
    return (
      <div className="pd-page" dir="rtl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#dba841', background: '#fdf7e3', padding: '3rem', borderRadius: '12px', border: '1px solid #f9ebd1', maxWidth: '500px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700 }}>حساب قيد المراجعة</h2>
          <p style={{ color: '#6b572a', lineHeight: 1.6, marginBottom: '2rem' }}>
            طلب تسجيلك كداعية الآن قيد المراجعة من قبل الإدارة. سيتم إشعارك بمجرد قبول الطلب لتتمكن من الوصول للوحة التحكم والبدء في استلام طلبات المهتمين. يمكنك مراجعة بياناتك من قسم "الملف الشخصي".
          </p>
          <button 
            onClick={() => import('../../services/authService').then(m => m.authService.logout()).then(() => window.location.href = '/')}
            style={{ background: '#dba841', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            تسجيل الخروج
          </button>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pd-page" dir="rtl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#ff6b6b', background: '#fff5f5', padding: '2rem', borderRadius: '12px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          <p>{error ?? 'بيانات غير متاحة'}</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: data.total_requests.title,
      value: data.total_requests.value,
      trend: `${data.total_requests.is_positive ? '+' : ''}${data.total_requests.change_percentage ?? 0}%`,
      up: data.total_requests.is_positive,
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#dba841" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>,
    },
    {
      label: data.converted_count.title,
      value: data.converted_count.value,
      trend: `${data.converted_count.is_positive ? '+' : ''}${data.converted_count.change_percentage ?? 0}%`,
      up: data.converted_count.is_positive,
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#51cf66" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    },
    {
      label: data.in_progress_count.title,
      value: data.in_progress_count.value,
      trend: `${data.in_progress_count.is_positive ? '+' : ''}${data.in_progress_count.change_percentage ?? 0}%`,
      up: data.in_progress_count.is_positive,
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#74b9ff" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    },
    {
      label: data.rejected_count.title,
      value: data.rejected_count.value,
      trend: `${data.rejected_count.is_positive ? '+' : ''}${data.rejected_count.change_percentage ?? 0}%`,
      up: data.rejected_count.is_positive,
      icon: <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
    },
  ];

  return (
    <div className="pd-page" dir="rtl">
      <h1 className="pd-title">الداشبورد</h1>

      {/* Stat Cards */}
      <div className="pd-stats-grid">
        {stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Row 1: Response Speed Chart + Governorates */}
      <div className="pd-row-charts">
        <div className="pd-chart-card pd-chart-flex">
          <div className="pd-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="pd-chart-title" style={{ margin: 0 }}>سرعة الاستجابة الأولى (دقائق)</h2>
            <div className="pd-interval-toggle">
              <button
                className={`pd-toggle-btn ${interval === 'month' ? 'active' : ''}`}
                onClick={() => setIntervalVal('month')}
              >
                شهري
              </button>
              <button
                className={`pd-toggle-btn ${interval === 'day' ? 'active' : ''}`}
                onClick={() => setIntervalVal('day')}
              >
                يومي
              </button>
            </div>
          </div>
          <ResponseChart data={data.response_speed_chart} />
        </div>
        <div className="pd-chart-card pd-chart-map">
          <h2 className="pd-chart-title">توزيع المحافظات</h2>
          <GovernoratesSection data={data.governorates_distribution} />
        </div>
      </div>

      {/* Row 2: Activity Chart + Donut + Follow-up */}
      <div className="pd-row-bottom">
        <div className="pd-chart-card pd-bottom-card">
          <h2 className="pd-chart-title">نشاط الرسائل اخر الايام</h2>
          <ActivityChart data={data.activity_chart} />
        </div>
        <div className="pd-chart-card pd-bottom-card">
          <h2 className="pd-chart-title">عدد الطلبات حسب الحالة</h2>
          <DonutChart data={data.requests_by_status} />
        </div>
        <div className="pd-chart-card pd-bottom-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 className="pd-chart-title">نسبة المتابعة خلال 24 ساعة</h2>
          <FollowUpCard rate={data.follow_up_24h_rate} />
        </div>
      </div>
    </div>
  );
};

export default PreacherDashboard;
