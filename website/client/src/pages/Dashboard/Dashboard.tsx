import { useState, useEffect } from 'react';
import StatCard from '../../components/StatCard/StatCard';
import NationalitiesChart from '../../components/NationalitiesChart/NationalitiesChart';
import PresenceChart from '../../components/PresenceChart/PresenceChart';
import DataTable from '../../components/common/DataTable/DataTable';
import { 
  Users, 
  Building2, 
  UserCircle, 
  FileEdit,
  UserCheck,
  UserX
} from 'lucide-react';
import { getAdminDashboardData, DashboardStats } from '../../services/dashboardService';
import './Dashboard.css';

const preacherColumns = [
  { header: 'رقم', accessor: 'id' },
  { header: 'اسم الداعية', accessor: 'full_name' },
  { header: 'اسم الجمعية', accessor: 'organization_name' },
  { 
    header: 'نسبة نجاح الداعية', 
    accessor: 'success_rate',
    render: (value: number) => (
      <div className="table-progress-cell">
        <span className="progress-value">{value || 25}%</span>
        <div className="table-progress-container-thin">
          <div className="table-progress-bar-thin" style={{ width: `${value || 25}%`, backgroundColor: '#10B981' }}></div>
        </div>
      </div>
    )
  },
];

const associationColumns = [
  { header: 'رقم', accessor: 'id' },
  { header: 'اسم الجمعية', accessor: 'organization_name' },
  { header: 'عدد الدعاة', accessor: 'preachers_count' },
];

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Stage 1: Component mount
    const mountTimer = setTimeout(() => setIsMounted(true), 100);
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getAdminDashboardData();
        
        const mergedData: DashboardStats = {
          ...data,
          total_organizations: { title: 'اجمالي عدد الجمعيات المسجلة', value: 100 },
          total_preachers: { title: 'اجمالي عدد الدعاة', value: 15000 },
          total_individuals: { title: 'اجمالي الافراد المسجلين', value: 5000 },
          total_cases: { title: 'اجمالي الحالات المسجلة', value: 9500 },
          total_converted: { title: 'عدد من أسلموا', value: 4500 },
          total_rejected: { title: 'اجمالي حالات الرفض', value: 5000 },
          top_preachers: [
            { id: '123456', full_name: 'احمد عاطف', organization_name: 'جمعية رسالة الاسلام', success_rate: 25 },
            { id: '123456', full_name: 'محمد علي نصر', organization_name: 'جمعية الحضارة القديمة', success_rate: 25 },
            { id: '123456', full_name: 'سيد خميس', organization_name: 'جمعية دعاة الدين', success_rate: 25 },
            { id: '123456', full_name: 'صلاح السعدني', organization_name: 'جمعية أسلمني', success_rate: 25 },
            { id: '123456', full_name: 'احمد علي', organization_name: 'جمعية معرفة الاسلام', success_rate: 25 },
            { id: '123456', full_name: 'عاطف السيد', organization_name: 'جمعية الاسلام الحقيقي', success_rate: 25 },
            { id: '123456', full_name: 'حمدي خميس', organization_name: 'جمعية مسلمون لله', success_rate: 25 },
          ],
          organization_stats: [
            { id: '123456', organization_name: 'جمعية رسالة الاسلام', preachers_count: 150 },
            { id: '123456', organization_name: 'جمعية الحضارة القديمة', preachers_count: 200 },
            { id: '123456', organization_name: 'جمعية دعاة الدين', preachers_count: 300 },
            { id: '123456', organization_name: 'جمعية أسلمني', preachers_count: 120 },
            { id: '123456', organization_name: 'جمعية معرفة الاسلام', preachers_count: 600 },
            { id: '123456', organization_name: 'جمعية الاسلام الحقيقي', preachers_count: 158 },
            { id: '123456', organization_name: 'جمعية مسلمون لله', preachers_count: 220 },
          ],
          nationalities_distribution: data.nationalities_distribution?.length ? data.nationalities_distribution : [],
          preacher_presence: data.preacher_presence || { online: 20, busy: 10, offline: 5 }
        };

        setStats(mergedData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    return () => clearTimeout(mountTimer);
  }, []);

  if (loading) return <div className="loading-state">جاري تحميل البيانات...</div>;
  if (!stats) return null;

  const statCards = [
    { title: stats.total_individuals.title, value: stats.total_individuals.value.toLocaleString(), icon: <UserCircle size={24} />, bgColor: '#FCE7F3', color: '#DB2777' },
    { title: stats.total_preachers.title, value: stats.total_preachers.value.toLocaleString(), icon: <Users size={24} />, bgColor: '#E0E7FF', color: '#6366F1' },
    { title: stats.total_organizations.title, value: stats.total_organizations.value.toLocaleString(), icon: <Building2 size={24} />, bgColor: '#FEF3C7', color: '#D97706' },
    { title: stats.total_rejected.title, value: stats.total_rejected.value.toLocaleString(), icon: <UserX size={24} />, bgColor: '#FEE2E2', color: '#DC2626' },
    { title: stats.total_converted.title, value: stats.total_converted.value.toLocaleString(), icon: <UserCheck size={24} />, bgColor: '#D1FAE5', color: '#059669' },
    { title: stats.total_cases.title, value: stats.total_cases.value.toLocaleString(), icon: <FileEdit size={24} />, bgColor: '#E0F2FE', color: '#0369A1' },
  ];

  return (
    <div className={`dashboard-page ${isMounted ? 'is-view-ready' : ''}`}>
      <div className="dashboard-grid-container">
        {/* Stat Cards Row */}
        <div className="stats-row">
          {statCards.map((stat, index) => (
            <div 
              key={index} 
              className="staggered-entrance-up" 
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              <StatCard 
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                iconBgColor={stat.bgColor}
                iconColor={stat.color}
              />
            </div>
          ))}
        </div>

        {/* Data Tables Row */}
        <div className="dashboard-row">
          <div className="dashboard-col-7 staggered-entrance-fade" style={{ animationDelay: '0.4s' }}>
            <DataTable 
              title="نشاط افضل 10 دعاة" 
              columns={preacherColumns} 
              data={stats.top_preachers} 
            />
          </div>
          <div className="dashboard-col-5 staggered-entrance-fade" style={{ animationDelay: '0.6s' }}>
            <DataTable 
              title="احصائيات الجمعيات" 
              columns={associationColumns} 
              data={stats.organization_stats} 
            />
          </div>
        </div>

        {/* Charts Row */}
        <div className="dashboard-row">
          <div className="dashboard-col-7 staggered-entrance-fade" style={{ animationDelay: '0.8s' }}>
            <div className="content-card premium-shadow-hover">
              <h3 className="card-title">جنسية المدعوين</h3>
              <NationalitiesChart data={stats.nationalities_distribution} />
            </div>
          </div>
          <div className="dashboard-col-5 staggered-entrance-fade" style={{ animationDelay: '1.0s' }}>
            <div className="content-card premium-shadow-hover">
              <h3 className="card-title">حالة تواجد الدعاة الآن</h3>
              <PresenceChart data={stats.preacher_presence} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div style={{ position: 'fixed', bottom: 12, right: 12, fontSize: '10px', color: '#9CA3AF', opacity: 0.5, pointerEvents: 'none' }}>v4.1.4 Pixel Perfect</div>
    </div>
  );
};

export default Dashboard;
