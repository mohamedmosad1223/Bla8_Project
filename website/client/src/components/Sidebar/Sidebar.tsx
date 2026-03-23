import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, Activity, User, LogOut, MessageCircle, BookOpen, BarChart2, Bot, ClipboardList } from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole') || 'organization';
  const isAssociation = userRole === 'organization';
  const isPreacher = userRole === 'preacher';
  const isAwqafManager = userRole === 'awqaf_manager';
  const isAdmin = userRole === 'admin';

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    navigate('/');
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
          {/* Common */}
          {userRole !== 'non_muslim' && (
            <li className="nav-item">
              <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                <Home size={20} className="nav-icon" />
                الرئيسية
              </NavLink>
            </li>
          )}

          {/* Association-only */}
          {isAssociation && (
            <>
              <li className="nav-item">
                <NavLink to="/callers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users size={20} className="nav-icon" />
                  دعاة الجمعية
                </NavLink>
              </li>
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
          {/* Admin-only */}
          {isAdmin && (
            <>
              <li className="nav-item">
                <NavLink to="/admin/associations" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users size={20} className="nav-icon" />
                  الجمعيات
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/admin/callers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <Users size={20} className="nav-icon" />
                  دعاة الجمعيات
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
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                  <MessageCircle size={20} className="nav-icon" />
                  الرسائل
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink to="/library" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <BookOpen size={20} className="nav-icon" />
                  المكتبة
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
