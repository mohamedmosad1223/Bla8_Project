import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationSelection from './pages/RegistrationSelection/RegistrationSelection';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Activation from './pages/Activation/Activation';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetActivation from './pages/ResetActivation/ResetActivation';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import PreacherAssociationLogin from './pages/PreacherAssociationLogin/PreacherAssociationLogin';
import DashboardLayout from './layouts/DashboardLayout/DashboardLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Notifications from './pages/Notifications/Notifications';
import PartnerRegister from './pages/PartnerRegister/PartnerRegister';
import PreacherRegister from './pages/PreacherRegister/PreacherRegister';
import Callers from './pages/Callers/Callers';
import AddCaller from './pages/AddCaller/AddCaller';
import Profile from './pages/Profile/Profile';
import NewRequests from './pages/NewRequests/NewRequests';
import CurrentRequests from './pages/CurrentRequests/CurrentRequests';


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

        {/* Dashboard Routes wrapper */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/callers" element={<Callers />} />
          <Route path="/callers/add" element={<AddCaller />} />
          <Route path="/profile" element={<Profile />} />
          {/* Add other dashboard routes here later, e.g., /requests */}
          <Route path="/requests/new" element={<NewRequests />} />
          <Route path="/requests/current" element={<CurrentRequests />} />

        </Route>
      </Routes>
    </Router>
  );
}

export default App;
