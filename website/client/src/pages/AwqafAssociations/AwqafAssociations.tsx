import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, TrendingUp } from 'lucide-react';
import './AwqafAssociations.css';

const mockAssociations = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: 'جمعية الهداية الخيرية',
  region: 'المنطقة العامة',
  phone: '34567890',
  newMuslims: 32,
  interested: 324,
  preachers: 15,
  conversionRate: 8.3,
}));

const AwqafAssociations = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = mockAssociations.filter((a) =>
    a.name.includes(search) || a.region.includes(search)
  );

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

      <div className="assoc-grid">
        {filtered.map((assoc) => (
          <div key={assoc.id} className="assoc-card">

            {/* ── Dark header ── */}
            <div className="assoc-card-top">
              <span className="assoc-card-name">{assoc.name}</span>
              <div className="assoc-card-avatar">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>

            {/* ── Meta ── */}
            <div className="assoc-meta">
              <div className="assoc-meta-row">
                <MapPin size={13} className="assoc-meta-icon" />
                <span>المنطقة: {assoc.region}</span>
              </div>
              <div className="assoc-meta-row">
                <Phone size={13} className="assoc-meta-icon" />
                <span>هاتف: {assoc.phone}</span>
              </div>
            </div>

            {/* ── 2×2 Stats ── */}
            <div className="assoc-stats-grid">
              <div className="assoc-stat-cell">
                <span className="assoc-stat-num gold">{assoc.newMuslims}</span>
                <span className="assoc-stat-lbl">مسلمون جدد</span>
              </div>
              <div className="assoc-stat-cell">
                <span className="assoc-stat-num">{assoc.interested}</span>
                <span className="assoc-stat-lbl">المهتمين</span>
              </div>
              <div className="assoc-stat-cell">
                <span className="assoc-stat-num">{assoc.preachers}</span>
                <span className="assoc-stat-lbl">الدعاة</span>
              </div>
              <div className="assoc-stat-cell">
                <span className="assoc-stat-num gold">{assoc.conversionRate}%</span>
                <span className="assoc-stat-lbl">معدل التحويل</span>
              </div>
            </div>

            {/* ── Buttons ── */}
            <div className="assoc-actions">
              <button 
                className="assoc-btn assoc-btn-outline"
                onClick={() => navigate(`/awqaf/associations/${assoc.id}/details`)}
              >
                عرض التفاصيل
              </button>
              <button 
                className="assoc-btn assoc-btn-dark"
                onClick={() => navigate(`/awqaf/associations/${assoc.id}/reports`)}
              >
                التقارير
              </button>
            </div>

          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="assoc-empty">
          <TrendingUp size={40} className="assoc-empty-icon" />
          <p>لا توجد جمعيات مطابقة للبحث</p>
        </div>
      )}
    </div>
  );
};

export default AwqafAssociations;
