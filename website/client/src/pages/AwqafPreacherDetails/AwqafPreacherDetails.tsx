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
  Edit,
  Trash2,
} from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import NationalitiesChart from '../../components/NationalitiesChart/NationalitiesChart';
import ResponseTimeChart from '../../components/ResponseTimeChart/ResponseTimeChart';
import './AwqafPreacherDetails.css';

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
        <div className="preacher-actions">
          <button className="action-btn edit-action-btn">
            <Edit size={16} />
            تعديل البيانات
          </button>
          <button className="action-btn delete-action-btn">
            <Trash2 size={16} />
            حذف الداعية
          </button>
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
            <span className="info-value">مسيحي</span>
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
        <div className="chart-card">
          <div className="chart-header">
            <h3>البلدان</h3>
            <select className="chart-select">
              <option>الشهر</option>
            </select>
          </div>
          <div className="chart-content">
            <NationalitiesChart />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwqafPreacherDetails;
