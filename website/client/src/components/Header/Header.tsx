import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="header">
      
      <div className="header-actions">
        <button 
          className="notification-btn"
          onClick={() => navigate('/notifications')}
        >
          <Bell size={20} />
        </button>
        
        <div className="profile-section">
          <div className="profile-info">
            <span className="profile-name">اسم المشرف</span>
            <span className="profile-role">جمعية رسالة الإسلامية</span>
          </div>
          <div className="profile-avatar">
            <span className="avatar-initials">EL</span>
            <span className="status-indicator"></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
