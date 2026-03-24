import { useState, useEffect } from 'react';
import { Search, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState<any>(null);

  // Update user data whenever route changes or custom auth event fires
  useEffect(() => {
    const updateUserData = () => {
      const rawData = localStorage.getItem('userData');
      setUserData(rawData ? JSON.parse(rawData) : null);
    };

    updateUserData(); // Initial load

    // Listen to storage changes (if logged in from another tab)
    window.addEventListener('storage', updateUserData);
    // Listen to our custom auth event (dispatched in authService)
    window.addEventListener('auth-change', updateUserData);

    return () => {
      window.removeEventListener('storage', updateUserData);
      window.removeEventListener('auth-change', updateUserData);
    };
  }, [location.pathname]); // Also re-eval on route change


  const roleLabels: Record<string, string> = {
    muslim_caller: 'مسلم داعي',
    interested: 'شخص مهتم',
    preacher: 'داعية',
    organization: 'جمعية',
    admin: 'مدير النظام',
  };

  // Safely extract role and name depending on if the data is nested or flat
  const userRole = userData?.user?.role || userData?.role || '';
  const fullName = userData?.profile?.full_name || userData?.profile?.name || userData?.full_name || userData?.name || 'مستخدم';

  const displayName = fullName;
  const displayRole = roleLabels[userRole] || userRole || '';
  const initials = displayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header className="header">
      <div className="header-search-container">
        <div className="search-input-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="بحث"
            className="search-input"
          />
        </div>
      </div>

      <div className="header-actions">
        <button
          className="notification-btn"
          onClick={() => navigate('/notifications')}
        >
          <Bell size={20} />
        </button>

        <div className="profile-section">
          <div className="profile-info">
            <span className="profile-name">{displayName}</span>
            <span className="profile-role">{displayRole}</span>
          </div>
          <div className="profile-avatar">
            <span className="avatar-initials">{initials}</span>
            <span className="status-indicator"></span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
