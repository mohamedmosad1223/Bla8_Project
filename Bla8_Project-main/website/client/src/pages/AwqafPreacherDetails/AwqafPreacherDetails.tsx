import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Users, FileText, UserCheck, UserX, User, ChevronLeft, Globe, Phone, Mail, BookOpen, CheckCircle, Loader2, AlertCircle,
} from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import ResponseTimeChart from '../../components/ResponseTimeChart/ResponseTimeChart';
import { preacherService } from '../../services/preacherService';
import api from '../../services/api'; // لطلب الداش بورد مباشرة
import './AwqafPreacherDetails.css';

interface PreacherProfile {
  full_name: string;
  email: string;
  phone: string;
  status: string;
  nationality_name: string;
  language_names: string[];
  organization_name: string;
}

interface PreacherDashboard {
  total_requests: { value: number };
  converted_count: { value: number };
  rejected_count: { value: number };
  engagement_count: { value: number };
  governorates_distribution: { label: string; value: number }[];
  response_speed_chart: { label: string; value: number }[];
}

const AwqafPreacherDetails = () => {
  const navigate = useNavigate();
  const { preacherId } = useParams(); // سحب رقم الداعية من الرابط
  
  const [profile, setProfile] = useState<PreacherProfile | null>(null);
  const [dash, setDash] = useState<PreacherDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!preacherId) return;
      try {
        setLoading(true);
        setError(null);

        // طلب البيانات باستخدام preacherId
        const [profileRes, dashRes] = await Promise.all([
          preacherService.getById(preacherId),
          api.get(`/dashboard/preacher/${preacherId}`)
        ]);


        setProfile(profileRes.data || profileRes);
        setDash(dashRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('تعذّر تحميل بيانات الداعية حالياً.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [preacherId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '15px', color: '#6B7280' }}>
        <Loader2 size={40} className="spin-icon" />
        <p>جاري تحميل البيانات الحقيقية...</p>
      </div>
    );
  }

  if (error || !profile || !dash) {
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
  const totalGovReqs = dash.governorates_distribution.reduce((acc, curr) => acc + curr.value, 0) || 1;
  const govList = allGovs.map((name, i) => {
    const found = dash.governorates_distribution.find(g => g.label === name);
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
            <span className="info-value">{profile.full_name}</span>
          </div>
          <div className="info-item">
            <div className="info-item-header"><Globe size={16} /> <span className="info-label">اللغة</span></div>
            <span className="info-value">{profile.language_names.join('، ') || '—'}</span>
          </div>
          <div className="info-item">
            <div className="info-item-header"><BookOpen size={16} /> <span className="info-label">الديانة</span></div>
            <span className="info-value">مسلم</span>
          </div>
          <div className="info-item">
            <div className="info-item-header"><CheckCircle size={16} /> <span className="info-label">الحالة</span></div>
            <span className={`info-value ${profile.status === 'active' ? 'status-active' : 'status-inactive'}`}>
              {profile.status === 'active' ? 'مفعل' : 'غير مفعل'}
            </span>
          </div>
        </div>
        <div className="info-row">
          <div className="info-item">
            <div className="info-item-header"><Mail size={16} /> <span className="info-label">البريد الألكتروني</span></div>
            <span className="info-value">{profile.email || '—'}</span>
          </div>
          <div className="info-item">
            <div className="info-item-header"><Phone size={16} /> <span className="info-label">رقم الهاتف</span></div>
            <span className="info-value" style={{ direction: 'ltr', textAlign: 'right' }}>{profile.phone || '—'}</span>
          </div>
          <div className="info-item">
            <div className="info-item-header"><Users size={16} /> <span className="info-label">اسم الجمعية</span></div>
            <span className="info-value">{profile.organization_name}</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="preacher-stats-row">
        <StatCard title="إجمالي عدد الطلبات" value={dash.total_requests.value.toString()} icon={<FileText size={24} />} iconBgColor="#D1FAE5" iconColor="#059669" trend="up" trendValue="+0%" />
        <StatCard title="عدد من أسلموا" value={dash.converted_count.value.toString()} icon={<UserCheck size={24} />} iconBgColor="#D1FAE5" iconColor="#059669" trend="up" trendValue="+0%" />
        <StatCard title="إجمالي قيد الاقناع" value={dash.engagement_count.value.toString()} icon={<BookOpen size={24} />} iconBgColor="#FEE2E2" iconColor="#DC2626" trend="down" trendValue="+0%" />
        <StatCard title="عدد من رفضوا" value={dash.rejected_count.value.toString()} icon={<UserX size={24} />} iconBgColor="#FEE2E2" iconColor="#DC2626" trend="down" trendValue="+0%" />
      </div>

      {/* Charts */}
      <div className="preacher-charts-grid">
        <div className="chart-card preacher-chart-wide">
          <h3>سرعة الاستجابة الاولي</h3>
          <div className="chart-content" style={{ minHeight: '300px' }}>
            <ResponseTimeChart 
              data={dash.response_speed_chart.map(item => ({
                name: item.label,
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
