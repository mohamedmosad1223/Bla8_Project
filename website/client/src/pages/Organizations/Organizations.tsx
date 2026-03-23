import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter as FilterIcon,
  Trash2,
  Eye,
  SortDesc,
  ChevronDown,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../../components/common/ConfirmModal/ConfirmModal';
import './Organizations.css';

interface Organization {
  id: string;
  name: string;
  supervisor: string;
  preachersCount: number;
  cases: number;
  converted: number;
  persuasion: number;
  rejected: number;
  createdAt: string;
  status: boolean;
}

const mockOrganizations: Organization[] = [
  {
    id: '123456',
    name: 'جمعية رسالة الاسلام',
    supervisor: 'احمد عاطف',
    preachersCount: 150,
    cases: 300,
    converted: 300,
    persuasion: 300,
    rejected: 300,
    createdAt: '22/02/2023\n7:00 AM',
    status: true
  }
];

const Organizations: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>(mockOrganizations);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('الكل');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<string | null>(null);

  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  // Close sort & filter menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortRef, filterRef]);

  const toggleAccordion = (name: string) => {
    setOpenAccordion(openAccordion === name ? null : name);
  };

  const toggleStatus = (_id: string, index: number) => {
    const newOrgs = [...organizations];
    newOrgs[index].status = !newOrgs[index].status;
    setOrganizations(newOrgs);
  };

  const handleDeleteClick = (id: string) => {
    setOrgToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (orgToDelete) {
      setOrganizations(organizations.filter(org => org.id !== orgToDelete));
      setIsDeleteModalOpen(false);
      setOrgToDelete(null);
    }
  };

  return (
    <div className="organizations-page" dir="rtl">
      <div className="organizations-header-area">
        <h1 className="page-title">الجمعيات</h1>

        <div className="organizations-actions">
          <button className="btn-primary" onClick={() => navigate('/organizations/add')}>
            <Plus size={18} />
            إضافة جمعية
          </button>

          <div className="search-filter-group">
            <div className="search-input-wrapper-outlined">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="بحث"
                className="search-input-outlined"
              />
            </div>

            <div className="filter-sort-group">
              <div className="filter-popup-container" ref={filterRef}>
                <button
                  className={`btn-icon-text ${isFilterOpen ? 'active' : ''}`}
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                  <FilterIcon size={18} />
                  فلتر
                </button>
                {isFilterOpen && (
                  <div className="filter-panel" dir="rtl">
                    <div className="filter-panel-header">
                      <h2 className="filter-title">الفلتر</h2>
                      <button className="btn-apply-filter" onClick={() => setIsFilterOpen(false)}>
                        تطبيق الفلتر
                      </button>
                    </div>

                    <div className="filter-body">
                      {/* Search */}
                      <div className="filter-search">
                        <Search size={16} className="filter-search-icon" />
                        <input type="text" placeholder="ابحث ....." className="filter-search-input" />
                      </div>

                      {/* Creation Date Accordion */}
                      <div className="filter-accordion">
                        <div
                          className="filter-accordion-header"
                          onClick={() => toggleAccordion('date')}
                        >
                          <span>تاريخ الانشاء</span>
                          <ChevronDown
                            size={16}
                            className={`text-gray transition-transform ${openAccordion === 'date' ? 'rotate-180' : ''}`}
                          />
                        </div>
                        {openAccordion === 'date' && (
                          <div className="filter-accordion-content mt-2">
                            <div className="filter-date-input active-outline relative-date-input">
                              <input
                                type="date"
                                className="custom-date-picker"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Status Accordion */}
                      <div className="filter-accordion no-border">
                        <div className="filter-accordion-header filter-status-header" onClick={() => toggleAccordion('status')}>
                          <span>الحالة</span>
                          <ChevronDown
                            size={16}
                            className={`text-gray transition-transform ${openAccordion === 'status' ? 'rotate-180' : ''}`}
                          />
                        </div>
                        {openAccordion === 'status' && (
                          <div className="filter-accordion-content status-content mt-2">
                            <label
                              className={`status-option ${selectedStatus === 'الكل' ? 'active-status' : ''}`}
                              onClick={() => setSelectedStatus('الكل')}
                            >
                              <div className={`checkbox-custom check-align-left ${selectedStatus === 'الكل' ? 'checked-gold' : ''}`}>
                                {selectedStatus === 'الكل' && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>الكل</span>
                            </label>
                            <label
                              className={`status-option ${selectedStatus === 'مفعل' ? 'active-status' : ''}`}
                              onClick={() => setSelectedStatus('مفعل')}
                            >
                              <div className={`checkbox-custom check-align-left ${selectedStatus === 'مفعل' ? 'checked-gold' : ''}`}>
                                {selectedStatus === 'مفعل' && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>مفعل</span>
                            </label>
                            <label
                              className={`status-option ${selectedStatus === 'غير مفعل' ? 'inactive-status' : ''}`}
                              onClick={() => setSelectedStatus('غير مفعل')}
                            >
                              <div className={`checkbox-custom check-align-left ${selectedStatus === 'غير مفعل' ? 'checked-gold' : ''}`}>
                                {selectedStatus === 'غير مفعل' && <Check size={12} strokeWidth={3} color="white" />}
                              </div>
                              <span>غير مفعل</span>
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="sort-container" ref={sortRef}>
                <button
                  className={`btn-icon-text ${isSortOpen ? 'active' : ''}`}
                  onClick={() => setIsSortOpen(!isSortOpen)}
                >
                  <SortDesc size={18} />
                  تصنيف
                </button>
                {isSortOpen && (
                  <div className="sort-dropdown">
                    <div className="sort-dropdown-title">تصنيف</div>
                    <button className="sort-option">الاحدث</button>
                    <button className="sort-option">الأقدم</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="organizations-content">
        <div className="table-responsive">
          <table className="org-table">
            <thead>
              <tr>
                <th>رقم <span className="sort-arrow">↕</span></th>
                <th>اسم الجمعية <span className="sort-arrow">↕</span></th>
                <th>المشرف <span className="sort-arrow">↕</span></th>
                <th>عدد الدعاة <span className="sort-arrow">↕</span></th>
                <th>الحالات <span className="sort-arrow">↕</span></th>
                <th>أسلم <span className="sort-arrow">↕</span></th>
                <th>قيد الاقناع <span className="sort-arrow">↕</span></th>
                <th>رفض <span className="sort-arrow">↕</span></th>
                <th>تاريخ الانشاء <span className="sort-arrow">↕</span></th>
                <th>مفعل / غير مفعل <span className="sort-arrow">↕</span></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((org, index) => (
                <tr key={index}>
                  <td>{org.id}</td>
                  <td className="org-name-cell">{org.name}</td>
                  <td>{org.supervisor}</td>
                  <td>{org.preachersCount}</td>
                  <td>{org.cases}</td>
                  <td>{org.converted}</td>
                  <td>{org.persuasion}</td>
                  <td>{org.rejected}</td>
                  <td className="date-cell">{org.createdAt}</td>
                  <td>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={org.status}
                        onChange={() => toggleStatus(org.id, index)}
                      />
                      <span className="slider round"></span>
                    </label>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="action-icon-btn delete"
                      onClick={() => handleDeleteClick(org.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      className="action-icon-btn view"
                      onClick={() => navigate(`/organizations/${org.id}`)}
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="حذف الجمعية"
        message="هل تود أن تتخذ هذا الاجراء ؟"
        confirmLabel="تأكيد"
        cancelLabel="الغاء"
      />

      {/* Footer Branding */}
      <div className="pixel-perfect-footer">v4.1.4 Pixel Perfect</div>
    </div>
  );
};

export default Organizations;
