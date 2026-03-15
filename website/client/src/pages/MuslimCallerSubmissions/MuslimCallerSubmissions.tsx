import { useState } from 'react';
import { Search, SlidersHorizontal, Calendar, Clock } from 'lucide-react';
import './MuslimCallerSubmissions.css';

/* ── Dummy data ── */
interface Submission {
  id: number;
  name: string;
  status: 'converted' | 'in_progress' | 'rejected';
  statusLabel: string;
  submissionDate: string;
  lastUpdate: string;
}

const dummySubmissions: Submission[] = [
  {
    id: 1, name: 'ديفيد كارتر',
    status: 'converted', statusLabel: 'اسلم الحمدلله',
    submissionDate: '22-01-2023-7:00 AM', lastUpdate: 'منذ يوم',
  },
  {
    id: 2, name: 'جوزيف سميث',
    status: 'in_progress', statusLabel: 'قيد الاقناع',
    submissionDate: '22-01-2023-7:00 AM', lastUpdate: 'منذ يوم',
  },
  {
    id: 3, name: 'وليام ألكسندر',
    status: 'rejected', statusLabel: 'رفض',
    submissionDate: '22-01-2023-7:00 AM', lastUpdate: 'منذ يوم',
  },
];

const MuslimCallerSubmissions = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredSubmissions = dummySubmissions.filter(sub => {
    const matchesSearch = sub.name.includes(searchQuery) || sub.statusLabel.includes(searchQuery);
    const matchesFilter = activeFilter ? sub.status === activeFilter : true;
    return matchesSearch && matchesFilter;
  });

  const filterOptions = [
    { key: null, label: 'الكل' },
    { key: 'converted', label: 'اسلم الحمدلله' },
    { key: 'in_progress', label: 'قيد الاقناع' },
    { key: 'rejected', label: 'رفض' },
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

      {/* Submissions Grid */}
      <div className="mcd-grid">
        {filteredSubmissions.map(sub => (
          <div key={sub.id} className="mcd-card">
            {/* Status Badge */}
            <div className={`mcd-badge mcd-badge--${sub.status}`}>
              {sub.statusLabel}
            </div>

            {/* Name */}
            <h3 className="mcd-card-name">{sub.name}</h3>

            {/* Submission Date */}
            <div className="mcd-card-detail">
              <Calendar size={14} className="mcd-detail-icon" />
              <span className="mcd-detail-label">تاريخ التقديم</span>
            </div>
            <div className="mcd-card-date">{sub.submissionDate}</div>

            {/* Last Update */}
            <div className="mcd-card-detail">
              <Clock size={14} className="mcd-detail-icon" />
              <span className="mcd-detail-label">اخر تحديث</span>
            </div>
            <div className="mcd-card-date">{sub.lastUpdate}</div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredSubmissions.length === 0 && (
        <div className="mcd-empty">
          <p>لا توجد تقديمات حالياً</p>
        </div>
      )}
    </div>
  );
};

export default MuslimCallerSubmissions;
