import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import RegistrationSelection from './pages/RegistrationSelection/RegistrationSelection';
import Login from './pages/Login/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegistrationSelection />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
