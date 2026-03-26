import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users, FileText, UserCheck, UserX, User, ChevronLeft, Globe, Phone, Mail, BookOpen, CheckCircle, Loader2, AlertCircle,
} from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ResponseTimeChart from '../../components/ResponseTimeChart/ResponseTimeChart';
import { ministerService } from '../../services/ministerService';
import './AwqafPreacherDetails.css';

interface MinisterPreacherDetailsResponse {
  preacher_info: {
    preacher_id: number;
    full_name: string;
    email: string;
    phone: string;
    languages: string[];
    organization_name: string;
    status: string;
  };
  performance_stats: Array<{ title: string; value: number; icon: string }>;
  charts: {
    nationalities: { label: string; value: number }[];
    response_time_trend: { month: string; value: number }[];
  };
}

const AwqafPreacherDetails = () => {
  const navigate = useNavigate();
  const { preacherId } = useParams();
  
  const [data, setData] = useState<MinisterPreacherDetailsResponse | null>(null);
  const [trendGranularity, setTrendGranularity] = useState<'daily' | 'monthly'>('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!preacherId) {
        setError('رقم الداعية غير صالح');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await ministerService.getPreacherDetails(Number(preacherId), trendGranularity);
        setData(response);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('تعذر الوصول لمعلومات الداعية');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [preacherId, trendGranularity]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '15px', color: '#6B7280' }}>
        <Loader2 size={40} className="spin-icon" />
        <p>جاري تحميل البيانات الحقيقية...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '15px', color: '#EF4444' }}>
        <AlertCircle size={48} />
        <p>{error || 'لا توجد بيانات متاحة'}</p>
        <button onClick={() => navigate(-1)} className="retry-btn">العودة للخلف</button>
      </div>
    );
  }

  // ألوان المحافظات
  const govColors = ['#F59E0B', '#EC4899', '#10B981', '#6366F1', '#3B82F6', '#E11D48'];
  const allGovs = ["محافظة العاصمة", "محافظة الأحمدي", "محافظة الفروانية", "محافظة حولي", "محافظة الجهراء", "محافظة مبارك الكبير"];
  
  // تجهيز بيانات المحافظات
  const totalGovReqs = data.charts.nationalities.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const govList = allGovs.map((name, i) => {
    const found = data.charts.nationalities.find(g => g.label === name);
    const count = found ? found.value : 0;
    return {
      name,
      count: `${count} طلب`,
      percentage: Math.round((count / totalGovReqs) * 100),
      color: govColors[i % govColors.length]
    };
  });

  return (
    <div className="preacher-details-page">
      <div className="preacher-top-bar">
        <div className="preacher-top-right">
          <div className="breadcrumb">
            <span className="breadcrumb-link" onClick={() => navigate(-1)}>دعاة الجمعية</span>
            <ChevronLeft size={16} />
          </div>
          <h1 className="page-title">عرض تفاصيل الداعية</h1>
        </div>
      </div>

      {/* Profile Info */}
      <div className="preacher-info-card">
        <div className="info-row">
          <div className="info-item">
            <div className="info-item-header"><User size={16} /> <span className="info-label">اسم الداعية</span></div>
            <span className="info-value">{data.preacher_info.full_name}</span>
          </div>
          <div className="info-item">
            <div className="info-item-header"><Globe size={16} /> <span className="info-label">اللغة</span></div>
            <span className="info-value">{data.preacher_info.languages.join('، ') || '—'}</span>
          </div>
          <div className="info-item">
            <div className="info-item-header"><BookOpen size={16} /> <span className="info-label">الديانة</span></div>
            <span className="info-value">مسلم</span>
          </div>
          <div className="info-item">
            <div className="info-item-header"><CheckCircle size={16} /> <span className="info-label">الحالة</span></div>
            <span className={`info-value ${data.preacher_info.status === 'active' ? 'status-active' : 'status-inactive'}`}>
              {data.preacher_info.status === 'active' ? 'مفعل' : 'غير مفعل'}
            </span>
          </div>
        </div>
        <div className="info-row">
          <div className="info-item">
            <div className="info-item-header"><Mail size={16} /> <span className="info-label">البريد الألكتروني</span></div>
            <span className="info-value">{data.preacher_info.email || '—'}</span>
          </div>
          <div className="info-item">
            <div className="info-item-header"><Phone size={16} /> <span className="info-label">رقم الهاتف</span></div>
            <span className="info-value" style={{ direction: 'ltr', textAlign: 'right' }}>{data.preacher_info.phone || '—'}</span>
          </div>
          <div className="info-item">
            <div className="info-item-header"><Users size={16} /> <span className="info-label">اسم الجمعية</span></div>
            <span className="info-value">{data.preacher_info.organization_name}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="preacher-stats-row">
        {data.performance_stats.map((stat, idx) => {
          const iconMap: Record<string, JSX.Element> = {
            requests: <FileText size={24} />,
            converted: <UserCheck size={24} />,
            in_progress: <BookOpen size={24} />,
            rejected: <UserX size={24} />
          };
          const isPositive = stat.icon === 'requests' || stat.icon === 'converted';
          return (
            <StatCard
              key={idx}
              title={stat.title}
              value={String(stat.value)}
              icon={iconMap[stat.icon] || <FileText size={24} />}
              iconBgColor={isPositive ? '#D1FAE5' : '#FEE2E2'}
              iconColor={isPositive ? '#059669' : '#DC2626'}
              trend={isPositive ? 'up' : 'down'}
              trendValue="+0%"
            />
          );
        })}
      </div>

      {/* Charts */}
      <div className="preacher-charts-grid">
        <div className="chart-card preacher-chart-wide">
          <div className="chart-header">
            <h3>سرعة الاستجابة الاولي</h3>
            <select
              className="chart-select"
              value={trendGranularity}
              onChange={(e) => setTrendGranularity(e.target.value as 'daily' | 'monthly')}
            >
              <option value="daily">يومي</option>
              <option value="monthly">شهري</option>
            </select>
          </div>
          <div className="chart-content" style={{ minHeight: '300px' }}>
            <ResponseTimeChart 
              data={data.charts.response_time_trend.map(item => ({
                name: item.month,
                time: item.value
              }))} 
            />
          </div>
        </div>
        
        <div className="chart-card side-map">
          <div className="chart-header"><h3>توزيع المدعوين بمافظات الكويت</h3></div>
          <div className="chart-content awqaf-map-wrapper">
            <img src="/image 1.png" alt="Map" className="awqaf-kuwait-map" />
            <div className="awqaf-gov-list">
              {govList.map((gov, idx) => (
                <div key={idx} className="awqaf-gov-row">
                  <div className="awqaf-gov-header">
                    <span className="awqaf-gov-name">{gov.name}</span>
                    <span className="awqaf-gov-count">{gov.count}</span>
                  </div>
                  <div className="awqaf-gov-progress">
                    <div className="awqaf-gov-fill" style={{ width: `${gov.percentage}%`, backgroundColor: gov.color }} />
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
