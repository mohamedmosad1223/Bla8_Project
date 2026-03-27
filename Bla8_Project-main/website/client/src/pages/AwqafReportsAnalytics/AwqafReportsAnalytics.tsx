import { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Users,
  UserCheck,
  TrendingUp,
  Loader2,
  AlertCircle
} from 'lucide-react';
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '../../components/StatCard/StatCard';
import { ministerService } from '../../services/ministerService';
import './AwqafReportsAnalytics.css';

interface OrgOption {
  org_id: number;
  organization_name: string;
}

interface ReportsAnalyticsResponse {
  top_cards: Array<{ title: string; value: number | string; icon: string; change?: string }>;
  charts: {
    converted_rejected_trend: Array<{ month: string; converts: number; rejects: number }>;
    acceptance_trend: Array<{ month: string; rate: number }>;
    org_performance_donut: Array<{ label: string; value: number }>;
  };
  geographic_distribution: Array<{ name: string; count: number; percentage: string }>;
  organization_performance_table: Array<{
    org_name: string;
    requests_count: number;
    converts_count: number;
    preachers_count: number;
    acceptance_level: string;
    last_update: string;
  }>;
}

const AwqafReportsAnalytics = () => {
  const [association, setAssociation] = useState('all');
  const [period, setPeriod] = useState<'all_time' | 'this_month' | 'last_month'>('all_time');
  const [appliedAssociation, setAppliedAssociation] = useState('all');
  const [appliedPeriod, setAppliedPeriod] = useState<'all_time' | 'this_month' | 'last_month'>('all_time');
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [data, setData] = useState<ReportsAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const orgId = appliedAssociation === 'all' ? undefined : Number(appliedAssociation);
        const result = await ministerService.getReportsAnalytics(orgId, appliedPeriod);
        setData(result);
      } catch (err) {
        console.error('Reports analytics fetch error:', err);
        setError('تعذر تحميل بيانات التقارير والتحليلات');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [appliedAssociation, appliedPeriod]);

  const reportStats = useMemo(() => {
    if (!data?.top_cards) return [];
    const iconMap: Record<string, JSX.Element> = {
      requests: <Users size={24} />,
      converts: <FileText size={24} />,
      active_preachers: <UserCheck size={24} />,
      acceptance: <TrendingUp size={24} />
    };
    const colorMap: Record<string, { bgColor: string; color: string; trend: 'up' | 'down' }> = {
      requests: { bgColor: '#EDE9FE', color: '#7C3AED', trend: 'up' },
      converts: { bgColor: '#D1FAE5', color: '#059669', trend: 'up' },
      active_preachers: { bgColor: '#DBEAFE', color: '#2563EB', trend: 'up' },
      acceptance: { bgColor: '#FEE2E2', color: '#DC2626', trend: 'down' }
    };

    return data.top_cards.map((card, idx) => ({
      id: idx + 1,
      title: card.title,
      value: String(card.value),
      icon: iconMap[card.icon] || <TrendingUp size={24} />,
      iconBgColor: colorMap[card.icon]?.bgColor || '#F3F4F6',
      iconColor: colorMap[card.icon]?.color || '#6B7280',
      trend: colorMap[card.icon]?.trend || 'up',
      trendValue: card.change || ''
    }));
  }, [data]);

  const conversionBarData = (data?.charts?.converted_rejected_trend || []).map((item) => ({
    name: item.month,
    conversions: item.converts,
    refusals: item.rejects
  }));

  const pieData = (data?.charts?.org_performance_donut || []).map((item, idx) => {
    const colors = ['#166088', '#059669', '#DBA841', '#3B82F6', '#8B5CF6', '#9CA3AF'];
    return { name: item.label, value: item.value, color: colors[idx % colors.length] };
  });
  const fallbackPieData = (data?.organization_performance_table || []).map((row, idx) => {
    const colors = ['#166088', '#059669', '#DBA841', '#3B82F6', '#8B5CF6', '#9CA3AF'];
    return { name: row.org_name, value: row.converts_count, color: colors[idx % colors.length] };
  });
  const fallbackPieByRequests = (data?.organization_performance_table || []).map((row, idx) => {
    const colors = ['#166088', '#059669', '#DBA841', '#3B82F6', '#8B5CF6', '#9CA3AF'];
    return { name: row.org_name, value: row.requests_count, color: colors[idx % colors.length] };
  });
  const hasPieValues = pieData.some((item) => item.value > 0);
  const hasFallbackConvertValues = fallbackPieData.some((item) => item.value > 0);
  const hasFallbackRequestValues = fallbackPieByRequests.some((item) => item.value > 0);
  const safePieData = hasPieValues
    ? pieData
    : hasFallbackConvertValues
      ? fallbackPieData
      : hasFallbackRequestValues
        ? fallbackPieByRequests
        : [];

  const lineData = (data?.charts?.acceptance_trend || []).map((item) => ({
    name: item.month,
    value1: item.rate
  }));

  const geoData = data?.geographic_distribution || [];
  const assocTable = data?.organization_performance_table || [];
  const totalConversions = conversionBarData.reduce((acc, curr) => acc + curr.conversions, 0);
  const totalRefusals = conversionBarData.reduce((acc, curr) => acc + curr.refusals, 0);

  if (loading && !data) {
    return (
      <div className="reports-analytics-page ra-state">
        <Loader2 size={38} className="spin-icon" />
        <p>جاري تحميل التقارير والتحليلات...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="reports-analytics-page ra-state ra-state-error">
        <AlertCircle size={38} />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="reports-analytics-page">
      {/* Header */}
      <div className="reports-top">
        <h1 className="page-title">التقارير و التحليلات</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select className="assoc-filter-select" value={association} onChange={(e) => setAssociation(e.target.value)}>
            <option value="all">كل الجمعيات</option>
            <option value="0">الدعاة المتعاونين</option>
            {organizations.map((org) => (
              <option key={org.org_id} value={String(org.org_id)}>{org.organization_name}</option>
            ))}
          </select>
          <select className="assoc-filter-select" value={period} onChange={(e) => setPeriod(e.target.value as 'all_time' | 'this_month' | 'last_month')}>
            <option value="all_time">كل الوقت</option>
            <option value="this_month">هذا الشهر</option>
            <option value="last_month">الشهر السابق</option>
          </select>
          <button className="apply-filter-btn" onClick={() => { setAppliedAssociation(association); setAppliedPeriod(period); }}>تطبيق</button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="ra-stats-grid">
        {reportStats.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBgColor={stat.bgColor}
            iconColor={stat.color}
            trend={stat.trend}
            trendValue={stat.trendValue}
          />
        ))}
      </div>

      {/* 3 Charts */}
      <div className="ra-charts-grid">
        {/* Bar Chart: من اسلموا / رفضوا */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>من اسلموا / رفضوا</h3>
          </div>
          <div className="chart-content" style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={conversionBarData} margin={{ top: 10, right: 0, left: 0, bottom: 5 }} barSize={12}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Cairo' }} dy={10} />
                <YAxis hide />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Cairo' }} />
                <Bar dataKey="conversions" fill="#166088" radius={[4, 4, 0, 0]} name="من اسلم" />
                <Bar dataKey="refusals" fill="#DBA841" radius={[4, 4, 0, 0]} name="رفضوا" />
              </BarChart>
            </ResponsiveContainer>
            <div className="chart-legend-row">
              <span className="legend-dot" style={{ background: '#166088' }}></span><span>من اسلم</span>
              <span className="legend-value">{totalConversions}</span>
              <span className="legend-dot" style={{ background: '#DBA841' }}></span><span>رفضوا</span>
              <span className="legend-value">{totalRefusals}</span>
            </div>
          </div>
        </div>

        {/* Donut: نسب الأداء حسب الجمعيات */}
        <div className="chart-card">
          <h3 style={{ textAlign: 'center' }}>نسب الأداء حسب الجمعيات</h3>
          <div className="chart-content" style={{ minHeight: '280px' }}>
            {safePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={safePieData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value" paddingAngle={2}>
                    {safePieData.map((entry, idx) => (
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
            ) : (
              <div style={{ width: '100%', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                لا يوجد بيانات حالياً
              </div>
            )}
          </div>
        </div>

        {/* Line Chart: نسبة القبول الشهرية */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>نسبة القبول الشهرية</h3>
            <select className="chart-select">
              <option>الشهر</option>
            </select>
          </div>
          <div className="chart-content" style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Cairo' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} domain={[0, 100]} orientation="right" label={{ value: 'نسبة القبول (%)', angle: -90, position: 'insideRight', fill: '#6B7280', fontSize: 11, fontFamily: 'Cairo' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontFamily: 'Cairo' }} />
                <Line type="linear" dataKey="value1" stroke="#9f1239" strokeWidth={2} dot={{ r: 4, fill: '#9f1239', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Geographic Distribution */}
      <div className="ra-section">
        <h3 className="ra-section-title">التوزيع الجغرافي للأنشطة</h3>
        <div className="geo-container">
          {geoData.map((geo, idx) => (
            <div key={idx} className="geo-row">
              <span className="geo-rate-label">{geo.percentage}</span>
              <div className="geo-progress-bar-bg">
                <div className="geo-progress-bar-fill" style={{ width: geo.percentage, backgroundColor: '#10B981' }} />
              </div>
              <span className="geo-name">{geo.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Association Performance Table */}
      <div className="ra-section">
        <h3 className="ra-section-title">تفاصيل الأداء حسب الجمعيات</h3>
        <div className="ra-table-container">
          <table className="ra-table">
            <thead>
              <tr>
                <th>اسم الجمعية</th>
                <th>عدد الطلبات</th>
                <th>عدد المسلمين الجدد</th>
                <th>عدد الدعاة</th>
                <th>نسبة القبول</th>
                <th>آخر تحديث</th>
              </tr>
            </thead>
            <tbody>
              {assocTable.map((row, idx) => (
                <tr key={idx}>
                  <td className="assoc-name-cell">{row.org_name}</td>
                  <td>{row.requests_count}</td>
                  <td>{row.converts_count}</td>
                  <td>{row.preachers_count}</td>
                  <td><span className="rate-badge">{row.acceptance_level}</span></td>
                  <td className="updated-cell">{row.last_update}</td>
                </tr>
              ))}
              {assocTable.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#9CA3AF' }}>لا يوجد بيانات حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AwqafReportsAnalytics;
