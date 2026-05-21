import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import AdminSessionGate from './components/AdminSessionGate';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Exports from './pages/Exports';
import Users from './pages/Users';
import Worlds from './pages/Worlds';
import Metrics from './pages/Metrics';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AdminSessionGate />}>
          <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/worlds" element={<Worlds />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/exports" element={<Exports />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
