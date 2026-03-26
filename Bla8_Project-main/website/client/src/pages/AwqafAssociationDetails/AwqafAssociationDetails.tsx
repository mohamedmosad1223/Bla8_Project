import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  User, 
  CheckCircle, 
  Eye,
  ChevronLeft,
  Search,
  Loader2,
  AlertCircle,
  Users,
  UserCheck,
  UserX
} from 'lucide-react';
import StatCard from '../../components/StatCard/StatCard';
import RequestsChart from '../../components/RequestsChart/RequestsChart';
import ConversionsChart from '../../components/ConversionsChart/ConversionsChart';
import NationalitiesChart from '../../components/NationalitiesChart/NationalitiesChart';
import { ministerService } from '../../services/ministerService';
import './AwqafAssociationDetails.css';

interface OrganizationDetailsResponse {
  organization_info: {
    name: string;
    license_number?: string;
    email?: string;
    phone?: string;
    governorate?: string;
    manager_name?: string;
    status?: string;
  };
  performance_stats: Array<{ title: string; value: number; icon: string }>;
  charts: {
    requests_distribution: Array<{ label: string; value: number }>;
    conversion_trends: Array<{ month: string; converts: number; rejects: number }>;
    nationalities: Array<{ label: string; value: number }>;
  };
}

interface OrganizationPreacher {
  preacher_id: number;
  full_name: string;
  nationality: string;
  joining_date: string;
  languages: string[];
  status: string;
}

const STAT_ICON_CONFIG: Record<string, { icon: JSX.Element; bgColor: string; color: string }> = {
  preachers: { icon: <Users size={24} />, bgColor: '#EDE9FE', color: '#7C3AED' },
  requests: { icon: <FileText size={24} />, bgColor: '#FEF9C3', color: '#CA8A04' },
  converted: { icon: <UserCheck size={24} />, bgColor: '#D1FAE5', color: '#059669' },
  rejected: { icon: <UserX size={24} />, bgColor: '#FEE2E2', color: '#DC2626' }
};

const mapPreacherStatus = (status: string) => {
  if (status === 'active') return 'مفعل';
  if (status === 'inactive') return 'غير مفعل';
  return status || 'غير محدد';
};

