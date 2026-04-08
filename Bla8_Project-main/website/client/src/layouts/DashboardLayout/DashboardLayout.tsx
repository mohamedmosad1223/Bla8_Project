import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import { LanguageProvider } from '../../i18n';
import './DashboardLayout.css';

const NON_MUSLIM_ROLES = ['non_muslim', 'interested'];

const DashboardLayout = () => {
  const userRole = localStorage.getItem('userRole') || '';
  const isNonMuslim = NON_MUSLIM_ROLES.includes(userRole);

  const content = (
    <div className={`dashboard-layout nm-layout`}>
      <Sidebar />
      <div className="dashboard-main-content">
        <Header />
        <main className="dashboard-page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );

  return isNonMuslim ? <LanguageProvider>{content}</LanguageProvider> : content;
};

export default DashboardLayout;

