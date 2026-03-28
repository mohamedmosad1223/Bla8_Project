import { useEffect, useMemo, useState } from 'react';
import {
  Users,
  Heart,
  TrendingUp,
  Activity,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  AreaChart, Area, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ministerService } from '../../services/ministerService';
import './AwqafPreacherPerformance.css';

interface OrgOption {
  org_id: number;
  organization_name: string;
}

interface GlobalDashboardResponse {
  top_cards: Array<{ title: string; value: number | string; icon: string }>;
  charts: {
    status_distribution: Array<{ label: string; value: number }>;
    acceptance_rate_trend: Array<{ period: string; rate: number }>;
    preacher_comparison: Array<{ name: string; value: number }>;
  };
  top_preachers: Array<{
    rank: number;
    name: string;
    organization: string;
    activities_count: number;
    converts_count: number;
    performance_pct: string;
    status_label: string;
    account_status?: string;
  }>;
}

const toArabicAccountStatus = (value: string) => {
  const key = (value || '').toLowerCase();
  if (key === 'active' || key === 'enabled') return 'مفعل';
  if (key === 'inactive' || key === 'disabled' || key === 'suspended') return 'غير مفعل';
  return value || 'غير محدد';
};

const getStatusClass = (status: string) => {
  if (status === 'مفعل') return 'status-badge active';
  if (status === 'غير مفعل') return 'status-badge inactive';
  if (status === 'نشط') return 'status-badge active';
  if (status === 'متوسط') return 'status-badge medium';
  return 'status-badge inactive';
};

