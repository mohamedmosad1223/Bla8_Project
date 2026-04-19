import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, Clock, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n';
import './Header.css';

interface Notification {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir } = useLanguage();
  const isNonMuslim = localStorage.getItem('userRole') === 'non_muslim' || localStorage.getItem('userRole') === 'interested';

  const [userData, setUserData] = useState<any>(null);

  // Modal for rejection reason
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

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
    interested: isNonMuslim ? t('roles.interested') : 'شخص مهتم',
    non_muslim: isNonMuslim ? t('roles.interested') : 'شخص مهتم',
    preacher: 'داعية',
    organization: 'جمعية',
    admin: 'مدير النظام',
    minister: 'مشرف الأوقاف',
  };

  // Safely extract role and name depending on if the data is nested or flat
  const userRole = userData?.user?.role || userData?.role || '';
  const fullName = userData?.profile?.full_name || userData?.profile?.name || userData?.full_name || userData?.name || (isNonMuslim ? t('header.defaultUser') : 'مستخدم');

  const displayName = fullName.split(' ')[0];
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
    
    // Navigate based on type + role
    if (notif.type === 'new_message' && notif.related_id) {
      const role = localStorage.getItem('userRole');
      if (role === 'admin') {
        // Admin chat uses /admin/chat/:userId route
        navigate(`/admin/chat/${notif.related_id}`);
      } else if (role === 'non_muslim' || role === 'interested') {
        // Non-Muslim: related_id is always request_id
        navigate(`/conversations?request_id=${notif.related_id}`);
      } else {
        // Preacher / Organization: related_id can be request_id OR sender user_id (DM)
        // Use notify_id so Conversations.tsx can try both
        navigate(`/conversations?notify_id=${notif.related_id}`);
      }
    } else if (notif.type === 'request_update') {
       navigate('/current-requests');
    } else if (notif.type === 'account_rejected') {
       setSelectedNotif(notif);
    } else if (notif.type === 'system_alert') {
       // Just mark as read
    }
    setShowNotif(false);
  };

  return (
    <>
    {selectedNotif && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '8px', maxWidth: '400px', width: '90%', textAlign: 'center' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>{selectedNotif.title}</h3>
            <p style={{ lineHeight: 1.6, marginBottom: '1.5rem', color: '#374151' }}>{selectedNotif.body}</p>
            <button 
              onClick={() => setSelectedNotif(null)}
              style={{ background: '#f3f4f6', color: '#111827', border: '1px solid #d1d5db', padding: '0.5rem 1.5rem', borderRadius: '4px', cursor: 'pointer' }}
            >إغلاق</button>
          </div>
        </div>
    )}
    <header className="header" dir={isNonMuslim ? dir : 'rtl'}>
      {(!isNonMuslim || dir === 'rtl') && <div className="header-spacer"></div>}
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
                <h4>{isNonMuslim ? t('header.notifications') : 'الإشعارات'}</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="notif-mark-all">
                    {isNonMuslim ? t('header.markAllRead') : 'تحديد الكل كمقروء'}
                  </button>
                )}
              </div>
              <div className="notif-body">
                {notifications.length === 0 ? (
                  <div className="notif-empty">{isNonMuslim ? t('header.noNotifications') : 'لا توجد إشعارات'}</div>
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
                        <p className="notif-desc">{notif.body}</p>
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

        <div className="profile-section" onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <div className="profile-info">
            <span className="profile-name">{displayName}</span>
            <span className="profile-role">{displayRole}</span>
          </div>
          <div className="profile-avatar">
            {userData?.profile_picture ? (
              <img src={`/uploads/${userData.profile_picture}`} alt="" className="avatar-img" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span className="avatar-initials">{initials}</span>
            )}
            <span className="status-indicator"></span>
          </div>
        </div>
      </div>
      {(isNonMuslim && dir === 'ltr') && <div className="header-spacer"></div>}
      <button className="nm-hamburger-btn" onClick={() => window.dispatchEvent(new CustomEvent('nm-toggle-menu'))} aria-label="Open menu">
        <Menu size={24} />
      </button>
    </header>
    </>
  );
};

export default Header;
