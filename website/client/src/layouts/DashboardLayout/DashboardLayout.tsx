import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/Sidebar/Sidebar';
import Header from '../../components/Header/Header';
import './DashboardLayout.css';

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-main-content">
        <Header />
        <main className="dashboard-page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
