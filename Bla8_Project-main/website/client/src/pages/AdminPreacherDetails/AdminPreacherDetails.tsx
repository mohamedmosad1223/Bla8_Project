import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  User, 
  MessageCircle, 
  Settings, 
  Mail, 
  Phone, 
  Building2,
  ChevronLeft,
  FileText,
  UserCheck,
  ClipboardList,
  Loader2,
  AlertTriangle,
  ChevronDown,
  Check
} from 'lucide-react';
import api from '../../services/api';
import ErrorModal from '../../components/common/Modal/ErrorModal';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import StatCard from '../../components/StatCard/StatCard';
import ResponseTimeChart from '../../components/ResponseTimeChart/ResponseTimeChart';
import WorldMap from '../../components/WorldMap/WorldMap';
import './AdminPreacherDetails.css';

interface PreacherDashboardData {
  preacher_info: {
    user_id: number;
    full_name: string;
    email: string;
    phone: string;
    gender: string | null;
    nationality_name: string;
    language_names: string[];
    organization_name: string;
    status: string;
    religion: string;
  };
  total_requests: { title: string; value: number; change_percentage: number; is_positive: boolean };
  converted_count: { title: string; value: number; change_percentage: number; is_positive: boolean };
  in_progress_count: { title: string; value: number; change_percentage: number; is_positive: boolean };
  rejected_count: { title: string; value: number; change_percentage: number; is_positive: boolean };
  response_speed_chart: Array<{ name: string; time: number }>;
  countries_distribution: Array<{ label: string; value: number }>;
}