const AwqafAssociationDetails = () => {
  const navigate = useNavigate();
  const { id: assocId } = useParams();
  const [activeTab, setActiveTab] = useState<'data' | 'preachers'>('data');
  const [search, setSearch] = useState('');
  const [details, setDetails] = useState<OrganizationDetailsResponse | null>(null);
  const [preachers, setPreachers] = useState<OrganizationPreacher[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingPreachers, setLoadingPreachers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orgId = Number(assocId);
  const isValidOrgId = Number.isInteger(orgId) && orgId >= 0;

  useEffect(() => {
    if (!isValidOrgId) {
      setError('معرف الجمعية غير صالح');
      setLoadingDetails(false);
      return;
    }

    const fetchDetails = async () => {
      try {
        setLoadingDetails(true);
        setError(null);
        const result = await ministerService.getOrganizationDetails(orgId);
        setDetails(result);
      } catch (err) {
        console.error('Organization details fetch error:', err);
        setError('تعذر تحميل تفاصيل الجمعية');
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [isValidOrgId, orgId]);

  useEffect(() => {
    if (!isValidOrgId || activeTab !== 'preachers') return;

    const timeoutId = window.setTimeout(async () => {
      try {
        setLoadingPreachers(true);
        const result = await ministerService.getOrganizationPreachers(orgId, search.trim() || undefined);
        setPreachers(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error('Organization preachers fetch error:', err);
        setPreachers([]);
      } finally {
        setLoadingPreachers(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab, isValidOrgId, orgId, search]);

  const conversionChartData = useMemo(() => {
    if (!details?.charts?.conversion_trends) return [];

    return details.charts.conversion_trends.flatMap((item) => ([
      { label: `${item.month} - Converts`, value: item.converts },
      { label: `${item.month} - Rejects`, value: item.rejects }
    ]));
  }, [details]);

  if (loadingDetails) {
    return (
      <div className="awqaf-assoc-details-page assoc-details-state">
        <Loader2 size={38} className="spin-icon" />
        <p>جاري تحميل تفاصيل الجمعية...</p>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="awqaf-assoc-details-page assoc-details-state assoc-details-state-error">
        <AlertCircle size={38} />
        <p>{error || 'حدث خطأ غير متوقع'}</p>
      </div>
    );
  }

  return (
    <div className="awqaf-assoc-details-page">
      {/* Breadcrumb & Title */}
      <div className="details-header">
        <div className="breadcrumb">
          <span className="breadcrumb-link" onClick={() => navigate('/awqaf/associations')}>
            الجمعيات
          </span>
          <ChevronLeft size={16} />
          <span className="breadcrumb-current">عرض تفاصيل الجمعية</span>
        </div>
        <h1 className="page-title">عرض تفاصيل الجمعية</h1>
      </div>

      {/* Tabs */}
      <div className="details-tabs">
        <button 
          className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          عرض بيانات الجمعية
        </button>
        <button 
          className={`tab-btn ${activeTab === 'preachers' ? 'active' : ''}`}
          onClick={() => setActiveTab('preachers')}
        >
          عرض دعاة الجمعية
        </button>
      </div>

      {/* Tab Content: Data */}
      {activeTab === 'data' && (
        <div className="tab-content data-tab">
          <div className="data-card">
            <div className="data-section">
              <div className="section-header">
                <h3>بيانات الجمعية</h3>
              </div>
              <div className="data-grid-layout">
                <div className="data-item">
                  <span className="data-label"><Building2 size={16}/> اسم الجمعية</span>
                  <span className="data-value">{details.organization_info.name}</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><FileText size={16}/> رقم الترخيص</span>
                  <span className="data-value with-icon" style={{ direction: 'ltr', justifyContent: 'flex-end', width: '100%' }}><Eye size={16}/> {details.organization_info.license_number || 'غير متوفر'}</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><Mail size={16}/> البريد الألكتروني</span>
                  <span className="data-value">{details.organization_info.email || 'غير متوفر'}</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><Phone size={16}/> رقم الهاتف</span>
                  <span className="data-value" style={{direction: 'ltr', justifyContent: 'flex-end', width: '100%'}}>{details.organization_info.phone || 'غير متوفر'}</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><MapPin size={16}/> البلد</span>
                  <span className="data-value">الكويت</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><MapPin size={16}/> المحافظة</span>
                  <span className="data-value">{details.organization_info.governorate || 'غير محدد'}</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><MapPin size={16}/> العنوان</span>
                  <span className="data-value">{details.organization_info.governorate || 'غير محدد'}</span>
                </div>
                <div className="data-item">
                  <span className="data-label"><CheckCircle size={16}/> الحالة</span>
                  <span className="data-value status-active">{details.organization_info.status || 'غير محدد'}</span>
                </div>
              </div>
            </div>

            <div className="divider" />

            <div className="data-section">
              <h3>بيانات مشرف الجمعية</h3>
              <div className="data-item single">
                <span className="data-label"><User size={16}/> اسم مشرف الجمعية</span>
                <span className="data-value">{details.organization_info.manager_name || 'غير متوفر'}</span>
              </div>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: '24px' }}>
            {details.performance_stats.map((stat, idx) => {
              const iconCfg = STAT_ICON_CONFIG[stat.icon] || STAT_ICON_CONFIG.preachers;
              return (
              <StatCard
                key={idx}
                title={stat.title}
                value={String(stat.value)}
                icon={iconCfg.icon}
                iconBgColor={iconCfg.bgColor}
                iconColor={iconCfg.color}
                trend={'up'}
                trendValue={''}
              />
              );
            })}
          </div>

          <div className="charts-grid" style={{ marginTop: '24px' }}>
            <div className="chart-card">
              <div className="chart-header" style={{ justifyContent: 'center' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '16px', borderBottom: 'none' }}>جنسيات الاشخاص المدعوين</h3>
              </div>
              <div className="chart-content">
                <NationalitiesChart data={details.charts.nationalities} />
              </div>
            </div>
            <div className="chart-card">
              <h3>اجمالي الطلبات</h3>
              <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <RequestsChart data={details.charts.requests_distribution} />
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-header">
                <h3>من اسلموا / رفضوا</h3>
                <select className="chart-select">
                  <option>اشهر</option>
                </select>
              </div>
              <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '250px' }}>
                <ConversionsChart data={conversionChartData} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Preachers */}
      {activeTab === 'preachers' && (
        <div className="tab-content preachers-tab">
          <div className="preachers-controls">
            <div className="search-filter-wrapper">
              <div className="search-box">
                <Search size={18} />
                <input 
                  type="text" 
                  placeholder="ابحث باسم الداعية"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="preachers-table-container">
            <table className="preachers-table">
              <thead>
                <tr>
                  <th>رقم</th>
                  <th>اسم الداعية</th>
                  <th>الجنسية</th>
                  <th>تاريخ الانضمام</th>
                  <th>اللغة</th>
                  <th>مفعل / غير مفعل</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {preachers.map((preacher, index) => (
                  <tr key={preacher.preacher_id}>
                    <td>{index + 1}</td>
                    <td>{preacher.full_name}</td>
                    <td>{preacher.nationality}</td>
                    <td className="multiline-cell">{preacher.joining_date}</td>
                    <td>{preacher.languages.join('، ') || 'غير محدد'}</td>
                    <td><span className="status-chip">{mapPreacherStatus(preacher.status)}</span></td>
                    <td><button className="icon-btn" onClick={() => navigate(`/awqaf/associations/${assocId}/preachers/${preacher.preacher_id}`)}><Eye size={18}/></button></td>
                  </tr>
                ))}
                {!loadingPreachers && preachers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-row">لا يوجد دعاة مطابقين للبحث</td>
                  </tr>
                )}
                {loadingPreachers && (
                  <tr>
                    <td colSpan={7} className="empty-row">جاري تحميل الدعاة...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AwqafAssociationDetails;
