import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Users, 
  FileText, 
  UserPlus, 
  Activity,
  User,
  LogOut
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
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
          <li className="nav-item">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
              <Home size={20} className="nav-icon" />
              الرئيسية
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/callers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Users size={20} className="nav-icon" />
              دعاة الجمعية
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/requests/new" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <FileText size={20} className="nav-icon" />
              طلبات الدعوة الجديدة
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/callers/add" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <UserPlus size={20} className="nav-icon" />
              اضافة داعية
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink to="/requests/current" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Activity size={20} className="nav-icon" />
              طلبات الدعوة الحالية
            </NavLink>
          </li>
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
            <button className="nav-link logout-btn">
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