const AwqafPreacherPerformance = () => {
  const [association, setAssociation] = useState('all');
  const [period, setPeriod] = useState<'all_time' | 'this_month' | 'last_month'>('all_time');
  const [appliedAssociation, setAppliedAssociation] = useState('all');
  const [appliedPeriod, setAppliedPeriod] = useState<'all_time' | 'this_month' | 'last_month'>('all_time');
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [data, setData] = useState<GlobalDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<'day' | 'month'>('month');

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const result = await ministerService.getOrganizations();
        const options = (Array.isArray(result) ? result : []).map((org: any) => ({
          org_id: org.org_id,
          organization_name: org.organization_name
        }));
        setOrganizations(options);
      } catch (err) {
        console.error('Organizations fetch error:', err);
      }
    };
    fetchOrganizations();
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const orgId = appliedAssociation === 'all' ? undefined : Number(appliedAssociation);
        const result = await ministerService.getGlobalDashboardStats(orgId, appliedPeriod, granularity);
        setData(result);
      } catch (err) {
        console.error('Global dashboard fetch error:', err);
        setError('تعذر تحميل بيانات أداء الدعاة');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [appliedAssociation, appliedPeriod, granularity]);

  const performanceStats = useMemo(() => {
    if (!data?.top_cards) return [];
    const iconMap: Record<string, JSX.Element> = {
      preachers: <Users size={24} />,
      activities: <Activity size={24} />,
      converts: <Heart size={24} />,
      performance: <TrendingUp size={24} />
    };
    const colorMap: Record<string, { bgColor: string; color: string }> = {
      preachers: { bgColor: '#FEF3C7', color: '#D97706' },
      activities: { bgColor: '#D1FAE5', color: '#059669' },
      converts: { bgColor: '#DBEAFE', color: '#2563EB' },
      performance: { bgColor: '#FEE2E2', color: '#DC2626' }
    };
    return data.top_cards.map((item, idx) => ({
      id: idx + 1,
      title: item.title,
      value: String(item.value),
      icon: iconMap[item.icon] || <TrendingUp size={24} />,
      bgColor: colorMap[item.icon]?.bgColor || '#F3F4F6',
      color: colorMap[item.icon]?.color || '#6B7280'
    }));
  }, [data]);

  const barData = data?.charts?.preacher_comparison || [];
  const acceptanceData = (data?.charts?.acceptance_rate_trend || []).map((item) => ({ 
    name: item.period, 
    value: item.rate 
  }));
  const pieData = (data?.charts?.status_distribution || []).map((item) => {
    const statusConfig: Record<string, { name: string; color: string }> = {
      converted: { name: 'أسلم', color: '#10B981' },
      rejected: { name: 'رفض', color: '#EF4444' },
      under_persuasion: { name: 'قيد الإقناع', color: '#2563EB' },
      in_progress: { name: 'قيد المتابعة', color: '#EAB308' },
      pending: { name: 'قيد الانتظار', color: '#9CA3AF' },
      cancelled: { name: 'تم الإلغاء', color: '#6B7280' }
    };
    const config = statusConfig[item.label] || { name: item.label, color: '#6B7280' };
    return { name: config.name, value: item.value, color: config.color };
  });
  const topPreachers = data?.top_preachers || [];

  if (loading && !data) {
    return (
      <div className="perf-page perf-state">
        <Loader2 size={38} className="spin-icon" />
        <p>جاري تحميل بيانات الأداء...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="perf-page perf-state perf-state-error">
        <AlertCircle size={38} />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="perf-page">
      <h1 className="page-title">الداشبورد</h1>

      <div className="perf-filters">
        <div className="filter-group">
          <label>اختيار الجمعية</label>
          <select value={association} onChange={(e) => setAssociation(e.target.value)}>
            <option value="all">جميع الجمعيات</option>
            <option value="0">الدعاة المتعاونين</option>
            {organizations.map((org) => (
              <option key={org.org_id} value={String(org.org_id)}>{org.organization_name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>الفترة الزمنية</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value as 'all_time' | 'this_month' | 'last_month')}>
            <option value="all_time">كل الوقت</option>
            <option value="this_month">هذا الشهر</option>
            <option value="last_month">الشهر السابق</option>
          </select>
        </div>
        <button
          className="apply-btn"
          onClick={() => {
            setAppliedAssociation(association);
            setAppliedPeriod(period);
          }}
        >
          تطبيق
        </button>
      </div>

      <div className="perf-stats-grid">
        {performanceStats.map((stat) => (
          <div key={stat.id} className="perf-stat-card">
            <div className="perf-stat-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="perf-stat-info">
              <span className="perf-stat-title">{stat.title}</span>
              <span className="perf-stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="perf-charts-grid">
        <div className="chart-card">
          <h3>مقارنة أداء الدعاة</h3>
          <div className="chart-content" style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 10, right: 0, left: 0, bottom: 5 }} barSize={40}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Cairo' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} orientation="right" />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Cairo' }} />
                <Bar dataKey="value" fill="#DBA841" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header-row">
            <h3>نسبة قبول الطلبات</h3>
            <div className="granularity-toggle">
              <button 
                className={granularity === 'day' ? 'active' : ''} 
                onClick={() => setGranularity('day')}
              >
                يومي
              </button>
              <button 
                className={granularity === 'month' ? 'active' : ''} 
                onClick={() => setGranularity('month')}
              >
                شهري
              </button>
            </div>
          </div>
          <div className="chart-content" style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={acceptanceData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DBA841" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#DBA841" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Cairo' }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6B7280', fontSize: 12 }} 
                  domain={[0, 100]} 
                  orientation="right" 
                  label={{ value: 'نسبة القبول (%)', angle: -90, position: 'insideRight', fill: '#6B7280', fontSize: 11, fontFamily: 'Cairo', offset: 10 }} 
                />
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'نسبة القبول']}
                  labelStyle={{ fontFamily: 'Cairo', textAlign: 'right' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Cairo' }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#DBA841" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>حالة الطلبات</h3>
          <div className="chart-content" style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                  {pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  align="right"
                  verticalAlign="middle"
                  layout="vertical"
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => <span style={{ color: '#374151', fontSize: '13px', fontFamily: 'Cairo' }}>{value}</span>}
                />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontFamily: 'Cairo' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="perf-table-section">
        <h3>افضل 6 دعاه</h3>
        <div className="perf-table-container">
          <table className="perf-table">
            <thead>
              <tr>
                <th>رقم</th>
                <th>اسم الداعية</th>
                <th>الجمعية</th>
                <th>عدد الانشطة</th>
                <th>عدد المهتدين</th>
                <th>نسبة الأداء</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {topPreachers.map((p) => (
                <tr key={p.rank}>
                  <td>{p.rank}</td>
                  <td>{p.name}</td>
                  <td>{p.organization}</td>
                  <td>{p.activities_count}</td>
                  <td>{p.converts_count}</td>
                  <td>{p.performance_pct}</td>
                  <td>
                    <span className={getStatusClass(toArabicAccountStatus(p.account_status || ''))}>
                      {toArabicAccountStatus(p.account_status || '')}
                    </span>
                  </td>
                </tr>
              ))}
              {topPreachers.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: '#9CA3AF' }}>لا يوجد بيانات حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AwqafPreacherPerformance;
