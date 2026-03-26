import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import RegistrationSelection from './pages/RegistrationSelection/RegistrationSelection';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Activation from './pages/Activation/Activation';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetActivation from './pages/ResetActivation/ResetActivation';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import PreacherAssociationLogin from './pages/PreacherAssociationLogin/PreacherAssociationLogin';
import LanguageSelection from './pages/LanguageSelection/LanguageSelection';
import HowToStart from './pages/HowToStart/HowToStart';
import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Notifications from './pages/Notifications/Notifications';
import PartnerRegister from './pages/PartnerRegister/PartnerRegister';
import PreacherRegister from './pages/PreacherRegister/PreacherRegister';
import Callers from './pages/Callers/Callers';
import AddCaller from './pages/AddCaller/AddCaller';
import EditPreacher from './pages/EditPreacher/EditPreacher';
import Profile from './pages/Profile/Profile';
import NewRequests from './pages/NewRequests/NewRequests';
import CurrentRequests from './pages/CurrentRequests/CurrentRequests';
import PreacherDashboard from './pages/PreacherDashboard/PreacherDashboard';
import Conversations from './pages/Conversations/Conversations';
import PreacherReports from './pages/PreacherReports/PreacherReports';
import MuslimCallerDashboard from './pages/MuslimCallerDashboard/MuslimCallerDashboard';
import MuslimCallerSubmissions from './pages/MuslimCallerSubmissions/MuslimCallerSubmissions';
import NonMuslimDashboard from './pages/NonMuslimDashboard/NonMuslimDashboard';
import NonMuslimConversation from './pages/NonMuslimConversation/NonMuslimConversation';
import Library from './pages/Library/Library';
import AwqafDashboard from './pages/AwqafDashboard/AwqafDashboard';
import AwqafAssociations from './pages/AwqafAssociations/AwqafAssociations';
import AwqafAssociationDetails from './pages/AwqafAssociationDetails/AwqafAssociationDetails';
import AwqafAssociationReports from './pages/AwqafAssociationReports/AwqafAssociationReports';
import AwqafPreacherDetails from './pages/AwqafPreacherDetails/AwqafPreacherDetails';
import AwqafPreacherPerformance from './pages/AwqafPreacherPerformance/AwqafPreacherPerformance';
import AwqafReportsAnalytics from './pages/AwqafReportsAnalytics/AwqafReportsAnalytics';
import AwqafAICenter from './pages/AwqafAICenter/AwqafAICenter';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminAssociations from './pages/AdminAssociations/AdminAssociations';
import AdminAddAssociation from './pages/AdminAddAssociation/AdminAddAssociation';
import AdminAssociationDetails from './pages/AdminAssociationDetails/AdminAssociationDetails';
import AdminEditAssociation from './pages/AdminEditAssociation/AdminEditAssociation';
import AdminPreacherDetails from './pages/AdminPreacherDetails/AdminPreacherDetails';
import AdminCallers from './pages/AdminCallers/AdminCallers';
import AdminRequests from './pages/AdminRequests/AdminRequests';
import AdminPreacherRequestDetails from './pages/AdminPreacherRequestDetails/AdminPreacherRequestDetails';
import AdminAssociationRequestDetails from './pages/AdminAssociationRequestDetails/AdminAssociationRequestDetails';
import AdminChat from './pages/AdminChat/AdminChat';
import AdminAddSupervisor from './pages/AdminAddSupervisor/AdminAddSupervisor';
import ProtectedRoute from './components/common/ProtectedRoute';
import { authService } from './services/authService';


const RoleDashboard = ({ role }: { role: string | null }) => {
  if (!role) return <Navigate to="/login" replace />;
  
  if (role === 'preacher') return <PreacherDashboard />;
  if (role === 'muslim_caller') return <MuslimCallerDashboard />;
  if (role === 'non_muslim' || role === 'interested') return <NonMuslimDashboard />;
  if (role === 'minister') return <AwqafDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  if (role === 'organization') return <Dashboard />;
  
  return <Navigate to="/login" replace />;
};

const RoleConversations = ({ role }: { role: string | null }) => {
  if (!role) return <Navigate to="/login" replace />;
  
  if (role === 'non_muslim' || role === 'interested') return <NonMuslimConversation />;
  if (role === 'muslim_caller') return <div style={{ padding: '2rem', textAlign: 'center' }}>عذراً، هذه الخاصية غير متاحة لنوع حسابك</div>;
  return <Conversations />;
};