const AdminPreacherDetails = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const { id, preacherId } = useParams();
  
  const [data, setData] = useState<PreacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interval, setInterval] = useState<'day' | 'month'>('month');

  const [isIntervalDropdownOpen, setIsIntervalDropdownOpen] = useState(false);
  const intervalDropdownRef = useRef<HTMLDivElement>(null);

  // Error Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const targetId = preacherId || id; 
      const response = await api.get(`/dashboard/preacher/${targetId}?interval=${interval}`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching preacher stats:', err);
      setError('تعذر تحميل بيانات الداعية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [id, preacherId, interval]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (intervalDropdownRef.current && !intervalDropdownRef.current.contains(event.target as Node)) {
        setIsIntervalDropdownOpen(false);
      }
    }
    if (isIntervalDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isIntervalDropdownOpen]);

  const toggleStatus = async () => {
    if (!data) return;
    try {
      const targetId = preacherId || id;
      const currentStatus = data.preacher_info.status;
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      const response = await api.patch(`/admins/management/preachers/${targetId}/status`, { 
        status: newStatus 
      });
      
      setSuccessMessage(response.data.message || 'تم تحديث حالة الداعية بنجاح');
      setIsSuccessModalOpen(true);
      fetchStats(); // Refresh data
    } catch (err: any) {
      console.error('Error toggling status:', err);
      setErrorMessage(err.response?.data?.detail || 'تعذر تحديث حالة الداعية');
      setIsErrorModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="apreach-page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Loader2 className="animate-spin" size={48} color="#DBA841" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="apreach-page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <AlertTriangle size={48} color="#EF4444" />
        <p>{error || 'حدث خطأ'}</p>
      </div>
    );
  }

  const { preacher_info: info } = data;

  const statCards = [
    { 
      id: 1, 
      title: data.total_requests.title, 
      value: data.total_requests.value, 
      icon: <FileText size={24} />, 
      bgColor: '#FEF3C7', 
      color: '#F59E0B',
      trend: data.total_requests.is_positive ? 'up' : 'down' as 'up' | 'down',
      trendValue: `الشهر الماضي ${data.total_requests.change_percentage}%`
    },
    { 
      id: 2, 
      title: data.converted_count.title, 
      value: data.converted_count.value, 
      icon: <UserCheck size={24} />, 
      bgColor: '#D1FAE5', 
      color: '#10B981',
      trend: data.converted_count.is_positive ? 'up' : 'down' as 'up' | 'down',
      trendValue: `الشهر الماضي ${data.converted_count.change_percentage}%`
    },
    { 
      id: 3, 
      title: data.in_progress_count.title, 
      value: data.in_progress_count.value, 
      icon: <ClipboardList size={24} />, 
      bgColor: '#FCE7F3', 
      color: '#EC4899',
      trend: data.in_progress_count.is_positive ? 'up' : 'down' as 'up' | 'down',
      trendValue: `الشهر الماضي ${data.in_progress_count.change_percentage}%`
    },
    { 
      id: 4, 
      title: data.rejected_count.title, 
      value: data.rejected_count.value, 
      icon: <FileText size={24} />, 
      bgColor: '#FEE2E2', 
      color: '#EF4444',
      trend: data.rejected_count.is_positive ? 'up' : 'down' as 'up' | 'down',
      trendValue: `الشهر الماضي ${data.rejected_count.change_percentage}%`
    },
  ];

  const countryColors = ['#FF4D4F', '#1890FF', '#FFA940', '#722ED1', '#13C2C2', '#52C41A'];

  return (
    <div className="apreach-page">
      {/* ── Breadcrumb & Title ── */}
      <div className="apreach-header">
        <div className="apreach-breadcrumb">
          <span 
            className="apreach-crumb-link" 
            onClick={() => {
              if (userRole === 'admin') {
                if (id) {
                  navigate(`/admin/associations/${id}`);
                } else {
                  navigate('/admin/callers');
                }
              } else {
                navigate('/callers');
              }
            }}
          >
             دعاة الجمعية
          </span>
          <ChevronLeft size={16} className="apreach-crumb-icon" />
          <span className="apreach-crumb-current">عرض تفاصيل الداعية</span>
        </div>
        <div className="apreach-header-top">
          <h1 className="apreach-title">عرض تفاصيل الداعية</h1>
          <button 
            className="apreach-chat-btn"
            onClick={() => {
              const chatPath = userRole === 'admin' 
                ? `/admin/chat/${info.user_id}` 
                : `/conversations?user_id=${info.user_id}&name=${info.full_name}`;
              navigate(chatPath);
            }}
          >
            <MessageCircle size={18} />
            <span>محادثة</span>
          </button>
        </div>
      </div>

      {/* ── Data section ── */}
      <div className="apreach-card">
        <div className="apreach-grid">
          <div className="apreach-item">
            <span className="apreach-label"><User size={16}/> اسم الداعية</span>
            <span className="apreach-value">{info.full_name}</span>
          </div>
          <div className="apreach-item">
            <span className="apreach-label"><MessageCircle size={16}/> اللغة</span>
            <span className="apreach-value">{info.language_names.join(', ') || '—'}</span>
          </div>

          <div className="apreach-item">
            <span className="apreach-label"><Settings size={16}/> الحالة</span>
            <div className="status-row">
              <span className={`apreach-value ${info.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                {info.status === 'active' ? 'مفعل' : 'غير مفعل'}
              </span>
              {userRole === 'admin' && (
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={info.status === 'active'} 
                    onChange={toggleStatus} 
                  />
                  <span className="toggle-slider"></span>
                </label>
              )}
            </div>
          </div>

          <div className="apreach-item">
            <span className="apreach-label"><Mail size={16}/> البريد الالكتروني</span>
            <span className="apreach-value ltr-fix">{info.email}</span>
          </div>
          <div className="apreach-item">
            <span className="apreach-label"><Phone size={16}/> رقم الهاتف</span>
            <span className="apreach-value ltr-fix">{info.phone}</span>
          </div>
          <div className="apreach-item">
            <span className="apreach-label"><Building2 size={16}/> اسم الجمعية</span>
            <span className="apreach-value">{info.organization_name}</span>
          </div>
          <div className="apreach-item"></div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="apreach-stats-grid">
        {statCards.map((stat) => (
          <StatCard
            key={stat.id}
            title={stat.title}
            value={stat.value.toString()}
            icon={stat.icon}
            iconBgColor={stat.bgColor}
            iconColor={stat.color}
            trend={stat.id % 2 === 0 ? 'down' : 'up'}
            trendValue="الشهر الماضي 10.5%"
          />
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="apreach-charts-grid">
        {/* Countries Map */}
        <div className="apreach-chart-card side-map">
          <div className="apreach-chart-header">
            <h3>البلدان</h3>
          </div>
          <div className="apreach-chart-content map-wrapper">
            <div style={{ width: '100%', height: '180px' }}>
              <WorldMap data={data.countries_distribution} colors={countryColors} />
            </div>
            <div className="apreach-gov-list">
              {data.countries_distribution.map((country, idx) => (
                <div key={idx} className="apreach-gov-row">
                  <div className="apreach-gov-header">
                    <span className="apreach-gov-name">{country.label}</span>
                    <span className="apreach-gov-count">{country.value} شخص</span>
                  </div>
                  <div className="apreach-gov-progress">
                    <div
                      className="apreach-gov-fill"
                      style={{ 
                        width: `${Math.min(100, (country.value / (data.total_requests.value || 1)) * 100)}%`, 
                        backgroundColor: countryColors[idx % countryColors.length] 
                      }}
                    />
                  </div>
                </div>
              ))}
              {data.countries_distribution.length === 0 && <p className="text-center text-gray-400">لا توجد بيانات</p>}
            </div>
          </div>
        </div>

        {/* Response Speed Chart */}
        <div className="apreach-chart-card main-chart">
          <div className="apreach-chart-header row-between">
            <h3>سرعة الاستجابة الاولي</h3>
            
            <div className="relative" ref={intervalDropdownRef}>
              <div 
                className="custom-dropdown-trigger" 
                onClick={() => setIsIntervalDropdownOpen(!isIntervalDropdownOpen)}
              >
                <span>{interval === 'month' ? 'شهري' : 'يومي'}</span>
                <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: isIntervalDropdownOpen ? 'rotate(180deg)' : 'none' }} />
              </div>

              {isIntervalDropdownOpen && (
                <div className="apreach-dropdown-menu">
                  <div className="apreach-dropdown-item" onClick={() => { setInterval('month'); setIsIntervalDropdownOpen(false); }}>
                    <div className={`checkbox-custom check-align-left ${interval === 'month' ? 'checked' : ''}`}>
                      {interval === 'month' && <Check size={10} strokeWidth={4} color="white" />}
                    </div>
                    <span>شهري</span>
                  </div>
                  <div className="apreach-dropdown-item" onClick={() => { setInterval('day'); setIsIntervalDropdownOpen(false); }}>
                    <div className={`checkbox-custom check-align-left ${interval === 'day' ? 'checked' : ''}`}>
                      {interval === 'day' && <Check size={10} strokeWidth={4} color="white" />}
                    </div>
                    <span>يومي</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="apreach-chart-content">
            <ResponseTimeChart data={data.response_speed_chart} />
          </div>
        </div>
      </div>
      <ErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        message={errorMessage}
      />

      <SuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        title="تم بنجاح"
        description={successMessage}
      />
    </div>
  );
};

export default AdminPreacherDetails;
