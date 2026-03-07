import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationSelection from './pages/RegistrationSelection/RegistrationSelection';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Activation from './pages/Activation/Activation';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetActivation from './pages/ResetActivation/ResetActivation';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import PreacherAssociationLogin from './pages/PreacherAssociationLogin/PreacherAssociationLogin';

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
      </Routes>
    </Router>
  );
}

export default App;
