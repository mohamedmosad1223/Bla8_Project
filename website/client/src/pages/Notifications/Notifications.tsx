import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="notifications-page" dir="rtl">
      <div className="notifications-header-area">
        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          عودة
          <ChevronRight size={16} />
        </button>
        <h1 className="page-title">الاشعارات</h1>
      </div>

      <div className="notifications-content">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer stroke/bell shape in gold */}
              <path d="M50 20C38 20 32 30 32 45V60C32 65 25 65 25 70H75C75 65 68 65 68 60V45C68 30 62 20 50 20Z" stroke="#dba841" strokeWidth="4" fill="white" strokeLinejoin="round" />
              {/* Clapper/Bottom blue arc */}
              <path d="M42 70C42 75 45 78 50 78C55 78 58 75 58 70" stroke="#166088" strokeWidth="4" strokeLinecap="round" fill="none" />
              {/* Top loop/hanger in gold */}
              <path d="M46 20C46 17 48 15 50 15C52 15 54 17 54 20" stroke="#dba841" strokeWidth="4" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <h2 className="empty-state-title">لا يوجد اشعارات في الوقت الحالي</h2>
          <p className="empty-state-description">
            تابعونا! لا توجد إشعارات حتى الآن. سنُعلمكم فور توفر شيء مهم لمشاركته.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
