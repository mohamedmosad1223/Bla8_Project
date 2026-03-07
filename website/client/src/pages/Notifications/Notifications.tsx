import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();

  return (
    <div className="notifications-page">
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
            {/* Custom Bell Icon resembling the design */}
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="#DBA841" stroke="#DBA841" strokeWidth="0.5"/>
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22Z" fill="#166088"/>
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
