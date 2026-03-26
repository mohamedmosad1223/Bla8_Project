import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Building, Users, UserCheck, FileText, Download, Loader2, AlertCircle } from 'lucide-react';
import RequestsChart from '../../components/RequestsChart/RequestsChart';
import ConversionsChart from '../../components/ConversionsChart/ConversionsChart';
import AcceptanceRateChart from '../../components/AcceptanceRateChart/AcceptanceRateChart';
import { ministerService } from '../../services/ministerService';
import './AwqafAssociationReports.css';

interface OrganizationDetailsResponse {
  organization_info: {
    name: string;
    governorate?: string;
    phone?: string;
    email?: string;
  };
  charts: {
    requests_distribution: Array<{ label: string; value: number }>;
    conversion_trends: Array<{ month: string; converts: number; rejects: number }>;
    nationalities: Array<{ label: string; value: number }>;
  };
  requests_summary: {
    total: number;
    converted: number;
    in_progress: number;
    rejected: number;
  };
}

const AwqafAssociationReports = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [data, setData] = useState<OrganizationDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orgId = Number(id);
    if (!Number.isInteger(orgId) || orgId < 0) {
      setError('معرف الجمعية غير صالح');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await ministerService.getOrganizationDetails(orgId);
        setData(result);
      } catch (err) {
        console.error('Association reports fetch error:', err);
        setError('تعذر تحميل بيانات التقارير');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const reportStats = useMemo(() => {
    if (!data) return [];
    return [
      { id: 1, label: 'اسم الجمعية', value: data.organization_info.name || '-', icon: <Building2 size={24} />, bgColor: '#FEF3C7', color: '#D97706' },
      { id: 2, label: 'المنطقة', value: data.organization_info.governorate || '-', icon: <Building size={24} />, bgColor: '#FEF3C7', color: '#D97706' },
      { id: 3, label: 'رقم الهاتف', value: data.organization_info.phone || '-', icon: <Users size={24} />, bgColor: '#E0E7FF', color: '#4338CA' },
      { id: 4, label: 'البريد الالكتروني', value: data.organization_info.email || '-', icon: <Users size={24} />, bgColor: '#FCE7F3', color: '#DB2777' },
      { id: 5, label: 'إجمالي الحالات المسجلة', value: String(data.requests_summary.total), icon: <FileText size={24} />, bgColor: '#F3E8FF', color: '#7E22CE' },
      { id: 6, label: 'قيد المتابعة', value: String(data.requests_summary.in_progress), icon: <Users size={24} />, bgColor: '#E0E7FF', color: '#4338CA' },
      { id: 7, label: 'عدد من رفضوا', value: String(data.requests_summary.rejected), icon: <Users size={24} />, bgColor: '#FEE2E2', color: '#DC2626' },
      { id: 8, label: 'عدد الداخلين في الإسلام', value: String(data.requests_summary.converted), icon: <UserCheck size={24} />, bgColor: '#D1FAE5', color: '#059669' }
    ];
  }, [data]);

  const conversionChartData = useMemo(() => {
    if (!data?.charts?.conversion_trends) return [];
    return data.charts.conversion_trends.flatMap((item) => ([
      { label: `${item.month} - Converts`, value: item.converts },
      { label: `${item.month} - Rejects`, value: item.rejects }
    ]));
  }, [data]);

  const acceptanceRateData = useMemo(() => {
    if (!data?.charts?.conversion_trends) return [];
    return data.charts.conversion_trends.map((item) => {
      const total = item.converts + item.rejects;
      const rate = total > 0 ? (item.converts / total) * 100 : 0;
      return { name: item.month, value1: Math.round(rate * 10) / 10 };
    });
  }, [data]);

  const escapeCsv = (value: string | number) => {
    const stringValue = String(value ?? '');
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const handleExportReport = () => {
    if (!data) return;

    const rows: string[][] = [
      ['القسم', 'المؤشر', 'القيمة'],
      ['بيانات الجمعية', 'اسم الجمعية', data.organization_info.name || '-'],
      ['بيانات الجمعية', 'المنطقة', data.organization_info.governorate || '-'],
      ['بيانات الجمعية', 'رقم الهاتف', data.organization_info.phone || '-'],
      ['بيانات الجمعية', 'البريد الإلكتروني', data.organization_info.email || '-'],
      ['ملخص الطلبات', 'إجمالي الحالات المسجلة', data.requests_summary.total],
      ['ملخص الطلبات', 'قيد المتابعة', data.requests_summary.in_progress],
      ['ملخص الطلبات', 'عدد من رفضوا', data.requests_summary.rejected],
      ['ملخص الطلبات', 'عدد الداخلين في الإسلام', data.requests_summary.converted]
    ];

    data.charts.requests_distribution.forEach((item) => {
      rows.push(['حالة الطلبات', item.label, item.value]);
    });

    data.charts.conversion_trends.forEach((item) => {
      rows.push(['من أسلموا/رفضوا', `${item.month} - Converts`, item.converts]);
      rows.push(['من أسلموا/رفضوا', `${item.month} - Rejects`, item.rejects]);
    });

    acceptanceRateData.forEach((item) => {
      rows.push(['نسبة القبول', item.name, `${item.value1}%`]);
    });

    data.charts.nationalities.forEach((item) => {
      rows.push(['الجنسيات', item.label, item.value]);
    });

    const csvContent = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `awqaf-association-report-${id || 'org'}.csv`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="awqaf-assoc-reports-page reports-state">
        <Loader2 size={38} className="spin-icon" />
        <p>جاري تحميل التقارير...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="awqaf-assoc-reports-page reports-state reports-state-error">
        <AlertCircle size={38} />
        <p>{error || 'حدث خطأ غير متوقع'}</p>
      </div>
    );
  }

  return (
    <div className="awqaf-assoc-reports-page">
      <h1 className="page-title">تقارير {data.organization_info.name}</h1>

      {/* Top Stats Grid */}
      <div className="reports-top-stats">
        {reportStats.map((stat) => (
          <div key={stat.id} className="report-stat-card">
            <div className="stat-icon" style={{ backgroundColor: stat.bgColor, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid-reports">
        <div className="chart-card">
          <div className="chart-header">
            <h3>من اسلموا / رفضوا</h3>
          </div>
          <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '250px' }}>
            <ConversionsChart data={conversionChartData} />
          </div>
        </div>
        <div className="chart-card">
          <h3>حالة الطلبات</h3>
          <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <RequestsChart data={data.charts.requests_distribution} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-header">
            <h3>نسبة القبول الشهرية</h3>
          </div>
          <div className="chart-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '250px' }}>
            <AcceptanceRateChart data={acceptanceRateData} />
          </div>
        </div>
      </div>

      <div className="reports-section">
        <h3>أعلى الجنسيات في الطلبات</h3>
        <div className="geography-container">
          {data.charts.nationalities.length === 0 && <p className="empty-text">لا توجد بيانات حالياً</p>}
          {data.charts.nationalities.map((row, idx) => {
            const maxValue = Math.max(...data.charts.nationalities.map((n) => n.value), 1);
            const rate = Math.round((row.value / maxValue) * 100);
            return (
              <div key={idx} className="geo-row">
                <span className="geo-name">{row.label}</span>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${rate}%`, backgroundColor: '#10B981' }} />
                </div>
                <span className="geo-rate">{row.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="reports-actions">
        <button className="btn-outline" onClick={() => navigate('/awqaf/associations')}>
          رجوع إلى صفحة الجمعيات
        </button>
        <button className="btn-primary" onClick={handleExportReport}><Download size={16} /> تصدير التقرير</button>
      </div>
    </div>
  );
};

export default AwqafAssociationReports;
