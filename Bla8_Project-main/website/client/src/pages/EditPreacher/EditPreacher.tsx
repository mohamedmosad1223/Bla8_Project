import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Upload, X, Check, AlertCircle, Loader2 } from 'lucide-react';
import { preacherService } from '../../services/preacherService';
import SuccessModal from '../../components/common/Modal/SuccessModal';
import '../AddCaller/AddCaller.css'; // تم تصحيح المسار



const EditPreacher = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedLangs, setSelectedLangs] = useState<number[]>([]);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if organization is suspended
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  const isSuspended = userData.status === 'suspended';

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    scientificQualification: '',
    email: '',
    gender: 'male',
    currentFile: '', // لتخزين مسار الملف الحالي
  });
  const [newFile, setNewFile] = useState<File | null>(null);
  const [availableLangs, setAvailableLangs] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // جلب بيانات الداعية الحالية
  useEffect(() => {
    const fetchPreacher = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const res = await preacherService.getById(id);
        const data = res.data?.data || res.data || res; // التعامل مع مختلف أشكال الـ Response
        
        console.log('Fetched Preacher Data:', data);

        // تحديث اللغات المتاحة من السيرفر
        if (data.all_available_languages) {
          setAvailableLangs(data.all_available_languages);
        }

        setFormData({
          fullName: data.full_name || '',
          phone: data.phone || '',
          scientificQualification: data.scientific_qualification || data.qualification || '',
          email: data.preacher_email || data.email || '',
          gender: data.gender || 'male',
          currentFile: data.qualification_file || '',
        });

        // ماب اللغات الحالية
        if (data.languages && Array.isArray(data.languages)) {
            // استخراج الـ IDs سواء كانت كائنات أو أرقام مباشرة
            const langIds = data.languages.map((l: any) => typeof l === 'object' ? l.language_id : l);
            setSelectedLangs(langIds.filter((val: any) => val != null));
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('تعذر تحميل بيانات الداعية');
      } finally {
        setLoading(false);
      }
    };
    fetchPreacher();
  }, [id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    }
    if (isLanguageDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isLanguageDropdownOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const clearField = (fieldName: string) => {
    if (isSuspended) return;
    if (fieldName === 'scientificQualification') {
        setFormData(prev => ({ ...prev, scientificQualification: '' }));
    } else if (fieldName === 'languages') {
        setSelectedLangs([]);
    }
  };

  const toggleLanguage = (langId: number) => {
    if (isSuspended) return;
    if (selectedLangs.includes(langId)) {
      setSelectedLangs(selectedLangs.filter(id => id !== langId));
    } else {
      setSelectedLangs([...selectedLangs, langId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || isSuspended) return;

    try {
      setSaveLoading(true);
      setError(null);
      
      const payload: any = new FormData();
      payload.append('full_name', formData.fullName);
      payload.append('phone', formData.phone);
      payload.append('preacher_email', formData.email);
      payload.append('scientific_qualification', formData.scientificQualification);
      payload.append('gender', formData.gender);
      
      if (newFile) {
        payload.append('qualification_file', newFile);
      }
      
      selectedLangs.forEach(langId => payload.append('languages', langId.toString()));
      
      await preacherService.update(id, payload);
      setShowModal(true);
    } catch (err: any) {
      console.error('Update error:', err);
      setError(err.response?.data?.detail || 'حدث خطأ أثناء تعديل البيانات');
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader2 className="spin-icon" size={40} />
    </div>
  );

  return (
    <div className="add-caller-page">
      <div className="notifications-header-area">
        <div className="breadcrumb">
          <button className="breadcrumb-link" onClick={() => navigate('/callers')}>
            دعاة الجمعية
          </button>
          <ChevronRight size={16} className="breadcrumb-separator" />
          <span className="breadcrumb-current">تعديل بيانات الداعية</span>
        </div>
        <h1 className="page-title">تعديل بيانات: {formData.fullName}</h1>
      </div>

      <div className="form-container">
        <form className="add-caller-form" onSubmit={handleSubmit}>
          {isSuspended && (
            <div className="error-alert" style={{ marginBottom: '20px' }}>
              <AlertCircle size={18} />
              <span>لا يمكنك تعديل بيانات الدعاة لأن حساب الجمعية موقوف حالياً.</span>
            </div>
          )}

          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}
          
          <div className="form-grid">
            <div className="form-group">
              <label>اسم الداعية بالكامل</label>
              <input type="text" name="fullName" className="form-input" value={formData.fullName} onChange={handleInputChange} required disabled={isSuspended} />
            </div>
            <div className="form-group">
              <label>رقم الهاتف</label>
              <input type="text" name="phone" className="form-input" value={formData.phone} onChange={handleInputChange} required disabled={isSuspended} />
            </div>

            <div className="form-group">
              <label>النوع</label>
              <select name="gender" className="form-input" value={formData.gender} onChange={handleInputChange} required disabled={isSuspended} style={{ appearance: 'auto' }}>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                المؤهل العلمي
                {formData.scientificQualification && !isSuspended && <X size={14} style={{ cursor: 'pointer', color: '#EF4444' }} onClick={() => clearField('scientificQualification')} title="مسح الحقل" />}
              </label>
              <input type="text" name="scientificQualification" className="form-input" value={formData.scientificQualification} onChange={handleInputChange} required disabled={isSuspended} />
            </div>

            <div className="form-group">
              <label>البريد الالكتروني (للتواصل)</label>
              <input type="email" name="email" className="form-input" value={formData.email} onChange={handleInputChange} required disabled={isSuspended} />
            </div>

            <div className="form-group relative" ref={dropdownRef}>
              <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                اللغة
                {selectedLangs.length > 0 && !isSuspended && <X size={14} style={{ cursor: 'pointer', color: '#EF4444' }} onClick={() => clearField('languages')} title="مسح الكل" />}
              </label>
              <div className={`tags-input-container form-input ${isSuspended ? 'disabled' : ''}`} onClick={() => !isSuspended && setIsLanguageDropdownOpen(!isLanguageDropdownOpen)} style={{ cursor: isSuspended ? 'not-allowed' : 'pointer', minHeight: '42px', height: 'auto' }}>
                <div className="tags-wrapper">
                  {selectedLangs.map((langId) => {
                    const lang = availableLangs.find(l => l.id === langId);
                    return (
                      <span key={langId} className="tag" onClick={(e) => e.stopPropagation()}>
                        {lang?.name}
                        {!isSuspended && (
                          <button type="button" className="tag-remove" onClick={(e) => { e.stopPropagation(); toggleLanguage(langId); }}>
                            <X size={14} />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
                {!isSuspended && (
                  <button type="button" className="tag-dropdown-btn">
                    <ChevronRight size={16} className={`transition-transform ${isLanguageDropdownOpen ? 'rotate-[-90deg]' : 'rotate-90deg'}`} />
                  </button>
                )}
              </div>

              {isLanguageDropdownOpen && !isSuspended && (
                <div className="language-dropdown-menu">
                  {availableLangs.map((lang) => {
                    const isSelected = selectedLangs.includes(lang.id);
                    return (
                      <div key={lang.id} className="language-dropdown-item" onClick={() => toggleLanguage(lang.id)}>
                        <div className={`checkbox-custom check-align-left ${isSelected ? 'checked' : ''}`}>
                          {isSelected && <Check size={12} strokeWidth={4} color="white" />}
                        </div>
                        <span>{lang.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className={`btn-save ${isSuspended ? 'disabled-btn' : ''}`} disabled={saveLoading || isSuspended}>
              {saveLoading ? <Loader2 size={18} className="spin-icon" /> : 'حفظ التعديلات'}
            </button>
          </div>
        </form>
      </div>

      <SuccessModal
        isOpen={showModal}
        onClose={() => {
            setShowModal(false);
            navigate('/callers');
        }}
        title="تم تحديث البيانات بنجاح"
        description="تم حفظ التعديلات الجديدة في النظام"
      />
    </div>
  );
};

export default EditPreacher;
