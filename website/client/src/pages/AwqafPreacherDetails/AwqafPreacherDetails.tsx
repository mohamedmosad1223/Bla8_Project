import { useNavigate, useParams } from 'react-router-dom';
import {
  Users,
  FileText,
  UserCheck,
  UserX,
  User,
  ChevronLeft,
  Globe,
  Phone,
  Mail,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ResponseTimeChart from '../../components/ResponseTimeChart/ResponseTimeChart';
import './AwqafPreacherDetails.css';

const governorates = [
  { name: 'محافظة العاصمة',    count: '72 الف شخص', percentage: 72, color: '#F59E0B' },
  { name: 'محافظة الأحمدي',   count: '60 الف شخص', percentage: 60, color: '#EC4899' },
  { name: 'محافظة الفروانية', count: '50 الف شخص', percentage: 50, color: '#10B981' },
  { name: 'محافظة حولي',      count: '40 الف شخص', percentage: 40, color: '#6366F1' },
  { name: 'محافظة الجهراء',   count: '30 الف شخص', percentage: 30, color: '#3B82F6' },
  { name: 'محافظة مبارك الكبير', count: '20 الف شخص', percentage: 20, color: '#E11D48' },
];

const mockStats = [
  { id: 1, title: 'اجمالي عدد الطلبات',   value: '100', icon: <FileText size={24} />,  bgColor: '#D1FAE5', color: '#059669', trend: 'up'   as const, trendValue: '+10.5%' },
  { id: 2, title: 'عدد من أسلموا',         value: '100', icon: <UserCheck size={24} />, bgColor: '#D1FAE5', color: '#059669', trend: 'down' as const, trendValue: '+10.5%' },
  { id: 3, title: 'اجمالي قيد الاقناع',    value: '100', icon: <BookOpen size={24} />,  bgColor: '#FEE2E2', color: '#DC2626', trend: 'up'   as const, trendValue: '+10.5%' },
  { id: 4, title: 'عدد من رفضوا',          value: '100', icon: <UserX size={24} />,     bgColor: '#FEE2E2', color: '#DC2626', trend: 'down' as const, trendValue: '+10.5%' },
];

const AwqafPreacherDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="preacher-details-page">
      {/* Breadcrumb & Title */}
      <div className="preacher-top-bar">
        <div className="preacher-top-right">
          <div className="breadcrumb">
            <span className="breadcrumb-link" onClick={() => navigate(`/awqaf/associations/${id}/details`)}>
              دعاة الجمعية
            </span>
            <ChevronLeft size={16} />
          </div>
          <h1 className="page-title">عرض تفاصيل الداعية</h1>
        </div>
      </div>

      {/* Preacher Info Card */}
      <div className="preacher-info-card">
        {/* Row 1 */}
        <div className="info-row">
          <div className="info-item">
            <div className="info-item-header">
              <User size={16} className="info-icon-sm" />
              <span className="info-label">اسم الداعية</span>
            </div>
            <span className="info-value">احمد عاطف</span>
          </div>
          <div className="info-item">
            <div className="info-item-header">
              <Globe size={16} className="info-icon-sm" />
              <span className="info-label">اللغة</span>
            </div>
            <span className="info-value">اللغة الفرنسية، الانجليزية</span>
          </div>
          <div className="info-item">
            <div className="info-item-header">
              <BookOpen size={16} className="info-icon-sm" />
              <span className="info-label">الديانة</span>
            </div>
            <span className="info-value">مسلم</span>
          </div>
          <div className="info-item">
            <div className="info-item-header">
              <CheckCircle size={16} className="info-icon-sm" />
              <span className="info-label">الحالة</span>
            </div>
            <span className="info-value status-inactive">غير مفعل</span>
          </div>
        </div>

        {/* Row 2 */}
        <div className="info-row">
          <div className="info-item">
            <div className="info-item-header">
              <Mail size={16} className="info-icon-sm" />
              <span className="info-label">البريد الألكتروني</span>
            </div>
            <span className="info-value">John2025@gmail.com</span>
          </div>
          <div className="info-item">
            <div className="info-item-header">
              <Phone size={16} className="info-icon-sm" />
              <span className="info-label">رقم الهاتف</span>
            </div>
            <span className="info-value" style={{ direction: 'ltr', textAlign: 'right' }}>+2001155591759</span>
          </div>
          <div className="info-item">
            <div className="info-item-header">
              <Users size={16} className="info-icon-sm" />
              <span className="info-label">اسم الجمعية</span>
            </div>
            <span className="info-value">جمعية رسالة الاسلام</span>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="preacher-stats-row">
        {mockStats.map((stat) => (
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

      {/* Charts: Response Time + Countries */}
      <div className="preacher-charts-grid">
        <div className="chart-card preacher-chart-wide">
          <h3>سرعة الاستجابة الاولي</h3>
          <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
            <ResponseTimeChart />
          </div>
        </div>
        <div className="chart-card side-map">
          <div className="chart-header">
            <h3>توزيع المدعوين بمحافظات الكويت</h3>
          </div>
          <div className="chart-content awqaf-map-wrapper">
            <img
              src="/image 1.png"
              alt="خريطة الكويت"
              className="awqaf-kuwait-map"
            />
            <div className="awqaf-gov-list">
              {governorates.map((gov, idx) => (
                <div key={idx} className="awqaf-gov-row">
                  <div className="awqaf-gov-header">
                    <span className="awqaf-gov-name">{gov.name}</span>
                    <span className="awqaf-gov-count">{gov.count}</span>
                  </div>
                  <div className="awqaf-gov-progress">
                    <div
                      className="awqaf-gov-fill"
                      style={{ width: `${gov.percentage}%`, backgroundColor: gov.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwqafPreacherDetails;