function App() {
  const [role, setRole] = useState<string | null>(localStorage.getItem('userRole'));

  // Global initialization to sync session on load/refresh
  useEffect(() => {
    const handleAuthChange = () => {
      setRole(localStorage.getItem('userRole'));
    };

    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    const syncSession = async () => {
      const currentRole = localStorage.getItem('userRole');
      if (currentRole) {
        try {
          await authService.getMe();
        } catch (err: any) {
          if (err.response?.status === 401) {
            localStorage.removeItem('userRole');
            localStorage.removeItem('userData');
            setRole(null);
          }
        }
      }
    };
    syncSession();

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegistrationSelection />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/activate" element={<Activation />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-activation" element={<ResetActivation />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/preacher-association-login" element={<PreacherAssociationLogin />} />
        <Route path="/partner-register" element={<PartnerRegister />} />
        <Route path="/preacher-register" element={<PreacherRegister />} />
        <Route path="/language-selection" element={<LanguageSelection />} />
        <Route path="/how-to-start" element={<HowToStart />} />

        {/* Standalone Non-Muslim Routes */}
        <Route path="/guest/chat" element={<NonMuslimDashboard />} />
        <Route path="/guest/library" element={<Library />} />

        {/* Dashboard Routes wrapper */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<RoleDashboard role={role} />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />

          {/* Association Routes */}
          <Route path="/callers" element={<ProtectedRoute allowedRoles={['organization']}><Callers /></ProtectedRoute>} />
          <Route path="/callers/add" element={<ProtectedRoute allowedRoles={['organization']}><AddCaller /></ProtectedRoute>} />
          <Route path="/callers/edit/:id" element={<ProtectedRoute allowedRoles={['organization']}><EditPreacher /></ProtectedRoute>} />
          <Route path="/callers/view/:preacherId" element={<ProtectedRoute allowedRoles={['organization', 'admin']}><AdminPreacherDetails /></ProtectedRoute>} />
          <Route path="/requests/new" element={<ProtectedRoute allowedRoles={['organization', 'preacher']}><NewRequests /></ProtectedRoute>} />
          <Route path="/requests/current" element={<ProtectedRoute allowedRoles={['organization', 'preacher']}><CurrentRequests /></ProtectedRoute>} />
          <Route path="/conversations" element={<ProtectedRoute allowedRoles={['organization', 'preacher', 'non_muslim', 'interested']}><RoleConversations role={role} /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute allowedRoles={['preacher']}><PreacherReports /></ProtectedRoute>} />
          <Route path="/submissions" element={<ProtectedRoute allowedRoles={['muslim_caller']}><MuslimCallerSubmissions /></ProtectedRoute>} />

          {/* Awqaf Routes */}
          <Route path="/awqaf-dashboard" element={<ProtectedRoute allowedRoles={['awqaf_manager']}><AwqafDashboard /></ProtectedRoute>} />
          <Route path="/awqaf/associations" element={<ProtectedRoute allowedRoles={['awqaf_manager']}><AwqafAssociations /></ProtectedRoute>} />
          <Route path="/awqaf/associations/:id/details" element={<ProtectedRoute allowedRoles={['awqaf_manager']}><AwqafAssociationDetails /></ProtectedRoute>} />
          <Route path="/awqaf/associations/:id/reports" element={<ProtectedRoute allowedRoles={['awqaf_manager']}><AwqafAssociationReports /></ProtectedRoute>} />
          <Route path="/awqaf/associations/:id/preachers/:preacherId" element={<ProtectedRoute allowedRoles={['awqaf_manager']}><AwqafPreacherDetails /></ProtectedRoute>} />
          <Route path="/awqaf/preacher-performance" element={<ProtectedRoute allowedRoles={['awqaf_manager']}><AwqafPreacherPerformance /></ProtectedRoute>} />
          <Route path="/awqaf/reports" element={<ProtectedRoute allowedRoles={['awqaf_manager']}><AwqafReportsAnalytics /></ProtectedRoute>} />
          <Route path="/ai" element={<ProtectedRoute allowedRoles={['awqaf_manager']}><AwqafAICenter /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/associations" element={<ProtectedRoute allowedRoles={['admin']}><AdminAssociations /></ProtectedRoute>} />
          <Route path="/admin/associations/add" element={<ProtectedRoute allowedRoles={['admin']}><AdminAddAssociation /></ProtectedRoute>} />
          <Route path="/admin/associations/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminAssociationDetails /></ProtectedRoute>} />
          <Route path="/admin/associations/:id/edit" element={<ProtectedRoute allowedRoles={['admin']}><AdminEditAssociation /></ProtectedRoute>} />
          <Route path="/admin/associations/:id/preachers/:preacherId" element={<ProtectedRoute allowedRoles={['admin']}><AdminPreacherDetails /></ProtectedRoute>} />
          <Route path="/admin/callers/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminPreacherDetails /></ProtectedRoute>} />
          <Route path="/admin/callers" element={<ProtectedRoute allowedRoles={['admin']}><AdminCallers /></ProtectedRoute>} />
          <Route path="/admin/requests" element={<ProtectedRoute allowedRoles={['admin']}><AdminRequests /></ProtectedRoute>} />
          <Route path="/admin/requests/preachers/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminPreacherRequestDetails /></ProtectedRoute>} />
          <Route path="/admin/requests/associations/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminAssociationRequestDetails /></ProtectedRoute>} />
          <Route path="/admin/chat/:userId?" element={<ProtectedRoute allowedRoles={['admin']}><AdminChat /></ProtectedRoute>} />
          <Route path="/admin/add-supervisor" element={<ProtectedRoute allowedRoles={['admin']}><AdminAddSupervisor /></ProtectedRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
