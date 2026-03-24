import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard/StatCard';
import {
  Users,
  FileText,
  MessageCircle,
  UserCheck,
  UserX,
  BookOpen,
} from 'lucide-react';
import './AdminDashboard.css';

// ─── Kuwait Governorates Data ───────────────────────────────
const governorates = [
  { name: 'محافظة العاصمة',    count: '72 الف شخص', percentage: 72, color: '#F59E0B' },
  { name: 'محافظة الأحمدي',   count: '60 الف شخص', percentage: 60, color: '#EC4899' },
  { name: 'محافظة الفروانية', count: '50 الف شخص', percentage: 50, color: '#10B981' },
  { name: 'محافظة حولي',      count: '40 الف شخص', percentage: 40, color: '#6366F1' },
  { name: 'محافظة الجهراء',   count: '30 الف شخص', percentage: 30, color: '#3B82F6' },
  { name: 'محافظة مبارك الكبير', count: '20 الف شخص', percentage: 20, color: '#E11D48' },
];

// ─── Stat Cards Data ───────────────────────────────────────
const statCards = [
  { id: 1, title: 'اجمالي عدد الجمعيات', value: '100', icon: <Users size={24} />, bgColor: '#E0E7FF', color: '#6366F1', trend: 'up' as const, trendValue: '10.5%+' },
  { id: 2, title: 'عدد المحادثات الجديدة', value: '100', icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 3, title: 'عدد المحادثات المفتوحة', value: '100', icon: <MessageCircle size={24} />, bgColor: '#D1FAE5', color: '#10B981', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 4, title: 'عدد المستفيدين', value: '100', icon: <UserCheck size={24} />, bgColor: '#FEE2E2', color: '#EF4444', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 5, title: 'المحالون للتعليم و المتابعة', value: '100', icon: <BookOpen size={24} />, bgColor: '#E0E7FF', color: '#6366F1', trend: 'up' as const, trendValue: '10.5%+' },
  { id: 6, title: 'اجمالي عدد المحادثات', value: '100', icon: <FileText size={24} />, bgColor: '#FEF3C7', color: '#D97706', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 7, title: 'من اسلموا', value: '100', icon: <UserCheck size={24} />, bgColor: '#D1FAE5', color: '#10B981', trend: 'down' as const, trendValue: '10.5%-' },
  { id: 8, title: 'من رفضوا', value: '100', icon: <UserX size={24} />, bgColor: '#FEE2E2', color: '#EF4444', trend: 'down' as const, trendValue: '10.5%-' },
];

// ─── Associations Table Data ────────────────────────────────
const associations = [
  { id: '123456', name: 'جمعية رسالة الاسلام', count: 150 },
  { id: '123456', name: 'جمعية الحضارة القديمة', count: 200 },
  { id: '123456', name: 'جمعية دعاة الدين', count: 300 },
  { id: '123456', name: 'جمعية أسلمي', count: 120 },
  { id: '123456', name: 'جمعية معرفة الاسلام', count: 600 },
  { id: '123456', name: 'جمعية الاسلام الحقيقي', count: 158 },
  { id: '123456', name: 'جمعية مسلمون له', count: 220 },
];

// ─── Top Preachers Table Data ────────────────────────────────
const topPreachers = [
  { id: '123456', name: 'احمد عاطف', assoc: 'جمعية رسالة الاسلام', rate: 25 },
  { id: '123456', name: 'محمد علي نصر', assoc: 'جمعية الحضارة القديمة', rate: 25 },
  { id: '123456', name: 'سيد خميس', assoc: 'جمعية دعاة الدين', rate: 26 },
  { id: '123456', name: 'صلاح السعدني', assoc: 'جمعية أسلمي', rate: 25 },
  { id: '123456', name: 'احمد علي', assoc: 'جمعية معرفة الاسلام', rate: 25 },
  { id: '123456', name: 'عاطف السيد', assoc: 'جمعية الاسلام الحقيقي', rate: 25 },
  { id: '123456', name: 'حمدي خميس', assoc: 'جمعية مسلمون له', rate: 25 },
];

// ─── Presence Donut Chart ────────────────────────────────────
const presenceData = [
  { name: 'اونلاين', value: 20, color: '#10B981' },
  { name: 'مشغول', value: 10, color: '#F59E0B' },
  { name: 'اوفالاين', value: 5, color: '#EF4444' },
];
const totalPreachers = presenceData.reduce((sum, d) => sum + d.value, 0);

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1 className="ad-title">الداشبورد</h1>

      {/* ── Stat Cards ── */}
      <div className="ad-stats-grid">
        {statCards.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBgColor={stat.bgColor}
            iconColor={stat.color}
            trend={stat.trend as 'up' | 'down'}
            trendValue={stat.trendValue}
          />
        ))}
      </div>

      {/* ── Tables Row ── */}
      <div className="ad-tables-row">
        {/* Associations Stats */}
        <div className="ad-card ad-table-card">
          <h3 className="ad-card-title">احصائيات الجمعيات</h3>
          <table className="ad-table">
            <thead>
              <tr>
                <th>رقم</th>
                <th>اسم الجمعية</th>
                <th>عدد الدعاة</th>
              </tr>
            </thead>
            <tbody>
              {associations.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top 10 Preachers */}
        <div className="ad-card ad-table-card">
          <h3 className="ad-card-title">نشاط افضل 10 دعاة</h3>
          <table className="ad-table">
            <thead>
              <tr>
                <th>رقم</th>
                <th>اسم الداعية</th>
                <th>اسم الجمعية</th>
                <th>نسبة نجاح الداعية</th>
              </tr>
            </thead>
            <tbody>
              {topPreachers.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.assoc}</td>
                  <td>
                    <div className="ad-progress-wrapper">
                      <span className="ad-progress-label">{row.rate}%</span>
                      <div className="ad-progress-bg">
                        <div className="ad-progress-fill" style={{ width: `${row.rate}%` }} />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Charts Row ── */}
      <div className="ad-charts-row">
        {/* Donut Chart */}
        <div className="ad-card ad-chart-card">
          <h3 className="ad-card-title">حالة تواجد الدعاة الان</h3>
          <div className="ad-donut-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={presenceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {presenceData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} داعية`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="ad-donut-center">
              <span className="ad-donut-total">{totalPreachers}</span>
              <span className="ad-donut-label">داعية</span>
            </div>
          </div>
          <div className="ad-donut-legend">
            {presenceData.map((item, idx) => (
              <div key={idx} className="ad-legend-item">
                <span className="ad-legend-dot" style={{ backgroundColor: item.color }} />
                <span className="ad-legend-name">{item.name}</span>
                <span className="ad-legend-val">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Kuwait Map */}
        <div className="ad-card ad-map-card">
          <h3 className="ad-card-title">توزيع المدعوين بمحافظات الكويت</h3>
          <div className="ad-kuwait-map-wrapper">
            <img
              src="/image 1.png"
              alt="خريطة الكويت"
              className="ad-kuwait-map-img"
            />
          </div>
          <div className="ad-gov-list">
            {governorates.map((gov, idx) => (
              <div key={idx} className="ad-gov-row">
                <div className="ad-gov-header">
                  <span className="ad-gov-name">{gov.name}</span>
                  <span className="ad-gov-count">{gov.count}</span>
                </div>
                <div className="ad-progress-bg">
                  <div
                    className="ad-progress-fill"
                    style={{ width: `${gov.percentage}%`, backgroundColor: gov.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
