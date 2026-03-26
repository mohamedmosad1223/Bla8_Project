import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import './Header.css';

interface Notification {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

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

  // --- Notifications Logic ---
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications/');
      if (res.data?.data) {
        setNotifications(res.data.data);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifs();
    // Refresh notifications every 60s
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]); // Refresh when route changes too

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    if (showNotif) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotif]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(p => p.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      for (const n of unread) {
        await api.patch(`/notifications/${n.notification_id}/read`);
      }
      setNotifications(p => p.map(n => ({ ...n, is_read: true })));
    } catch { /* silent */ }
  };

  const formatNotifTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  };

  const handleNotifClick = (notif: Notification) => {
    if (!notif.is_read) markAsRead(notif.notification_id);
    
    // Navigate based on type
    if (notif.type === 'new_message' && notif.related_id) {
       navigate(`/conversations?request_id=${notif.related_id}`);
    } else if (notif.type === 'request_update') {
       navigate('/current-requests');
    } else if (notif.type === 'system_alert') {
       // Just mark as read
    }
    setShowNotif(false);
  };

  return (
    <header className="header">
      <div className="header-spacer"></div>
      <div className="header-actions">
        <div className="notification-wrapper" ref={notifRef}>
          <button
            className="notification-btn"
            onClick={() => setShowNotif(!showNotif)}
            style={{ position: 'relative' }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotif && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <h4>الإشعارات</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="notif-mark-all">
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>
              <div className="notif-body">
                {notifications.length === 0 ? (
                  <div className="notif-empty">لا توجد إشعارات</div>
                ) : (
                  notifications.map(notif => (
                    <div 
                      key={notif.notification_id} 
                      className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                      onClick={() => handleNotifClick(notif)}
                    >
                      <div className="notif-icon-wrap">
                        {notif.type === 'new_message' ? <Bell size={16} color="#DBA829" /> :
                         notif.type === 'request_update' ? <CheckCircle size={16} color="#10B981" /> :
                         <Clock size={16} color="#475569" />}
                      </div>
                      <div className="notif-content">
                        <strong className="notif-title">{notif.title}</strong>
                        <p className="notif-desc">{notif.message}</p>
                        <span className="notif-time">{formatNotifTime(notif.created_at)}</span>
                      </div>
                      {!notif.is_read && <span className="notif-dot"></span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
