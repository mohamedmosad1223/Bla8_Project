import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Calendar, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './AddOrganization.css';

const AddOrganization: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    supervisor: '',
    licenseNumber: '',
    country: '',
    email: '',
    phone: '',
    address: '',
    foundationDate: '',
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form Submit:', formData);
    // Logic to save
  };

  return (
    <div className="add-org-page" dir="rtl">
      {/* Breadcrumbs */}
      <div className="breadcrumb-area">
        <nav className="breadcrumbs">
          <Link to="/organizations">الجمعيات</Link>
          <ChevronLeft size={14} className="breadcrumb-separator" />
          <span className="current-page">اضافة جمعية جديدة</span>
        </nav>
        <h1 className="page-title-main">اضافة جمعية جديدة</h1>
      </div>

      {/* Form Card */}
      <div className="form-card">
        <form onSubmit={handleSubmit} className="add-org-form">
          <div className="form-grid">
            {/* Row 1 */}
            <div className="form-group">
              <label>اسم الجمعية</label>
              <input 
                type="text" 
                name="name"
                placeholder="اسم الجمعية"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>اسم مشرف الجمعية</label>
              <input 
                type="text" 
                name="supervisor"
                placeholder="اسم مشرف الجمعية"
                value={formData.supervisor}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Row 2 */}
            <div className="form-group">
              <label>رقم السجل / الترخيص</label>
              <input 
                type="text" 
                name="licenseNumber"
                placeholder="رقم السجل / الترخيص"
                value={formData.licenseNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>الدولة</label>
              <div className="select-wrapper">
                <select 
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                >
                  <option value="" disabled>الدولة</option>
                  <option value="egypt">مصر</option>
                  <option value="saudi">السعودية</option>
                  <option value="kuwait">الكويت</option>
                </select>
              </div>
            </div>

            {/* Row 3 */}
            <div className="form-group">
              <label>البريد الالكتروني</label>
              <input 
                type="email" 
                name="email"
                placeholder="البريد الالكتروني"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>رقم الهاتف الخاص بالجمعية</label>
              <input 
                type="tel" 
                name="phone"
                placeholder="رقم الهاتف الخاص بالجمعية"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Row 4 */}
            <div className="form-group">
              <label>عنوان الجمعية</label>
              <input 
                type="text" 
                name="address"
                placeholder="عنوان الجمعية"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>تاريخ تأسيس الجمعية</label>
              <div className="date-input-wrapper">
                <input 
                  type="date" 
                  name="foundationDate"
                  value={formData.foundationDate}
                  onChange={handleInputChange}
                  required
                />
                <Calendar size={18} className="input-icon" />
              </div>
            </div>

            {/* Row 5 */}
            <div className="form-group">
              <label>كلمة السر</label>
              <div className="password-input-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="كلمة السر"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>تأكيد كلمة السر</label>
              <div className="password-input-wrapper">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  name="confirmPassword"
                  placeholder="تأكيد كلمة السر"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className="btn-save">حفظ</button>
          </div>
        </form>
      </div>
      
      {/* Footer Branding */}
      <div className="pixel-perfect-footer">v4.1.4 Pixel Perfect</div>
    </div>
  );
};

export default AddOrganization;
