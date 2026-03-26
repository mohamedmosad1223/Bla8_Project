import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Loader2, MapPin, Phone, TrendingUp } from 'lucide-react';
import { ministerService } from '../../services/ministerService';
import './AwqafAssociations.css';

interface OrganizationCard {
  org_id: number;
  organization_name: string;
  governorate?: string | null;
  phone?: string | null;
  stats: {
    new_muslims: number;
    interested_count: number;
    preachers_count: number;
    conversion_rate: number;
  };
}

const AwqafAssociations = () => {
  const [search, setSearch] = useState('');
  const [associations, setAssociations] = useState<OrganizationCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await ministerService.getOrganizations(search.trim() || undefined);
        setAssociations(Array.isArray(result) ? result : []);
      } catch (err) {
        console.error('Organizations fetch error:', err);
        setError('تعذر تحميل بيانات الجمعيات. حاول مرة أخرى.');
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  return (
    <div className="awqaf-assoc-page">
      <div className="awqaf-assoc-header">
        <h1 className="page-title">الجمعيات</h1>
        <div className="assoc-search-bar">
          <input
            type="text"
            placeholder="بحث عن جمعية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="assoc-search-input"
          />
        </div>
      </div>

      {loading && (
        <div className="assoc-state">
          <Loader2 size={36} className="spin-icon" />
          <p>جاري تحميل الجمعيات...</p>
        </div>
      )}

      {!loading && error && (
        <div className="assoc-state assoc-state-error">
          <AlertCircle size={36} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="assoc-grid">
          {associations.map((assoc) => (
            <div key={assoc.org_id} className="assoc-card">
              {/* ── Dark header ── */}
              <div className="assoc-card-top">
                <span className="assoc-card-name">{assoc.organization_name}</span>
                <div className="assoc-card-avatar">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </div>

              {/* ── Meta ── */}
              <div className="assoc-meta">
                <div className="assoc-meta-row">
                  <MapPin size={13} className="assoc-meta-icon" />
                  <span>المنطقة: {assoc.governorate || 'غير محدد'}</span>
                </div>
                <div className="assoc-meta-row">
                  <Phone size={13} className="assoc-meta-icon" />
                  <span>هاتف: {assoc.phone || 'غير متوفر'}</span>
                </div>
              </div>

              {/* ── 2×2 Stats ── */}
              <div className="assoc-stats-grid">
                <div className="assoc-stat-cell">
                  <span className="assoc-stat-num gold">{assoc.stats.new_muslims}</span>
                  <span className="assoc-stat-lbl">مسلمون جدد</span>
                </div>
                <div className="assoc-stat-cell">
                  <span className="assoc-stat-num">{assoc.stats.interested_count}</span>
                  <span className="assoc-stat-lbl">المهتمين</span>
                </div>
                <div className="assoc-stat-cell">
                  <span className="assoc-stat-num">{assoc.stats.preachers_count}</span>
                  <span className="assoc-stat-lbl">الدعاة</span>
                </div>
                <div className="assoc-stat-cell">
                  <span className="assoc-stat-num gold">{assoc.stats.conversion_rate}%</span>
                  <span className="assoc-stat-lbl">معدل التحويل</span>
                </div>
              </div>

              {/* ── Buttons ── */}
              <div className="assoc-actions">
                <button
                  className="assoc-btn assoc-btn-outline"
                  onClick={() => navigate(`/awqaf/associations/${assoc.org_id}/details`)}
                >
                  عرض التفاصيل
                </button>
                <button
                  className="assoc-btn assoc-btn-dark"
                  onClick={() => navigate(`/awqaf/associations/${assoc.org_id}/reports`)}
                >
                  التقارير
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && associations.length === 0 && (
        <div className="assoc-empty">
          <TrendingUp size={40} className="assoc-empty-icon" />
          <p>لا توجد جمعيات مطابقة للبحث</p>
        </div>
      )}
    </div>
  );
};

export default AwqafAssociations;
