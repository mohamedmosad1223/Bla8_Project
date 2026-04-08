import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Activity, User, LogOut, MessageCircle, BookOpen, BarChart2, Bot, ClipboardList, X } from 'lucide-react';
import { authService } from '../../services/authService';
import { useLanguage } from '../../i18n';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const { t, dir } = useLanguage();
  const userRole = localStorage.getItem('userRole');
  const isAssociation = userRole === 'organization';
  const isPreacher = userRole === 'preacher';
  const isAwqafManager = userRole === 'minister';
  const isAdmin = userRole === 'admin';
  const isNonMuslim = userRole === 'non_muslim' || userRole === 'interested';

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  useEffect(() => {
    const handler = () => setMobileMenuOpen(o => !o);
    window.addEventListener('nm-toggle-menu', handler);
    return () => window.removeEventListener('nm-toggle-menu', handler);
  }, []);


  useEffect(() => {
    if (!isAdmin) return;
    const fetchAdminLevel = async () => {
      try {
        const res = await fetch('/api/admins/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setIsSuperAdmin(data?.level === 'super_admin');
        }
      } catch (e) {
        console.error('Could not fetch admin level', e);
      }
    };
    fetchAdminLevel();
  }, [isAdmin]);

  const handleLogout = async () => {
    await authService.logout();
    navigate('/');
  };


  const appName = isNonMuslim ? t('nav.appName') : 'البلاغ';

  const navContent = (
    <>
      <nav className="sidebar-nav">
        <ul className="nav-list">

          {/* Common – all roles except non-Muslim */}
          {!isNonMuslim && (
            <li className="nav-item">
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu} end>
                <Home size={20} className="nav-icon" />
                الرئيسية
              </NavLink>
            </li>
          )}

          {/* Association-only */}
          {isAssociation && (
            <>
              <li className="nav-item">
                <NavLink to="/callers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <Users size={20} className="nav-icon" />
                  دعاة الجمعية
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/requests/current" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <Activity size={20} className="nav-icon" />
                  طلبات الدعوة الحالية
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/requests/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <FileText size={20} className="nav-icon" />
                  طلبات الدعوة الجديدة
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/conversations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <MessageCircle size={20} className="nav-icon" />
                  المحادثات
                </NavLink>
              </li>
            </>
          )}

          {/* Preacher-only */}
          {isPreacher && (
            <>
              <li className="nav-item">
                <NavLink to="/requests/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <FileText size={20} className="nav-icon" />
                  الطلبات الجديدة
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/requests/current" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <Activity size={20} className="nav-icon" />
                  الطلبات الحالية
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/conversations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <MessageCircle size={20} className="nav-icon" />
                  المحادثات
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <ClipboardList size={20} className="nav-icon" />
                  التقارير
                </NavLink>
              </li>
            </>
          )}

          {/* Awqaf Manager */}
          {isAwqafManager && (
            <>
              <li className="nav-item">
                <NavLink to="/awqaf/associations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <Users size={20} className="nav-icon" />
                  الجمعيات
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/awqaf/preacher-performance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <Activity size={20} className="nav-icon" />
                  أداء الدعاة
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/awqaf/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <BarChart2 size={20} className="nav-icon" />
                  التقارير و التحليلات
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/ai" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <Bot size={20} className="nav-icon" />
                  الذكاء الاصطناعي
                </NavLink>
              </li>
            </>
          )}

          {/* Admin-only */}
          {isAdmin && (
            <>
              {isSuperAdmin && (
                <li className="nav-item">
                  <NavLink to="/admin/add-supervisor" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                    <User size={20} className="nav-icon" />
                    إضافة أدمن
                  </NavLink>
                </li>
              )}
              <li className="nav-item">
                <NavLink to="/admin/associations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <Users size={20} className="nav-icon" />
                  الجمعيات
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/callers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <Users size={20} className="nav-icon" />
                  دعاة الجمعيات
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/requests" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <ClipboardList size={20} className="nav-icon" />
                  الطلبات
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <MessageCircle size={20} className="nav-icon" />
                  المحادثة
                </NavLink>
              </li>
            </>
          )}

          {/* Muslim Caller-only */}
          {userRole === 'muslim_caller' && (
            <li className="nav-item">
              <NavLink to="/submissions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                <FileText size={20} className="nav-icon" />
                التقديمات
              </NavLink>
            </li>
          )}

          {/* Non-Muslim – fully translated */}
          {isNonMuslim && (
            <>
              <li className="nav-item">
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu} end>
                  <Bot size={20} className="nav-icon" />
                  {t('nav.conversations')}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/conversations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <MessageCircle size={20} className="nav-icon" />
                  {t('nav.messages')}
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/library" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
                  <BookOpen size={20} className="nav-icon" />
                  {t('nav.library')}
                </NavLink>
              </li>
            </>
          )}

        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeMobileMenu}>
              <User size={20} className="nav-icon" />
              {isNonMuslim ? t('nav.profile') : 'الملف الشخصي'}
            </NavLink>
          </li>
          <li className="nav-item">
            <button className="nav-link logout-btn" onClick={() => { closeMobileMenu(); handleLogout(); }}>
              <LogOut size={20} className="nav-icon" />
              {isNonMuslim ? t('nav.logout') : 'تسجيل الخروج'}
            </button>
          </li>
        </ul>
      </div>
    
    </>
  );

  return (
    <>
      <aside className="sidebar nm-sidebar-desktop" dir={dir}>
        <div className="sidebar-logo">
          <img src="/logo.png" alt="Logo" className="logo-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <div className="logo-placeholder">
            <span className="logo-text">{appName}</span>
          </div>
        </div>
        {navContent}
      </aside>

      {mobileMenuOpen && (
        <div className="nm-mobile-overlay" onClick={closeMobileMenu}>
          <div className="nm-mobile-drawer" dir={dir} onClick={(e) => e.stopPropagation()}>
            <div className="nm-drawer-header">
              <span className="logo-text nm-drawer-logo">{appName}</span>
              <button className="nm-drawer-close" onClick={closeMobileMenu}><X size={22} /></button>
            </div>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
