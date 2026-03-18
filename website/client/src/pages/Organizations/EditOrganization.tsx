import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Eye, 
  EyeOff, 
  Calendar,
  ChevronDown
} from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StatusModal from '../../components/common/StatusModal/StatusModal';
import './EditOrganization.css';

const EditOrganization: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  // Mock initial data - should be fetched based on 'id'
  const [formData, setFormData] = useState({
    orgName: 'جمعية رسالة الاسلام',
    supervisorName: 'احمد عاطف',
    regNumber: '56552641625263263',
    country: 'الكويت',
    email: 'Ahmed@gmail.com',
    phone: '+201155591759',
    address: 'يكتب العنوان',
    establishedDate: '2025-06-25',
    password: 'password123',
    confirmPassword: 'password123'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Updating organization:', formData);
    // Add API call here
    setIsSuccessModalOpen(true);
  };

  const handleModalClose = () => {
    setIsSuccessModalOpen(false);
    navigate(`/organizations/${id}`);
  };

  return (
    <div className="edit-org-page" dir="rtl">
      {/* Breadcrumbs */}
      <div className="breadcrumb-area">
        <nav className="breadcrumbs">
          <Link to="/organizations">الجمعية</Link>
          <ChevronLeft size={14} className="breadcrumb-separator" />
          <span className="current-page">تعديل بيانات الجمعية</span>
        </nav>
        <h1 className="page-title-main">تعديل بيانات الجمعية</h1>
      </div>

      <div className="form-container-main section-card animate-fade-in">
        <form onSubmit={handleSubmit} className="edit-org-form">
          <div className="form-grid-two-col">
            {/* Row 1 */}
            <div className="form-group">
              <label>اسم الجمعية</label>
              <input 
                type="text" 
                name="orgName"
                value={formData.orgName}
                onChange={handleChange}
                placeholder="اسم الجمعية"
              />
            </div>
            <div className="form-group">
              <label>اسم مشرف الجمعية</label>
              <input 
                type="text" 
                name="supervisorName"
                value={formData.supervisorName}
                onChange={handleChange}
                placeholder="اسم مشرف الجمعية"
              />
            </div>

            {/* Row 2 */}
            <div className="form-group">
              <label>رقم السجل / الترخيص</label>
              <input 
                type="text" 
                name="regNumber"
                value={formData.regNumber}
                onChange={handleChange}
                placeholder="56552641625263263"
              />
            </div>
            <div className="form-group">
              <label>الدولة</label>
              <div className="select-wrapper-custom">
                <select 
                  name="country" 
                  value={formData.country} 
                  onChange={handleChange}
                >
                  <option value="الكويت">الكويت</option>
                  <option value="مصر">مصر</option>
                  <option value="السعودية">السعودية</option>
                </select>
                <ChevronDown size={14} className="select-arrow" />
              </div>
            </div>

            {/* Row 3 */}
            <div className="form-group">
              <label>البريد الالكتروني</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ahmed@gmail.com"
              />
            </div>
            <div className="form-group">
              <label>رقم الهاتف الخاص بالجمعية</label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+201155591759"
              />
            </div>

            {/* Row 4 */}
            <div className="form-group">
              <label>عنوان الجمعية</label>
              <input 
                type="text" 
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="يكتب العنوان"
              />
            </div>
            <div className="form-group">
              <label>تاريخ تأسيس الجمعية</label>
              <div className="date-input-wrapper-custom">
                <input 
                  type="date" 
                  name="establishedDate"
                  value={formData.establishedDate}
                  onChange={handleChange}
                />
                <Calendar size={18} className="calendar-icon" />
              </div>
            </div>

            {/* Row 5 */}
            <div className="form-group password-field">
              <label>كلمة السر</label>
              <div className="input-with-icon">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="123456"
                />
                <button 
                  type="button" 
                  className="icon-btn-inside"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group password-field">
              <label>تأكيد كلمة السر</label>
              <div className="input-with-icon">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'} 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="123456"
                />
                <button 
                  type="button" 
                  className="icon-btn-inside"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="form-actions-row">
            <button type="submit" className="btn-save-changes">حفظ التعديل</button>
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>الغاء</button>
          </div>
        </form>
      </div>

      <StatusModal 
        isOpen={isSuccessModalOpen}
        onClose={handleModalClose}
        type="success"
        title="تم بنجاح!"
        message="لقد تم تعديل الجمعية بنجاح"
        actionLabel="تم"
        onAction={handleModalClose}
      />

      <div className="pixel-perfect-footer">v4.1.4 Pixel Perfect</div>
    </div>
  );
};

export default EditOrganization;
