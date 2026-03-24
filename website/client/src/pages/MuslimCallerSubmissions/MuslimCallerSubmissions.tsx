import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Calendar, Clock } from 'lucide-react';
import { dawahRequestService } from '../../services/dawahRequestService';
import './MuslimCallerSubmissions.css';

interface Submission {
  request_id: number;
  invited_name: string;
  status: string;
  submission_date: string;
  updated_at: string;
}

const statusMap: Record<string, { label: string; cssKey: string }> = {
  pending:          { label: 'قيد الانتظار',  cssKey: 'pending' },
  in_progress:      { label: 'قيد الاقناع',   cssKey: 'in_progress' },
  under_persuasion: { label: 'تحت الإقناع',   cssKey: 'in_progress' },
  converted:        { label: 'اسلم الحمدلله', cssKey: 'converted' },
  rejected:         { label: 'رفض',           cssKey: 'rejected' },
  no_response:      { label: 'لا يوجد رد',    cssKey: 'rejected' },
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

const MuslimCallerSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const res = await dawahRequestService.getMySubmissions();
        setSubmissions(res?.data || []);
      } catch (err: any) {
        console.error('Submissions fetch error:', err.response?.data || err);
        setError('تعذر تحميل التقديمات');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, []);

  const filteredSubmissions = submissions.filter(sub => {
    const fullName = sub.invited_name || '';
    const matchesSearch = fullName.includes(searchQuery);
    const matchesFilter = activeFilter ? sub.status === activeFilter : true;
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { key: null,          label: 'الكل' },
    { key: 'converted',   label: 'اسلم الحمدلله' },
    { key: 'in_progress', label: 'قيد الاقناع' },
    { key: 'pending',     label: 'قيد الانتظار' },
    { key: 'rejected',    label: 'رفض' },
  ];

  return (
    <div className="mcd-page">
      {/* Search Bar */}
      <div className="mcd-search-row">
        <div className="mcd-search-wrapper">
          <Search size={18} className="mcd-search-icon" />
          <input
            type="text"
            placeholder="ابحث"
            className="mcd-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="mcd-filter-btn" title="فلتر">
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* Filter Tags */}
      <div className="mcd-filter-tags">
        {filterOptions.map(f => (
          <button
            key={f.key ?? 'all'}
            className={`mcd-filter-tag ${activeFilter === f.key ? 'active' : ''}`}
            onClick={() => setActiveFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading / Error */}
      {loading && <div className="mcd-empty"><p>جاري التحميل...</p></div>}
      {error && <div className="mcd-empty"><p style={{ color: 'red' }}>{error}</p></div>}

      {/* Submissions Grid */}
      {!loading && !error && (
        <div className="mcd-grid">
          {filteredSubmissions.map(sub => {
            const fullName = sub.invited_name || '';
            const statusInfo = statusMap[sub.status] || { label: sub.status, cssKey: 'pending' };
            return (
              <div key={sub.request_id} className="mcd-card">
                <div className={`mcd-badge mcd-badge--${statusInfo.cssKey}`}>
                  {statusInfo.label}
                </div>
                <h3 className="mcd-card-name">{fullName || 'بدون اسم'}</h3>
                <div className="mcd-card-detail">
                  <Calendar size={14} className="mcd-detail-icon" />
                  <span className="mcd-detail-label">تاريخ التقديم</span>
                </div>
                <div className="mcd-card-date">{formatDate(sub.submission_date)}</div>
                <div className="mcd-card-detail">
                  <Clock size={14} className="mcd-detail-icon" />
                  <span className="mcd-detail-label">اخر تحديث</span>
                </div>
                <div className="mcd-card-date">{formatDate(sub.updated_at)}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredSubmissions.length === 0 && (
        <div className="mcd-empty">
          <p>لا توجد تقديمات حالياً</p>
        </div>
      )}
    </div>
  );
};

export default MuslimCallerSubmissions;
