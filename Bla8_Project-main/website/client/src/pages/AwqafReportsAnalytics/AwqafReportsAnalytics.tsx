import { useState } from 'react';
import {
  FileText,
  Users,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import StatCard from '../../components/StatCard/StatCard';
import './AwqafReportsAnalytics.css';

/* ── mock data ── */
const reportStats = [
  { id: 1, title: 'اجمالي الطلبات',       value: '1,247', icon: <Users size={24} />,       bgColor: '#EDE9FE', color: '#7C3AED', trend: 'up'   as const, trendValue: '+10.5%' },
  { id: 2, title: 'اجمالي المسلمين الجدد', value: '342',   icon: <FileText size={24} />,    bgColor: '#D1FAE5', color: '#059669', trend: 'up'   as const, trendValue: '+10.5%' },
  { id: 3, title: 'عدد الدعاة النشطين',    value: '89',    icon: <UserCheck size={24} />,   bgColor: '#DBEAFE', color: '#2563EB', trend: 'up'   as const, trendValue: '+10.5%' },
  { id: 4, title: 'نسبة القبول العامة',    value: '27.4%', icon: <TrendingUp size={24} />,  bgColor: '#FEE2E2', color: '#DC2626', trend: 'down' as const, trendValue: '+10.5%' },
];

const conversionBarData = [
  { name: 'يناير', conversions: 4000, refusals: 2400 },
  { name: 'فبراير', conversions: 3000, refusals: 1398 },
  { name: 'مارس', conversions: 2000, refusals: 9800 },
  { name: 'ابريل', conversions: 2780, refusals: 3908 },
  { name: 'مايو', conversions: 1890, refusals: 4800 },
  { name: 'يونيو', conversions: 2390, refusals: 3800 },
  { name: 'يوليو', conversions: 3490, refusals: 4300 },
];

const pieData = [
  { name: 'جمعية الهداية', value: 35, color: '#166088' },
  { name: 'جمعية النور',   value: 28, color: '#059669' },
  { name: 'جمعية الرسالة', value: 22, color: '#DBA841' },
  { name: 'جمعية الإيمان', value: 15, color: '#3B82F6' },
];

const lineData = [
  { name: 'يناير', value1: 58, value2: 72, value3: 65 },
  { name: 'فبراير', value1: 66, value2: 65, value3: 60 },
  { name: 'مارس', value1: 61, value2: 80, value3: 70 },
  { name: 'ابريل', value1: 70, value2: 68, value3: 75 },
  { name: 'مايو', value1: 79, value2: 74, value3: 68 },
  { name: 'يونيو', value1: 65, value2: 82, value3: 78 },
  { name: 'يوليو', value1: 72, value2: 78, value3: 72 },
];

const geoData = [
  { name: 'محافظة الحديقة',   rate: 85, color: '#10B981' },
  { name: 'محافظة الحمراء',   rate: 72, color: '#3B82F6' },
  { name: 'محافظة العاصمة',   rate: 91, color: '#F59E0B' },
  { name: 'محافظة أب الكبير',  rate: 64, color: '#8B5CF6' },
  { name: 'محافظة النورانية',  rate: 78, color: '#EF4444' },
];

const assocTable = [
  { name: 'جمعية الهداية', requests: 320, newMuslims: 120, preachers: 15, rate: 'ممتاز', updated: 'قبل يومين' },
  { name: 'جمعية النور',   requests: 270, newMuslims: 90,  preachers: 12, rate: 'ممتاز', updated: 'قبل اسبوع' },
  { name: 'جمعية الرسالة', requests: 198, newMuslims: 67,  preachers: 9,  rate: 'ممتاز', updated: 'قبل يومين' },
  { name: 'جمعية الإيمان', requests: 165, newMuslims: 42,  preachers: 8,  rate: 'ممتاز', updated: 'قبل يوم' },
  { name: 'جمعية المودة',  requests: 142, newMuslims: 38,  preachers: 6,  rate: 'ممتاز', updated: 'قبل ثلاث اسابيع' },
];

const AwqafReportsAnalytics = () => {
  const [filter, setFilter] = useState('all');

  return (
    <div className="reports-analytics-page">
      {/* Header */}
      <div className="reports-top">
        <h1 className="page-title">التقارير و التحليلات</h1>
        <select className="assoc-filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">كل الجمعيات</option>
          <option value="1">جمعية الهداية</option>
          <option value="2">جمعية النور</option>
          <option value="3">جمعية الرسالة</option>
        </select>
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
            <select className="chart-select">
              <option>الشهر</option>
            </select>
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
              <span className="legend-value">1000</span>
              <span className="legend-dot" style={{ background: '#DBA841' }}></span><span>رفضوا</span>
              <span className="legend-value">1000</span>
            </div>
          </div>
        </div>

        {/* Donut: نسب الأداء حسب الجمعيات */}
        <div className="chart-card">
          <h3 style={{ textAlign: 'center' }}>نسب الأداء حسب الجمعيات</h3>
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
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} domain={[40, 100]} orientation="right" label={{ value: 'نسبة القبول (%)', angle: -90, position: 'insideRight', fill: '#6B7280', fontSize: 11, fontFamily: 'Cairo' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', fontFamily: 'Cairo' }} />
                <Line type="linear" dataKey="value1" stroke="#9f1239" strokeWidth={2} dot={{ r: 4, fill: '#9f1239', strokeWidth: 0 }} />
                <Line type="linear" dataKey="value2" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
                <Line type="linear" dataKey="value3" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4, fill: '#8B5CF6', strokeWidth: 0 }} />
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
              <span className="geo-rate-label">{geo.rate}%</span>
              <div className="geo-progress-bar-bg">
                <div className="geo-progress-bar-fill" style={{ width: `${geo.rate}%`, backgroundColor: geo.color }} />
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
                  <td className="assoc-name-cell">{row.name}</td>
                  <td>{row.requests}</td>
                  <td>{row.newMuslims}</td>
                  <td>{row.preachers}</td>
                  <td><span className="rate-badge">{row.rate}</span></td>
                  <td className="updated-cell">{row.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AwqafReportsAnalytics;
