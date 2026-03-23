import { NavLink, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { Home, Users, FileText, Activity, User, LogOut, MessageCircle, BookOpen, Building2 } from 'lucide-react';
=======
import { Home, Users, FileText, Activity, User, LogOut, MessageCircle, BookOpen, BarChart2, Bot, ClipboardList } from 'lucide-react';
>>>>>>> 9fcfe69c230e62409e3929bd0123f5e814a4de55
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'admin';
  const isAdmin = userRole === 'admin';
  const isAssociation = userRole === 'organization';
  const isPreacher = userRole === 'preacher';
  const isAwqafManager = userRole === 'awqaf_manager';

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src="/logo.png" alt="Logo" className="logo-img" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        <div className="logo-placeholder">
          <span className="logo-text">البلاغ</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {/* Admin or Association */}
          {(isAdmin || isAssociation) && (
            <>
              <li className="nav-item">
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                  <Home size={20} className="nav-icon" />
                  الرئيسية
                </NavLink>
              </li>
              {isAdmin && (
                <li className="nav-item">
                  <NavLink to="/organizations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                    <Building2 size={20} className="nav-icon" />
                    الجمعيات
                  </NavLink>
                </li>
              )}
              <li className="nav-item">
                <NavLink to="/callers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users size={20} className="nav-icon" />
                  {isAdmin ? 'دعاة الجمعيات' : 'دعاة الجمعية'}
                </NavLink>
              </li>
            </>
          )}


          {/* Association Specific (Non-Admin) */}
          {isAssociation && !isAdmin && (
            <>
              <li className="nav-item">
                <NavLink to="/requests/current" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Activity size={20} className="nav-icon" />
                  طلبات الدعوة الحالية
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/requests/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <FileText size={20} className="nav-icon" />
                  طلبات الدعوة الجديدة
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/conversations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
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
                <NavLink to="/requests/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <FileText size={20} className="nav-icon" />
                  الطلبات الجديدة
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/requests/current" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Activity size={20} className="nav-icon" />
                  الطلبات الحالية
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/conversations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <MessageCircle size={20} className="nav-icon" />
                  المحادثات
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <ClipboardList size={20} className="nav-icon" />
                  التقارير
                </NavLink>
              </li>
            </>
          )}


          {/* Awqaf Manager nav items */}
          {isAwqafManager && (
            <>
              <li className="nav-item">
                <NavLink to="/awqaf/associations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users size={20} className="nav-icon" />
                  الجمعيات
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/awqaf/preacher-performance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Activity size={20} className="nav-icon" />
                  أداء الدعاة
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/awqaf/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <BarChart2 size={20} className="nav-icon" />
                  التقارير و التحليلات
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/ai" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Bot size={20} className="nav-icon" />
                  الذكاء الاصطناعي
                </NavLink>
              </li>
            </>
          )}

          {/* Muslim Caller-only */}
          {userRole === 'muslim_caller' && (
            <li className="nav-item">
              <NavLink to="/submissions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <FileText size={20} className="nav-icon" />
                التقديمات
              </NavLink>
            </li>
          )}

          {/* Non-Muslim only */}
          {userRole === 'non_muslim' && (
            <>
              <li className="nav-item">
                <NavLink to="/guest/chat" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <MessageCircle size={20} className="nav-icon" />
                  المحادثة
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/guest/library" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <BookOpen size={20} className="nav-icon" />
                  المكتبة
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink to="/profile" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <User size={20} className="nav-icon" />
              الملف الشخصي
            </NavLink>
          </li>
          <li className="nav-item">
            <button className="nav-link logout-btn" onClick={handleLogout}>
              <LogOut size={20} className="nav-icon" />
              تسجيل الخروج
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
