import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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


const RoleDashboard = () => {
  const role = localStorage.getItem('userRole') || 'organization';
  if (role === 'preacher') return <PreacherDashboard />;
  if (role === 'muslim_caller') return <MuslimCallerDashboard />;
  if (role === 'non_muslim') return <NonMuslimDashboard />;
  if (role === 'awqaf_manager') return <AwqafDashboard />;
  if (role === 'admin') return <AdminDashboard />;
  return <Dashboard />;
};

const RoleConversations = () => {
  const role = localStorage.getItem('userRole') || 'organization';
  if (role === 'non_muslim') return <NonMuslimConversation />;
  return <Conversations />;
};


function App() {
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
          <Route path="/dashboard" element={<RoleDashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/callers" element={<Callers />} />
          <Route path="/callers/add" element={<AddCaller />} />
          <Route path="/callers/edit/:id" element={<EditPreacher />} />
          <Route path="/profile" element={<Profile />} />
          {/* Add other dashboard routes here later, e.g., /requests */}
          <Route path="/requests/new" element={<NewRequests />} />
          <Route path="/requests/current" element={<CurrentRequests />} />
          <Route path="/conversations" element={<RoleConversations />} />
          <Route path="/reports" element={<PreacherReports />} />
          <Route path="/submissions" element={<MuslimCallerSubmissions />} />
          <Route path="/library" element={<Library />} />
          <Route path="/awqaf-dashboard" element={<AwqafDashboard />} />
          <Route path="/awqaf/associations" element={<AwqafAssociations />} />
          <Route path="/awqaf/associations/:id/details" element={<AwqafAssociationDetails />} />
          <Route path="/awqaf/associations/:id/reports" element={<AwqafAssociationReports />} />
          <Route path="/awqaf/associations/:id/preachers/:preacherId" element={<AwqafPreacherDetails />} />
          <Route path="/awqaf/preacher-performance" element={<AwqafPreacherPerformance />} />
          <Route path="/awqaf/reports" element={<AwqafReportsAnalytics />} />
          <Route path="/ai" element={<AwqafAICenter />} />
          <Route path="/admin/associations" element={<AdminAssociations />} />
          <Route path="/admin/associations/add" element={<AdminAddAssociation />} />
          <Route path="/admin/associations/:id" element={<AdminAssociationDetails />} />
          <Route path="/admin/associations/:id/edit" element={<AdminEditAssociation />} />
          <Route path="/admin/associations/:id/preachers/:preacherId" element={<AdminPreacherDetails />} />
          <Route path="/admin/callers" element={<AdminCallers />} />
          <Route path="/admin/requests" element={<AdminRequests />} />
          <Route path="/admin/requests/preachers/:id" element={<AdminPreacherRequestDetails />} />
          <Route path="/admin/requests/associations/:id" element={<AdminAssociationRequestDetails />} />
          <Route path="/admin/chat/:userId?" element={<AdminChat />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
