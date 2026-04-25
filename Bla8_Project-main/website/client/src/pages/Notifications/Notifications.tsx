import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Bell, CheckCircle, Clock, Loader2 } from 'lucide-react';
import api from '../../services/api';
import './Notifications.css';

interface NotificationItem {
  notification_id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  related_id: number | null;
  is_read: boolean;
  created_at: string;
}

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await api.get('/notifications/', { params: { limit: 100 } });
        if (res.data?.data) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching notifications:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(p => p.map(n => n.notification_id === id ? { ...n, is_read: true } : n));
    } catch { /* silent */ }
  };

  const handleNotifClick = (notif: NotificationItem) => {
    if (!notif.is_read) markAsRead(notif.notification_id);

    const role = localStorage.getItem('userRole');

    if (notif.type === 'new_message' && notif.related_id) {
      if (role === 'admin') {
        navigate(`/admin/chat/${notif.related_id}`);
      } else {
        navigate(`/conversations?notify_id=${notif.related_id}`);
      }
    } else if (notif.type === 'new_request' && role === 'admin') {
      if (notif.related_id) {
        if (notif.title.includes('جمعية')) {
          navigate(`/admin/requests/associations/${notif.related_id}`);
        } else if (notif.title.includes('داعية')) {
          navigate(`/admin/requests/preachers/${notif.related_id}`);
        } else {
          navigate('/admin/requests');
        }
      } else {
        navigate('/admin/requests');
      }
    } else if (notif.type === 'status_changed' && role === 'admin') {
      navigate('/admin/requests');
    } else if (notif.type === 'request_update') {
      navigate('/current-requests');
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getIcon = (type: string) => {
    if (type === 'new_message') return <Bell size={20} color="#DBA829" />;
    if (type === 'request_update' || type === 'account_approved') return <CheckCircle size={20} color="#10B981" />;
    return <Clock size={20} color="#475569" />;
  };

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
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem' }}>
            <Loader2 size={32} className="animate-spin" color="#DBA841" />
          </div>
        ) : notifications.length === 0 ? (
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
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '700px', margin: '0 auto' }}>
            {notifications.map(notif => (
              <div
                key={notif.notification_id}
                onClick={() => handleNotifClick(notif)}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '16px',
                  background: notif.is_read ? '#fff' : '#fef9ee',
                  border: `1px solid ${notif.is_read ? '#e5e7eb' : '#f3e6c3'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f3f4f6',
                  flexShrink: 0,
                }}>
                  {getIcon(notif.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.95rem', color: '#111827' }}>{notif.title}</strong>
                    {!notif.is_read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#DBA841', flexShrink: 0 }} />
                    )}
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 6px' }}>{notif.body}</p>
                  <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>{formatTime(notif.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
