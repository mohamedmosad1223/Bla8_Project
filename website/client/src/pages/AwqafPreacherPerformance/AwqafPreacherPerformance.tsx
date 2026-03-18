import { useState } from 'react';
import {
  Users,
  Heart,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import './AwqafPreacherPerformance.css';

/* ── mock data ── */
const performanceStats = [
  { id: 1, title: 'عدد الدعاة',            value: '142',  icon: <Users size={24} />,       bgColor: '#FEF3C7', color: '#D97706' },
  { id: 2, title: 'عدد الانشطة المنجزة',    value: '856',  icon: <Activity size={24} />,    bgColor: '#D1FAE5', color: '#059669' },
  { id: 3, title: 'عدد المهتدين الجدد',     value: '324',  icon: <Heart size={24} />,       bgColor: '#DBEAFE', color: '#2563EB' },
  { id: 4, title: 'نسبة الأداء العام',      value: '%87',  icon: <TrendingUp size={24} />,  bgColor: '#FEE2E2', color: '#DC2626' },
];

const barData = [
  { name: 'محمد العتيبي',     value: 45 },
  { name: 'خالد الاحمد',      value: 38 },
  { name: 'عبدالرحمن المطيري', value: 32 },
  { name: 'سعد القحطاني',     value: 28 },
  { name: 'فهد الشمري',       value: 22 },
];

const lineData = [
  { name: 'يناير',  value1: 58, value2: 72 },
  { name: 'فبراير', value1: 66, value2: 65 },
  { name: 'مارس',   value1: 61, value2: 80 },
  { name: 'ابريل',  value1: 70, value2: 68 },
  { name: 'مايو',   value1: 79, value2: 74 },
  { name: 'يونيو',  value1: 65, value2: 82 },
  { name: 'يوليو',  value1: 72, value2: 78 },
];

const pieData = [
  { name: 'محاضرات', value: 35, color: '#DBA841' },
  { name: 'ورش عمل', value: 25, color: '#166088' },
  { name: 'ندوات',   value: 15, color: '#CA8A04' },
  { name: 'لقاءات',  value: 15, color: '#E5E7EB' },
  { name: 'أخرى',    value: 10, color: '#9CA3AF' },
];

const topPreachers = [
  { id: 1, name: 'أحمد محمد السالم',       assoc: 'جمعية البر والتقوى', activities: 45, converts: 12, rate: '%92',  status: 'نشط' },
  { id: 2, name: 'محمد عبدالله الخالدي',    assoc: 'جمعية الهداية',      activities: 38, converts: 9,  rate: '%88',  status: 'نشط' },
  { id: 3, name: 'عبدالرحمن صالح المطيري',  assoc: 'جمعية النور',        activities: 42, converts: 15, rate: '%95',  status: 'نشط' },
  { id: 4, name: 'خالد أحمد الزهراني',      assoc: 'جمعية التوحيد',      activities: 28, converts: 6,  rate: '%76',  status: 'متوسط' },
  { id: 5, name: 'سعد محمد القحطاني',       assoc: 'جمعية البر والتقوى', activities: 35, converts: 11, rate: '%85',  status: 'نشط' },
  { id: 6, name: 'فهد عبدالعزيز الشمري',    assoc: 'جمعية الهداية',      activities: 22, converts: 4,  rate: '%68',  status: 'غير نشط' },
];

const getStatusClass = (status: string) => {
  if (status === 'نشط') return 'status-badge active';
  if (status === 'متوسط') return 'status-badge medium';
  return 'status-badge inactive';
};

const AwqafPreacherPerformance = () => {
  const [association, setAssociation] = useState('all');
  const [period, setPeriod] = useState('month');

  return (
    <div className="perf-page">
      <h1 className="page-title">الداشبورد</h1>

      {/* Filter Bar */}
      <div className="perf-filters">
        <div className="filter-group">
          <label>اختيار الجمعية</label>
          <select value={association} onChange={(e) => setAssociation(e.target.value)}>
            <option value="all">جميع الجمعيات</option>
            <option value="1">جمعية البر والتقوى</option>
            <option value="2">جمعية الهداية</option>
            <option value="3">جمعية النور</option>
          </select>
        </div>
        <div className="filter-group">
          <label>الفترة الزمنية</label>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="month">هذا الشهر</option>
            <option value="quarter">هذا الربع</option>
            <option value="year">هذا العام</option>
          </select>
        </div>
        <button className="apply-btn">تطبيق</button>
      </div>

      {/* Stat Cards */}
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

      {/* Charts Grid */}
      <div className="perf-charts-grid">
        {/* Bar Chart: مقارنة أداء الدعاة */}
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

        {/* Line Chart: نسبة قبول الطلبات الشهرية */}
        <div className="chart-card">
          <h3>نسبة قبول الطلبات الشهرية</h3>
          <div className="chart-content" style={{ minHeight: '280px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11, fontFamily: 'Cairo' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} domain={[40, 100]} orientation="right" label={{ value: 'نسبة القبول (%)', angle: -90, position: 'insideRight', fill: '#6B7280', fontSize: 11, fontFamily: 'Cairo' }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontFamily: 'Cairo' }} />
                <Line type="linear" dataKey="value1" stroke="#9f1239" strokeWidth={2} dot={{ r: 4, fill: '#9f1239', strokeWidth: 0 }} />
                <Line type="linear" dataKey="value2" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie/Donut Chart: حالة الطلبات */}
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

      {/* Top 6 Preachers Table */}
      <div className="perf-table-section">
        <h3>افضل 6 دعاه لهذا الشهر</h3>
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
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.assoc}</td>
                  <td>{p.activities}</td>
                  <td>{p.converts}</td>
                  <td>{p.rate}</td>
                  <td><span className={getStatusClass(p.status)}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AwqafPreacherPerformance;
