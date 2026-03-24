import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, Plus, MessageCircle } from 'lucide-react';
import './AdminAssociations.css';

// ─── Mock Data ──────────────────────────────────────────────
const mockData = Array.from({ length: 14 }, (_, i) => ({
  id: `12345${i + 1}`,
  name: i % 3 === 0 ? 'جمعية الحضارة القديمة' : i % 3 === 1 ? 'جمعية مسلمون له' : 'جمعية رسالة الاسلام',
  supervisor: 'احمد عاطف',
  preachers: [150, 200, 300, 120, 600, 158, 220][i % 7],
  cases: [300, 500, 225, 365, 123, 258, 369][i % 7],
  converted: [300, 500, 225, 365, 123, 258, 369][i % 7],
  pending: [300, 500, 225, 365, 123, 258, 369][i % 7],
  rejected: [300, 500, 225, 365, 123, 258, 369][i % 7],
  createdAt: '22/02/2023\n7:00 AM',
  active: i % 3 !== 1,
}));

const AdminAssociations = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState(mockData);
  const [showSort, setShowSort] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const navigate = useNavigate();

  const filtered = data.filter(
    (row) => row.name.includes(search) || row.supervisor.includes(search)
  );

  const toggleActive = (id: string) => {
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, active: !row.active } : row))
    );
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      setData((prev) => prev.filter((row) => row.id !== itemToDelete));
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  return (
    <div className="aadmin-page">
      {/* ── Page Header ── */}
      <div className="aadmin-header">
        <h1 className="aadmin-title">الجمعيات</h1>
        <button 
          className="aadmin-add-btn"
          onClick={() => navigate('/admin/associations/add')}
        >
          <Plus size={16} />
          اضافة جمعية
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className="aadmin-toolbar">
        {/* Everything on the left */}
        <div className="aadmin-toolbar-left">
          
          {/* Search */}
          <div className="aadmin-search-wrapper">
            <svg className="aadmin-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              type="text"
              placeholder="ابحث"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="aadmin-search-input"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="aadmin-dropdown-container">
            <button
              className="aadmin-tool-btn"
              onClick={() => {
                setShowFilter(!showFilter);
                setShowSort(false);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
              فلتر
            </button>
            {showFilter && (
              <div className="aadmin-dropdown-menu filter-menu">
                <div className="filter-header">
                  <h3 className="filter-title">الفلتر</h3>
                  <button className="filter-apply-btn">تطبيق الفلتر</button>
                </div>
                
                <div className="filter-search-box">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input type="text" placeholder="ابحث ..." />
                </div>

                <div className="filter-section">
                  <div 
                    className="filter-section-title"
                    onClick={() => setShowCalendar(!showCalendar)}
                    style={{ cursor: 'pointer' }}
                  >
                    تاريخ الانشاء
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showCalendar ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  <div className="filter-date-input" onClick={() => setShowCalendar(!showCalendar)} style={{ cursor: 'pointer' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <span>00/00/0000 00:00 PM</span>
                  </div>

                  {/* Calendar Widget */}
                  {showCalendar && (
                    <div className="calendar-widget">
                      <div className="cal-header">
                        <button className="cal-nav-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg></button>
                        <span className="cal-month">سبتمبر 2025</span>
                        <button className="cal-nav-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg></button>
                      </div>
                      
                      <div className="cal-grid">
                        <span className="cal-day-name">سبت</span>
                        <span className="cal-day-name">احد</span>
                        <span className="cal-day-name">اثنين</span>
                        <span className="cal-day-name">ثلاثاء</span>
                        <span className="cal-day-name">اربعاء</span>
                        <span className="cal-day-name">خميس</span>
                        <span className="cal-day-name">جمعة</span>

                        <span className="cal-day dim">31</span>
                        <span className="cal-day">1</span>
                        <span className="cal-day">2</span>
                        <span className="cal-day">3</span>
                        <span className="cal-day">4</span>
                        <span className="cal-day">5</span>
                        <span className="cal-day">6</span>
                        
                        <span className="cal-day">7</span>
                        <span className="cal-day">8</span>
                        <span className="cal-day">9</span>
                        <span className="cal-day">10</span>
                        <span className="cal-day">11</span>
                        <span className="cal-day">12</span>
                        <span className="cal-day">13</span>

                        <span className="cal-day">14</span>
                        <span className="cal-day">15</span>
                        <span className="cal-day">16</span>
                        <span className="cal-day selected">17</span>
                        <span className="cal-day">18</span>
                        <span className="cal-day">19</span>
                        <span className="cal-day">20</span>

                        <span className="cal-day">21</span>
                        <span className="cal-day">22</span>
                        <span className="cal-day">23</span>
                        <span className="cal-day">24</span>
                        <span className="cal-day">25</span>
                        <span className="cal-day">26</span>
                        <span className="cal-day">27</span>

                        <span className="cal-day">28</span>
                        <span className="cal-day">29</span>
                        <span className="cal-day">30</span>
                        <span className="cal-day">31</span>
                        <span className="cal-day dim">1</span>
                        <span className="cal-day dim">2</span>
                        <span className="cal-day dim">3</span>
                      </div>

                      <div className="cal-time-picker">
                        <span className="cal-time-label">الوقت</span>
                        <div className="cal-time-inputs">
                          <div className="cal-time-box">01</div>
                          <span>:</span>
                          <div className="cal-time-box">30</div>
                          <div className="cal-am-pm">
                            <span>مساءا</span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="aadmin-dropdown-container">
            <button
              className="aadmin-tool-btn"
              onClick={() => {
                setShowSort(!showSort);
                setShowFilter(false);
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
              تصنيف
            </button>
            {showSort && (
              <div className="aadmin-dropdown-menu sort-menu">
                <button className="sort-option">الاحدث</button>
                <button className="sort-option active">الاقدم</button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Table ── */}
      <div className="aadmin-table-wrapper">
        <table className="aadmin-table">
          <thead>
              <tr>
              <th>رقم <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><polyline points="6 9 12 15 18 9"/></svg></th>
              <th>اسم الجمعية <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><polyline points="6 9 12 15 18 9"/></svg></th>
              <th>المشرف <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><polyline points="6 9 12 15 18 9"/></svg></th>
              <th>عدد الدعاة <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><polyline points="6 9 12 15 18 9"/></svg></th>
              <th>الحالات <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><polyline points="6 9 12 15 18 9"/></svg></th>
              <th>أسلم <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><polyline points="6 9 12 15 18 9"/></svg></th>
              <th>قيد الاقناع <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><polyline points="6 9 12 15 18 9"/></svg></th>
              <th>رفض <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><polyline points="6 9 12 15 18 9"/></svg></th>
              <th>تاريخ الانشاء <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><polyline points="6 9 12 15 18 9"/></svg></th>
              <th>مفعل / غير مفعل <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: 4}}><polyline points="6 9 12 15 18 9"/></svg></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.name}</td>
                <td>{row.supervisor}</td>
                <td>{row.preachers}</td>
                <td>{row.cases}</td>
                <td>{row.converted}</td>
                <td>{row.pending}</td>
                <td>{row.rejected}</td>
                <td className="aadmin-date">{row.createdAt}</td>
                <td>
                  <label className="aadmin-toggle">
                    <input
                      type="checkbox"
                      checked={row.active}
                      onChange={() => toggleActive(row.id)}
                    />
                    <span className="aadmin-toggle-slider" />
                  </label>
                </td>
                <td>
                  <div className="aadmin-row-actions">
                    <button
                      className="aadmin-icon-btn aadmin-view-btn"
                      title="عرض"
                      onClick={() => navigate(`/admin/associations/${row.id}`)}
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      className="aadmin-icon-btn aadmin-chat-btn"
                      title="محادثة"
                      onClick={() => navigate(`/admin/chat/${row.id}`)}
                      style={{ color: '#dba841' }}
                    >
                      <MessageCircle size={15} />
                    </button>
                    <button
                      className="aadmin-icon-btn aadmin-delete-btn"
                      title="حذف"
                      onClick={() => handleDeleteClick(row.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="aadmin-modal-overlay">
          <div className="aadmin-delete-modal">
            <button 
              className="aadmin-modal-close" 
              onClick={() => setShowDeleteModal(false)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="aadmin-delete-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
            <h2 className="aadmin-delete-title">حذف الجمعية</h2>
            <p className="aadmin-delete-text">هل تود ان تتخذ هذا الاجراء ؟</p>
            <div className="aadmin-delete-actions">
              <button 
                className="aadmin-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >الالغاء</button>
              <button 
                className="aadmin-btn-confirm"
                onClick={confirmDelete}
              >تأكيد</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAssociations;
